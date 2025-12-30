// lib/nav/routeMap.ts
export function mapWpPathToNextPath(path: string) {
    // ensure leading slash, no trailing slash
    const p = (path.startsWith("/") ? path : `/${path}`).replace(/\/$/, "") || "/";
  
    // 1) Centers: WP pages like /community-center/ -> Next route /centers/community-center
    const centerSlugs = new Set([
      "coleman-family-center",
      "community-center",
      "corporate-wellness-center",
      "curling-center",
      "north-family-center",
      "tennis-center",
    ]);
  
    const slug = p.split("/").filter(Boolean)[0]; // first segment
    if (centerSlugs.has(slug)) return `/centers/${slug}`;
  
    // 2) (Optional) Programs category landing pages
    const programCategorySlugs = new Set([
      "aquatics",
      "fitness",
      "sports-recreation",
      "camps",
      "childcare",
      "community",
    ]);
    if (programCategorySlugs.has(slug)) {
      // you can choose either:
      // return `/programs/${slug}` if you have a category page
      // OR filter route:
      return `/programs?area=${encodeURIComponent(slug)}`;
    }
  
    // default: just use the same path
    return p;
  }
  