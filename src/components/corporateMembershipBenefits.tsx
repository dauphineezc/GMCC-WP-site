export type CorporateBenefitCard = {
  header: string;
  description: string;
};

const HEX =
  "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]";

function BenefitNumberBadge({ n }: { n: number }) {
  const label = String(n).padStart(2, "0");
  return (
    <div
      className={`relative z-10 mx-auto flex h-12 w-12 shrink-0 items-center justify-center bg-gmcc-teal font-heading text-lg font-bold text-white md:h-14 md:w-14 md:text-xl ${HEX}`}
      aria-hidden
    >
      {label}
    </div>
  );
}

export default function CorporateMembershipBenefits({
  sectionTitle,
  benefits,
}: {
  sectionTitle: string;
  benefits: CorporateBenefitCard[];
}) {
  if (benefits.length === 0) return null;
  const gridColsClass = benefits.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5";

  return (
    <section className="relative mt-4 scroll-mt-24" aria-labelledby="corporate-membership-benefits-heading">

      {/* Top wave (above navy body; not covered by background) */}
      <div className="relative z-[1] pointer-events-none w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 120"
          className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="
              M-20,110
              C750,-90  800,120  1200,80
              S1420,0 1460,0
              L1460,0 L-20,0 Z
            "
            transform="translate(0 120) scale(1 -1)"
            fill="var(--gmcc-navy)"
          />
        </svg>
      </div>

      <div className="relative z-0 -mt-px bg-gmcc-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-12 md:py-16 justify-center">
        {(sectionTitle) ? <h2 className="h2 text-center text-white">{sectionTitle}</h2> : null}

        <ul className={`mt-12 grid list-none grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-14 ${gridColsClass} lg:gap-5`}>
          {benefits.map((b, i) => (
            <li key={`${i}-${b.header}`} className="group">
              <div className="relative flex h-full flex-col rounded-2xl border card card-hover px-4 pt-8 text-center shadow-sm md:px-5 md:pt-10">
                <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <BenefitNumberBadge n={i + 1} />
                </div>

                <h3 className="font-heading text-base font-bold leading-snug text-gmcc-navy md:text-lg">
                  {b.header}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 md:text-sm">
                  {b.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      </div>

      {/* Bottom wave (below navy body) */}
      <div className="relative z-[1] pointer-events-none -mt-px w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 390 120"
          className="block h-14 w-full text-gmcc-navy md:hidden"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="
          M0,98
          C78,62 135,54 195,74
          C255,96 322,88 390,60
          L390,0 L0,0 Z
        "
            fill="currentColor"
          />
        </svg>

        <svg
          viewBox="0 0 1440 120"
          className="hidden h-16 w-full text-gmcc-navy md:block"
          preserveAspectRatio="none"
          aria-hidden
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
