// src/app/(home)/sections/about.tsx
type Linkish = { title?: string | null; url?: string | null; target?: string | null };

export default function AboutSection({
  eyebrow,
  heading,
  body,
  imageUrl,
  imageAlt,
  cta,
}: {
  eyebrow: string;
  heading: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string;
  cta?: Linkish | null;
}) {
  return (
    <section className="relative -mt-10 overflow-hidden bg-gmcc-navy px-4 pt-16 pb-10 md:-mt-10 md:pt-20">

      <div className="relative z-20 mx-auto max-w-6xl pb-20 md:pb-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-start">
          <div className="relative overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageAlt || ""}
                className="block h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="aspect-square bg-neutral-200" />
            )}
          </div>

          <div className="flex flex-col text-right md:text-left items-center md:items-start">
            <h2 className="h2 mb-0 text-3xl font-semibold tracking-wide text-white">{heading}</h2>

            {body ? <p className="mt-4 text-base leading-relaxed text-neutral-200">{body}</p> : null}

            {cta?.url ? (
              <div className="mt-6 flex w-full justify-center">
                <a href={cta.url} target={cta.target || undefined} className="btn btn-secondary">
                  {cta.title || "Learn more about our mission"}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom transition wave (same pattern used in impact) */}
      <div className="pointer-events-none absolute bottom-[-32px] left-0 z-10 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 -12 390 132"
          className="block h-20 w-full text-white md:hidden [transform:scaleY(-1)]"
          preserveAspectRatio="none"
        >
          <path
            d="
              M0,100
              C70,70 130,58 190,78
              C250,98 305,90 390,62
              L390,0 L0,0 Z
            "
            fill="currentColor"
          />
        </svg>

        <svg
          viewBox="0 -60 1440 180"
          className="hidden h-24 w-full text-white md:block [transform:scaleY(-1)]"
          preserveAspectRatio="none"
        >
          <path
            d="
              M0,110
              C300,-50  500,120  800,100
              S1000,0 1440,0
              L1440,0 L0,0 Z
            "
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}