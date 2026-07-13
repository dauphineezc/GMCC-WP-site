// src/app/programs/page.tsx
import { Suspense } from "react";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import type { ProgramsPageACF } from "@/components/programs/programsDirectoryHeader";
import type { DirectoryHeaderData } from "@/components/programs/directoryHeaderSection";
import {
  DROP_IN_CARE_FIELDS_GRAPHQL,
  hasDropInCareContent,
  normalizeDropInCareFields,
  type DropInCareFields,
} from "@/lib/dropInCareFields";
import {
  fetchPageWithHeroFields,
  pageUriCandidatesForSlug,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import type { GroupFitnessDirectoryHeaderData } from "@/components/programs/directory-sections/groupFitnessDirectoryHeader";
import { wpFetch } from "@/lib/wp";
import {
  PROGRAMS_LIST_QUERY,
  PROGRAMS_PAGE_SIZE,
  PROGRAMS_ALL_AT_ONCE,
  LAZY_LOAD_PROGRAMS,
} from "@/lib/programsListQuery";
import ExploreProgramsClient from "./exploreProgramsClient";

const DIRECTORY_HEADER_FIELDS = `
  header
  body
  attachments {
    attachment1 { label file { node { sourceUrl mediaItemUrl title } } }
    attachment2 { label file { node { sourceUrl mediaItemUrl title } } }
    attachment3 { label file { node { sourceUrl mediaItemUrl title } } }
    attachment4 { label file { node { sourceUrl mediaItemUrl title } } }
  }
`;

const AQUATICS_DIRECTORY_HEADER_QUERY = `
  query AquaticsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      aquaticsDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const CAMPS_DIRECTORY_HEADER_QUERY = `
  query CampsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      campsDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const CHILDCARE_DIRECTORY_HEADER_QUERY = `
  query ChildcareDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      childcareDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const GROUP_FITNESS_DIRECTORY_HEADER_QUERY = `
  query GroupFitnessDirectoryHeader($uri: ID!, $dropInCareUri: ID!) {
    page(id: $uri, idType: URI) {
      groupFitnessDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
      }
    }
    dropInCarePage: page(id: $dropInCareUri, idType: URI) {
      earlyChildhoodPageFields {
        ${DROP_IN_CARE_FIELDS_GRAPHQL}
      }
    }
  }
`;

const GROUP_FITNESS_URI_CANDIDATES = [
  "/group-fitness-classes",
  "/group-fitness-classes/",
  "group-fitness-classes",
  "/group-fitness",
  "/group-fitness/",
  "group-fitness",
];

const MIDDLE_SCHOOL_SPORTS_DIRECTORY_HEADER_QUERY = `
  query MiddleSchoolSportsDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      middleSchoolSportsDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
        sponsors {
          nodes {
            ... on Sponsor {
              name
              sponsorFields {
                tier
                link
                logo { node { sourceUrl altText } }
              }
            }
          }
        }
      }
    }
  }
`;


const PERSONAL_TRAINING_DIRECTORY_HEADER_QUERY = `
  query PersonalTrainingDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      personalTrainingDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const TENNIS_DIRECTORY_HEADER_QUERY = `
  query TennisDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      tennisLessonsDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const SILVERSNEAKERS_DIRECTORY_HEADER_QUERY = `
  query SilversneakersDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      silversneakersDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
        redirectLabel
        redirectUrl
      }
    }
  }
`;

const RENEW_ACTIVE_DIRECTORY_HEADER_QUERY = `
  query RenewActiveDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      renewActiveDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
        redirectLabel
        redirectUrl
      }
    }
  }
