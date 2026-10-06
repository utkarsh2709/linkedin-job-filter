# Architecture — LinkedIn Company Filter

## Principle

```
LinkedIn DOM ──▶ LinkedIn adapter ──▶ generic Job ──▶ filter engine ──▶ DOM effect (hide/show)
                 (only place that                      (pure, no DOM,
                  knows LinkedIn)                       no chrome APIs)
```

When LinkedIn changes its HTML, only `src/content/linkedin/` should need edits.
Everything else is testable without a browser and without LinkedIn.

## Layout

```
src/
  shared/
    types.ts              Job, BlockRule, Settings types
    constants.ts          storage keys, attribute names, limits
    normalize.ts          normalizeCompanyName()            (pure)
    matcher.ts            createMatcher(blocklist) -> (job) => boolean (pure)

  storage/
    company-storage.ts    CompanyStorage interface + chrome.storage.sync impl
    storage-area.ts       thin wrapper over chrome.storage (mockable)

  content/
    index.ts              entry: wires storage, observer, filter, navigation
    linkedin/             ── LinkedIn adapter (the only LinkedIn-aware code) ──
      selectors.ts        all selectors, ordered fallback lists
      find-job-cards.ts   findJobCards(root): HTMLElement[]
      extract-job.ts      extractJob(card): Job | null
    observer.ts           MutationObserver → batched set of candidate roots
    navigation.ts         SPA URL-change detection → onNavigate callback
    filter.ts             applyFilter(cards, matcher) — sets/clears hide attribute
    hide-style.ts         injects one <style> rule for [data-lcf-hidden]

  popup/
    index.html
    main.tsx
    App.tsx
    components/AddCompany.tsx
    components/CompanyList.tsx
    components/CompanyItem.tsx
    hooks/useBlocklist.ts subscribes to CompanyStorage

public/manifest.json, public/icons/
tests/
  unit/                   normalize, matcher, storage (fake chrome.storage)
  dom/                    adapter + filter + observer under jsdom, using fixtures
  fixtures/               sanitized LinkedIn HTML snapshots per layout
  e2e/                    Playwright: built extension + local mock pages
```

Differences from the originally proposed layout, and why:
- `company-extractor.ts` / `job-card.ts` are folded into `linkedin/extract-job.ts`
  and `linkedin/find-job-cards.ts` so the adapter boundary is a folder.
- Matching lives in `shared/` (not `content/`) because the popup will reuse
  `normalizeCompanyName` for duplicate detection and display.
- `navigation.ts` is separate because SPA handling is its own concern.
- No `background/` in MVP (see PROJECT_PLAN decision 5).

## Core types

```ts
// shared/types.ts
export interface Job {
  id?: string;            // LinkedIn job id, if found
  title?: string;
  company: string;        // raw display text; required for a Job to exist
  companySlug?: string;   // from /company/<slug>/ link, if present
  url?: string;
  isPromoted?: boolean;
}

export interface BlockedCompany {
  name: string;           // as the user typed it, for display
  key: string;            // normalizeCompanyName(name), for matching/dedup
  addedAt: number;
}
```

`Job` is deliberately generic so post-MVP title/location rules plug into the
matcher without touching the adapter's consumers.

## Matching

```ts
normalizeCompanyName(s):
  NFKC → lowercase → strip diacritics → replace & with "and"
  → drop punctuation (.,'’"()) → collapse whitespace → trim
  → strip ONE trailing legal suffix from a fixed list:
      inc, llc, ltd, limited, corp, corporation, co, plc, gmbh, ag, sa,
      pvt ltd, private limited, llp, bv, nv, pty ltd
```

`createMatcher(blocked)` builds a `Set<string>` of keys once; each job check is
O(1). Rebuilt only when the blocklist changes.

Exact-match rationale: "Apple" must not hide "Apple Hospitality REIT".

## Storage

```ts
interface CompanyStorage {
  getCompanies(): Promise<BlockedCompany[]>;
  addCompany(name: string): Promise<BlockedCompany[]>;   // no-op on duplicate key
  removeCompany(key: string): Promise<BlockedCompany[]>;
  hasCompany(name: string): Promise<boolean>;
  subscribe(cb: (companies: BlockedCompany[]) => void): () => void; // storage.onChanged
}
```

