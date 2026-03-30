// src/app/programs/page.tsx
import { Suspense } from "react";
import { wpFetch } from "@/lib/wp";
import ExploreProgramsClient from "./exploreProgramsClient";
import type { ProgramsPageACF } from "@/components/programs/programsDirectoryHeader";
import type {
  DirectoryHeaderData,
  DirectoryTrainer,
} from "@/components/programs/directoryHeaderSection";

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
          mediaGallery {
            image1 {
              node {
                sourceUrl
                altText
              }
            }
          }
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

type ProgramDirectoryPageFields = {
  header?: string | null;
  subheader?: string | null;
  heroImage?: {
    sourceUrl?: string | null;
    altText?: string | null;
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
    } | null;
  } | null;
};

const PROGRAMS_DIRECTORY_PAGE_TEXT_QUERY = `
  query ProgramsDirectoryPageText($uri: ID!) {
    page(id: $uri, idType: URI) {
      programDirectoryPageFields {
        header
        subheader
      }
    }
  }
`;

const PROGRAMS_DIRECTORY_PAGE_IMAGE_DIRECT_QUERY = `
  query ProgramsDirectoryPageImageDirect($uri: ID!) {
    page(id: $uri, idType: URI) {
      programDirectoryPageFields {
        heroImage {
          sourceUrl
          altText
        }
      }
    }
  }
`;

const PROGRAMS_DIRECTORY_PAGE_FALLBACK_QUERY = `
  query ProgramsDirectoryPageFallback($first: Int!) {
    pages(first: $first) {
      nodes {
        uri
        programDirectoryPageFields {
          header
          subheader
        }
      }
    }
  }
`;

