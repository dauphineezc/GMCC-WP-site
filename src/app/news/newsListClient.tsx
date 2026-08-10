// src/app/news/newsListClient.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type NewsListItem = {
  id: string;
  slug: string;
  title: string;
  publishDate: string | null;
  summary: string | null;
  body: string | null;
  imageUrl: string | null;
  imageAlt: string;
  objectPosition?: string;

  authorName?: string | null;
  authorSlug?: string | null;

  audience?: { name: string; slug: string }[];
  programArea?: { name: string; slug: string }[];
  centers?: { title: string; slug: string }[];
};

function formatPublishDate(d?: string | null) {
  if (!d) return "";
  // Accept YYYYMMDD, YYYY-MM-DD, ISO
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

function cleanText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function pickPreview(summary?: string | null, body?: string | null) {
  if (summary && cleanText(summary)) return cleanText(summary);
  if (body && cleanText(body)) return cleanText(body);
  return "";
}

export default function NewsListClient({ items }: { items: NewsListItem[] }) {
  const [visibleCount, setVisibleCount] = useState(12);

  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  return (
    <div className="stack-6">
      <div className="divide-y divide-neutral-200">
        {visible.map((n) => {
          const dateLabel = formatPublishDate(n.publishDate);
          const preview = pickPreview(n.summary, n.body);

          return (
            <article key={n.id} className="py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                {/* Left image */}
                <Link
                  href={`/news/${n.slug}`}
                  className="block w-full sm:w-[220px] shrink-0 overflow-hidden rounded-xl bg-neutral-100"
                  aria-label={`Read: ${n.title}`}
                >
                  <div className="relative aspect-[4/3] w-full">
                    {n.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt={n.imageAlt || n.title}
                        className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                        style={
                          n.objectPosition
                            ? { objectPosition: n.objectPosition }
                            : undefined
                        }
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-full w-full bg-neutral-100" />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </Link>

                {/* Right content */}
                <div className="min-w-0 flex-1">
                  {dateLabel ? (
                    <p className="text-sm text-neutral-600">{dateLabel}</p>
                  ) : (
                    <p className="text-sm text-neutral-600">&nbsp;</p>
                  )}

                  <h2 className="mt-1 text-xl font-semibold leading-snug text-gmcc-navy">
                    <Link href={`/news/${n.slug}`} className="hover:underline underline-offset-4">
                      {n.title}
                    </Link>
                  </h2>

                  {/* Preview with fade */}
                  {preview ? (
                    <div className="relative mt-2">
                      <p className="body text-neutral-700 leading-relaxed line-clamp-2">{preview}</p>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <Link href={`/news/${n.slug}`} className="text-sm font-semibold text-gmcc-teal hover:underline">
                      View more →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setVisibleCount((c) => Math.min(c + 12, items.length))}
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}
