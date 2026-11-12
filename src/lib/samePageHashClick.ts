import type { MouseEvent } from "react";

/**
 * Same-page `#section` links stop working after the first click because the
 * hash is already in the URL and the browser skips navigation. Call this from
 * an anchor `onClick` (after any custom handler) to force a smooth re-scroll.
 *
 * Leaves modified-clicks (new tab, etc.) and cross-page links alone.
 */
export function handleSamePageHashClick(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented) return;
  if (e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const hrefAttr = e.currentTarget.getAttribute("href");
  if (!hrefAttr) return;

  let url: URL;
  try {
    url = new URL(hrefAttr, window.location.href);
  } catch {
    return;
  }

  if (url.origin !== window.location.origin) return;
  if (!url.hash || url.hash === "#") return;
  if (url.pathname !== window.location.pathname) return;
  if (url.search !== window.location.search) return;

  const id = decodeURIComponent(url.hash.slice(1));
  if (!id) return;

  const el = document.getElementById(id);
  if (!el) return;

  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });

  if (window.location.hash !== url.hash) {
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
}
