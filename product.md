# aspectratio.dev — Product Specification

> The fastest, cleanest, most beautiful aspect-ratio toolkit on the web — built developer-first, designed to earn rankings instead of spamming for them.

**Status:** v1 spec · **Stack:** Astro + TypeScript · **Owner:** you · **Last updated:** keep this current

---

## 1. Positioning (read this before writing a single line of code)

**What we are:** A precision instrument for image, video, screen, social, and design dimensions. Instant, beautiful, no clutter. The kind of free tool developers and designers bookmark and _link to_.

**What we are NOT:** An ad-stuffed calculator farm. We are not trying to out-feature the incumbents (`aspectratiocalculator.com`, `aspectratiotool.com`, `calculateaspectratio.com` already ship most "rare" features). We win on **speed, design, and a few interactive tools nobody nails** — then expand.

**The one-sentence test for every feature:** _Would a developer or designer screenshot this, share it, or link to it?_ If no, it's a Tier-3 page or it doesn't ship.

### The wedge (where incumbents are weak)

1. **Speed + zero clutter.** The most-used competitor is "fast but filled with ads." We are instant-on-keystroke, ads strictly below the fold, never blocking the tool.
2. **Interactive visual tools.** Live **crop / padding / letterbox simulator** and an instant **platform-compatibility grid** — sticky, screenshot-able, hard to copy.
3. **The `.dev` cluster.** CSS / Tailwind / SVG / React generators + device & resolution reference. Devs link to good free dev tools — this is how we earn the authority to rank at all.

---

## 2. Strategic principles (non-negotiable)

| Principle                                  | What it means in practice                                                                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Earn rankings, don't spam**              | No 5,000 thin auto-pages at launch. Pages exist only if they carry a real interactive tool + unique content. Tier-3 dimension pages start `noindex` and release in controlled batches. |
| **Dev-first, then social**                 | Ship the developer/designer cluster before the social-media land grab. Lower competition, link-worthy, on-brand for `.dev`.                                                            |
| **Speed is the product**                   | Ship ~0 JS by default (Astro islands). Hydrate only the tool on a page. Green Core Web Vitals are a launch requirement, not a nice-to-have.                                            |
| **Privacy by default**                     | Image analysis is 100% client-side (Canvas API). Nothing uploaded to a server. State this on-page — it's a trust + SEO signal.                                                         |
| **Monetization mix, AdSense as the floor** | AdSense below the fold only. Real money comes from affiliate (Canva/Adobe/CapCut/stock), a Pro tier, and a paid API.                                                                   |

---

## 3. Tech stack & architecture

### Core

- **Astro** (static output) — content-heavy site with islands. Ships zero JS until a tool needs it → ideal for CWV + SEO.
- **TypeScript** (`strict: true`) everywhere.
- **Tailwind CSS** via `@astrojs/tailwind` with a custom token layer (see Design System).
- **Preact** (`@astrojs/preact`) for interactive islands — tiny runtime, React-like DX. (Vanilla TS web components are fine for the simplest islands.)
- **nanostores** (`@nanostores/preact`) for cross-island state (e.g. current width/height shared between calculator and visualizer).
- **Content Collections + Zod** for all reference data (ratios, devices, resolutions, platforms) — typed data drives both UI and programmatic pages.

### Performance & SEO infra

- **`@astrojs/sitemap`** — auto sitemap, with explicit exclusion rules for `noindex` tiers.
- **`@astrojs/partytown`** — run AdSense + analytics off the main thread. Protects CWV.
- **`astro:assets`** (Sharp) for any first-party imagery (OG images, illustrations).
- **JSON-LD** structured data emitted per page type (see SEO section).

### Client-side compute (no backend for MVP)

- **Canvas API** for upload analysis, crop preview, padding/letterbox rendering.
- All math (ratio, GCD simplification, nearest-ratio, resize) in a typed `/src/lib/ratio.ts` module — pure functions, unit-tested.
- **Client-side image export** via `browser-image-compression` (or a Squoosh-style WASM codec) so users can download the cropped/padded result at a chosen size/quality — no upload, no server.

