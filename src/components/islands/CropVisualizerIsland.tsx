import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { calculateCropWithFocus, calculatePadding, simplify, formatRatio } from '../../lib/ratio';

type CropMode = 'crop' | 'padding' | 'letterbox';
type ExportFormat = 'png' | 'jpeg' | 'webp';

interface Preset {
  label: string;
  w: number;
  h: number;
}

const presets: Preset[] = [
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

export default function CropVisualizerIsland() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [targetW, setTargetW] = useState(16);
  const [targetH, setTargetH] = useState(9);
  const [mode, setMode] = useState<CropMode>('crop');
  const [padFill, setPadFill] = useState<'blur' | 'color'>('blur');
  const [padColor, setPadColor] = useState('#000000');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [previewView, setPreviewView] = useState<'after' | 'before'>('after');
  const [cropFocus, setCropFocus] = useState({ x: 0.5, y: 0.5 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerX: number; pointerY: number; focusX: number; focusY: number } | null>(null);

  // Read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tw = params.get('tw');
    const th = params.get('th');
    if (tw && th) {
      const [sw, sh] = simplify(parseInt(tw, 10), parseInt(th, 10));
      setTargetW(sw);
      setTargetH(sh);
    }

    const pendingImage = sessionStorage.getItem('aspect-ratio-pending-image');
    if (pendingImage) {
      try {
        const parsed = JSON.parse(pendingImage) as { src?: string };
        if (parsed.src) {
          const img = new Image();
          img.onload = () => {
            imgRef.current = img;
            setImgWidth(img.naturalWidth);
            setImgHeight(img.naturalHeight);
            setImageSrc(parsed.src || null);
            setCropFocus({ x: 0.5, y: 0.5 });
            sessionStorage.removeItem('aspect-ratio-pending-image');
          };
          img.src = parsed.src;
        }
      } catch {
        sessionStorage.removeItem('aspect-ratio-pending-image');
      }
    }
  }, []);

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setImgWidth(img.naturalWidth);
        setImgHeight(img.naturalHeight);
        setImageSrc(e.target?.result as string);
        setCropFocus({ x: 0.5, y: 0.5 });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
  }, [loadImage]);

  // Helper: draw blurred + darkened background that covers the full canvas
  const drawBlurredBackground = useCallback((
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasW: number,
    canvasH: number
  ) => {
    // Scale image to cover entire canvas (like CSS background-size: cover)
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasW / canvasH;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (imgRatio > canvasRatio) {
      sw = img.naturalHeight * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / canvasRatio;
      sy = (img.naturalHeight - sh) / 2;
    }

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
      ctx.drawImage(tiny, -24 + offset, -24, canvasW + 48, canvasH + 48);
      ctx.drawImage(tiny, -24, -24 + offset, canvasW + 48, canvasH + 48);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }, []);

  // Render preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgWidth || !imgHeight) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxPreview = 500;
    let scale: number;

    if (previewView === 'before') {
      const scale = Math.min(maxPreview / imgWidth, maxPreview / imgHeight, 1);
      canvas.width = Math.round(imgWidth * scale);
      canvas.height = Math.round(imgHeight * scale);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, canvas.width, canvas.height);
    } else if (mode === 'crop') {
      const crop = calculateCropWithFocus(imgWidth, imgHeight, targetW, targetH, cropFocus.x, cropFocus.y);
      scale = Math.min(maxPreview / crop.width, maxPreview / crop.height, 1);
      canvas.width = Math.round(crop.width * scale);
      canvas.height = Math.round(crop.height * scale);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, canvas.width, canvas.height
      );
    } else if (mode === 'padding') {
      const pad = calculatePadding(imgWidth, imgHeight, targetW, targetH);
      scale = Math.min(maxPreview / pad.totalW, maxPreview / pad.totalH, 1);
      canvas.width = Math.round(pad.totalW * scale);
      canvas.height = Math.round(pad.totalH * scale);

      if (padFill === 'blur') {
        // Blurred + darkened image background
        drawBlurredBackground(ctx, img, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = padColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(
        img,
        0, 0, imgWidth, imgHeight,
        Math.round(pad.left * scale), Math.round(pad.top * scale),
        Math.round(imgWidth * scale), Math.round(imgHeight * scale)
      );
    } else {
      // Letterbox — always black
      const pad = calculatePadding(imgWidth, imgHeight, targetW, targetH);
      scale = Math.min(maxPreview / pad.totalW, maxPreview / pad.totalH, 1);
      canvas.width = Math.round(pad.totalW * scale);
      canvas.height = Math.round(pad.totalH * scale);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        0, 0, imgWidth, imgHeight,
        Math.round(pad.left * scale), Math.round(pad.top * scale),
        Math.round(imgWidth * scale), Math.round(imgHeight * scale)
      );
    }
  }, [imageSrc, imgWidth, imgHeight, targetW, targetH, mode, padFill, padColor, cropFocus, previewView, drawBlurredBackground]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create full-resolution export
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    const img = imgRef.current;
    if (!ctx || !img) return;

    if (mode === 'crop') {
      const crop = calculateCropWithFocus(imgWidth, imgHeight, targetW, targetH, cropFocus.x, cropFocus.y);
      exportCanvas.width = crop.width;
      exportCanvas.height = crop.height;
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    } else {
      const pad = calculatePadding(imgWidth, imgHeight, targetW, targetH);
      exportCanvas.width = pad.totalW;
      exportCanvas.height = pad.totalH;

      if (mode === 'padding' && padFill === 'blur') {
        // Blurred + darkened background at full resolution
        drawBlurredBackground(ctx, img, pad.totalW, pad.totalH);
      } else {
        ctx.fillStyle = mode === 'letterbox' ? '#000000' : padColor;
        ctx.fillRect(0, 0, pad.totalW, pad.totalH);
      }
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, pad.left, pad.top, imgWidth, imgHeight);
    }

    const link = document.createElement('a');
    const mime = exportFormat === 'png' ? 'image/png' : `image/${exportFormat}`;
    link.download = `cropped-${targetW}x${targetH}.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`;
    link.href = exportCanvas.toDataURL(mime, exportFormat === 'png' ? undefined : quality);
    link.click();
  }, [imgWidth, imgHeight, targetW, targetH, mode, padFill, padColor, cropFocus, exportFormat, quality, drawBlurredBackground]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        handleExport();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleExport]);

  const crop = imgWidth > 0 ? calculateCropWithFocus(imgWidth, imgHeight, targetW, targetH, cropFocus.x, cropFocus.y) : null;
  const pad = imgWidth > 0 ? calculatePadding(imgWidth, imgHeight, targetW, targetH) : null;

  const handleCanvasPointerDown = useCallback((event: PointerEvent) => {
    if (mode !== 'crop' || previewView !== 'after' || !crop || !canvasRef.current) return;
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, focusX: cropFocus.x, focusY: cropFocus.y };
    canvasRef.current.setPointerCapture(event.pointerId);
  }, [mode, previewView, crop, cropFocus]);

  const handleCanvasPointerMove = useCallback((event: PointerEvent) => {
    if (!dragRef.current || !crop || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const movableX = imgWidth - crop.width;
    const movableY = imgHeight - crop.height;
    const nextX = movableX > 0
      ? dragRef.current.focusX - ((event.clientX - dragRef.current.pointerX) / rect.width) * (crop.width / movableX)
      : 0.5;
    const nextY = movableY > 0
      ? dragRef.current.focusY - ((event.clientY - dragRef.current.pointerY) / rect.height) * (crop.height / movableY)
      : 0.5;
    setCropFocus({ x: Math.min(1, Math.max(0, nextX)), y: Math.min(1, Math.max(0, nextY)) });
  }, [crop, imgWidth, imgHeight]);

  const handleCanvasPointerUp = useCallback((event: PointerEvent) => {
    dragRef.current = null;
    canvasRef.current?.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <div class="w-full max-w-5xl mx-auto">
      {/* Mode & Target Ratio */}
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        {/* Mode selector */}
        <div class="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border-dark/50">
          {(['crop', 'padding', 'letterbox'] as CropMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              class={`px-4 py-2 text-sm rounded-md capitalize transition-all duration-150 ${
                mode === m
                  ? 'bg-teal-500/15 text-teal-400 font-medium'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              id={`mode-${m}`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Ratio inputs */}
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-muted">Target:</span>
          <input
            type="number"
            value={targetW}
            onInput={(e) => setTargetW(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
            class="w-16 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
            min="1"
            id="crop-target-w"
          />
          <span class="text-text-muted font-mono">:</span>
          <input
            type="number"
            value={targetH}
            onInput={(e) => setTargetH(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))}
            class="w-16 px-2 py-1.5 bg-surface-2 border border-border-dark rounded-md text-text-primary font-mono text-sm text-center focus:border-teal-500 outline-none"
            min="1"
            id="crop-target-h"
          />

          {mode === 'padding' && (
            <div class="flex items-center gap-2 ml-3">
              <span class="text-xs text-text-muted">Fill:</span>
              <div class="flex items-center gap-0.5 p-0.5 bg-surface rounded-md border border-border-dark/50">
                <button
                  onClick={() => setPadFill('blur')}
                  class={`px-2 py-1 text-[11px] rounded transition-all ${
                    padFill === 'blur'
                      ? 'bg-teal-500/15 text-teal-400 font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Blur
                </button>
                <button
                  onClick={() => setPadFill('color')}
                  class={`px-2 py-1 text-[11px] rounded transition-all ${
                    padFill === 'color'
                      ? 'bg-teal-500/15 text-teal-400 font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Color
                </button>
              </div>
              {padFill === 'color' && (
                <label class="flex items-center gap-2 px-2 py-1 bg-surface border border-border-dark/70 rounded-md cursor-pointer">
                  <span class="w-5 h-5 rounded border border-text-muted/30" style={{ backgroundColor: padColor }} />
                  <span class="text-[11px] font-mono text-text-muted">{padColor}</span>
                  <input
                    type="color"
                    value={padColor}
                    onInput={(e) => setPadColor((e.target as HTMLInputElement).value)}
                    class="sr-only"
                    id="pad-color"
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      {imageSrc && (
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 p-3 bg-surface rounded-xl border border-border-dark/50">
          <div class="flex items-center gap-1 p-1 bg-surface-2 rounded-lg">
            {(['after', 'before'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setPreviewView(view)}
                class={`px-3 py-1.5 text-xs rounded-md capitalize transition-all ${
                  previewView === view ? 'bg-teal-500/15 text-teal-400 font-medium' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
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
          {mode === 'crop' && (
            <span class="text-xs text-text-muted sm:ml-auto">Drag the preview to reposition the crop.</span>
          )}
        </div>
      )}

      {/* Ratio presets */}
      <div class="flex flex-wrap gap-2 mb-6">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => { setTargetW(p.w); setTargetH(p.h); }}
            class={`px-3 py-1.5 text-xs font-mono rounded-full border transition-all duration-150 ${
              targetW === p.w && targetH === p.h
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-400'
                : 'border-border-dark/50 text-text-muted hover:border-teal-500/30 hover:text-text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Preview */}
        <div class="lg:col-span-2">
          {!imageSrc ? (
            <div
              class="border-2 border-dashed border-border-dark/50 rounded-xl p-16 text-center hover:border-teal-500/40 hover:bg-surface transition-all duration-200 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              id="crop-drop-zone"
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
                    <path d="M6.13 1L6 16a2 2 0 002 2h15" />
                    <path d="M1 6.13L16 6a2 2 0 012 2v15" />
                  </svg>
                </div>
                <div>
                  <p class="text-text-primary font-medium mb-1">Drop an image to crop</p>
                  <p class="text-sm text-text-muted">Or click to browse • 100% client-side</p>
                </div>
              </div>
            </div>
          ) : (
            <div class="bg-surface rounded-xl border border-border-dark/50 overflow-hidden">
              <div class="p-3 bg-surface-2/50 border-b border-border-dark/30 flex items-center justify-between">
                <span class="text-xs text-text-muted">
                  {mode === 'crop' ? 'Crop Preview' : mode === 'padding' ? 'Padding Preview' : 'Letterbox Preview'}
                  <span class="ml-2 font-mono text-teal-400">{targetW}:{targetH}</span>
                </span>
                <div class="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    class="text-xs px-3 py-1 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 rounded-md transition-colors"
                    id="btn-export"
                  >
                    Export {exportFormat.toUpperCase()}
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
                <canvas
                  ref={canvasRef}
                  class={`max-w-full max-h-[400px] rounded-sm ${mode === 'crop' && previewView === 'after' ? 'cursor-move touch-none' : ''}`}
                  style="image-rendering: auto;"
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerUp}
                />
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div class="space-y-4">
          {imageSrc && imgWidth > 0 && (
            <>
              <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
                <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">Source Image</h3>
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
                    <span class="font-mono tabular-nums text-text-primary">{formatRatio(imgWidth, imgHeight)}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
                <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">
                  {mode === 'crop' ? 'Crop Result' : 'Padded Result'}
                </h3>
                <div class="space-y-2 text-sm">
                  {mode === 'crop' && crop && (
                    <>
                      <div class="flex justify-between">
                        <span class="text-text-muted">Output</span>
                        <span class="font-mono tabular-nums text-text-primary">{crop.width} × {crop.height}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-text-muted">Removed</span>
                        <span class="font-mono tabular-nums text-danger text-xs">
                          {imgWidth - crop.width > 0 ? `${imgWidth - crop.width}px horiz` : ''}
                          {imgWidth - crop.width > 0 && imgHeight - crop.height > 0 ? ' · ' : ''}
                          {imgHeight - crop.height > 0 ? `${imgHeight - crop.height}px vert` : ''}
                        </span>
                      </div>
                    </>
                  )}
                  {(mode === 'padding' || mode === 'letterbox') && pad && (
                    <>
                      <div class="flex justify-between">
                        <span class="text-text-muted">Output</span>
                        <span class="font-mono tabular-nums text-text-primary">{pad.totalW} × {pad.totalH}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-text-muted">Padding</span>
                        <span class="font-mono tabular-nums text-teal-400 text-xs">
                          {pad.top > 0 || pad.bottom > 0 ? `${pad.top}/${pad.bottom}px TB` : ''}
                          {(pad.top > 0 || pad.bottom > 0) && (pad.left > 0 || pad.right > 0) ? ' · ' : ''}
                          {pad.left > 0 || pad.right > 0 ? `${pad.left}/${pad.right}px LR` : ''}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {!imageSrc && (
            <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
              <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">How it works</h3>
              <ol class="space-y-2 text-sm text-text-muted">
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">1</span>
                  <span>Upload an image</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">2</span>
                  <span>Choose your target ratio</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">3</span>
                  <span>Pick crop, padding, or letterbox</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-400 font-mono text-xs mt-0.5">4</span>
                  <span>Export the result — full resolution</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
