/**
 * Map WordPress webhook payloads (post_type + slug) to Next.js cache tags/paths.
 */

import { WP_CACHE_TAGS } from "@/lib/revalidate";

export type WpRevalidateWebhookBody = {
  secret?: string;
  /** WP post type slug (e.g. program, center, page). */
  post_type?: string;
  postType?: string;
  /** Post name / slug. */
  slug?: string;
  post_name?: string;
  /** Optional ISO / Ymd date for event detail paths. */
  event_start?: string;
  eventStart?: string;
  /** nav_menu | term | option, etc. */
  object_type?: string;
  objectType?: string;
  /** Taxonomy name when object is a term. */
  taxonomy?: string;
  action?: string;
  /** Pass-through overrides (same as manual revalidate API). */
  tag?: string;
  tags?: string[];
  path?: string;
  paths?: string[];
  layout?: boolean;
};

export type MappedRevalidate = {
  tags: string[];
  paths: string[];
  layout: boolean;
};

const PAGE_SLUG_MAP: Record<string, { tags: string[]; paths: string[]; layout?: boolean }> = {
  programs: { tags: [WP_CACHE_TAGS.programs, WP_CACHE_TAGS.pages], paths: ["/programs"] },
  centers: { tags: [WP_CACHE_TAGS.centers, WP_CACHE_TAGS.pages], paths: ["/centers"] },
  membership: {
    tags: [WP_CACHE_TAGS.membership, WP_CACHE_TAGS.pages],
    paths: ["/membership"],
  },
  visit: { tags: [WP_CACHE_TAGS.pages, WP_CACHE_TAGS.events], paths: ["/visit"] },
  events: { tags: [WP_CACHE_TAGS.events, WP_CACHE_TAGS.pages], paths: ["/events"] },
  news: { tags: [WP_CACHE_TAGS.news, WP_CACHE_TAGS.pages], paths: ["/news"] },
  "center-detail": {
    tags: [WP_CACHE_TAGS.centers, WP_CACHE_TAGS.pages],
    paths: ["/centers"],
  },
  camps: { tags: [WP_CACHE_TAGS.programs, WP_CACHE_TAGS.pages], paths: ["/camps"] },
  "personal-training": {
    tags: [WP_CACHE_TAGS.programs, WP_CACHE_TAGS.pages],
    paths: ["/personal-training"],
  },
  "private-lessons": {
    tags: [WP_CACHE_TAGS.programs, WP_CACHE_TAGS.pages],
    paths: ["/private-lessons"],
  },
  accessibility: {
    tags: [WP_CACHE_TAGS.amenities, WP_CACHE_TAGS.pages],
    paths: ["/accessibility"],
  },
  amenities: { tags: [WP_CACHE_TAGS.amenities, WP_CACHE_TAGS.pages], paths: ["/centers"] },
};

/** Normalize CPT / GraphQL names WordPress may send. */
function normalizePostType(raw: string): string {
  return raw.trim().toLowerCase().replace(/_/g, "-");
}

function buildEventPath(slug: string, eventStart?: string): string {
  if (!slug) return "/events";
  if (!eventStart) return `/events`; // layout purge covers nested detail URLs
  const ymd = eventStart.replaceAll("-", "").slice(0, 8);
  if (/^\d{8}$/.test(ymd)) {
    return `/events/${ymd.slice(0, 4)}/${ymd.slice(4, 6)}/${slug}`;
  }
  const m = eventStart.match(/^(\d{4})-(\d{2})-/);
  if (m) return `/events/${m[1]}/${m[2]}/${slug}`;
  return `/events`;
}

/**
 * Derive tags/paths from a CMS webhook body. Returns null when the body has no
 * WP object fields (caller should fall back to explicit tag/path params).
 */
