/**
 * Canonical public site origin for absolute URLs in sitemap.xml and robots.txt.
 */
export function getSiteBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://greatermidland.org";
}

export function toAbsoluteUrl(path: string): string {
  const base = getSiteBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized === "/" ? "" : normalized}`;
}
