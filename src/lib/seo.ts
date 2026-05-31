/**
 * seo.ts — JSON-LD builders, meta helpers, and indexing tier system.
 *
 * Indexing tiers:
 *   Tier 1 — Hand-quality pages. Always indexed, always in sitemap. High priority.
 *   Tier 2 — Substantive pages with live tools + unique content. Indexed, in sitemap. Medium priority.
 *   Tier 3 — Programmatic / thin pages. Start as noindex, promoted when they earn demand.
 */

// ─── Types ───

export type IndexingTier = 1 | 2 | 3;

export interface FAQ {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface PageSEO {
  title: string;
  description: string;
  canonicalUrl: string;
  tier: IndexingTier;
  jsonLD: object[];
  ogImage?: string;
}

// ─── Indexing Tier Helpers ───

/** Get robots meta content for a given tier */
export function getRobotsMeta(tier: IndexingTier): string | null {
  switch (tier) {
    case 1:
    case 2:
      return null; // No robots meta needed — defaults to index,follow
    case 3:
      return 'noindex,follow'; // Don't index until promoted
  }
}

/** Get sitemap priority for a given tier */
export function getSitemapPriority(tier: IndexingTier): number {
  switch (tier) {
    case 1:
      return 1.0;
    case 2:
      return 0.7;
    case 3:
      return 0.3;
  }
}

/** Get sitemap change frequency for a given tier */
export function getSitemapChangeFreq(tier: IndexingTier): string {
  switch (tier) {
    case 1:
      return 'weekly';
    case 2:
      return 'monthly';
    case 3:
      return 'monthly';
  }
}

/** Should this page be included in the sitemap? */
export function shouldIncludeInSitemap(tier: IndexingTier): boolean {
  return tier <= 2; // Only tier 1 and 2 pages go in sitemap
}

// ─── JSON-LD Builders ───

export function buildWebApplicationLD(name: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    browserRequirements: 'Requires JavaScript',
    creator: {
      '@type': 'Organization',
      name: 'aspectratio.dev',
      url: 'https://aspectratio.dev',
    },
  };
}

export function buildFAQLD(faqs: FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbLD(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** HowTo schema for step-by-step tool pages (resize, crop, etc.) */
export function buildHowToLD(
  name: string,
  description: string,
  steps: { name: string; text: string }[],
  url?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(url && { url }),
    totalTime: 'PT1M',
    tool: {
      '@type': 'HowToTool',
      name: 'aspectratio.dev',
    },
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/** Website schema — used on homepage only */
export function buildWebSiteLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'aspectratio.dev',
    url: 'https://aspectratio.dev',
    description: 'The fastest, cleanest aspect ratio toolkit on the web. Calculator, image analyzer, crop & resize tools — 100% client-side.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://aspectratio.dev/calculator?w={width}&h={height}',
      },
      'query-input': 'required name=width name=height',
    },
  };
}

/** SoftwareApplication schema — for dev tools (CSS generator, etc.) */
export function buildSoftwareApplicationLD(
  name: string,
  description: string,
  url: string,
  category: string = 'DeveloperApplication'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory: category,
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}
