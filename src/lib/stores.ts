/**
 * stores.ts — Cross-island shared state via nanostores.
 */
import { atom, computed } from 'nanostores';
import { simplify, decimalRatio, orientation, nearestCommonRatios, formatRatio } from './ratio';

/** Current width input */
export const $width = atom<number>(1920);

/** Current height input */
export const $height = atom<number>(1080);

/** Current calculator mode */
export const $mode = atom<'dimensions' | 'ratio-width' | 'ratio-height'>('dimensions');

/** Selected target ratio for ratio mode */
export const $targetRatioW = atom<number>(16);
export const $targetRatioH = atom<number>(9);

/** Simplified ratio */
export const $simplified = computed([$width, $height], (w, h) => {
  if (w <= 0 || h <= 0) return [0, 0] as [number, number];
  return simplify(w, h);
});

/** Decimal ratio */
export const $decimal = computed([$width, $height], (w, h) => {
  return decimalRatio(w, h);
});

/** Orientation */
export const $orientation = computed([$width, $height], (w, h) => {
  return orientation(w, h);
});

/** Formatted ratio */
export const $formattedRatio = computed([$width, $height], (w, h) => {
  return formatRatio(w, h);
});

/** Nearest common ratios */
export const $nearestRatios = computed([$width, $height], (w, h) => {
  return nearestCommonRatios(w, h, 5);
});

/** Theme state */
export const $theme = atom<'dark' | 'light'>('dark');

/** Image data for cross-tool sharing */
export const $imageData = atom<{
  src: string;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  fileType: string;
} | null>(null);
