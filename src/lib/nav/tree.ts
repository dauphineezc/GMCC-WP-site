// lib/nav/tree.ts
export type WPMenuItem = {
  id: string;
  label: string;
  url: string;
  parentId: string | null;
  order?: number | null;
};

export type NavItem = {
  id: string;
  label: string;
  href: string;
  children: NavItem[];
};

// Handy alias for places where you want to pass utility links around
export type UtilityNavItem = NavItem;

export function buildMenuTree(
  items: WPMenuItem[],
  hrefResolver: (item: WPMenuItem) => string
): NavItem[] {
  const map = new Map<
    string,
    NavItem & { parentId: string | null; order: number }
  >();

  for (const item of items) {
    map.set(item.id, {
      id: item.id,
      label: item.label,
      href: hrefResolver(item),
      children: [],
      parentId: item.parentId ?? null,
      order: item.order ?? 0,
    });
  }

  const roots: Array<NavItem & { parentId: string | null; order: number }> = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRec = (arr: any[]) => {
    arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    arr.forEach((n) => sortRec(n.children ?? []));
  };
  sortRec(roots);

  const strip = (n: any): NavItem => ({
    id: n.id,
    label: n.label,
    href: n.href,
    children: (n.children ?? []).map(strip),
  });

  return roots.map(strip);
}
