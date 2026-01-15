// app/membership/exploreMembershipsClient.tsx

"use client";

import { useMemo, useState } from "react";
import FinancialAidEstimator from "@/components/financialAidEstimator";
import HeaderImage from "@/components/headerImage";

export type Audience = { name: string; slug: string };
export type ProgramArea = { name: string; slug: string };

export type Membership = {
  slug: string;
  title: string;
  hero: { url: string; alt: string } | null;
  summary: string | null;
  pricing: {
    tier: string | null;
    monthly: number | null;
    annual: number | null;
    joiningFee: number | null;
  };
  audience: Audience[];
  programArea: ProgramArea[];
  benefits: string[];
};

type CenterLink = {
  slug: string;
  label: string;
};

type Props = {
  centerLinks: CenterLink[];
  audiences: Audience[];
  programAreas: ProgramArea[];
  memberships: Membership[];
};

export default function ExploreMembershipsClient({
  centerLinks,
  audiences,
  programAreas,
  memberships,
}: Props) {

  /** ---------------------------
   *  FILTER STATE
   * ----------------------------*/
  const [audienceFilter, setAudienceFilter] = useState<string>("");
  const [programAreaFilters, setProgramAreaFilters] = useState<string[]>([]);

  /** ---------------------------
   *  CAROUSEL STATE
   * ----------------------------*/
  const [currentRecIndex, setCurrentRecIndex] = useState(0);
  const VISIBLE_RECS = 3;

  /** ---------------------------
   *  COMPARE STATE
   * ----------------------------*/
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);

  const toggleCompare = (slug: string) => {
    setComparedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  const removeFromCompare = (slug: string) => {
    setComparedSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const comparedMemberships = useMemo(
    () => memberships.filter((m) => comparedSlugs.includes(m.slug)),
    [memberships, comparedSlugs]
  );

  /** ---------------------------
   *  FILTER MEMBERSHIPS
   * ----------------------------*/
  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      const matchesAudience = audienceFilter
        ? m.audience.some((a) => a.slug === audienceFilter)
        : true;

      const matchesProgramArea = programAreaFilters.length
        ? programAreaFilters.every((sel) =>
            m.programArea.some((p) => p.slug === sel)
          )
        : true;

      return matchesAudience && matchesProgramArea;
    });
  }, [memberships, audienceFilter, programAreaFilters]);

  /** ---------------------------
   *  CAROUSEL VISIBLE ITEMS
   * ----------------------------*/
  // Calculate page-based navigation (no overlap)
  const totalPages = Math.ceil(filteredMemberships.length / VISIBLE_RECS);
  const maxRecIndex = Math.max(0, (totalPages - 1) * VISIBLE_RECS);

  const visibleRecommended = useMemo(
    () =>
      filteredMemberships.slice(
        currentRecIndex,
        currentRecIndex + VISIBLE_RECS
      ),
    [filteredMemberships, currentRecIndex]
  );

  /** ---------------------------
   *  (then your return JSX goes here…)
   * ----------------------------*/


  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/MembershipHeaderImage.png" alt="Greater Midland Memberships" />
      </div>

      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 section-y stack-8">

      {/* TOP HEADER */}
      <section className="stack-2">
        <div className="inline-block">
          <h1 className="h1">Greater Midland Memberships</h1>
        </div>
      </section>

      {/* FIND THE RIGHT MEMBERSHIP */}
      <section className="stack-2">
        <h2 className="h2">Find the Right Membership</h2>
        <p className="body">
          Not sure which option is the best fit? Start by browsing memberships by
          center, or answer a couple of quick questions and we&apos;ll suggest
          memberships that match what you&apos;re looking for.
        </p>
      </section>

      {/* BROWSE BY CENTER - simple text links */}
      <section className="stack-2">
        <p className="small">Browse by center:</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {centerLinks.map((c) => (
            <a key={c.slug} href={`/membership/${c.slug}`} className="link body">
              {c.label}
            </a>
          ))}
        </div>
      </section>

      {/* GUIDED QUESTIONNAIRE - Timeline/Stepper */}
      <section className="stack-2">
        <p className="small mb-4">Get personalized recommendations:</p>
        
        <div className="relative">
          {/* Vertical line - centered through circles at left-0, circle is 2rem wide so center at 1rem */}
          <div className="absolute left-[calc(1rem-1px)] top-4 bottom-4 w-0.5 bg-gmcc-navy" />
          
          {/* Step 1: Audience */}
          <div className="relative pb-8">
            <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-gmcc-navy text-white small font-semibold">
              1
            </div>
            <div className="ml-12 flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <label className="body whitespace-nowrap">
                Who is the membership for?
              </label>
              <select
                className="rounded border border-neutral-300 bg-white px-3 py-1.5 body min-w-[150px] shadow-sm"
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
              >
                <option value="">Anyone</option>
                {audiences.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Program Areas as checkboxes */}
          <div className="relative pb-8">
            <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-gmcc-navy text-white small font-semibold">
              2
            </div>
            <div className="ml-12 flex flex-col sm:flex-row sm:items-start gap-3 pt-1">
              <label className="body block sm:pt-1">
                What type of program(s) are you looking for?
              </label>
              <div className="rounded border border-neutral-300 bg-white px-3 py-1.5 inline-block min-w-[150px] shadow-sm">
                <div className="stack-2">
                  {programAreas.map((p) => (
                    <label key={p.slug} className="flex items-center gap-2 body cursor-pointer">
                      <input
                        type="checkbox"
                        checked={programAreaFilters.includes(p.slug)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProgramAreaFilters([...programAreaFilters, p.slug]);
                          } else {
                            setProgramAreaFilters(programAreaFilters.filter((s) => s !== p.slug));
                          }
                        }}
                        className="h-4 w-4 rounded border-neutral-300 text-gmcc-navy focus:ring-gmcc-navy"
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Recommended Memberships */}
          <div className="relative pb-8">
            <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-gmcc-navy text-white small font-semibold">
              3
            </div>
            <div className="ml-12 pt-1">
              <h3 className="h3 mb-3">Recommended Memberships:</h3>

              {filteredMemberships.length === 0 ? (
                <p className="body">
                  No memberships match those filters yet. Try changing your selections or
                  contact us and we&apos;ll help you find a fit.
                </p>
              ) : (
                <div className="stack-4">
                  {/* Header row with count + arrows */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="small">
                      Showing{" "}
                      <span className="font-medium">
                        {currentRecIndex + 1}-
                        {Math.min(currentRecIndex + VISIBLE_RECS, filteredMemberships.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{filteredMemberships.length}</span>{" "}
                      recommended memberships
                    </p>

                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentRecIndex((i) => Math.max(0, i - VISIBLE_RECS))
                        }
                        disabled={currentRecIndex === 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100"
                        aria-label="Previous memberships"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentRecIndex((i) => Math.min(maxRecIndex, i + VISIBLE_RECS))
                        }
                        disabled={currentRecIndex >= maxRecIndex}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100"
                        aria-label="Next memberships"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Membership cards */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    {visibleRecommended.map((m) => (
                      <article key={m.slug} className="flex flex-col card">
                        <div className="stack-2">
                          <h4 className="h3 text-gmcc-navy leading-tight">{m.title}</h4>

                          <div className="stack-2 body">
                            {m.pricing.monthly != null && (
                              <div>
                                <span className="text-neutral-500">Monthly:</span>{" "}
                                <span className="font-bold">
                                  ${Math.round(m.pricing.monthly)}
                                </span>
                              </div>
                            )}
                            {m.pricing.annual != null && (
                              <div>
                                <span className="text-neutral-500">Annual:</span>{" "}
                                <span className="font-bold">
                                  ${Math.round(m.pricing.annual)}
                                </span>
                              </div>
                            )}
                            {m.pricing.joiningFee != null && (
                              <div className="small">
                                One-time impact fee: ${Math.round(m.pricing.joiningFee)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto pt-4 stack-2">
                          {m.benefits && m.benefits.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleCompare(m.slug)}
                              className={`btn w-full ${
                                comparedSlugs.includes(m.slug)
                                  ? "btn-secondary"
                                  : "btn-primary"
                              }`}
                            >
                              {comparedSlugs.includes(m.slug) ? "Remove from Compare" : "View and Compare Benefits"}
                            </button>
                          ) : (
                            <span className="btn w-full bg-neutral-200 text-neutral-500 cursor-not-allowed">
                              No benefits listed
                            </span>
                          )}
                          <a
                            href={'https://register.greatermidland.org/webtrac/web/search.html?Action=Start'}
                            className="btn btn-secondary w-full"
                          >
                            Join or Renew
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Compare Options */}
          <div className="relative">
            <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-gmcc-navy text-white small font-semibold">
              4
            </div>
            <div className="ml-12 pt-1">
              <h3 className="h3 mb-3">Compare Options:</h3>

              {comparedMemberships.length === 0 ? (
                <p className="body">
                  Click &quot;View and Compare Benefits&quot; on the memberships above to compare them side by side.
                </p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {comparedMemberships.map((m) => (
                    <article
                      key={m.slug}
                      className="flex flex-col rounded-lg border-2 border-gmcc-blue-light bg-gmcc-blue-light/10 p-4 min-w-[260px] max-w-[320px] flex-1"
                    >
                      {/* Close button */}
                      <div className="flex justify-end mb-1">
                        <button
                          type="button"
                          onClick={() => removeFromCompare(m.slug)}
                          className="small text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                        >
                          <span>✕</span> Close
                        </button>
                      </div>

                      {/* Title */}
                      <h4 className="h3 text-gmcc-navy leading-tight text-center mb-3">
                        {m.title}
                      </h4>

                      {/* Benefits list */}
                      <ul className="stack-2 body text-center flex-1">
                        {m.benefits.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>

                      {/* Join button */}
                      <div className="mt-4 pt-3 border-t border-neutral-200">
                        <a
                          href="https://register.greatermidland.org/webtrac/web/search.html?Action=Start"
                          className="btn btn-primary w-full"
                        >
                          Join or Renew
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>


    {/* Financial aid estimator stub */}
    <h2 className="h2 mb-3">Financial assistance</h2>
    <p className="body mt-3 mb-3">
        Greater Midland Community Center strives to ensure wellness, education, recreation and social programming remains available, accessible and affordable to Midland County 
        residents and employees. With the support of United Way of Midland County we are pleased to provide scholarship assistance to qualifying families and individuals.
    </p>
    <FinancialAidEstimator />


      {/* GENERIC MEMBERSHIP INFO SECTIONS */}
      <section className="grid gap-6 lg:grid-cols-2 mt-6">

        {/* FAQ stub */}
        <div className="card">
          <h2 className="h2">Membership FAQs</h2>
          <ul className="mt-3 stack-4 body">
            <li>How do I add family members to my membership?</li>
            <li>How do I change my membership?</li>
            <li>Can I pause or freeze my membership?</li>
            <li className="mt-1">
              <a href="/membership-faq" className="link">
                View all membership FAQs →
              </a>
            </li>
          </ul>
        </div>

        {/* Insurance-based memberships (SilverSneakers etc.) */}
        <div className="card">
          <h2 className="h2">Insurance-based memberships</h2>
          <p className="mt-2 body">
            Certain health plans include memberships like{" "}
            <strong>SilverSneakers</strong>, <strong>Renew Active</strong>, or
            other wellness benefits. If you&apos;re 60+ or on Medicare, you may
            qualify for a free or reduced-cost membership.
          </p>
          <p className="mt-2 body">
            Bring your insurance card to the front desk or contact us and we
            can help you check eligibility.
          </p>
          <a href="/insurance-memberships" className="link body mt-3 block">
            Learn more about insurance-based options →
          </a>
        </div>
      </section>
      </div>
    </main>
  );
}