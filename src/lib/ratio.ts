/**
 * ratio.ts — Pure math functions for aspect ratio calculations.
 * No side effects, no DOM. Unit-testable.
 */

export interface CommonRatio {
  label: string;
  w: number;
  h: number;
  decimal: number;
  category: 'video' | 'photo' | 'social' | 'cinema' | 'screen' | 'print';
}

export interface NearestMatch {
  ratio: CommonRatio;
  difference: number; // percentage
  confidence: 'exact' | 'very close' | 'close' | 'approximate';
}

export type Orientation = 'Landscape' | 'Portrait' | 'Square';

/** Curated common aspect ratios */
export const commonRatios: CommonRatio[] = [
  { label: '1:1', w: 1, h: 1, decimal: 1, category: 'social' },
  { label: '4:3', w: 4, h: 3, decimal: 1.3333, category: 'photo' },
  { label: '3:2', w: 3, h: 2, decimal: 1.5, category: 'photo' },
  { label: '16:10', w: 16, h: 10, decimal: 1.6, category: 'screen' },
  { label: '5:3', w: 5, h: 3, decimal: 1.6667, category: 'screen' },
  { label: '16:9', w: 16, h: 9, decimal: 1.7778, category: 'video' },
  { label: '1.85:1', w: 185, h: 100, decimal: 1.85, category: 'cinema' },
  { label: '2:1', w: 2, h: 1, decimal: 2, category: 'cinema' },
  { label: '21:9', w: 21, h: 9, decimal: 2.3333, category: 'cinema' },
  { label: '32:9', w: 32, h: 9, decimal: 3.5556, category: 'screen' },
  { label: '9:16', w: 9, h: 16, decimal: 0.5625, category: 'social' },
  { label: '9:19.5', w: 9, h: 19.5, decimal: 0.4615, category: 'screen' },
  { label: '3:4', w: 3, h: 4, decimal: 0.75, category: 'social' },
  { label: '2:3', w: 2, h: 3, decimal: 0.6667, category: 'photo' },
  { label: '4:5', w: 4, h: 5, decimal: 0.8, category: 'social' },
  { label: '5:4', w: 5, h: 4, decimal: 1.25, category: 'print' },
  { label: '7:5', w: 7, h: 5, decimal: 1.4, category: 'photo' },
  { label: '3:1', w: 3, h: 1, decimal: 3, category: 'social' },
  { label: '1:3', w: 1, h: 3, decimal: 0.3333, category: 'social' },
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
