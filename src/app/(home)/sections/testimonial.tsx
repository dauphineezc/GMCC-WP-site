// src/app/(home)/sections/TestimonialSection.tsx

export default function TestimonialSection({
  heading,
  testimonial,
}: {
  heading: string;
  testimonial: {
    id: string;
    testimonialFields?: {
      quote?: string | null;
      personName?: string | null;
      personContext?: string | null;
      featuredImage?: {
        node?: { sourceUrl: string; altText?: string | null } | null;
      } | null;
    } | null;
  } | null;
}) {
  if (!testimonial?.id) return null;

  const f = testimonial.testimonialFields;

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="relative text-center">
          <h2 className="h2 text-gmcc-navy">{heading}</h2>
        </div>

        <div>
          <figure className="mx-auto max-w-3xl">
            <div className="text-5xl mb-0 leading-none text-gmcc-teal/50">“</div>

            <blockquote className="mt-0 text-lg leading-relaxed text-neutral-700 text-center">
              {f?.quote ?? ""}
            </blockquote>

            {(f?.personName || f?.personContext || f?.featuredImage?.node?.sourceUrl) ? (
              <figcaption className="mt-6 flex items-center justify-center gap-3 text-left">
                {f?.featuredImage?.node?.sourceUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.featuredImage.node.sourceUrl}
                    alt={f.featuredImage.node.altText ?? ""}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}

                <div className="small text-center">
                  {f?.personName ? (
                    <div className="font-semibold text-neutral-900">{f.personName}</div>
                  ) : null}
                  {f?.personContext ? <div>{f.personContext}</div> : null}
                </div>
              </figcaption>
            ) : null}
          </figure>
        </div>
      </div>
    </section>
  );
}
