// lib/nav/centerMap.ts
import { cache } from "react";
import { wpFetch } from "@/lib/wp";

type CenterNode = { slug: string; uri: string };

const CENTERS_QUERY = /* GraphQL */ `
  query CentersForNav {
    centers(first: 200) {
      nodes {
        slug
        uri
      }
    }
  }
`;

function normalizePath(p: string) {
  const path = p.startsWith("/") ? p : `/${p}`;
  return path.replace(/\/$/, "") || "/";
}

export const getCenterWpToNextMap = cache(async () => {
  const data = await wpFetch<{
    centers: { nodes: CenterNode[] };
  }>(CENTERS_QUERY);

  const map = new Map<string, string>();

  for (const c of data.centers.nodes) {
    const nextPath = `/centers/${c.slug}`;

    // Map the full WP URI (e.g., "/center/community-center" or "/community-center")
    const wpPath = normalizePath(c.uri);
    map.set(wpPath, nextPath);

    // Also map by just the slug (e.g., "/community-center") so menu items
    // that link directly to the slug will resolve correctly
    const slugPath = `/${c.slug}`;
    if (slugPath !== wpPath) {
      map.set(slugPath, nextPath);
    }
  }

  return map;
});