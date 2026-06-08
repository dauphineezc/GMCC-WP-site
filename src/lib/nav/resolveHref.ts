// lib/nav/resolveHref.ts
import { mapWpPathToNextPath } from "./routeMap";

function normalizeWpUrlToPath(url: string) {
    try {
      const u = new URL(url);
      return (u.pathname.replace(/\/$/, "") || "/");
    } catch {
      return (url.startsWith("/") ? url : `/${url}`).replace(/\/$/, "") || "/";
    }
  }
  
  function buildQuery(params: Record<string, string>) {
    const sp = new URLSearchParams(params);
    return sp.toString();
  }

  const OUR_PURPOSE_PAGE: Record<string, string> = {
    "Our Purpose": "/about",
  };

  const MEMBERSHIP_PAGES: Record<string, string> = {
    "Join Now": "/membership",
    "Take a Tour": "/take-a-tour",
    "Insurance-based memberships": "/insurance-based-memberships",
    "Corporate Memberships": "/corporate-memberships",
    "Cancellation Policy": "/policies",
  };
  
  // program filter rules
  const PROGRAM_FILTER_BY_LABEL: Record<string, string> = {
    "Aquatics": "/programs?" + buildQuery({ programArea: "Aquatics" }),
    "Youth Swim Lessons": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Aquatics", audience: "youth" }),
    "Adult Swim Lessons": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Aquatics", audience: "youth,family,adult,activeOlderAdult" }),
    "Fitness": "/programs?" + buildQuery({ programArea: "Fitness" }),
    "Camps": "/camps",
    "Full Day Camps": "/camps?" + buildQuery({ campType: "full-day" }),
    "Mini Day Camps": "/camps?" + buildQuery({ campType: "mini-day" }),
    "Specialty/Art Camps": "/camps?" + buildQuery({ campType: "specialty-art" }),
    "Sport/Aquatics Camps": "/camps?" + buildQuery({ campType: "sport-aquatics" }),
    "Childcare": "/programs?" + buildQuery({ programArea: "Childcare" }),
    "Youth Sports Leagues": "/programs?" + buildQuery({ offeringType: "League/Team", programArea: "Middle School Sports" }),
    "Dolphins Swim Team": "/programs/dolphins-swim-team",
  };

  // Event filter rules (label-based for navbar items)
  const EVENT_FILTER_BY_LABEL: Record<string, string> = {
    "Tournaments": "/tournaments",
    "Races": "/races",
    "Socials": "/events?" + buildQuery({ eventType: "Social" }),
    "Trips": "/events?" + buildQuery({ eventType: "Trip" }),
    "Food Distributions": "/events?" + buildQuery({ eventType: "Food Distribution" }),
  };

  // Unique program pages that link directly to /programs/[slug]
  const UNIQUE_PROGRAM_PAGES: Record<string, string> = {
    "Drop-In Swim": "/programs/drop-in-swim",
    "Dolphins Swim Team": "/programs/dolphins",
    "Lifeguard Training": "/programs/lifeguard-training",
    "Group Fitness Classes": "/programs?" + buildQuery({ programArea: "Group Fitness" }),
    "Personal Training": "/personal-training",
    "SilverSneakers": "/programs/silver-sneakers",
    "Virtual Fitness": "/virtual-fitness",
    "Rock Steady Boxing": "/programs/rock-steady-boxing",
    "Drop-In Care": "/programs/drop-in-care",
    "On-Site Care": "/programs/on-site-care",
    "Before & After School Care": "/programs/before-after-school",
    "Preschool": "/programs/preschool",
    "Driver's Training": "/programs/drivers-training",
    "Tax Aide Program": "/programs/tax-aide",
    "Food Distributions": "/programs/food-distributions",
    "Food, Clothes, & Hygiene Pantries": "/programs/pantries",
  };

  const SCHEDULE_PAGES: Record<string, string> = {
    "Plan Your Visit": "/visit",
    "Group Fitness Schedules": "/visit/group-fitness-schedules",
    "Community Activity Schedules": "/visit/community-activity-schedules",
    "Session Calendar": "/visit/session-calendar",
    "Court Availability": "/visit/court-availability",
    "Pool Availability": "/visit/pool-availability",
    "League Schedules": "/visit/league-schedules",
  };
  
  export function resolveHref({
    wpUrl,
    label,
    centerMap,
  }: {
    wpUrl: string;
    label: string;
    centerMap: Map<string, string>;
  }) {

    const ourPurposePage = OUR_PURPOSE_PAGE[label];
    if (ourPurposePage) return ourPurposePage;

    const membershipPage = MEMBERSHIP_PAGES[label];
    if (membershipPage) return membershipPage;

    // 1) Programs filter overrides (based on desired behavior)
    const programOverride = PROGRAM_FILTER_BY_LABEL[label];
    if (programOverride) return programOverride;

    // 1b) Events filter overrides (based on desired behavior)
    const eventOverride = EVENT_FILTER_BY_LABEL[label];
    if (eventOverride) return eventOverride;

    // 2) Unique program pages that link directly to /programs/[slug]
    const uniqueProgramPage = UNIQUE_PROGRAM_PAGES[label];
    if (uniqueProgramPage) return uniqueProgramPage;
  
    // 3) Centers: WP page URI -> /centers/[slug]
    const wpPath = normalizeWpUrlToPath(wpUrl);
    const centerHref = centerMap.get(wpPath);
    if (centerHref) return centerHref;
  
    // 4) Schedule pages: WP page URI -> /visit/[slug]
    const scheduleHref = SCHEDULE_PAGES[label];
    if (scheduleHref) return scheduleHref;
  
    // 4) Otherwise: keep path as-is (works for normal pages like /about, /events, etc.)
    return wpPath;
  }

