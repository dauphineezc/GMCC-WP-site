// src/lib/amenities.ts
// Shared utility for fetching amenity details with images

import { wpFetch } from "@/lib/wp";
import type { AmenityDisplay } from "@/types/amenities";

const AMENITIES_FIELDS_BLOCK = `
        amenityImage1 { node { sourceUrl altText } }
        center1 { nodes { ... on Center { slug title } } }

        amenityImage2 { node { sourceUrl altText } }
        center2 { nodes { ... on Center { slug title } } }

        amenityImage3 { node { sourceUrl altText } }
        center3 { nodes { ... on Center { slug title } } }

        amenityImage4 { node { sourceUrl altText } }
        center4 { nodes { ... on Center { slug title } } }

        amenityImage5 { node { sourceUrl altText } }
        center5 { nodes { ... on Center { slug title } } }

        relevantLink
        linkLabel
        isService
        additionalInformation
        additionalImage {
          node {
            sourceUrl
            altText
          }
        }
`;

const AMENITY_BY_SLUG_QUERY = `
  query AmenityBySlug($slug: ID!) {
    amenity(id: $slug, idType: SLUG) {
      name
      slug
      description
      amenitiesFields {
${AMENITIES_FIELDS_BLOCK}
      }
    }
  }
`;

const ACCESSIBILITY_AMENITY_BY_SLUG_QUERY = `
  query AccessibilityAmenityBySlug($slug: ID!) {
    accessibilityAmenity(id: $slug, idType: SLUG) {
      name
      slug
      description
      amenitiesFields {
${AMENITIES_FIELDS_BLOCK}
      }
    }
  }
`;

const ALL_ACCESSIBILITY_AMENITIES_QUERY = `
  query AllAccessibilityAmenities($first: Int!) {
    accessibilityAmenities(first: $first) {
      nodes {
        name
        slug
        description
        amenitiesFields {
${AMENITIES_FIELDS_BLOCK}
        }
      }
    }
  }
`;


export function toAmenityDisplayForCenter(
  amenities: AmenityWithImage[],
  centerSlug: string
): AmenityDisplay[] {
  return amenities
    .map((a) => {
      const image = pickAmenityImageForCenter(a, centerSlug);
      if (!image) return null;

      return {
        name: a.name,
        slug: a.slug,
        description: a.description ?? null,
        relevantLink: a.relevantLink ?? null,
        linkLabel: a.linkLabel ?? null,
        image,
      } satisfies AmenityDisplay;
    })
    .filter((x) => Boolean(x)) as AmenityDisplay[];
}


export function toAmenityDisplayDefault(
  amenities: AmenityWithImage[]
): AmenityDisplay[] {
  return amenities
    .map((a) => {
      const image = a.defaultImage ?? a.centerImageCandidates[0]?.image ?? null;
      if (!image) return null;

      const row: AmenityDisplay = {
        name: a.name,
        slug: a.slug,
        description: a.description ?? null,
        relevantLink: a.relevantLink ?? null,
        linkLabel: a.linkLabel ?? null,
        image,
      };
      if (a.linkedCenters?.length) {
        row.centers = a.linkedCenters;
      }
      return row;
    })
    .filter((x) => Boolean(x)) as AmenityDisplay[];
}



export type AmenityWithImage = {
  name: string;
  slug: string;
  description?: string | null;
  relevantLink?: string | null;
  linkLabel?: string | null;

  // default/fallback image (old behavior)
  defaultImage: { sourceUrl: string; altText: string | null } | null;

  // new: up to 5 center-specific candidates
  centerImageCandidates: Array<{
    centerSlug: string;
    centerTitle?: string | null;
    relevantLink?: string | null;
    image: { sourceUrl: string; altText: string | null };
  }>;

  /** All centers linked via center1–center5 (for aggregated accessibility views) */
  linkedCenters?: Array<{ slug: string; title: string }>;
};

type MapAmenityFieldsOptions = {
  includeLinkedCenters?: boolean;
  /** When true, falls back to amenitiesFields.additionalInformation for description text */
  includeAdditionalInformationInDescription?: boolean;
};

function collectLinkedCenters(af: Record<string, unknown>): Array<{ slug: string; title: string }> {
  const seen = new Set<string>();
  const out: Array<{ slug: string; title: string }> = [];
  for (let i = 1; i <= 5; i++) {
    const centerNodes = (af as any)[`center${i}`]?.nodes ?? [];
    for (const c of centerNodes) {
      if (c?.slug && c?.title && !seen.has(c.slug)) {
        seen.add(c.slug);
        out.push({ slug: c.slug, title: c.title });
      }
    }
  }
  return out;
}

