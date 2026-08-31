// lib/nav/getFooterNav.ts
import { cache } from "react";
import { wpFetch } from "../wp";

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

function normalizeWpUrlToPath(url: string): string {
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
  }>(FOOTER_NAV_QUERY);

  const nodes = data.menu?.menuItems?.nodes ?? [];
  
  return nodes.map((item) => ({
    id: item.id,
    label: item.label,
    href: normalizeWpUrlToPath(item.url),
  }));
});

