// src/app/search/page.tsx
import { getCenterWpToNextMap } from "@/lib/nav/centerMap";
import { resolveContentNodeHref } from "@/lib/nav/resolveHref";
import { wpFetch } from "@/lib/wp";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/search", {
    title: "Search",
    robots: { index: false, follow: true },
  });
}

type SearchResultNode = {
  id: string;
  title: string;
  uri: string;
  __typename: string;
};

type SearchQueryResponse = {
  contentNodes: {
    nodes: SearchResultNode[];
  };
};

const SEARCH_QUERY = /* GraphQL */ `
  query Search($search: String!) {
    contentNodes(where: { search: $search }, first: 50) {
      nodes {
        __typename
        id
        uri

        ... on NodeWithTitle {
          title
        }
      }
    }
  }
`;


export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").trim();

  let results: SearchResultNode[] = [];
  const centerMap = await getCenterWpToNextMap();

  if (query) {
    try {
      const data = await wpFetch<SearchQueryResponse>(SEARCH_QUERY, {
        search: query,
      });
      results = (data?.contentNodes?.nodes ?? []).map((item) => ({
        ...item,
        uri: resolveContentNodeHref({
          uri: item.uri,
          title: item.title ?? "",
          centerMap,
        }),
      }));
    } catch (err) {
      console.error("Search query failed:", err);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 mt-32">
      <h1 className="text-3xl font-semibold text-gmcc-navy mb-6">
        Search
      </h1>

      {/* Search form */}
      <form action="/search" method="get" className="mb-10">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Search the site…"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-gmcc-teal"
        />
      </form>

      {/* States */}
      {!query && (
        <p className="text-gray-600">
          Enter a search term above to find programs, pages, and more.
        </p>
      )}

      {query && results.length === 0 && (
        <p className="text-gray-600">
          No results found for <span className="font-medium">“{query}”</span>.
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-4">
          {results.map((item) => (
            <li key={item.id} className="border-b border-gray-200 pb-4">
              <Link
                href={item.uri}
                className="text-lg font-medium text-gmcc-navy hover:underline"
              >
                {item.title || "(Untitled)"}
              </Link>
              <div className="text-sm text-gray-500 mt-1">
                {item.__typename}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
