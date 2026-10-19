import type { Metadata } from "next";
import { wpFetch } from "@/lib/wp";
import { toAbsoluteUrl } from "@/lib/sitemap/siteUrl";
import { WP_CACHE_TAGS } from "@/lib/revalidate";

type YoastSeo = {
  title?: string | null;
  metaDesc?: string | null;
};

type SeoNode = {
  seo?: YoastSeo | null;
} | null;

/**
 * `nodeByUri` misses pages whose URI is shadowed by a CPT archive (e.g. the
 * "programs" and "events" pages) or whose Next.js path differs from the WP
 * hierarchy (e.g. /visit/pool-availability → /pool-availability/ in WP), so
 * the page-by-slug lookup is fetched alongside it as a fallback.
 */
const SEO_BY_URI_QUERY = `
  query SeoByUri($uri: String!, $slug: String!, $hasSlug: Boolean!) {
    nodeByUri(uri: $uri) {
      ... on ContentNode {
        seo {
          title
          metaDesc
        }
      }
    }
    pages(first: 1, where: { name: $slug }) @include(if: $hasSlug) {
      nodes {
        seo {
          title
          metaDesc
        }
      }
    }
  }
`;

function lastPathSegment(pathname: string) {
  return pathname.split("/").filter(Boolean).pop() ?? "";
}

function normalizeUri(pathname: string) {
  const path = pathname.trim() || "/";
  const prefixedPath = path.startsWith("/") ? path : `/${path}`;
  return prefixedPath === "/" ? "/" : `${prefixedPath.replace(/\/+$/, "")}/`;
}

function nonEmptyString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/**
 * Builds Next.js metadata from Yoast values exposed by WPGraphQL Yoast SEO.
 * Fallbacks keep a missing or unpublished WordPress entry from breaking a route.
 */
export async function getYoastMetadata(
  pathname: string,
  fallback: Metadata = {},
): Promise<Metadata> {
  const canonical = toAbsoluteUrl(
    pathname.trim() === "/" ? "/" : pathname.trim().replace(/\/+$/, ""),
  );

  try {
    const slug = lastPathSegment(pathname);
    const data = await wpFetch<{
      nodeByUri?: SeoNode;
      pages?: { nodes?: SeoNode[] } | null;
    }>(
      SEO_BY_URI_QUERY,
      { uri: normalizeUri(pathname), slug, hasSlug: Boolean(slug) },
      { tags: [WP_CACHE_TAGS.seo] },
    );
    const uriSeo = data?.nodeByUri?.seo;
    const seo = nonEmptyString(uriSeo?.title)
      ? uriSeo
      : data?.pages?.nodes?.[0]?.seo ?? uriSeo;

    const title = nonEmptyString(seo?.title);
    const description = nonEmptyString(seo?.metaDesc);

    return {
      ...fallback,
      alternates: {
        ...fallback.alternates,
        canonical,
      },
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    };
  } catch (error) {
    console.error(`Unable to load Yoast metadata for ${pathname}:`, error);
    return {
      ...fallback,
      alternates: {
        ...fallback.alternates,
        canonical,
      },
    };
  }
}

/** Yoast `<title>` for a route as a plain string, for client components that adjust it. */
export async function getYoastTitle(pathname: string): Promise<string | undefined> {
  const { title } = await getYoastMetadata(pathname);
  return typeof title === "string" ? title : undefined;
}
