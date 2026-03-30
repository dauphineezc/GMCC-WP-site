// src/app/api/programs/route.ts
import { NextResponse } from "next/server";
import { wpFetch } from "@/lib/wp";

const QUERY = `
  query ExplorePrograms($first: Int!, $after: String) {
    programs(first: $first, after: $after, where: { stati: PUBLISH }) {
      pageInfo { hasNextPage endCursor }
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
          mediaGallery {
            image1 {
              node {
                sourceUrl
                altText
              }
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
