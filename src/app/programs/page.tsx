// src/app/programs/page.tsx
import { Suspense } from "react";
import { wpFetch } from "@/lib/wp";
import ExploreProgramsClient from "./exploreProgramsClient";

const PAGE_SIZE = 24;

const EXPLORE_PROGRAMS_QUERY = `
  query ExplorePrograms($first: Int!, $after: String) {
    programs(first: $first, after: $after, where: { stati: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        programFields {
          summary
          offeringType
          skillLevel
          priceFrom
          audience { nodes { name slug } }
          campType { nodes { name slug } }
          center {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
          programArea { nodes { name slug } }
        }
      }
    }
  }
`;

export default async function ExploreProgramsPage() {
  const data = await wpFetch<any>(EXPLORE_PROGRAMS_QUERY, {
    first: PAGE_SIZE,
    after: null,
  });   

  const programs = data?.programs?.nodes ?? [];
  const pageInfo = data?.programs?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return (
    <Suspense fallback={<ProgramsLoadingSkeleton />}>
      <ExploreProgramsClient
        initialPrograms={programs}
        initialPageInfo={pageInfo}
        pageSize={PAGE_SIZE}
      />
    </Suspense>
  );
}

function ProgramsLoadingSkeleton() {
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
