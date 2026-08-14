// src/app/events/page.tsx
import { Suspense } from "react";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchPageWithHeroFields,
  pageUriCandidatesForSlug,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";
import { EVENT_SCHEDULE_GRAPHQL } from "@/lib/events/eventSchedule";
import ExploreEventsClient from "./exploreEventsClient";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";
import type {
  EventsDirectoryHeaderData,
} from "@/components/events/eventsDirectoryHeader";
import type { DirectoryHeaderData } from "@/components/programs/directoryHeaderShared";

const PAGE_SIZE = 24;

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

const EVENTS_LIST_QUERY = `
  query EventsList($first: Int!, $after: String) {
    events(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        slug
        title
        featuredImage {
          node { ${WP_MEDIA_IMAGE_FIELDS} }
        }
        eventFields {
          summary
          ${EVENT_SCHEDULE_GRAPHQL}
          center {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
          audience {
            nodes {
              name
              slug
            }
          }
          eventType
        }
      }
    }
  }
`;

type EventsListData = {
  events?: {
    pageInfo?: { hasNextPage: boolean; endCursor: string | null };
    nodes?: any[];
  } | null;
};

function hasDirectoryHeaderContent(
  header: DirectoryHeaderData | null | undefined,
) {
  return Boolean(
    header &&
      ((header.header ?? "").trim() ||
        (header.body ?? "").trim() ||
        (header.redirectLabel ?? "").trim() ||
        (header.redirectUrl ?? "").trim()),
  );
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
        { suppressGraphQLErrorLogging: true },
      );
      const header = data?.page ? selectHeader(data.page) : null;
      if (hasDirectoryHeaderContent(header)) return header;
    } catch {
      // Try the next known WordPress URI for this page.
    }
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
    body: header.body ?? null,
    redirectLabel: header[labelKey] ?? null,
    redirectUrl: header[urlKey] ?? null,
  };
}

export default async function ExploreEventsPage() {
  const [
    heroPage,
    eventsData,
    bonspielsHeader,
    tripsHeader,
    tournamentsHeader,
    socialsHeader,
    racesHeader,
    foodDistributionsHeader,
  ] = await Promise.all([
    fetchPageWithHeroFields("events"),
    wpFetch<EventsListData>(EVENTS_LIST_QUERY, { first: PAGE_SIZE, after: null }),
    fetchDirectoryHeaderFromUris(
      BONSPIELS_DIRECTORY_HEADER_QUERY,
      pageUriCandidatesForSlug("tournaments"),
      (page) => page.bonspielsDirectoryPageFields,
    ),
    fetchDirectoryHeaderFromUris(
      TRIPS_DIRECTORY_HEADER_QUERY,
      pageUriCandidatesForSlug("trips"),
      (page) => page.tripsDirectoryPageFields,
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
      (page) => page.socialsDirectoryPageFields,
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
    fetchDirectoryHeaderFromUris(
      FOOD_DISTRIBUTIONS_DIRECTORY_HEADER_QUERY,
      pageUriCandidatesForSlug("food-distributions"),
      (page) => page.foodDistributionsDirectoryPageFields,
    ),
  ]);

  const events = eventsData?.events?.nodes ?? [];
  const pageInfo = eventsData?.events?.pageInfo ?? { hasNextPage: false, endCursor: null };
  const hero = resolvePhotoWaveHeaderProps(heroPage, "Events");
  const directoryHeaders: EventsDirectoryHeaderData = {
    bonspiels: bonspielsHeader,
    trips: tripsHeader,
    tournaments: tournamentsHeader,
    socials: socialsHeader,
    races: racesHeader,
    "food-distributions": foodDistributionsHeader,
  };

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}/>
      <Suspense fallback={<EventsLoadingSkeleton />}>
        <ExploreEventsClient
          initialEvents={events}
          initialPageInfo={pageInfo}
          pageSize={PAGE_SIZE}
          directoryHeaders={directoryHeaders}
        />
      </Suspense>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/events");
}

function EventsLoadingSkeleton() {
  return (
    <main>
      <header className="space-y-2">
        <div className="h-10 w-80 bg-neutral-200 rounded animate-pulse" />
        <div className="h-5 w-96 bg-neutral-100 rounded animate-pulse" />
      </header>
      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm h-fit">
          <div className="h-10 bg-neutral-100 rounded animate-pulse" />
          <div className="h-8 bg-neutral-100 rounded animate-pulse" />
          <div className="h-8 bg-neutral-100 rounded animate-pulse" />
          <div className="h-8 bg-neutral-100 rounded animate-pulse" />
        </aside>
        <section className="space-y-4">
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-md h-64 animate-pulse">
                <div className="h-36 bg-neutral-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
