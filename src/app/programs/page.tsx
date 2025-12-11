// src/app/programs/page.tsx
import { wpFetch } from "@/lib/wp";
import ExploreProgramsClient from "./exploreProgramsClient";

const EXPLORE_PROGRAMS_QUERY = `
  query ExplorePrograms {
    programs(first: 500) {
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
          offeringType
          skillLevel
          priceFrom
          audience { nodes { name slug }}
          membershipRequirements { nodes { name slug }}

          center {
            nodes {
              ... on Center {
                slug
                title
              }
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

export default async function ExploreProgramsPage() {
  const data = await wpFetch<any>(EXPLORE_PROGRAMS_QUERY);
  const programs = data?.programs?.nodes ?? [];

  return <ExploreProgramsClient programs={programs} />;
}