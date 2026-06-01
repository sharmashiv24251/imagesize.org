import { useMemo, useState } from 'preact/hooks';
import type { ExamPage } from '../../lib/examPages';

interface ExamSearchIslandProps {
  exams: ExamPage[];
}

function normalize(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function highlight(text: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark class="bg-teal-500/20 text-teal-300 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export default function ExamSearchIsland({ exams }: ExamSearchIslandProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return exams;

    return exams
      .map((page) => {
        const haystack = normalize([
          page.exam.name,
          page.exam.body,
          page.exam.category,
          page.exam.background,
        ].join(' '));

        const name = normalize(page.exam.name);
        let score = 0;
        if (name === q) score = 100;
        else if (name.startsWith(q)) score = 80;
        else if (name.includes(q)) score = 55;
        else if (haystack.includes(q)) score = 20;
        else score = -1;

        return { page, score };
      })
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(({ page }) => page);
  }, [exams, query]);

  const VISIBLE_ROWS = 8;
  const ROW_HEIGHT = 64;

  return (
    <div class="space-y-4 mb-10">
      {/* Search input */}
      <div class="rounded-xl border border-border-dark/70 bg-surface overflow-hidden">
        <div class="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-border-dark/50">
          <div class="w-8 h-8 rounded-lg bg-surface-2 border border-border-dark/60 text-text-muted flex items-center justify-center shrink-0">
            <SearchIcon />
          </div>
          <label class="sr-only" for="exam-search">Search exam photo requirements</label>
          <input
            id="exam-search"
            value={query}
            onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
            placeholder="e.g. NEET, UPSC, JEE, SSC…"
            class="flex-1 bg-transparent text-text-primary placeholder:text-text-muted/45 outline-none text-lg sm:text-xl font-medium tracking-tight"
            autocomplete="off"
            spellcheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              class="text-text-muted hover:text-text-primary transition-colors shrink-0"
              aria-label="Clear search"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Results */}
        <div
          class="divide-y divide-border-dark/40 overflow-y-auto"
          style={{ maxHeight: `${VISIBLE_ROWS * ROW_HEIGHT}px` }}
        >
          {filtered.length > 0 ? (
            filtered.map((page) => (
              <a
                key={page.slug}
                href={`/${page.slug}`}
                class="group flex items-center gap-4 px-4 sm:px-5 hover:bg-surface-2/35 transition-colors"
                style={{ minHeight: `${ROW_HEIGHT}px` }}
              >
                <div class="w-7 h-7 rounded-lg text-text-muted group-hover:text-teal-400 flex items-center justify-center shrink-0 transition-colors">
                  <SearchIcon />
                </div>
                <div class="min-w-0 flex-1 py-2">
                  <div class="text-sm font-semibold text-text-primary">
                    {highlight(page.exam.name, query)}
                  </div>
                  <div class="text-xs text-text-muted mt-0.5">{page.exam.body} · {page.exam.category}</div>
                </div>
                <div class="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <span class="font-mono text-xs text-teal-300">
                    {page.exam.photoW}×{page.exam.photoH} px
                  </span>
                  <span class="text-[10px] text-text-muted">≤ {page.exam.photoMaxKb} KB</span>
                </div>
                <svg class="w-3.5 h-3.5 text-text-muted group-hover:text-teal-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            ))
          ) : (
            <div class="px-5 py-10 text-center">
              <p class="text-text-primary font-medium">No exam found for "{query}".</p>
              <p class="text-xs text-text-muted mt-1">
                Try the full exam name — we're adding more exams regularly.
              </p>
            </div>
          )}
        </div>
      </div>

      <p class="text-xs text-text-muted">
        {filtered.length} exam{filtered.length !== 1 ? 's' : ''} found
        {query ? ` for "${query}"` : ''} · scroll inside the list to see all.
      </p>
    </div>
  );
}
