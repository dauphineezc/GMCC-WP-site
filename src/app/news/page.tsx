// src/app/news/page.tsx
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";
import NewsListClient, { NewsListItem } from "./newsListClient";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";

const NEWS_LIST_QUERY = /* GraphQL */ `
  query NewsList($first: Int!) {
    allNews(first: $first) {
      nodes {
        id
        slug
        title

        featuredImage {
          node {
            ${WP_MEDIA_IMAGE_FIELDS}
            mediaDetails { width height }
          }
        }

        newsFields {
          summary
          body
          publishDate
        }
      }
    }
  }
`;

type NewsListData = {
  allNews?: { nodes?: any[] } | null;
};

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
  const [heroPage, newsData] = await Promise.all([
    fetchPageWithHeroFields("news"),
    wpFetch<NewsListData>(NEWS_LIST_QUERY, { first: 250 }),
  ]);

  const raw = newsData?.allNews?.nodes ?? [];

  const items: NewsListItem[] = raw
    .map((n) => {
      const objectPosition = mediaFocalPositionCss(n.featuredImage?.node);
      return {
        id: n.id,
        slug: n.slug,
        title: n.title ?? "",
        publishDate: n.newsFields?.publishDate ?? null,
        summary: n.newsFields?.summary ?? null,
        body: n.newsFields?.body ?? null,
        imageUrl: n.featuredImage?.node?.sourceUrl ?? null,
        imageAlt: n.featuredImage?.node?.altText ?? "",
        ...(objectPosition ? { objectPosition } : {}),
        authorName: n.author?.node?.title ?? null,
        authorSlug: n.author?.node?.slug ?? null,
        audience: (n.audience?.nodes ?? []).map((x: any) => ({ name: x.name, slug: x.slug })),
        programArea: (n.programArea?.nodes ?? []).map((x: any) => ({ name: x.name, slug: x.slug })),
        centers: (n.center?.nodes ?? []).map((x: any) => ({ title: x.title, slug: x.slug })),
      };
    })
    .sort((a, b) => toDateValue(b.publishDate) - toDateValue(a.publishDate));

  const hero = resolvePhotoWaveHeaderProps(heroPage, "News");

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}/>

      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        <NewsListClient items={items} />
      </div>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/news");
}
