// lib/nav/getFooterNav.ts
import { cache } from "react";
import { wpFetch } from "../wp";
import { WP_CACHE_TAGS } from "@/lib/revalidate";
import { ADP_LANDING_PAGE_URL } from "@/lib/constants";
import { isExternalHref } from "@/lib/acf";

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

function normalizeFooterHref(url: string): string {
  if (isExternalHref(url)) return url.trim();
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

export const getFooterNav = cache(async (): Promise<FooterNavItem[]> => {
  const data = await wpFetch<{
    menu: { menuItems: { nodes: WPMenuItem[] } } | null;
  }>(FOOTER_NAV_QUERY, undefined, { tags: [WP_CACHE_TAGS.nav] });

  const nodes = data.menu?.menuItems?.nodes ?? [];

  return nodes.map((item) => {
    const isJoinOurTeam = item.label.trim().toLowerCase() === "join our team";
    return {
      id: item.id,
      label: item.label,
      href: isJoinOurTeam ? ADP_LANDING_PAGE_URL : normalizeFooterHref(item.url),
    };
  });
});
