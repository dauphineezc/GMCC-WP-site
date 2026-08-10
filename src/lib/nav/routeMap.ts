// lib/nav/routeMap.ts
export function mapWpPathToNextPath(path: string) {
    // ensure leading slash, no trailing slash
    const p = (path.startsWith("/") ? path : `/${path}`).replace(/\/$/, "") || "/";
  
    // 1) Centers: WP pages like /community-center/ -> Next route /centers/community-center
    const centerSlugs = new Set([
      "coleman-family-center",
      "community-center",
      "curling-center",
      "north-family-center",
      "tennis-center",
    ]);
  
    const slug = p.split("/").filter(Boolean)[0]; // first segment
    if (centerSlugs.has(slug)) return `/centers/${slug}`;
  
    // 2) (Optional) Programs area landing pages
    const programAreaSlugs = new Set([
      "aquatics",
      "fitness",
      "sports-recreation",
      "camps",
      "childcare",
      "community",
    ]);
    if (programAreaSlugs.has(slug)) {
      // you can choose either:
      // return `/programs/${slug}` if you have a area page
      // OR filter route:
      return `/programs?programArea=${encodeURIComponent(slug)}`;
    }

    const programSlugs = new Set([
      "drop-in-swim",
      "dolphins",
      "lifeguard-training",
      "group-fitness-classes",
      "personal-training",
      "silver-sneakers",
      "virtual-fitness",
      "drop-in-care",
      "on-site-care",
      "before-after-school",
      "preschool",
      "drivers-training",
      "tax-aide",
      "food-distributions",
    ]);
    if (programSlugs.has(slug)) {
      return `/programs/${slug}`;
    }

    const amenityPathByWpSlug: Record<string, string> = {
      pantries: "/amenities/pantries",
      "food-clothes-hygiene-pantries": "/amenities/pantries",
    };
    if (amenityPathByWpSlug[slug]) {
      return amenityPathByWpSlug[slug];
    }
  
    // default: just use the same path
    return p;
  }
  