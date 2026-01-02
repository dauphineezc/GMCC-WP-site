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
  
  // “test” program filter rules (label-based for now)
  const PROGRAM_FILTER_BY_LABEL: Record<string, string> = {
    "Aquatics": "/programs?" + buildQuery({ programArea: "Aquatics" }),
    "Child Swim Lessons": "/programs?" + buildQuery({ programArea: "Aquatics", audience: "youth" }),
    "Adult Swim Lessons": "/programs?" + buildQuery({ programArea: "Aquatics", audience: "youth,family,adult,activeOlderAdult" }),
    "Fitness": "/programs?" + buildQuery({ programArea: "Fitness" }),
    "Camps": "/programs?" + buildQuery({ offeringType: "Camp" }),
    "Childcare": "/programs?" + buildQuery({ programArea: "Childcare" }),
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
    // 1) Programs filter overrides (based on desired behavior)
    const programOverride = PROGRAM_FILTER_BY_LABEL[label];
    if (programOverride) return programOverride;
  
    // 2) Centers: WP page URI -> /centers/[slug]
    const wpPath = normalizeWpUrlToPath(wpUrl);
    const centerHref = centerMap.get(wpPath);
    if (centerHref) return centerHref;
  
    // 3) Otherwise: keep path as-is (works for normal pages like /about, /events, etc.)
    return wpPath;
  }  