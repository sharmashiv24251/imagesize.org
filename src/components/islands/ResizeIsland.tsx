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

  const [targetMode, setTargetMode] = useState<TargetMode>(initialPlatform ? 'platform' : 'ratio');
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
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(0.92);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const platformCategories: CategoryFilter[] = ['all', 'social', 'video', 'professional', 'print', 'cinema', 'display-ads'];

  const loadImageSrc = useCallback((src: string, name?: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgWidth(img.naturalWidth);
      setImgHeight(img.naturalHeight);
      setImageSrc(src);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgWidth || !imgHeight) return;
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

    if (fitMode === 'crop') {
      const crop = calculateCrop(imgWidth, imgHeight, target.w, target.h);
      if (target.isPixel) {
        const scale = Math.min(maxPreview / target.w, maxPreview / target.h, 1);
        canvas.width = Math.round(target.w * scale);
        canvas.height = Math.round(target.h * scale);
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
      } else {
        const scale = Math.min(maxPreview / crop.width, maxPreview / crop.height, 1);
        canvas.width = Math.round(crop.width * scale);
        canvas.height = Math.round(crop.height * scale);
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // fit mode
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
      const crop = calculateCrop(imgWidth, imgHeight, target.w, target.h);
      if (target.isPixel) {
        exportCanvas.width = target.w;
        exportCanvas.height = target.h;
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, target.w, target.h);
      } else {
        exportCanvas.width = crop.width;
        exportCanvas.height = crop.height;
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
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

  const handleExport = useCallback(() => {
    const target = getEffectiveTarget();
    const exportCanvas = createExportCanvas(target);
    if (!exportCanvas) return;

    const link = document.createElement('a');
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'image';
    const mime = exportFormat === 'png' ? 'image/png' : `image/${exportFormat}`;
    link.download = `${baseName}-${target.w}x${target.h}.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`;
    link.href = exportCanvas.toDataURL(mime, exportFormat === 'png' ? undefined : quality);
    link.click();
  }, [getEffectiveTarget, createExportCanvas, fileName, exportFormat, quality]);

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
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 flex-wrap">
        {/* Target Mode */}
        <div class="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border-dark/50">
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

        {/* Fit Mode */}
        <div class="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border-dark/50">
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
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 p-3 bg-surface rounded-xl border border-border-dark/50">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat((e.target as HTMLSelectElement).value as ExportFormat)}
            class="px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-sm text-text-primary outline-none"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WebP</option>
          </select>
          {exportFormat !== 'png' && (
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
          <span class="text-xs text-text-muted sm:ml-auto">Cmd/Ctrl+E exports the current result.</span>
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
              class="border-2 border-dashed border-border-dark/50 rounded-xl p-16 text-center hover:border-teal-500/40 hover:bg-surface transition-all duration-200 cursor-pointer"
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
                    class="text-xs px-3 py-1 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 rounded-md transition-colors"
                  >
                    Export {exportFormat.toUpperCase()}
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
                <canvas
                  ref={canvasRef}
                  class="max-w-full max-h-[400px] rounded-sm"
                  style="image-rendering: auto;"
                />
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
