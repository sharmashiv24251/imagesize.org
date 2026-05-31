/**
 * ratios.ts — Typed content collection for common aspect ratios.
 * Central source of truth for all ratio data used across pages.
 */

export interface RatioEntry {
  /** Display label, e.g. "16:9" */
  label: string;
  /** Ratio width component */
  w: number;
  /** Ratio height component */
  h: number;
  /** Decimal value (w/h) */
  decimal: number;
  /** Category tag */
  category: 'video' | 'photo' | 'social' | 'cinema' | 'screen' | 'print';
  /** Friendly name */
  name: string;
  /** Brief description of where this ratio is used */
  description: string;
  /** Common resolutions at this ratio */
  commonResolutions: { w: number; h: number; label: string }[];
  /** SEO-friendly slug for future /ratio/[slug] pages */
  slug: string;
  /** Tier for indexing: 1 = hand-quality, 2 = substantive, 3 = programmatic */
  tier: 1 | 2 | 3;
}

export const ratios: RatioEntry[] = [
  {
    label: '16:9',
    w: 16,
    h: 9,
    decimal: 1.7778,
    category: 'video',
    name: 'Widescreen (16:9)',
    slug: '16-9',
    tier: 1,
    description: 'The widescreen standard used by YouTube, HDTV (1080p, 4K), most monitors, and presentation slides.',
    commonResolutions: [
      { w: 1280, h: 720, label: '720p HD' },
      { w: 1920, h: 1080, label: '1080p Full HD' },
      { w: 2560, h: 1440, label: '1440p QHD' },
      { w: 3840, h: 2160, label: '4K UHD' },
      { w: 7680, h: 4320, label: '8K UHD' },
    ],
  },
  {
    label: '4:3',
    w: 4,
    h: 3,
    decimal: 1.3333,
    category: 'photo',
    name: 'Classic (4:3)',
    slug: '4-3',
    tier: 1,
    description: 'The classic format for standard definition TV, iPad screens, and many presentations.',
    commonResolutions: [
      { w: 640, h: 480, label: 'VGA' },
      { w: 800, h: 600, label: 'SVGA' },
      { w: 1024, h: 768, label: 'XGA' },
      { w: 1600, h: 1200, label: 'UXGA' },
      { w: 2048, h: 1536, label: 'iPad Retina' },
    ],
  },
  {
    label: '21:9',
    w: 21,
    h: 9,
    decimal: 2.3333,
    category: 'cinema',
    name: 'Ultrawide (21:9)',
    slug: '21-9',
    tier: 1,
    description: 'Cinematic ultrawide format used in feature films and ultrawide monitors.',
    commonResolutions: [
      { w: 2560, h: 1080, label: 'UWFHD' },
      { w: 3440, h: 1440, label: 'UWQHD' },
      { w: 5120, h: 2160, label: 'UW5K' },
    ],
  },
  {
    label: '9:16',
    w: 9,
    h: 16,
    decimal: 0.5625,
    category: 'social',
    name: 'Vertical (9:16)',
    slug: '9-16',
    tier: 1,
    description: 'The vertical video standard for Instagram Reels, TikTok, YouTube Shorts, and Stories.',
    commonResolutions: [
      { w: 720, h: 1280, label: '720p vertical' },
      { w: 1080, h: 1920, label: '1080p vertical' },
    ],
  },
  {
    label: '1:1',
    w: 1,
    h: 1,
    decimal: 1,
    category: 'social',
    name: 'Square (1:1)',
    slug: '1-1',
    tier: 1,
    description: 'Square format used for Instagram posts, profile pictures, and app icons.',
    commonResolutions: [
      { w: 1080, h: 1080, label: 'Instagram square' },
      { w: 2048, h: 2048, label: 'High-res square' },
    ],
  },
  {
    label: '3:2',
    w: 3,
    h: 2,
    decimal: 1.5,
    category: 'photo',
    name: 'Photography (3:2)',
    slug: '3-2',
    tier: 1,
    description: 'The standard 35mm film and DSLR photography format. Used by most digital cameras.',
    commonResolutions: [
      { w: 1500, h: 1000, label: '1.5MP' },
      { w: 3000, h: 2000, label: '6MP' },
      { w: 6000, h: 4000, label: '24MP' },
    ],
  },
  {
    label: '16:10',
    w: 16,
    h: 10,
    decimal: 1.6,
    category: 'screen',
    name: 'Widescreen (16:10)',
    slug: '16-10',
    tier: 2,
    description: 'A slightly taller widescreen ratio used by MacBook displays and some business monitors.',
    commonResolutions: [
      { w: 1280, h: 800, label: 'WXGA' },
      { w: 1440, h: 900, label: 'WSXGA' },
      { w: 1680, h: 1050, label: 'WSXGA+' },
      { w: 1920, h: 1200, label: 'WUXGA' },
      { w: 2560, h: 1600, label: 'WQXGA' },
    ],
  },
  {
    label: '5:4',
    w: 5,
    h: 4,
    decimal: 1.25,
    category: 'print',
    name: 'Print (5:4)',
    slug: '5-4',
    tier: 2,
    description: 'Common in print photography (8×10 inch) and some older LCD monitors.',
    commonResolutions: [
      { w: 1280, h: 1024, label: 'SXGA' },
      { w: 2560, h: 2048, label: 'QSXGA' },
    ],
  },
  {
    label: '4:5',
    w: 4,
    h: 5,
    decimal: 0.8,
    category: 'social',
    name: 'Instagram Portrait (4:5)',
    slug: '4-5',
    tier: 2,
    description: 'The tallest ratio Instagram supports in the feed. Maximizes screen real estate on mobile.',
    commonResolutions: [
      { w: 1080, h: 1350, label: 'Instagram portrait' },
    ],
  },
  {
    label: '2:3',
    w: 2,
    h: 3,
    decimal: 0.6667,
    category: 'photo',
    name: 'Portrait (2:3)',
    slug: '2-3',
    tier: 2,
    description: 'Portrait orientation of the 3:2 photography ratio. Used in Pinterest pins and portrait prints.',
    commonResolutions: [
      { w: 1000, h: 1500, label: 'Pinterest pin' },
      { w: 4000, h: 6000, label: '24MP portrait' },
    ],
  },
  {
    label: '7:5',
    w: 7,
    h: 5,
    decimal: 1.4,
    category: 'photo',
    name: 'Photo (7:5)',
    slug: '7-5',
    tier: 2,
    description: 'Classic 5×7 inch print ratio. A common enlargement size in photography.',
    commonResolutions: [
      { w: 2100, h: 1500, label: '5×7 at 300dpi' },
    ],
  },
  {
    label: '32:9',
    w: 32,
    h: 9,
    decimal: 3.5556,
    category: 'screen',
    name: 'Super Ultrawide (32:9)',
    slug: '32-9',
    tier: 2,
    description: 'Super ultrawide ratio for dual-monitor-equivalent displays like the Samsung Odyssey G9.',
    commonResolutions: [
      { w: 3840, h: 1080, label: 'DFHD' },
      { w: 5120, h: 1440, label: 'DQHD' },
    ],
  },
  {
    label: '1.85:1',
    w: 185,
    h: 100,
    decimal: 1.85,
    category: 'cinema',
    name: 'Academy Flat (1.85:1)',
    slug: '1-85-1',
    tier: 2,
    description: 'The standard American cinema widescreen format. Used by most non-anamorphic theatrical releases.',
    commonResolutions: [
      { w: 1998, h: 1080, label: 'DCI 2K Flat' },
      { w: 3996, h: 2160, label: 'DCI 4K Flat' },
    ],
  },
  {
    label: '2.39:1',
    w: 239,
    h: 100,
    decimal: 2.39,
    category: 'cinema',
    name: 'Anamorphic Scope (2.39:1)',
    slug: '2-39-1',
    tier: 2,
    description: 'The anamorphic widescreen cinema format. Used by blockbusters for an immersive theatrical look.',
    commonResolutions: [
      { w: 2048, h: 858, label: 'DCI 2K Scope' },
      { w: 4096, h: 1716, label: 'DCI 4K Scope' },
    ],
  },
];

/** Look up a ratio by slug */
export function getRatioBySlug(slug: string): RatioEntry | undefined {
  return ratios.find((r) => r.slug === slug);
}

/** Get all tier-1 ratios */
export function getTier1Ratios(): RatioEntry[] {
  return ratios.filter((r) => r.tier === 1);
}

/** Get ratios by category */
export function getRatiosByCategory(category: RatioEntry['category']): RatioEntry[] {
  return ratios.filter((r) => r.category === category);
}
