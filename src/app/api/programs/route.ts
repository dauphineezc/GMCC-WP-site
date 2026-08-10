// src/app/api/programs/route.ts
import { NextResponse } from "next/server";
import { wpFetch } from "@/lib/wp";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";

const QUERY = `
  query ExplorePrograms($first: Int!, $after: String) {
    programs(first: $first, after: $after, where: { stati: PUBLISH }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        slug
        title
        featuredImage {
          node { ${WP_MEDIA_IMAGE_FIELDS} }
        }
        programFields {
          summary
          gallery {
            photos {
              node { ${WP_MEDIA_IMAGE_FIELDS} }
            }
          }
          offeringType
          skillLevel
          priceFrom
          audience { nodes { name slug } }
          campType { nodes { name slug } }
          center {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
          programArea { nodes { name slug } }
        }
      }
    }
  }
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const first = Number(searchParams.get("first") ?? "24");
  const after = searchParams.get("after");

  const data = await wpFetch<any>(QUERY, { first, after });

  return NextResponse.json({
    programs: data?.programs?.nodes ?? [],
    pageInfo: data?.programs?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}
