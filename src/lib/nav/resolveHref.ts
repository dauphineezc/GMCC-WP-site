// lib/nav/resolveHref.ts
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
    "Take a Tour": "/membership/tour",
    "Membership Discounts": "/membership/discounts",
    "Corporate Memberships": "/membership/corporate",
    "Cancellation Policy": "/membership/policies",
  };
  
  // program filter rules
  const PROGRAM_FILTER_BY_LABEL: Record<string, string> = {
    "Aquatics": "/programs?" + buildQuery({ programArea: "Aquatics" }),
    "Youth Swim Lessons": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Aquatics", audience: "youth" }),
    "Adult Swim Lessons": "/programs?" + buildQuery({ offeringType: "Class", programArea: "Aquatics", audience: "youth,family,adult,activeOlderAdult" }),
    "Fitness": "/programs?" + buildQuery({ programArea: "Fitness" }),
    "Camps": "/camps",
    "Full Day Camps": "/programs?" + buildQuery({ offeringType: "Camp", campType: "full-day" }),
    "Mini Day Camps": "/programs?" + buildQuery({ offeringType: "Camp", campType: "mini-day" }),
    "Specialty/Art Camps": "/programs?" + buildQuery({ offeringType: "Camp", campType: "specialty-art" }),
    "Sport/Aquatics Camps": "/programs?" + buildQuery({ offeringType: "Camp", campType: "sport-aquatics" }),
    "Childcare": "/programs?" + buildQuery({ programArea: "Childcare" }),
  };

  // Event filter rules (label-based for navbar items)
  const EVENT_FILTER_BY_LABEL: Record<string, string> = {
    "Tournaments": "/events?" + buildQuery({ eventType: "Tournament" }),
    "Races": "/races",
    "Socials": "/events?" + buildQuery({ eventType: "Social" }),
    "Trips": "/events?" + buildQuery({ eventType: "Trip" }),
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