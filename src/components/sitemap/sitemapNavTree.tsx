import Link from "next/link";
import type { NavItem } from "@/lib/nav/tree";
import { isExternalHref } from "@/lib/acf";

export function SitemapLink({ href, label }: { href: string; label: string }) {
  const className =
    "text-gmcc-navy hover:text-gmcc-teal hover:underline underline-offset-2 transition-colors";

  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

type SitemapNavTreeProps = {
  items: NavItem[];
  depth?: number;
};

export default function SitemapNavTree({ items, depth = 0 }: SitemapNavTreeProps) {
  if (items.length === 0) return null;

  return (
    <ul className={depth === 0 ? "space-y-2" : "mt-2 space-y-1.5 border-l border-neutral-200 pl-4"}>
      {items.map((item) => (
        <li key={item.id}>
          <SitemapLink href={item.href} label={item.label} />
          {item.children.length > 0 ? (
            <SitemapNavTree items={item.children} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SitemapFlatLinks({ items }: { items: { id: string; label: string; href: string }[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <SitemapLink href={item.href} label={item.label} />
        </li>
      ))}
    </ul>
  );
}
