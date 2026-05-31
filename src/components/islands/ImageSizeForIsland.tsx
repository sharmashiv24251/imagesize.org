import { useMemo, useState } from 'preact/hooks';
import type { ImageSizeForCategory, ImageSizeForOption } from '../../lib/imageSizeFor';

interface ImageSizeForIslandProps {
  options: ImageSizeForOption[];
}

type CategoryFilter = 'all' | ImageSizeForCategory;

const categoryOrder: CategoryFilter[] = [
  'all',
  'popular',
  'social',
  'professional',
  'video',
  'print',
  'marketplace',
  'website',
  'document',
  'apparel',
  'email',
  'education',
  'visa',
  'messaging',
  'cinema',
  'display-ads',
  'misc',
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeSearchInput(value: string): string {
  return normalize(value)
    .replace(/^(image|photo|picture)\s+size\s+(for|of)\s+/, '')
    .replace(/^size\s+(for|of)\s+/, '')
    .trim();
}

function highlightedTerm(term: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return <strong>{term}</strong>;

  const lowerTerm = term.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerTerm.indexOf(lowerQuery);

  if (index === -1) return <strong>{term}</strong>;

  return (
    <strong>
      {term.slice(0, index)}
      <mark class="bg-teal-500/20 text-teal-300 rounded px-0.5">{term.slice(index, index + trimmed.length)}</mark>
      {term.slice(index + trimmed.length)}
    </strong>
  );
}

function SearchIcon() {
  return (
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function ImageSizeForIsland({ options }: ImageSizeForIslandProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const categoryLabels = useMemo(() => {
    const labels = new Map<CategoryFilter, string>([['all', 'All']]);
    for (const item of options) labels.set(item.category, item.categoryLabel);
    return labels;
  }, [options]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryFilter, number>([['all', options.length]]);
    for (const item of options) counts.set(item.category, (counts.get(item.category) || 0) + 1);
    return counts;
  }, [options]);

  const visibleCategories = categoryOrder.filter((item) => categoryCounts.has(item));

  const filtered = useMemo(() => {
    const q = normalizeSearchInput(query);

    return options
      .map((item) => {
        const haystack = normalize([
          item.term,
          item.categoryLabel,
          item.description,
          item.ratio || '',
          item.w && item.h ? `${item.w} ${item.h}` : '',
          ...item.aliases,
        ].join(' '));
        const term = normalize(item.term);
        const aliasHit = item.aliases.some((alias) => normalize(alias).includes(q));
        let score = item.featured ? 12 : 0;

        if (!q) score += item.featured ? 50 : 0;
        else if (term === q) score += 100;
        else if (term.startsWith(q)) score += 80;
        else if (term.includes(q)) score += 55;
        else if (aliasHit) score += 38;
        else if (haystack.includes(q)) score += 20;
        else score = -1;

        if (category !== 'all' && item.category !== category) score = -1;
        return { item, score };
      })
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score || a.item.term.localeCompare(b.item.term))
      .map(({ item }) => item);
  }, [category, options, query]);

  const shown = filtered;
  const leading = query.trim() ? query.trim() : 'linkedin post';
  const highlightQuery = normalizeSearchInput(query);

  const VISIBLE_ROWS = 10;
  const ROW_HEIGHT = 72;

  return (
    <div class="space-y-5">
      <div class="rounded-xl border border-border-dark/70 bg-surface overflow-hidden">
        <div class="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-border-dark/50">
          <div class="w-9 h-9 rounded-lg bg-surface-2 border border-border-dark/60 text-text-muted flex items-center justify-center shrink-0">
            <PlusIcon />
          </div>
          <label class="sr-only" for="image-size-for-search">Search image size options</label>
          <div class="min-w-0 flex-1 flex items-center gap-2 text-2xl sm:text-3xl font-medium tracking-tight">
            <span class="text-text-primary whitespace-nowrap">image size for</span>
            <input
              id="image-size-for-search"
              value={query}
              onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
              placeholder="linkedin post"
              class="min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-muted/45 outline-none"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="px-4 sm:px-5 py-3 border-b border-border-dark/50 flex gap-2 overflow-x-auto">
          {visibleCategories.map((item) => (
            <button
              type="button"
              onClick={() => setCategory(item)}
              class={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                category === item
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                  : 'bg-bg border-border-dark/70 text-text-muted hover:text-text-primary hover:border-teal-500/30'
              }`}
            >
              {categoryLabels.get(item)}
              <span class="ml-1 text-[10px] opacity-60">{categoryCounts.get(item)}</span>
            </button>
          ))}
        </div>

        <div
          class="divide-y divide-border-dark/40 overflow-y-auto"
          style={{ maxHeight: `${VISIBLE_ROWS * ROW_HEIGHT}px`, scrollBehavior: 'smooth' }}
        >
          {shown.length > 0 ? (
            shown.map((item) => (
              <a
                href={item.href}
                class="group grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-4 sm:px-5 hover:bg-surface-2/35 transition-colors"
                style={{ minHeight: `${ROW_HEIGHT}px`, display: 'grid', alignItems: 'center' }}
              >
                <div class="w-8 h-8 rounded-lg text-text-muted group-hover:text-teal-400 flex items-center justify-center">
                  <SearchIcon />
                </div>
                <div class="min-w-0 py-3">
                  <div class="text-xl sm:text-2xl text-text-primary tracking-tight">
                    <span class="text-text-muted">image size for </span>{highlightedTerm(item.term, highlightQuery)}
                  </div>
                  <p class="text-xs text-text-muted mt-1 truncate">{item.description}</p>
                </div>
                <div class="hidden sm:flex flex-col items-end justify-center gap-1">
                  {item.w && item.h ? (
                    <span class="font-mono text-sm tabular-nums text-teal-300">{item.w}x{item.h}</span>
                  ) : (
                    <span class="text-xs text-text-muted">Custom</span>
                  )}
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-bg border border-border-dark/70 text-text-muted">
                    {item.categoryLabel}
                  </span>
                </div>
              </a>
            ))
          ) : (
            <div class="px-5 py-12 text-center">
              <p class="text-text-primary font-medium">No exact match for "{leading}".</p>
              <p class="text-sm text-text-muted mt-1">Try a platform, document, paper size, social post, or exact dimension.</p>
              <a href="/crop-and-resize" class="inline-flex mt-4 px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors">
                Open custom crop and resize
              </a>
            </div>
          )}
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-muted">
        <p>{shown.length} match{shown.length !== 1 ? 'es' : ''} · scroll inside the list to see all.</p>
        <p>Tip: paste full searches too, like "image size of passport" or "image size for a4 paper".</p>
      </div>
    </div>
  );
}
