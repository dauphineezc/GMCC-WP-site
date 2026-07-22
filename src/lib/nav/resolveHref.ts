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

  const JOIN_OUR_TEAM_PAGE: Record<string, string> = {
    "Join Our Team": "/careers",
  };

  const MEMBERSHIP_PAGES: Record<string, string> = {
    "Join Now": "/membership",
    "Take a Tour": "/take-a-tour",
    "Insurance-based memberships": "/insurance-based-memberships",
    "Corporate Memberships": "/corporate-memberships",
    "Cancellation Policy": "/policies",
  };
  
  // program filter rules
  // headerVariant is captured client-side then immediately stripped from the
  // address bar, so it never stays visible. Use it whenever the filter set
  // would otherwise resolve to the wrong specialized header.
  const PROGRAM_FILTER_BY_LABEL: Record<string, string> = {
    // Aquatics
    "Aquatics": "/programs?" + buildQuery({ programArea: "Aquatics" }),
    "Youth Swim Lessons": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Aquatics", audience: "youth" }),
    "Adult Swim Lessons": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Aquatics", audience: "family,adult,activeOlderAdult" }),

    // Fitness
    "Fitness": "/programs?" + buildQuery({ offeringType: "Class,Drop-In,Lessons/Training", programArea: "Aquatics,Group Fitness,Personal Training,SilverSneakers,Walking", headerVariant: "none" }),
    "Group Fitness Classes": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Group Fitness", headerVariant: "group-fitness" }),
    "SilverSneakers": "/programs?" + buildQuery({ offeringType: "Class", programArea: "SilverSneakers,Group Fitness", headerVariant: "silversneakers" }),
    "Renew Active/One Pass": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Group Fitness", headerVariant: "renew-active" }),

    // Sports and Recreation
    "Sports and Recreation": "/programs?" + buildQuery({ programArea: "Basketball,Cheer and Pom,Curling,Middle School Sports,Misc/Other Sports,Racquet Sports", headerVariant: "sports-and-recreation" }),
    "Youth Classes and Clinics": "/programs?" + buildQuery({ offeringType: "Class,Clinic,Lessons/Training", programArea: "Basketball,Cheer and Pom,Curling,Middle School Sports,Misc/Other Sports,Racquet Sports", audience: "youth" }),
    "Youth Sports Leagues": "/programs?" + buildQuery({ offeringType: "League/Team", programArea: "Basketball,Cheer and Pom,Curling,Middle School Sports,Misc/Other Sports,Racquet Sports", audience: "youth" }),
    "Adult Classes and Clinics": "/programs?" + buildQuery({ offeringType: "Class,Clinic,Lessons/Training", programArea: "Basketball,Cheer and Pom,Curling,Misc/Other Sports,Racquet Sports", audience: "teen,adult,senior" }),
    "Adult Sports Leagues": "/programs?" + buildQuery({ offeringType: "League/Team", programArea: "Basketball,Cheer and Pom,Curling,Misc/Other Sports,Racquet Sports", audience: "teen,adult,senior" }),

    // Camps
    "Camps": "/camps",
    "Preschool Half-Day Camps": "/camps?" + buildQuery({ campType: "mini-day" }),
    "Full Day Camps": "/camps?" + buildQuery({ campType: "full-day" }),
    "Mini Day Camps": "/camps?" + buildQuery({ campType: "mini-day" }),
    "Specialty/Art Camps": "/camps?" + buildQuery({ campType: "specialty-art" }),
    "Sport/Aquatics Camps": "/camps?" + buildQuery({ campType: "sport-aquatics" }),

    // Community
    "Community": "/programs?" + buildQuery({ programArea: "Community Partners", headerVariant: "community" }),
  };

  // Unique program pages that link to specific pages
  const UNIQUE_PROGRAM_PAGES: Record<string, string> = {
    "Dolphins Swim Team": "/programs/dolphins-swim-team",
    "Lifeguard Training": "/programs/lifeguard-training",

    "Personal Training": "/personal-training",
    "Rock Steady Boxing": "/programs/rock-steady-boxing",
    "Virtual Fitness": "/virtual-fitness",

    "Private Tennis/Pickleball Lessons": "/private-lessons",

    "Residence Camp Neyati": "/programs/camp-neyati",

    "Early Childhood" : "/early-childhood",
    "Drop-In Child Watch" : "/amenities/childwatch",
    "On-Site Care" : "/early-childhood",
    "Before/After School Care" : "/early-childhood",
    "Preschool" : "/early-childhood",

    "Driver's Training": "/programs/drivers-training",
    "Tax Aide Program": "/programs/tax-aide",
    "Food Distributions": "/programs/food-distributions",
    "Food, Clothes, & Hygiene Pantries": "/programs/pantries",
  };

  // Event filter rules (label-based for navbar items)
  const EVENT_FILTER_BY_LABEL: Record<string, string> = {
    "Tournaments": "/tournaments",
    "Races": "/races",
    "Socials": "/events?" + buildQuery({ eventType: "Social" }),
    "Trips": "/events?" + buildQuery({ eventType: "Trip" }),
    "Food Distributions": "/events?" + buildQuery({ eventType: "Food Distribution" }),
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

    const joinOurTeamPage = JOIN_OUR_TEAM_PAGE[label];
    if (joinOurTeamPage) return joinOurTeamPage;

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
  ...JOIN_OUR_TEAM_PAGE,
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