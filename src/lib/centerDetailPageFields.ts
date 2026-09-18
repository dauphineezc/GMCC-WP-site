import { cache } from "react";
import { coerceWpRichText } from "@/lib/acf";
import { wpFetch, WpMediaFieldInput } from "@/lib/wp";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";
import { WP_CACHE_TAGS } from "@/lib/revalidate";

export { coerceWpRichText };

/** WordPress page slug that holds `centerPageFields` (ACF on center template page). */
export const CENTER_DETAIL_WP_PAGE_SLUG = "center-detail";

/** Centers `[slug]` route that uses curling-specific overrides from `centerPageFields`. */
export const CURLING_CENTER_SLUG = "curling-center";

/** Single page body: core layout + curling CTA copy (one GraphQL POST). */
const CENTER_DETAIL_PAGE_FIELDS_BODY = `
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

/**
 * Load ACF `centerPageFields` from the WordPress page assigned as center detail template.
 * Uses `pages(where: { name })` (one POST) and React `cache()` per request.
 */
export const fetchCenterDetailPageFields = cache(
  async (): Promise<CenterDetailPageFields | null> => {
    try {
      const data = await wpFetch<{
        pages?: {
          nodes?: Array<{ centerPageFields?: CenterDetailPageFields | null }>;
        } | null;
      }>(
        /* GraphQL */ `
          query CenterDetailPageFields($slug: String!) {
            pages(where: { name: $slug }, first: 1) {
              nodes {
                ${CENTER_DETAIL_PAGE_FIELDS_BODY}
              }
            }
          }
        `,
        { slug: CENTER_DETAIL_WP_PAGE_SLUG },
        {
          suppressGraphQLErrorLogging: true,
          tags: [WP_CACHE_TAGS.centers, WP_CACHE_TAGS.pages],
        },
      );
      return data?.pages?.nodes?.[0]?.centerPageFields ?? null;
    } catch {
      return null;
    }
  },
);

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
