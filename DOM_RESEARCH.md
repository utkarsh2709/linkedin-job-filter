# LinkedIn Jobs DOM Research

> **Status: UNVERIFIED.** LinkedIn Jobs needs a login, and no browser was
> available while this was written. Everything below comes from prior
> knowledge of LinkedIn's markup, which changes often. LinkedIn has also been
> rolling out obfuscated/hashed class names in parts of the site. Treat every
> selector as a hypothesis until milestone 1 confirms it in DevTools.
>
> Confidence: **[H]** high: long-standing and widely relied on.
> **[M]** medium: seen before but may have changed.
> **[L]** low: plausible, unconfirmed.

## 1. Pages in scope

| URL pattern | Layout | MVP? |
|-------------|--------|------|
| `/jobs/search/?keywords=…` | Two-pane: results list (left) + job detail (right) | Yes |
| `/jobs/collections/<name>/?currentJobId=…` (recommended, remote, easy-apply, etc.) | Same two-pane layout as search **[M]** | Yes |
| `/jobs/` (Jobs home) | Feed-like modules ("Top job picks for you", etc.) with a few cards each | Stretch: same card component? **[L]** |
| `/jobs/view/<id>/` | Single job page + "similar jobs" side lists | No (only side lists would be filterable) |
| Logged-out guest pages `/jobs/search` (public) | Different markup (`base-search-card`) | No for MVP; noted for completeness |

## 2. Job card containers

Two-pane search/collections list:

| Candidate selector | Notes | Conf. |
|--------------------|-------|-------|
| `li[data-occludable-job-id]` | One `<li>` per result. The attribute carries the job id **and is present even before the card's content renders** (see §5). Best anchor. | **[M-H]** |
| `[data-job-id]` (usually `div.job-card-container`) | Inner card element; also carries the job id. | **[M]** |
| `.job-card-container` | Class-based fallback. | **[M]** |
| `.jobs-search-results__list-item`, `.scaffold-layout__list-item` | Older/alternate `<li>` classes. | **[L-M]** |

Recommended strategy: treat the **`<li>` carrying `data-occludable-job-id`**
as the card to hide (hiding the inner div leaves an empty gap). Fallback:
`closest('li')` of any `[data-job-id]`.

Guest pages (not MVP): `ul.jobs-search__results-list > li`, card `div.base-search-card` **[M]**.

## 3. Field extraction

### Company name

| Candidate | Notes | Conf. |
|-----------|-------|-------|
| `.artdeco-entity-lockup__subtitle` | Generic LinkedIn "lockup" subtitle; on job cards this is the company. Text may include a nested `<span>`. | **[M]** |
| `.job-card-container__primary-description` | Older company element. | **[M]** |
| `.job-card-container__company-name` | Older still. | **[L-M]** |
| `a[href*="/company/"]` inside the card | If present, gives a **stable slug** (`/company/google/`). Often *not* present on logged-in list cards (only in the detail pane). | **[L]** |
| Logo `img[alt]` | Alt text is often the company name (sometimes "Company logo for X"). Last-resort fallback only. | **[L]** |
| Guest: `.base-search-card__subtitle` (often wraps `a.hidden-nested-link`) | Guest pages only. | **[M]** |

Extraction rules:
- Use `textContent`, collapse whitespace, trim. Visible text may repeat inside
  `<span aria-hidden="true">` + visually-hidden `<span>`; dedupe if the string
  is doubled ("GoogleGoogle"), or read only the `aria-hidden` child.
- If the subtitle also contains location (" · Bengaluru"), split on `·`.
  **[L]**: verify whether company and location share an element.

### Job title

| Candidate | Notes | Conf. |
|-----------|-------|-------|
| `a.job-card-list__title`, `a.job-card-list__title--link` | Title link; `aria-label` often holds the clean title. | **[M]** |
| `.artdeco-entity-lockup__title` | Lockup title. | **[M]** |
| `strong` inside the title link | Text node holder. | **[L]** |

Title isn't needed for MVP matching. Extract it for debugging and future rules.

### Job URL / id

| Candidate | Notes | Conf. |
|-----------|-------|-------|
| `data-occludable-job-id` / `data-job-id` | Numeric id → `https://www.linkedin.com/jobs/view/<id>/` | **[M-H]** |
| `a[href*="/jobs/view/"]` | Href includes tracking query params; strip them. | **[M-H]** |

### Promoted flag (optional)

A footer item containing the text "Promoted" **[M]**. There is no reliable class
for it; match on text and expect it to be localized.

## 4. Detail pane (right side)

Not filtered in MVP, but relevant for UX:
- Company: `.job-details-jobs-unified-top-card__company-name` (contains
  `a[href*="/company/"]`) **[M]**.
- Container: `.jobs-search__job-details`, `.scaffold-layout__detail` **[M]**.

