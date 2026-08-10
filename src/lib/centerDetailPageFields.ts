import { buildEventHref } from "@/lib/events/buildEventHref";
import { EVENT_SCHEDULE_GRAPHQL, getEventDateInfo } from "@/lib/events/eventSchedule";
import { wpFetch, WpMediaFieldInput } from "@/lib/wp";
import { pageUriCandidatesForSlug } from "@/lib/pageHeroFields";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";

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
          instagram { node { ${WP_MEDIA_IMAGE_FIELDS} }}
          facebook { node { ${WP_MEDIA_IMAGE_FIELDS} }}
          youtube { node { ${WP_MEDIA_IMAGE_FIELDS} }}
          tiktok { node { ${WP_MEDIA_IMAGE_FIELDS} }}
        }
        curlingCenterPageFields {
          hoursReplacementStatement
          midlandCurlingClubLogo { node { ${WP_MEDIA_IMAGE_FIELDS} mediaItemUrl }}
          historySection {
            header
            body {
              historyItemHeader
              historyItem
            }
            icon { node { ${WP_MEDIA_IMAGE_FIELDS} mediaItemUrl }}
          }
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
            ctaUrl
          }
        }
      }
`;

export type CenterPageReadyToJoinSection = {
  header?: string | null;
  subheader?: string | null;
  cardText?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export type CenterPageHistoryItem = {
  historyItemHeader?: string | null;
  historyItem?: string | null;
};

export type CenterPageHistorySection = {
  header?: string | null;
  body?: Array<CenterPageHistoryItem | null> | null;
  icon?: WpMediaFieldInput | null;
};

/** Non-empty history paragraphs from the curling history repeater. */
export function normalizeCurlingHistoryItems(
  body: CenterPageHistorySection["body"],
): Array<CenterPageHistoryItem> {
  if (!Array.isArray(body)) return [];
  return body
    .map((row) => ({
      historyItemHeader: (row?.historyItemHeader ?? "").trim() || null,
      historyItem: coerceWpRichText(row?.historyItem).trim() || null,
    }))
    .filter((row) => Boolean(row.historyItemHeader || row.historyItem));
}

export type CenterPageMembershipReplacementCta = CenterPageReadyToJoinSection;

export type CenterPageCurlingFields = {
  hoursReplacementStatement?: string | null;
  midlandCurlingClubLogo?: WpMediaFieldInput | null;
  membershipReplacementCta?: CenterPageMembershipReplacementCta | null;
  historySection?: CenterPageHistorySection | null;
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
): CenterDetailPageFields | null {
  if (!core && !curlingCtaCopy) return null;

  const baseCurl = core?.curlingCenterPageFields;
  const copyCurl = curlingCtaCopy?.curlingCenterPageFields;

  const textMrc = copyCurl?.membershipReplacementCta;
  const membershipReplacementCta =
    textMrc || baseCurl?.membershipReplacementCta
      ? {
          header: textMrc?.header ?? baseCurl?.membershipReplacementCta?.header,
          subheader: textMrc?.subheader ?? baseCurl?.membershipReplacementCta?.subheader,
          cardText: textMrc?.cardText ?? baseCurl?.membershipReplacementCta?.cardText,
          ctaLabel: textMrc?.ctaLabel ?? baseCurl?.membershipReplacementCta?.ctaLabel,
          ctaUrl: textMrc?.ctaUrl ?? baseCurl?.membershipReplacementCta?.ctaUrl,
        }
      : null;

  const historySection =
    baseCurl?.historySection ?? copyCurl?.historySection ?? null;

  const hasCurlingBlock =
    baseCurl?.hoursReplacementStatement != null ||
    copyCurl?.hoursReplacementStatement != null ||
    membershipReplacementCta != null ||
    baseCurl?.midlandCurlingClubLogo != null ||
    copyCurl?.midlandCurlingClubLogo != null ||
    historySection != null;

  return {
    testimonialHeader:
      core?.testimonialHeader ?? curlingCtaCopy?.testimonialHeader,
    readyToJoinSection:
      core?.readyToJoinSection ?? curlingCtaCopy?.readyToJoinSection,
    socialIcons: core?.socialIcons ?? curlingCtaCopy?.socialIcons,
    curlingCenterPageFields: hasCurlingBlock
      ? {
          hoursReplacementStatement:
            baseCurl?.hoursReplacementStatement ??
            copyCurl?.hoursReplacementStatement ??
            null,
          midlandCurlingClubLogo: baseCurl?.midlandCurlingClubLogo ?? copyCurl?.midlandCurlingClubLogo ?? null,
          membershipReplacementCta: membershipReplacementCta ?? null,
          historySection,
        }
      : null,
  };
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
  const [core, curlingCtaCopy] = await Promise.all([
    loadCenterDetailCenterPageFieldsBody(CENTER_DETAIL_PAGE_FIELDS_CORE),
    loadCenterDetailCenterPageFieldsBody(CURLING_MEMBERSHIP_CTA_COPY),
  ]);
  return mergeCenterDetailParts(core, curlingCtaCopy);
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
