// src/app/(home)/sections/about.tsx
type Linkish = { title?: string | null; url?: string | null; target?: string | null };

export default function AboutSection({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta?: Linkish | null;
}) {
  return (
    <section className="relative -mt-15 overflow-hidden bg-gmcc-navy px-4 pb-50">

      <div className="relative z-20 mx-auto max-w-6xl pb-20 md:pb-24">

      <div className="flex flex-col text-center items-center">
        <h2 className="h2 text-white">{heading}</h2>

        {body ? <p className="mt-6 text-lg text-neutral-200">{body}</p> : null}

        {cta?.url ? (
          <div className="mt-8 mb-8 md:mb-16 flex w-full justify-center">
            <a href={cta.url} target={cta.target || undefined} className="btn btn-secondary">
              {cta.title || "Learn more about our mission"}
            </a>
          </div>
        ) : null}
      </div>
      </div>


      <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden border-0">
          <img
            src="/LineArt.png"
            alt=""
            className="absolute bottom-[140px] left-1/2 w-full max-w-[1440px] -translate-x-1/2 px-8 select-none opacity-100"
            draggable={false}
          />
        </div>

      {/* Bottom transition wave */}
      <div className="pointer-events-none absolute bottom-[-32px] left-0 z-10 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 -12 390 132"
          className="block h-20 w-full text-white md:hidden [transform:scaleY(-1)]"
          preserveAspectRatio="none"
        >
          <path
            d="
              M0,100
              C70,100 130,100 190,100
              C250,100 305,100 390,100
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
              C300,-20  620,150  850,110
              S1200,20 1440,90
              L1440,0 L0,0 Z
            "
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}