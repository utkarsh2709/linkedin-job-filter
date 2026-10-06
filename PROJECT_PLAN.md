# Project Plan — LinkedIn Company Filter

## Goal

A Chrome (Manifest V3) extension that lets a user keep a blocklist of companies
and automatically hides job cards from those companies on LinkedIn Jobs —
including cards rendered later by infinite scroll, pagination, lazy rendering
("occlusion"), and SPA navigation.

## Non-goals (MVP)

- No backend, accounts, payments, analytics, or telemetry.
- No network requests from the extension at all.
- No fuzzy / substring matching (exact normalized match only).
- No filtering by title, keyword, or location (architecture allows it later).
- No Firefox/Safari support (MV3 Chrome only; keep code portable).

## Milestones

Each milestone ends with: `npm run lint && npm test && npm run build` green,
and a manual load-unpacked smoke check where relevant. No milestone modifies
unrelated functionality.

| # | Milestone | Deliverables | Done when |
|---|-----------|--------------|-----------|
| 0 | Planning & research | `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `DOM_RESEARCH.md` | Reviewed and approved by user |
| 1 | DOM verification | User (or Claude via a browser tool) confirms/corrects selectors in `DOM_RESEARCH.md`; saves sanitized HTML fixtures to `tests/fixtures/` | Fixtures exist for each layout we support |
| 2 | Scaffold | Vite + TS + React popup, content-script IIFE build, `manifest.json`, ESLint, Vitest, npm scripts `dev/build/test/lint` | Extension loads in Chrome with no errors; empty popup renders |
| 3 | Matching engine | `normalizeCompanyName`, `isBlockedCompany`, `createMatcher` (pure, no DOM, no chrome APIs) | Unit tests cover normalization edge cases |
| 4 | Storage | `CompanyStorage` over `chrome.storage.sync` with change subscription | Unit tests with a fake `chrome.storage` |
| 5 | LinkedIn adapter | `selectors.ts`, `findJobCards`, `extractJob` → generic `Job` | DOM tests pass against fixtures from milestone 1 |
| 6 | Filter + observer | `MutationObserver` pipeline, processed-card tracking, hide/unhide, live reaction to blocklist changes | DOM tests: initial scan, appended cards, lazily-populated cards, unblock restores |
| 7 | SPA navigation | URL-change detection, re-scan on route change | Manual test checklist (below) passes |
| 8 | Popup UI | Add / remove / list companies, validation, empty state, count | Component tests + manual check |
| 9 | Browser tests | Playwright loads built extension against a local mock LinkedIn page | Infinite-scroll + SPA nav scenarios pass headed/headless |
| 10 | Polish & store prep | Icons, README, privacy statement, store listing draft | Zip passes Chrome Web Store upload validation |

Post-MVP backlog (in rough priority order):
1. "Hide this company" button injected on each job card (+ Undo toast).
2. Hidden-jobs counter in popup / badge.
3. Import / export blocklist (JSON).
4. Optional "contains" matching per entry.
5. Title / keyword / location rules (rename product to "LinkedIn Job Filter").

## Manual test checklist (milestones 6–9)

- [ ] Fresh load of `/jobs/search/?keywords=…` hides blocked companies.
- [ ] Scrolling the results list hides newly rendered cards.
- [ ] Clicking to page 2/3 of results hides blocked cards there.
- [ ] `/jobs/collections/recommended/` and other collections work.
- [ ] `/jobs/` home recommendations (if supported — see DOM_RESEARCH).
- [ ] Navigating from feed → Jobs via the top nav (no reload) works.
- [ ] Browser back/forward between searches works.
- [ ] Adding a company in the popup hides matching cards immediately, no reload.
- [ ] Removing a company restores its cards immediately.
- [ ] Blocklist syncs to a second Chrome profile signed into the same account.
- [ ] No noticeable scroll jank; no console errors from the extension.

## Key decisions (proposed — please confirm)

1. **Exact normalized matching** for MVP. "Google LLC" → "google" via suffix
   stripping; "Apple Music" does *not* match "Apple".
2. **Hide, don't remove** — `data-lcf-hidden` attribute + one injected CSS rule.
   A dev-only debug mode shows a collapsed placeholder instead.
3. **React only in the popup.** The content script is plain TypeScript with no
   framework, to keep it small and fast on LinkedIn pages.
4. **`chrome.storage.sync`** for the blocklist (limit ~100 KB total, 8 KB per
   item). Store as one array under one key; at ~30 bytes/company that is a few
   hundred companies per 8 KB item — fine for MVP. If we outgrow it, shard or
   fall back to `local`.
5. **No background service worker logic in MVP.** The content script listens to
   `chrome.storage.onChanged` directly, so no messaging layer is needed. (A
   stub worker is only added if a later feature needs it.)
6. **Name.** Chrome Web Store policy discourages using a third-party trademark as
   the leading part of a name. Consider "Company Filter for LinkedIn Jobs" for
   the store listing. Not blocking for development.

## Risks

| Risk | Mitigation |
|------|------------|
| LinkedIn changes DOM / obfuscates class names | All selectors in one adapter file; multiple fallback strategies per field; prefer `data-*`, ARIA, and URL patterns over class names; fixture-based tests make breakage obvious |
| Cards rendered as empty placeholders, filled in later (occlusion) | Observer watches subtree changes inside known cards, not just new `li`s (see DOM_RESEARCH §5) |
| Results list scrolls in an inner container, not `window` | Rely on DOM mutations, never on scroll events |
| Hiding the currently selected job leaves its details pane open | Acceptable for MVP; document it. Post-MVP: optionally hide the detail pane too |
| Whole page of results is blocked → looks empty | Post-MVP: small "N jobs hidden" notice in the list |
| ToS concerns | Extension only hides elements locally; no scraping, no automation, no requests |
