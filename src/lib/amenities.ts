// src/lib/amenities.ts
// Shared utility for fetching amenity details with images

import { wpFetch } from "@/lib/wp";

const AMENITY_BY_SLUG_QUERY = `
  query AmenityBySlug($slug: ID!) {
    amenity(id: $slug, idType: SLUG) {
      name
      slug
      description
      amenitiesFields {
        amenityImage {
          node {
            sourceUrl
            altText
          }
        }
        isService
        additionalInformation
        additionalImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }`;

const ACCESSIBILITY_AMENITY_BY_SLUG_QUERY = `
  query AccessibilityAmenityBySlug($slug: ID!) {
    accessibilityAmenity(id: $slug, idType: SLUG) {
      name
      slug
      description
      amenitiesFields {
        amenityImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export type AmenityWithImage = {
  name: string;
  slug: string;
  description?: string | null;
  image: {
    sourceUrl: string;
    altText: string | null;
  };
};

/**
 * Fetches amenity details including images for a list of amenity slugs.
 * Only returns amenities that have images.
 */
export async function fetchAmenitiesWithImages(
  amenitySlugs: string[]
): Promise<AmenityWithImage[]> {
  if (!amenitySlugs.length) return [];

  const amenityPromises = amenitySlugs.map((slug) =>
    wpFetch<any>(AMENITY_BY_SLUG_QUERY, { slug })
  );
  const amenityResults = await Promise.all(amenityPromises);

  const amenitiesWithImages: AmenityWithImage[] = [];

  for (const result of amenityResults) {
    const amenity = result?.amenity;
    const imageNode = amenity?.amenitiesFields?.amenityImage?.node;
    if (amenity && imageNode?.sourceUrl) {
      amenitiesWithImages.push({
        name: amenity.name,
        slug: amenity.slug,
        description: amenity.description ?? null,
        image: {
          sourceUrl: imageNode.sourceUrl,
          altText: imageNode.altText ?? null,
        },
      });
    }
  }

  return amenitiesWithImages;
}

/**
 * Fetches accessibility amenity details including images for a list of slugs.
 * Only returns amenities that have images.
 */
export async function fetchAccessibilityAmenitiesWithImages(
  amenitySlugs: string[]
): Promise<AmenityWithImage[]> {
  if (!amenitySlugs.length) return [];

  const amenityPromises = amenitySlugs.map((slug) =>
    wpFetch<any>(ACCESSIBILITY_AMENITY_BY_SLUG_QUERY, { slug })
  );
  const amenityResults = await Promise.all(amenityPromises);

  const amenitiesWithImages: AmenityWithImage[] = [];

  for (const result of amenityResults) {
    const amenity = result?.accessibilityAmenity;
    const imageNode = amenity?.amenitiesFields?.amenityImage?.node;
    if (amenity && imageNode?.sourceUrl) {
      amenitiesWithImages.push({
        name: amenity.name,
        slug: amenity.slug,
        description: amenity.description ?? null,
        image: {
          sourceUrl: imageNode.sourceUrl,
          altText: imageNode.altText ?? null,
        },
      });
    }
  }

  return amenitiesWithImages;
}

/**
 * Helper to extract slugs from amenity nodes (from GraphQL response)
 */
export function extractAmenitySlugs(nodes: any[] | null | undefined): string[] {
  if (!nodes) return [];
  return nodes.map((n: any) => n?.slug).filter(Boolean);
}