### Recommended libraries (lean, client-side where possible)

| Need                                          | Choice                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| Schema / validation                           | **Zod** (content + form state); Valibot if bundle size bites              |
| Generic math utilities                        | **mathjs** (only where `ratio.ts` doesn't already cover it)               |
| Unit conversion (PPI/print/CSS units cluster) | **convert-units**                                                         |
| Canvas crop / drag preview                    | **Cropper.js** or a lightweight custom canvas layer                       |
| Image compression / export                    | **browser-image-compression**, Compressor.js, or WASM codecs              |
| Analytics                                     | **Plausible / Cloudflare Web Analytics** (privacy-friendly), GA4 optional |

### Deployment

- **Cloudflare Pages** (free tier, global edge, instant cache). Netlify/Vercel are fine alternatives.
- **API product (later):** **Cloudflare Worker** exposing `/v1/ratio`, `/v1/nearest`, `/v1/resize` — recurring revenue, decoupled from SEO.

### Why this stack

Astro's island model is the cleanest way to satisfy "real working product + perfect on-screen SEO + perfect speed" at once: content/SEO is static HTML, tools hydrate in isolation, nothing bloats the page.

---

## 4. Information architecture & routes

```
/                              Home — universal calculator + hero links
/calculator                    Universal calculator (canonical tool hub)
/image                         Upload analyzer + compatibility grid  ← HERO
/crop                          Crop / padding / letterbox visualizer ← HERO
/resize                        Resize & convert (crop/pad/scale)
/compare                       Visual ratio comparison

/css-aspect-ratio              Dev: CSS generator                    ← .dev cluster
/tailwind-aspect-ratio         Dev: Tailwind class generator
/svg-viewbox                   Dev: SVG viewBox calculator
/react-aspect-ratio            Dev: React component snippet
/px-to-rem  /rem-to-px         Dev: CSS unit converters              ← CSS-units cluster
/px-to-em   /px-to-pt          Dev: CSS unit converters
/px-to-vh   /px-to-vw          Dev: CSS unit converters

/ppi-calculator                Pixel density (PPI/DPI) calculator    ← PPI / print cluster
/pixels-to-inches  /inches-to-pixels   px ↔ physical size at a DPI
/cm-to-pixels                  Metric ↔ pixels at a DPI
/paper-size/[size]             A4 / Letter at 72/150/300/600 DPI (with print-px table)

/ratio/[ratio]                 16:9, 4:3, 21:9, 9:16, 1:1, 3:2 …     (Tier 1, hand-built)
/devices                       Device resolution database
/devices/[device]              iPhone 16 Pro, etc.
/resolutions                   Screen resolution database (1080p, 1440p, 4K…)
/[platform]-[asset]-size       linkedin-banner-size, youtube-thumbnail-size … (Tier 2)

/embed/[tool]                  Embeddable widget endpoints (link-earning asset)
/convert/[from]-to-[to]        1920x1080-to-4-3 …                    (Tier 3, noindex first)
/guides/*                      Editorial: history, photography, cinema, AI ratios
/api                           API product landing (later)
/pro                           Pro tier landing
```

**Tiering (the anti-penalty system):**

- **Tier 1** — hand-built, unique copy, real tool, FAQs. ~12–15 pages. These earn links. Index immediately.
- **Tier 2** — templated but substantive: each embeds a live "size/check/resize for this platform" tool, not just a number. Release gradually, monitor traction.
- **Tier 3** — dimension-pair conversion pages. **Ship `noindex`**, release in small batches once domain authority exists, prune anything that gets no traction after ~6 months.

**Adjacent clusters (build into aspectratio.dev, they share all the infra):** the **CSS-units** cluster (`px↔rem/em/pt/vh`) is pure dev-cluster overlap and earns dev links; the **PPI/DPI/print** cluster (`pixels↔inches`, `cm→pixels`, A4/Letter at 300 DPI, PPI calculator) is topically adjacent, higher-CPC than ratio math, and a strong source of _linkable assets_ (printable charts). Heavier sister tools from the wider plan — **online ruler** (device detect → card calibration → manual) and **measure-image-size** — are better as their own properties cross-linked to this one, not bolted onto the ratio spec; keep them in the family, out of this codebase.

---

## 5. Feature specification

### 5.1 Universal Calculator (table stakes — just be the best version)

- Inputs: Width, Height. Live, on-keystroke (debounced 80ms).
- Outputs: simplified ratio (GCD), decimal ratio (4 dp), orientation (Landscape/Portrait/Square), nearest common ratio.
- Modes: `W×H → ratio` · `ratio + one dimension → other` · lock-ratio scaling.
- All numeric output in **monospace, tabular figures**. Copy-to-clipboard on every value.
- A small live **proportion preview** rectangle that animates as numbers change.

### 5.2 Nearest Common Ratio Detector

- Given arbitrary W×H, return ranked common ratios with % difference and a confidence label.
- Example: `1180×820 → 4:3 (0.3% off) · 3:2 (4.1%) · 16:10 (6.2%)`.
- "Ratio Fingerprint" framing: `1777×1000 → 16:9, 99.95% confidence`.

### 5.3 Image Upload Analyzer + Compatibility Grid — **HERO**

- Drag-drop / click upload. **Client-side only** (Canvas), privacy stated on-page.
- Outputs: resolution, ratio, decimal, orientation, file size, file type.
- **Compatibility grid:** for each platform/format, show ✅ fits / 🟡 needs crop / ❌ wrong shape, with the exact target dimensions and what to change.
- One-click → opens that crop in the Visualizer.
- Optional **compress & export** (client-side): download the analyzed image at a target size/quality. Free for single images; batch is Pro.

### 5.4 Crop / Padding / Letterbox Visualizer — **HERO**

- Live preview over the user's actual image.
- **Crop mode:** draggable crop box locked to a chosen target ratio; shows pixels removed (e.g. "remove 756px vertically").
- **Padding mode:** add bars instead of cropping; shows px added per side + a background color/blur option.
- **Letterbox mode:** e.g. `16:9 → 21:9`, shows bar thickness top/bottom.
- Export the result (download via Canvas) — a Pro upsell point for batch.

### 5.5 Resize & Convert

- Resize without distortion (scale one dimension, compute the other).
- Convert current → target ratio with crop vs pad recommendation.
- Vertical converter (`16:9 → 9:16`) and the reverse, for Shorts/Reels creators.

### 5.6 Visual Comparison Tool

- Overlay/side-by-side of multiple ratios (16:9 vs 3:2 vs 4:3 vs 1:1) at shared area or shared width.
- Shareable URL state (`?compare=16:9,4:3,1:1`).

### 5.7 Developer Cluster (.dev advantage)

Each is a tiny tool + copy button + the on-page explainer:

- **CSS:** `aspect-ratio: 16 / 9;` plus padding-top fallback snippet.
- **Tailwind:** maps to `aspect-video` / `aspect-square` / arbitrary `aspect-[16/9]`.
- **SVG viewBox:** `800×600 → viewBox="0 0 800 600"`.
- **React/Preact:** copy-paste `<AspectRatio>` component snippet.

### 5.8 Reference Databases

- **Devices:** name, native resolution, ratio, PPI, category. Reverse lookup (`1179×2556 → iPhone 15 Pro, 19.5:9`).
- **Resolutions:** 1080p/1440p/4K/8K/ultrawide with labels + ratio.
- Search + filter, each entry can deep-link into the calculator.

### 5.9 Natural-language input (light AI / lookup)

- Type "youtube thumbnail" → `1280×720, 16:9`. "iphone wallpaper" → device dimensions.
- v1: dictionary lookup over the platform/device collections (no model needed). v2: optional LLM fallback.

### 5.10 Batch Analyzer — **Pro**

- Upload many images → table of dimensions/ratios/compatibility, export CSV. The agency use case.

### 5.11 API — **Pro/paid, later**

- `GET /v1/ratio?w=1920&h=1080`, `/v1/nearest`, `/v1/resize`. Cloudflare Worker. Keyed, rate-limited, simple pricing.

### 5.12 CSS Units Cluster (.dev overlap)

- `px ↔ rem`, `px ↔ em`, `px → pt`, `px → vh/vw`. Configurable root font-size and viewport.
- Same tiny-tool + copy-button + explainer pattern as the dev cluster. Pure overlap with the developer audience and an easy long-tail win (`px to rem` is a high-volume, low-defensibility term).

### 5.13 PPI / DPI & Print Cluster

- **PPI/DPI calculator:** width × height + diagonal → pixel density; or PPI → physical size.
- **Pixels ↔ inches / cm at a chosen DPI** (uses `convert-units`).
- **Paper sizes at every DPI:** A4 / Letter / A3… rendered as a print-pixel table (e.g. A4 @ 300 DPI = 2480×3508). The table doubles as a **linkable asset** (designers/teachers cite it).
- Higher advertiser value than pure ratio math; print intent is more commercial.

### 5.14 Embeddable Widget — **growth / link-earning lever**

- `/embed/calculator`, `/embed/ratio`, etc. — an `<iframe>` snippet other sites can drop in, with a small "powered by aspectratio.dev" backlink.
- Themeable (light/dark, accent), responsive, zero-config. This is one of the cleanest white-hat backlink engines available for a tool site — every embed is a contextual link.

---

## 6. Design system

### 6.1 Brand concept — "Golden Section"

Precision-instrument aesthetic: confident neutrals, monospace numbers, a single warm **gold** highlight nodding to the golden ratio (1.618), and a cool **teal** as the interactive/brand color. Feels like a well-made design tool, not a content farm. Dark mode is primary; light mode is first-class.

### 6.2 Color tokens

**Neutrals (warm "Stone")**

| Token       | Hex       | Use                |
| ----------- | --------- | ------------------ |
| `stone-50`  | `#FAFAF8` | Light bg / paper   |
| `stone-100` | `#F2F1ED` | Light surface      |
| `stone-200` | `#E5E3DC` | Light borders      |
| `stone-300` | `#D2CFC4` | Dividers           |
| `stone-400` | `#A8A496` | Muted text (light) |
| `stone-500` | `#807C6E` | Secondary text     |
| `stone-600` | `#5E5A4F` | Body (light)       |
| `stone-700` | `#44413A` | Headings (light)   |
| `stone-800` | `#2A2823` | —                  |
| `stone-900` | `#1A1916` | —                  |
| `stone-950` | `#0F0E0C` | —                  |

**Dark surfaces**

| Token        | Hex       | Use                   |
| ------------ | --------- | --------------------- |
| `bg`         | `#0E1015` | App background (dark) |
| `surface`    | `#161A21` | Cards / panels        |
| `surface-2`  | `#1E242D` | Raised / inputs       |
| `border`     | `#2A313C` | Borders (dark)        |
| `text`       | `#E8E9EC` | Primary text (dark)   |
| `text-muted` | `#9AA1AC` | Secondary text (dark) |

**Primary — Teal (interactive / brand)**

| Token          | Hex                   |
| -------------- | --------------------- |
| `teal-50`      | `#ECFDF8`             |
| `teal-100`     | `#CFFAEE`             |
| `teal-200`     | `#9FF3DE`             |
| `teal-300`     | `#5FE6C9`             |
| `teal-400`     | `#21CFB0`             |
| **`teal-500`** | **`#0FB5A1`** (brand) |
| `teal-600`     | `#0A9183`             |
| `teal-700`     | `#0C7268`             |
| `teal-800`     | `#0F5B54`             |
| `teal-900`     | `#114B47`             |

**Accent — Gold (golden-ratio highlight, use sparingly)**

| Token          | Hex           |
| -------------- | ------------- |
| `gold-400`     | `#F8CB5C`     |
| **`gold-500`** | **`#F4B740`** |
| `gold-600`     | `#E09B1F`     |

**Semantic (drives the compatibility grid)**

| Token     | Hex       | Meaning                    |
| --------- | --------- | -------------------------- |
| `success` | `#2BBE6A` | Fits the target ratio      |
| `warning` | `#F59E0B` | Close — needs crop/pad     |
| `danger`  | `#F0584B` | Wrong shape                |
| `info`    | `#0FB5A1` | Neutral info (reuses teal) |

> **Usage discipline:** teal = the one interactive color. Gold = rare highlight (active ratio, "golden ratio" easter eggs, focus accents). Neutrals do 90% of the work. Never put more than one gold element in a viewport.

### 6.3 Typography

- **UI / display:** `Geist` (fits `.dev`); fallback `Inter`, `system-ui`.
- **Numbers / code:** `Geist Mono`; fallback `JetBrains Mono`, `ui-monospace`. Use `font-variant-numeric: tabular-nums` for all dimension/ratio output so digits don't jump.
- **Scale (rem):** 0.75 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.25 / 3. Tight line-height for display, 1.6 for body copy (the on-page SEO text).

### 6.4 Spacing, radius, elevation, motion

- **Spacing:** 4px base scale (4, 8, 12, 16, 24, 32, 48, 64).
- **Radius:** `sm 6` · `md 10` · `lg 14` · `xl 20` · `full 9999`.
- **Shadows:** subtle, layered; in dark mode prefer borders + faint glow over heavy drop shadows.
- **Motion:** 150–220ms, `ease-out`. Crop box drag feels springy; number changes cross-fade. Respect `prefers-reduced-motion`.

### 6.5 Core components

Buttons (primary/ghost/icon), Input (with inline copy), SegmentedControl (mode switch), RatioPreviewRect (animated proportion box), DropZone, CropCanvas, CompatibilityCell, ResultStat (label + mono value + copy), FAQ accordion, Breadcrumb, RelatedTools, CodeBlock (with copy), ThemeToggle.

### 6.6 Tailwind config seed

```ts
// tailwind.config.ts (excerpt)
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0E1015",
        surface: "#161A21",
        "surface-2": "#1E242D",
        border: "#2A313C",
        stone: {
          50: "#FAFAF8",
          100: "#F2F1ED",
          200: "#E5E3DC",
          300: "#D2CFC4",
          400: "#A8A496",
          500: "#807C6E",
          600: "#5E5A4F",
          700: "#44413A",
          800: "#2A2823",
          900: "#1A1916",
          950: "#0F0E0C",
        },
        teal: {
          50: "#ECFDF8",
          100: "#CFFAEE",
          200: "#9FF3DE",
          300: "#5FE6C9",
          400: "#21CFB0",
          500: "#0FB5A1",
          600: "#0A9183",
          700: "#0C7268",
          800: "#0F5B54",
          900: "#114B47",
        },
        gold: { 400: "#F8CB5C", 500: "#F4B740", 600: "#E09B1F" },
        success: "#2BBE6A",
        warning: "#F59E0B",
        danger: "#F0584B",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { sm: "6px", md: "10px", lg: "14px", xl: "20px" },
    },
  },
};
```

---

## 7. On-screen (on-page) SEO system

Every tool page follows one anatomy so SEO content is _visible on screen_, not hidden:

```
H1 (target keyword, e.g. "16:9 Aspect Ratio Calculator")
1–2 sentence intro (what it does + who it's for)
─ THE TOOL (the hydrated island) ─
"Common results" strip (internal links to related conversions/ratios)
On-page explainer: What is X · Where it's used · Examples (real, specific)
FAQ accordion (3–6 Q&As)  → FAQPage schema
Related tools grid       → internal links
"Last updated: <date>"   → trust / freshness signal
```

### 7.0 Keyword cluster map (target families, not isolated terms)

Build a head term + its long-tails together so internal links form a real topic cluster:

| Cluster      | Head term                | First long-tail pages                                                             |
| ------------ | ------------------------ | --------------------------------------------------------------------------------- |
| Aspect ratio | aspect ratio calculator  | 16:9 / 4:3 / 9:16 / 21:9 calculators, compare aspect ratios, resize keeping ratio |
| Social sizes | social media image sizes | youtube thumbnail size, instagram reel size, linkedin banner size, x header size  |
| CSS units    | px to rem                | rem to px, px to em, px to pt, px to vh                                           |
| PPI / print  | ppi calculator           | pixels to inches, cm to pixels, A4 at 300 DPI, Letter at 600 DPI                  |
| Devices      | screen resolution        | 1080p vs 1440p, iphone wallpaper size, monitor aspect ratios                      |

### 7.1 Structured data (JSON-LD per page type)

- **All tool pages:** `WebApplication` / `SoftwareApplication` (free, browser-based).
- **Tool how-to steps:** `HowTo` where natural (resize, crop).
- **FAQ blocks:** `FAQPage`.
- **Every page:** `BreadcrumbList`.
- **Devices/resolutions:** `ItemList` + `Product`-ish where it fits.

### 7.2 Meta & social

- Unique `<title>` + meta description per page (templated from collection data, but each substantively different).
- Dynamic **OG image** generation (Satori/`astro-og-canvas`) showing the ratio/dimensions visually — high CTR in shares.
- Canonical tags on every page; self-canonical for Tier 1/2, careful canonicalization for near-duplicate Tier-3 variants.

### 7.3 Indexing strategy (the anti-penalty rules, enforced in code)

- Tier 1 & 2: indexable, in sitemap.
- Tier 3 (`/convert/*`): `<meta name="robots" content="noindex,follow">` until explicitly promoted; excluded from sitemap via `@astrojs/sitemap` filter.
- A page may only be promoted to indexable when it has: unique copy, a working tool, and at least one internal reason to exist.
- Internal linking is the growth engine: every result links to adjacent ratios/conversions/platforms → crawl depth + topical authority without thin spam.

### 7.4 Technical SEO checklist

- Self-referential canonical on every primary page.
- **Sitemap index** split into separate sitemaps for tools / guides / locales (not one giant file).
- `robots.txt` that guides crawling but never tries to canonicalize or hide duplicates (that's the canonical/robots-meta job).
- Static rendering for all primary pages; compressed assets, lazy-loading, **font subsetting**, minimal third-party scripts.
- **Search Console** monitoring for Core Web Vitals and rich-result eligibility from day one.

### 7.5 Localization (expansion lever)

- Astro i18n routing under `/[locale]/…`, locale-specific sitemaps, `hreflang` tags. A tool with near-zero text-per-page localizes cheaply and opens whole new search markets (es, pt, de, fr, ja, hi…). A `language_switch` event tracks demand before you invest in more locales.

---

## 8. Performance budget (launch requirement)

| Metric              | Target                       |
| ------------------- | ---------------------------- |
| LCP                 | < 1.5s (mobile, 4G)          |
| CLS                 | < 0.05                       |
| INP                 | < 150ms                      |
| JS shipped per page | < 40KB gzipped (island only) |
| Lighthouse (mobile) | ≥ 95 across the board        |

Enforced by: static HTML, island hydration only, Partytown for ads/analytics, system+self-hosted fonts with `font-display: swap`, no layout shift from ad slots (reserve fixed slot dimensions).

---

## 9. Accessibility

- WCAG 2.2 AA. All interactive tools keyboard-operable (crop box adjustable via arrow keys).
- Contrast checked for both themes (the teal/gold pairings verified against surfaces).
- `prefers-reduced-motion` respected. Proper labels on all inputs; live regions announce computed results.

---

## 10. Monetization (AdSense is the floor, not the plan)

| Stream                 | Detail                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **AdSense**            | Below the fold only, fixed reserved slots (no CLS), loaded via Partytown. Baseline revenue.                                   |
| **Affiliate**          | The real money on "social size" intent — Canva, Adobe Express, CapCut, stock libraries. Contextual, on platform/resize pages. |
| **Pro tier** ($3–5/mo) | Batch analyzer, AI crop suggestions, no ads, saved presets/projects, export.                                                  |
| **API**                | Paid Cloudflare Worker endpoints. Recurring, uncorrelated with SEO volatility — the highest ceiling.                          |

Rule: ads never sit above or inside a tool. The product experience stays clean; that cleanliness is what earns the links and engagement that make the ads worth anything.

### 10.1 Ad placement map (when AdSense goes in)

- One in-content unit **below the fold, after the first result** (never above the preset chips/tool).
- One desktop **right-rail** unit.
- One **anchor ad** (mobile, and optionally desktop).
- Every slot has reserved fixed dimensions → zero CLS. Loaded via Partytown.

### 10.2 Revenue model (planning estimates, not guarantees)

- Aspect-ratio + print intent: model **$6–$11 page RPM** (mixed geographies; print/CSS terms carry better CPC than ruler-type pages).
- Lower-CPC utility pages: model **$4–$7**.
- Rough math: at $8 RPM you need ~125K pageviews/month for ~$1,000. Treat affiliate + Pro + API as the real upside; AdSense funds the lights.

### 10.3 Link-earning assets (white-hat only — no bought/spam links)

Google neutralizes or penalizes manipulative links, so earn them with assets people _want_ to cite:

- **Embeddable widget** (5.14) — every embed is a contextual backlink.
- **Printable resources & charts** — "common paper sizes at every DPI", ratio cheat sheets.
- **An open-source npm package** (e.g. a clean `aspect-ratio` util + CLI) — a competitor already ranks partly off an npm module; ours becomes a branded link magnet.
- **Outreach** to design blogs, web-dev communities, teacher/school resource pages, Product Hunt.

---

## 11. Analytics & measurement

- Privacy-friendly analytics (Plausible / Cloudflare Web Analytics) via Partytown.
- **Event taxonomy (fire these explicitly):** `preset_select`, `custom_ratio_input`, `dimension_input`, `visual_preview_interaction`, `copy_dimensions`, `copy_ratio`, `image_upload`, `compatibility_view`, `crop_export`, `comparison_mode_open`, `embed_copy`, `faq_expand`, `language_switch`, `next_tool_click`, `pro_cta_click`.
- These double as ranking signals: tool completion, copy actions, and dwell tell you (and Google's page-experience systems) the page actually satisfies intent. Watch `next_tool_click` to tune internal linking.

---

## 12. Project structure

```
aspectratio/
├─ src/
│  ├─ pages/                 # routes (see IA)
│  ├─ layouts/
│  ├─ components/
│  │  ├─ islands/            # Preact: Calculator, CropCanvas, ImageAnalyzer …
│  │  └─ ui/                 # Button, Input, ResultStat, FAQ, Breadcrumb …
│  ├─ lib/
│  │  ├─ ratio.ts            # pure math: gcd, simplify, nearest, resize  (unit-tested)
│  │  ├─ canvas.ts           # client-side image analysis & crop render
│  │  └─ seo.ts              # JSON-LD builders, meta helpers
│  ├─ content/
│  │  ├─ ratios/             # 16-9.md, 4-3.md … (frontmatter data)
│  │  ├─ devices/
│  │  ├─ resolutions/
│  │  └─ platforms/
│  ├─ content.config.ts      # Zod schemas
│  └─ styles/
├─ public/
├─ astro.config.mjs
├─ tailwind.config.ts
└─ tsconfig.json             # strict
```

---

## 13. Data models (Content Collections + Zod)

```ts
// content.config.ts
import { defineCollection, z } from "astro:content";

const ratios = defineCollection({
  type: "data",
  schema: z.object({
    ratio: z.string(), // "16:9"
    w: z.number(),
    h: z.number(),
    decimal: z.number(),
    name: z.string().optional(), // "Widescreen HD"
    category: z.enum(["video", "photo", "social", "print", "cinema", "screen"]),
    useCases: z.array(z.string()),
    description: z.string(),
    related: z.array(z.string()).default([]),
  }),
});

const devices = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    w: z.number(),
    h: z.number(),
    ratio: z.string(),
    ppi: z.number().optional(),
    category: z.enum(["phone", "tablet", "laptop", "monitor", "tv", "camera"]),
  }),
});

const platforms = defineCollection({
  type: "data",
  schema: z.object({
    platform: z.string(), // "instagram"
    formats: z.array(
      z.object({
        name: z.string(), // "Story"
        w: z.number(),
        h: z.number(),
        ratio: z.string(),
        notes: z.string().optional(),
      }),
    ),
  }),
});

const paperSizes = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(), // "A4"
    mm: z.tuple([z.number(), z.number()]),
    inches: z.tuple([z.number(), z.number()]),
    dpiPresets: z.array(z.number()).default([72, 150, 300, 600]),
  }),
});

export const collections = { ratios, devices, platforms, paperSizes };
```

---

## 14. Build roadmap

**Phase 0 — Foundation (week 1)**
Scaffold Astro + TS strict + Tailwind tokens + design-system primitives. `ratio.ts` with unit tests. Theme toggle, layout, SEO + schema helpers.

**Phase 1 — MVP / hero tools (weeks 2–3)**
`/` + `/calculator` (universal + nearest), `/image` (analyzer + compatibility grid), `/crop` (visualizer). Full on-page SEO anatomy. Ship and get CWV green. _This is launchable._

**Phase 2 — .dev cluster + Tier 1 (weeks 4–5)**
`/css-aspect-ratio`, `/tailwind-aspect-ratio`, `/svg-viewbox`, `/react-aspect-ratio`, the **CSS-units** converters (`px↔rem/em/pt`), and hand-built `/ratio/[ratio]` for ~6 core ratios. Ship the **embeddable widget** + open-source npm package. Start link-building (Product Hunt, dev communities, "free tool" roundups).

**Phase 3 — reference + PPI/print + Tier 2 (weeks 6–8)**
Device & resolution databases, comparison tool, the **PPI/DPI & paper-size** cluster (with the printable DPI chart as a linkable asset), and platform-size pages (each with a live sizer). Release gradually, watch traction.

**Phase 4 — monetization + Pro (week 9+)**
AdSense (Partytown, reserved slots), affiliate placements, Pro tier (batch analyzer, export).

**Phase 5 — scale + API + locales**
Promote Tier-3 conversion pages in monitored batches; ship the paid API Worker; begin **localization** (i18n routing + locale sitemaps + hreflang) into the highest-demand languages.

---

## 15. Definition of Done (quality bar per page)

- [ ] Tool works, instant, keyboard-accessible, copy buttons functional
- [ ] Unique H1, title, meta description, OG image
- [ ] Correct JSON-LD (WebApplication + FAQ + Breadcrumb as applicable)
- [ ] On-page explainer + FAQ + related-tools links present
- [ ] Lighthouse mobile ≥ 95; CLS < 0.05; no ad/layout shift
- [ ] Dark + light verified for contrast
- [ ] Indexing tier set correctly (sitemap inclusion/exclusion + robots meta)

---

_Guiding line: don't build the biggest aspect-ratio site — build the one developers and designers reach for first, then let that trust compound into rankings and revenue._
