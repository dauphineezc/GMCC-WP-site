// src/app/news/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import { notFound } from "next/navigation";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import { getYoastMetadata } from "@/lib/wordpress/seo";

const NEWS_BY_SLUG_QUERY = /* GraphQL */ `
  query NewsBySlug($slug: ID!) {
    news(id: $slug, idType: SLUG) {
      id
      title
      slug
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      newsFields {
        publishDate
        summary
        body
        center {
          nodes {
            ... on Center {
              title
              slug
            }
          }
        }
        author { 
          nodes {
            ... on StaffProfile {
              title
              slug
              staffProfilesFields {
                title
              }
            } 
          }
        }
      }
    }
  }
`;

function formatPublishDate(d?: string | null) {
  if (!d) return "";
  if (/^\d{8}$/.test(d)) {
    const yyyy = d.slice(0, 4);
    const mm = d.slice(4, 6);
    const dd = d.slice(6, 8);
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return d;
  return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  return getYoastMetadata(`/news/${slug}`);
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
    const { slug } = await params;

    // guard: if slug is missing for any reason
    if (!slug) return notFound();
  
    const data = await wpFetch<{ news: any }>(NEWS_BY_SLUG_QUERY, { slug });
  
    if (!data?.news) return notFound();

    const n = data.news;

  return (
    <main>
      <SolidNavyWaveHeader title={n.title} description={n.newsFields?.summary} />

      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* LEFT COLUMN */}
          <div className="col-span-1">
            <header className="stack-3 max-w-3xl">
            <p className="text-sm text-neutral-600">{formatPublishDate(n.newsFields?.publishDate)}</p>
            <h1 className="h1 mt-4 mb-4">{n.title}</h1>
            <p className="text-sm text-neutral-600 mb-8">{n.newsFields?.author?.nodes?.map((a: any) => a.title + ", " + a.staffProfilesFields?.title).join(", ") ?? ""}</p>
            </header>
         
            {n.newsFields?.body ? (
            <article className="prose max-w-3xl">
                {/* If body is plain text area, keep newlines: */}
                <div className="whitespace-pre-line">{n.newsFields.body}</div>
            </article>
            ) : null}
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-1">
                {n.featuredImage?.node?.sourceUrl ? (
                <div className="overflow-hidden rounded-2xl bg-neutral-100">
                    <img
                    src={n.featuredImage.node.sourceUrl}
                    alt={n.featuredImage.node.altText || n.title}
                    className="w-full h-auto object-cover"
                    loading="eager"
                    decoding="async"
                    />
                </div>
                ) : null}
            </div>
        </div>
      </div>
    </main>
  );
}
