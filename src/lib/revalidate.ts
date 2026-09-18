/**
 * Page-level ISR windows and GraphQL Data Cache tags.
 * On-demand purge: `/api/revalidate?secret=…&tag=programs` (etc.).
 *
 * Note: `export const revalidate` in page/route segments must be a numeric
 * literal (e.g. `900`). Next.js cannot statically analyze imported constants.
 * Use these constants for `fetch` / `wpFetch` options only.
 */

export const REVALIDATE_DEFAULT_SECONDS = 900; // 15m — interim until Atlas App Router on-demand ISR
export const REVALIDATE_EVENTS_SECONDS = 900; // 15m — same window for event-facing content

/** Always attached to every `wpFetch` so a single webhook can bust all GraphQL data. */
export const WP_CACHE_TAG_ALL = "wp";

export const WP_CACHE_TAGS = {
  all: WP_CACHE_TAG_ALL,
  announcements: "announcements",
  nav: "nav",
  pages: "pages",
  programs: "programs",
  centers: "centers",
  amenities: "amenities",
  events: "events",
  news: "news",
  membership: "membership",
  seo: "seo",
} as const;

export type WpCacheTag = (typeof WP_CACHE_TAGS)[keyof typeof WP_CACHE_TAGS];

/** Merge caller tags with the global GraphQL tag (deduped). */
export function withWpCacheTags(...tags: Array<string | null | undefined>): string[] {
  return [...new Set([WP_CACHE_TAGS.all, ...tags.filter((t): t is string => Boolean(t))])];
}

/** Paths to also refresh when a given tag is purged (page ISR HTML). */
export const WP_CACHE_TAG_PATHS: Partial<Record<string, string[]>> = {
  [WP_CACHE_TAGS.announcements]: [], // layout handled separately
  [WP_CACHE_TAGS.nav]: [], // layout handled separately
  [WP_CACHE_TAGS.pages]: ["/"],
  [WP_CACHE_TAGS.programs]: ["/programs", "/camps", "/personal-training", "/private-lessons"],
  [WP_CACHE_TAGS.centers]: ["/centers"],
  [WP_CACHE_TAGS.amenities]: ["/centers", "/membership", "/accessibility"],
  [WP_CACHE_TAGS.events]: ["/events", "/visit", "/centers", "/"],
  [WP_CACHE_TAGS.news]: ["/news", "/"],
  [WP_CACHE_TAGS.membership]: ["/membership"],
  [WP_CACHE_TAGS.seo]: [],
  [WP_CACHE_TAGS.all]: [],
};

/**
 * Section roots purged as layouts so nested detail pages
 * (e.g. `/centers/[slug]`, `/programs/[slug]`) also regenerate.
 */
export const WP_CACHE_TAG_LAYOUT_PATHS = new Set<string>([
  "/programs",
  "/centers",
  "/events",
  "/news",
  "/visit",
  "/membership",
  "/camps",
]);

export const WP_CACHE_TAGS_THAT_REFRESH_LAYOUT = new Set<string>([
  WP_CACHE_TAGS.announcements,
  WP_CACHE_TAGS.nav,
  WP_CACHE_TAGS.all,
]);
