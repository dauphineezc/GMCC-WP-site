import type { EventsDirectoryHeaderData } from "@/components/events/eventsDirectoryHeader";
import type { DirectoryHeaderData } from "@/components/programs/directoryHeaderShared";
import { asWysiwyg } from "@/lib/acf";
import { pageUriCandidatesForSlug } from "@/lib/pageHeroFields";
import { REVALIDATE_EVENTS_SECONDS, WP_CACHE_TAGS } from "@/lib/revalidate";
import { wpFetch } from "@/lib/wp";

const SIMPLE_DIRECTORY_HEADER_FIELDS = `
  header
  body
`;

const BONSPIELS_DIRECTORY_HEADER_QUERY = `
  query BonspielsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      bonspielsDirectoryPageFields {
        ${SIMPLE_DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const TRIPS_DIRECTORY_HEADER_QUERY = `
  query TripsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      tripsDirectoryPageFields {
        ${SIMPLE_DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const SOCIALS_DIRECTORY_HEADER_QUERY = `
  query SocialsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      socialsDirectoryPageFields {
        ${SIMPLE_DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const FOOD_DISTRIBUTIONS_DIRECTORY_HEADER_QUERY = `
  query FoodDistributionsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      foodDistributionsDirectoryPageFields {
        ${SIMPLE_DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const FOOD_DISTRIBUTIONS_BY_NAME_QUERY = `
  query FoodDistributionsDirectoryHeaderByName {
    pages(where: { name: "food-distributions" }, first: 1) {
      nodes {
        foodDistributionsDirectoryPageFields {
          ${SIMPLE_DIRECTORY_HEADER_FIELDS}
        }
      }
    }
  }
`;

const TOURNAMENTS_DIRECTORY_HEADER_QUERY = `
  query TournamentsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      tournamentsPageFields {
        eventDirectoryPageHeader {
          ${SIMPLE_DIRECTORY_HEADER_FIELDS}
          tournamentsPageLinkLabel
          tournamentsPageLink
        }
      }
    }
  }
`;

const RACES_DIRECTORY_HEADER_QUERY = `
  query RacesDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      racesPageFields {
        eventDirectoryPageHeader {
          ${SIMPLE_DIRECTORY_HEADER_FIELDS}
          racesPageLinkLabel
          racesPageLink
        }
      }
    }
  }
`;

function hasDirectoryHeaderContent(
  header: DirectoryHeaderData | null | undefined,
) {
  return Boolean(
    header &&
      ((header.header ?? "").toString().trim() ||
        asWysiwyg(header.body) ||
        (header.redirectLabel ?? "").toString().trim() ||
        (header.redirectUrl ?? "").toString().trim()),
  );
}

function normalizeSimpleHeader(
  header: Record<string, any> | null | undefined,
): DirectoryHeaderData | undefined {
  if (!header) return undefined;
  return {
    header: header.header ?? null,
    body: asWysiwyg(header.body) || null,
  };
}

async function fetchDirectoryHeaderFromUris(
  query: string,
  uriCandidates: string[],
  selectHeader: (page: Record<string, any>) => DirectoryHeaderData | null | undefined,
) {
  for (const uri of uriCandidates) {
    try {
      const data = await wpFetch<{ page?: Record<string, any> | null }>(
        query,
        { uri },
        {
          suppressGraphQLErrorLogging: true,
          revalidate: REVALIDATE_EVENTS_SECONDS,
          tags: [WP_CACHE_TAGS.events, WP_CACHE_TAGS.pages],
        },
      );
      const header = data?.page ? selectHeader(data.page) : null;
      if (hasDirectoryHeaderContent(header)) return header;
    } catch {
      // Try the next known WordPress URI for this page.
    }
  }
  return undefined;
}

async function fetchDirectoryHeaderByPageName(
  query: string,
  selectHeader: (node: Record<string, any>) => DirectoryHeaderData | null | undefined,
) {
  try {
    const data = await wpFetch<{
      pages?: { nodes?: Array<Record<string, any>> | null } | null;
    }>(
      query,
      undefined,
      {
        suppressGraphQLErrorLogging: true,
        revalidate: REVALIDATE_EVENTS_SECONDS,
        tags: [WP_CACHE_TAGS.events, WP_CACHE_TAGS.pages],
      },
    );
    const node = data?.pages?.nodes?.[0];
    const header = node ? selectHeader(node) : null;
    if (hasDirectoryHeaderContent(header)) return header;
  } catch {
    // Fall through to URI candidates.
  }
  return undefined;
}

function mapLinkedHeader(
  header: Record<string, any> | null | undefined,
  labelKey: string,
  urlKey: string,
): DirectoryHeaderData | undefined {
  if (!header) return undefined;
  return {
    header: header.header ?? null,
    body: asWysiwyg(header.body) || null,
    redirectLabel: header[labelKey] ?? null,
    redirectUrl: header[urlKey] ?? null,
  };
}

/** Load all /events specialty directory headers. */
export async function fetchEventsDirectoryHeaders(): Promise<EventsDirectoryHeaderData> {
  const [
    bonspielsHeader,
    tripsHeader,
    tournamentsHeader,
    socialsHeader,
    racesHeader,
    foodDistributionsHeader,
  ] = await Promise.all([
    fetchDirectoryHeaderFromUris(
      BONSPIELS_DIRECTORY_HEADER_QUERY,
      // Bonspiels ACF group is registered on the Tournaments WP page.
      pageUriCandidatesForSlug("tournaments"),
      (page) => normalizeSimpleHeader(page.bonspielsDirectoryPageFields),
    ),
    fetchDirectoryHeaderFromUris(
      TRIPS_DIRECTORY_HEADER_QUERY,
      pageUriCandidatesForSlug("trips"),
      (page) => normalizeSimpleHeader(page.tripsDirectoryPageFields),
    ),
    fetchDirectoryHeaderFromUris(
      TOURNAMENTS_DIRECTORY_HEADER_QUERY,
      pageUriCandidatesForSlug("tournaments"),
      (page) =>
        mapLinkedHeader(
          page.tournamentsPageFields?.eventDirectoryPageHeader,
          "tournamentsPageLinkLabel",
          "tournamentsPageLink",
        ),
    ),
    fetchDirectoryHeaderFromUris(
      SOCIALS_DIRECTORY_HEADER_QUERY,
      pageUriCandidatesForSlug("socials"),
      (page) => normalizeSimpleHeader(page.socialsDirectoryPageFields),
    ),
    fetchDirectoryHeaderFromUris(
      RACES_DIRECTORY_HEADER_QUERY,
      pageUriCandidatesForSlug("races"),
      (page) =>
        mapLinkedHeader(
          page.racesPageFields?.eventDirectoryPageHeader,
          "racesPageLinkLabel",
          "racesPageLink",
        ),
    ),
    (async () => {
      // Prefer post_name lookup — avoids URI/CPT collisions and stale misses.
      const byName = await fetchDirectoryHeaderByPageName(
        FOOD_DISTRIBUTIONS_BY_NAME_QUERY,
        (node) => normalizeSimpleHeader(node.foodDistributionsDirectoryPageFields),
      );
      if (byName) return byName;
      return fetchDirectoryHeaderFromUris(
        FOOD_DISTRIBUTIONS_DIRECTORY_HEADER_QUERY,
        pageUriCandidatesForSlug("food-distributions"),
        (page) => normalizeSimpleHeader(page.foodDistributionsDirectoryPageFields),
      );
    })(),
  ]);

  return {
    bonspiels: bonspielsHeader,
    trips: tripsHeader,
    tournaments: tournamentsHeader,
    socials: socialsHeader,
    races: racesHeader,
    "food-distributions": foodDistributionsHeader,
  };
}
