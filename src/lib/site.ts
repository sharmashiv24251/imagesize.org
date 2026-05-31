export const site = {
  name: 'imagesize.org',
  shortName: 'Image Size',
  initials: 'IS',
  url: 'https://imagesize.org',
  description: 'Resize, crop, compress, and check image dimensions for social posts, forms, headers, and everyday uploads.',
};

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, site.url).toString();
}
