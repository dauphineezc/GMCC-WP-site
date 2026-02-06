// src/app/news/page.tsx
import { wpFetch } from "@/lib/wp";
import NewsListClient, { NewsListItem } from "./newsListClient";
import HeaderImage from "@/components/headerImage";

const NEWS_INDEX_QUERY = /* GraphQL */ `
  query NewsIndex($first: Int!) {
    allNews(first: $first) {
      nodes {
        id
        slug
        title

        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }

        newsFields {
          summary
          body
          publishDate
        }

        # Optional (only keep if these fields exist on your schema):
        # author (if your News has an ACF relationship to Staff CPT, the field name may differ)
        # audience, programArea, center (again: names must match your WPGraphQL schema)
      }
    }
  }
`;

function toDateValue(d?: string | null) {
  // ACF date field can be YYYYMMDD or YYYY-MM-DD depending on settings.
  if (!d) return 0;

  // If it's YYYYMMDD:
  if (/^\d{8}$/.test(d)) {
    const yyyy = Number(d.slice(0, 4));
    const mm = Number(d.slice(4, 6));
    const dd = Number(d.slice(6, 8));
    return new Date(yyyy, mm - 1, dd).valueOf();
  }

  // If it's ISO-ish:
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

export default async function NewsPage() {
    const data = await wpFetch<{ allNews?: { nodes?: any[] } }>(NEWS_INDEX_QUERY, { first: 250 });
    const raw = data?.allNews?.nodes ?? [];    

  const items: NewsListItem[] = raw
    .map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title ?? "",
      publishDate: n.newsFields?.publishDate ?? null,
      summary: n.newsFields?.summary ?? null,
      body: n.newsFields?.body ?? null,
      imageUrl: n.featuredImage?.node?.sourceUrl ?? null,
      imageAlt: n.featuredImage?.node?.altText ?? "",
      authorName: n.author?.node?.title ?? null,
      authorSlug: n.author?.node?.slug ?? null,
      audience: (n.audience?.nodes ?? []).map((x: any) => ({ name: x.name, slug: x.slug })),
      programArea: (n.programArea?.nodes ?? []).map((x: any) => ({ name: x.name, slug: x.slug })),
      centers: (n.center?.nodes ?? []).map((x: any) => ({ title: x.title, slug: x.slug })),
    }))
    .sort((a, b) => toDateValue(b.publishDate) - toDateValue(a.publishDate));

  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/MembershipHeaderImage.png" alt="Greater Midland Memberships" />
      </div>

      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        
        <header className="stack-2">
          <h1 className="h1 text-gmcc-navy">News</h1>
          <p className="body text-neutral-700 max-w-2xl">
            Updates, announcements, and stories from across GMCC.
          </p>
        </header>

        <NewsListClient items={items} />
      </div>
    </main>
  );
}
