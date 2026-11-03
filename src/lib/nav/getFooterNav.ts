// lib/nav/getFooterNav.ts
import { cache } from "react";
import { wpFetch } from "../wp";
import { WP_CACHE_TAGS } from "@/lib/revalidate";
import { ADP_LANDING_PAGE_URL } from "@/lib/constants";

export type FooterNavItem = {
  id: string;
  label: string;
  href: string;
};

type WPMenuItem = {
  id: string;
  label: string;
  url: string;
};

const FOOTER_NAV_QUERY = /* GraphQL */ `
  query FooterNavByName {
    menu(id: "FooterNav", idType: NAME) {
      name
      menuItems(first: 50) {
        nodes {
          id
          label
          url
        }
      }
    }
  }
`;

/** WordPress / site hosts whose absolute URLs should become relative paths. */
function isSameSiteHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "gmccsandbo1dev.wpenginepowered.com" ||
    host.endsWith(".wpenginepowered.com") ||
    host === "greatermidland.org" ||
    host.endsWith(".greatermidland.org")
  );
}

function normalizeFooterHref(url: string): string {
  if (url.startsWith("/")) {
    return url.replace(/\/$/, "") || "/";
  }

  try {
    const u = new URL(url);
    if (isSameSiteHost(u.hostname)) {
      const path = u.pathname.replace(/\/$/, "") || "/";
      return u.search ? `${path}${u.search}` : path;
    }
    // Truly external (e.g. ADP) — keep the full URL
    return url.trim();
  } catch {
    return `/${url}`.replace(/\/$/, "") || "/";
  }
}

function isCareersLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return normalized === "join our team" || normalized === "careers";
}

export const getFooterNav = cache(async (): Promise<FooterNavItem[]> => {
  const data = await wpFetch<{
    menu: { menuItems: { nodes: WPMenuItem[] } } | null;
  }>(FOOTER_NAV_QUERY, undefined, { tags: [WP_CACHE_TAGS.nav] });

  const nodes = data.menu?.menuItems?.nodes ?? [];

  return nodes.map((item) => {
    return {
      id: item.id,
      label: item.label,
      href: isCareersLabel(item.label)
        ? ADP_LANDING_PAGE_URL
        : normalizeFooterHref(item.url),
    };
  });
});
