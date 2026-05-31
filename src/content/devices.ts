/**
 * devices.ts — Typed content collection for device screen specifications.
 * Used for image compatibility checking and device reference pages.
 */

export interface DeviceEntry {
  /** Unique slug for URL */
  slug: string;
  /** Display name */
  name: string;
  /** Manufacturer */
  brand: string;
  /** Device category */
  category: 'phone' | 'tablet' | 'laptop' | 'monitor' | 'tv';
  /** Screen width in pixels */
  screenWidth: number;
  /** Screen height in pixels */
  screenHeight: number;
  /** Pixels per inch (approximate) */
  ppi: number;
  /** Screen diagonal in inches */
  screenSize: number;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Aspect ratio label */
  aspectRatio: string;
  /** Year released */
  year: number;
  /** Indexing tier */
  tier: 1 | 2 | 3;
}

export const devices: DeviceEntry[] = [
  // Phones
  {
    slug: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    category: 'phone',
    screenWidth: 1320,
    screenHeight: 2868,
    ppi: 460,
    screenSize: 6.9,
    devicePixelRatio: 3,
    aspectRatio: '9:19.5',
    year: 2024,
    tier: 2,
  },
  {
    slug: 'iphone-16',
    name: 'iPhone 16',
    brand: 'Apple',
    category: 'phone',
    screenWidth: 1179,
    screenHeight: 2556,
    ppi: 460,
    screenSize: 6.1,
    devicePixelRatio: 3,
    aspectRatio: '9:19.5',
    year: 2024,
    tier: 2,
  },
  {
    slug: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'phone',
    screenWidth: 1440,
    screenHeight: 3120,
    ppi: 505,
    screenSize: 6.8,
    devicePixelRatio: 4,
    aspectRatio: '9:19.5',
    year: 2024,
    tier: 2,
  },
  {
    slug: 'google-pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    brand: 'Google',
    category: 'phone',
    screenWidth: 1280,
    screenHeight: 2856,
    ppi: 486,
    screenSize: 6.3,
    devicePixelRatio: 3,
    aspectRatio: '9:20',
    year: 2024,
    tier: 2,
  },

  // Tablets
  {
    slug: 'ipad-pro-13-m4',
    name: 'iPad Pro 13" (M4)',
    brand: 'Apple',
    category: 'tablet',
    screenWidth: 2064,
    screenHeight: 2752,
    ppi: 264,
    screenSize: 13,
    devicePixelRatio: 2,
    aspectRatio: '3:4',
    year: 2024,
    tier: 2,
  },
  {
    slug: 'ipad-air-11-m2',
    name: 'iPad Air 11" (M2)',
    brand: 'Apple',
    category: 'tablet',
    screenWidth: 1640,
    screenHeight: 2360,
    ppi: 264,
    screenSize: 10.9,
    devicePixelRatio: 2,
    aspectRatio: '41:59',
    year: 2024,
    tier: 3,
  },

  // Laptops
  {
    slug: 'macbook-pro-16-m3',
    name: 'MacBook Pro 16" (M3)',
    brand: 'Apple',
    category: 'laptop',
    screenWidth: 3456,
    screenHeight: 2234,
    ppi: 254,
    screenSize: 16.2,
    devicePixelRatio: 2,
    aspectRatio: '16:10.3',
    year: 2023,
    tier: 2,
  },
  {
    slug: 'macbook-air-15-m3',
    name: 'MacBook Air 15" (M3)',
    brand: 'Apple',
    category: 'laptop',
    screenWidth: 2880,
    screenHeight: 1864,
    ppi: 224,
    screenSize: 15.3,
    devicePixelRatio: 2,
    aspectRatio: '16:10.3',
    year: 2024,
    tier: 2,
  },

  // Monitors
  {
    slug: 'apple-studio-display',
    name: 'Apple Studio Display',
    brand: 'Apple',
    category: 'monitor',
    screenWidth: 5120,
    screenHeight: 2880,
    ppi: 218,
    screenSize: 27,
    devicePixelRatio: 2,
    aspectRatio: '16:9',
    year: 2022,
    tier: 2,
  },
  {
    slug: 'dell-ultrasharp-u2723qe',
    name: 'Dell UltraSharp U2723QE',
    brand: 'Dell',
    category: 'monitor',
    screenWidth: 3840,
    screenHeight: 2160,
    ppi: 163,
    screenSize: 27,
    devicePixelRatio: 1,
    aspectRatio: '16:9',
    year: 2022,
    tier: 3,
  },
];

/** Get devices by category */
export function getDevicesByCategory(category: DeviceEntry['category']): DeviceEntry[] {
  return devices.filter((d) => d.category === category);
}

/** Get device by slug */
export function getDeviceBySlug(slug: string): DeviceEntry | undefined {
  return devices.find((d) => d.slug === slug);
}
