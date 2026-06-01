import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { calculateCrop, calculatePadding, simplify, formatRatio } from '../../lib/ratio';
import { categoryLabels, platformFormats, type PlatformCategory } from '../../lib/platforms';

const pendingImageDbName = 'aspect-ratio-toolkit';
const pendingImageStoreName = 'handoff';
const pendingImageKeyPrefix = 'image-analyzer-to-crop';

function openPendingImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(pendingImageDbName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(pendingImageStoreName)) {
        request.result.createObjectStore(pendingImageStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function takePendingImageFile(handoffId: string): Promise<File | Blob | null> {
  const key = `${pendingImageKeyPrefix}:${handoffId}`;
  try {
    const db = await openPendingImageDb();
    const file = await new Promise<File | Blob | null>((resolve, reject) => {
      const tx = db.transaction(pendingImageStoreName, 'readwrite');
      const store = tx.objectStore(pendingImageStoreName);
      const getRequest = store.get(key);
      getRequest.onsuccess = () => {
        const result = getRequest.result ?? null;
        store.delete(key);
        resolve(result);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
    db.close();
    return file;
  } catch {
    return null;
  }
}

type TargetMode = 'ratio' | 'exact' | 'platform';
type FitMode = 'crop' | 'fit' | 'stretch';
type ExportFormat = 'png' | 'jpeg' | 'webp';
type CategoryFilter = 'all' | PlatformCategory;

interface ResizeIslandProps {
  initialPlatform?: string;
  initialFormat?: string;
  initialWidth?: number;
  initialHeight?: number;
  /** Lock the tool to a single mode and hide the mode selector */
  lockedMode?: TargetMode;
  /** When set, show a KB target input and compress the export to this limit */
  targetKb?: number;
}

const platformPresets = platformFormats.map((format) => ({
  label: `${format.platform} ${format.name}`,
  platform: format.platform,
  name: format.name,
  category: format.category,
  w: format.w,
  h: format.h,
  ratio: format.ratio,
}));

const ratioPresets = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '9:16', w: 9, h: 16 },
  { label: '4:5', w: 4, h: 5 },
  { label: '21:9', w: 21, h: 9 },
  { label: '3:2', w: 3, h: 2 },
  { label: '2:3', w: 2, h: 3 },
];

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      class="text-text-muted hover:text-teal-400 transition-colors"
      title="Copy"
    >
      {copied ? (
        <svg class="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function ResizeIsland({
  initialPlatform,
  initialFormat,
  initialWidth = 1920,
  initialHeight = 1080,
  lockedMode,
  targetKb: initialTargetKb,
}: ResizeIslandProps = {}) {
  const initialPlatformIndex = Math.max(0, platformPresets.findIndex((preset) =>
    preset.platform === initialPlatform &&
    preset.name === initialFormat &&
    preset.w === initialWidth &&
    preset.h === initialHeight
  ));

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [fileName, setFileName] = useState('');

  // lockedMode overrides everything — defaults to 'exact' when dimensions are passed
  const effectiveInitialMode: TargetMode = lockedMode ?? (initialPlatform ? 'platform' : 'ratio');
  const [targetMode, setTargetMode] = useState<TargetMode>(effectiveInitialMode);
  const [fitMode, setFitMode] = useState<FitMode>('crop');

  const [ratioW, setRatioW] = useState(16);
  const [ratioH, setRatioH] = useState(9);
  const [exactW, setExactW] = useState(initialWidth);
  const [exactH, setExactH] = useState(initialHeight);
  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatformIndex);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([initialPlatformIndex]);
  const [platformQuery, setPlatformQuery] = useState(initialPlatform ? `${initialPlatform} ${initialFormat || ''}` : '');
  const [platformCategory, setPlatformCategory] = useState<CategoryFilter>('all');

  const [fitFill, setFitFill] = useState<'blur' | 'color'>('blur');
  const [fitColor, setFitColor] = useState('#000000');
  const [exportFormat, setExportFormat] = useState<ExportFormat>(initialTargetKb ? 'jpeg' : 'png');
  const [quality, setQuality] = useState(0.92);
  const [targetKbInput, setTargetKbInput] = useState(initialTargetKb ?? 0);
  const [isCompressing, setIsCompressing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropPreviewRef = useRef<HTMLDivElement>(null);
  const platformCategories: CategoryFilter[] = ['all', 'social', 'video', 'professional', 'print', 'cinema', 'display-ads'];

  // Crop drag state — offset in *source image* pixels (top-left of crop box)
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startCropX: number; startCropY: number } | null>(null);

  const loadImageSrc = useCallback((src: string, name?: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgWidth(img.naturalWidth);
      setImgHeight(img.naturalHeight);
      setImageSrc(src);
      // Reset crop offset to center whenever a new image is loaded
      setCropX(0);
      setCropY(0);
      if (name) setFileName(name);
    };
    img.src = src;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tw = params.get('tw');
    const th = params.get('th');
    const handoffId = params.get('handoff') || '';
    const platform = params.get('platform');
    const format = params.get('format');

    if (tw && th) {
      const pw = parseInt(tw, 10);
      const ph = parseInt(th, 10);
      if (pw <= 100 && ph <= 100) {
        const [sw, sh] = simplify(pw, ph);
        setRatioW(sw);
        setRatioH(sh);
        setTargetMode('ratio');
      } else {
        setExactW(pw);
        setExactH(ph);
        setTargetMode('exact');
      }
    }

    if (platform && format) {
      const idx = platformPresets.findIndex(
        (p) => p.platform === platform && p.name === format
      );
      if (idx !== -1) {
        setSelectedPlatform(idx);
        setSelectedPlatforms([idx]);
        setTargetMode('platform');
        setPlatformQuery(`${platform} ${format}`);
      }
    }

    if (!handoffId) return;

    let objectUrl: string | null = null;
    takePendingImageFile(handoffId).then((file) => {
      if (file) {
        objectUrl = URL.createObjectURL(file);
        const name = (file as File).name;
        loadImageSrc(objectUrl, name);
        sessionStorage.removeItem(`aspect-ratio-pending-image-meta:${handoffId}`);
        return;
      }
      const pendingImage = sessionStorage.getItem(`aspect-ratio-pending-image:${handoffId}`);
      if (!pendingImage) return;
      try {
        const parsed = JSON.parse(pendingImage) as { src?: string; fileName?: string };
        if (parsed.src) {
          loadImageSrc(parsed.src, parsed.fileName);
          sessionStorage.removeItem(`aspect-ratio-pending-image:${handoffId}`);
        }
      } catch {
        sessionStorage.removeItem(`aspect-ratio-pending-image:${handoffId}`);
      }
    });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loadImageSrc]);

  const handleTargetModeChange = (m: TargetMode) => {
    setTargetMode(m);
    if (m === 'ratio' && fitMode === 'stretch') setFitMode('crop');
  };

  const getEffectiveTarget = useCallback((): { w: number; h: number; isPixel: boolean } => {
    if (targetMode === 'platform') {
      const p = platformPresets[selectedPlatform];
      return { w: p.w, h: p.h, isPixel: true };
    }
    if (targetMode === 'exact') {
      return { w: exactW, h: exactH, isPixel: true };
    }
    return { w: ratioW, h: ratioH, isPixel: false };
  }, [targetMode, ratioW, ratioH, exactW, exactH, selectedPlatform]);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setImgWidth(img.naturalWidth);
        setImgHeight(img.naturalHeight);
        setImageSrc(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) loadImage(file);
  }, [loadImage]);

  // ── Crop box helpers ───────────────────────────────────────────────────────
  // Returns the crop rect in source-image pixel space, clamped to image bounds.
  const getCropRect = useCallback((): { x: number; y: number; w: number; h: number } | null => {
    if (!imgWidth || !imgHeight) return null;
    const target = getEffectiveTarget();
    const targetAR = target.w / target.h;
    const imgAR = imgWidth / imgHeight;

    let cropW: number, cropH: number;
    if (imgAR > targetAR) {
      // image wider than target → constrain by height
      cropH = imgHeight;
      cropW = Math.round(cropH * targetAR);
    } else {
      cropW = imgWidth;
      cropH = Math.round(cropW / targetAR);
    }

    // Center default, then apply drag offset (cropX/Y are offsets from center position)
    const centerX = Math.round((imgWidth - cropW) / 2);
    const centerY = Math.round((imgHeight - cropH) / 2);
    const x = Math.max(0, Math.min(centerX + cropX, imgWidth - cropW));
    const y = Math.max(0, Math.min(centerY + cropY, imgHeight - cropH));
    return { x, y, w: cropW, h: cropH };
  }, [imgWidth, imgHeight, getEffectiveTarget, cropX, cropY]);

  // Mouse/touch drag handlers for the crop overlay box
  const handleCropDragStart = useCallback((clientX: number, clientY: number) => {
    dragRef.current = { startMouseX: clientX, startMouseY: clientY, startCropX: cropX, startCropY: cropY };
  }, [cropX, cropY]);

  const handleCropDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current || !cropPreviewRef.current || !imgWidth || !imgHeight) return;
    const el = cropPreviewRef.current;
    const rect = el.getBoundingClientRect();
    // Scale: displayed size → source image pixels
    const scaleX = imgWidth / rect.width;
    const scaleY = imgHeight / rect.height;
    const dx = (clientX - dragRef.current.startMouseX) * scaleX;
    const dy = (clientY - dragRef.current.startMouseY) * scaleY;
    setCropX(Math.round(dragRef.current.startCropX + dx));
    setCropY(Math.round(dragRef.current.startCropY + dy));
  }, [imgWidth, imgHeight]);

  const handleCropDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const drawBlurredBg = useCallback((
    ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number
  ) => {
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (ir > cr) { sw = img.naturalHeight * cr; sx = (img.naturalWidth - sw) / 2; }
    else { sh = img.naturalWidth / cr; sy = (img.naturalHeight - sh) / 2; }
    const tiny = document.createElement('canvas');
    tiny.width = 48;
    tiny.height = 48;
    const tinyCtx = tiny.getContext('2d');
    if (!tinyCtx) return;

    tinyCtx.imageSmoothingEnabled = true;
    tinyCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tiny.width, tiny.height);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    for (const offset of [-18, -9, 0, 9, 18]) {
      ctx.globalAlpha = 0.18;
      ctx.drawImage(tiny, -24 + offset, -24, cw + 48, ch + 48);
      ctx.drawImage(tiny, -24, -24 + offset, cw + 48, ch + 48);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }, []);

  const getOutputDimensions = useCallback((): { w: number; h: number } | null => {
    if (!imgWidth || !imgHeight) return null;
    const target = getEffectiveTarget();
    if (fitMode === 'stretch') return { w: target.w, h: target.h };
    if (fitMode === 'crop') {
      if (target.isPixel) return { w: target.w, h: target.h };
      const crop = calculateCrop(imgWidth, imgHeight, target.w, target.h);
      return { w: crop.width, h: crop.height };
    }
    // fit
    if (target.isPixel) return { w: target.w, h: target.h };
    const pad = calculatePadding(imgWidth, imgHeight, target.w, target.h);
    return { w: pad.totalW, h: pad.totalH };
  }, [imgWidth, imgHeight, getEffectiveTarget, fitMode]);

  // Reset crop offset when target dimensions or fitMode change
  useEffect(() => {
    setCropX(0);
    setCropY(0);
  }, [exactW, exactH, ratioW, ratioH, selectedPlatform, fitMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgWidth || !imgHeight) return;
    if (fitMode === 'crop') return; // crop mode renders via overlay, not canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const target = getEffectiveTarget();
    const maxPreview = 500;

    if (fitMode === 'stretch') {
      const scale = Math.min(maxPreview / target.w, maxPreview / target.h, 1);
      canvas.width = Math.round(target.w * scale);
      canvas.height = Math.round(target.h * scale);
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, canvas.width, canvas.height);
      return;
    }

    // fit mode (crop is handled by overlay)
    if (target.isPixel) {
      const scale = Math.min(maxPreview / target.w, maxPreview / target.h, 1);
      canvas.width = Math.round(target.w * scale);
      canvas.height = Math.round(target.h * scale);
      if (fitFill === 'blur') {
        drawBlurredBg(ctx, img, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = fitColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const imgScale = Math.min(target.w / imgWidth, target.h / imgHeight) * scale;
      const scaledW = Math.round(imgWidth * imgScale);
      const scaledH = Math.round(imgHeight * imgScale);
      const offsetX = Math.round((canvas.width - scaledW) / 2);
      const offsetY = Math.round((canvas.height - scaledH) / 2);
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, offsetX, offsetY, scaledW, scaledH);
    } else {
      const pad = calculatePadding(imgWidth, imgHeight, target.w, target.h);
      const scale = Math.min(maxPreview / pad.totalW, maxPreview / pad.totalH, 1);
      canvas.width = Math.round(pad.totalW * scale);
      canvas.height = Math.round(pad.totalH * scale);
      if (fitFill === 'blur') {
        drawBlurredBg(ctx, img, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = fitColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight,
        Math.round(pad.left * scale), Math.round(pad.top * scale),
        Math.round(imgWidth * scale), Math.round(imgHeight * scale));
    }
  }, [imageSrc, imgWidth, imgHeight, getEffectiveTarget, fitMode, fitFill, fitColor, drawBlurredBg]);

  const createExportCanvas = useCallback((target: { w: number; h: number; isPixel: boolean }) => {
    const img = imgRef.current;
    if (!img) return null;
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    if (fitMode === 'stretch') {
      exportCanvas.width = target.w;
      exportCanvas.height = target.h;
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, target.w, target.h);
    } else if (fitMode === 'crop') {
      const rect = getCropRect();
      if (rect) {
        if (target.isPixel) {
          exportCanvas.width = target.w;
          exportCanvas.height = target.h;
          ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, target.w, target.h);
        } else {
          exportCanvas.width = rect.w;
          exportCanvas.height = rect.h;
          ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
        }
      }
    } else {
      // fit
      if (target.isPixel) {
        exportCanvas.width = target.w;
        exportCanvas.height = target.h;
        if (fitFill === 'blur') {
          drawBlurredBg(ctx, img, target.w, target.h);
        } else {
          ctx.fillStyle = fitColor;
          ctx.fillRect(0, 0, target.w, target.h);
        }
        const imgScale = Math.min(target.w / imgWidth, target.h / imgHeight);
        const scaledW = Math.round(imgWidth * imgScale);
        const scaledH = Math.round(imgHeight * imgScale);
        const offsetX = Math.round((target.w - scaledW) / 2);
        const offsetY = Math.round((target.h - scaledH) / 2);
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight, offsetX, offsetY, scaledW, scaledH);
      } else {
        const pad = calculatePadding(imgWidth, imgHeight, target.w, target.h);
        exportCanvas.width = pad.totalW;
        exportCanvas.height = pad.totalH;
        if (fitFill === 'blur') {
          drawBlurredBg(ctx, img, pad.totalW, pad.totalH);
        } else {
          ctx.fillStyle = fitColor;
          ctx.fillRect(0, 0, pad.totalW, pad.totalH);
        }
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight, pad.left, pad.top, imgWidth, imgHeight);
      }
    }

    return exportCanvas;
  }, [imgWidth, imgHeight, fitMode, fitFill, fitColor, drawBlurredBg]);

  const handleExport = useCallback(async () => {
    const target = getEffectiveTarget();
    const exportCanvas = createExportCanvas(target);
    if (!exportCanvas) return;

    const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'image';
    const mime = exportFormat === 'png' ? 'image/png' : `image/${exportFormat}`;
    const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;

    // If targetKb compression is requested, binary-search quality to hit the limit
    if (targetKbInput > 0 && exportFormat !== 'png') {
      setIsCompressing(true);
      const targetBytes = targetKbInput * 1024;
      let bestBlob: Blob | null = null;
      let low = 0.08, high = 0.95;
      for (let i = 0; i < 8; i++) {
        const q = (low + high) / 2;
        const blob = await new Promise<Blob | null>((res) => exportCanvas.toBlob(res, mime, q));
        if (!blob) break;
        if (blob.size <= targetBytes) { bestBlob = blob; low = q; }
        else { high = q; if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob; }
      }
      setIsCompressing(false);
      if (bestBlob) {
        const link = document.createElement('a');
        link.download = `${baseName}-${target.w}x${target.h}.${ext}`;
        link.href = URL.createObjectURL(bestBlob);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
        return;
      }
    }

    const link = document.createElement('a');
    link.download = `${baseName}-${target.w}x${target.h}.${ext}`;
    link.href = exportCanvas.toDataURL(mime, exportFormat === 'png' ? undefined : quality);
    link.click();
  }, [getEffectiveTarget, createExportCanvas, fileName, exportFormat, quality, targetKbInput]);

  const handleBatchExport = useCallback(async () => {
    if (targetMode !== 'platform' || selectedPlatforms.length === 0) return;
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const mime = exportFormat === 'png' ? 'image/png' : `image/${exportFormat}`;
    const extension = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'image';

    await Promise.all(selectedPlatforms.map(async (index) => {
      const preset = platformPresets[index];
      if (!preset) return;
      const canvas = createExportCanvas({ w: preset.w, h: preset.h, isPixel: true });
      if (!canvas) return;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, exportFormat === 'png' ? undefined : quality));
      if (!blob) return;
      const safeName = `${baseName}-${preset.platform}-${preset.name}-${preset.w}x${preset.h}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      zip.file(`${safeName}.${extension}`, blob);
    }));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = `${baseName}-platform-exports.zip`;
    link.href = URL.createObjectURL(zipBlob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [targetMode, selectedPlatforms, createExportCanvas, exportFormat, quality, fileName]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        if (targetMode === 'platform' && selectedPlatforms.length > 1) {
          handleBatchExport();
        } else {
          handleExport();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [targetMode, selectedPlatforms, handleBatchExport, handleExport]);

  const outputDims = getOutputDimensions();
  const target = getEffectiveTarget();
  const srcRatio = imgWidth > 0 ? formatRatio(imgWidth, imgHeight) : '—';
  const filteredPlatformPresets = platformPresets
    .map((preset, index) => ({ ...preset, index }))
    .filter((preset) => {
      const matchesCategory = platformCategory === 'all' || preset.category === platformCategory;
      const q = platformQuery.trim().toLowerCase();
      const matchesQuery = !q || [preset.platform, preset.label, preset.ratio, `${preset.w}`, `${preset.h}`].some((value) =>
        value.toLowerCase().includes(q)
      );
      return matchesCategory && matchesQuery;
    });

  const getRecommendation = (): string => {
    if (!imgWidth) return '';
    const srcR = imgWidth / imgHeight;
    const tgtR = target.w / target.h;
    const diff = Math.abs((srcR - tgtR) / tgtR) * 100;
    if (diff < 0.5) return 'Same ratio — simple scale, no quality loss.';
    if (diff < 5) return 'Very close ratio — minimal crop or fit recommended.';
    if (srcR > tgtR) return 'Source is wider — crop sides or fit with top/bottom padding.';
    return 'Source is taller — crop top/bottom or fit with side padding.';
  };

  return (
    <div class="w-full max-w-5xl mx-auto">
      {/* Controls */}
      <div class="flex flex-wrap items-start gap-3 mb-4">
        {/* Target Mode — hidden when lockedMode is set */}
        {!lockedMode && (
          <div class="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border-dark/50 shrink-0">
            {(['ratio', 'exact', 'platform'] as TargetMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleTargetModeChange(m)}
                class={`px-3 py-1.5 text-sm rounded-md transition-all duration-150 ${
                  targetMode === m
                    ? 'bg-teal-500/15 text-teal-400 font-medium'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {m === 'exact' ? 'Exact' : m === 'ratio' ? 'Ratio' : 'Platform'}
              </button>
            ))}
          </div>
        )}

        {/* Fit Mode */}
        <div class="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border-dark/50 shrink-0">
          {(['crop', 'fit', 'stretch'] as FitMode[])
            .filter((f) => !(targetMode === 'ratio' && f === 'stretch'))
            .map((f) => (
              <button
                key={f}
                onClick={() => setFitMode(f)}
                class={`px-3 py-1.5 text-sm rounded-md transition-all duration-150 capitalize ${
                  fitMode === f
                    ? 'bg-teal-500/15 text-teal-400 font-medium'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {f}
              </button>
            ))}
        </div>

        {/* Fill options for fit mode */}
        {fitMode === 'fit' && (
          <div class="flex items-center gap-2">
            <span class="text-xs text-text-muted">Fill:</span>
            <div class="flex items-center gap-0.5 p-0.5 bg-surface rounded-md border border-border-dark/50">
              <button
                onClick={() => setFitFill('blur')}
                class={`px-2 py-1 text-[11px] rounded transition-all ${
                  fitFill === 'blur'
                    ? 'bg-teal-500/15 text-teal-400 font-medium'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Blur
              </button>
              <button
                onClick={() => setFitFill('color')}
                class={`px-2 py-1 text-[11px] rounded transition-all ${
                  fitFill === 'color'
                    ? 'bg-teal-500/15 text-teal-400 font-medium'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Color
              </button>
            </div>
            {fitFill === 'color' && (
              <label class="flex items-center gap-2 px-2 py-1 bg-surface border border-border-dark/70 rounded-md cursor-pointer">
                <span class="w-5 h-5 rounded border border-text-muted/30" style={{ backgroundColor: fitColor }} />
                <span class="text-[11px] font-mono text-text-muted">{fitColor}</span>
                <input
                  type="color"
                  value={fitColor}
                  onInput={(e) => setFitColor((e.target as HTMLInputElement).value)}
                  class="sr-only"
                />
              </label>
            )}
          </div>
        )}
      </div>

      {imageSrc && (
        <div class="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3 mb-6 p-3 bg-surface rounded-xl border border-border-dark/50">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat((e.target as HTMLSelectElement).value as ExportFormat)}
            class="px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-sm text-text-primary outline-none"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WebP</option>
          </select>
          {exportFormat !== 'png' && !targetKbInput && (
            <label class="flex items-center gap-2 text-xs text-text-muted">
              Quality
              <input
                type="range"
                min="0.4"
                max="1"
                step="0.01"
                value={quality}
                onInput={(e) => setQuality(parseFloat((e.target as HTMLInputElement).value))}
                class="w-28 accent-teal-500"
              />
              <span class="font-mono text-text-primary w-8">{Math.round(quality * 100)}</span>
            </label>
          )}
          {/* KB target input — always shown when initialTargetKb is set, optionally shown otherwise */}
          {exportFormat !== 'png' && (
            <label class="flex items-center gap-2 text-xs text-text-muted">
              <span class="whitespace-nowrap">Max size</span>
              <input
                type="number"
                min="0"
                placeholder="KB limit"
                value={targetKbInput || ''}
                onInput={(e) => setTargetKbInput(Math.max(0, parseInt((e.target as HTMLInputElement).value, 10) || 0))}
                class="w-20 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
              />
              <span class="text-text-muted">KB</span>
              {targetKbInput > 0 && (
                <span class="text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">auto-compress</span>
              )}
            </label>
          )}
          <span class="text-xs text-text-muted sm:ml-auto">Cmd/Ctrl+E to export.</span>
        </div>
      )}

      {/* Target-specific controls */}
      <div class="mb-6">
        {targetMode === 'ratio' && (
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs text-text-muted">Target:</span>
              <input
                type="number"
                value={ratioW}
                min="1"
                onInput={(e) => setRatioW(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
                class="w-16 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
              />
              <span class="text-text-muted font-mono">:</span>
              <input
                type="number"
                value={ratioH}
                min="1"
                onInput={(e) => setRatioH(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
                class="w-16 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
              />
            </div>
            <div class="flex flex-wrap gap-2">
              {ratioPresets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setRatioW(p.w); setRatioH(p.h); }}
                  class={`px-3 py-1 text-xs font-mono rounded-full border transition-all duration-150 ${
                    ratioW === p.w && ratioH === p.h
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-400'
                      : 'border-border-dark/50 text-text-muted hover:border-teal-500/30 hover:text-text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {targetMode === 'exact' && (
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-xs text-text-muted">Target:</span>
            <input
              type="number"
              value={exactW}
              min="1"
              onInput={(e) => setExactW(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
              class="w-20 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
            />
            <span class="text-text-muted font-mono">×</span>
            <input
              type="number"
              value={exactH}
              min="1"
              onInput={(e) => setExactH(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
              class="w-20 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
            />
            <span class="text-xs text-text-muted">px</span>
          </div>
        )}

        {targetMode === 'platform' && (
          <div class="space-y-3">
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                value={platformQuery}
                onInput={(e) => setPlatformQuery((e.target as HTMLInputElement).value)}
                placeholder="Search all platform, print, cinema, ad, and screen presets..."
                class="flex-1 px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-sm text-text-primary placeholder:text-text-muted/60 focus:border-teal-500 outline-none"
              />
              <select
                value={platformCategory}
                onChange={(e) => setPlatformCategory((e.target as HTMLSelectElement).value as CategoryFilter)}
                class="px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-sm text-text-primary focus:border-teal-500 outline-none"
              >
                {platformCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'all' ? 'All categories' : categoryLabels[cat as PlatformCategory]}</option>
                ))}
              </select>
            </div>
            <div class="max-h-56 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredPlatformPresets.map((p) => {
                const checked = selectedPlatforms.includes(p.index);
                return (
                  <label
                    key={`${p.label}-${p.index}`}
                    class={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all duration-150 cursor-pointer ${
                      selectedPlatform === p.index
                        ? 'bg-teal-500/10 border-teal-500/40 text-text-primary'
                        : 'border-border-dark/50 text-text-muted hover:border-teal-500/30 hover:text-text-primary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const isChecked = (e.target as HTMLInputElement).checked;
                        setSelectedPlatforms((current) => {
                          const next = isChecked
                            ? [...new Set([...current, p.index])]
                            : current.filter((index) => index !== p.index);
                          return next.length ? next : [p.index];
                        });
                        setSelectedPlatform(p.index);
                      }}
                      class="accent-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlatform(p.index);
                        setSelectedPlatforms((current) => current.includes(p.index) ? current : [...current, p.index]);
                      }}
                      class="min-w-0 flex-1 text-left"
                    >
                      <span class="block truncate">{p.label}</span>
                      <span class="font-mono text-[11px] text-text-muted/70">{p.w}×{p.h} · {p.ratio}</span>
                    </button>
                  </label>
                );
              })}
            </div>
            <p class="text-xs text-text-muted">{selectedPlatforms.length} selected for ZIP export. Click a row label to preview that size.</p>
          </div>
        )}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div class="lg:col-span-2">
          {!imageSrc ? (
            <div
              class="border-2 border-dashed border-border-dark/50 rounded-xl p-8 sm:p-16 text-center hover:border-teal-500/40 hover:bg-surface transition-all duration-200 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                class="hidden"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) loadImage(file);
                }}
              />
              <div class="flex flex-col items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center">
                  <svg class="w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <div>
                  <p class="text-text-primary font-medium mb-1">Drop an image to start</p>
                  <p class="text-sm text-text-muted">Or click to browse • 100% client-side</p>
                </div>
              </div>
            </div>
          ) : (
            <div class="bg-surface rounded-xl border border-border-dark/50 overflow-hidden">
              <div class="p-3 bg-surface-2/50 border-b border-border-dark/30 flex items-center justify-between">
                <span class="text-xs text-text-muted capitalize">
                  {fitMode} Preview
                  {targetMode === 'platform' && (
                    <span class="ml-1 text-text-muted/60">· {platformPresets[selectedPlatform].label}</span>
                  )}
                  <span class="ml-2 font-mono text-teal-400">
                    {targetMode === 'ratio' ? `${ratioW}:${ratioH}` : `${target.w}×${target.h}`}
                  </span>
                </span>
                <div class="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    disabled={isCompressing}
                    class="text-xs px-3 py-1 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 disabled:opacity-60 rounded-md transition-colors"
                  >
                    {isCompressing ? 'Compressing…' : (targetKbInput > 0 ? `Export & Compress to ${targetKbInput} KB` : `Export ${exportFormat.toUpperCase()}`)}
                  </button>
                  {targetMode === 'platform' && selectedPlatforms.length > 1 && (
                    <button
                      onClick={handleBatchExport}
                      class="text-xs px-3 py-1 bg-surface-2 text-text-primary hover:text-teal-400 rounded-md transition-colors"
                    >
                      Export ZIP
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setImageSrc(null);
                      imgRef.current = null;
                      setImgWidth(0);
                      setImgHeight(0);
                      setFileName('');
                    }}
                    class="text-xs text-text-muted hover:text-danger transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div class="p-4 flex items-center justify-center bg-[#0a0a0a] min-h-[300px]">
                {fitMode === 'crop' && imageSrc && getCropRect() ? (() => {
                  const rect = getCropRect()!;
                  // Compute crop box position as % of source image
                  const boxLeft   = (rect.x / imgWidth)  * 100;
                  const boxTop    = (rect.y / imgHeight) * 100;
                  const boxWidth  = (rect.w / imgWidth)  * 100;
                  const boxHeight = (rect.h / imgHeight) * 100;

                  return (
                    <div
                      ref={cropPreviewRef}
                      class="relative select-none"
                      style={{ maxWidth: '100%', maxHeight: '400px', cursor: 'crosshair', touchAction: 'none' }}
                      onMouseMove={(e) => handleCropDragMove(e.clientX, e.clientY)}
                      onMouseUp={handleCropDragEnd}
                      onMouseLeave={handleCropDragEnd}
                      onTouchMove={(e) => { e.preventDefault(); handleCropDragMove(e.touches[0].clientX, e.touches[0].clientY); }}
                      onTouchEnd={handleCropDragEnd}
                    >
                      {/* Source image */}
                      <img
                        src={imageSrc}
                        alt="source"
                        class="block max-w-full max-h-[400px] rounded-sm"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                        draggable={false}
                      />
                      {/* Dark overlay outside crop box */}
                      <div class="absolute inset-0 rounded-sm" style={{ pointerEvents: 'none' }}>
                        {/* top */}
                        <div class="absolute bg-black/55" style={{ top: 0, left: 0, right: 0, height: `${boxTop}%` }} />
                        {/* bottom */}
                        <div class="absolute bg-black/55" style={{ top: `${boxTop + boxHeight}%`, left: 0, right: 0, bottom: 0 }} />
                        {/* left */}
                        <div class="absolute bg-black/55" style={{ top: `${boxTop}%`, left: 0, width: `${boxLeft}%`, height: `${boxHeight}%` }} />
                        {/* right */}
                        <div class="absolute bg-black/55" style={{ top: `${boxTop}%`, left: `${boxLeft + boxWidth}%`, right: 0, height: `${boxHeight}%` }} />
                      </div>
                      {/* Crop selection box — drag handle */}
                      <div
                        class="absolute border-2 border-teal-400 rounded-sm"
                        style={{
                          left: `${boxLeft}%`,
                          top: `${boxTop}%`,
                          width: `${boxWidth}%`,
                          height: `${boxHeight}%`,
                          cursor: 'move',
                          boxShadow: '0 0 0 1px rgba(45,212,191,0.3)',
                        }}
                        onMouseDown={(e) => { e.stopPropagation(); handleCropDragStart(e.clientX, e.clientY); }}
                        onTouchStart={(e) => { e.stopPropagation(); handleCropDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
                      >
                        {/* Corner handles */}
                        {[['0%','0%'],['100%','0%'],['0%','100%'],['100%','100%']].map(([l, t]) => (
                          <div key={`${l}${t}`} class="absolute w-2.5 h-2.5 bg-teal-400 rounded-sm"
                            style={{ left: l, top: t, transform: 'translate(-50%,-50%)' }} />
                        ))}
                        {/* Centre label */}
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span class="text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded select-none">
                            drag to reposition
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <canvas
                    ref={canvasRef}
                    class="max-w-full max-h-[400px] rounded-sm"
                    style="image-rendering: auto;"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div class="space-y-4">
          {imageSrc && imgWidth > 0 ? (
            <>
              <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
                <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">Source</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-text-muted">Size</span>
                    <div class="flex items-center gap-2">
                      <span class="font-mono tabular-nums text-text-primary">{imgWidth} × {imgHeight}</span>
                      <CopyBtn value={`${imgWidth}x${imgHeight}`} />
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-muted">Ratio</span>
                    <span class="font-mono tabular-nums text-text-primary">{srcRatio}</span>
                  </div>
                </div>
              </div>

              {outputDims && (
                <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
                  <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">Output</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-text-muted">Size</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono tabular-nums text-text-primary">{outputDims.w} × {outputDims.h}</span>
                        <CopyBtn value={`${outputDims.w}x${outputDims.h}`} />
                      </div>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-text-muted">Ratio</span>
                      <span class="font-mono tabular-nums text-text-primary">{formatRatio(outputDims.w, outputDims.h)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-text-muted">Mode</span>
                      <span class="font-mono tabular-nums text-xs text-teal-400 capitalize">{fitMode}</span>
                    </div>
                  </div>
                </div>
              )}

              <div class="p-4 bg-teal-500/5 rounded-xl border border-teal-500/20">
                <h3 class="text-xs text-teal-400 uppercase tracking-wider mb-2">Tip</h3>
                <p class="text-xs text-text-muted leading-relaxed">{getRecommendation()}</p>
              </div>
            </>
          ) : (
            <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
              <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">How it works</h3>
              <ol class="space-y-2 text-sm text-text-muted">
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">1</span>
                  <span>Upload an image</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">2</span>
                  <span>Choose target: ratio, exact size, or platform preset</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">3</span>
                  <span>Pick fit mode: crop, fit, or stretch</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">4</span>
                  <span>Export at full resolution</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
