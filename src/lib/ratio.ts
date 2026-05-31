/**
 * ratio.ts — Pure math functions for aspect ratio calculations.
 * No side effects, no DOM. Unit-testable.
 */

export interface CommonRatio {
  label: string;
  w: number;
  h: number;
  decimal: number;
  category: 'video' | 'photo' | 'social' | 'cinema' | 'screen' | 'print' | 'display-ad';
}

export interface NearestMatch {
  ratio: CommonRatio;
  difference: number; // percentage
  confidence: 'exact' | 'very close' | 'close' | 'approximate';
}

export type Orientation = 'Landscape' | 'Portrait' | 'Square';

/** Curated common aspect ratios — expanded with cinema, print, and display */
export const commonRatios: CommonRatio[] = [
  // Social
  { label: '1:1', w: 1, h: 1, decimal: 1, category: 'social' },
  { label: '4:5', w: 4, h: 5, decimal: 0.8, category: 'social' },
  { label: '9:16', w: 9, h: 16, decimal: 0.5625, category: 'social' },
  { label: '3:4', w: 3, h: 4, decimal: 0.75, category: 'social' },
  { label: '3:1', w: 3, h: 1, decimal: 3, category: 'social' },
  { label: '1:3', w: 1, h: 3, decimal: 0.3333, category: 'social' },

  // Photo
  { label: '4:3', w: 4, h: 3, decimal: 1.3333, category: 'photo' },
  { label: '3:2', w: 3, h: 2, decimal: 1.5, category: 'photo' },
  { label: '2:3', w: 2, h: 3, decimal: 0.6667, category: 'photo' },
  { label: '7:5', w: 7, h: 5, decimal: 1.4, category: 'photo' },
  { label: '5:7', w: 5, h: 7, decimal: 0.7143, category: 'photo' },

  // Video
  { label: '16:9', w: 16, h: 9, decimal: 1.7778, category: 'video' },

  // Screen
  { label: '16:10', w: 16, h: 10, decimal: 1.6, category: 'screen' },
  { label: '5:3', w: 5, h: 3, decimal: 1.6667, category: 'screen' },
  { label: '32:9', w: 32, h: 9, decimal: 3.5556, category: 'screen' },
  { label: '9:19.5', w: 9, h: 19.5, decimal: 0.4615, category: 'screen' },
  { label: '21:9', w: 21, h: 9, decimal: 2.3333, category: 'screen' },

  // Cinema — expanded
  { label: '1.375:1', w: 1375, h: 1000, decimal: 1.375, category: 'cinema' },
  { label: '1.43:1', w: 143, h: 100, decimal: 1.43, category: 'cinema' },
  { label: '1.66:1', w: 166, h: 100, decimal: 1.66, category: 'cinema' },
  { label: '1.85:1', w: 185, h: 100, decimal: 1.85, category: 'cinema' },
  { label: '2:1', w: 2, h: 1, decimal: 2, category: 'cinema' },
  { label: '2.35:1', w: 235, h: 100, decimal: 2.35, category: 'cinema' },
  { label: '2.39:1', w: 239, h: 100, decimal: 2.39, category: 'cinema' },
  { label: '2.76:1', w: 276, h: 100, decimal: 2.76, category: 'cinema' },

  // Print
  { label: '5:4', w: 5, h: 4, decimal: 1.25, category: 'print' },
  { label: 'A-series 1.414:1', w: 1414, h: 1000, decimal: 1.414, category: 'print' },
  { label: 'Letter 8.5×11', w: 8.5, h: 11, decimal: 0.7727, category: 'print' },
  { label: 'Letter landscape', w: 11, h: 8.5, decimal: 1.2941, category: 'print' },
  { label: 'Tabloid 11×17', w: 11, h: 17, decimal: 0.6471, category: 'print' },
  { label: 'Tabloid landscape', w: 17, h: 11, decimal: 1.5455, category: 'print' },
  { label: '4:1', w: 4, h: 1, decimal: 4, category: 'print' },
  { label: '5.9:1', w: 59, h: 10, decimal: 5.9, category: 'print' },

  // Display ads
  { label: '728×90 Leaderboard', w: 728, h: 90, decimal: 8.0889, category: 'display-ad' },
  { label: '970×250 Billboard', w: 970, h: 250, decimal: 3.88, category: 'display-ad' },
  { label: '300×250 Medium Rectangle', w: 300, h: 250, decimal: 1.2, category: 'display-ad' },
  { label: '336×280 Large Rectangle', w: 336, h: 280, decimal: 1.2, category: 'display-ad' },
  { label: '300×600 Half Page', w: 300, h: 600, decimal: 0.5, category: 'display-ad' },
  { label: '160×600 Wide Skyscraper', w: 160, h: 600, decimal: 0.2667, category: 'display-ad' },
];

/** Greatest Common Divisor (Euclidean algorithm) */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/** Simplify width × height to smallest integer ratio */
export function simplify(w: number, h: number): [number, number] {
  if (w <= 0 || h <= 0) return [0, 0];
  const d = gcd(w, h);
  return [w / d, h / d];
}

/** Decimal ratio (w/h) rounded to 4 decimal places */
export function decimalRatio(w: number, h: number): number {
  if (h === 0) return 0;
  return Math.round((w / h) * 10000) / 10000;
}

/** Determine orientation */
export function orientation(w: number, h: number): Orientation {
  if (w > h) return 'Landscape';
  if (h > w) return 'Portrait';
  return 'Square';
}

