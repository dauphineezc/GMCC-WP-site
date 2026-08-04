import { fetchAllAmenityLinks } from "@/lib/amenities";
import { buildEventHref } from "@/lib/events/buildEventHref";
import { EVENT_SCHEDULE_GRAPHQL, getEventDateInfo } from "@/lib/events/eventSchedule";
import { getCenterWpToNextMap } from "@/lib/nav/centerMap";
import { resolveContentNodeHref } from "@/lib/nav/resolveHref";
import { wpFetch } from "@/lib/wp";
import { normalizePublicPath } from "./pathUtils";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** WP pages used as templates / shared ACF sources — not public Next routes. */
const SKIP_PAGE_SLUGS = new Set(["center-detail"]);

export type WpSitemapEntry = {
  path: string;
  /** WordPress `modifiedGmt` when available — used for sitemap `<lastmod>`. */
  lastModified?: Date;
};

type PageInfo = {
  hasNextPage?: boolean;
  endCursor?: string | null;
};

type PaginatedConnection<T> = {
  pageInfo?: PageInfo;
  nodes?: T[];
};

function parseWpGmt(value?: string | null): Date | undefined {
  if (!value) return undefined;
  // WPGraphQL returns GMT as `YYYY-MM-DD HH:MM:SS` (no timezone). Treat as UTC.
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function fetchPaginatedNodes<T>(
  query: string,
  connectionField: string,
  mapNode: (node: T) => WpSitemapEntry | null
): Promise<WpSitemapEntry[]> {
  const entries: WpSitemapEntry[] = [];
  let after: string | null = null;
  let page = 0;

  while (page < MAX_PAGES) {
    page += 1;
    const variables = { first: PAGE_SIZE, after };
    const data: Record<string, PaginatedConnection<T>> = await wpFetch(query, variables);
    const connection: PaginatedConnection<T> | undefined = data[connectionField];
    for (const node of connection?.nodes ?? []) {
      const entry = mapNode(node);
      if (entry) entries.push(entry);
    }

    if (!connection?.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor ?? null;
    if (!after) break;
  }

  return entries;
}

const CENTERS_QUERY = `
  query SitemapCenters($first: Int!) {
    centers(first: $first) {
      nodes {
        slug
        modifiedGmt
      }
    }
  }
`;

const PROGRAMS_QUERY = `
  query SitemapPrograms($first: Int!, $after: String) {
    programs(first: $first, after: $after, where: { stati: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
        modifiedGmt
      }
    }
  }
`;

const NEWS_QUERY = `
  query SitemapNews($first: Int!, $after: String) {
    allNews(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
        modifiedGmt
      }
    }
  }
`;

const POSTS_QUERY = `
  query SitemapPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
        modifiedGmt
      }
    }
  }
`;

const EVENTS_QUERY = `
  query SitemapEvents($first: Int!, $after: String) {
    events(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
        modifiedGmt
        eventFields {
          ${EVENT_SCHEDULE_GRAPHQL}
        }
      }
    }
  }
`;

const PAGES_QUERY = `
  query SitemapPages($first: Int!, $after: String) {
    pages(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
        uri
        title
        modifiedGmt
      }
    }
  }
`;

type SlugNode = {
  slug?: string | null;
  modifiedGmt?: string | null;
};

type EventNode = {
  slug?: string | null;
  modifiedGmt?: string | null;
  eventFields?: { eventSchedule?: unknown } | null;
};

type PageNode = {
  slug?: string | null;
  uri?: string | null;
  title?: string | null;
  modifiedGmt?: string | null;
};

function toEntry(path: string | null, modifiedGmt?: string | null): WpSitemapEntry | null {
  if (!path) return null;
  const lastModified = parseWpGmt(modifiedGmt);
  return lastModified ? { path, lastModified } : { path };
}

/**
 * Published WordPress content for the public sitemap.
 *
 * - `contentEntries`: CPT/taxonomy paths (centers, programs, events, etc.).
 * - `pageEntries`: all published WP pages, mapped to Next paths via
 *   `resolveContentNodeHref` (also carries `modifiedGmt` for `<lastmod>`).
 *   Template-only pages like `center-detail` are skipped.
 */
export async function fetchWpSitemapPaths(): Promise<{
  contentEntries: WpSitemapEntry[];
  pageEntries: WpSitemapEntry[];
}> {
  const centerMapPromise = getCenterWpToNextMap();

  const [
    amenityLinks,
    centersData,
    programEntries,
    newsEntries,
    postEntries,
    eventEntries,
    pageEntries,
  ] = await Promise.all([
    fetchAllAmenityLinks(),
    wpFetch<{ centers?: { nodes?: SlugNode[] } }>(CENTERS_QUERY, { first: PAGE_SIZE }),
    fetchPaginatedNodes<SlugNode>(PROGRAMS_QUERY, "programs", (node) =>
      toEntry(node.slug ? normalizePublicPath(`/programs/${node.slug}`) : null, node.modifiedGmt)
    ),
    fetchPaginatedNodes<SlugNode>(NEWS_QUERY, "allNews", (node) =>
      toEntry(node.slug ? normalizePublicPath(`/news/${node.slug}`) : null, node.modifiedGmt)
    ),
    fetchPaginatedNodes<SlugNode>(POSTS_QUERY, "posts", (node) =>
      toEntry(node.slug ? normalizePublicPath(`/blog/${node.slug}`) : null, node.modifiedGmt)
    ),
    fetchPaginatedNodes<EventNode>(EVENTS_QUERY, "events", (node) => {
      if (!node.slug) return null;
      const startDate = getEventDateInfo(node.eventFields?.eventSchedule).start ?? "";
      return toEntry(normalizePublicPath(buildEventHref(node.slug, startDate)), node.modifiedGmt);
    }),
    centerMapPromise.then((centerMap) =>
      fetchPaginatedNodes<PageNode>(PAGES_QUERY, "pages", (node) => {
        if (!node.uri) return null;
        if (node.slug && SKIP_PAGE_SLUGS.has(node.slug)) return null;

        const href = resolveContentNodeHref({
          uri: node.uri,
          title: node.title ?? "",
          centerMap,
        });

        return toEntry(normalizePublicPath(href), node.modifiedGmt);
      })
    ),
  ]);

  const amenityEntries: WpSitemapEntry[] = amenityLinks
    .map((amenity) => {
      const path = normalizePublicPath(`/amenities/${amenity.slug}`);
      return path ? { path } : null;
    })
    .filter((entry): entry is WpSitemapEntry => Boolean(entry));

  const centerEntries: WpSitemapEntry[] = (centersData?.centers?.nodes ?? [])
    .map((node) =>
      toEntry(node.slug ? normalizePublicPath(`/centers/${node.slug}`) : null, node.modifiedGmt)
    )
    .filter((entry): entry is WpSitemapEntry => Boolean(entry));

  return {
    contentEntries: [
      ...amenityEntries,
      ...centerEntries,
      ...programEntries,
      ...newsEntries,
      ...postEntries,
      ...eventEntries,
    ],
    pageEntries,
  };
}

