// app/membership/exploreMembershipsClient.tsx

"use client";

import { useMemo, useState } from "react";
import FinancialAidEstimator from "@/components/financialAidEstimator";

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
  const maxRecIndex = Math.max(0, filteredMemberships.length - VISIBLE_RECS);

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
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      {/* TOP INTRO */}
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Find the right membership
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
          Not sure which option is the best fit? Start by browsing memberships by
          center, or answer a couple of quick questions and we&apos;ll suggest
          memberships that match what you&apos;re looking for.
        </p>
      </section>

      {/* BROWSE BY CENTER */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Browse by center
        </h2>
        <p className="text-xs text-neutral-600">
          View all memberships based at each location.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {centerLinks.map((c) => (
            <a
              key={c.slug}
              href={`/membership/${c.slug}`}
              className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:border-emerald-500/70 hover:shadow-md transition"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700">
                  {c.label}
                </h3>
                {/* <p className="text-xs text-neutral-600">
                  View all memberships based at this location.
                </p> */}
              </div>
              <span className="mt-3 inline-flex text-[11px] font-medium text-emerald-700">
                Explore &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* GUIDED QUESTIONNAIRE */}
      <section className="space-y-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Not sure where to start?
            </h2>
            <p className="text-sm text-neutral-600">
              Answer the questions below and we&apos;ll recommend memberships
              that fit your situation.
            </p>
          </div>
          {(audienceFilter || programAreaFilters.length) && (
            <button
              type="button"
              onClick={() => {
                setAudienceFilter("");
                setProgramAreaFilters([]);
              }}
              className="text-xs text-blue-600 hover:underline self-start sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Audience dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">
              Who is the membership for?
            </label>
            <select
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
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

          {/* Program area MULTI-select */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">
              What type of program(s) are you looking for?{" "}
              <span className="font-normal text-neutral-500">
                (Select one or more)
              </span>
            </label>
            <select
              multiple
              className="h-34 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              value={programAreaFilters}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions
                ).map((opt) => opt.value);
                setProgramAreaFilters(selected);
              }}
            >
              {programAreas.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-500">
              Tip: On desktop, hold <strong>Ctrl</strong> (Windows) or{" "}
              <strong>Cmd</strong> (Mac) to select multiple; on mobile, tap each
              item.
            </p>
          </div>
        </div>

        {/* Recommended memberships */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">
            Recommended memberships
          </h3>

          {filteredMemberships.length === 0 ? (
            <p className="text-sm text-neutral-600">
                No memberships match those filters yet. Try changing your selections or
                contact us and we&apos;ll help you find a fit.
            </p>
            ) : (
            <div className="space-y-3">
                {/* Header row with count + arrows */}
                <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-neutral-600">
                    Showing{" "}
                    <span className="font-medium">
                    {currentRecIndex + 1}–
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-sm text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-sm text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next memberships"
                    >
                    ›
                    </button>
                </div>
                </div>

                {/* One row of cards */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {visibleRecommended.map((m) => (
                    <article
                    key={m.slug}
                    className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-neutral-900">
                        {m.title}
                        </h4>

                        {m.pricing.tier && (
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            {m.pricing.tier}
                        </p>
                        )}

                        <div className="space-y-0.5 text-xs text-neutral-800">
                        {m.pricing.monthly != null && (
                            <div>
                            <span className="text-neutral-500">Monthly: </span>
                            <span className="font-semibold">
                                ${m.pricing.monthly.toFixed(2)}
                            </span>
                            </div>
                        )}
                        {m.pricing.annual != null && (
                            <div>
                            <span className="text-neutral-500">Annual: </span>
                            <span className="font-semibold">
                                ${m.pricing.annual.toFixed(2)}
                            </span>
                            </div>
                        )}
                        </div>

                        {m.summary && (
                        <p className="text-xs text-neutral-600 line-clamp-3">
                            {m.summary}
                        </p>
                        )}
                    </div>

                    <div className="mt-auto pt-3 space-y-2">
                        <a
                        href={`/membership/${m.slug}`}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                        View details
                        </a>
                    </div>
                    </article>
                ))}
                </div>
            </div>
            )}
        </div>
      </section>


    {/* Financial aid estimator stub */}
    <h2 className="text-base font-semibold text-neutral-900" style={{ marginBottom: '12px' }}>
        Financial assistance
    </h2>
    <p className="mt-1 text-sm text-neutral-600" style={{ marginTop: '12px', marginBottom: '12px', justifyContent: 'center' }}>
        Greater Midland Community Center strives to ensure wellness, education, recreation and social programming remains available, accessible and affordable to Midland County residents and employees. With the support of United Way of Midland County we are pleased to provide scholarship assistance to qualifying families and individuals.
    </p>
    <FinancialAidEstimator />


      {/* GENERIC MEMBERSHIP INFO SECTIONS */}
      <section className="grid gap-6 md:grid-cols-2">

        {/* FAQ stub */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" style={{ marginTop: '24px' }}>
          <h2 className="text-base font-semibold text-neutral-900">
            Membership FAQs
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-neutral-700">
            <li>• How do I add family members to my membership?</li>
            <li>• How do I change my membership?</li>
            <li>• Can I pause or freeze my membership?</li>
            <li className="mt-1">
              <a
                href="/membership-faq"
                className="text-blue-600 hover:underline"
              >
                View all membership FAQs →
              </a>
            </li>
          </ul>
        </div>

        {/* Insurance-based memberships (SilverSneakers etc.) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" style={{ marginTop: '24px' }}>
          <h2 className="text-base font-semibold text-neutral-900">
            Insurance-based memberships
          </h2>
          <p className="mt-2 text-xs text-neutral-700">
            Certain health plans include memberships like{" "}
            <strong>SilverSneakers</strong>, <strong>Renew Active</strong>, or
            other wellness benefits. If you&apos;re 60+ or on Medicare, you may
            qualify for a free or reduced-cost membership.
          </p>
          <p className="mt-2 text-xs text-neutral-700">
            Bring your insurance card to the front desk or contact us and we
            can help you check eligibility.
          </p>
          <a
            href="/insurance-memberships"
            className="mt-3 inline-flex text-xs text-blue-600 hover:underline"
          >
            Learn more about insurance-based options →
          </a>
        </div>
      </section>
    </main>
  );
}