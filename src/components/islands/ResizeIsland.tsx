import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { calculateCrop, calculatePadding, simplify, formatRatio } from '../../lib/ratio';

type TargetMode = 'ratio' | 'exact' | 'platform';
type FitMode = 'crop' | 'fit' | 'stretch';

const platformPresets = [
  { label: 'YouTube Thumbnail', platform: 'YouTube', w: 1280, h: 720 },
  { label: 'Instagram Square', platform: 'Instagram', w: 1080, h: 1080 },
  { label: 'Instagram Story', platform: 'Instagram', w: 1080, h: 1920 },
  { label: 'Instagram Portrait', platform: 'Instagram', w: 1080, h: 1350 },
  { label: 'Facebook Post', platform: 'Facebook', w: 1200, h: 630 },
  { label: 'X/Twitter Post', platform: 'X', w: 1200, h: 675 },
  { label: 'LinkedIn Post', platform: 'LinkedIn', w: 1200, h: 627 },
  { label: 'Pinterest Pin', platform: 'Pinterest', w: 1000, h: 1500 },
  { label: 'TikTok Video', platform: 'TikTok', w: 1080, h: 1920 },
  { label: 'YouTube Shorts', platform: 'YouTube', w: 1080, h: 1920 },
];

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

export default function ResizeIsland() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [fileName, setFileName] = useState('');

  const [targetMode, setTargetMode] = useState<TargetMode>('ratio');
  const [fitMode, setFitMode] = useState<FitMode>('crop');

  const [ratioW, setRatioW] = useState(16);
  const [ratioH, setRatioH] = useState(9);
  const [exactW, setExactW] = useState(1920);
  const [exactH, setExactH] = useState(1080);
  const [selectedPlatform, setSelectedPlatform] = useState(0);

  const [fitFill, setFitFill] = useState<'blur' | 'color'>('blur');
  const [fitColor, setFitColor] = useState('#000000');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tw = params.get('tw');
    const th = params.get('th');
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
  }, []);

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
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.35)';
    ctx.drawImage(img, sx, sy, sw, sh, -20, -20, cw + 40, ch + 40);
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

  const handleExport = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const target = getEffectiveTarget();
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

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

    const link = document.createElement('a');
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'image';
    link.download = `${baseName}-${target.w}x${target.h}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [imgWidth, imgHeight, getEffectiveTarget, fitMode, fitFill, fitColor, fileName, drawBlurredBg]);

  const outputDims = getOutputDimensions();
  const target = getEffectiveTarget();
  const srcRatio = imgWidth > 0 ? formatRatio(imgWidth, imgHeight) : '—';

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
              <input
                type="color"
                value={fitColor}
                onInput={(e) => setFitColor((e.target as HTMLInputElement).value)}
                class="w-7 h-7 rounded border border-border-dark cursor-pointer"
              />
            )}
          </div>
        )}
      </div>

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
          <div class="flex flex-wrap gap-2">
            {platformPresets.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setSelectedPlatform(i)}
                class={`px-3 py-1.5 text-xs rounded-full border transition-all duration-150 ${
                  selectedPlatform === i
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-400'
                    : 'border-border-dark/50 text-text-muted hover:border-teal-500/30 hover:text-text-primary'
                }`}
              >
                {p.label}
              </button>
            ))}
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
                    Export PNG
                  </button>
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
