// src/app/programs/page.tsx
import { Suspense } from "react";
import PhotoWaveHeader from "@/components/photoWaveHeader";
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
import { WP_CACHE_TAGS } from "@/lib/revalidate";
import ExploreProgramsClient from "./exploreProgramsClient";
import type { ProgramsPageACF } from "@/components/programs/programsDirectoryHeader";

/** Shared ISR shell — filters/headerVariant are client-only (useSearchParams). */
export const revalidate = 900;

/** Stable empty prop so soft navigations don't remount-wipe client-fetched headers. */
const EMPTY_DIRECTORY_HEADER_DATA: ProgramsPageACF = {};

export default async function ExploreProgramsPage() {
  // Intentionally ignore URL searchParams on the server so this route can be
  // statically cached. Specialty directory headers load on demand via
  // /api/programs/directory-headers when the client detects a variant.
  const [heroPage, programsData] = await Promise.all([
    fetchPageWithHeroFields("programs"),
    wpFetch<{
      programs?: {
        pageInfo?: { hasNextPage: boolean; endCursor: string | null };
        nodes?: any[];
      } | null;
    }>(
      PROGRAMS_LIST_QUERY,
      {
        first: LAZY_LOAD_PROGRAMS ? PROGRAMS_PAGE_SIZE : PROGRAMS_ALL_AT_ONCE,
        after: null,
      },
      { tags: [WP_CACHE_TAGS.programs] },
    ),
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
          pageSize={PROGRAMS_PAGE_SIZE}
          directoryHeaderData={EMPTY_DIRECTORY_HEADER_DATA}
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
