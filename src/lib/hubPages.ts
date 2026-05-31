/**
 * hubPages.ts — Platform hub page data.
 *
 * Every HubFormat.href is set EXPLICITLY here — either to a real dedicated
 * size page that exists in [platformSize].astro, or to /crop-and-resize?tw=W&th=H
 * as a fallback. The template never derives URLs from slugs, so 404s are
 * structurally impossible from hub pages.
 *
 * Rule: if the platform is in platforms.ts → use the generated slug URL.
 *       If the platform has no dedicated pages → use the crop fallback.
 */

/** Helper — crop-and-resize fallback URL for a given dimension */
function crop(w: number, h: number): string {
  return `/crop-and-resize?tw=${w}&th=${h}`;
}

export interface HubFormat {
  name: string;
  /** Always a real, resolvable URL — either a dedicated page or a crop fallback */
  href: string;
  w: number;
  h: number;
  ratio: string;
  description: string;
  /** slug used only for element IDs (e.g. id="hub-resize-...") — not for navigation */
  id: string;
}

export interface HubPage {
  slug: string;          // URL path without leading /
  platform: string;      // Display name
  title: string;
  h1: string;
  description: string;
  intro: string;
  compressHref?: string;  // link to compress page
  formats: HubFormat[];
}

export const hubPages: HubPage[] = [
  {
    slug: 'instagram-image-sizes',
    platform: 'Instagram',
    title: 'All Instagram Image Sizes 2025 — Every Format and Dimension',
    h1: 'Instagram Image Sizes',
    description: 'Complete Instagram image size guide for 2025: square post (1080×1080), portrait post (1080×1350), story (1080×1920), reel, profile photo, IGTV, and carousel slide — all with one-click resize.',
    intro: 'Instagram supports several image formats and each has its own required pixel dimensions and aspect ratio. Get the exact dimensions below and resize your images in one click — no upload needed, all processing stays in your browser.',
    compressHref: '/compress-image-for-instagram',
    formats: [
      { id: 'ig-square',    name: 'Square Post',      href: '/instagram-square-post-size',    w: 1080, h: 1080, ratio: '1:1',    description: 'The default feed post format — equal width and height.' },
      { id: 'ig-portrait',  name: 'Portrait Post',    href: '/instagram-portrait-post-size',  w: 1080, h: 1350, ratio: '4:5',    description: 'Taller than wide — takes up more feed space and drives higher engagement.' },
      { id: 'ig-landscape', name: 'Landscape Post',   href: '/instagram-landscape-post-size', w: 1080, h: 566,  ratio: '1.91:1', description: 'Wider than tall — best for cinematic or panoramic photos.' },
      { id: 'ig-story',     name: 'Story / Reel',     href: '/instagram-story-reel-size',     w: 1080, h: 1920, ratio: '9:16',   description: 'Full-screen vertical format for Stories, Reels, and IGTV.' },
      { id: 'ig-profile',   name: 'Profile Photo',    href: '/instagram-profile-photo-size',  w: 320,  h: 320,  ratio: '1:1',    description: 'Displayed as a circle — keep key content centred.' },
      { id: 'ig-carousel',  name: 'Carousel Slide',   href: '/instagram-carousel-slide-size', w: 1080, h: 1080, ratio: '1:1',    description: 'Square is the most versatile carousel slide shape.' },
      { id: 'ig-igtv',      name: 'IGTV Cover',       href: '/instagram-igtv-cover-size',     w: 420,  h: 654,  ratio: '2:3',    description: 'The portrait thumbnail shown in IGTV browse.' },
    ],
  },
  {
    slug: 'facebook-image-sizes',
    platform: 'Facebook',
    title: 'All Facebook Image Sizes 2025 — Every Format and Dimension',
    h1: 'Facebook Image Sizes',
    description: 'Complete Facebook image size guide for 2025: post image (1200×630), cover photo (820×312), profile photo (170×170), story (1080×1920), event cover, group cover, link preview, and ad formats.',
    intro: 'Facebook shows images differently depending on placement — a feed post, a cover photo, and an ad each have unique optimal dimensions. Use the sizes below to prepare every format and resize in your browser.',
    compressHref: '/compress-image-for-facebook',
    formats: [
      { id: 'fb-post',         name: 'Post Image',        href: '/facebook-post-image-size',        w: 1200, h: 630,  ratio: '1.91:1', description: 'Recommended size for shared links and general feed posts.' },
      { id: 'fb-cover',        name: 'Cover Photo',       href: '/facebook-cover-photo-size',       w: 820,  h: 312,  ratio: '2.63:1', description: 'The wide banner at the top of your personal or page profile.' },
      { id: 'fb-profile',      name: 'Profile Photo',     href: '/facebook-profile-photo-size',     w: 170,  h: 170,  ratio: '1:1',    description: 'Displayed as a circle on timeline and in comments.' },
      { id: 'fb-story',        name: 'Story',             href: '/facebook-story-size',             w: 1080, h: 1920, ratio: '9:16',   description: 'Full-screen vertical format for Facebook Stories.' },
      { id: 'fb-event',        name: 'Event Cover',       href: '/facebook-event-cover-size',       w: 1920, h: 1005, ratio: '1.91:1', description: 'Large banner shown at the top of a Facebook Event.' },
      { id: 'fb-group',        name: 'Group Cover',       href: '/facebook-group-cover-size',       w: 1640, h: 856,  ratio: '1.91:1', description: 'Wide banner at the top of a Facebook Group page.' },
      { id: 'fb-link',         name: 'Link Preview',      href: '/facebook-link-preview-size',      w: 1200, h: 628,  ratio: '1.91:1', description: 'Auto-generated thumbnail when sharing a URL in a post.' },
      { id: 'fb-ad-single',    name: 'Ad (Single Image)', href: '/facebook-ad-single-image-size',   w: 1200, h: 628,  ratio: '1.91:1', description: 'Landscape single-image ad — most widely used ad format.' },
      { id: 'fb-ad-square',    name: 'Ad (Square)',       href: '/facebook-ad-square-size',         w: 1080, h: 1080, ratio: '1:1',    description: 'Square image ad — performs well on both feed and Instagram placements.' },
    ],
  },
  {
    slug: 'linkedin-image-sizes',
    platform: 'LinkedIn',
    title: 'All LinkedIn Image Sizes 2025 — Every Format and Dimension',
    h1: 'LinkedIn Image Sizes',
    description: 'Complete LinkedIn image size guide for 2025: post image (1200×628), personal header (1584×396), company cover (1128×191), company logo (300×300), article cover (1920×1080), carousel, event banner, and sponsored ad.',
    intro: 'LinkedIn is a professional network where image quality signals credibility. Each content type — from a post image to a company page cover — has its own required dimensions. Resize any LinkedIn format below directly in your browser.',
    compressHref: '/compress-image-for-linkedin',
    formats: [
      { id: 'li-post',      name: 'Post Image',      href: '/linkedin-post-image-size',     w: 1200, h: 628,  ratio: '1.91:1', description: 'Standard landscape image shared in the LinkedIn feed.' },
      { id: 'li-header',    name: 'Personal Header', href: '/linkedin-personal-header-size', w: 1584, h: 396,  ratio: '4:1',    description: 'The wide banner behind your profile photo on personal profiles.' },
      { id: 'li-company',   name: 'Company Cover',   href: '/linkedin-company-cover-size',  w: 1128, h: 191,  ratio: '5.9:1',  description: 'Very wide cover image shown on LinkedIn Company Pages.' },
      { id: 'li-logo',      name: 'Company Logo',    href: '/linkedin-company-logo-size',   w: 300,  h: 300,  ratio: '1:1',    description: 'Square logo displayed next to your company name.' },
      { id: 'li-article',   name: 'Article Cover',   href: '/linkedin-article-cover-size',  w: 1920, h: 1080, ratio: '16:9',   description: 'Hero image shown at the top of a LinkedIn article or newsletter.' },
      { id: 'li-carousel',  name: 'Carousel Slide',  href: '/linkedin-carousel-slide-size', w: 1080, h: 1080, ratio: '1:1',    description: 'Square slides in a LinkedIn document / carousel post.' },
      { id: 'li-event',     name: 'Event Banner',    href: '/linkedin-event-banner-size',   w: 1600, h: 900,  ratio: '16:9',   description: 'Banner displayed at the top of a LinkedIn Event page.' },
      { id: 'li-ad',        name: 'Sponsored Ad',    href: '/linkedin-sponsored-ad-size',   w: 1200, h: 627,  ratio: '1.91:1', description: 'Single-image sponsored content ad format.' },
    ],
  },
  {
    slug: 'twitter-image-sizes',
    platform: 'Twitter/X',
    title: 'All Twitter / X Image Sizes 2025 — Every Format and Dimension',
    h1: 'Twitter / X Image Sizes',
    description: 'Complete Twitter / X image size guide for 2025: post image (1200×675), header / banner (1500×500), profile photo (400×400), and card image (1200×628) — with one-click browser resize.',
    intro: 'Twitter / X displays images at different aspect ratios depending on how many images are in a tweet. Use the exact sizes below to avoid unexpected cropping in timelines, profiles, and search results.',
    compressHref: '/compress-image-for-twitter',
    formats: [
      { id: 'tw-post',    name: 'Post Image',      href: '/twitter-x-post-image-size',    w: 1200, h: 675, ratio: '16:9',   description: 'Standard 16:9 image attached to a tweet.' },
      { id: 'tw-header',  name: 'Header / Banner', href: '/twitter-x-header-banner-size', w: 1500, h: 500, ratio: '3:1',    description: 'Wide profile banner — keep key content away from the top and bottom 60 px.' },
      { id: 'tw-profile', name: 'Profile Photo',   href: '/twitter-x-profile-photo-size', w: 400,  h: 400, ratio: '1:1',    description: 'Displayed as a circle on your profile and next to tweets.' },
      { id: 'tw-card',    name: 'Card Image',      href: '/twitter-x-card-image-size',    w: 1200, h: 628, ratio: '1.91:1', description: 'Auto-generated thumbnail for Twitter Card link previews.' },
    ],
  },
  {
    slug: 'youtube-image-sizes',
    platform: 'YouTube',
    title: 'All YouTube Image Sizes 2025 — Thumbnail, Channel Art, Banner, Profile',
    h1: 'YouTube Image Sizes',
    description: 'Complete YouTube image size guide for 2025: thumbnail (1280×720), channel banner (2560×1440), profile photo (800×800), Shorts (1080×1920), video (1920×1080), end screen, and community post.',
    intro: 'Every YouTube surface — thumbnails, banners, Shorts, and community posts — has specific pixel requirements. Getting dimensions right ensures your channel art looks crisp on TVs, desktops, and phones simultaneously.',
    compressHref: '/compress-image-for-youtube',
    formats: [
      { id: 'yt-thumb',     name: 'Thumbnail',       href: '/youtube-thumbnail-size',       w: 1280, h: 720,  ratio: '16:9', description: 'The most important image on YouTube — must be under 2 MB.' },
      { id: 'yt-banner',    name: 'Channel Banner',  href: '/youtube-channel-banner-size',  w: 2560, h: 1440, ratio: '16:9', description: 'Safe visible area is 1546×423 px centred — outer edges crop on smaller screens.' },
      { id: 'yt-profile',   name: 'Profile Photo',   href: '/youtube-profile-photo-size',   w: 800,  h: 800,  ratio: '1:1',  description: 'Square image displayed as a circle across YouTube and Google.' },
      { id: 'yt-shorts',    name: 'Shorts',          href: '/youtube-shorts-size',          w: 1080, h: 1920, ratio: '9:16', description: 'Vertical 9:16 frame for YouTube Shorts content.' },
      { id: 'yt-video',     name: 'Video (1080p)',   href: '/youtube-video-1080p-size',     w: 1920, h: 1080, ratio: '16:9', description: 'Standard Full HD video frame — ideal upload resolution.' },
      { id: 'yt-end',       name: 'End Screen',      href: '/youtube-end-screen-size',      w: 1280, h: 720,  ratio: '16:9', description: 'Template canvas for placing end-screen elements in your editor.' },
      { id: 'yt-community', name: 'Community Post',  href: '/youtube-community-post-size',  w: 1080, h: 1080, ratio: '1:1',  description: 'Square image for YouTube Community tab posts.' },
    ],
  },
  {
    slug: 'whatsapp-image-sizes',
    platform: 'WhatsApp',
    title: 'All WhatsApp Image Sizes 2025 — DP, Status, and Shared Images',
    h1: 'WhatsApp Image Sizes',
    description: 'Complete WhatsApp image size guide for 2025: profile photo / DP (500×500), status (1080×1920), shared portrait image (1080×1350), and shared landscape image (1920×1080) — all with browser-based resize.',
    intro: 'WhatsApp compresses images it delivers, so starting at the right dimensions before sending helps preserve quality. Use the sizes below to prepare your DP, status, and shared photos.',
    compressHref: '/compress-image-for-whatsapp',
    formats: [
      { id: 'wa-profile',   name: 'Profile Photo (DP)',         href: '/whatsapp-profile-photo-size',            w: 500,  h: 500,  ratio: '1:1',  description: 'Square profile picture displayed as a circle in chats.' },
      { id: 'wa-status',    name: 'Status',                     href: '/whatsapp-status-size',                   w: 1080, h: 1920, ratio: '9:16', description: 'Full-screen vertical image for WhatsApp Status updates.' },
      { id: 'wa-portrait',  name: 'Shared Image (Portrait)',    href: '/whatsapp-shared-image-portrait-size',    w: 1080, h: 1350, ratio: '4:5',  description: 'Portrait photo shared in chats or groups.' },
      { id: 'wa-landscape', name: 'Shared Image (Landscape)',   href: '/whatsapp-shared-image-landscape-size',   w: 1920, h: 1080, ratio: '16:9', description: 'Landscape photo shared in chats or groups.' },
    ],
  },
  {
    slug: 'pinterest-image-sizes',
    platform: 'Pinterest',
    title: 'All Pinterest Image Sizes 2025 — Pins, Boards, Stories, and Profile',
    h1: 'Pinterest Image Sizes',
    description: 'Complete Pinterest image size guide for 2025: standard pin (1000×1500), square pin (1000×1000), long infographic pin (1000×2100), story pin (1080×1920), profile photo (165×165), and board cover (600×600).',
    intro: 'Pinterest is a visual discovery platform where taller pins get more feed real estate. The 2:3 ratio (1000×1500 px) is the recommended standard, but infographic pins can go up to 1:2.1. Resize any Pinterest format in your browser.',
    compressHref: '/compress-image-for-pinterest',
    formats: [
      { id: 'pin-standard',    name: 'Standard Pin',           href: '/pinterest-standard-pin-size',          w: 1000, h: 1500, ratio: '2:3',   description: 'The recommended pin size — 2:3 portrait ratio performs best.' },
      { id: 'pin-square',      name: 'Square Pin',             href: '/pinterest-square-pin-size',            w: 1000, h: 1000, ratio: '1:1',   description: 'Square pins for product images and clean compositions.' },
      { id: 'pin-long',        name: 'Long / Infographic Pin', href: '/pinterest-long-infographic-pin-size',  w: 1000, h: 2100, ratio: '1:2.1', description: 'Extra-tall pin ideal for step-by-step infographics.' },
      { id: 'pin-story',       name: 'Story Pin',              href: '/pinterest-story-pin-size',             w: 1080, h: 1920, ratio: '9:16',  description: 'Full-screen vertical format for Pinterest Story Pins.' },
      { id: 'pin-profile',     name: 'Profile Photo',          href: '/pinterest-profile-photo-size',         w: 165,  h: 165,  ratio: '1:1',   description: 'Circle avatar shown on your Pinterest profile.' },
      { id: 'pin-board',       name: 'Board Cover',            href: '/pinterest-board-cover-size',           w: 600,  h: 600,  ratio: '1:1',   description: 'Square thumbnail representing a Pinterest board.' },
    ],
  },
  {
    slug: 'shopify-image-sizes',
    platform: 'Shopify',
    title: 'All Shopify Image Sizes 2025 — Product, Collection, Banner, Logo',
    h1: 'Shopify Image Sizes',
    description: 'Complete Shopify image size guide for 2025: product image (2048×2048), collection image (1024×1024), slideshow / hero banner (1920×1080), logo (400×200), favicon (32×32), and background (1920×1080).',
    intro: 'Shopify serves images at different sizes depending on the theme and device. Starting with large, correctly-proportioned source images lets Shopify generate all its responsive sizes without quality loss.',
    // No compress page for Shopify — no compressHref
    formats: [
      // Shopify has no dedicated size pages — all link directly to the crop tool
      { id: 'sh-product',  name: 'Product Image',         href: crop(2048, 2048), w: 2048, h: 2048, ratio: '1:1',  description: 'Square product photos — Shopify recommends at least 2048×2048 px.' },
      { id: 'sh-collect',  name: 'Collection Image',      href: crop(1024, 1024), w: 1024, h: 1024, ratio: '1:1',  description: 'Square thumbnail representing a product collection.' },
      { id: 'sh-hero',     name: 'Slideshow / Hero Banner', href: crop(1920, 1080), w: 1920, h: 1080, ratio: '16:9', description: 'Wide homepage slideshow or hero banner image.' },
      { id: 'sh-logo',     name: 'Logo',                  href: crop(400,  200),  w: 400,  h: 200,  ratio: '2:1',  description: 'Horizontal logo shown in the site header.' },
      { id: 'sh-favicon',  name: 'Favicon',               href: crop(32,   32),   w: 32,   h: 32,   ratio: '1:1',  description: 'Tiny square icon shown in browser tabs.' },
      { id: 'sh-bg',       name: 'Background',            href: crop(1920, 1080), w: 1920, h: 1080, ratio: '16:9', description: 'Full-width background image used in some themes.' },
    ],
  },
];

export function getHubPage(slug: string): HubPage | undefined {
  return hubPages.find((page) => page.slug === slug);
}
