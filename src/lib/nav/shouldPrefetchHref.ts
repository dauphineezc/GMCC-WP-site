/** Prefer disabling Next.js Link prefetch for GraphQL-heavy filtered routes. */
export function shouldPrefetchHref(href: string): boolean {
  // Each unique /programs?... URL can trigger a full RSC + many WPGraphQL POSTs.
  if (href.startsWith("/programs?")) return false;
  return true;
}
