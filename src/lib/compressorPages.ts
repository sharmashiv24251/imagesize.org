export type CompressorOutputFormat = 'jpeg' | 'webp' | 'png';

export interface CompressorPage {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  targetKb: number;
  format: CompressorOutputFormat;
  maxWidth?: number;
  maxHeight?: number;
  buttonLabel?: string;
  audience: string;
  aliases: string[];
  notes: string[];
  /** Link back to the corresponding image-size guide page (for cross-linking) */
  platformSizeHref?: string;
  /** Link to the platform-specific compression page (for cross-linking from size pages) */
  platformSlug?: string;
}

const sizeTargets: CompressorPage[] = [
  { slug: 'compress-image-to-20kb', title: 'Compress Image to 20KB Online', h1: 'Compress Image to 20KB', description: 'Compress an image to 20KB online in your browser. Reduce JPG, PNG, and WebP file size without uploading your image.', intro: 'Use this preset when a form, exam portal, or upload box asks for an image under 20KB.', targetKb: 20, format: 'jpeg', maxWidth: 600, maxHeight: 600, audience: 'Target KB', aliases: ['reduce image size to 20kb', 'photo compressor 20kb', 'compress jpg to 20kb'], notes: ['Best for tiny document-photo uploads.', 'JPG usually reaches 20KB more easily than PNG.'] },
  { slug: 'compress-image-to-50kb', title: 'Compress Image to 50KB Online', h1: 'Compress Image to 50KB', description: 'Compress an image to 50KB online with a private browser-based image compressor. Set target KB, format, and max dimensions.', intro: 'Use this 50KB preset for forms, profile photos, signatures, and upload portals with strict file-size limits.', targetKb: 50, format: 'jpeg', maxWidth: 800, maxHeight: 800, audience: 'Target KB', aliases: ['reduce image size to 50kb', 'photo compressor 50kb', 'compress jpg to 50kb'], notes: ['A good default for application photos and signatures.', 'Lower max width if a detailed photo is still too large.'] },
  { slug: 'compress-image-to-100kb', title: 'Compress Image to 100KB Online', h1: 'Compress Image to 100KB', description: 'Reduce image size to 100KB in your browser. Compress JPG, PNG, and WebP files with no upload.', intro: 'Use this preset for common upload limits where the image must stay under 100KB.', targetKb: 100, format: 'jpeg', maxWidth: 1000, maxHeight: 1000, audience: 'Target KB', aliases: ['reduce image size to 100kb', 'compress photo to 100kb', 'jpg compressor 100kb'], notes: ['Useful for profile photos, IDs, and form uploads.', 'Switch to WebP for websites, JPG for most forms.'] },
  { slug: 'compress-image-to-200kb', title: 'Compress Image to 200KB Online', h1: 'Compress Image to 200KB', description: 'Compress an image to 200KB online without uploading it. Works with JPG, PNG, and WebP in your browser.', intro: 'Use this preset when an upload form allows a little more detail but still requires a small file.', targetKb: 200, format: 'jpeg', maxWidth: 1280, maxHeight: 1280, audience: 'Target KB', aliases: ['reduce image size to 200kb', 'photo compressor 200kb', 'compress jpg to 200kb'], notes: ['Good balance for document and marketplace uploads.', 'Keep PNG only when transparency is required.'] },
  { slug: 'compress-image-to-500kb', title: 'Compress Image to 500KB Online', h1: 'Compress Image to 500KB', description: 'Compress images to 500KB online with local browser processing. No upload, no account, no tracking.', intro: 'Use this 500KB preset for web images, emails, product listings, and forms that accept medium-size files.', targetKb: 500, format: 'webp', maxWidth: 1600, maxHeight: 1600, audience: 'Target KB', aliases: ['reduce image size to 500kb', 'photo compressor 500kb', 'compress image under 500kb'], notes: ['WebP is usually best for websites.', 'JPG is safer when a form does not accept WebP.'] },
  { slug: 'compress-image-to-1mb', title: 'Compress Image to 1MB Online', h1: 'Compress Image to 1MB', description: 'Compress an image to 1MB online in your browser. Reduce large photos for email, websites, listings, and uploads.', intro: 'Use this preset when a photo is too large but still needs good visual quality.', targetKb: 1024, format: 'webp', maxWidth: 2000, maxHeight: 2000, audience: 'Target KB', aliases: ['reduce image size to 1mb', 'compress photo to 1mb', 'compress image under 1mb'], notes: ['Good for email attachments and website uploads.', 'Use JPG if WebP is not accepted by the destination.'] },
  { slug: 'compress-image-to-2mb', title: 'Compress Image to 2MB Online', h1: 'Compress Image to 2MB', description: 'Compress images to 2MB online with a no-upload image compressor. Choose format, quality, and optional max dimensions.', intro: 'Use this preset for platforms that reject large phone photos but allow files up to 2MB.', targetKb: 2048, format: 'webp', maxWidth: 2400, maxHeight: 2400, audience: 'Target KB', aliases: ['reduce image size to 2mb', 'compress photo to 2mb', 'compress image under 2mb'], notes: ['Keeps more detail than smaller KB targets.', 'Useful before uploading phone photos to websites and portals.'] },
];

