// src/app/(home)/sections/NewsSection.tsx

type Linkish = { title?: string | null; url?: string | null };

type NewsItem = {
  id: string;
  title?: string | null;
  uri?: string | null;
  date?: string | null;
  newsFields?: { body?: string | null };
  featuredImage?: {
    node?: { sourceUrl: string; altText?: string | null } | null;
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
  const t = new Date(date).getTime();
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
  items: NewsItem[];
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

  // tweak to match your design
  const CARD_HEIGHT = "h-[220px] sm:h-[240px]"; // fixed card height

  return (
    <section className="relative overflow-hidden pb-0 pt-16 pb-10">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="h2 tracking-wide text-gmcc-navy text-3xl text-center">
          {heading}
        </h2>

        {cta?.url ? (
          <a
            href={cta.url}
            className="block text-right text-sm text-gmcc-navy font-semibold underline hover:translate-y-[-2px] hover:text-gmcc-teal"
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
              className={`group card card-hover card-link overflow-hidden p-0 ${CARD_HEIGHT}`}
            >
              <div className="grid h-full grid-cols-5">
                <div className="col-span-2 bg-neutral-100">
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
                  <div className="text-sm font-semibold leading-snug text-gmcc-navy group-hover:text-gmcc-teal line-clamp-3">
                    {p.title}
                  </div>

                  {p._excerpt ? (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-700 line-clamp-4">
                      {p._excerpt}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-500 line-clamp-4">
                      {/* keeps heights consistent even if excerpt is missing */}
                      &nbsp;
                    </p>
                  )}

                  <div className="mt-auto pt-3 text-sm font-semibold text-gmcc-teal underline underline-offset-2 group-hover:text-gmcc-teal">
                    Keep reading →
                  </div>
                </div>
              </div>
            </a>
          ))}

          {/* Subscribe card (same fixed height + layout) */}
          <div className={`card overflow-hidden p-0 ${CARD_HEIGHT}`}>
            <div className="grid h-full grid-cols-1 bg-gmcc-navy">

              <div className="col-span-1 flex h-full flex-col p-6">
                <div className="text-3xl font-semibold leading-snug text-white line-clamp-2">
                  {newsletterSubscriptionHeader || "Stay in the loop"}
                </div>

                <p className="mt-1 text-base leading-relaxed text-neutral-200 line-clamp-4">
                  {newsletterSubscriptionSubtext ||
                    "Get updates about programs, events, and community news."}
                </p>

                <div className="mt-4 pt-2">
                  <div className="w-full px-10">
                    <span className="sr-only pl-4">Enter your email address</span>
                    <input type="email" placeholder="Enter your email address" className="w-full p-1 rounded-md border border-white bg-white text-neutral-700" />
                  </div>
                  <div className="flex justify-center mt-3">
                    <a href={cta?.url ?? "#"} className="btn btn-secondary">
                      Subscribe
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: if you want to ensure line-clamp works everywhere, keep Tailwind's line-clamp plugin enabled */}
      </div>
    </section>
  );
}