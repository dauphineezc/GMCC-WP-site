import { buildEventHref } from "@/lib/events/buildEventHref";
import { EVENT_SCHEDULE_GRAPHQL, getEventDateInfo } from "@/lib/events/eventSchedule";
import { wpFetch } from "@/lib/wp";
import { pageUriCandidatesForSlug } from "@/lib/pageHeroFields";

/** WordPress page slug that holds `centerPageFields` (ACF on center template page). */
export const CENTER_DETAIL_WP_PAGE_SLUG = "center-detail";

/** Centers `[slug]` route that uses curling-specific overrides from `centerPageFields`. */
export const CURLING_CENTER_SLUG = "curling-center";

/** ACF / WPGraphQL often returns WYSIWYG and text fields as strings or wrapper objects. */
export function coerceWpRichText(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    const o = input as Record<string, unknown>;
    for (const key of ["rendered", "html", "source", "text", "value", "content"]) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return "";
}

/** Core layout: avoids heavy / fragile fragments so hours + ready-to-join still load. */
const CENTER_DETAIL_PAGE_FIELDS_CORE = `
      centerPageFields {
        testimonialHeader
        readyToJoinSection {
          header
          subheader
          cardText
          ctaLabel
        }
        socialIcons {
          instagram { node { sourceUrl altText }}
          facebook { node { sourceUrl altText }}
          youtube { node { sourceUrl altText }}
          tiktok { node { sourceUrl altText }}
        }
        curlingCenterPageFields {
          hoursReplacementStatement
        }
      }
`;

/** Curling CTA copy only — must not share a query with `featuredProgramEvent` or a schema error there drops all copy. */
const CURLING_MEMBERSHIP_CTA_COPY = `
      centerPageFields {
        curlingCenterPageFields {
          membershipReplacementCta {
            header
            subheader
            cardText
            ctaLabel
          }
        }
      }
`;

const CURLING_MEMBERSHIP_CTA_LINK = `
      centerPageFields {
        curlingCenterPageFields {
          membershipReplacementCta {
            featuredProgramEvent {
              node {
                __typename
                ... on Program {
                  slug
                }
                ... on Event {
                  slug
                  eventFields {
                    ${EVENT_SCHEDULE_GRAPHQL}
                  }
                }
              }
            }
          }
        }
      }
`;

export type CenterPageReadyToJoinSection = {
  header?: string | null;
  subheader?: string | null;
  cardText?: string | null;
  ctaLabel?: string | null;
};

type FeaturedProgramEventNode = {
  __typename?: string | null;
  slug?: string | null;
  eventFields?: { eventSchedule?: unknown } | null;
};

export type CenterPageMembershipReplacementCta = CenterPageReadyToJoinSection & {
  featuredProgramEvent?: {
    node?: FeaturedProgramEventNode | null;
  } | null;
};

export type CenterPageCurlingFields = {
  hoursReplacementStatement?: string | null;
  membershipReplacementCta?: CenterPageMembershipReplacementCta | null;
};

export type CenterSocialIconNode = {
  node?: { sourceUrl?: string | null; altText?: string | null } | null;
};

export type CenterPageSocialIcons = {
  instagram?: CenterSocialIconNode | null;
  facebook?: CenterSocialIconNode | null;
  youtube?: CenterSocialIconNode | null;
  tiktok?: CenterSocialIconNode | null;
};

export const CENTER_SOCIAL_PLATFORMS = ["instagram", "facebook", "youtube", "tiktok"] as const;
export type CenterSocialPlatform = (typeof CENTER_SOCIAL_PLATFORMS)[number];

export type ResolvedCenterSocialLink = {
  platform: CenterSocialPlatform;
  href: string;
  iconUrl: string;
  iconAlt: string;
};

const SOCIAL_PLATFORM_LABELS: Record<CenterSocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
};

