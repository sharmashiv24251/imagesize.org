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
      filter: (page) => {
        // Exclude tier-3 programmatic pages from sitemap
        const excludePatterns = [
          '/convert/',    // Tier 3: programmatic conversion pages
          '/devices/',    // Tier 3: individual device pages (until promoted)
        ];
        return !excludePatterns.some((pattern) => page.includes(pattern));
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
