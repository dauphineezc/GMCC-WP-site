const LOCAL_HOST_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

function forceHttps(origin: string): string {
  if (LOCAL_HOST_PATTERN.test(origin)) return origin;
  return origin.replace(/^http:\/\//i, "https://");
}

/**
 * Canonical public site origin for absolute URLs in sitemap.xml and robots.txt.
 */
export function getSiteBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return forceHttps(configured);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "https://greatermidland.org";
}

export function toAbsoluteUrl(path: string): string {
  const base = getSiteBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized === "/" ? "" : normalized}`;
}
