// src/lib/nav/getUtilityMenu.ts
import { cache } from "react";
import { wpFetch } from "@/lib/wp";
import type { NavItem } from "@/lib/nav/tree";
import { WP_CACHE_TAGS } from "@/lib/revalidate";
import { ADP_LANDING_PAGE_URL } from "@/lib/constants";

const UTILITY_MENU_DATABASE_ID = "103";

type UtilityMenuItem = {
  id: string;
  label: string;
  url?: string | null;
  path?: string | null;
};

type UtilityMenuQuery = {
  menu: {
    menuItems: {
      nodes: UtilityMenuItem[];
    };
  } | null;
};

const UTILITY_MENU_QUERY = /* GraphQL */ `
  query UtilityMenu($id: ID!) {
    menu(id: $id, idType: DATABASE_ID) {
      menuItems(first: 50) {
        nodes {
          id
          label
          url
          path
        }
      }
    }
  }
`;

// WordPress site domain - URLs on this domain get converted to paths
const WP_DOMAIN = "gmccsandbo1dev.wpenginepowered.com";

function normalizeHref(urlOrPath: string): string {
  // If it's already a relative path, clean it up
  if (urlOrPath.startsWith("/")) {
    return urlOrPath.replace(/\/$/, "") || "/";
  }

  // Try parsing as URL
  try {
    const u = new URL(urlOrPath);
    // If it's our WP domain, extract just the path
    if (u.hostname === WP_DOMAIN) {
      return u.pathname.replace(/\/$/, "") || "/";
    }
    // External URL - keep the full URL
    return urlOrPath;
  } catch {
    // Not a valid URL, treat as path
    return `/${urlOrPath}`.replace(/\/$/, "") || "/";
  }
}

export const getUtilityNav = cache(async (): Promise<NavItem[]> => {
  try {
    const data = await wpFetch<UtilityMenuQuery>(
      UTILITY_MENU_QUERY,
      { id: UTILITY_MENU_DATABASE_ID },
      { tags: [WP_CACHE_TAGS.nav] },
    );

    const nodes = data?.menu?.menuItems?.nodes ?? [];

    // Map to NavItem shape expected by Navbar/MobileMenu
    return nodes
      .filter((n) => n && n.id && n.label)
      .map((n) => {
        // Prefer path for internal links, but use url for external links
        const hrefRaw = n.path?.startsWith("/") ? n.path : n.url || "/";
        const isCareers = n.label.trim().toLowerCase() === "careers";
        return {
          id: n.id,
          label: n.label,
          href: isCareers ? ADP_LANDING_PAGE_URL : normalizeHref(hrefRaw),
          children: [],
        };
      });
  } catch (err) {
    console.error("getUtilityNav failed:", err);
    return [];
  }
});
