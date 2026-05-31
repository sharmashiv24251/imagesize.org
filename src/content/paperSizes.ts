/**
 * paperSizes.ts — Typed content collection for paper sizes.
 * Used for PPI/print calculator and print reference pages.
 */

export interface PaperSizeEntry {
  /** URL slug */
  slug: string;
  /** Display name */
  name: string;
  /** Standard series (ISO A, ISO B, US, etc.) */
  series: 'iso-a' | 'iso-b' | 'us' | 'photo';
  /** Width in millimeters */
  widthMm: number;
  /** Height in millimeters */
  heightMm: number;
  /** Width in inches (rounded) */
  widthIn: number;
  /** Height in inches (rounded) */
  heightIn: number;
  /** Common use case description */
  description: string;
  /** Indexing tier */
  tier: 2 | 3;
}

export const paperSizes: PaperSizeEntry[] = [
  // ISO A series
  {
    slug: 'a0',
    name: 'A0',
    series: 'iso-a',
    widthMm: 841,
    heightMm: 1189,
    widthIn: 33.1,
    heightIn: 46.8,
    description: 'Posters, technical drawings, and architectural plans.',
    tier: 3,
  },
  {
    slug: 'a1',
    name: 'A1',
    series: 'iso-a',
    widthMm: 594,
    heightMm: 841,
    widthIn: 23.4,
    heightIn: 33.1,
    description: 'Large posters and flip charts.',
    tier: 3,
  },
  {
    slug: 'a2',
    name: 'A2',
    series: 'iso-a',
    widthMm: 420,
    heightMm: 594,
    widthIn: 16.5,
    heightIn: 23.4,
    description: 'Posters and diagrams.',
    tier: 3,
  },
  {
    slug: 'a3',
    name: 'A3',
    series: 'iso-a',
    widthMm: 297,
    heightMm: 420,
    widthIn: 11.7,
    heightIn: 16.5,
    description: 'Tabloid-size documents, large charts, and small posters.',
    tier: 2,
  },
  {
    slug: 'a4',
    name: 'A4',
    series: 'iso-a',
    widthMm: 210,
    heightMm: 297,
    widthIn: 8.27,
    heightIn: 11.69,
    description: 'Standard document size worldwide. Letters, forms, and laser printing.',
    tier: 2,
  },
  {
    slug: 'a5',
    name: 'A5',
    series: 'iso-a',
    widthMm: 148,
    heightMm: 210,
    widthIn: 5.83,
    heightIn: 8.27,
    description: 'Notebooks, booklets, and small flyers.',
    tier: 2,
  },
  {
    slug: 'a6',
    name: 'A6',
    series: 'iso-a',
    widthMm: 105,
    heightMm: 148,
    widthIn: 4.13,
    heightIn: 5.83,
    description: 'Postcards and small booklets.',
    tier: 3,
  },

  // US paper sizes
  {
    slug: 'letter',
    name: 'US Letter',
    series: 'us',
    widthMm: 216,
    heightMm: 279,
    widthIn: 8.5,
    heightIn: 11,
    description: 'Standard document size in North America.',
    tier: 2,
  },
  {
    slug: 'legal',
    name: 'US Legal',
    series: 'us',
    widthMm: 216,
    heightMm: 356,
    widthIn: 8.5,
    heightIn: 14,
    description: 'Legal documents and contracts in North America.',
    tier: 2,
  },
  {
    slug: 'tabloid',
    name: 'US Tabloid',
    series: 'us',
    widthMm: 279,
    heightMm: 432,
    widthIn: 11,
    heightIn: 17,
    description: 'Newspapers, large-format printing, and ledger sheets.',
    tier: 3,
  },

  // Common photo sizes
  {
    slug: 'photo-4x6',
    name: '4×6"',
    series: 'photo',
    widthMm: 102,
    heightMm: 152,
    widthIn: 4,
    heightIn: 6,
    description: 'Standard snapshot print size. Matches 3:2 ratio cameras.',
    tier: 2,
  },
  {
    slug: 'photo-5x7',
    name: '5×7"',
    series: 'photo',
    widthMm: 127,
    heightMm: 178,
    widthIn: 5,
    heightIn: 7,
    description: 'Popular enlargement size for framed photos.',
    tier: 2,
  },
  {
    slug: 'photo-8x10',
    name: '8×10"',
    series: 'photo',
    widthMm: 203,
    heightMm: 254,
    widthIn: 8,
    heightIn: 10,
    description: 'Classic portrait print size, 5:4 ratio.',
    tier: 2,
  },
];

/** Get paper sizes by series */
export function getPaperSizesBySeries(series: PaperSizeEntry['series']): PaperSizeEntry[] {
  return paperSizes.filter((p) => p.series === series);
}

/** Get paper size by slug */
export function getPaperSizeBySlug(slug: string): PaperSizeEntry | undefined {
  return paperSizes.find((p) => p.slug === slug);
}

/** Calculate pixel dimensions at given DPI */
export function paperSizeToPixels(size: PaperSizeEntry, dpi: number): { width: number; height: number } {
  return {
    width: Math.round(size.widthIn * dpi),
    height: Math.round(size.heightIn * dpi),
  };
}
