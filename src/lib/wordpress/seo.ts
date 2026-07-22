import type { Metadata } from "next";
import { wpFetch } from "@/lib/wp";
import { toAbsoluteUrl } from "@/lib/sitemap/siteUrl";

type YoastSeo = {
  title?: string | null;
  metaDesc?: string | null;
};

type SeoNode = {
  seo?: YoastSeo | null;
} | null;

const SEO_BY_URI_QUERY = `
  query SeoByUri($uri: String!) {
    nodeByUri(uri: $uri) {
      ... on ContentNode {
        seo {
          title
          metaDesc
        }
      }
    }
  }
`;

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
    const data = await wpFetch<{ nodeByUri?: SeoNode }>(SEO_BY_URI_QUERY, {
      uri: normalizeUri(pathname),
    });
    const node = data?.nodeByUri;
    const title = nonEmptyString(node?.seo?.title);
    const description = nonEmptyString(node?.seo?.metaDesc);

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