const useCaseTargets: CompressorPage[] = [
  { slug: 'compress-image-for-email', title: 'Compress Image for Email', h1: 'Compress Image for Email', description: 'Compress photos for email attachments in your browser. Reduce image size for Gmail, Outlook, newsletters, and messages without uploading.', intro: 'Use this preset to make large photos easier to attach and faster to send.', targetKb: 1024, format: 'jpeg', maxWidth: 1600, maxHeight: 1600, audience: 'Email', aliases: ['reduce photo size for email', 'compress photo for gmail', 'compress image for outlook'], notes: ['JPG works reliably in Gmail and Outlook.', 'Use a lower target if you are sending many images.'] },
  { slug: 'compress-image-for-website', title: 'Compress Image for Website', h1: 'Compress Image for Website', description: 'Compress images for websites, page speed, and Core Web Vitals. Convert large photos to smaller WebP or JPG files locally.', intro: 'Use this preset to reduce page weight before uploading images to a website.', targetKb: 300, format: 'webp', maxWidth: 1600, maxHeight: 1600, audience: 'Website', aliases: ['reduce photo size for website', 'compress image for page speed', 'website image compressor'], notes: ['WebP is the default for modern websites.', 'Keep hero images large enough for the design, then compress.'] },
  { slug: 'compress-image-for-wordpress', title: 'Compress Image for WordPress', h1: 'Compress Image for WordPress', description: 'Compress images for WordPress before upload. Reduce JPG, PNG, or WebP size locally for faster pages.', intro: 'Use this preset before adding images to posts, pages, WooCommerce products, and media libraries.', targetKb: 300, format: 'webp', maxWidth: 1600, maxHeight: 1600, audience: 'Website', aliases: ['wordpress image compressor', 'compress images before wordpress upload', 'reduce image size for wordpress'], notes: ['Smaller images improve loading and bandwidth.', 'Use JPG when your WordPress setup does not support WebP.'] },
  { slug: 'compress-image-for-discord', title: 'Compress Image for Discord', h1: 'Compress Image for Discord', description: 'Compress images for Discord when a file is too large. Reduce photos locally before sharing them in chats or servers.', intro: 'Use this preset when Discord rejects an image or you want a smaller file before sharing.', targetKb: 8000, format: 'jpeg', maxWidth: 2400, maxHeight: 2400, audience: 'Messaging', aliases: ['discord image too large', 'compress photo for discord', 'reduce image size for discord'], notes: ['A larger target keeps shared images clear.', 'Lower the target for slower connections or many uploads.'] },
  { slug: 'offline-image-compressor', title: 'Offline Image Compressor in Your Browser', h1: 'Offline Image Compressor', description: 'Compress images without uploading them. This offline-friendly browser image compressor runs locally on your device.', intro: 'Use this page when privacy matters: the image is processed by your browser, not sent to a server.', targetKb: 500, format: 'webp', maxWidth: 1600, maxHeight: 1600, audience: 'Privacy', aliases: ['compress image without uploading', 'no upload image compressor', 'private image compressor'], notes: ['After the page loads, processing happens locally.', 'A strong choice for ID, passport, and personal photos.'] },
  { slug: 'compress-image-without-uploading', title: 'Compress Image Without Uploading', h1: 'Compress Image Without Uploading', description: 'Compress images privately without uploading files to a server. Reduce image size in KB using browser Canvas.', intro: 'Your image stays on your device while the browser creates a smaller export.', targetKb: 500, format: 'webp', maxWidth: 1600, maxHeight: 1600, audience: 'Privacy', aliases: ['no upload image compressor', 'local image compressor', 'private photo compressor'], notes: ['Good for sensitive documents and IDs.', 'Download the result directly from your browser.'] },
  { slug: 'compress-image-for-etsy', title: 'Compress Image for Etsy Listing', h1: 'Compress Image for Etsy', description: 'Compress product images for Etsy listings. Reduce photo file size while keeping product images clear.', intro: 'Use this preset for marketplace product photos that need to upload quickly and still look sharp.', targetKb: 1024, format: 'jpeg', maxWidth: 2000, maxHeight: 2000, audience: 'Marketplace', aliases: ['compress etsy listing photo', 'reduce image size for etsy', 'etsy image compressor'], notes: ['Square or near-square product photos usually work well.', 'Use the crop and resize tool if you also need exact pixels.'] },
  { slug: 'compress-image-for-ebay', title: 'Compress Image for eBay Listing', h1: 'Compress Image for eBay', description: 'Compress eBay listing images in your browser. Reduce large product photos before upload.', intro: 'Use this preset for product images that are too large for fast listing workflows.', targetKb: 1024, format: 'jpeg', maxWidth: 2000, maxHeight: 2000, audience: 'Marketplace', aliases: ['compress ebay listing photo', 'reduce image size for ebay', 'ebay image compressor'], notes: ['JPG is a reliable product-photo format.', 'Keep enough resolution for buyers to inspect details.'] },
  { slug: 'compress-image-for-shopify', title: 'Compress Image for Shopify Products', h1: 'Compress Image for Shopify', description: 'Compress product images for Shopify stores. Reduce file size locally for faster product pages.', intro: 'Use this preset before uploading product photos, collection images, or homepage media to Shopify.', targetKb: 500, format: 'webp', maxWidth: 2048, maxHeight: 2048, audience: 'Marketplace', aliases: ['shopify product image compressor', 'reduce image size for shopify', 'compress product photos for shopify'], notes: ['Smaller product images help storefront speed.', 'Use consistent dimensions across a product gallery.'] },
  { slug: 'compress-passport-photo', title: 'Compress Passport Photo Online', h1: 'Compress Passport Photo', description: 'Compress a passport photo to a smaller KB size in your browser. Private, no-upload photo compression for forms and applications.', intro: 'Use this preset for passport-photo uploads when a portal asks for a small file.', targetKb: 100, format: 'jpeg', maxWidth: 600, maxHeight: 600, audience: 'Document', aliases: ['passport photo compressor', 'reduce passport photo size', 'compress passport photo to kb'], notes: ['Check the exact country or portal rule before final upload.', 'Use JPG unless the form asks for another format.'] },
  { slug: 'compress-signature-image', title: 'Compress Signature Image Online', h1: 'Compress Signature Image', description: 'Compress signature images for online forms, exams, and document uploads. Reduce file size locally in your browser.', intro: 'Use this preset when an exam or government form requires a small signature upload.', targetKb: 20, format: 'jpeg', maxWidth: 400, maxHeight: 200, audience: 'Document', aliases: ['signature compressor', 'reduce signature size', 'compress signature to 20kb'], notes: ['Crop whitespace around the signature first for best results.', 'JPG usually makes tiny signature files easier.'] },
  { slug: 'compress-photo-for-ssc', title: 'Compress Photo for SSC Form', h1: 'Compress Photo for SSC', description: 'Compress a photo for SSC form uploads. Reduce photo and signature file size privately in your browser.', intro: 'Use this preset as a starting point for SSC-style exam form uploads, then confirm the current notice.', targetKb: 20, format: 'jpeg', maxWidth: 600, maxHeight: 600, audience: 'Exam', aliases: ['ssc photo compressor', 'reduce photo size for ssc', 'ssc image size compressor'], notes: ['Exam requirements can change by cycle.', 'Keep a clean background and correct crop before compressing.'], platformSizeHref: '/crop-and-resize?tw=413&th=531' },
  { slug: 'compress-photo-for-upsc', title: 'Compress Photo for UPSC Form', h1: 'Compress Photo for UPSC', description: 'Compress a photo for UPSC form uploads. Reduce image size in KB locally without uploading your file.', intro: 'Use this preset for UPSC-style application uploads where small JPG files are commonly required.', targetKb: 50, format: 'jpeg', maxWidth: 600, maxHeight: 600, audience: 'Exam', aliases: ['upsc photo compressor', 'reduce photo size for upsc', 'upsc image compressor'], notes: ['Always verify the current UPSC instructions.', 'Use the crop tool if the portal also requires exact dimensions.'], platformSizeHref: '/crop-and-resize?tw=413&th=531' },
  { slug: 'compress-photo-for-neet', title: 'Compress Photo for NEET Form', h1: 'Compress Photo for NEET', description: 'Compress a photo for NEET form uploads in your browser. Reduce JPG file size for application photos and signatures.', intro: 'Use this preset for NEET-style uploads where photo and signature files often have strict KB limits.', targetKb: 50, format: 'jpeg', maxWidth: 600, maxHeight: 600, audience: 'Exam', aliases: ['neet photo compressor', 'reduce photo size for neet', 'neet image compressor'], notes: ['Check the latest NEET bulletin before submitting.', 'Start with a clear, well-lit photo.'], platformSizeHref: '/crop-and-resize?tw=413&th=531' },
  { slug: 'compress-photo-for-pan-card', title: 'Compress Photo for PAN Card', h1: 'Compress Photo for PAN Card', description: 'Compress a PAN card photo upload to a smaller KB file. Private browser-based JPG compression with optional dimensions.', intro: 'Use this preset for PAN-card-related photo uploads when the destination portal limits file size.', targetKb: 50, format: 'jpeg', maxWidth: 600, maxHeight: 600, audience: 'Document', aliases: ['pan card photo compressor', 'reduce photo size for pan card', 'pan card image compressor'], notes: ['Check portal requirements for exact dimensions and KB.', 'Use JPG unless another format is specified.'], platformSizeHref: '/crop-and-resize?tw=213&th=213' },
];

