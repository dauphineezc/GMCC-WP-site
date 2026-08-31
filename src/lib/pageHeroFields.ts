import type { PhotoWaveHeaderFields, HeroCta, HeroFieldsCtaRaw } from "@/components/photoWaveHeader";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";
import { resolveWpMediaUrl, wpFetch } from "@/lib/wp";

/**
 * ACF group "Hero Fields" on WordPress pages — must stay identical across directory pages.
 *
 * WPGraphQL's `page(id:, idType: URI)` can return `null` when the page slug collides
 * with a custom post type archive (e.g. "programs", "events"). To handle this reliably
 * we first try URI, then fall back to resolving the `databaseId` via a `pages(where:)` query.
 */
/** WordPress `Page` hero ACF — field names match Center CPT (`hero*` everywhere). */
export const PAGE_HERO_FIELDS_GRAPHQL = `
  heroFields {
    heroHeader
    heroSubheader
    heroImage {
      node {
        ${WP_MEDIA_IMAGE_FIELDS}
      }
    }
    heroPrimaryCta {
      ctaLabel
      cta
    }
    heroSecondaryCta {
      ctaLabel
      cta
    }
  }
`;

export type WpPageWithHeroFields = {
  id?: string | null;
  databaseId?: number | null;
  title?: string | null;
  slug?: string | null;
  heroFields?: PhotoWaveHeaderFields | null;
};

/** URI variants to try with `page(id: $pageUri, idType: URI)` (most specific first). */
export function pageUriCandidatesForSlug(slug: string): string[] {
  const s = slug.trim().replace(/^\/+|\/+$/g, "");
  if (!s) return [];
  return [`/${s}/`, `/${s}`, s];
}

/**
 * Fetch hero fields for a WP page by slug.
 *
 * Prefer `pages(where: { name })` (one GraphQL POST). URI lookup often fails when the
 * page slug collides with a CPT archive (e.g. "programs", "events"); name lookup does not.
 * Optional URI fallback remains for unusual permalink setups.
 *
 * @param slug          The WP page slug (e.g. "programs")
 * @param extraFields   Additional GraphQL fields to select inside `page { ... }`, e.g. ACF group queries.
 *                      They are appended after `heroFields`. Pass empty string if not needed.
 */
export async function fetchPageWithHeroFields<
  TExtra extends Record<string, unknown> = Record<string, never>,
>(
  slug: string,
  extraFields = "",
): Promise<(WpPageWithHeroFields & TExtra) | null> {
  const pageBody = `
    id
    databaseId
    title
    slug
    ${PAGE_HERO_FIELDS_GRAPHQL}
    ${extraFields}
  `;

  let lastError: unknown = null;

  // --- Prefer post_name lookup (1 POST; avoids CPT/URI collisions) ---
  try {
    const byName = await wpFetch<{
      pages?: { nodes?: Array<WpPageWithHeroFields & TExtra> } | null;
    }>(
      /* GraphQL */ `
        query PageBySlug($slug: String!) {
          pages(where: { name: $slug }, first: 1) {
            nodes {
              ${pageBody}
            }
          }
        }
      `,
      { slug },
      { suppressGraphQLErrorLogging: true },
    );
    const node = byName?.pages?.nodes?.[0];
    if (node) return node;
  } catch (error) {
    lastError = error;
  }

  // --- Fallback: idType URI (unusual permalink cases) ---
  const uriQuery = /* GraphQL */ `
    query PageByUri($pageUri: ID!) {
      page(id: $pageUri, idType: URI) {
        ${pageBody}
      }
    }
  `;
  for (const uri of pageUriCandidatesForSlug(slug)) {
    try {
      const data = await wpFetch<{ page?: (WpPageWithHeroFields & TExtra) | null }>(
        uriQuery,
        { pageUri: uri },
        { suppressGraphQLErrorLogging: true },
      );
      if (data?.page) return data.page;
    } catch (error) {
      lastError = error;
    }
  }

  if (process.env.NODE_ENV === "development" && lastError) {
    console.warn(`[pageHeroFields] Failed to load page "${slug}":`, lastError);
  }

  return null;
}

/**
 * Build a CTA object from an ACF `{ ctaLabel, cta }` sub-group.
 * Returns `null` when both label and url are empty.
 */
function heroCtaUrl(raw: HeroFieldsCtaRaw | null | undefined): string {
  if (!raw) return "";
  const c = raw.cta;
  if (typeof c === "string") return c.trim();
  if (c && typeof c === "object") {
    const u = (c as { url?: string | null; uri?: string | null }).url ?? (c as { uri?: string | null }).uri;
    if (u) return String(u).trim();
  }
  const direct = raw.url ?? raw.uri;
  if (direct) return String(direct).trim();
  return "";
}

function heroCtaLabel(raw: HeroFieldsCtaRaw | null | undefined): string {
  if (!raw) return "";
  return (raw.ctaLabel ?? raw.title ?? raw.label ?? "").trim();
}

export function resolveHeroCta(
  raw: HeroFieldsCtaRaw | null | undefined,
  variant: HeroCta["variant"] = "primary",
): HeroCta | null {
  const url = heroCtaUrl(raw);
  if (!url) return null;
  const label = heroCtaLabel(raw) || "Learn more";
  return { label, url, variant };
}

export function resolvePhotoWaveHeaderProps(
  page: WpPageWithHeroFields | null | undefined,
  defaultTitle: string,
) {
  const fields = page?.heroFields ?? null;
  const title =
    (fields?.heroHeader ?? fields?.header ?? "").trim() ||
    (page?.title ?? "").trim() ||
    defaultTitle;
  const subRaw = (fields?.heroSubheader ?? fields?.subheader ?? "").trim();
  const primaryCta = resolveHeroCta(fields?.heroPrimaryCta ?? fields?.primaryCta, "primary");
  const secondaryCta = resolveHeroCta(fields?.heroSecondaryCta ?? fields?.secondaryCta, "secondary");
  const ctas = [primaryCta, secondaryCta].filter((c): c is HeroCta => c != null);
  const heroImg = fields?.heroImage?.node;
  const rawHeroImg = heroImg?.sourceUrl ?? heroImg?.mediaItemUrl ?? undefined;
  const imagePosition = mediaFocalPositionCss(heroImg);
  return {
    title,
    subheader: subRaw ? subRaw : undefined,
    imageUrl: resolveWpMediaUrl(rawHeroImg) ?? undefined,
    imagePosition,
    primaryCta,
    secondaryCta,
    ctas: ctas.length > 0 ? ctas : undefined,
  } as const;
}
