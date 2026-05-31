// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://aspectratio.dev',
  integrations: [
    preact({ compat: true }),
    sitemap({
      filter: (page) => !page.includes('/convert/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
