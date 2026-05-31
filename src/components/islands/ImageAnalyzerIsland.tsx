import { useState, useCallback, useRef } from 'preact/hooks';
import {
  simplify,
  decimalRatio,
  orientation,
  nearestCommonRatios,
} from '../../lib/ratio';
import { categoryLabels, getPlatformFormatSlug, platformFormats, type PlatformCategory } from '../../lib/platforms';

interface ImageInfo {
  src: string;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  file: File;
  handoffId: string;
}

type CategoryFilter = 'all' | PlatformCategory;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type Compatibility = 'fits' | 'crop' | 'wrong';

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

async function storePendingImage(image: ImageInfo) {
  const key = `${pendingImageKeyPrefix}:${image.handoffId}`;

  try {
    sessionStorage.setItem(`aspect-ratio-pending-image-meta:${image.handoffId}`, JSON.stringify({
      fileName: image.fileName,
      width: image.width,
      height: image.height,
      fileType: image.fileType,
    }));
  } catch {
    // Metadata is helpful, but the blob handoff is the important part.
  }

  try {
    const db = await openPendingImageDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(pendingImageStoreName, 'readwrite');
      tx.objectStore(pendingImageStoreName).put(image.file, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    try {
      sessionStorage.setItem(`aspect-ratio-pending-image:${image.handoffId}`, JSON.stringify({
        src: image.src,
        fileName: image.fileName,
        width: image.width,
        height: image.height,
      }));
    } catch {
      // If storage is unavailable or full, the crop page will still open with the target ratio.
    }
  }
}

function checkCompatibility(imgW: number, imgH: number, targetW: number, targetH: number): Compatibility {
  const imgRatio = imgW / imgH;
  const targetRatio = targetW / targetH;
  const diff = Math.abs((imgRatio - targetRatio) / targetRatio) * 100;

  if (diff < 0.5) return 'fits';
  if (diff < 10) return 'crop';
  return 'wrong';
}

function CompatBadge({ status }: { status: Compatibility }) {
  const config = {
    fits: { text: 'Fits', cls: 'text-success bg-success/10 border-success/20' },
    crop: { text: 'Needs crop', cls: 'text-warning bg-warning/10 border-warning/20' },
    wrong: { text: 'Wrong shape', cls: 'text-danger bg-danger/10 border-danger/20' },
  };
  const c = config[status];
  return (
    <span class={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${c.cls}`}>
      <span>{c.text}</span>
    </span>
  );
}

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

export default function ImageAnalyzerIsland() {
  const [image, setImage] = useState<ImageInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handoffPromiseRef = useRef<Promise<void> | null>(null);

  const analyzeImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const handoffId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const nextImage = {
          src: e.target?.result as string,
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          file,
          handoffId,
        };
        setImage(nextImage);
        handoffPromiseRef.current = storePendingImage(nextImage);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      analyzeImage(file);
    }
  }, [analyzeImage]);

  const handleFileSelect = useCallback((e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) analyzeImage(file);
  }, [analyzeImage]);

  const resetImage = useCallback(() => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  if (!image) {
    return (
      <div class="w-full max-w-3xl mx-auto">
        {/* Drop zone */}
        <div
          class={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200 cursor-pointer ${
            isDragOver
              ? 'border-teal-500 bg-teal-500/5'
              : 'border-border-dark/50 hover:border-teal-500/40 hover:bg-surface'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          id="drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            class="hidden"
            onChange={handleFileSelect}
            id="file-input"
          />
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center">
              <svg class="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p class="text-text-primary font-medium mb-1">Drop an image here or click to browse</p>
              <p class="text-sm text-text-muted">PNG, JPG, WebP, GIF — any size</p>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <svg class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="text-xs text-text-muted">100% client-side — your image never leaves your browser</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [sw, sh] = simplify(image.width, image.height);
  const decimal = decimalRatio(image.width, image.height);
  const orient = orientation(image.width, image.height);
  const nearest = nearestCommonRatios(image.width, image.height, 3);
  const filteredFormats = platformFormats.filter((format) => {
    const matchesCategory = category === 'all' || format.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [format.platform, format.name, format.ratio, `${format.w}`, `${format.h}`].some((value) =>
      value.toLowerCase().includes(q)
    );
    return matchesCategory && matchesQuery;
  });
  const categories: CategoryFilter[] = ['all', 'social', 'video', 'professional', 'print', 'cinema', 'display-ads'];

  return (
    <div class="w-full max-w-5xl mx-auto space-y-6">
      {/* Image Preview + Info */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div class="bg-surface rounded-xl border border-border-dark/50 overflow-hidden">
          <div class="p-3 bg-surface-2/50 border-b border-border-dark/30 flex items-center justify-between">
            <span class="text-xs text-text-muted truncate max-w-[200px]">{image.fileName}</span>
            <button
              onClick={resetImage}
              class="text-xs text-text-muted hover:text-danger transition-colors"
              id="btn-reset-image"
            >
              Remove
            </button>
          </div>
          <div class="p-4 flex items-center justify-center bg-[#0a0a0a] min-h-[280px]">
            <img
              src={image.src}
              alt="Uploaded image preview"
              class="max-w-full max-h-[300px] object-contain rounded-sm"
            />
          </div>
        </div>

        {/* Analysis Results */}
        <div class="space-y-3">
          <h3 class="text-xs text-text-muted uppercase tracking-wider">Analysis Results</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg border border-border-dark/50">
              <span class="text-xs text-text-muted">Resolution</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-mono tabular-nums text-text-primary">{image.width} × {image.height}</span>
                <CopyBtn value={`${image.width}x${image.height}`} />
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg border border-border-dark/50">
              <span class="text-xs text-text-muted">Ratio</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-mono tabular-nums text-text-primary">{sw}:{sh}</span>
                <CopyBtn value={`${sw}:${sh}`} />
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg border border-border-dark/50">
              <span class="text-xs text-text-muted">Decimal</span>
              <span class="text-sm font-mono tabular-nums text-text-primary">{decimal.toFixed(4)}</span>
            </div>
            <div class="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg border border-border-dark/50">
              <span class="text-xs text-text-muted">Orientation</span>
              <span class="text-sm text-text-primary">{orient}</span>
            </div>
            <div class="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg border border-border-dark/50">
              <span class="text-xs text-text-muted">File Size</span>
              <span class="text-sm font-mono text-text-primary">{formatFileSize(image.fileSize)}</span>
            </div>
            <div class="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg border border-border-dark/50">
              <span class="text-xs text-text-muted">Format</span>
              <span class="text-sm text-text-primary uppercase">{image.fileType.split('/')[1]}</span>
            </div>
          </div>

          {/* Nearest ratio */}
          {nearest.length > 0 && (
            <div class="p-3 bg-teal-500/5 rounded-lg border border-teal-500/20">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-teal-400 font-medium">Closest Match</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-lg text-text-primary font-semibold">{nearest[0].ratio.label}</span>
                <span class="text-xs text-text-muted">
                  {nearest[0].difference === 0
                    ? '— exact match'
                    : `— ${nearest[0].difference}% off`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Platform Compatibility Grid */}
      <div class="bg-surface rounded-xl border border-border-dark/50 overflow-hidden">
        <div class="p-4 border-b border-border-dark/30">
          <div class="flex flex-col gap-3">
            <div>
              <h3 class="text-sm font-semibold text-text-primary">Platform Compatibility</h3>
              <p class="text-xs text-text-muted mt-1">
                {filteredFormats.length} of {platformFormats.length} formats shown. Print rows include DPI-aware targets.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                value={query}
                onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                placeholder="Search platform, format, ratio, dimensions..."
                class="flex-1 px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-sm text-text-primary placeholder:text-text-muted/60 focus:border-teal-500 outline-none"
              />
              <select
                value={category}
                onChange={(e) => setCategory((e.target as HTMLSelectElement).value as CategoryFilter)}
                class="px-3 py-2 bg-surface-2 border border-border-dark rounded-lg text-sm text-text-primary focus:border-teal-500 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'all' ? 'All categories' : categoryLabels[cat as PlatformCategory]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-surface-2/50 text-left">
                <th class="px-4 py-2.5 text-xs text-text-muted font-medium uppercase tracking-wider">Platform</th>
                <th class="px-4 py-2.5 text-xs text-text-muted font-medium uppercase tracking-wider">Format</th>
                <th class="px-4 py-2.5 text-xs text-text-muted font-medium uppercase tracking-wider">Target Size</th>
                <th class="px-4 py-2.5 text-xs text-text-muted font-medium uppercase tracking-wider">Ratio</th>
                <th class="px-4 py-2.5 text-xs text-text-muted font-medium uppercase tracking-wider">Status</th>
                <th class="px-4 py-2.5 text-xs text-text-muted font-medium uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-dark/30">
              {filteredFormats.map((pf) => {
                const status = checkCompatibility(image.width, image.height, pf.w, pf.h);
                return (
                  <tr key={`${pf.platform}-${pf.name}`} class="hover:bg-surface-2/30 transition-colors">
                    <td class="px-4 py-3 text-text-primary font-medium">{pf.platform}</td>
                    <td class="px-4 py-3 text-text-muted">
                      <a href={`/${getPlatformFormatSlug(pf)}`} class="text-text-primary hover:text-teal-400 transition-colors">
                        {pf.name}
                      </a>
                      {(pf.safeZone || pf.dpi) && (
                        <div class="mt-1 flex flex-wrap gap-1">
                          {pf.safeZone && <span title={pf.safeZone} class="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">Safe zone</span>}
                          {pf.dpi && <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">{pf.dpi} DPI</span>}
                        </div>
                      )}
                    </td>
                    <td class="px-4 py-3 font-mono tabular-nums text-text-muted text-xs">{pf.w}×{pf.h}</td>
                    <td class="px-4 py-3 font-mono tabular-nums text-text-muted text-xs">{pf.ratio}</td>
                    <td class="px-4 py-3"><CompatBadge status={status} /></td>
                    <td class="px-4 py-3">
                      {status !== 'fits' && (
                        <a
                          href={`/crop-and-resize?w=${image.width}&h=${image.height}&tw=${pf.w}&th=${pf.h}&handoff=${encodeURIComponent(image.handoffId)}&platform=${encodeURIComponent(pf.platform)}&format=${encodeURIComponent(pf.name)}`}
                          onClick={async (event) => {
                            event.preventDefault();
                            await handoffPromiseRef.current;
                            window.location.href = `/crop-and-resize?w=${image.width}&h=${image.height}&tw=${pf.w}&th=${pf.h}&handoff=${encodeURIComponent(image.handoffId)}&platform=${encodeURIComponent(pf.platform)}&format=${encodeURIComponent(pf.name)}`;
                          }}
                          class="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                        >
                          Crop to fix →
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
