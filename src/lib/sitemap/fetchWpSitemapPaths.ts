import { fetchAllAmenityLinks } from "@/lib/amenities";
import { buildEventHref } from "@/lib/events/buildEventHref";
import { EVENT_SCHEDULE_GRAPHQL, getEventDateInfo } from "@/lib/events/eventSchedule";
import { wpFetch } from "@/lib/wp";
import { normalizePublicPath } from "./pathUtils";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

type PageInfo = {
  hasNextPage?: boolean;
  endCursor?: string | null;
};

type PaginatedConnection<T> = {
  pageInfo?: PageInfo;
  nodes?: T[];
};

async function fetchPaginatedNodes<T>(
  query: string,
  connectionField: string,
  mapNode: (node: T) => string | null
): Promise<string[]> {
  const paths: string[] = [];
  let after: string | null = null;
  let page = 0;

  while (page < MAX_PAGES) {
    page += 1;
    const variables = { first: PAGE_SIZE, after };
    const data: Record<string, PaginatedConnection<T>> = await wpFetch(query, variables);
    const connection: PaginatedConnection<T> | undefined = data[connectionField];
    for (const node of connection?.nodes ?? []) {
      const path = mapNode(node);
      if (path) paths.push(path);
    }

    if (!connection?.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor ?? null;
    if (!after) break;
  }

  return paths;
}

const CENTERS_QUERY = `
  query SitemapCenters($first: Int!) {
    centers(first: $first) {
      nodes {
        slug
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
        eventFields {
          ${EVENT_SCHEDULE_GRAPHQL}
        }
      }
    }
  }
`;

type SlugNode = { slug?: string | null };

type EventNode = {
  slug?: string | null;
  eventFields?: { eventSchedule?: unknown } | null;
};

export async function fetchWpSitemapPaths(): Promise<string[]> {
  const [
    amenityLinks,
    centersData,
    programPaths,
    newsPaths,
    postPaths,
    eventPaths,
  ] = await Promise.all([
    fetchAllAmenityLinks(),
    wpFetch<{ centers?: { nodes?: SlugNode[] } }>(CENTERS_QUERY, { first: PAGE_SIZE }),
    fetchPaginatedNodes<SlugNode>(PROGRAMS_QUERY, "programs", (node) =>
      node.slug ? normalizePublicPath(`/programs/${node.slug}`) : null
    ),
    fetchPaginatedNodes<SlugNode>(NEWS_QUERY, "allNews", (node) =>
      node.slug ? normalizePublicPath(`/news/${node.slug}`) : null
    ),
    fetchPaginatedNodes<SlugNode>(POSTS_QUERY, "posts", (node) =>
      node.slug ? normalizePublicPath(`/blog/${node.slug}`) : null
    ),
    fetchPaginatedNodes<EventNode>(EVENTS_QUERY, "events", (node) => {
      if (!node.slug) return null;
      const startDate = getEventDateInfo(node.eventFields?.eventSchedule).start ?? "";
      return normalizePublicPath(buildEventHref(node.slug, startDate));
    }),
  ]);

  const amenityPaths = amenityLinks
    .map((amenity) => normalizePublicPath(`/amenities/${amenity.slug}`))
    .filter((path): path is string => Boolean(path));

  const centerPaths = (centersData?.centers?.nodes ?? [])
    .map((node) => (node.slug ? normalizePublicPath(`/centers/${node.slug}`) : null))
    .filter((path): path is string => Boolean(path));

  return [
    ...amenityPaths,
    ...centerPaths,
    ...programPaths,
    ...newsPaths,
    ...postPaths,
    ...eventPaths,
  ];
}
