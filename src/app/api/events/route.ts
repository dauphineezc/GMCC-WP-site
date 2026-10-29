// src/app/api/events/route.ts
import { NextResponse } from "next/server";
import { wpFetch } from "@/lib/wp";
import { EVENT_SCHEDULE_GRAPHQL } from "@/lib/events/eventSchedule";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";
import { REVALIDATE_EVENTS_SECONDS, WP_CACHE_TAGS } from "@/lib/revalidate";

// Keep in sync with EVENTS_LIST_QUERY in src/app/events/page.tsx —
// infinite scroll maps these nodes with the same shape as the SSR page.
const QUERY = `
  query ExploreEvents($first: Int!, $after: String) {
    events(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
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
              description
            }
          }
          eventType
        }
      }
    }
  }
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const first = Number(searchParams.get("first") ?? "24");
  const after = searchParams.get("after");

  const data = await wpFetch<any>(
    QUERY,
    { first, after },
    { revalidate: REVALIDATE_EVENTS_SECONDS, tags: [WP_CACHE_TAGS.events] },
  );

  return NextResponse.json({
    events: data?.events?.nodes ?? [],
    pageInfo: data?.events?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}
