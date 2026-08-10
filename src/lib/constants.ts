/**
 * Site-wide constants.
 *
 * Centralizes values that were previously duplicated across many files
 * (registration URL, contact email, schedule embed hosts, center ordering)
 * so they can't drift apart.
 */

/** Vimeo embed for the homepage hero background video. */
export const HERO_VIDEO_VIMEO_EMBED_URL =
  "https://player.vimeo.com/video/1213380941?badge=0&autopause=0&autoplay=1&muted=1&loop=1";

/** Static poster frame for the hero video (reduced motion + paused state). */
export const HERO_VIDEO_VIMEO_THUMBNAIL_URL =
  "https://i.vimeocdn.com/video/2184033906-2ef5f76ed298e195f1f61fc55065fe04e7c74e28f7a2dbd52b51a3f7a4e50ae8-d_1280?region=us";

/** WebTrac online registration / "join now" entry point. */
export const WEBTRAC_REGISTRATION_URL =
  "https://register.greatermidland.org/webtrac/web/search.html?Action=Start";

/** Link to general contact form. */
export const GENERAL_CONTACT_FORM_URL = "https://www.jotform.com/";

/** Primary public contact email. */
export const CONTACT_EMAIL = "info@greatermidland.org";

/** Convenience `mailto:` href for {@link CONTACT_EMAIL}. */
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;

/** Base URL of the drop-in / fitness schedule embed app. */
export const SCHEDULE_EMBED_BASE_URL = "https://gmcc-drop-in-schedule.vercel.app";

export const CURLING_WEEKLY_SCHEDULE_EMBED_URL = `${SCHEDULE_EMBED_BASE_URL}/week-curling.html`;

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
export const CENTER_TODAY_SCHEDULE_EMBED_KEY: Record<string, string> = {
  "community-center": "community",
  "tennis-center": "tennis",
  "coleman-family-center": "coleman",
  "north-family-center": "north",
};

export function hasTodayCenterScheduleEmbed(centerSlug: string): boolean {
  return centerSlug in CENTER_TODAY_SCHEDULE_EMBED_KEY;
}

/** Display label for centers that have a today-center schedule embed. */
export const CENTER_SCHEDULE_LABEL_BY_SLUG: Record<string, string> = {
  "community-center": "Community Center",
  "tennis-center": "Tennis Center",
  "coleman-family-center": "Coleman Family Center",
  "north-family-center": "North Family Center",
};

export function resolveCenterScheduleLabel(slug: string, title: string): string | null {
  const fromSlug = CENTER_SCHEDULE_LABEL_BY_SLUG[slug];
  if (fromSlug) return fromSlug;

  const match = Object.values(CENTER_SCHEDULE_LABEL_BY_SLUG).find(
    (label) => label.toLowerCase() === title.trim().toLowerCase(),
  );
  return match ?? null;
}

/** Today's schedule embed for a single center (used on center detail pages). */
export function todayCenterScheduleEmbedUrl(centerSlug: string): string {
  const centerKey = CENTER_TODAY_SCHEDULE_EMBED_KEY[centerSlug] ?? "community";
  const params = new URLSearchParams({ center: centerKey });
  return `${SCHEDULE_EMBED_BASE_URL}/today-center.html?${params.toString()}`;
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