/** Pair shared icon assets with per-center URLs; skips platforms missing either. */
export function resolveCenterSocialLinks(
  icons: CenterPageSocialIcons | null | undefined,
  links: Partial<Record<CenterSocialPlatform, string | null | undefined>> | null | undefined,
): ResolvedCenterSocialLink[] {
  if (!icons || !links) return [];

  const resolved: ResolvedCenterSocialLink[] = [];

  for (const platform of CENTER_SOCIAL_PLATFORMS) {
    const href = links[platform]?.trim();
    const iconUrl = icons[platform]?.node?.sourceUrl?.trim();
    if (!href || !iconUrl) continue;

    const iconAlt = icons[platform]?.node?.altText?.trim();
    resolved.push({
      platform,
      href,
      iconUrl,
      iconAlt: iconAlt || SOCIAL_PLATFORM_LABELS[platform],
    });
  }

  return resolved;
}

export type CenterDetailPageFields = {
  testimonialHeader?: string | null;
  readyToJoinSection?: CenterPageReadyToJoinSection | null;
  socialIcons?: CenterPageSocialIcons | null;
  curlingCenterPageFields?: CenterPageCurlingFields | null;
};

function mergeCenterDetailParts(
  core: CenterDetailPageFields | null | undefined,
  curlingCtaCopy: CenterDetailPageFields | null | undefined,
  curlingCtaLink: CenterDetailPageFields | null | undefined,
): CenterDetailPageFields | null {
  if (!core && !curlingCtaCopy && !curlingCtaLink) return null;

  const baseCurl = core?.curlingCenterPageFields;
  const copyCurl = curlingCtaCopy?.curlingCenterPageFields;
  const linkCurl = curlingCtaLink?.curlingCenterPageFields;

  const textMrc = copyCurl?.membershipReplacementCta;
  const linkMrc = linkCurl?.membershipReplacementCta;
  const membershipReplacementCta =
    textMrc || linkMrc || baseCurl?.membershipReplacementCta
      ? {
          header: textMrc?.header ?? linkMrc?.header ?? baseCurl?.membershipReplacementCta?.header,
          subheader:
            textMrc?.subheader ?? linkMrc?.subheader ?? baseCurl?.membershipReplacementCta?.subheader,
          cardText:
            textMrc?.cardText ?? linkMrc?.cardText ?? baseCurl?.membershipReplacementCta?.cardText,
          ctaLabel:
            textMrc?.ctaLabel ?? linkMrc?.ctaLabel ?? baseCurl?.membershipReplacementCta?.ctaLabel,
          featuredProgramEvent:
            linkMrc?.featuredProgramEvent ??
            textMrc?.featuredProgramEvent ??
            baseCurl?.membershipReplacementCta?.featuredProgramEvent,
        }
      : null;

  const hasCurlingBlock =
    baseCurl?.hoursReplacementStatement != null ||
    copyCurl?.hoursReplacementStatement != null ||
    linkCurl?.hoursReplacementStatement != null ||
    membershipReplacementCta != null;

  return {
    testimonialHeader:
      core?.testimonialHeader ?? curlingCtaCopy?.testimonialHeader ?? curlingCtaLink?.testimonialHeader,
    readyToJoinSection:
      core?.readyToJoinSection ?? curlingCtaCopy?.readyToJoinSection ?? curlingCtaLink?.readyToJoinSection,
    socialIcons: core?.socialIcons ?? curlingCtaCopy?.socialIcons ?? curlingCtaLink?.socialIcons,
    curlingCenterPageFields: hasCurlingBlock
      ? {
          hoursReplacementStatement:
            baseCurl?.hoursReplacementStatement ??
            copyCurl?.hoursReplacementStatement ??
            linkCurl?.hoursReplacementStatement,
          membershipReplacementCta: membershipReplacementCta ?? null,
        }
      : null,
  };
}

/**
 * Resolve CTA href for curling center: linked Program or Event from ACF.
 */
