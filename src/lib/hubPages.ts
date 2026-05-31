/**
 * hubPages.ts — Platform hub page data.
 * Each hub covers all formats for one platform and links to individual size pages
 * plus the corresponding compression page.
 */

export interface HubFormat {
  name: string;
  /** Generated page slug — used as href unless `href` is set */
  slug: string;
  /** Override href — use when no dedicated page exists (e.g. Shopify → crop-and-resize) */
  href?: string;
  w: number;
  h: number;
  ratio: string;
  description: string;
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
    description: 'Complete Instagram image size guide for 2025: square post (1080×1080), portrait post (1080×1350), story (1080×1920), reel, profile photo, highlight cover, IGTV, and carousel slide — all with one-click resize.',
    intro: 'Instagram supports several image formats and each has its own required pixel dimensions and aspect ratio. Get the exact dimensions below and resize your images in one click — no upload needed, all processing stays in your browser.',
    compressHref: '/compress-image-for-instagram',
    formats: [
      { name: 'Square Post', slug: 'instagram-square-post-size', w: 1080, h: 1080, ratio: '1:1', description: 'The default feed post format — equal width and height.' },
      { name: 'Portrait Post', slug: 'instagram-portrait-post-size', w: 1080, h: 1350, ratio: '4:5', description: 'Taller than wide — takes up more feed space and drives higher engagement.' },
      { name: 'Landscape Post', slug: 'instagram-landscape-post-size', w: 1080, h: 566, ratio: '1.91:1', description: 'Wider than tall — best for cinematic or panoramic photos.' },
      { name: 'Story / Reel', slug: 'instagram-story-reel-size', w: 1080, h: 1920, ratio: '9:16', description: 'Full-screen vertical format for Stories, Reels, and IGTV.' },
      { name: 'Profile Photo', slug: 'instagram-profile-photo-size', w: 320, h: 320, ratio: '1:1', description: 'Displayed as a circle — keep key content centred.' },
      { name: 'Carousel Slide', slug: 'instagram-carousel-slide-size', w: 1080, h: 1080, ratio: '1:1', description: 'Square is the most versatile carousel slide shape.' },
      { name: 'IGTV Cover', slug: 'instagram-igtv-cover-size', w: 420, h: 654, ratio: '2:3', description: 'The portrait thumbnail shown in IGTV browse.' },
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
      { name: 'Post Image', slug: 'facebook-post-image-size', w: 1200, h: 630, ratio: '1.91:1', description: 'Recommended size for shared links and general feed posts.' },
      { name: 'Cover Photo', slug: 'facebook-cover-photo-size', w: 820, h: 312, ratio: '2.63:1', description: 'The wide banner at the top of your personal or page profile.' },
      { name: 'Profile Photo', slug: 'facebook-profile-photo-size', w: 170, h: 170, ratio: '1:1', description: 'Displayed as a circle on timeline and in comments.' },
      { name: 'Story', slug: 'facebook-story-size', w: 1080, h: 1920, ratio: '9:16', description: 'Full-screen vertical format for Facebook Stories.' },
      { name: 'Event Cover', slug: 'facebook-event-cover-size', w: 1920, h: 1005, ratio: '1.91:1', description: 'Large banner shown at the top of a Facebook Event.' },
      { name: 'Group Cover', slug: 'facebook-group-cover-size', w: 1640, h: 856, ratio: '1.91:1', description: 'Wide banner at the top of a Facebook Group page.' },
      { name: 'Link Preview', slug: 'facebook-link-preview-size', w: 1200, h: 628, ratio: '1.91:1', description: 'Auto-generated thumbnail when sharing a URL in a post.' },
      { name: 'Ad (Single Image)', slug: 'facebook-ad-single-image-size', w: 1200, h: 628, ratio: '1.91:1', description: 'Landscape single-image ad — most widely used ad format.' },
      { name: 'Ad (Square)', slug: 'facebook-ad-square-size', w: 1080, h: 1080, ratio: '1:1', description: 'Square image ad — performs well on both feed and Instagram placements.' },
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
      { name: 'Post Image', slug: 'linkedin-post-image-size', w: 1200, h: 628, ratio: '1.91:1', description: 'Standard landscape image shared in the LinkedIn feed.' },
      { name: 'Personal Header', slug: 'linkedin-personal-header-size', w: 1584, h: 396, ratio: '4:1', description: 'The wide banner behind your profile photo on personal profiles.' },
      { name: 'Company Cover', slug: 'linkedin-company-cover-size', w: 1128, h: 191, ratio: '5.9:1', description: 'Very wide cover image shown on LinkedIn Company Pages.' },
      { name: 'Company Logo', slug: 'linkedin-company-logo-size', w: 300, h: 300, ratio: '1:1', description: 'Square logo displayed next to your company name.' },
      { name: 'Article Cover', slug: 'linkedin-article-cover-size', w: 1920, h: 1080, ratio: '16:9', description: 'Hero image shown at the top of a LinkedIn article or newsletter.' },
      { name: 'Carousel Slide', slug: 'linkedin-carousel-slide-size', w: 1080, h: 1080, ratio: '1:1', description: 'Square slides in a LinkedIn document / carousel post.' },
      { name: 'Event Banner', slug: 'linkedin-event-banner-size', w: 1600, h: 900, ratio: '16:9', description: 'Banner displayed at the top of a LinkedIn Event page.' },
      { name: 'Sponsored Ad', slug: 'linkedin-sponsored-ad-size', w: 1200, h: 627, ratio: '1.91:1', description: 'Single-image sponsored content ad format.' },
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
      { name: 'Post Image', slug: 'twitter-x-post-image-size', w: 1200, h: 675, ratio: '16:9', description: 'Standard 16:9 image attached to a tweet.' },
      { name: 'Header / Banner', slug: 'twitter-x-header-banner-size', w: 1500, h: 500, ratio: '3:1', description: 'Wide profile banner — keep key content away from the top and bottom 60 px.' },
      { name: 'Profile Photo', slug: 'twitter-x-profile-photo-size', w: 400, h: 400, ratio: '1:1', description: 'Displayed as a circle on your profile and next to tweets.' },
      { name: 'Card Image', slug: 'twitter-x-card-image-size', w: 1200, h: 628, ratio: '1.91:1', description: 'Auto-generated thumbnail for Twitter Card link previews.' },
    ],
  },
  {
    slug: 'youtube-image-sizes',
    platform: 'YouTube',
    title: 'All YouTube Image Sizes 2025 — Thumbnail, Channel Art, Banner, Profile',
    h1: 'YouTube Image Sizes',
    description: 'Complete YouTube image size guide for 2025: thumbnail (1280×720), channel banner (2560×1440), profile photo (800×800), Shorts (1080×1920), video (1920×1080), end screen (1280×720), and community post (1080×1080).',
    intro: 'Every YouTube surface — thumbnails, banners, Shorts, and community posts — has specific pixel requirements. Getting dimensions right ensures your channel art looks crisp on TVs, desktops, and phones simultaneously.',
    compressHref: '/compress-image-for-youtube',
    formats: [
      { name: 'Thumbnail', slug: 'youtube-thumbnail-size', w: 1280, h: 720, ratio: '16:9', description: 'The most important image on YouTube — must be under 2 MB.' },
      { name: 'Channel Banner', slug: 'youtube-channel-banner-size', w: 2560, h: 1440, ratio: '16:9', description: 'Safe visible area is 1546×423 px centred — outer edges are cropped on smaller screens.' },
      { name: 'Profile Photo', slug: 'youtube-profile-photo-size', w: 800, h: 800, ratio: '1:1', description: 'Square image displayed as a circle across YouTube and Google.' },
      { name: 'Shorts', slug: 'youtube-shorts-size', w: 1080, h: 1920, ratio: '9:16', description: 'Vertical 9:16 frame for YouTube Shorts content.' },
      { name: 'Video (1080p)', slug: 'youtube-video-1080p-size', w: 1920, h: 1080, ratio: '16:9', description: 'Standard Full HD video frame — ideal upload resolution.' },
      { name: 'End Screen', slug: 'youtube-end-screen-size', w: 1280, h: 720, ratio: '16:9', description: 'Template canvas for placing end-screen elements in your editor.' },
      { name: 'Community Post', slug: 'youtube-community-post-size', w: 1080, h: 1080, ratio: '1:1', description: 'Square image for YouTube Community tab posts.' },
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
      { name: 'Profile Photo (DP)', slug: 'whatsapp-profile-photo-size', w: 500, h: 500, ratio: '1:1', description: 'Square profile picture displayed as a circle in chats.' },
      { name: 'Status', slug: 'whatsapp-status-size', w: 1080, h: 1920, ratio: '9:16', description: 'Full-screen vertical image for WhatsApp Status updates.' },
      { name: 'Shared Image (Portrait)', slug: 'whatsapp-shared-image-portrait-size', w: 1080, h: 1350, ratio: '4:5', description: 'Portrait photo shared in chats or groups.' },
      { name: 'Shared Image (Landscape)', slug: 'whatsapp-shared-image-landscape-size', w: 1920, h: 1080, ratio: '16:9', description: 'Landscape photo shared in chats or groups.' },
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
      { name: 'Standard Pin', slug: 'pinterest-standard-pin-size', w: 1000, h: 1500, ratio: '2:3', description: 'The recommended pin size — 2:3 portrait ratio performs best.' },
      { name: 'Square Pin', slug: 'pinterest-square-pin-size', w: 1000, h: 1000, ratio: '1:1', description: 'Square pins for product images and clean compositions.' },
      { name: 'Long / Infographic Pin', slug: 'pinterest-long-infographic-pin-size', w: 1000, h: 2100, ratio: '1:2.1', description: 'Extra-tall pin ideal for step-by-step infographics.' },
      { name: 'Story Pin', slug: 'pinterest-story-pin-size', w: 1080, h: 1920, ratio: '9:16', description: 'Full-screen vertical format for Pinterest Story Pins.' },
      { name: 'Profile Photo', slug: 'pinterest-profile-photo-size', w: 165, h: 165, ratio: '1:1', description: 'Circle avatar shown on your Pinterest profile.' },
      { name: 'Board Cover', slug: 'pinterest-board-cover-size', w: 600, h: 600, ratio: '1:1', description: 'Square thumbnail representing a Pinterest board.' },
    ],
  },
  {
    slug: 'shopify-image-sizes',
    platform: 'Shopify',
    title: 'All Shopify Image Sizes 2025 — Product, Collection, Banner, Logo',
    h1: 'Shopify Image Sizes',
    description: 'Complete Shopify image size guide for 2025: product image (2048×2048), collection image (1024×1024), slideshow / hero banner (1920×1080), logo (400×200), favicon (32×32), and background (1920×1080).',
    intro: 'Shopify serves images at different sizes depending on the theme and device. Starting with large, correctly-proportioned source images lets Shopify generate all its responsive sizes without quality loss.',
    formats: [
      { name: 'Product Image', slug: 'shopify-product-image-size', href: '/crop-and-resize?tw=2048&th=2048', w: 2048, h: 2048, ratio: '1:1', description: 'Square product photos — Shopify recommends at least 2048×2048 px.' },
      { name: 'Collection Image', slug: 'shopify-collection-image-size', href: '/crop-and-resize?tw=1024&th=1024', w: 1024, h: 1024, ratio: '1:1', description: 'Square thumbnail representing a product collection.' },
      { name: 'Slideshow / Hero Banner', slug: 'shopify-slideshow-hero-banner-size', href: '/crop-and-resize?tw=1920&th=1080', w: 1920, h: 1080, ratio: '16:9', description: 'Wide homepage slideshow or hero banner image.' },
      { name: 'Logo', slug: 'shopify-logo-size', href: '/crop-and-resize?tw=400&th=200', w: 400, h: 200, ratio: '2:1', description: 'Horizontal logo shown in the site header.' },
      { name: 'Favicon', slug: 'shopify-favicon-size', href: '/crop-and-resize?tw=32&th=32', w: 32, h: 32, ratio: '1:1', description: 'Tiny square icon shown in browser tabs.' },
      { name: 'Background', slug: 'shopify-background-size', href: '/crop-and-resize?tw=1920&th=1080', w: 1920, h: 1080, ratio: '16:9', description: 'Full-width background image used in some themes.' },
    ],
  },
];

export function getHubPage(slug: string): HubPage | undefined {
  return hubPages.find((page) => page.slug === slug);
}
