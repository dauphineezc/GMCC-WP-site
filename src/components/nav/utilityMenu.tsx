// src/components/nav/utilityMenu.tsx
import Link from "next/link";
import { getUtilityNav } from "@/lib/nav/getUtilityMenu";

/**
 * Renders utility links using the same cached fetch as the root layout navbar
 * (avoids a second GraphQL menu query on home/about).
 */
export default async function UtilityMenu() {
  const items = await getUtilityNav();
  if (!items.length) return null;

  return (
    <nav aria-label="Utility" className="hidden md:block">
      <ul className="flex items-center gap-4">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