const ALL_LABEL_OVERRIDES: Record<string, string> = {
  ...OUR_PURPOSE_PAGE,
  ...MEMBERSHIP_PAGES,
  ...PROGRAM_FILTER_BY_LABEL,
  ...EVENT_FILTER_BY_LABEL,
  ...UNIQUE_PROGRAM_PAGES,
  ...SCHEDULE_PAGES,
};

function normalizeLabelKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const CANONICAL_LABEL_BY_NORMALIZED_KEY = (() => {
  const map = new Map<string, string>();
  for (const label of Object.keys(ALL_LABEL_OVERRIDES)) {
    map.set(normalizeLabelKey(label), label);
  }
  return map;
})();

/** WP page titles that differ slightly from nav menu labels */
const SEARCH_LABEL_ALIASES: Record<string, string> = {
  "Sports/Aquatics Camps": "Sport/Aquatics Camps",
  "Sports Aquatics Camps": "Sport/Aquatics Camps",
  "Our purpose": "Our Purpose",
};

function canonicalLabelFromText(text: string): string | null {
  const alias = SEARCH_LABEL_ALIASES[text];
  if (alias) return alias;
  if (ALL_LABEL_OVERRIDES[text]) return text;
  return CANONICAL_LABEL_BY_NORMALIZED_KEY.get(normalizeLabelKey(text)) ?? null;
}

function labelCandidatesFromPath(wpPath: string): string[] {
  const segments = wpPath.split("/").filter(Boolean);
  const candidates: string[] = [];

  for (const segment of segments) {
    const words = segment.replace(/-/g, " ");
    const titleCase = words.replace(/\b\w/g, (char) => char.toUpperCase());
    candidates.push(titleCase);

    const canonical = canonicalLabelFromText(titleCase);
    if (canonical) candidates.push(canonical);
  }

  return candidates;
}

/**
 * Resolve a WordPress content node (search result, etc.) to the Next.js href
 * used in navigation — including label-based overrides from resolveHref.
 */
export function resolveContentNodeHref({
  uri,
  title,
  centerMap,
}: {
  uri: string;
  title: string;
  centerMap: Map<string, string>;
}): string {
  const wpPath = normalizeWpUrlToPath(uri);
  const labelsToTry: string[] = [];

  const trimmedTitle = title.trim();
  if (trimmedTitle) {
    labelsToTry.push(trimmedTitle);
    const canonicalTitle = canonicalLabelFromText(trimmedTitle);
    if (canonicalTitle) labelsToTry.push(canonicalTitle);
  }

  labelsToTry.push(...labelCandidatesFromPath(wpPath));

  for (const label of [...new Set(labelsToTry)]) {
    const href = resolveHref({ wpUrl: uri, label, centerMap });
    if (href !== wpPath) return href;
  }

  const mappedPath = mapWpPathToNextPath(wpPath);
  if (mappedPath !== wpPath) return mappedPath;

  return wpPath;
}