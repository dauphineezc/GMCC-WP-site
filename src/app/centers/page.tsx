// src/app/centers/page.tsx
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { fetchPageWithHeroFields, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";
import ExploreCentersClient from "./exploreCentersClient";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";

export const dynamic = "force-dynamic";

const EXPLORE_CENTERS_QUERY = `
  query ExploreCenters {
    centers(first: 100) {
      nodes {
        id
        slug
        title
        featuredImage {
          node { ${WP_MEDIA_IMAGE_FIELDS} }
        }
        centersFields {
          address
          contactInfo {
            contactPhone
            contactEmail
          }
          amenities {
            nodes { name slug }
          }
          accessibilityAmenities {
            nodes { name slug }
          }
        }
      }
    }

    programs(first: 500) {
      nodes {
        slug
        title
        programFields {
          center {
            nodes {
              slug
            }
          }
          programArea {
            nodes { name slug }
          }
        }
      }
    }
  }
`;

export default async function CentersPage() {
  const [heroPage, data] = await Promise.all([
    fetchPageWithHeroFields("centers"),
    wpFetch<any>(EXPLORE_CENTERS_QUERY),
  ]);
  const centers = data?.centers?.nodes ?? [];
  const programs = data?.programs?.nodes ?? [];
  const hero = resolvePhotoWaveHeaderProps(heroPage, "Explore our centers");

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} imagePosition={hero.imagePosition} ctas={hero.ctas} />
      <ExploreCentersClient centers={centers} programs={programs} />
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/centers");
}
