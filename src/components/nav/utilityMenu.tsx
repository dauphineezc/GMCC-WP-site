// src/components/nav/utilityMenu.tsx
import Link from "next/link";
import { wpFetch } from "@/lib/wp";

// Adjust this to match your WP menu slug (Appearance → Menus → Screen Options → enable “CSS Classes”
// and/or check the menu slug in WPGraphQL, or just set it once and keep it consistent)
const UTILITY_MENU_SLUG = "utility-menu";

type GqlMenuItem = {
  id: string;
  label: string;
  url?: string | null;
  path?: string | null;
};

type UtilityMenuQuery = {
  menu: null | {
    name: string;
    slug: string;
    menuItems: {
      nodes: GqlMenuItem[];
    };
  };
};

const UTILITY_MENU_QUERY = /* GraphQL */ `
  query UtilityMenu($slug: ID!) {
    menu(id: $slug, idType: SLUG) {
      name
      slug
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

function normalizeToPath(urlOrPath: string) {
  // Prefer WPGraphQL's `path` when present, but normalize `url` safely too
  try {
    // If it's an absolute URL, strip to pathname
    const u = new URL(urlOrPath);
    return (u.pathname.replace(/\/$/, "") || "/");
  } catch {
    // Already a path (or relative)
    return (urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`)
      .replace(/\/$/, "") || "/";
  }
}

export default async function UtilityMenu() {
  let data: UtilityMenuQuery | null = null;

  try {
    data = await wpFetch<UtilityMenuQuery>(UTILITY_MENU_QUERY, {
      slug: UTILITY_MENU_SLUG,
    });
  } catch (err) {
    // If the menu slug doesn't exist yet, fail quietly in UI (common in sandbox)
    console.error("UtilityMenu query failed:", err);
    return null;
  }

  const items = data?.menu?.menuItems?.nodes ?? [];
  if (!items.length) return null;

  return (
    <nav aria-label="Utility" className="hidden md:block">
      <ul className="flex items-center gap-4">
        {items.map((item) => {
          const hrefRaw = item.path || item.url || "#";
          const href = normalizeToPath(hrefRaw);

          return (
            <li key={item.id}>
              <Link
                href={href}
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
