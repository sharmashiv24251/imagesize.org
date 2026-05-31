/**
 * platforms.ts — Comprehensive platform format database.
 * 100+ formats across social, professional, video, print, cinema, display ads, and screens.
 * Filterable by category, searchable by name, and shared by analyzer/resize tools.
 */

export type PlatformCategory = 'social' | 'professional' | 'video' | 'print' | 'cinema' | 'display-ads';

export interface PlatformFormat {
  platform: string;
  name: string;
  w: number;
  h: number;
  ratio: string;
  category: PlatformCategory;
  dpi?: number;
  safeZone?: string;
}

export interface PlatformPageFormat extends PlatformFormat {
  slug: string;
  aliases: string[];
  keyword: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getPlatformFormatSlug(format: PlatformFormat): string {
  return `${slugify(format.platform)}-${slugify(format.name)}-size`;
}

function getFormatAliases(format: PlatformFormat): string[] {
  const platform = slugify(format.platform);
  const name = slugify(format.name);
  const aliases = new Set<string>();

  aliases.add(`${platform}-${name}-resolution`);
  aliases.add(`${platform}-${name}-dimensions`);

  if (format.name.toLowerCase().includes('header') || format.name.toLowerCase().includes('cover') || format.name.toLowerCase().includes('banner')) {
    aliases.add(`${platform}-banner-size`);
    aliases.add(`${platform}-banner-resolution`);
    aliases.add(`${platform}-cover-size`);
  }

  if (format.platform === 'LinkedIn' && format.name === 'Personal Header') {
    aliases.add('linkedin-banner-size');
    aliases.add('linkedin-header-size');
    aliases.add('linkedin-background-photo-size');
  }

  if (format.platform === 'LinkedIn' && format.name === 'Company Cover') {
    aliases.add('linkedin-company-banner-size');
    aliases.add('linkedin-company-cover-size');
  }

  if (format.platform === 'YouTube' && format.name === 'Thumbnail') {
    aliases.add('youtube-thumbnail-size');
    aliases.add('youtube-thumbnail-resolution');
  }

  if (format.platform === 'Instagram' && format.name === 'Story / Reel') {
    aliases.add('instagram-reel-size');
    aliases.add('instagram-story-size');
  }

  return [...aliases];
}

export function getPlatformPageFormats(): PlatformPageFormat[] {
  const usedAliases = new Set<string>();

  return platformFormats.map((format) => {
    const slug = getPlatformFormatSlug(format);
    const aliases = getFormatAliases(format).filter((alias) => {
      if (alias === slug || usedAliases.has(alias)) return false;
      usedAliases.add(alias);
      return true;
    });

    return {
      ...format,
      slug,
      aliases,
      keyword: `${format.platform} ${format.name} size`,
    };
  });
}

export const platformFormats: PlatformFormat[] = [
  { platform: 'Instagram', name: 'Square Post', w: 1080, h: 1080, ratio: '1:1', category: 'social' },
  { platform: 'Instagram', name: 'Portrait Post', w: 1080, h: 1350, ratio: '4:5', category: 'social' },
  { platform: 'Instagram', name: 'Landscape Post', w: 1080, h: 566, ratio: '1.91:1', category: 'social' },
  { platform: 'Instagram', name: 'Story / Reel', w: 1080, h: 1920, ratio: '9:16', category: 'social' },
  { platform: 'Instagram', name: 'Profile Photo', w: 320, h: 320, ratio: '1:1', category: 'social' },
  { platform: 'Instagram', name: 'Carousel Slide', w: 1080, h: 1080, ratio: '1:1', category: 'social' },
  { platform: 'Instagram', name: 'IGTV Cover', w: 420, h: 654, ratio: '2:3', category: 'social' },
  { platform: 'Facebook', name: 'Post Image', w: 1200, h: 630, ratio: '1.91:1', category: 'social' },
  { platform: 'Facebook', name: 'Cover Photo', w: 820, h: 312, ratio: '2.63:1', category: 'social' },
  { platform: 'Facebook', name: 'Profile Photo', w: 170, h: 170, ratio: '1:1', category: 'social' },
  { platform: 'Facebook', name: 'Story', w: 1080, h: 1920, ratio: '9:16', category: 'social' },
  { platform: 'Facebook', name: 'Event Cover', w: 1920, h: 1005, ratio: '1.91:1', category: 'social' },
  { platform: 'Facebook', name: 'Group Cover', w: 1640, h: 856, ratio: '1.91:1', category: 'social' },
  { platform: 'Facebook', name: 'Link Preview', w: 1200, h: 628, ratio: '1.91:1', category: 'social' },
  { platform: 'Facebook', name: 'Ad (Single Image)', w: 1200, h: 628, ratio: '1.91:1', category: 'social' },
  { platform: 'Facebook', name: 'Ad (Square)', w: 1080, h: 1080, ratio: '1:1', category: 'social' },
  { platform: 'X (Twitter)', name: 'Post Image', w: 1600, h: 900, ratio: '16:9', category: 'social' },
  { platform: 'X (Twitter)', name: 'Profile Banner', w: 1500, h: 500, ratio: '3:1', category: 'social' },
  { platform: 'X (Twitter)', name: 'Profile Photo', w: 400, h: 400, ratio: '1:1', category: 'social' },
  { platform: 'X (Twitter)', name: 'Card Image', w: 1200, h: 628, ratio: '1.91:1', category: 'social' },
  { platform: 'LinkedIn', name: 'Personal Header', w: 1584, h: 396, ratio: '4:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Company Cover', w: 1128, h: 191, ratio: '5.9:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Company Logo', w: 300, h: 300, ratio: '1:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Square Logo', w: 60, h: 60, ratio: '1:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Post Image', w: 1200, h: 627, ratio: '1.91:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Portrait Post', w: 627, h: 1200, ratio: '1:1.91', category: 'professional' },
  { platform: 'LinkedIn', name: 'Article Cover', w: 1920, h: 1080, ratio: '16:9', category: 'professional' },
  { platform: 'LinkedIn', name: 'Carousel Slide', w: 1080, h: 1080, ratio: '1:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Event Banner', w: 1600, h: 900, ratio: '16:9', category: 'professional' },
  { platform: 'LinkedIn', name: 'Story', w: 1080, h: 1920, ratio: '9:16', category: 'professional' },
  { platform: 'LinkedIn', name: 'Sponsored Ad', w: 1200, h: 627, ratio: '1.91:1', category: 'professional' },
  { platform: 'YouTube', name: 'Thumbnail', w: 1280, h: 720, ratio: '16:9', category: 'video' },
  { platform: 'YouTube', name: 'Channel Banner', w: 2560, h: 1440, ratio: '16:9', category: 'video', safeZone: 'Safe area: 1546×423' },
  { platform: 'YouTube', name: 'Profile Photo', w: 800, h: 800, ratio: '1:1', category: 'video' },
  { platform: 'YouTube', name: 'Shorts', w: 1080, h: 1920, ratio: '9:16', category: 'video' },
  { platform: 'YouTube', name: 'Video (1080p)', w: 1920, h: 1080, ratio: '16:9', category: 'video' },
  { platform: 'YouTube', name: 'Video (4K)', w: 3840, h: 2160, ratio: '16:9', category: 'video' },
  { platform: 'YouTube', name: 'End Screen', w: 1280, h: 720, ratio: '16:9', category: 'video' },
  { platform: 'YouTube', name: 'Community Post', w: 1080, h: 1080, ratio: '1:1', category: 'video' },
  { platform: 'Twitch', name: 'Offline Banner', w: 1920, h: 1080, ratio: '16:9', category: 'video' },
  { platform: 'Twitch', name: 'Profile Banner', w: 1200, h: 480, ratio: '5:2', category: 'video' },
  { platform: 'Twitch', name: 'Panel', w: 320, h: 160, ratio: '2:1', category: 'video' },
  { platform: 'Twitch', name: 'Emote', w: 112, h: 112, ratio: '1:1', category: 'video' },
  { platform: 'Vimeo', name: 'Thumbnail', w: 1280, h: 720, ratio: '16:9', category: 'video' },
  { platform: 'Vimeo', name: 'Video (1080p)', w: 1920, h: 1080, ratio: '16:9', category: 'video' },
  { platform: 'Vimeo', name: 'Channel Cover', w: 1920, h: 540, ratio: '32:9', category: 'video', safeZone: 'Keep channel name and avatar clear of the center crop.' },
  { platform: 'TikTok', name: 'Video', w: 1080, h: 1920, ratio: '9:16', category: 'video' },
  { platform: 'TikTok', name: 'Profile Photo', w: 200, h: 200, ratio: '1:1', category: 'video' },
  { platform: 'TikTok', name: 'Horizontal Video', w: 1920, h: 1080, ratio: '16:9', category: 'video' },
  { platform: 'TikTok', name: 'Square Video', w: 1080, h: 1080, ratio: '1:1', category: 'video' },
  { platform: 'TikTok', name: 'Ad', w: 1080, h: 1920, ratio: '9:16', category: 'video' },
  { platform: 'Pinterest', name: 'Standard Pin', w: 1000, h: 1500, ratio: '2:3', category: 'social' },
  { platform: 'Pinterest', name: 'Square Pin', w: 1000, h: 1000, ratio: '1:1', category: 'social' },
  { platform: 'Pinterest', name: 'Long / Infographic Pin', w: 1000, h: 2100, ratio: '1:2.1', category: 'social' },
  { platform: 'Pinterest', name: 'Story Pin', w: 1080, h: 1920, ratio: '9:16', category: 'social' },
  { platform: 'Pinterest', name: 'Profile Photo', w: 165, h: 165, ratio: '1:1', category: 'social' },
  { platform: 'Pinterest', name: 'Board Cover', w: 600, h: 600, ratio: '1:1', category: 'social' },
  { platform: 'Snapchat', name: 'Snap / Story', w: 1080, h: 1920, ratio: '9:16', category: 'social' },
  { platform: 'Snapchat', name: 'Ad', w: 1080, h: 1920, ratio: '9:16', category: 'social' },
  { platform: 'Snapchat', name: 'Profile Photo', w: 320, h: 320, ratio: '1:1', category: 'social' },
  { platform: 'WhatsApp', name: 'Status', w: 1080, h: 1920, ratio: '9:16', category: 'social' },
  { platform: 'WhatsApp', name: 'Profile Photo', w: 500, h: 500, ratio: '1:1', category: 'social' },
  { platform: 'WhatsApp', name: 'Shared Image (portrait)', w: 1080, h: 1350, ratio: '4:5', category: 'social' },
  { platform: 'WhatsApp', name: 'Shared Image (landscape)', w: 1920, h: 1080, ratio: '16:9', category: 'social' },
  { platform: 'Threads', name: 'Post (square)', w: 1080, h: 1080, ratio: '1:1', category: 'social' },
  { platform: 'Threads', name: 'Post (portrait)', w: 1080, h: 1350, ratio: '4:5', category: 'social' },
  { platform: 'Threads', name: 'Profile Photo', w: 400, h: 400, ratio: '1:1', category: 'social' },
  { platform: 'Telegram', name: 'Profile Photo', w: 800, h: 800, ratio: '1:1', category: 'social' },
  { platform: 'Telegram', name: 'Channel Banner', w: 1280, h: 720, ratio: '16:9', category: 'social' },
  { platform: 'Print', name: 'A4 Portrait @150 DPI', w: 1240, h: 1754, ratio: 'sqrt2:1', category: 'print', dpi: 150 },
  { platform: 'Print', name: 'A4 Portrait', w: 2480, h: 3508, ratio: 'sqrt2:1', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'A4 Portrait @600 DPI', w: 4961, h: 7016, ratio: 'sqrt2:1', category: 'print', dpi: 600 },
  { platform: 'Print', name: 'A4 Landscape @150 DPI', w: 1754, h: 1240, ratio: '1:sqrt2', category: 'print', dpi: 150 },
  { platform: 'Print', name: 'A4 Landscape', w: 3508, h: 2480, ratio: '1:sqrt2', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'A4 Landscape @600 DPI', w: 7016, h: 4961, ratio: '1:sqrt2', category: 'print', dpi: 600 },
  { platform: 'Print', name: 'A3 Portrait', w: 3508, h: 4961, ratio: 'sqrt2:1', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'A3 Landscape', w: 4961, h: 3508, ratio: '1:sqrt2', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'A5 Portrait', w: 1748, h: 2480, ratio: 'sqrt2:1', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'Letter Portrait @150 DPI', w: 1275, h: 1650, ratio: '17:22', category: 'print', dpi: 150 },
  { platform: 'Print', name: 'Letter Portrait', w: 2550, h: 3300, ratio: '17:22', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'Letter Portrait @600 DPI', w: 5100, h: 6600, ratio: '17:22', category: 'print', dpi: 600 },
  { platform: 'Print', name: 'Letter Landscape @150 DPI', w: 1650, h: 1275, ratio: '22:17', category: 'print', dpi: 150 },
  { platform: 'Print', name: 'Letter Landscape', w: 3300, h: 2550, ratio: '22:17', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'Letter Landscape @600 DPI', w: 6600, h: 5100, ratio: '22:17', category: 'print', dpi: 600 },
  { platform: 'Print', name: 'Legal', w: 2550, h: 4200, ratio: '3:5', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'Business Card', w: 1050, h: 600, ratio: '7:4', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'Square Card', w: 1500, h: 1500, ratio: '1:1', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'Poster A2', w: 4961, h: 7016, ratio: 'sqrt2:1', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'US Tabloid @150 DPI', w: 1650, h: 2550, ratio: '11:17', category: 'print', dpi: 150 },
  { platform: 'Print', name: 'US Tabloid', w: 3300, h: 5100, ratio: '11:17', category: 'print', dpi: 300 },
  { platform: 'Print', name: 'US Tabloid @600 DPI', w: 6600, h: 10200, ratio: '11:17', category: 'print', dpi: 600 },
  { platform: 'Cinema', name: 'DCI 4K Flat', w: 3996, h: 2160, ratio: '1.85:1', category: 'cinema' },
  { platform: 'Cinema', name: 'DCI 4K Scope', w: 4096, h: 1716, ratio: '2.39:1', category: 'cinema' },
  { platform: 'Cinema', name: 'DCI 4K Full', w: 4096, h: 2160, ratio: '1.9:1', category: 'cinema' },
  { platform: 'Cinema', name: 'DCI 2K Full', w: 2048, h: 1080, ratio: '1.9:1', category: 'cinema' },
  { platform: 'Cinema', name: 'DCI 2K Flat', w: 1998, h: 1080, ratio: '1.85:1', category: 'cinema' },
  { platform: 'Cinema', name: 'DCI 2K Scope', w: 2048, h: 858, ratio: '2.39:1', category: 'cinema' },
  { platform: 'Cinema', name: 'IMAX Digital', w: 4096, h: 3072, ratio: '4:3', category: 'cinema' },
  { platform: 'Cinema', name: 'Ultra Panavision 70', w: 4096, h: 1486, ratio: '2.76:1', category: 'cinema' },
  { platform: 'Cinema', name: 'Widescreen', w: 1920, h: 804, ratio: '2.39:1', category: 'cinema' },
  { platform: 'Cinema', name: 'Academy Ratio', w: 1828, h: 1332, ratio: '1.37:1', category: 'cinema' },
  { platform: 'Cinema', name: 'VistaVision', w: 4096, h: 3072, ratio: '1.5:1', category: 'cinema' },
  { platform: 'Display Ads', name: 'Leaderboard', w: 728, h: 90, ratio: '8.1:1', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Medium Rectangle', w: 300, h: 250, ratio: '6:5', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Wide Skyscraper', w: 160, h: 600, ratio: '4:15', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Large Rectangle', w: 336, h: 280, ratio: '1.2:1', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Half Page / IMU', w: 300, h: 600, ratio: '1:2', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Billboard', w: 970, h: 250, ratio: '3.88:1', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Super Leaderboard', w: 970, h: 90, ratio: '10.8:1', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Mobile Banner', w: 320, h: 50, ratio: '32:5', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Mobile Interstitial', w: 320, h: 480, ratio: '2:3', category: 'display-ads' },
  { platform: 'Display Ads', name: 'Smartphone Interstitial', w: 640, h: 1136, ratio: '9:16', category: 'display-ads' },
  { platform: 'Screen', name: '4K UHD', w: 3840, h: 2160, ratio: '16:9', category: 'video' },
  { platform: 'Screen', name: '1080p Full HD', w: 1920, h: 1080, ratio: '16:9', category: 'video' },
  { platform: 'Screen', name: '720p HD', w: 1280, h: 720, ratio: '16:9', category: 'video' },
  { platform: 'Screen', name: '480p SD', w: 720, h: 480, ratio: '3:2', category: 'video' },
  { platform: 'Screen', name: '2K QHD', w: 2560, h: 1440, ratio: '16:9', category: 'video' },
  { platform: 'Screen', name: 'iPhone 16 Pro', w: 1206, h: 2622, ratio: '19.5:9', category: 'video' },
  { platform: 'Screen', name: 'iPad Pro 11-in', w: 1668, h: 2388, ratio: '4:3', category: 'video' },
  { platform: 'Screen', name: 'MacBook 14-in', w: 3024, h: 1964, ratio: '3:2', category: 'video' },
];

export const categoryLabels: Record<PlatformCategory, string> = {
  social: 'Social',
  professional: 'Professional',
  video: 'Video / Screen',
  print: 'Print',
  cinema: 'Cinema',
  'display-ads': 'Display Ads',
};

export function getUniquePlatforms(): string[] {
  return [...new Set(platformFormats.map((f) => f.platform))];
}

export function getUniqueCategories(): PlatformCategory[] {
  return [...new Set(platformFormats.map((f) => f.category))];
}

export function filterByCategory(category: PlatformCategory): PlatformFormat[] {
  return platformFormats.filter((f) => f.category === category);
}

export function searchFormats(query: string): PlatformFormat[] {
  const q = query.toLowerCase().trim();
  if (!q) return platformFormats;
  return platformFormats.filter((f) =>
    [f.platform, f.name, f.ratio, `${f.w}`, `${f.h}`].some((value) =>
      value.toLowerCase().includes(q)
    )
  );
}