export function resolveFeaturedProgramEventHref(
  node: FeaturedProgramEventNode | null | undefined,
): string | null {
  if (!node?.slug) return null;
  const tn = node.__typename ?? "";
  const eventStart = getEventDateInfo(node.eventFields?.eventSchedule).start;
  if (tn === "Event" || tn.endsWith("Event")) {
    return buildEventHref(node.slug, eventStart ?? "");
  }
  if (tn === "Program" || tn.endsWith("Program")) {
    return `/programs/${encodeURIComponent(node.slug)}`;
  }
  if (eventStart) {
    return buildEventHref(node.slug, eventStart);
  }
  return `/programs/${encodeURIComponent(node.slug)}`;
}

async function loadCenterDetailCenterPageFieldsBody(pageInnerBody: string): Promise<CenterDetailPageFields | null> {
  const uriQuery = /* GraphQL */ `
    query CenterDetailPageByUri($pageUri: ID!) {
      page(id: $pageUri, idType: URI) {
        ${pageInnerBody}
      }
    }
  `;

  for (const uri of pageUriCandidatesForSlug(CENTER_DETAIL_WP_PAGE_SLUG)) {
    try {
      const data = await wpFetch<{ page?: { centerPageFields?: CenterDetailPageFields | null } | null }>(
        uriQuery,
        { pageUri: uri },
        { suppressGraphQLErrorLogging: true },
      );
      if (data?.page) {
        return data.page.centerPageFields ?? null;
      }
    } catch {
      // try next URI form
    }
  }

  try {
    const lookup = await wpFetch<{
      pages?: { nodes?: Array<{ databaseId: number }> } | null;
    }>(
      /* GraphQL */ `
        query LookupCenterDetailPageId($slug: String!) {
          pages(where: { name: $slug }, first: 1) {
            nodes { databaseId }
          }
        }
      `,
      { slug: CENTER_DETAIL_WP_PAGE_SLUG },
      { suppressGraphQLErrorLogging: true },
    );
    const dbId = lookup?.pages?.nodes?.[0]?.databaseId;
    if (dbId) {
      const dbIdQuery = /* GraphQL */ `
        query CenterDetailPageByDbId($dbId: ID!) {
          page(id: $dbId, idType: DATABASE_ID) {
            ${pageInnerBody}
          }
        }
      `;
      const data = await wpFetch<{ page?: { centerPageFields?: CenterDetailPageFields | null } | null }>(
        dbIdQuery,
        { dbId: String(dbId) },
        { suppressGraphQLErrorLogging: true },
      );
      return data?.page?.centerPageFields ?? null;
    }
  } catch {
    // exhausted
  }

  return null;
}

/**
 * Load ACF `centerPageFields` from the WordPress page assigned as center detail template
 * (same strategy as `fetchPageWithHeroFields`: URI attempts then databaseId).
 *
 * Curling membership CTA is split further: copy vs `featuredProgramEvent` so link/schema issues
 * cannot hide header, subheader, card text, or button label.
 */
export async function fetchCenterDetailPageFields(): Promise<CenterDetailPageFields | null> {
  const [core, curlingCtaCopy, curlingCtaLink] = await Promise.all([
    loadCenterDetailCenterPageFieldsBody(CENTER_DETAIL_PAGE_FIELDS_CORE),
    loadCenterDetailCenterPageFieldsBody(CURLING_MEMBERSHIP_CTA_COPY),
    loadCenterDetailCenterPageFieldsBody(CURLING_MEMBERSHIP_CTA_LINK).catch(() => null),
  ]);
  return mergeCenterDetailParts(core, curlingCtaCopy, curlingCtaLink);
}

/** True if this center should use curling-specific ACF (URL slug or WP Center slug). */
export function isCurlingCenterSlug(routeSlug: string, centerSlug?: string | null): boolean {
  const norm = (s: string) =>
    decodeURIComponent(s)
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase();
  return (
    norm(routeSlug) === CURLING_CENTER_SLUG ||
    (typeof centerSlug === "string" && norm(centerSlug) === CURLING_CENTER_SLUG)
  );
}