- Single key: `lcf.blocklist.v1` → `BlockedCompany[]`. Versioned key allows migration.
- Read-modify-write races (two popups) are acceptable for MVP; last write wins.
- Errors (`chrome.runtime.lastError`, quota) surface as rejected promises; the
  popup shows them, the content script logs and keeps the last good list.

## Content-script runtime flow

```
document_idle
  │
  ├─ inject hide style
  ├─ load blocklist → matcher
  ├─ full scan: findJobCards(document) → process each
  ├─ start MutationObserver(document.body, {childList, subtree, characterData})
  ├─ start navigation watcher
  └─ storage.subscribe(list → rebuild matcher → re-evaluate all known cards)

process(card):
  job = extractJob(card)
  if !job          → leave visible, leave unprocessed (may populate later)
  key = card's job-id or company text
  if lastKey(card) == key → skip            (WeakMap<Element, string>)
  set lastKey; matcher(job) ? hide(card) : show(card)

mutation batch (coalesced to one requestAnimationFrame):
  for each added node / mutated target:
    card = closest job-card ancestor, or job cards inside the node
  process(unique cards)
```

Why `WeakMap<Element, key>` instead of `WeakSet`: LinkedIn reuses/fills the
same `<li>` element (occlusion) and may swap its content, so "already
processed" must mean "processed *with this content*". Cards are held weakly so
removed DOM is garbage-collected.

Performance rules:
- Never scan the whole document on a timer. Full scans only at init, on
  navigation, and on blocklist change.
- Mutation handling is batched per animation frame and scoped to the mutated
  subtrees.
- Hide/show is a single attribute write; the CSS rule does the rest
  (`[data-lcf-hidden] { display: none !important; }`).
- The observer ignores mutations caused by our own attribute writes (we only
  observe `childList` + `characterData`, not attributes).

## SPA navigation

LinkedIn routes client-side. Content scripts run in an isolated world, so
monkey-patching `history.pushState` there does not see the page's calls. Plan:

1. Primary: the MutationObserver already catches newly rendered cards
   regardless of URL, so most navigation "just works".
2. Secondary: detect URL changes (compare `location.href` inside the mutation
   batch handler + `popstate`), and on change do one full re-scan.
3. Manifest matches `https://www.linkedin.com/*` (not just `/jobs/*`), because
   a user who lands on the feed and clicks "Jobs" never triggers a fresh
   content-script injection. The script is idle (observer only, cheap no-op
   scans) when the URL is not under `/jobs`.
   - Alternative to evaluate in milestone 7: Navigation API (`navigation.addEventListener('navigate')`)
     is available to content scripts in Chrome 102+ but may not fire for
     isolated-world listeners on page-initiated navigations — verify before relying on it.

## Build

- Vite multi-entry:
  - popup: normal Vite HTML entry with React.
  - content script: built as a single **IIFE** file (content scripts can't be
    ES modules without a loader), no React, no shared chunks.
- `public/manifest.json` and icons are copied to `dist/` by Vite. Considered `@crxjs/vite-plugin`
  for HMR; prefer plain Vite for fewer moving parts — revisit if dev loop is painful.
- `npm run dev` = `vite build --watch` (reload the extension manually).

## Manifest (MVP)

```json
{
  "manifest_version": 3,
  "name": "LinkedIn Company Filter",
  "version": "0.1.0",
  "permissions": ["storage"],
  "content_scripts": [{
    "matches": ["https://www.linkedin.com/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "action": { "default_popup": "popup/index.html" },
  "icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
}
```

No `host_permissions` beyond the content-script match, no `tabs`, no
`scripting`, no background. Minimal permissions also simplify store review.

## Testing

| Layer | Tool | What |
|-------|------|------|
| Unit | Vitest | normalize, matcher, storage (fake `chrome.storage` with `onChanged`) |
| DOM | Vitest + jsdom | adapter against real-shaped fixtures; filter/observer with simulated append, lazy fill, removal |
| Popup | Vitest + Testing Library | add/remove/validation/empty state |
| E2E | Playwright (Chromium, `--load-extension`) | local mock pages that mimic LinkedIn's structure: initial list, infinite append, lazy fill, `pushState` navigation |

Live LinkedIn is checked manually against the checklist in `PROJECT_PLAN.md`,
never in CI.
