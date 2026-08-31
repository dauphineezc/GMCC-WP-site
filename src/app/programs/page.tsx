// src/app/programs/page.tsx
import { Suspense } from "react";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { getProgramsDirectoryHeaderVariant } from "@/components/programs/programsDirectoryHeader";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";
import {
  PROGRAMS_LIST_QUERY,
  PROGRAMS_PAGE_SIZE,
  PROGRAMS_ALL_AT_ONCE,
  LAZY_LOAD_PROGRAMS,
} from "@/lib/programsListQuery";
import { fetchProgramsDirectoryHeaders } from "@/lib/programs/fetchDirectoryHeaders";
import ExploreProgramsClient from "./exploreProgramsClient";

export default async function ExploreProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  // Skip the heavy directory-headers GraphQL on plain /programs — only fetch
  // when the URL already implies a specialty header (nav filter links).
  const needsDirectoryHeaders =
    getProgramsDirectoryHeaderVariant(resolvedSearchParams) != null;

  const [heroPage, programsData, directoryHeaderData] = await Promise.all([
    fetchPageWithHeroFields("programs"),
    wpFetch<{
      programs?: {
        pageInfo?: { hasNextPage: boolean; endCursor: string | null };
        nodes?: any[];
      } | null;
    }>(PROGRAMS_LIST_QUERY, {
      first: LAZY_LOAD_PROGRAMS ? PROGRAMS_PAGE_SIZE : PROGRAMS_ALL_AT_ONCE,
      after: null,
    }),
    needsDirectoryHeaders
      ? fetchProgramsDirectoryHeaders()
      : Promise.resolve({}),
  ]);

  const hero = resolvePhotoWaveHeaderProps(heroPage, "Explore our programs");

  const programs = programsData?.programs?.nodes ?? [];
  const pageInfo = programsData?.programs?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl}
        imagePosition={hero.imagePosition}
      />
      <Suspense fallback={<ProgramsLoadingSkeleton />}>
        <ExploreProgramsClient
          initialPrograms={programs}
          initialPageInfo={pageInfo}
          initialSearchParams={resolvedSearchParams}
          pageSize={PROGRAMS_PAGE_SIZE}
          directoryHeaderData={directoryHeaderData}
        />
      </Suspense>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/programs");
}

function ProgramsLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="h-10 w-64 animate-pulse rounded bg-neutral-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-neutral-200" />
        ))}
      </div>
    </div>
  );
}
