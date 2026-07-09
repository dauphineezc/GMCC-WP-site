/**
 * Site-wide constants.
 *
 * Centralizes values that were previously duplicated across many files
 * (registration URL, contact email, schedule embed hosts, center ordering)
 * so they can't drift apart.
 */

/** WebTrac online registration / "join now" entry point. */
export const WEBTRAC_REGISTRATION_URL =
  "https://register.greatermidland.org/webtrac/web/search.html?Action=Start";

/** Primary public contact email. */
export const CONTACT_EMAIL = "info@greatermidland.org";

/** Convenience `mailto:` href for {@link CONTACT_EMAIL}. */
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;

/** Base URL of the drop-in / fitness schedule embed app. */
export const SCHEDULE_EMBED_BASE_URL = "https://gmcc-drop-in-schedule.vercel.app";

/** Standalone league-management schedule embed app. */
export const LEAGUE_SCHEDULE_EMBED_URL =
  "https://gmcc-league-management-system.vercel.app";

/**
 * Build a drop-in / fitness schedule embed URL.
 *
 * @example scheduleEmbedUrl({ type: "dropin", sub: "aquatics" })
 */
export function scheduleEmbedUrl(params: {
  type: "dropin" | "fitness";
  sub: "aquatics" | "courtSports" | "community";
}): string {
  const url = new URL(SCHEDULE_EMBED_BASE_URL);
  url.searchParams.set("type", params.type);
  url.searchParams.set("sub", params.sub);
  return url.toString();
}

/** Maps center CPT slugs to the `center` query param used by today-center.html. */
const CENTER_TODAY_SCHEDULE_EMBED_KEY: Record<string, string> = {
  "community-center": "community",
  "tennis-center": "tennis",
  "coleman-family-center": "coleman",
  "north-family-center": "north",
};

/** Today's schedule embed for a single center (used on center detail pages). */
export function todayCenterScheduleEmbedUrl(centerSlug: string): string {
  const centerKey = CENTER_TODAY_SCHEDULE_EMBED_KEY[centerSlug] ?? "community";
  const url = new URL(`${SCHEDULE_EMBED_BASE_URL}/today-center.html`);
  url.searchParams.set("center", centerKey);
  return url.toString();
}

/** All-centers today's schedule embed (used on Plan Your Visit). */
export const TODAY_ALL_CENTERS_SCHEDULE_EMBED_URL = `${SCHEDULE_EMBED_BASE_URL}/today.html`;

/**
 * Canonical center display order, keyed by center CPT slug.
 * Centers not listed sort to the end.
 */
export const CENTER_SLUG_ORDER: readonly string[] = [
  "community-center",
  "tennis-center",
  "curling-center",
  "coleman-family-center",
  "north-family-center",
  "corporate-wellness-center",
];

/**
 * Canonical center display order, keyed by lowercased center title.
 * Used where centers are sorted by title rather than slug.
 */
export const CENTER_TITLE_ORDER: readonly string[] = [
  "community center",
  "tennis center",
  "coleman family center",
  "north family center",
  "curling center",
];
