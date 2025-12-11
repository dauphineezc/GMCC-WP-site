// src/app/centers/page.tsx
import { wpFetch } from "@/lib/wp";
import ExploreCentersClient from "./exploreCentersClient";

const EXPLORE_CENTERS_QUERY = `
  query ExploreCenters {
    centers(first: 100) {
      nodes {
        id
        slug
        title
        featuredImage {
          node { sourceUrl altText }
        }
        centersFields {
          address
          map {
            lat
            lng
            zoom
          }
          contactInfo {
            contactPhone
            contactEmail
          }
          amenities {
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
  const data = await wpFetch<any>(EXPLORE_CENTERS_QUERY);
  const centers = data?.centers?.nodes ?? [];
  const programs = data?.programs?.nodes ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <ExploreCentersClient centers={centers} programs={programs} />
    </main>
  );
}
