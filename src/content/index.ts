/**
 * index.ts — Central export for all content collections.
 * Import from 'content/' to access any collection.
 */

export { ratios, getRatioBySlug, getTier1Ratios, getRatiosByCategory } from './ratios';
export type { RatioEntry } from './ratios';

export { devices, getDevicesByCategory, getDeviceBySlug } from './devices';
export type { DeviceEntry } from './devices';

export { platforms, getPlatformBySlug, getPlatformsByTier } from './platforms';
export type { PlatformEntry, PlatformSize } from './platforms';

export { paperSizes, getPaperSizesBySeries, getPaperSizeBySlug, paperSizeToPixels } from './paperSizes';
export type { PaperSizeEntry } from './paperSizes';
