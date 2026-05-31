/**
 * platforms.ts — Typed content collection for social media / platform size requirements.
 * Used by the Image Analyzer compatibility grid and future platform-specific pages.
 */

export interface PlatformSize {
  /** Format label, e.g. "YouTube Thumbnail" */
  label: string;
  /** Recommended width */
  width: number;
  /** Recommended height */
  height: number;
  /** Target aspect ratio string */
  aspectRatio: string;
}

export interface PlatformEntry {
  /** URL slug */
  slug: string;
  /** Platform name */
  name: string;
  /** Platform icon class or identifier */
  icon: string;
  /** All supported size formats */
  sizes: PlatformSize[];
  /** Brief description */
  description: string;
  /** Indexing tier */
  tier: 1 | 2 | 3;
}

export const platforms: PlatformEntry[] = [
  {
    slug: 'youtube',
    name: 'YouTube',
    icon: 'youtube',
    tier: 2,
    description: 'Video platform requiring 16:9 for standard videos and specific sizes for thumbnails, banners, and shorts.',
    sizes: [
      { label: 'Video (HD)', width: 1920, height: 1080, aspectRatio: '16:9' },
      { label: 'Video (4K)', width: 3840, height: 2160, aspectRatio: '16:9' },
      { label: 'Thumbnail', width: 1280, height: 720, aspectRatio: '16:9' },
      { label: 'Shorts', width: 1080, height: 1920, aspectRatio: '9:16' },
      { label: 'Channel Banner', width: 2560, height: 1440, aspectRatio: '16:9' },
      { label: 'Channel Icon', width: 800, height: 800, aspectRatio: '1:1' },
    ],
  },
  {
    slug: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    tier: 2,
    description: 'Social platform supporting square, landscape, portrait, and vertical story/reel formats.',
    sizes: [
      { label: 'Post (Square)', width: 1080, height: 1080, aspectRatio: '1:1' },
      { label: 'Post (Landscape)', width: 1080, height: 566, aspectRatio: '1.91:1' },
      { label: 'Post (Portrait)', width: 1080, height: 1350, aspectRatio: '4:5' },
      { label: 'Story / Reel', width: 1080, height: 1920, aspectRatio: '9:16' },
      { label: 'Profile Photo', width: 320, height: 320, aspectRatio: '1:1' },
    ],
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    icon: 'tiktok',
    tier: 2,
    description: 'Short-form video platform optimized for vertical 9:16 content.',
    sizes: [
      { label: 'Video', width: 1080, height: 1920, aspectRatio: '9:16' },
      { label: 'Profile Photo', width: 200, height: 200, aspectRatio: '1:1' },
    ],
  },
  {
    slug: 'x-twitter',
    name: 'Twitter/X',
    icon: 'twitter',
    tier: 2,
    description: 'Microblogging platform with specific image sizes for posts, headers, and profile pictures.',
    sizes: [
      { label: 'Post Image', width: 1200, height: 675, aspectRatio: '16:9' },
      { label: 'Header / Banner', width: 1500, height: 500, aspectRatio: '3:1' },
      { label: 'Profile Photo', width: 400, height: 400, aspectRatio: '1:1' },
    ],
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    tier: 2,
    description: 'Professional network with sizes for posts, banners, and company page images.',
    sizes: [
      { label: 'Post Image', width: 1200, height: 628, aspectRatio: '1.91:1' },
      { label: 'Personal Cover', width: 1584, height: 396, aspectRatio: '4:1' },
      { label: 'Page Cover', width: 4200, height: 700, aspectRatio: '6:1' },
      { label: 'Company Banner', width: 1128, height: 191, aspectRatio: '5.9:1' },
      { label: 'Profile Photo', width: 400, height: 400, aspectRatio: '1:1' },
    ],
  },
  {
    slug: 'google-forms',
    name: 'Google Forms',
    icon: 'form',
    tier: 2,
    description: 'Form header image templates and practical crop sizes for Google Forms themes.',
    sizes: [
      { label: 'Header Image', width: 1600, height: 400, aspectRatio: '4:1' },
    ],
  },
  {
    slug: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    tier: 2,
    description: 'Social platform with varied image requirements for posts, stories, covers, and ads.',
    sizes: [
      { label: 'Post Image', width: 1200, height: 630, aspectRatio: '1.91:1' },
      { label: 'Story', width: 1080, height: 1920, aspectRatio: '9:16' },
      { label: 'Cover Photo', width: 820, height: 312, aspectRatio: '2.63:1' },
      { label: 'Profile Photo', width: 170, height: 170, aspectRatio: '1:1' },
      { label: 'Event Cover', width: 1920, height: 1005, aspectRatio: '1.91:1' },
    ],
  },
  {
    slug: 'pinterest',
    name: 'Pinterest',
    icon: 'pinterest',
    tier: 2,
    description: 'Visual discovery platform favoring tall, vertical pin formats.',
    sizes: [
      { label: 'Standard Pin', width: 1000, height: 1500, aspectRatio: '2:3' },
      { label: 'Square Pin', width: 1000, height: 1000, aspectRatio: '1:1' },
      { label: 'Long Pin', width: 1000, height: 2100, aspectRatio: '1:2.1' },
      { label: 'Profile Photo', width: 165, height: 165, aspectRatio: '1:1' },
    ],
  },
  {
    slug: 'twitch',
    name: 'Twitch',
    icon: 'twitch',
    tier: 3,
    description: 'Live streaming platform with overlay and banner size requirements.',
    sizes: [
      { label: 'Stream', width: 1920, height: 1080, aspectRatio: '16:9' },
      { label: 'Offline Banner', width: 1920, height: 1080, aspectRatio: '16:9' },
      { label: 'Profile Banner', width: 1200, height: 480, aspectRatio: '5:2' },
      { label: 'Profile Photo', width: 256, height: 256, aspectRatio: '1:1' },
    ],
  },
];

/** Get platform by slug */
export function getPlatformBySlug(slug: string): PlatformEntry | undefined {
  return platforms.find((p) => p.slug === slug);
}

/** Get all platforms by tier */
export function getPlatformsByTier(tier: 1 | 2 | 3): PlatformEntry[] {
  return platforms.filter((p) => p.tier <= tier);
}
