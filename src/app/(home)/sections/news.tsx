// src/app/(home)/sections/NewsSection.tsx
type Linkish = { title?: string | null; url?: string | null };

export default function NewsSection({
  heading,
  items,
  cta,
}: {
  heading: string;
  items: Array<{
    id: string;
    title?: string | null;
    uri?: string | null;
    date?: string | null;
    featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
  }>;
  cta?: Linkish | null;
}) {
  if (!items?.length) return null;

  const [featured, ...rest] = items;

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gmcc-navy md:text-3xl">{heading}</h2>
          {cta?.url ? (
            <a href={cta.url} className="text-sm font-semibold underline hover:translate-y-[-2px] hover:text-gmcc-teal">
              {cta.title || "View all"}
            </a>
          ) : null}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Featured */}
          <a href={featured.uri ?? "#"} className="md:col-span-2 overflow-hidden rounded-2xl bg-neutral-100">
            {featured.featuredImage?.node?.sourceUrl ? (
              <img
                src={featured.featuredImage.node.sourceUrl}
                alt={featured.featuredImage.node.altText ?? ""}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div className="aspect-[16/9] w-full bg-neutral-200" />
            )}
            <div className="p-6">
              <div className="text-lg font-semibold">{featured.title}</div>
              {featured.date ? <div className="mt-2 text-xs text-neutral-600">{new Date(featured.date).toLocaleDateString()}</div> : null}
            </div>
          </a>

          {/* Side list */}
          <div className="grid gap-6">
            {rest.slice(0, 2).map((p) => (
              <a key={p.id} href={p.uri ?? "#"} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="grid grid-cols-3">
                  <div className="col-span-1 bg-neutral-100">
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
                  <div className="col-span-2 p-4">
                    <div className="text-sm font-semibold leading-snug text-gmcc-navy">{p.title}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
