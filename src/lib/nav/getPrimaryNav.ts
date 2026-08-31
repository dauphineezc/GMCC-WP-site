// lib/nav/getPrimaryNav.ts
import { cache } from "react";
import { wpFetch } from "@/lib/wp";
import { buildMenuTree, type WPMenuItem } from "./tree";
import { getCenterWpToNextMap } from "./centerMap";
import { resolveHref } from "./resolveHref";

const PRIMARY_NAV_QUERY = /* GraphQL */ `
  query PrimaryNavByName {
    menu(id: "PrimaryNav", idType: NAME) {
      menuItems(first: 200) {
        nodes {
          id
          label
          url
          parentId
          order
        }
      }
    }
  }
`;

export const getPrimaryNav = cache(async () => {
  const [navData, centerMap] = await Promise.all([
    wpFetch<{ menu: { menuItems: { nodes: WPMenuItem[] } } | null }>(PRIMARY_NAV_QUERY),
    getCenterWpToNextMap(),
  ]);

  const nodes = navData.menu?.menuItems?.nodes ?? [];

  return buildMenuTree(nodes, (item) =>
    resolveHref({ wpUrl: item.url, label: item.label, centerMap })
  );
});