const platformTargets: CompressorPage[] = [
  {
    slug: 'compress-image-for-linkedin',
    title: 'Compress Image for LinkedIn — Under 5 MB, Ready to Post',
    h1: 'Compress Image for LinkedIn',
    description: 'Compress LinkedIn post images, cover photos, and article covers in your browser. Reduce file size while keeping your 1200×628 px post image sharp and professional.',
    intro: 'LinkedIn recommends keeping images under 5 MB and accepts JPG, PNG, and GIF. Use this preset to compress a 1200×628 post image or 1584×396 cover photo before uploading.',
    targetKb: 4096,
    format: 'jpeg',
    maxWidth: 1920,
    maxHeight: 1920,
    audience: 'LinkedIn',
    aliases: ['compress linkedin image', 'reduce linkedin image size', 'linkedin image compressor', 'compress linkedin post photo'],
    notes: ['JPG is widely accepted by LinkedIn for post and cover images.', 'Keep post images at 1200×628 px and cover photos at 1584×396 px before compressing.'],
    platformSizeHref: '/linkedin-post-image-size',
    platformSlug: 'compress-image-for-linkedin',
  },
  {
    slug: 'compress-image-for-facebook',
    title: 'Compress Image for Facebook — Smaller Files, Sharper Posts',
    h1: 'Compress Image for Facebook',
    description: 'Compress Facebook post images, cover photos, and event covers in your browser. Reduce file size for the recommended 1200×630 px feed post before uploading.',
    intro: 'Facebook recommends images under 15 MB. Use this preset to compress a 1200×630 feed post or 820×312 cover photo so it uploads quickly and looks crisp in the feed.',
    targetKb: 4096,
    format: 'jpeg',
    maxWidth: 1920,
    maxHeight: 1920,
    audience: 'Facebook',
    aliases: ['compress facebook image', 'reduce facebook image size', 'facebook image compressor', 'compress fb post photo'],
    notes: ['JPG keeps Facebook post images sharp at smaller file sizes.', 'Crop to 1200×630 px before compressing for best feed display.'],
    platformSizeHref: '/facebook-post-image-size',
    platformSlug: 'compress-image-for-facebook',
  },
  {
    slug: 'compress-image-for-instagram',
    title: 'Compress Image for Instagram — Fast Uploads, No Quality Loss',
    h1: 'Compress Image for Instagram',
    description: 'Compress Instagram post and story images in your browser. Reduce file size for 1080×1080 square posts, 1080×1350 portrait posts, and 1080×1920 stories before uploading.',
    intro: 'Instagram recompresses uploads over 8 MB. Compress your image to under 8 MB and keep it at 1080 px wide so Instagram does not apply its own aggressive compression.',
    targetKb: 7168,
    format: 'jpeg',
    maxWidth: 1080,
    maxHeight: 1920,
    audience: 'Instagram',
    aliases: ['compress instagram image', 'reduce instagram image size', 'instagram image compressor', 'compress ig post photo'],
    notes: ['Keep images at exactly 1080 px wide to avoid Instagram upscaling.', 'JPG or WebP both work — JPG is slightly more compatible across devices.'],
    platformSizeHref: '/instagram-square-post-size',
    platformSlug: 'compress-image-for-instagram',
  },
  {
    slug: 'compress-image-for-youtube',
    title: 'Compress Image for YouTube — Thumbnails and Channel Art',
    h1: 'Compress Image for YouTube',
    description: 'Compress YouTube thumbnails and channel banner images in your browser. Reduce file size for 1280×720 thumbnails (under 2 MB) and 2560×1440 channel banners (under 6 MB).',
    intro: 'YouTube requires thumbnails under 2 MB and accepts JPG, GIF, or PNG. Channel banners must be under 6 MB. Use this preset to compress both to the right size before uploading.',
    targetKb: 1800,
    format: 'jpeg',
    maxWidth: 2560,
    maxHeight: 2560,
    audience: 'YouTube',
    aliases: ['compress youtube thumbnail', 'reduce youtube image size', 'youtube image compressor', 'compress youtube channel art'],
    notes: ['Thumbnails must be under 2 MB — use the 2 MB target if this preset is too small.', 'Keep thumbnail text and faces in the center third to avoid cropping on different devices.'],
    platformSizeHref: '/youtube-thumbnail-size',
    platformSlug: 'compress-image-for-youtube',
  },
  {
    slug: 'compress-image-for-twitter',
    title: 'Compress Image for Twitter / X — Under 5 MB for Posts',
    h1: 'Compress Image for Twitter / X',
    description: 'Compress Twitter / X post images and header photos in your browser. Reduce file size for 1200×675 post images and 1500×500 header banners before uploading.',
    intro: 'Twitter / X requires images under 5 MB for posts (JPG or PNG) and under 5 MB for headers. Use this preset to compress your 1200×675 post image so it uploads instantly.',
    targetKb: 4096,
    format: 'jpeg',
    maxWidth: 1500,
    maxHeight: 1500,
    audience: 'Twitter/X',
    aliases: ['compress twitter image', 'compress x image', 'reduce twitter image size', 'twitter image compressor'],
    notes: ['JPG is the most reliable format for Twitter/X post images.', 'Header / banner images should be 1500×500 px before compression.'],
    platformSizeHref: '/twitter-image-size',
    platformSlug: 'compress-image-for-twitter',
  },
  {
    slug: 'compress-image-for-whatsapp',
    title: 'Compress Image for WhatsApp — Share Without Quality Loss',
    h1: 'Compress Image for WhatsApp',
    description: 'Compress images for WhatsApp before sending. Reduce large phone photos locally in your browser so WhatsApp does not apply its own heavy compression on shared images.',
    intro: 'WhatsApp compresses images it sends. Send a pre-compressed image to keep more detail and reduce the time spent uploading on slower connections.',
    targetKb: 1024,
    format: 'jpeg',
    maxWidth: 1600,
    maxHeight: 1600,
    audience: 'WhatsApp',
    aliases: ['compress whatsapp image', 'reduce whatsapp image size', 'whatsapp image compressor', 'compress whatsapp photo'],
    notes: ['JPG keeps shared images sharp and universally compatible.', 'Keep images under 1 MB for fast delivery on slower mobile connections.'],
    platformSizeHref: '/whatsapp-profile-photo-size',
    platformSlug: 'compress-image-for-whatsapp',
  },
  {
    slug: 'compress-image-for-pinterest',
    title: 'Compress Image for Pinterest — Optimise Pins Before Upload',
    h1: 'Compress Image for Pinterest',
    description: 'Compress Pinterest pin images in your browser. Reduce file size for 1000×1500 standard pins and 1000×2100 long infographic pins before uploading to your boards.',
    intro: 'Pinterest recommends keeping images under 20 MB and favours vertical pins at a 2:3 ratio (1000×1500 px). Compress your pins to keep load times fast for viewers browsing on mobile.',
    targetKb: 2048,
    format: 'jpeg',
    maxWidth: 1000,
    maxHeight: 3000,
    audience: 'Pinterest',
    aliases: ['compress pinterest image', 'reduce pinterest image size', 'pinterest image compressor', 'compress pinterest pin'],
    notes: ['Vertical 2:3 pins (1000×1500 px) perform best on Pinterest.', 'JPG is recommended for photos; PNG works better for graphics with text.'],
    platformSizeHref: '/pinterest-standard-pin-size',
    platformSlug: 'compress-image-for-pinterest',
  },
  {
    slug: 'compress-image-for-tiktok',
    title: 'Compress Image for TikTok — Profile Photos and Slide Posts',
    h1: 'Compress Image for TikTok',
    description: 'Compress TikTok profile photos and image post slides in your browser. Reduce file size for 1080×1920 vertical images before uploading to TikTok.',
    intro: 'TikTok image posts use vertical 9:16 frames (1080×1920 px). Use this preset to compress your images to a shareable size before adding them to a TikTok slideshow or photo post.',
    targetKb: 4096,
    format: 'jpeg',
    maxWidth: 1080,
    maxHeight: 1920,
    audience: 'TikTok',
    aliases: ['compress tiktok image', 'reduce tiktok image size', 'tiktok image compressor', 'compress tiktok photo'],
    notes: ['Keep images at 1080×1920 px for full-screen vertical display.', 'JPG works for photos; PNG is better for graphics with sharp text.'],
    platformSizeHref: '/tiktok-video-size',
    platformSlug: 'compress-image-for-tiktok',
  },
];

export const compressorPages: CompressorPage[] = [...sizeTargets, ...useCaseTargets, ...platformTargets].sort((a, b) => a.slug.localeCompare(b.slug));

export function getCompressorPage(slug: string): CompressorPage | undefined {
  return compressorPages.find((page) => page.slug === slug);
}

export function getRelatedCompressorPages(page: CompressorPage, limit = 10): CompressorPage[] {
  const candidates = compressorPages.filter((item) => item.slug !== page.slug);
  const index = candidates.findIndex((item) => item.slug.localeCompare(page.slug) > 0);
  const center = index === -1 ? candidates.length : index;
  const start = Math.max(0, Math.min(center - Math.floor(limit / 2), candidates.length - limit));
  return candidates.slice(start, start + limit);
}