const PROGRAMS_DIRECTORY_PAGE_IMAGE_NODE_QUERY = `
  query ProgramsDirectoryPageImageNode($uri: ID!) {
    page(id: $uri, idType: URI) {
      programDirectoryPageFields {
        heroImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const PROGRAMS_DIRECTORY_PAGE_FALLBACK_IMAGE_DIRECT_QUERY = `
  query ProgramsDirectoryPageFallbackImageDirect($first: Int!) {
    pages(first: $first) {
      nodes {
        uri
        programDirectoryPageFields {
          heroImage {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const PROGRAMS_DIRECTORY_PAGE_FALLBACK_IMAGE_NODE_QUERY = `
  query ProgramsDirectoryPageFallbackImageNode($first: Int!) {
    pages(first: $first) {
      nodes {
        uri
        programDirectoryPageFields {
          heroImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

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
  query GroupFitnessDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      groupFitnessDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
      }
    }
  }
`;

const PERSONAL_TRAINING_DIRECTORY_HEADER_QUERY = `
  query PersonalTrainingDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      personalTrainingDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
        trainers {
          nodes {
            ... on StaffProfile {
              title
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              staffProfilesFields {
                title
                bio
              }
            }
          }
        }
      }
    }
  }
`;

const TENNIS_DIRECTORY_HEADER_QUERY = `
  query TennisDirectoryHeader($uri: ID!) {
    page(id: $uri, idType: URI) {
      tennisLessonsDirectoryPageFields {
        ${DIRECTORY_HEADER_FIELDS}
        tennisInstructors {
          nodes {
            ... on StaffProfile {
              title
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              staffProfilesFields {
                title
                bio
              }
            }
          }
        }
      }
    }
  }
`;

function normalizeDirectoryHeaderData(
  field?: any,
  trainerConnectionKey: "trainers" | "tennisInstructors" = "trainers"
): DirectoryHeaderData | undefined {
  if (!field) return undefined;
  const normalizeAttachment = (att: any) => {
    if (!att) return undefined;
    return {
      label: att.label ?? null,
      file: att.file?.node ?? att.file ?? null,
    };
  };

  const trainerNodes = field?.[trainerConnectionKey]?.nodes ?? [];
  const trainers: DirectoryTrainer[] =
    trainerNodes.map((trainer: any) => ({
      name: trainer?.title ?? null,
      photo: trainer?.featuredImage?.node
        ? {
            sourceUrl: trainer.featuredImage.node.sourceUrl ?? null,
            altText: trainer.featuredImage.node.altText ?? null,
          }
        : null,
      jobTitle: trainer?.staffProfilesFields?.title ?? null,
      bio: trainer?.staffProfilesFields?.bio ?? null,
    })).filter((t: DirectoryTrainer) => t.name || t.jobTitle || t.photo?.sourceUrl || t.bio) ?? [];

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
    trainers,
  };
}

function hasDirectoryHeaderContent(field?: DirectoryHeaderData | null) {
  const header = (field?.header ?? "").trim();
  const body = (field?.body ?? "").trim();
  const attachments = field?.attachments;
  const hasAttachment =
    !!attachments?.attachment1 ||
    !!attachments?.attachment2 ||
    !!attachments?.attachment3 ||
    !!attachments?.attachment4;
  return Boolean(header || body || hasAttachment || (field?.trainers?.length ?? 0) > 0);
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

async function fetchProgramsDirectoryHeroFromUris(uriCandidates: string[]) {
  for (const uri of uriCandidates) {
    try {
      const data = await wpFetch<{
        page?: { programDirectoryPageFields?: ProgramDirectoryPageFields | null } | null;
      }>(
        PROGRAMS_DIRECTORY_PAGE_TEXT_QUERY,
        { uri },
        { suppressGraphQLErrorLogging: true }
      );

      const textFields = data?.page?.programDirectoryPageFields ?? null;
      const merged: ProgramDirectoryPageFields = {
        header: textFields?.header ?? null,
        subheader: textFields?.subheader ?? null,
        heroImage: null,
      };

      try {
        const imageData = await wpFetch<{
          page?: { programDirectoryPageFields?: ProgramDirectoryPageFields | null } | null;
        }>(
          PROGRAMS_DIRECTORY_PAGE_IMAGE_DIRECT_QUERY,
          { uri },
          { suppressGraphQLErrorLogging: true }
        );
        const image = imageData?.page?.programDirectoryPageFields?.heroImage ?? null;
        if (image?.sourceUrl) {
          merged.heroImage = { sourceUrl: image.sourceUrl, altText: image.altText ?? null };
        }
      } catch {
        // try node-based image shape
        try {
          const imageNodeData = await wpFetch<{
            page?: { programDirectoryPageFields?: ProgramDirectoryPageFields | null } | null;
          }>(
            PROGRAMS_DIRECTORY_PAGE_IMAGE_NODE_QUERY,
            { uri },
            { suppressGraphQLErrorLogging: true }
          );
          const imageNode =
            imageNodeData?.page?.programDirectoryPageFields?.heroImage?.node ?? null;
          if (imageNode?.sourceUrl) {
            merged.heroImage = { node: imageNode };
          }
        } catch {
          // no image shape available for this URI
        }
      }

      if (merged.header?.trim() || merged.subheader?.trim() || merged.heroImage?.sourceUrl || merged.heroImage?.node?.sourceUrl) {
        return merged;
      }
    } catch {
      // try next candidate
    }
  }

  // Fallback in case the WP page URI isn't one of the expected candidates.
  try {
    const textData = await wpFetch<{
      pages?: {
        nodes?: Array<{
          uri?: string | null;
          programDirectoryPageFields?: ProgramDirectoryPageFields | null;
        } | null> | null;
      } | null;
    }>(
      PROGRAMS_DIRECTORY_PAGE_FALLBACK_QUERY,
      { first: 300 },
      { suppressGraphQLErrorLogging: true }
    );

    const candidates =
      textData?.pages?.nodes
        ?.map((n) => ({ uri: n?.uri ?? "", fields: n?.programDirectoryPageFields ?? null }))
        .filter(
          (n) =>
            !!(
              n.fields?.header?.trim() ||
              n.fields?.subheader?.trim()
            )
        ) ?? [];

    if (candidates.length) {
      const picked =
        candidates.find((c) => /program/i.test(c.uri)) ??
        candidates[0];

      const merged: ProgramDirectoryPageFields = {
        header: picked.fields?.header ?? null,
        subheader: picked.fields?.subheader ?? null,
        heroImage: null,
      };

      try {
        const imageData = await wpFetch<{
          pages?: {
            nodes?: Array<{
              uri?: string | null;
              programDirectoryPageFields?: ProgramDirectoryPageFields | null;
            } | null> | null;
          } | null;
        }>(
          PROGRAMS_DIRECTORY_PAGE_FALLBACK_IMAGE_DIRECT_QUERY,
          { first: 300 },
          { suppressGraphQLErrorLogging: true }
        );

        const directMatch =
          imageData?.pages?.nodes?.find((n) => (n?.uri ?? "") === picked.uri)
            ?.programDirectoryPageFields?.heroImage ?? null;
        if (directMatch?.sourceUrl) {
          merged.heroImage = {
            sourceUrl: directMatch.sourceUrl,
            altText: directMatch.altText ?? null,
          };
        }
      } catch {
        // best-effort fallback; text fields are still valid
      }

      if (!merged.heroImage?.sourceUrl && !merged.heroImage?.node?.sourceUrl) {
        try {
          const imageNodeData = await wpFetch<{
            pages?: {
              nodes?: Array<{
                uri?: string | null;
                programDirectoryPageFields?: ProgramDirectoryPageFields | null;
              } | null> | null;
            } | null;
          }>(
            PROGRAMS_DIRECTORY_PAGE_FALLBACK_IMAGE_NODE_QUERY,
            { first: 300 },
            { suppressGraphQLErrorLogging: true }
          );

          const nodeMatch =
            imageNodeData?.pages?.nodes?.find((n) => (n?.uri ?? "") === picked.uri)
              ?.programDirectoryPageFields?.heroImage?.node ?? null;
          if (nodeMatch?.sourceUrl) {
            merged.heroImage = { node: nodeMatch };
          }
        } catch {
          // best-effort fallback; text fields are still valid
        }
      }

      return merged;
    }
  } catch {
    // Fall through to null/default hero.
  }

  return null;
}

export default async function ExploreProgramsPage() {
  const data = await wpFetch<any>(EXPLORE_PROGRAMS_QUERY, {
    first: PAGE_SIZE,
    after: null,
  });
  const [
    programDirectoryPageFields,
    aquaticsRaw,
    campsRaw,
    childcareRaw,
    groupFitnessRaw,
    personalTrainingRaw,
    tennisLessonsRaw,
  ] = await Promise.all([
    fetchProgramsDirectoryHeroFromUris(["/programs", "/programs/", "programs"]),
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
    fetchFieldFromUris<{ groupFitnessDirectoryPageFields?: DirectoryHeaderData | null }>(
      GROUP_FITNESS_DIRECTORY_HEADER_QUERY,
      [
        "/group-fitness-classes",
        "/group-fitness-classes/",
        "group-fitness-classes",
        "/group-fitness",
        "/group-fitness/",
        "group-fitness",
      ],
      "groupFitnessDirectoryPageFields"
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
  ]);

  const directoryHeaderData: ProgramsPageACF = {
    aquaticsDirectoryPageFields: normalizeDirectoryHeaderData(aquaticsRaw),
    campsDirectoryPageFields: normalizeDirectoryHeaderData(campsRaw),
    childcareDirectoryPageFields: normalizeDirectoryHeaderData(childcareRaw),
    groupFitnessDirectoryPageFields: normalizeDirectoryHeaderData(groupFitnessRaw),
    personalTrainingDirectoryPageFields: normalizeDirectoryHeaderData(personalTrainingRaw, "trainers"),
    tennisLessonsDirectoryPageFields: normalizeDirectoryHeaderData(tennisLessonsRaw, "tennisInstructors"),
  };

  const programs = data?.programs?.nodes ?? [];
  const pageInfo = data?.programs?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return (
    <Suspense fallback={<ProgramsLoadingSkeleton />}>
      <ExploreProgramsClient
        initialPrograms={programs}
        initialPageInfo={pageInfo}
        pageSize={PAGE_SIZE}
        programDirectoryPageFields={programDirectoryPageFields}
        directoryHeaderData={directoryHeaderData}
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
