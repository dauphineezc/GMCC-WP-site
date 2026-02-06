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
    <section className="py-14">
      <div className="relative mx-auto max-w-6xl overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt || ""}
              className="h-full w-[70%] object-cover"
            />
          ) : (
            <div className="h-full w-[70%] bg-neutral-200" />
          )}
        </div>

        {/* Gradient overlay - fades to white on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-white w-[70%]" />

        {/* Content overlay */}
        <div className="relative flex min-h-[400px] items-center justify-end px-4 py-12 md:px-8">
          <div className="w-full max-w-md md:max-w-lg">
            {/* {eyebrow ? <p className="text-sm font-semibold tracking-wide text-neutral-500">{eyebrow}</p> : null} */}
            <h2 className="text-2xl font-semibold tracking-tight text-gmcc-navy md:text-3xl">
              {heading}
            </h2>

            {body ? (
              <div
                className="prose prose-neutral mt-4 max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : null}

            {cta?.url ? (
              <div className="mt-6 text-center">
                <a
                  href={cta.url}
                  target={cta.target || undefined}
                  className="btn btn-primary"
                >
                  {cta.title || "Learn more"}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
