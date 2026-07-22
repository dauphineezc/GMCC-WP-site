import { isExternalHref } from "@/lib/acf";
import type { NavItem } from "@/lib/nav/tree";

/** Paths that exist in the app but should not be advertised to crawlers. */
const BLOCKED_PATHS = new Set(["/search"]);

const BLOCKED_PREFIXES = ["/api"];

/**
 * Normalize an internal path for comparison and output.
 * Strips query strings and hash fragments so filter URLs are not indexed.
 */
export function normalizePublicPath(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || isExternalHref(trimmed)) return null;

  const withoutHash = trimmed.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  const pathOnly = withoutQuery.replace(/\/$/, "") || "/";

  if (BLOCKED_PATHS.has(pathOnly)) return null;
  if (BLOCKED_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`))) {
    return null;
  }

  if (!/^\/[a-z0-9][a-z0-9\-/]*$/i.test(pathOnly) && pathOnly !== "/") {
    return null;
  }

  const segments = pathOnly.split("/").filter(Boolean);
  if (segments.length > 5) return null;

  return pathOnly;
}

export function flattenNavPaths(items: NavItem[]): string[] {
  const paths: string[] = [];

  const walk = (nodes: NavItem[]) => {
    for (const node of nodes) {
      const path = normalizePublicPath(node.href);
      if (path) paths.push(path);
      if (node.children.length > 0) walk(node.children);
    }
  };

  walk(items);
  return paths;
}

export function dedupeSortedPaths(paths: string[]): string[] {
  return [...new Set(paths)].sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}
