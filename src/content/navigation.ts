/**
 * Detects SPA URL changes. The content script's isolated world can't see the
 * page's history.pushState calls, so the URL is compared whenever `check()` is
 * called (on every mutation batch) and on popstate (back/forward).
 */
export function watchUrl(onChange: (url: URL) => void, win: Window = window) {
  let last = win.location.href;

  function check(): void {
    const current = win.location.href;
    if (current === last) return;
    last = current;
    onChange(new URL(current));
  }

  win.addEventListener('popstate', check);
  return { check, stop: () => win.removeEventListener('popstate', check) };
}

export function isJobsPage(url: { pathname: string }): boolean {
  return url.pathname === '/jobs' || url.pathname.startsWith('/jobs/');
}
