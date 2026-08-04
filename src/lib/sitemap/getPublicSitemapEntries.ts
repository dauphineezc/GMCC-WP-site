import type { MetadataRoute } from "next";
import { isExternalHref } from "@/lib/acf";
import { getCenterWpToNextMap } from "@/lib/nav/centerMap";
import { getFooterNav } from "@/lib/nav/getFooterNav";
import { getPrimaryNav } from "@/lib/nav/getPrimaryNav";
import { getUtilityNav } from "@/lib/nav/getUtilityMenu";
import { resolveHref } from "@/lib/nav/resolveHref";
import { fetchWpSitemapPaths } from "./fetchWpSitemapPaths";
import { flattenNavPaths, normalizePublicPath } from "./pathUtils";
import { toAbsoluteUrl } from "./siteUrl";

const STATIC_INDEX_PATHS = ["/", "/sitemap", "/centers", "/programs", "/events", "/news", "/blog"];

async function fetchNavPaths(): Promise<string[]> {
  const [primaryNav, utilityNav, footerNav, centerMap] = await Promise.all([
    getPrimaryNav(),
    getUtilityNav(),
    getFooterNav(),
    getCenterWpToNextMap(),
  ]);

  const primaryPaths = flattenNavPaths(primaryNav);
  const utilityPaths = flattenNavPaths(utilityNav);
  const footerPaths = footerNav
    .map((item) =>
      resolveHref({ wpUrl: item.href, label: item.label, centerMap })
    )
    .map((href) => normalizePublicPath(href))
    .filter((path): path is string => Boolean(path));

  return [...primaryPaths, ...utilityPaths, ...footerPaths];
}

function changeFrequencyForPath(path: string): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (path === "/") return "weekly";
  if (
    path.startsWith("/news/") ||
    path.startsWith("/blog/") ||
    path.startsWith("/events/")
  ) {
    return "weekly";
  }
  return "monthly";
}

function mergeByPath(
  pathEntries: Array<{ path: string; lastModified?: Date }>
): Map<string, Date | undefined> {
  const byPath = new Map<string, Date | undefined>();

  for (const entry of pathEntries) {
    const existing = byPath.get(entry.path);
    if (!byPath.has(entry.path)) {
      byPath.set(entry.path, entry.lastModified);
      continue;
    }
    if (!entry.lastModified) continue;
    if (!existing || entry.lastModified > existing) {
      byPath.set(entry.path, entry.lastModified);
    }
  }

  return byPath;
}

/**
 * Builds the public sitemap from known routes and published WordPress content.
 * No filesystem scanning — only URLs we intend to expose are included.
 *
 * Sources: static indexes, nav menus, CPT/taxonomy content, and all published
 * WP pages (mapped to Next paths). Includes `<lastmod>` from `modifiedGmt`
 * when available, and a heuristic `<changefreq>`.
 */
export async function getPublicSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const [navPaths, wp] = await Promise.all([fetchNavPaths(), fetchWpSitemapPaths()]);

  const staticEntries = STATIC_INDEX_PATHS.map((path) => normalizePublicPath(path))
    .filter((path): path is string => Boolean(path))
    .map((path) => ({ path }));

  const navEntries = navPaths.map((path) => ({ path }));

  const byPath = mergeByPath([
    ...staticEntries,
    ...navEntries,
    ...wp.contentEntries,
    ...wp.pageEntries,
  ]);

  return [...byPath.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, lastModified]) => ({
      url: toAbsoluteUrl(path),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: changeFrequencyForPath(path),
      priority: path === "/" ? 1 : 0.7,
    }));
}

/** Guard for any future dynamic additions — rejects external or blocked paths. */
export function isPublicSitemapPath(href: string): boolean {
  if (isExternalHref(href)) return false;
  return normalizePublicPath(href) !== null;
}
