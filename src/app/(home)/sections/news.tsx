// src/app/(home)/sections/NewsSection.tsx

type Linkish = { title?: string | null; url?: string | null };

type NewsItem = {
  id: string;
  title?: string | null;
  uri?: string | null;
  date?: string | null;
  newsFields?: { body?: string | null };
  featuredImage?: {
    node?: { sourceUrl?: string | null; altText?: string | null } | null;
  } | null;
};

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeDateValue(date?: string | null) {
  if (!date) return 0;
  if (/^\d{8}$/.test(date)) {
    const yyyy = Number(date.slice(0, 4));
    const mm = Number(date.slice(4, 6));
    const dd = Number(date.slice(6, 8));
    return new Date(yyyy, mm - 1, dd).valueOf();
  }
  const t = Date.parse(date);
  return Number.isFinite(t) ? t : 0;
}

export default function NewsSection({
  heading,
  items,
  cta,
  newsletterSubscriptionHeader,
  newsletterSubscriptionSubtext,
}: {
  heading: string;
  items?: NewsItem[];
  cta?: Linkish | null;
  newsletterSubscriptionHeader?: string | null;
  newsletterSubscriptionSubtext?: string | null;
}) {
  if (!items?.length) return null;

  // Always pick the most recent 3 (regardless of API order)
  const sorted = [...items].sort(
    (a, b) => safeDateValue(b.date) - safeDateValue(a.date)
  );
  const top3 = sorted.slice(0, 3);
  if (top3.length === 0) return null;

  const articleCards = top3.map((p) => ({
    ...p,
    _excerpt: stripHtml(p.newsFields?.body ?? ""),
  }));

  // Fixed height tall enough for the subscribe card (title + subtext + input + button + padding)
  // All 4 cards share the same value so every card in the 2-col grid looks identical.
  const CARD_H = "h-[250px]";

  return (
    <section className="page-section relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="h2 text-center">
          {heading}
        </h2>

        {cta?.url ? (
          <a
            href={cta.url}
            className="block text-center mt-2 md:text-right md:mt-0 text-sm text-gmcc-navy font-semibold underline hover:translate-y-[-2px] hover:text-gmcc-teal"
          >
            {cta.title || "View all"}
          </a>
        ) : null}

        {/* 4-card grid: 3 articles + 1 subscribe CTA */}
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {articleCards.map((p) => (
            <a
              key={p.id}
              href={p.uri ?? "#"}
              aria-label={p.title ?? "Read news item"}
              className={`group card card-hover card-link overflow-hidden p-0 ${CARD_H}`}
            >
              <div className="grid h-full grid-cols-5">
                <div className="col-span-2 h-full overflow-hidden bg-neutral-100">
                  {p.featuredImage?.node?.sourceUrl ? (
                    <img
                      src={p.featuredImage.node.sourceUrl}
                      alt={p.featuredImage.node.altText ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-neutral-200" />
                  )}
                </div>

                <div className="col-span-3 flex h-full flex-col p-5">
                  <div className="text-base font-semibold leading-snug text-gmcc-navy group-hover:text-gmcc-teal line-clamp-2">
                    {p.title}
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-neutral-700 line-clamp-4">
                    {p._excerpt || "\u00a0"}
                  </p>

                  <div className="mt-auto pt-2 text-sm font-semibold text-gmcc-teal group-hover:underline underline-offset-2 group-hover:translate-y-[-2px]">
                    Keep reading →
                  </div>
                </div>
              </div>
            </a>
          ))}

          {/* Subscribe card */}
          <div className={`card overflow-hidden p-0 ${CARD_H}`}>
            <div className="flex h-full flex-col bg-gmcc-navy p-6">
              <div className="text-xl font-semibold leading-snug text-white">
                Subscribe to <span className="italic">Greater Life</span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-neutral-200 line-clamp-3">
                {newsletterSubscriptionSubtext ||
                  "Get updates about programs, events, and community news."}
              </p>

              <div className="mt-auto space-y-3">
                <span className="sr-only">Enter your email address</span>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full rounded-md border border-white bg-white px-3 py-2 text-sm text-neutral-700"
                />
                <div className="flex justify-center">
                  <a href={cta?.url ?? "#"} className="btn btn-secondary">
                    Subscribe
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}