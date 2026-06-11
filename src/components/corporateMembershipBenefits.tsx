import NavyWaveSection from "@/components/navyWaveSection";

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
    <NavyWaveSection
      className="mt-4 scroll-mt-24"
      fullBleed={false}
      bandClassName="pt-16 pb-12 md:py-16"
    >
      {sectionTitle ? (
        <h2 id="corporate-membership-benefits-heading" className="h2 text-center text-white">
          {sectionTitle}
        </h2>
      ) : null}

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
    </NavyWaveSection>
  );
}
