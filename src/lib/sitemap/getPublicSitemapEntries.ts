import type { MetadataRoute } from "next";
import { isExternalHref } from "@/lib/acf";
import { getCenterWpToNextMap } from "@/lib/nav/centerMap";
import { getFooterNav } from "@/lib/nav/getFooterNav";
import { getPrimaryNav } from "@/lib/nav/getPrimaryNav";
import { getUtilityNav } from "@/lib/nav/getUtilityMenu";
import { resolveHref } from "@/lib/nav/resolveHref";
import { fetchWpSitemapPaths } from "./fetchWpSitemapPaths";
import { dedupeSortedPaths, flattenNavPaths, normalizePublicPath } from "./pathUtils";
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

/**
 * Builds the public sitemap from an explicit allowlist of known routes and
 * published WordPress content. No filesystem scanning — only URLs we intend
 * to expose are included.
 */
export async function getPublicSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const [navPaths, wpPaths] = await Promise.all([fetchNavPaths(), fetchWpSitemapPaths()]);

  const paths = dedupeSortedPaths([
    ...STATIC_INDEX_PATHS.map((path) => normalizePublicPath(path)).filter(
      (path): path is string => Boolean(path)
    ),
    ...navPaths,
    ...wpPaths,
  ]);

  return paths.map((path) => ({
    url: toAbsoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

/** Guard for any future dynamic additions — rejects external or blocked paths. */
export function isPublicSitemapPath(href: string): boolean {
  if (isExternalHref(href)) return false;
  return normalizePublicPath(href) !== null;
}
