import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { simplify, formatRatio, scaleDimensions, calculateCrop, calculatePadding, nearestCommonRatios } from '../../lib/ratio';

type ResizeMode = 'exact' | 'ratio-lock' | 'platform';
type FitMode = 'crop' | 'pad' | 'stretch';

interface PlatformPreset {
  label: string;
  platform: string;
  w: number;
  h: number;
}

const platformPresets: PlatformPreset[] = [
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

  const [mode, setMode] = useState<ResizeMode>('exact');
  const [fitMode, setFitMode] = useState<FitMode>('crop');

  // Exact mode
  const [targetW, setTargetW] = useState(1920);
  const [targetH, setTargetH] = useState(1080);

  // Ratio lock mode
  const [lockRatioW, setLockRatioW] = useState(16);
  const [lockRatioH, setLockRatioH] = useState(9);
  const [lockDim, setLockDim] = useState<'width' | 'height'>('width');
  const [lockValue, setLockValue] = useState(1920);

  // Platform mode
  const [selectedPlatform, setSelectedPlatform] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tw = params.get('tw');
    const th = params.get('th');
    if (tw && th) {
      setTargetW(parseInt(tw, 10));
      setTargetH(parseInt(th, 10));
    }
  }, []);

  // Compute effective target from mode
  const getEffectiveTarget = useCallback((): { w: number; h: number } => {
    if (mode === 'platform') {
      const p = platformPresets[selectedPlatform];
      return { w: p.w, h: p.h };
    }
    if (mode === 'ratio-lock') {
      if (lockDim === 'width') {
        return { w: lockValue, h: Math.round((lockValue * lockRatioH) / lockRatioW) };
      }
      return { w: Math.round((lockValue * lockRatioW) / lockRatioH), h: lockValue };
    }
    return { w: targetW, h: targetH };
  }, [mode, targetW, targetH, lockRatioW, lockRatioH, lockDim, lockValue, selectedPlatform]);

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

  // Draw blurred background for pad mode
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

  // Render preview
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
    } else if (fitMode === 'crop') {
      const crop = calculateCrop(imgWidth, imgHeight, target.w, target.h);
      const scale = Math.min(maxPreview / target.w, maxPreview / target.h, 1);
      canvas.width = Math.round(target.w * scale);
      canvas.height = Math.round(target.h * scale);
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    } else {
      // pad with blur
      const pad = calculatePadding(imgWidth, imgHeight, target.w, target.h);
      const scale = Math.min(maxPreview / pad.totalW, maxPreview / pad.totalH, 1);
      canvas.width = Math.round(pad.totalW * scale);
      canvas.height = Math.round(pad.totalH * scale);
      drawBlurredBg(ctx, img, canvas.width, canvas.height);
      ctx.drawImage(
        img, 0, 0, imgWidth, imgHeight,
        Math.round(pad.left * scale), Math.round(pad.top * scale),
        Math.round(imgWidth * scale), Math.round(imgHeight * scale)
      );
    }
  }, [imageSrc, imgWidth, imgHeight, getEffectiveTarget, fitMode, drawBlurredBg]);

  const handleExport = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const target = getEffectiveTarget();
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    exportCanvas.width = target.w;
    exportCanvas.height = target.h;

    if (fitMode === 'stretch') {
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, target.w, target.h);
    } else if (fitMode === 'crop') {
      const crop = calculateCrop(imgWidth, imgHeight, target.w, target.h);
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, target.w, target.h);
    } else {
      const pad = calculatePadding(imgWidth, imgHeight, target.w, target.h);
      drawBlurredBg(ctx, img, pad.totalW, pad.totalH);
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, pad.left, pad.top, imgWidth, imgHeight);
    }

    const link = document.createElement('a');
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'resized';
    link.download = `${baseName}-${target.w}x${target.h}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [imgWidth, imgHeight, getEffectiveTarget, fitMode, fileName, drawBlurredBg]);

  const target = getEffectiveTarget();
  const srcRatio = imgWidth > 0 ? formatRatio(imgWidth, imgHeight) : '—';
  const tgtRatio = formatRatio(target.w, target.h);
  const needsChange = imgWidth > 0 && (imgWidth !== target.w || imgHeight !== target.h);
  const nearest = imgWidth > 0 ? nearestCommonRatios(imgWidth, imgHeight, 1)[0] : null;

  // Recommendation
  const getRecommendation = (): string => {
    if (!imgWidth) return '';
    const srcR = imgWidth / imgHeight;
    const tgtR = target.w / target.h;
    const diff = Math.abs((srcR - tgtR) / tgtR) * 100;
    if (diff < 0.5) return 'Same ratio — simple scale, no quality loss.';
    if (diff < 5) return 'Very close ratio — minimal crop recommended.';
    if (srcR > tgtR) return 'Source is wider — crop sides or pad top/bottom.';
    return 'Source is taller — crop top/bottom or pad sides.';
  };

  return (
    <div class="w-full max-w-5xl mx-auto">
      {/* Mode Selector */}
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div class="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border-dark/50">
          {(['exact', 'ratio-lock', 'platform'] as ResizeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              class={`px-4 py-2 text-sm rounded-md transition-all duration-150 ${
                mode === m
                  ? 'bg-teal-500/15 text-teal-400 font-medium'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              id={`resize-mode-${m}`}
            >
              {m === 'exact' ? 'Exact Size' : m === 'ratio-lock' ? 'Lock Ratio' : 'Platform'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-specific Controls */}
      <div class="mb-6">
        {mode === 'exact' && (
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-xs text-text-muted">Target:</span>
            <input
              type="number" value={targetW} min="1"
              onInput={(e) => setTargetW(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
              class="w-20 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
              id="resize-target-w"
            />
            <span class="text-text-muted font-mono">×</span>
            <input
              type="number" value={targetH} min="1"
              onInput={(e) => setTargetH(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
              class="w-20 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
              id="resize-target-h"
            />
            <span class="text-xs text-text-muted ml-1">px</span>

            {/* Fit mode */}
            <div class="flex items-center gap-1 p-0.5 bg-surface rounded-md border border-border-dark/50 ml-3">
              {(['crop', 'pad', 'stretch'] as FitMode[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFitMode(f)}
                  class={`px-2.5 py-1 text-[11px] rounded capitalize transition-all ${
                    fitMode === f
                      ? 'bg-teal-500/15 text-teal-400 font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'ratio-lock' && (
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-xs text-text-muted">Ratio:</span>
            <input
              type="number" value={lockRatioW} min="1"
              onInput={(e) => setLockRatioW(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
              class="w-16 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
            />
            <span class="text-text-muted font-mono">:</span>
            <input
              type="number" value={lockRatioH} min="1"
              onInput={(e) => setLockRatioH(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
              class="w-16 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
            />
            <span class="mx-2 text-text-muted">|</span>
            <select
              value={lockDim}
              onChange={(e) => setLockDim((e.target as HTMLSelectElement).value as 'width' | 'height')}
              class="px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary text-sm focus:border-teal-500 outline-none"
            >
              <option value="width">Width</option>
              <option value="height">Height</option>
            </select>
            <span class="text-text-muted">=</span>
            <input
              type="number" value={lockValue} min="1"
              onInput={(e) => setLockValue(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
              class="w-20 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
            />
            <span class="text-xs text-text-muted">px</span>
          </div>
        )}

        {mode === 'platform' && (
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
              id="resize-drop-zone"
            >
              <input
                ref={fileInputRef} type="file" accept="image/*" class="hidden"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) loadImage(file);
                }}
              />
              <div class="flex flex-col items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center">
                  <svg class="w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 14l4-4 4 4M12 14l4-4 4 4" /><rect x="2" y="4" width="20" height="16" rx="2" />
                  </svg>
                </div>
                <div>
                  <p class="text-text-primary font-medium mb-1">Drop an image to resize</p>
                  <p class="text-sm text-text-muted">Or click to browse • 100% client-side</p>
                </div>
              </div>
            </div>
          ) : (
            <div class="bg-surface rounded-xl border border-border-dark/50 overflow-hidden">
              <div class="p-3 bg-surface-2/50 border-b border-border-dark/30 flex items-center justify-between">
                <span class="text-xs text-text-muted">
                  Resize Preview
                  <span class="ml-2 font-mono text-teal-400">{target.w}×{target.h}</span>
                </span>
                <div class="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    class="text-xs px-3 py-1 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 rounded-md transition-colors"
                    id="btn-resize-export"
                  >
                    Export PNG
                  </button>
                  <button
                    onClick={() => { setImageSrc(null); imgRef.current = null; setImgWidth(0); setImgHeight(0); }}
                    class="text-xs text-text-muted hover:text-danger transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div class="p-4 flex items-center justify-center bg-[#0a0a0a] min-h-[300px]">
                <canvas ref={canvasRef} class="max-w-full max-h-[400px] rounded-sm" style="image-rendering: auto;" />
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div class="space-y-4">
          {imageSrc && imgWidth > 0 && (
            <>
              <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
                <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">Source</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-text-muted">Dimensions</span>
                    <div class="flex items-center gap-2">
                      <span class="font-mono tabular-nums text-text-primary">{imgWidth} × {imgHeight}</span>
                      <CopyBtn value={`${imgWidth}x${imgHeight}`} />
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-muted">Ratio</span>
                    <span class="font-mono tabular-nums text-text-primary">{srcRatio}</span>
                  </div>
                  {nearest && (
                    <div class="flex justify-between">
                      <span class="text-text-muted">Nearest</span>
                      <span class="font-mono tabular-nums text-teal-400 text-xs">{nearest.ratio.label} ({nearest.confidence})</span>
                    </div>
                  )}
                </div>
              </div>

              <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
                <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">Output</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-text-muted">Dimensions</span>
                    <div class="flex items-center gap-2">
                      <span class="font-mono tabular-nums text-text-primary">{target.w} × {target.h}</span>
                      <CopyBtn value={`${target.w}x${target.h}`} />
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-muted">Ratio</span>
                    <span class="font-mono tabular-nums text-text-primary">{tgtRatio}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-muted">Scale</span>
                    <span class="font-mono tabular-nums text-xs">
                      {imgWidth > 0 ? `${Math.round((target.w / imgWidth) * 100)}% W` : '—'}
                      {' · '}
                      {imgHeight > 0 ? `${Math.round((target.h / imgHeight) * 100)}% H` : '—'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-muted">Fit</span>
                    <span class="font-mono tabular-nums text-xs capitalize text-teal-400">{fitMode}</span>
                  </div>
                </div>
              </div>

              {needsChange && (
                <div class="p-4 bg-teal-500/5 rounded-xl border border-teal-500/20">
                  <h3 class="text-xs text-teal-400 uppercase tracking-wider mb-2">Recommendation</h3>
                  <p class="text-xs text-text-muted leading-relaxed">{getRecommendation()}</p>
                </div>
              )}
            </>
          )}

          {!imageSrc && (
            <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
              <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">How it works</h3>
              <ol class="space-y-2 text-sm text-text-muted">
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">1</span>
                  <span>Upload your image</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">2</span>
                  <span>Pick a target size or platform preset</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">3</span>
                  <span>Choose fit mode: crop, pad, or stretch</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">4</span>
                  <span>Export at exact target dimensions</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
