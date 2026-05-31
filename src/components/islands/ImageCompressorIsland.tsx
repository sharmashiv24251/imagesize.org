import { useCallback, useMemo, useRef, useState } from 'preact/hooks';

type OutputFormat = 'jpeg' | 'webp' | 'png';

interface ImageCompressorIslandProps {
  initialTargetKb?: number;
  initialFormat?: OutputFormat;
  initialMaxWidth?: number;
  initialMaxHeight?: number;
  buttonLabel?: string;
}

interface CompressionResult {
  url: string;
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  reachedTarget: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not export the compressed image.'));
    }, mime, quality);
  });
}

export default function ImageCompressorIsland({
  initialTargetKb = 250,
  initialFormat = 'webp',
  initialMaxWidth,
  initialMaxHeight,
  buttonLabel = 'Reduce Image Size',
}: ImageCompressorIslandProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetKb, setTargetKb] = useState(initialTargetKb);
  const [format, setFormat] = useState<OutputFormat>(initialFormat);
  const [maxWidth, setMaxWidth] = useState(initialMaxWidth ? `${initialMaxWidth}` : '');
  const [maxHeight, setMaxHeight] = useState(initialMaxHeight ? `${initialMaxHeight}` : '');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savings = useMemo(() => {
    if (!file || !result) return 0;
    return Math.max(0, Math.round((1 - result.blob.size / file.size) * 100));
  }, [file, result]);

  const resetResult = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }, [result]);

  const handleFile = useCallback((nextFile: File) => {
    if (!nextFile.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    resetResult();
    setError('');
    setFile(nextFile);
  }, [resetResult]);

  const compress = useCallback(async () => {
    if (!file) return;
    resetResult();
    setError('');
    setIsWorking(true);

    try {
      const img = await loadImage(file);
      const maxW = Math.max(0, parseInt(maxWidth, 10) || 0);
      const maxH = Math.max(0, parseInt(maxHeight, 10) || 0);
      const widthScale = maxW ? maxW / img.naturalWidth : 1;
      const heightScale = maxH ? maxH / img.naturalHeight : 1;
      const scale = Math.min(1, widthScale, heightScale);
      const outputW = Math.max(1, Math.round(img.naturalWidth * scale));
      const outputH = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = outputW;
      canvas.height = outputH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser.');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, outputW, outputH);

      const mime = format === 'png' ? 'image/png' : `image/${format}`;
      const targetBytes = Math.max(1, targetKb) * 1024;
      let bestBlob = await canvasToBlob(canvas, mime, format === 'png' ? undefined : 0.92);
      let bestQuality = format === 'png' ? 1 : 0.92;

      if (format !== 'png') {
        let low = 0.08;
        let high = 0.92;
        for (let i = 0; i < 8; i += 1) {
          const quality = (low + high) / 2;
          const blob = await canvasToBlob(canvas, mime, quality);
          if (blob.size <= targetBytes) {
            bestBlob = blob;
            bestQuality = quality;
            low = quality;
          } else {
            high = quality;
            if (blob.size < bestBlob.size) {
              bestBlob = blob;
              bestQuality = quality;
            }
          }
        }
      }

      setResult({
        url: URL.createObjectURL(bestBlob),
        blob: bestBlob,
        width: outputW,
        height: outputH,
        quality: bestQuality,
        reachedTarget: bestBlob.size <= targetBytes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while compressing.');
    } finally {
      setIsWorking(false);
    }
  }, [file, format, maxHeight, maxWidth, resetResult, targetKb]);

  const extension = format === 'jpeg' ? 'jpg' : format;
  const baseName = file?.name.replace(/\.[^.]+$/, '') || 'image';

  return (
    <div class="w-full max-w-5xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div
          class="border-2 border-dashed border-border-dark/50 rounded-xl p-10 text-center hover:border-teal-500/40 hover:bg-surface transition-all cursor-pointer"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const nextFile = event.dataTransfer?.files[0];
            if (nextFile) handleFile(nextFile);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            class="hidden"
            onChange={(event) => {
              const nextFile = (event.target as HTMLInputElement).files?.[0];
              if (nextFile) handleFile(nextFile);
            }}
          />
          <div class="flex flex-col items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center">
              <svg class="w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                <path d="M4 14v5a1 1 0 001 1h14a1 1 0 001-1v-5" />
                <path d="M8 9l4-4 4 4" />
                <path d="M12 5v11" />
              </svg>
            </div>
            <div>
              <p class="text-text-primary font-medium mb-1">{file ? file.name : 'Drop an image to reduce its file size'}</p>
              <p class="text-sm text-text-muted">{file ? `Original: ${formatBytes(file.size)}` : 'JPG, PNG, WebP, GIF, or AVIF. Processing stays in your browser.'}</p>
            </div>
          </div>
        </div>

        <div class="bg-surface rounded-xl border border-border-dark/50 p-4 space-y-4">
          <div>
            <label class="text-xs text-text-muted uppercase tracking-wider" for="target-kb">Target size</label>
            <div class="mt-2 flex items-center gap-2">
              <input
                id="target-kb"
                type="number"
                min="1"
                value={targetKb}
                onInput={(event) => setTargetKb(Math.max(1, parseInt((event.target as HTMLInputElement).value, 10) || 1))}
                class="w-full px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-text-primary font-mono outline-none focus:border-teal-500"
              />
              <span class="text-sm text-text-muted">KB</span>
            </div>
          </div>

          <div>
            <label class="text-xs text-text-muted uppercase tracking-wider" for="output-format">Output</label>
            <select
              id="output-format"
              value={format}
              onChange={(event) => setFormat((event.target as HTMLSelectElement).value as OutputFormat)}
              class="mt-2 w-full px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-text-primary outline-none focus:border-teal-500"
            >
              <option value="webp">WebP</option>
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
            </select>
            {format === 'png' && (
              <p class="mt-2 text-xs text-warning">PNG ignores quality controls in most browsers. Use WebP or JPG for smaller files.</p>
            )}
          </div>

          <div class="grid grid-cols-2 gap-2">
            <label class="text-xs text-text-muted">
              Max width
              <input
                type="number"
                min="1"
                placeholder="Auto"
                value={maxWidth}
                onInput={(event) => setMaxWidth((event.target as HTMLInputElement).value)}
                class="mt-1 w-full px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-text-primary font-mono outline-none focus:border-teal-500"
              />
            </label>
            <label class="text-xs text-text-muted">
              Max height
              <input
                type="number"
                min="1"
                placeholder="Auto"
                value={maxHeight}
                onInput={(event) => setMaxHeight((event.target as HTMLInputElement).value)}
                class="mt-1 w-full px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-text-primary font-mono outline-none focus:border-teal-500"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!file || isWorking}
            onClick={compress}
            class="w-full px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isWorking ? 'Compressing...' : buttonLabel}
          </button>
        </div>
      </div>

      {error && (
        <p class="mt-4 text-sm text-danger">{error}</p>
      )}

      {file && result && (
        <div class="mt-6 bg-surface rounded-xl border border-border-dark/50 p-5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider">Original</div>
              <div class="font-mono text-text-primary mt-1">{formatBytes(file.size)}</div>
            </div>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider">Compressed</div>
              <div class="font-mono text-text-primary mt-1">{formatBytes(result.blob.size)}</div>
            </div>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider">Saved</div>
              <div class="font-mono text-success mt-1">{savings}%</div>
            </div>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider">Output</div>
              <div class="font-mono text-text-primary mt-1">{result.width}x{result.height}</div>
            </div>
          </div>

          {!result.reachedTarget && (
            <p class="mb-4 text-sm text-warning">
              Closest result is still above {targetKb} KB. Try WebP, a smaller max width, or a lower target with simpler artwork.
            </p>
          )}

          <a
            href={result.url}
            download={`${baseName}-${Math.round(result.blob.size / 1024)}kb.${extension}`}
            class="inline-flex items-center justify-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
          >
            Download compressed image
          </a>
        </div>
      )}
    </div>
  );
}