function mapAmenityFieldsToWithImage(
  amenity: { name: string; slug: string; description?: string | null },
  af: Record<string, unknown> | null | undefined,
  options?: MapAmenityFieldsOptions
): AmenityWithImage | null {
  if (!amenity || !af) return null;

  const defaultNode = (af as any)?.amenityImage?.node ?? null;
  const defaultImage =
    defaultNode?.sourceUrl
      ? { sourceUrl: defaultNode.sourceUrl, altText: defaultNode.altText ?? null }
      : null;

  const centerImageCandidates: AmenityWithImage["centerImageCandidates"] = [];

  for (let i = 1; i <= 5; i++) {
    const imageNode = (af as any)[`amenityImage${i}`]?.node;
    const centerNodes = (af as any)[`center${i}`]?.nodes ?? [];

    const centerSlug = centerNodes?.[0]?.slug;
    const centerTitle = centerNodes?.[0]?.title ?? null;

    if (centerSlug && imageNode?.sourceUrl) {
      centerImageCandidates.push({
        centerSlug,
        centerTitle,
        relevantLink: (af as any).relevantLink ?? null,
        image: {
          sourceUrl: imageNode.sourceUrl,
          altText: imageNode.altText ?? null,
        },
      });
    }
  }

  if (!defaultImage && !centerImageCandidates.length) return null;

  let description: string | null = amenity.description ?? null;
  if (options?.includeAdditionalInformationInDescription) {
    const addl = (af as any).additionalInformation;
    const d = typeof description === "string" && description.trim() ? description.trim() : null;
    const a = typeof addl === "string" && addl.trim() ? addl.trim() : null;
    description = d || a || null;
    if (description) {
      description = description.replace(/<[^>]*>/g, "").trim() || null;
    }
  }

  const row: AmenityWithImage = {
    name: amenity.name,
    slug: amenity.slug,
    description,
    relevantLink: (af as any).relevantLink ?? null,
    linkLabel: (af as any).linkLabel ?? null,
    defaultImage,
    centerImageCandidates,
  };

  if (options?.includeLinkedCenters) {
    row.linkedCenters = collectLinkedCenters(af);
  }

  return row;
}


export function pickAmenityImageForCenter(
  amenity: AmenityWithImage,
  centerSlug: string
): { sourceUrl: string; altText: string | null } | null {
  const match = amenity.centerImageCandidates.find((c) => c.centerSlug === centerSlug);
  if (match) return match.image;

  // fallback to default image if no per-center match
  if (amenity.defaultImage) return amenity.defaultImage;

  // final fallback: first candidate image
  return amenity.centerImageCandidates[0]?.image ?? null;
}

// If you already have AmenityImage defined in the component file,
// move it to a shared file (e.g. src/lib/types.ts) or re-declare it here.
export type AmenityImage = {
  name: string;
  slug: string;
  description?: string | null;
  image: { sourceUrl: string; altText: string | null };
};

export function toAmenityImagesForCenter(
  amenities: AmenityWithImage[],
  centerSlug: string
): AmenityImage[] {
  return amenities
    .map((a) => {
      const img = pickAmenityImageForCenter(a, centerSlug);
      if (!img) return null;

      return {
        name: a.name,
        slug: a.slug,
        description: a.description ?? null,
        image: img,
      } satisfies AmenityImage;
    })
    .filter((x) => Boolean(x)) as AmenityImage[];
}


/**
 * Fetches amenity details including images for a list of amenity slugs.
 * Only returns amenities that have images.
 */
export async function fetchAmenitiesWithImages(
  amenitySlugs: string[]
): Promise<AmenityWithImage[]> {
  if (!amenitySlugs.length) return [];

  const amenityResults = await Promise.all(
    amenitySlugs.map((slug) => wpFetch<any>(AMENITY_BY_SLUG_QUERY, { slug }))
  );

  const amenities: AmenityWithImage[] = [];

  for (const result of amenityResults) {
    const amenity = result?.amenity;
    const af = amenity?.amenitiesFields;
    const mapped = mapAmenityFieldsToWithImage(amenity, af, {});
    if (mapped) amenities.push(mapped);
  }

  return amenities;
}


/**
 * Fetches accessibility amenity details including images for a list of slugs.
 * Only returns amenities that have images.
 */
export async function fetchAccessibilityAmenitiesWithImages(
  amenitySlugs: string[]
): Promise<AmenityWithImage[]> {
  if (!amenitySlugs.length) return [];

  const amenityResults = await Promise.all(
    amenitySlugs.map((slug) => wpFetch<any>(ACCESSIBILITY_AMENITY_BY_SLUG_QUERY, { slug }))
  );

  const amenitiesWithImages: AmenityWithImage[] = [];

  for (const result of amenityResults) {
    const amenity = result?.accessibilityAmenity;
    const af = amenity?.amenitiesFields;
    const mapped = mapAmenityFieldsToWithImage(amenity, af, {
      includeAdditionalInformationInDescription: true,
    });
    if (mapped) amenitiesWithImages.push(mapped);
  }

  return amenitiesWithImages;
}

const MAX_ACCESSIBILITY_AMENITIES = 100;

/**
 * Loads all accessibility amenities (accessibility taxonomy / CPT in WordPress) with images and center links.
 */
export async function fetchAllAccessibilityAmenitiesWithImages(): Promise<AmenityWithImage[]> {
  const data = await wpFetch<any>(ALL_ACCESSIBILITY_AMENITIES_QUERY, {
    first: MAX_ACCESSIBILITY_AMENITIES,
  });
  const nodes = data?.accessibilityAmenities?.nodes ?? [];
  const out: AmenityWithImage[] = [];

  for (const node of nodes) {
    const mapped = mapAmenityFieldsToWithImage(node, node?.amenitiesFields, {
      includeLinkedCenters: true,
      includeAdditionalInformationInDescription: true,
    });
    if (mapped) out.push(mapped);
  }

  out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return out;
}

/**
 * Helper to extract slugs from amenity nodes (from GraphQL response)
 */
export function extractAmenitySlugs(nodes: any[] | null | undefined): string[] {
  if (!nodes) return [];
  return nodes.map((n: any) => n?.slug).filter(Boolean);
}

