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
  notes?: string;
  sourceUrl?: string;
}

export interface PlatformPageFormat extends PlatformFormat {
  slug: string;
  aliases: string[];
  keyword: string;
}

export interface ImageSizeIntentPage {
  slug: string;
  aliases?: string[];
  format: PlatformFormat;
  title: string;
  h1: string;
  description: string;
  intro: string;
  keyword: string;
  relatedFormats?: PlatformFormat[];
  sourceLabel?: string;
  sourceUrl?: string;
  caveat?: string;
  /** Slug of the corresponding compress page, e.g. 'compress-image-for-linkedin' */
  compressHref?: string;
  /** Extra FAQs specific to this platform (merged into the page FAQ list) */
  extraFAQs?: { question: string; answer: string }[];
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

  if (format.platform === 'Twitter/X' && format.name === 'Post Image') {
    aliases.add('twitter-post-image-size');
    aliases.add('x-post-image-size');
  }

  if (format.platform === 'Twitter/X' && format.name === 'Header / Banner') {
    aliases.add('twitter-header-size');
    aliases.add('x-header-size');
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
  { platform: 'Twitter/X', name: 'Post Image', w: 1200, h: 675, ratio: '16:9', category: 'social' },
  { platform: 'Twitter/X', name: 'Header / Banner', w: 1500, h: 500, ratio: '3:1', category: 'social', safeZone: 'X notes that around 60px at the top and bottom can be cropped on some screens.', sourceUrl: 'https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo' },
  { platform: 'Twitter/X', name: 'Profile Photo', w: 400, h: 400, ratio: '1:1', category: 'social', sourceUrl: 'https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo' },
  { platform: 'Twitter/X', name: 'Card Image', w: 1200, h: 628, ratio: '1.91:1', category: 'social' },
  { platform: 'LinkedIn', name: 'Personal Header', w: 1584, h: 396, ratio: '4:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Company Cover', w: 1128, h: 191, ratio: '5.9:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Company Logo', w: 300, h: 300, ratio: '1:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Square Logo', w: 60, h: 60, ratio: '1:1', category: 'professional' },
  { platform: 'LinkedIn', name: 'Post Image', w: 1200, h: 628, ratio: '1.91:1', category: 'professional', sourceUrl: 'https://www.linkedin.com/help/linkedin/answer/a426534/single-image-ads-advertising-specifications?intendedLocale=und&lang=en-us' },
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
  { platform: 'Google Forms', name: 'Header Image', w: 1600, h: 400, ratio: '4:1', category: 'professional', notes: 'Practical template size. Google documents header image upload and crop steps, but not a strict required pixel size.', sourceUrl: 'https://support.google.com/docs/answer/145737?hl=en-en' },
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

const findFormat = (platform: string, name: string) => {
  const format = platformFormats.find((item) => item.platform === platform && item.name === name);
  if (!format) throw new Error(`Missing platform format: ${platform} ${name}`);
  return format;
};

export const imageSizeIntentPages: ImageSizeIntentPage[] = [
  {
    slug: 'linkedin-post-image-size',
    format: findFormat('LinkedIn', 'Post Image'),
    title: 'LinkedIn Post Image Size: 1200x628 Pixels',
    h1: 'LinkedIn Post Image Size',
    description: 'LinkedIn post image size guide with a 1200x628 preset, plus square and vertical options. Upload, resize, crop, and export in your browser.',
    intro: 'Use 1200x628 px for a landscape LinkedIn post image. You can also prepare square 1200x1200 and vertical 720x900 versions for different feed layouts.',
    keyword: 'linkedin post image size',
    sourceLabel: 'LinkedIn single image ad specs',
    sourceUrl: 'https://www.linkedin.com/help/linkedin/answer/a426534/single-image-ads-advertising-specifications?intendedLocale=und&lang=en-us',
    compressHref: '/compress-image-for-linkedin',
    relatedFormats: [
      findFormat('LinkedIn', 'Post Image'),
      { platform: 'LinkedIn', name: 'Square Post', w: 1200, h: 1200, ratio: '1:1', category: 'professional' },
      { platform: 'LinkedIn', name: 'Vertical Post', w: 720, h: 900, ratio: '4:5', category: 'professional' },
    ],
    extraFAQs: [
      {
        question: 'What size is a LinkedIn post image?',
        answer: 'The recommended LinkedIn post image size is <strong>1200×628 pixels</strong> for a landscape feed post, giving a <strong>1.91:1</strong> aspect ratio. Square posts can use 1200×1200 px, and vertical posts work at 720×900 px.',
      },
      {
        question: 'Does LinkedIn compress images?',
        answer: 'LinkedIn may recompress images over 5 MB. For the sharpest result, keep your 1200×628 px post image under 5 MB — ideally under 1 MB — before uploading.',
      },
    ],
  },
  {
    slug: 'linkedin-cover-image-size',
    format: findFormat('LinkedIn', 'Personal Header'),
    title: 'LinkedIn Cover Image Size: 1584x396 and 4200x700',
    h1: 'LinkedIn Cover Image Size',
    description: 'Resize a LinkedIn cover image for personal profiles at 1584x396 px or LinkedIn Pages at 4200x700 px. Crop and export locally.',
    intro: 'LinkedIn cover intent can mean a personal profile background or a LinkedIn Page cover. Start with 1584x396 px for profiles, or switch to 4200x700 px for Pages.',
    keyword: 'linkedin cover image size',
    sourceLabel: 'LinkedIn profile and Page image specs',
    sourceUrl: 'https://www.linkedin.com/help/linkedin/answer/a549049',
    compressHref: '/compress-image-for-linkedin',
    relatedFormats: [
      findFormat('LinkedIn', 'Personal Header'),
      { platform: 'LinkedIn', name: 'Page Cover', w: 4200, h: 700, ratio: '6:1', category: 'professional', sourceUrl: 'https://www.linkedin.com/help/linkedin/answer/a563309/image-specifications-for-your-linkedin-pages-and-career-pages?lang=en' },
    ],
    extraFAQs: [
      {
        question: 'What is the LinkedIn cover photo size?',
        answer: 'The LinkedIn personal profile cover (background photo) is <strong>1584×396 pixels</strong> at a <strong>4:1</strong> ratio. LinkedIn Page covers use <strong>4200×700 px</strong> (6:1 ratio). Both should be under 8 MB.',
      },
      {
        question: 'Does LinkedIn crop my cover photo?',
        answer: 'Yes — LinkedIn crops the profile cover on different screen sizes. Keep your logo or key content centred and avoid placing anything important within 60 px of any edge.',
      },
    ],
  },
  {
    slug: 'google-forms-header-image-size',
    format: findFormat('Google Forms', 'Header Image'),
    title: 'Google Forms Header Image Size: 1600x400 Template',
    h1: 'Google Forms Header Image Size',
    description: 'Create a Google Forms header image with a practical 1600x400 px template. Resize, crop, and export privately in your browser.',
    intro: 'A 1600x400 px image gives you a clean 4:1 header template for Google Forms. Google documents how to add and crop header images, but does not publish this as a strict required pixel size.',
    keyword: 'google forms header image size',
    sourceLabel: 'Google Forms header workflow',
    sourceUrl: 'https://support.google.com/docs/answer/145737?hl=en-en',
    caveat: 'Google Forms may crop or reposition the header depending on theme and screen size, so keep key text and logos near the centre.',
    extraFAQs: [
      {
        question: 'What is the Google Forms header image size?',
        answer: 'Google Forms does not enforce a strict required pixel size, but a practical template is <strong>1600×400 pixels</strong> at a <strong>4:1</strong> aspect ratio. Google automatically crops and repositions the header, so keep important content centred.',
      },
      {
        question: 'What format should I use for a Google Forms header?',
        answer: 'Google Forms accepts JPG, PNG, and GIF. Use JPG for photos and PNG for graphics with text or logos to keep edges sharp after Google applies its own crop.',
      },
    ],
  },
  {
    slug: 'twitter-image-size',
    aliases: ['x-image-size'],
    format: findFormat('Twitter/X', 'Post Image'),
    title: 'Twitter/X Image Size: Post, Header, and Profile Dimensions',
    h1: 'Twitter/X Image Size',
    description: 'Resize images for Twitter/X posts, headers, and profile photos. Start with a 1200x675 post image or choose official header and profile presets.',
    intro: 'Use 1200x675 px for a clean 16:9 Twitter/X post image. The same tool also includes the official 1500x500 header and 400x400 profile photo presets.',
    keyword: 'twitter image size',
    sourceLabel: 'X profile and header image help',
    sourceUrl: 'https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo',
    compressHref: '/compress-image-for-twitter',
    relatedFormats: [
      findFormat('Twitter/X', 'Post Image'),
      findFormat('Twitter/X', 'Header / Banner'),
      findFormat('Twitter/X', 'Profile Photo'),
    ],
    extraFAQs: [
      {
        question: 'What size are Twitter / X post images?',
        answer: 'The recommended Twitter / X post image size is <strong>1200×675 pixels</strong> at a <strong>16:9</strong> ratio. Images must be under 5 MB (JPG or PNG) or under 5 MB (GIF). Twitter/X displays them at up to 1200 px wide in the timeline.',
      },
      {
        question: 'What is the Twitter / X header image size?',
        answer: 'The Twitter / X header (banner) is <strong>1500×500 pixels</strong> at a <strong>3:1</strong> ratio. Note that roughly 60 px at the top and bottom may be cropped on some screens, so keep your username and key content in the centre strip.',
      },
    ],
  },
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