export function mapWpRevalidatePayload(
  body: WpRevalidateWebhookBody,
): MappedRevalidate | null {
  const objectType = (body.object_type ?? body.objectType ?? "").trim().toLowerCase();
  const postTypeRaw = body.post_type ?? body.postType ?? "";
  const slug = (body.slug ?? body.post_name ?? "").trim().replace(/^\/+|\/+$/g, "");
  const eventStart = body.event_start ?? body.eventStart;

  // Menu updates
  if (objectType === "nav_menu" || objectType === "menu" || postTypeRaw === "nav_menu") {
    return {
      tags: [WP_CACHE_TAGS.nav],
      paths: [],
      layout: true,
    };
  }

  // Taxonomy terms that drive filters (program areas, audiences, etc.)
  if (objectType === "term" || objectType === "taxonomy") {
    const taxonomy = (body.taxonomy ?? "").toLowerCase();
    const tags = new Set<string>([WP_CACHE_TAGS.pages]);
    if (taxonomy.includes("program") || taxonomy.includes("audience") || taxonomy.includes("camp")) {
      tags.add(WP_CACHE_TAGS.programs);
      tags.add(WP_CACHE_TAGS.membership);
    }
    if (taxonomy.includes("center")) tags.add(WP_CACHE_TAGS.centers);
    if (taxonomy.includes("event")) tags.add(WP_CACHE_TAGS.events);
    return {
      tags: [...tags],
      paths: ["/programs", "/membership", "/events", "/centers"],
      layout: false,
    };
  }

  if (!postTypeRaw) return null;

  const postType = normalizePostType(postTypeRaw);
  const tags = new Set<string>();
  const paths = new Set<string>();
  let layout = false;

  switch (postType) {
    case "program":
    case "programs":
      tags.add(WP_CACHE_TAGS.programs);
      paths.add("/programs");
      if (slug) paths.add(`/programs/${slug}`);
      break;

    case "center":
    case "centers":
      tags.add(WP_CACHE_TAGS.centers);
      paths.add("/centers");
      if (slug) paths.add(`/centers/${slug}`);
      break;

    case "amenity":
    case "amenities":
    case "accessibility-amenity":
    case "accessibility-amenities":
    case "accessibilityamenity":
      tags.add(WP_CACHE_TAGS.amenities);
      tags.add(WP_CACHE_TAGS.centers);
      paths.add("/centers");
      paths.add("/membership");
      if (slug && !postType.includes("accessibility")) {
        paths.add(`/amenities/${slug}`);
      }
      break;

    case "event":
    case "events":
      tags.add(WP_CACHE_TAGS.events);
      paths.add("/events");
      paths.add("/visit");
      paths.add("/centers");
      paths.add("/");
      if (slug) paths.add(buildEventPath(slug, eventStart));
      break;

    case "news":
    case "new":
      tags.add(WP_CACHE_TAGS.news);
      paths.add("/news");
      paths.add("/");
      if (slug) paths.add(`/news/${slug}`);
      break;

    case "announcement-bar":
    case "announcement-bars":
    case "announcementbar":
    case "announcement":
    case "announcements":
      tags.add(WP_CACHE_TAGS.announcements);
      layout = true;
      break;

    case "page":
      tags.add(WP_CACHE_TAGS.pages);
      tags.add(WP_CACHE_TAGS.seo);
      if (slug && PAGE_SLUG_MAP[slug]) {
        const mapped = PAGE_SLUG_MAP[slug];
        mapped.tags.forEach((t) => tags.add(t));
        mapped.paths.forEach((p) => paths.add(p));
        if (mapped.layout) layout = true;
      } else if (slug) {
        // Generic WP page → try front-end path by slug
        paths.add(`/${slug}`);
        paths.add("/");
      } else {
        paths.add("/");
      }
      break;

    case "membership":
    case "memberships":
      tags.add(WP_CACHE_TAGS.membership);
      paths.add("/membership");
      break;

    case "nav-menu-item":
    case "nav_menu_item":
      tags.add(WP_CACHE_TAGS.nav);
      layout = true;
      break;

    case "staff-profile":
    case "staff-profiles":
    case "staffprofile":
      // Appear on programs/PT/private lessons/news — broad but safe.
      tags.add(WP_CACHE_TAGS.programs);
      tags.add(WP_CACHE_TAGS.pages);
      paths.add("/personal-training");
      paths.add("/private-lessons");
      break;

    case "campaign":
    case "campaigns":
    case "testimonial":
    case "testimonials":
    case "sponsor":
    case "sponsors":
      tags.add(WP_CACHE_TAGS.pages);
      paths.add("/");
      break;

    default:
      // Unknown CPT: bust global GraphQL tag + home so nothing stays silently stale.
      tags.add(WP_CACHE_TAGS.all);
      paths.add("/");
      layout = true;
      break;
  }

  return {
    tags: [...tags],
    paths: [...paths],
    layout,
  };
}