If the user had a blocked job selected, hiding its list card leaves the detail
pane showing. Accept this for MVP.

## 5. Dynamically loaded cards (important)

Expected behavior, all of which needs verifying:

1. **Occlusion / virtualization [M]:** the results `<ul>` holds about 25 `<li>`s
   with `data-occludable-job-id`. Only `<li>`s near the viewport get their
   inner content. The rest are empty shells until scrolled into view, and
   content may be removed again when scrolled far away.
   → A card can exist with **no company text yet**. `extractJob` returns
   `null` and the card is retried when its subtree mutates. The observer has
   to watch `childList` mutations *inside* existing `<li>`s, not only new
   `<li>`s.
2. **Inner scroll container [M]:** the list scrolls inside its own element
   (e.g. `.jobs-search-results-list` / `.scaffold-layout__list`), not `window`.
   → Never depend on window scroll events.
3. **Pagination [M]:** search uses numbered pages (`&start=25`, …). Changing
   pages replaces the list contents and updates the URL with `pushState`.
4. **Infinite append [L]:** some collections and the Jobs home may append
   more cards as you scroll. The observer handles it like any other insertion.
5. **Re-render of the same element [L]:** React-style reconciliation can put
   a *different* job's content into the same `<li>`. Re-process when the
   extracted job id/company changes. ARCHITECTURE.md handles this with a
   `WeakMap` content key.

## 6. SPA navigation

- LinkedIn is a client-side app. Feed → Jobs, search → search, page changes,
  and back/forward all happen without a page reload **[H]**.
- Content scripts declared only for `/jobs/*` would **not** inject when the
  user enters Jobs from another LinkedIn page through the SPA. So match
  `https://www.linkedin.com/*` and stay idle outside `/jobs` **[H]**.
- The isolated world can't see the page's `history.pushState` calls. Detect
  URL changes by comparing `location.href` on mutation batches and on
  `popstate` **[H]**.

## 7. Selector stability ranking (most → least stable)

1. `data-*` attributes with job ids (`data-occludable-job-id`, `data-job-id`).
2. URL patterns in `href` (`/jobs/view/`, `/company/`).
3. ARIA attributes and roles (`aria-label` on title links).
4. Semantic BEM-ish classes (`job-card-container__…`, `artdeco-entity-lockup__…`).
5. Structural position (nth-child, "second line of the card"). Avoid.
6. Hashed/obfuscated classes. Never use.

Each field in `selectors.ts` is an **ordered list** of strategies. The first
one that returns non-empty text wins. Log in dev builds when only a low-rank
fallback matched, as an early warning that LinkedIn changed something.

## 8. Failure modes when LinkedIn changes

| Change | Symptom | Detection / mitigation |
|--------|---------|------------------------|
| Card container attribute renamed | Nothing gets filtered | Dev log: "0 job cards found on /jobs/search". Fallback container selectors. |
| Company element class renamed | Cards found, but `extractJob` → null | Dev counter of null extractions. Fallback chain (lockup subtitle → links → logo alt). |
| Company and location merged into one element | Company key includes location, so it never matches | `·` split, plus a fixture test for that layout |
| Full class obfuscation | Classes useless | Fall back to `data-*`, `/company/` links, and ARIA. Structural heuristics as a last resort. |
| A/B layouts for different users | Works for some users only | Collect fixtures from several accounts and locales |
| Localization ("Promoted" etc.) | Promoted flag wrong | Not used for matching in MVP |
| Company shown under a different display name ("Meta" vs "Facebook") | Not hidden | Out of scope; the user blocks both names |

## 9. Verification checklist (milestone 1)

Do this in DevTools on a logged-in session. For each item, record the actual
selector/structure here and save a **sanitized** `outerHTML` fixture to
`tests/fixtures/` with personal data and tracking params removed.

- [ ] `/jobs/search/?keywords=software%20engineer`: copy `outerHTML` of
      one fully rendered `<li>` and one empty (not-yet-rendered) `<li>`.
- [ ] Confirm which element holds the company name, and whether location is in the same element.
- [ ] Confirm whether list cards contain an `a[href*="/company/"]`.
- [ ] Scroll the list. In the Elements panel, watch whether `<li>`s are added,
      or whether existing ones get filled and later emptied.
- [ ] Go to page 2. Does the `<ul>` get replaced, or only its children?
- [ ] `/jobs/collections/recommended/`: is the card markup the same as search?
- [ ] `/jobs/` home: card markup for the recommendation modules.
- [ ] Note any hashed class names seen on the card.
- [ ] Repeat one search in a non-English LinkedIn UI, if available.

Faster option: if you enable a browser tool for Claude (e.g. Claude in Chrome)
with your logged-in session, Claude can run this checklist and write the
fixtures itself.