/** Find nearest common ratios ranked by % difference */
export function nearestCommonRatios(w: number, h: number, limit = 5): NearestMatch[] {
  if (w <= 0 || h <= 0) return [];

  const decimal = w / h;

  return commonRatios
    .map((ratio) => {
      const diff = Math.abs((decimal - ratio.decimal) / ratio.decimal) * 100;
      let confidence: NearestMatch['confidence'];
      if (diff < 0.1) confidence = 'exact';
      else if (diff < 1) confidence = 'very close';
      else if (diff < 5) confidence = 'close';
      else confidence = 'approximate';

      return { ratio, difference: Math.round(diff * 100) / 100, confidence };
    })
    .sort((a, b) => a.difference - b.difference)
    .slice(0, limit);
}

/** Compute the missing dimension given a ratio and one known dimension */
export function resizeToDimension(
  ratioW: number,
  ratioH: number,
  knownValue: number,
  knownIs: 'width' | 'height'
): number {
  if (knownIs === 'width') {
    return Math.round((knownValue * ratioH) / ratioW);
  }
  return Math.round((knownValue * ratioW) / ratioH);
}

/** Scale dimensions while maintaining ratio */
export function scaleDimensions(
  w: number,
  h: number,
  targetW?: number,
  targetH?: number
): { width: number; height: number } {
  if (targetW) {
    return { width: targetW, height: Math.round((targetW * h) / w) };
  }
  if (targetH) {
    return { width: Math.round((targetH * w) / h), height: targetH };
  }
  return { width: w, height: h };
}

/** Format ratio string, e.g. "16:9" */
export function formatRatio(w: number, h: number): string {
  const [sw, sh] = simplify(w, h);
  return `${sw}:${sh}`;
}

/** Parse a ratio string like "16:9" into [w, h] */
export function parseRatio(ratioStr: string): [number, number] | null {
  const parts = ratioStr.split(':').map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return [parts[0], parts[1]];
}

/** Calculate crop dimensions for a target ratio */
export function calculateCrop(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number
): { x: number; y: number; width: number; height: number } {
  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;

  if (srcRatio > targetRatio) {
    // Source is wider — crop horizontally
    const newW = Math.round(srcH * targetRatio);
    return { x: Math.round((srcW - newW) / 2), y: 0, width: newW, height: srcH };
  } else {
    // Source is taller — crop vertically
    const newH = Math.round(srcW / targetRatio);
    return { x: 0, y: Math.round((srcH - newH) / 2), width: srcW, height: newH };
  }
}

/** Calculate crop dimensions with a movable focal point. focusX/Y are clamped 0..1. */
export function calculateCropWithFocus(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  focusX = 0.5,
  focusY = 0.5
): { x: number; y: number; width: number; height: number } {
  const base = calculateCrop(srcW, srcH, targetW, targetH);
  const clampedX = Math.min(1, Math.max(0, focusX));
  const clampedY = Math.min(1, Math.max(0, focusY));

  return {
    ...base,
    x: Math.round((srcW - base.width) * clampedX),
    y: Math.round((srcH - base.height) * clampedY),
  };
}

/** Calculate padding needed to fit into target ratio */
export function calculatePadding(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number
): { top: number; right: number; bottom: number; left: number; totalW: number; totalH: number } {
  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;

  if (srcRatio > targetRatio) {
    // Source is wider — add padding top/bottom
    const newH = Math.round(srcW / targetRatio);
    const padTotal = newH - srcH;
    const padTop = Math.floor(padTotal / 2);
    return { top: padTop, right: 0, bottom: padTotal - padTop, left: 0, totalW: srcW, totalH: newH };
  } else {
    // Source is taller — add padding left/right
    const newW = Math.round(srcH * targetRatio);
    const padTotal = newW - srcW;
    const padLeft = Math.floor(padTotal / 2);
    return { top: 0, right: padTotal - padLeft, bottom: 0, left: padLeft, totalW: newW, totalH: srcH };
  }
}

// ─── Unit Conversion ───

export type DimensionUnit = 'px' | 'mm' | 'in' | 'cm';

/** Convert pixels to physical units at a given DPI */
export function pxToPhysical(px: number, dpi: number, unit: DimensionUnit): number {
  if (unit === 'px') return px;
  const inches = px / dpi;
  if (unit === 'in') return Math.round(inches * 1000) / 1000;
  if (unit === 'mm') return Math.round(inches * 25.4 * 100) / 100;
  if (unit === 'cm') return Math.round(inches * 2.54 * 100) / 100;
  return px;
}

/** Convert physical units to pixels at a given DPI */
export function physicalToPx(value: number, dpi: number, unit: DimensionUnit): number {
  if (unit === 'px') return Math.round(value);
  if (unit === 'in') return Math.round(value * dpi);
  if (unit === 'mm') return Math.round((value / 25.4) * dpi);
  if (unit === 'cm') return Math.round((value / 2.54) * dpi);
  return Math.round(value);
}

/** Format a physical dimension with unit suffix */
export function formatPhysical(px: number, dpi: number, unit: DimensionUnit): string {
  const val = pxToPhysical(px, dpi, unit);
  const suffixes: Record<DimensionUnit, string> = { px: 'px', mm: 'mm', in: '"', cm: 'cm' };
  return `${val}${suffixes[unit]}`;
}

export function convertDimensionUnit(
  value: number,
  from: DimensionUnit,
  to: DimensionUnit,
  dpi: number
): number {
  if (from === to) return value;
  const px = physicalToPx(value, dpi, from);
  return pxToPhysical(px, dpi, to);
}
