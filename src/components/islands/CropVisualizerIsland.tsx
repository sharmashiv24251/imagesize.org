import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { calculateCrop, calculatePadding, simplify, formatRatio } from '../../lib/ratio';

type CropMode = 'crop' | 'padding' | 'letterbox';

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
  const [padColor, setPadColor] = useState('#000000');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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

  // Render preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgWidth || !imgHeight) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxPreview = 500;
    let scale: number;

    if (mode === 'crop') {
      const crop = calculateCrop(imgWidth, imgHeight, targetW, targetH);
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

      ctx.fillStyle = padColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        0, 0, imgWidth, imgHeight,
        Math.round(pad.left * scale), Math.round(pad.top * scale),
        Math.round(imgWidth * scale), Math.round(imgHeight * scale)
      );
    } else {
      // Letterbox
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
  }, [imageSrc, imgWidth, imgHeight, targetW, targetH, mode, padColor]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create full-resolution export
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    const img = imgRef.current;
    if (!ctx || !img) return;

    if (mode === 'crop') {
      const crop = calculateCrop(imgWidth, imgHeight, targetW, targetH);
      exportCanvas.width = crop.width;
      exportCanvas.height = crop.height;
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    } else {
      const pad = calculatePadding(imgWidth, imgHeight, targetW, targetH);
      exportCanvas.width = pad.totalW;
      exportCanvas.height = pad.totalH;
      ctx.fillStyle = mode === 'letterbox' ? '#000000' : padColor;
      ctx.fillRect(0, 0, pad.totalW, pad.totalH);
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, pad.left, pad.top, imgWidth, imgHeight);
    }

    const link = document.createElement('a');
    link.download = `cropped-${targetW}x${targetH}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [imgWidth, imgHeight, targetW, targetH, mode, padColor]);

  const crop = imgWidth > 0 ? calculateCrop(imgWidth, imgHeight, targetW, targetH) : null;
  const pad = imgWidth > 0 ? calculatePadding(imgWidth, imgHeight, targetW, targetH) : null;

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
              <span class="text-xs text-text-muted">Pad color:</span>
              <input
                type="color"
                value={padColor}
                onInput={(e) => setPadColor((e.target as HTMLInputElement).value)}
                class="w-8 h-8 rounded-md border border-border-dark cursor-pointer"
                id="pad-color"
              />
            </div>
          )}
        </div>
      </div>

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
