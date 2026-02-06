// src/app/(home)/sections/TestimonialsSection.tsx
export default function TestimonialsSection({
    heading,
    testimonials,
  }: {
    heading: string;
    testimonials: Array<{
      id: string;
      testimonialFields?: {
        quote?: string | null;
        personName?: string | null;
        personContext?: string | null;
        featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
      } | null;
    }>;
  }) {
    if (!testimonials?.length) return null;
  
    return (
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-500">{heading}</h2>
          </div>
  
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => {
              const f = t.testimonialFields;
              return (
                <figure key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

                {/* <figure key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"> */}
                  <div className="text-5xl leading-none text-neutral-300">“</div>
                  <blockquote className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {f?.quote ?? ""}
                  </blockquote>
                  <figcaption className="flex items-center gap-3 mt-4">
                    {f?.featuredImage?.node?.sourceUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                        src={f.featuredImage.node.sourceUrl}
                        alt={f.featuredImage.node.altText ?? ""}
                        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                        />
                    )}
                    <div className="small">
                        {f?.personName && (
                        <div className="font-semibold text-neutral-900">
                            {f?.personName}
                        </div>
                        )}
                        {f?.personContext && (
                        <div>{f?.personContext}</div>
                        )}
                    </div>
                    </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
  