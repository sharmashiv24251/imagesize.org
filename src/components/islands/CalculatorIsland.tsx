import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import {
  simplify,
  decimalRatio,
  orientation,
  nearestCommonRatios,
  formatRatio,
  resizeToDimension,
  type NearestMatch,
  type Orientation,
} from '../../lib/ratio';

interface PresetRatio {
  label: string;
  w: number;
  h: number;
}

const presets: PresetRatio[] = [
  { label: '16:9', w: 1920, h: 1080 },
  { label: '4:3', w: 1024, h: 768 },
  { label: '1:1', w: 1080, h: 1080 },
  { label: '9:16', w: 1080, h: 1920 },
  { label: '21:9', w: 2560, h: 1080 },
  { label: '3:2', w: 1500, h: 1000 },
  { label: '4:5', w: 1080, h: 1350 },
  { label: '5:4', w: 1280, h: 1024 },
  { label: '16:10', w: 1920, h: 1200 },
  { label: '32:9', w: 3840, h: 1080 },
];

type Mode = 'wh-to-ratio' | 'ratio-to-dim';

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      class="group flex items-center gap-1.5 text-xs text-text-muted hover:text-teal-400 transition-colors duration-150"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? (
        <svg class="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

function ResultStat({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div class="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg border border-border-dark/50 hover:border-teal-500/30 transition-colors duration-150">
      <span class="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      <div class="flex items-center gap-2">
        <span class={`text-sm font-medium text-text-primary ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</span>
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
}

function RatioPreview({ w, h }: { w: number; h: number }) {
  const maxSize = 160;
  let displayW: number, displayH: number;

  if (w <= 0 || h <= 0) {
    displayW = maxSize;
    displayH = maxSize;
  } else if (w >= h) {
    displayW = maxSize;
    displayH = Math.max(20, Math.round((h / w) * maxSize));
  } else {
    displayH = maxSize;
    displayW = Math.max(20, Math.round((w / h) * maxSize));
  }

  return (
    <div class="flex flex-col items-center gap-3">
      <div class="relative flex items-center justify-center" style={{ width: `${maxSize}px`, height: `${maxSize}px` }}>
        <div
          class="border-2 border-teal-500/60 bg-gradient-to-br from-teal-500/10 to-teal-600/5 rounded-sm transition-all duration-300 ease-out flex items-center justify-center"
          style={{
            width: `${displayW}px`,
            height: `${displayH}px`,
          }}
        >
          <span class="text-[10px] font-mono text-teal-400/70">{w > 0 && h > 0 ? formatRatio(w, h) : '—'}</span>
        </div>
        {/* Corner markers */}
        <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-text-muted/20" style={{
          top: `${(maxSize - displayH) / 2}px`,
          left: `${(maxSize - displayW) / 2}px`,
        }} />
        <div class="absolute" style={{
          top: `${(maxSize - displayH) / 2}px`,
          right: `${(maxSize - displayW) / 2}px`,
        }}>
          <div class="w-1.5 h-1.5 border-t border-r border-text-muted/20" />
        </div>
      </div>
      {w > 0 && h > 0 && (
        <div class="text-[10px] font-mono text-text-muted/50">
          {w} × {h}px
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: NearestMatch['confidence'] }) {
  const colors = {
    exact: 'bg-success/15 text-success border-success/30',
    'very close': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    close: 'bg-warning/15 text-warning border-warning/30',
    approximate: 'bg-text-muted/15 text-text-muted border-text-muted/30',
  };

  return (
    <span class={`text-[10px] px-1.5 py-0.5 rounded-full border ${colors[confidence]}`}>
      {confidence}
    </span>
  );
}

export default function CalculatorIsland() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [mode, setMode] = useState<Mode>('wh-to-ratio');
  const [ratioW, setRatioW] = useState(16);
  const [ratioH, setRatioH] = useState(9);
  const [lockDim, setLockDim] = useState<'width' | 'height'>('width');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Read initial values from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get('w');
    const h = params.get('h');
    if (w) setWidth(parseInt(w, 10));
    if (h) setHeight(parseInt(h, 10));
  }, []);

  const handleWidthChange = useCallback((e: Event) => {
    const raw = (e.target as HTMLInputElement).value;
    const val = raw === '' ? 0 : parseInt(raw, 10);
    if (!isNaN(val)) {
      setWidth(val);
      if (mode === 'ratio-to-dim' && lockDim === 'width' && val > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setHeight(resizeToDimension(ratioW, ratioH, val, 'width'));
        }, 80);
      }
    }
  }, [mode, lockDim, ratioW, ratioH]);

  const handleHeightChange = useCallback((e: Event) => {
    const raw = (e.target as HTMLInputElement).value;
    const val = raw === '' ? 0 : parseInt(raw, 10);
    if (!isNaN(val)) {
      setHeight(val);
      if (mode === 'ratio-to-dim' && lockDim === 'height' && val > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setWidth(resizeToDimension(ratioW, ratioH, val, 'height'));
        }, 80);
      }
    }
  }, [mode, lockDim, ratioW, ratioH]);

  const applyPreset = useCallback((preset: PresetRatio) => {
    setWidth(preset.w);
    setHeight(preset.h);
  }, []);

  const swapDimensions = useCallback(() => {
    setWidth(height);
    setHeight(width);
  }, [width, height]);

  const [sw, sh] = simplify(width, height);
  const decimal = decimalRatio(width, height);
  const orient: Orientation = orientation(width, height);
  const nearest = nearestCommonRatios(width, height, 5);

  return (
    <div class="w-full max-w-4xl mx-auto">
      {/* Mode Selector */}
      <div class="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border-dark/50 mb-6 w-fit mx-auto">
        <button
          onClick={() => setMode('wh-to-ratio')}
          class={`px-4 py-2 text-sm rounded-md transition-all duration-150 ${
            mode === 'wh-to-ratio'
              ? 'bg-teal-500/15 text-teal-400 font-medium'
              : 'text-text-muted hover:text-text-primary'
          }`}
          id="mode-wh-to-ratio"
        >
          W×H → Ratio
        </button>
        <button
          onClick={() => setMode('ratio-to-dim')}
          class={`px-4 py-2 text-sm rounded-md transition-all duration-150 ${
            mode === 'ratio-to-dim'
              ? 'bg-teal-500/15 text-teal-400 font-medium'
              : 'text-text-muted hover:text-text-primary'
          }`}
          id="mode-ratio-to-dim"
        >
          Ratio → Dimension
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div class="lg:col-span-2 space-y-5">
          {/* Ratio input for ratio-to-dim mode */}
          {mode === 'ratio-to-dim' && (
            <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
              <label class="text-xs text-text-muted uppercase tracking-wider mb-3 block">Target Ratio</label>
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  value={ratioW}
                  onInput={(e) => {
                    const v = parseInt((e.target as HTMLInputElement).value, 10);
                    if (!isNaN(v)) setRatioW(v);
                  }}
                  class="w-20 px-3 py-2.5 bg-surface-2 border border-border-dark rounded-lg text-text-primary font-mono text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all outline-none"
                  id="input-ratio-w"
                  min="1"
                />
                <span class="text-text-muted font-mono">:</span>
                <input
                  type="number"
                  value={ratioH}
                  onInput={(e) => {
                    const v = parseInt((e.target as HTMLInputElement).value, 10);
                    if (!isNaN(v)) setRatioH(v);
                  }}
                  class="w-20 px-3 py-2.5 bg-surface-2 border border-border-dark rounded-lg text-text-primary font-mono text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all outline-none"
                  id="input-ratio-h"
                  min="1"
                />
                <div class="ml-auto flex items-center gap-1 text-xs text-text-muted">
                  <span>Lock:</span>
                  <button
                    onClick={() => setLockDim('width')}
                    class={`px-2 py-1 rounded ${lockDim === 'width' ? 'bg-teal-500/15 text-teal-400' : 'hover:bg-surface-2'}`}
                  >
                    W
                  </button>
                  <button
                    onClick={() => setLockDim('height')}
                    class={`px-2 py-1 rounded ${lockDim === 'height' ? 'bg-teal-500/15 text-teal-400' : 'hover:bg-surface-2'}`}
                  >
                    H
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dimension inputs */}
          <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
            <label class="text-xs text-text-muted uppercase tracking-wider mb-3 block">Dimensions (pixels)</label>
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <div class="text-[10px] text-text-muted/70 mb-1 font-mono">WIDTH</div>
                <input
                  type="number"
                  value={width}
                  onInput={handleWidthChange}
                  class="w-full px-4 py-3 bg-surface-2 border border-border-dark rounded-lg text-text-primary font-mono text-lg tabular-nums focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all outline-none"
                  id="input-width"
                  placeholder="Width"
                  min="1"
                />
              </div>
              <button
                onClick={swapDimensions}
                class="w-10 h-10 flex items-center justify-center text-text-muted hover:text-teal-400 hover:bg-surface-2 rounded-lg transition-all mt-4"
                title="Swap dimensions"
                id="btn-swap"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
              <div class="flex-1">
                <div class="text-[10px] text-text-muted/70 mb-1 font-mono">HEIGHT</div>
                <input
                  type="number"
                  value={height}
                  onInput={handleHeightChange}
                  class="w-full px-4 py-3 bg-surface-2 border border-border-dark rounded-lg text-text-primary font-mono text-lg tabular-nums focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all outline-none"
                  id="input-height"
                  placeholder="Height"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Preset Chips */}
          <div class="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                class={`px-3 py-1.5 text-xs font-mono rounded-full border transition-all duration-150 ${
                  formatRatio(width, height) === p.label
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-400'
                    : 'border-border-dark/50 text-text-muted hover:border-teal-500/30 hover:text-text-primary'
                }`}
                id={`preset-${p.label.replace(':', '-')}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div class="grid grid-cols-2 gap-3">
            <ResultStat label="Ratio" value={width > 0 && height > 0 ? `${sw}:${sh}` : '—'} />
            <ResultStat label="Decimal" value={width > 0 && height > 0 ? decimal.toFixed(4) : '—'} />
            <ResultStat label="Orientation" value={width > 0 && height > 0 ? orient : '—'} mono={false} />
            <ResultStat label="Pixels" value={width > 0 && height > 0 ? `${(width * height).toLocaleString()}` : '—'} />
          </div>

          {/* Nearest Common Ratios */}
          {nearest.length > 0 && (
            <div class="p-4 bg-surface rounded-xl border border-border-dark/50">
              <h3 class="text-xs text-text-muted uppercase tracking-wider mb-3">Nearest Common Ratios</h3>
              <div class="space-y-2">
                {nearest.map((match, i) => {
                  // Compute target dimensions: keep the larger dimension, compute the other
                  const targetW = width >= height
                    ? width
                    : resizeToDimension(match.ratio.w, match.ratio.h, height, 'height');
                  const targetH = width >= height
                    ? resizeToDimension(match.ratio.w, match.ratio.h, width, 'width')
                    : height;

                  return (
                    <button
                      key={match.ratio.label}
                      onClick={() => {
                        setWidth(targetW);
                        setHeight(targetH);
                      }}
                      class={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-all duration-150 cursor-pointer text-left ${
                        i === 0
                          ? 'bg-teal-500/5 border border-teal-500/20 hover:bg-teal-500/10'
                          : 'hover:bg-surface-2 border border-transparent'
                      }`}
                      title={`Apply ${match.ratio.label} → ${targetW}×${targetH}`}
                    >
                      <div class="flex items-center gap-3">
                        <span class="font-mono text-sm text-text-primary font-medium w-12">{match.ratio.label}</span>
                        <ConfidenceBadge confidence={match.confidence} />
                        <span class="text-[11px] font-mono text-text-muted/60">
                          {targetW} × {targetH}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-text-muted">
                          {match.difference === 0 ? 'exact match' : `${match.difference}% off`}
                        </span>
                        <svg class="w-3.5 h-3.5 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Preview Sidebar */}
        <div class="space-y-5">
          <div class="p-5 bg-surface rounded-xl border border-border-dark/50 flex flex-col items-center">
            <h3 class="text-xs text-text-muted uppercase tracking-wider mb-4 self-start">Proportion Preview</h3>
            <RatioPreview w={width} h={height} />
          </div>

          {/* Quick Actions */}
          <div class="p-4 bg-surface rounded-xl border border-border-dark/50 space-y-3">
            <h3 class="text-xs text-text-muted uppercase tracking-wider mb-2">Quick Actions</h3>
            <a
              href={`/image`}
              class="flex items-center gap-2 px-3 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Analyze an image
            </a>
            <a
              href={`/crop`}
              class="flex items-center gap-2 px-3 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M6.13 1L6 16a2 2 0 002 2h15" />
                <path d="M1 6.13L16 6a2 2 0 012 2v15" />
              </svg>
              Crop & resize
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
