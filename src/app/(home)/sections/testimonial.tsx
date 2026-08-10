// src/app/(home)/sections/TestimonialSection.tsx

import { mediaFocalPositionCss, type MediaFocalPointFields } from "@/lib/mediaFocalPoint";

type PhotoNode = {
  sourceUrl?: string | null;
  altText?: string | null;
} & MediaFocalPointFields;

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
      photo?: {
        node?: PhotoNode | null;
      } | null;
    } | null;
  } | null;
}) {
  if (!testimonial?.id) return null;

  const f = testimonial.testimonialFields;
  const photoNode = f?.photo?.node;
  const photoObjectPosition = mediaFocalPositionCss(photoNode);

  return (
    <section className="page-section">
      <div className="mx-auto max-w-6xl">
        <div className="relative text-center">
          <h2 className="h2 pt-6 text-gmcc-navy">{heading}</h2>
        </div>

        <div>
          <figure className="mx-auto max-w-3xl pb-14 md:pb-8">
            <div className="text-5xl mb-0 leading-none text-gmcc-teal/50">“</div>

            <blockquote className="mt-0 text-lg leading-relaxed text-neutral-700 text-center">
              {f?.quote ?? ""}
            </blockquote>

            {(f?.personName || f?.personContext || photoNode?.sourceUrl) ? (
              <figcaption className="mt-6 flex items-center justify-center gap-3 text-left">
                {photoNode?.sourceUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoNode.sourceUrl}
                    alt={photoNode.altText ?? ""}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                    style={
                      photoObjectPosition
                        ? { objectPosition: photoObjectPosition }
                        : undefined
                    }
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