`;


function normalizeDirectoryHeaderData(
  field?: any,
): DirectoryHeaderData | undefined {
  if (!field) return undefined;
  const normalizeAttachment = (att: any) => {
    if (!att) return undefined;
    return {
      label: att.label ?? null,
      file: att.file?.node ?? att.file ?? null,
    };
  };

  const sponsorNodes = field?.sponsors?.nodes ?? [];
  const sponsors = sponsorNodes.flatMap((node: any) => {
    const logoUrl = node?.sponsorFields?.logo?.node?.sourceUrl?.trim();
    if (!logoUrl) return [];
    return [{
      name: node.name ?? null,
      logoUrl,
      logoAlt: node?.sponsorFields?.logo?.node?.altText ?? null,
      link: node?.sponsorFields?.link ?? null,
      tier: node?.sponsorFields?.tier ?? null,
    }];
  });

  return {
    header: field.header ?? null,
    body: field.body ?? null,
    attachments: field.attachments
      ? {
          attachment1: normalizeAttachment(field.attachments.attachment1),
          attachment2: normalizeAttachment(field.attachments.attachment2),
          attachment3: normalizeAttachment(field.attachments.attachment3),
          attachment4: normalizeAttachment(field.attachments.attachment4),
        }
      : null,
    sponsors: sponsors.length ? sponsors : null,
    redirectLabel: field.redirectLabel ?? null,
    redirectUrl: field.redirectUrl ?? null,
  };
}

function hasDirectoryHeaderContent(field?: any) {
  if (!field) return false;
  const header = (field?.header ?? "").trim();
  const body = (field?.body ?? "").trim();

  // Check attachments — treat as present only when label or file url is non-empty
  const atts = field?.attachments;
  const hasAttachment = [atts?.attachment1, atts?.attachment2, atts?.attachment3, atts?.attachment4]
    .some((a: any) => (a?.label ?? "").trim() || (a?.file?.node?.sourceUrl ?? a?.file?.sourceUrl ?? a?.file?.mediaItemUrl ?? "").trim());

    
  const hasSponsors = (field?.sponsors?.nodes ?? field?.sponsors ?? []).length > 0;
  const hasRedirect = (field?.redirectLabel ?? field?.redirectUrl ?? "").trim();

  return Boolean(header || body || hasAttachment || hasSponsors || hasRedirect);
}

async function fetchFieldFromUris<TPage extends Record<string, any>>(
  query: string,
  uriCandidates: string[],
  fieldName: keyof TPage
) {
  for (const uri of uriCandidates) {
    try {
      const data = await wpFetch<{ page?: TPage | null }>(
        query,
        { uri },
        { suppressGraphQLErrorLogging: true }
      );
      const field = (data?.page?.[fieldName] as DirectoryHeaderData | null | undefined) ?? null;
      if (hasDirectoryHeaderContent(field)) return field;
    } catch {
      // try next candidate
    }
  }
  return undefined;
}


type GroupFitnessDirectoryQueryPage = {
  groupFitnessDirectoryPageFields?: DirectoryHeaderData | null;
};

type GroupFitnessDirectoryQueryData = {
  page?: GroupFitnessDirectoryQueryPage | null;
  dropInCarePage?: { earlyChildhoodPageFields?: Record<string, unknown> | null } | null;
};

async function fetchGroupFitnessDirectoryWithDropInCare(): Promise<
  | {
      directory: DirectoryHeaderData | null | undefined;
      dropInCare: Record<string, unknown> | null | undefined;
    }
  | undefined
> {
  const dropInCareUris = pageUriCandidatesForSlug("early-childhood");

  for (const uri of GROUP_FITNESS_URI_CANDIDATES) {
    for (const dropInCareUri of dropInCareUris) {
      try {
        const data = await wpFetch<GroupFitnessDirectoryQueryData>(
          GROUP_FITNESS_DIRECTORY_HEADER_QUERY,
          { uri, dropInCareUri },
          { suppressGraphQLErrorLogging: true }
        );
        const directory = data?.page?.groupFitnessDirectoryPageFields ?? null;
        const dropInCare = data?.dropInCarePage?.earlyChildhoodPageFields ?? null;
        if (hasDirectoryHeaderContent(directory) || hasDropInCareContent(dropInCare)) {
          return { directory, dropInCare };
        }
      } catch {
        // try next candidate
      }
    }
  }
  return undefined;
}

function normalizeGroupFitnessDirectoryData(
  directory?: DirectoryHeaderData | null,
  dropInCareRaw?: Record<string, unknown> | null
): GroupFitnessDirectoryHeaderData | undefined {
  const base = normalizeDirectoryHeaderData(directory);
  const dropIn: DropInCareFields = normalizeDropInCareFields(dropInCareRaw ?? undefined);
  const hasDropIn =
    Boolean(dropIn.dropInCareHeader || dropIn.dropInCareDescription) ||
    hasDropInCareContent(dropInCareRaw ?? undefined);

  if (!base && !hasDropIn) return undefined;
  return { ...(base ?? {}), ...dropIn };
}


export default async function ExploreProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  const [heroPage, programsData] = await Promise.all([
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
  ]);

  const hero = resolvePhotoWaveHeaderProps(heroPage, "Explore our programs");

  const [
    aquaticsRaw,
    campsRaw,
    childcareRaw,
    groupFitnessRaw,
    middleSchoolSportsRaw,
    personalTrainingRaw,
    tennisLessonsRaw,
    silversneakersRaw,
    renewActiveRaw,
  ] = await Promise.all([
    fetchFieldFromUris<{ aquaticsDirectoryPageFields?: DirectoryHeaderData | null }>(
      AQUATICS_DIRECTORY_HEADER_QUERY,
      ["/aquatics", "/aquatics/", "aquatics"],
      "aquaticsDirectoryPageFields"
    ),
    fetchFieldFromUris<{ campsDirectoryPageFields?: DirectoryHeaderData | null }>(
      CAMPS_DIRECTORY_HEADER_QUERY,
      ["/camps", "/camps/", "camps"],
      "campsDirectoryPageFields"
    ),
    fetchFieldFromUris<{ childcareDirectoryPageFields?: DirectoryHeaderData | null }>(
      CHILDCARE_DIRECTORY_HEADER_QUERY,
      ["/childcare", "/childcare/", "childcare"],
      "childcareDirectoryPageFields"
    ),
    fetchGroupFitnessDirectoryWithDropInCare(),
    fetchFieldFromUris<
      { middleSchoolSportsDirectoryPageFields?: DirectoryHeaderData | null }
    >(
      MIDDLE_SCHOOL_SPORTS_DIRECTORY_HEADER_QUERY,
      [
        "/youth-sports-leagues",
        "/youth-sports-leagues/",
        "/youth-sports-league",
        "/youth-sports-league/",
        "/middle-school-sports",
        "/middle-school-sports/",
      ],
      "middleSchoolSportsDirectoryPageFields"
    ),
    fetchFieldFromUris<
      { personalTrainingDirectoryPageFields?: DirectoryHeaderData | null }
    >(
      PERSONAL_TRAINING_DIRECTORY_HEADER_QUERY,
      ["/personal-training", "/personal-training/", "personal-training"],
      "personalTrainingDirectoryPageFields"
    ),
    fetchFieldFromUris<
      { tennisLessonsDirectoryPageFields?: DirectoryHeaderData | null }
    >(
      TENNIS_DIRECTORY_HEADER_QUERY,
      ["/tennis-lessons", "/tennis-lessons/", "tennis-lessons"],
      "tennisLessonsDirectoryPageFields"
    ),
    fetchFieldFromUris<{ silversneakersDirectoryPageFields?: DirectoryHeaderData | null }>(
      SILVERSNEAKERS_DIRECTORY_HEADER_QUERY,
      ["/silversneakers/", "/silversneakers", "silversneakers", "/silver-sneakers/", "/silver-sneakers"],
      "silversneakersDirectoryPageFields"
    ),
    fetchFieldFromUris<{ renewActiveDirectoryPageFields?: DirectoryHeaderData | null }>(
      RENEW_ACTIVE_DIRECTORY_HEADER_QUERY,
      ["/renew-active-one-pass/", "/renew-active-one-pass", "renew-active-one-pass", "/renew-active/", "/renew-active"],
      "renewActiveDirectoryPageFields"
    ),
  ]);

  const directoryHeaderData: ProgramsPageACF = {
    aquaticsDirectoryPageFields: normalizeDirectoryHeaderData(aquaticsRaw),
    campsDirectoryPageFields: normalizeDirectoryHeaderData(campsRaw),
    childcareDirectoryPageFields: normalizeDirectoryHeaderData(childcareRaw),
    groupFitnessDirectoryPageFields: normalizeGroupFitnessDirectoryData(
      groupFitnessRaw?.directory,
      groupFitnessRaw?.dropInCare
    ),
    middleSchoolSportsDirectoryPageFields: normalizeDirectoryHeaderData(middleSchoolSportsRaw),
    personalTrainingDirectoryPageFields: normalizeDirectoryHeaderData(personalTrainingRaw),
    tennisLessonsDirectoryPageFields: normalizeDirectoryHeaderData(tennisLessonsRaw),
    silversneakersDirectoryPageFields: normalizeDirectoryHeaderData(silversneakersRaw),
    renewActiveDirectoryPageFields: normalizeDirectoryHeaderData(renewActiveRaw),
  };

  const programs = programsData?.programs?.nodes ?? [];
  const pageInfo = programsData?.programs?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} />
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
