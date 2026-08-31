import type { DirectoryHeaderData } from "@/components/programs/directoryHeaderSection";
import type { DirectoryTrainer } from "@/components/programs/directoryHeaderShared";
import type { GroupFitnessDirectoryHeaderData } from "@/components/programs/directory-sections/groupFitnessDirectoryHeader";
import type { ProgramsPageACF } from "@/components/programs/programsDirectoryHeader";
import {
  DROP_IN_CARE_FIELDS_GRAPHQL,
  hasDropInCareContent,
  normalizeDropInCareFields,
  type DropInCareFields,
} from "@/lib/dropInCareFields";
import { mediaFocalPositionCss, WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";
import { LESSONS_TRAINERS_GQL } from "@/lib/programs/lessonsDirectory";
import { wpFetch } from "@/lib/wp";

/**
 * Stable WordPress page slugs used for /programs directory headers.
 * Keep these in sync with WP Pages → slug (post_name). Alternate candidates
 * are queried in the same POST via GraphQL aliases.
 */
export const PROGRAMS_DIRECTORY_PAGE_SLUGS = {
  aquatics: "aquatics",
  camps: "camps",
  earlyChildhood: "early-childhood",
  groupFitnessPrimary: "group-fitness-classes",
  groupFitnessAlt: "group-fitness",
  middleSchoolPrimary: "youth-sports-leagues",
  middleSchoolAlt1: "youth-sports-league",
  middleSchoolAlt2: "middle-school-sports",
  personalTraining: "personal-training",
  /** Tennis/pickleball private lessons page (WP field group is privateLessons…). */
  privateLessons: "private-lessons",
  silversneakersPrimary: "silversneakers",
  silversneakersAlt: "silver-sneakers",
  renewActivePrimary: "renew-active-one-pass",
  renewActiveAlt: "renew-active",
  community: "community",
  sportsAndRecreation: "sports-and-recreation",
} as const;

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

/**
 * Personal training / private lessons ACF groups use bodyHeader (not header)
 * and the shared trainers relationship — not the generic directory header shape.
 */
const LESSONS_DIRECTORY_HEADER_FIELDS = `
  bodyHeader
  body
  ${LESSONS_TRAINERS_GQL}
`;

/** One GraphQL document: all directory pages via `pages(where: { name })` aliases. */
const PROGRAMS_DIRECTORY_HEADERS_QUERY = /* GraphQL */ `
  query ProgramsDirectoryHeaders {
    aquatics: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.aquatics}" }, first: 1) {
      nodes { aquaticsDirectoryPageFields { ${DIRECTORY_HEADER_FIELDS} } }
    }
    camps: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.camps}" }, first: 1) {
      nodes {
        campsDirectoryPageFields {
          programDirectoryPageHeader {
            ${DIRECTORY_HEADER_FIELDS}
            campsPageLinkLabel
            campsPageLink
          }
        }
      }
    }
    earlyChildhood: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.earlyChildhood}" }, first: 1) {
      nodes {
        earlyChildhoodPageFields {
          programDirectoryPageHeader {
            ${DIRECTORY_HEADER_FIELDS}
            ecePageLinkLabel
            ecePageLink
          }
          ${DROP_IN_CARE_FIELDS_GRAPHQL}
        }
      }
    }
    groupFitnessPrimary: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.groupFitnessPrimary}" }, first: 1) {
      nodes { groupFitnessDirectoryPageFields { ${DIRECTORY_HEADER_FIELDS} } }
    }
    groupFitnessAlt: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.groupFitnessAlt}" }, first: 1) {
      nodes { groupFitnessDirectoryPageFields { ${DIRECTORY_HEADER_FIELDS} } }
    }
    middleSchoolPrimary: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.middleSchoolPrimary}" }, first: 1) {
      nodes {
        middleSchoolSportsDirectoryPageFields {
          ${DIRECTORY_HEADER_FIELDS}
          sponsors {
            nodes {
              ... on Sponsor {
                name
                sponsorFields {
                  tier
                  link
                  logo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
                }
              }
            }
          }
        }
      }
    }
    middleSchoolAlt1: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.middleSchoolAlt1}" }, first: 1) {
      nodes {
        middleSchoolSportsDirectoryPageFields {
          ${DIRECTORY_HEADER_FIELDS}
          sponsors {
            nodes {
              ... on Sponsor {
                name
                sponsorFields {
                  tier
                  link
                  logo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
                }
              }
            }
          }
        }
      }
    }
    middleSchoolAlt2: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.middleSchoolAlt2}" }, first: 1) {
      nodes {
        middleSchoolSportsDirectoryPageFields {
          ${DIRECTORY_HEADER_FIELDS}
          sponsors {
            nodes {
              ... on Sponsor {
                name
                sponsorFields {
                  tier
                  link
                  logo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
                }
              }
            }
          }
        }
      }
    }
    personalTraining: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.personalTraining}" }, first: 1) {
      nodes {
        personalTrainingDirectoryPageFields {
          ${LESSONS_DIRECTORY_HEADER_FIELDS}
        }
      }
    }
    privateLessons: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.privateLessons}" }, first: 1) {
      nodes {
        privateLessonsDirectoryPageFields {
          ${LESSONS_DIRECTORY_HEADER_FIELDS}
        }
      }
    }
    silversneakersPrimary: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.silversneakersPrimary}" }, first: 1) {
      nodes {
        silversneakersDirectoryPageFields {
          ${DIRECTORY_HEADER_FIELDS}
          redirectLabel
          redirectUrl
        }
      }
    }
    silversneakersAlt: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.silversneakersAlt}" }, first: 1) {
      nodes {
        silversneakersDirectoryPageFields {
          ${DIRECTORY_HEADER_FIELDS}
          redirectLabel
          redirectUrl
        }
      }
    }
    renewActivePrimary: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.renewActivePrimary}" }, first: 1) {
      nodes {
        renewActiveDirectoryPageFields {
          ${DIRECTORY_HEADER_FIELDS}
          redirectLabel
          redirectUrl
        }
      }
    }
    renewActiveAlt: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.renewActiveAlt}" }, first: 1) {
      nodes {
        renewActiveDirectoryPageFields {
          ${DIRECTORY_HEADER_FIELDS}
          redirectLabel
          redirectUrl
        }
      }
    }
    community: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.community}" }, first: 1) {
      nodes { communityDirectoryPageFields { ${DIRECTORY_HEADER_FIELDS} } }
    }
    sportsAndRecreation: pages(where: { name: "${PROGRAMS_DIRECTORY_PAGE_SLUGS.sportsAndRecreation}" }, first: 1) {
      nodes { sportsAndRecreationDirectoryPageFields { ${DIRECTORY_HEADER_FIELDS} } }
    }
  }
`;

type PagesNodes<T> = { nodes?: Array<T> | null } | null | undefined;

function firstNode<T>(connection: PagesNodes<T>): T | null {
  return connection?.nodes?.[0] ?? null;
}

function pickFirstContentField<T>(
  candidates: Array<T | null | undefined>,
  hasContent: (v: T) => boolean,
): T | undefined {
  for (const c of candidates) {
    if (c != null && hasContent(c)) return c;
  }
  return undefined;
}

function hasDirectoryHeaderContent(field?: any) {
  if (!field) return false;
  const header = (field?.header ?? "").trim();
  const body = (field?.body ?? "").trim();

  const atts = field?.attachments;
  const hasAttachment = [atts?.attachment1, atts?.attachment2, atts?.attachment3, atts?.attachment4].some(
    (a: any) =>
      (a?.label ?? "").trim() ||
      (a?.file?.node?.sourceUrl ?? a?.file?.sourceUrl ?? a?.file?.mediaItemUrl ?? "").trim(),
  );

  const hasSponsors = (field?.sponsors?.nodes ?? field?.sponsors ?? []).length > 0;
  const hasTrainers =
    (field?.trainers?.nodes ?? field?.tennisInstructors?.nodes ?? field?.trainers ?? []).length > 0;
  const hasRedirect = (
    field?.redirectLabel ??
    field?.redirectUrl ??
    field?.campsPageLinkLabel ??
    field?.campsPageLink ??
    field?.ecePageLinkLabel ??
    field?.ecePageLink ??
    ""
  ).trim();

  const bodyHeader = (field?.bodyHeader ?? "").trim();

  return Boolean(
    header || bodyHeader || body || hasAttachment || hasSponsors || hasTrainers || hasRedirect,
  );
}

function mapProgramDirectoryPageHeader(
  headerGroup?: any,
  linkKeys?: { label: string; url: string },
): any | undefined {
  if (!headerGroup) return undefined;
  if (!linkKeys) return headerGroup;
  return {
    ...headerGroup,
    redirectLabel: headerGroup.redirectLabel ?? headerGroup[linkKeys.label] ?? null,
    redirectUrl: headerGroup.redirectUrl ?? headerGroup[linkKeys.url] ?? null,
  };
}

function normalizeDirectoryHeaderData(
  field?: any,
  trainerConnectionKey: "trainers" | "tennisInstructors" = "trainers",
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
  const trainers =
    trainerNodes
      .map((trainer: any) => {
        const photoNode = trainer?.featuredImage?.node;
        const objectPosition = mediaFocalPositionCss(photoNode);
        return {
          name: trainer?.title ?? null,
          photo: photoNode
            ? {
                sourceUrl: photoNode.sourceUrl ?? null,
                altText: photoNode.altText ?? null,
                ...(objectPosition ? { objectPosition } : {}),
              }
            : null,
          jobTitle: trainer?.staffProfilesFields?.title ?? null,
          bio: trainer?.staffProfilesFields?.bio ?? null,
        };
      })
      .filter(
        (trainer: DirectoryTrainer) =>
          !!trainer.name || !!trainer.jobTitle || !!trainer.photo?.sourceUrl || !!trainer.bio,
      ) ?? [];

  const sponsorNodes = field?.sponsors?.nodes ?? [];
  const sponsors = sponsorNodes.flatMap((node: any) => {
    const logoUrl = node?.sponsorFields?.logo?.node?.sourceUrl?.trim();
    if (!logoUrl) return [];
    return [
      {
        name: node.name ?? null,
        logoUrl,
        logoAlt: node?.sponsorFields?.logo?.node?.altText ?? null,
        link: node?.sponsorFields?.link ?? null,
        tier: node?.sponsorFields?.tier ?? null,
      },
    ];
  });

  // Lessons ACF groups use bodyHeader; generic directory groups use header.
  const header = (field.header ?? field.bodyHeader ?? null) as string | null;

  return {
    header,
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
    trainers: trainers.length ? trainers : null,
    redirectLabel: field.redirectLabel ?? null,
    redirectUrl: field.redirectUrl ?? null,
  };
}

function normalizeGroupFitnessDirectoryData(
  directory?: DirectoryHeaderData | null,
  dropInCareRaw?: Record<string, unknown> | null,
): GroupFitnessDirectoryHeaderData | undefined {
  const base = normalizeDirectoryHeaderData(directory);
  const dropIn: DropInCareFields = normalizeDropInCareFields(dropInCareRaw ?? undefined);
  const hasDropIn =
    Boolean(dropIn.dropInCareHeader || dropIn.dropInCareDescription) ||
    hasDropInCareContent(dropInCareRaw ?? undefined);

  if (!base && !hasDropIn) return undefined;
  return { ...(base ?? {}), ...dropIn };
}

/**
 * Load all /programs specialty directory headers in a single WPGraphQL POST.
 */
export async function fetchProgramsDirectoryHeaders(): Promise<ProgramsPageACF> {
  const data = await wpFetch<{
    aquatics?: PagesNodes<{ aquaticsDirectoryPageFields?: any }>;
    camps?: PagesNodes<{ campsDirectoryPageFields?: any }>;
    earlyChildhood?: PagesNodes<{ earlyChildhoodPageFields?: any }>;
    groupFitnessPrimary?: PagesNodes<{ groupFitnessDirectoryPageFields?: any }>;
    groupFitnessAlt?: PagesNodes<{ groupFitnessDirectoryPageFields?: any }>;
    middleSchoolPrimary?: PagesNodes<{ middleSchoolSportsDirectoryPageFields?: any }>;
    middleSchoolAlt1?: PagesNodes<{ middleSchoolSportsDirectoryPageFields?: any }>;
    middleSchoolAlt2?: PagesNodes<{ middleSchoolSportsDirectoryPageFields?: any }>;
    personalTraining?: PagesNodes<{ personalTrainingDirectoryPageFields?: any }>;
    privateLessons?: PagesNodes<{ privateLessonsDirectoryPageFields?: any }>;
    silversneakersPrimary?: PagesNodes<{ silversneakersDirectoryPageFields?: any }>;
    silversneakersAlt?: PagesNodes<{ silversneakersDirectoryPageFields?: any }>;
    renewActivePrimary?: PagesNodes<{ renewActiveDirectoryPageFields?: any }>;
    renewActiveAlt?: PagesNodes<{ renewActiveDirectoryPageFields?: any }>;
    community?: PagesNodes<{ communityDirectoryPageFields?: any }>;
    sportsAndRecreation?: PagesNodes<{ sportsAndRecreationDirectoryPageFields?: any }>;
  }>(PROGRAMS_DIRECTORY_HEADERS_QUERY);

  const aquaticsRaw = firstNode(data?.aquatics)?.aquaticsDirectoryPageFields;
  const campsMapped = mapProgramDirectoryPageHeader(
    firstNode(data?.camps)?.campsDirectoryPageFields?.programDirectoryPageHeader,
    { label: "campsPageLinkLabel", url: "campsPageLink" },
  );
  const eceNode = firstNode(data?.earlyChildhood)?.earlyChildhoodPageFields;
  const childcareMapped = mapProgramDirectoryPageHeader(eceNode?.programDirectoryPageHeader, {
    label: "ecePageLinkLabel",
    url: "ecePageLink",
  });

  const groupFitnessRaw = pickFirstContentField(
    [
      firstNode(data?.groupFitnessPrimary)?.groupFitnessDirectoryPageFields,
      firstNode(data?.groupFitnessAlt)?.groupFitnessDirectoryPageFields,
    ],
    hasDirectoryHeaderContent,
  );

  const middleSchoolRaw = pickFirstContentField(
    [
      firstNode(data?.middleSchoolPrimary)?.middleSchoolSportsDirectoryPageFields,
      firstNode(data?.middleSchoolAlt1)?.middleSchoolSportsDirectoryPageFields,
      firstNode(data?.middleSchoolAlt2)?.middleSchoolSportsDirectoryPageFields,
    ],
    hasDirectoryHeaderContent,
  );

  const silversneakersRaw = pickFirstContentField(
    [
      firstNode(data?.silversneakersPrimary)?.silversneakersDirectoryPageFields,
      firstNode(data?.silversneakersAlt)?.silversneakersDirectoryPageFields,
    ],
    hasDirectoryHeaderContent,
  );

  const renewActiveRaw = pickFirstContentField(
    [
      firstNode(data?.renewActivePrimary)?.renewActiveDirectoryPageFields,
      firstNode(data?.renewActiveAlt)?.renewActiveDirectoryPageFields,
    ],
    hasDirectoryHeaderContent,
  );

  return {
    aquaticsDirectoryPageFields: normalizeDirectoryHeaderData(aquaticsRaw),
    campsDirectoryPageFields: normalizeDirectoryHeaderData(campsMapped),
    childcareDirectoryPageFields: normalizeDirectoryHeaderData(childcareMapped),
    groupFitnessDirectoryPageFields: normalizeGroupFitnessDirectoryData(
      groupFitnessRaw,
      eceNode ?? null,
    ),
    middleSchoolSportsDirectoryPageFields: normalizeDirectoryHeaderData(middleSchoolRaw),
    personalTrainingDirectoryPageFields: normalizeDirectoryHeaderData(
      firstNode(data?.personalTraining)?.personalTrainingDirectoryPageFields,
      "trainers",
    ),
    tennisLessonsDirectoryPageFields: normalizeDirectoryHeaderData(
      firstNode(data?.privateLessons)?.privateLessonsDirectoryPageFields,
      "trainers",
    ),
    silversneakersDirectoryPageFields: normalizeDirectoryHeaderData(silversneakersRaw),
    renewActiveDirectoryPageFields: normalizeDirectoryHeaderData(renewActiveRaw),
    sportsAndRecreationDirectoryPageFields: normalizeDirectoryHeaderData(
      firstNode(data?.sportsAndRecreation)?.sportsAndRecreationDirectoryPageFields,
    ),
    communityDirectoryPageFields: normalizeDirectoryHeaderData(
      firstNode(data?.community)?.communityDirectoryPageFields,
    ),
  };
}
