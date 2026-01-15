// src/app/api/events/route.ts
import { NextResponse } from "next/server";
import { wpFetch } from "@/lib/wp";

const QUERY = `
  query ExploreEvents($first: Int!, $after: String) {
    events(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { id slug title }
    }
  }
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const first = Number(searchParams.get("first") ?? "24");
  const after = searchParams.get("after");

  const data = await wpFetch<any>(QUERY, { first, after });

  return NextResponse.json({
    events: data?.events?.nodes ?? [],
    pageInfo: data?.events?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}
