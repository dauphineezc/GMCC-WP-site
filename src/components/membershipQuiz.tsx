"use client";

import { useMemo, useState, useCallback } from "react";
import { computeMembershipPricingSavings } from "@/lib/membershipPricingSavings";

export type Audience = {
  name: string;
  slug: string;
  quizProgramAreaKeys?: string[];
};
export type ProgramArea = { name: string; slug: string };

export type Membership = {
  slug: string;
  title: string;
  hero: { url: string; alt: string } | null;
  summary: string | null;
  joinRenewLink?: { url: string; label: string; target?: string | null } | null;
  pricing: {
    tier: string | null;
    monthly: number | null;
    annually: number | null;
    joiningFee: number | null;
    paymentSplit: { frequency: string; cost: number | null } | null;
  };
  audience: Audience[];
  programArea: ProgramArea[];
  benefits: string[];
};

type Props = {
  audiences: Audience[];
  programAreas: ProgramArea[];
  memberships: Membership[];
  onClose?: () => void;
};

type Step = "audience" | "programArea" | "results";

/** Match ACF checkbox values to taxonomy program areas (slug or display name). */
function filterProgramAreasForQuiz(
  all: ProgramArea[],
  keys: string[] | undefined
): ProgramArea[] {
  if (!keys?.length) return all;
  const wanted = new Set(keys.map((k) => k.toLowerCase()));
  const matched = all.filter(
    (p) =>
      wanted.has(p.slug.toLowerCase()) || wanted.has(p.name.toLowerCase())
  );
  return matched.length > 0 ? matched : all;
}

function getMembershipTierName(title: string): string {
  let separatorIndex = title.indexOf(" – ");
  if (separatorIndex < 0) separatorIndex = title.indexOf(" - ");
  if (separatorIndex > 0) return title.substring(0, separatorIndex).trim();
  if (title.includes("Membership")) return title.replace("Membership", "").trim();
  return title.trim();
}

function getAudienceFromTitle(title: string): string {
  let separatorIndex = title.indexOf(" – ");
  if (separatorIndex < 0) separatorIndex = title.indexOf(" - ");
  if (separatorIndex > 0) return title.substring(separatorIndex + 3).trim();
  return "";
}

function labelLooksSenior(label: string): boolean {
  return label.toLowerCase().includes("senior");
}

function labelLooksAdult(label: string): boolean {
  const aud = label.toLowerCase();
  if (
    aud.includes("youth") ||
    aud.includes("junior") ||
    aud.includes("young") ||
    aud.includes("family") ||
    aud.includes("senior")
  ) {
    return false;
  }
  return (
    (aud.includes("adult") && !aud.includes("young")) ||
    aud.includes("individual") ||
    (aud.includes("25") && aud.includes("over"))
  );
}

function membershipMatchesAudienceLabels(
  m: Membership,
  predicate: (label: string) => boolean
): boolean {
  if (m.audience.some((a) => predicate(a.slug) || predicate(a.name))) return true;
  const fromTitle = getAudienceFromTitle(m.title);
  return fromTitle ? predicate(fromTitle) : false;
}

function isSeniorAudienceSelection(
  audienceFilter: string,
  audiences: Audience[]
): boolean {
  if (!audienceFilter) return false;
  if (labelLooksSenior(audienceFilter)) return true;
  const selected = audiences.find((a) => a.slug === audienceFilter);
  return selected ? labelLooksSenior(selected.name) : false;
}

export default function MembershipQuiz({
  audiences,
  programAreas,
  memberships,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("audience");
  const [audienceFilter, setAudienceFilter] = useState<string>("");
  const [programAreaFilters, setProgramAreaFilters] = useState<string[]>([]);
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);

  const handleAudienceSelect = useCallback((slug: string) => {
    setAudienceFilter(slug);
    setProgramAreaFilters([]);
    setStep("programArea");
  }, []);

  const handleProgramAreaToggle = useCallback((slug: string) => {
    setProgramAreaFilters((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const handleSeeResults = useCallback(() => {
    setStep("results");
  }, []);

  const handleBack = useCallback(() => {
    if (step === "results") setStep("programArea");
    else if (step === "programArea") setStep("audience");
  }, [step]);

  const handleRestart = useCallback(() => {
    setAudienceFilter("");
    setProgramAreaFilters([]);
    setComparedSlugs([]);
    setStep("audience");
  }, []);

  const toggleCompare = useCallback((slug: string) => {
    setComparedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const filteredMemberships = useMemo(() => {
    const matchesProgramArea = (m: Membership) =>
      programAreaFilters.length
        ? programAreaFilters.every((sel) =>
            m.programArea.some((p) => p.slug === sel)
          )
        : true;

    if (!audienceFilter) {
      return memberships.filter(matchesProgramArea);
    }

    // Senior: prefer senior-specific variants per membership tier/center;
    // fall back to adult when that tier has no senior option.
    if (isSeniorAudienceSelection(audienceFilter, audiences)) {
      const byTier = new Map<string, Membership[]>();
      for (const m of memberships) {
        const tier = getMembershipTierName(m.title);
        const list = byTier.get(tier) ?? [];
        list.push(m);
        byTier.set(tier, list);
      }

      const chosen: Membership[] = [];
      for (const variants of byTier.values()) {
        const seniors = variants.filter((m) =>
          membershipMatchesAudienceLabels(m, labelLooksSenior)
        );
        const adults = variants.filter((m) =>
          membershipMatchesAudienceLabels(m, labelLooksAdult)
        );
        const pick = seniors.length > 0 ? seniors : adults;
        for (const m of pick) {
          if (matchesProgramArea(m)) chosen.push(m);
        }
      }
      return chosen;
    }

    return memberships.filter(
      (m) =>
        m.audience.some((a) => a.slug === audienceFilter) &&
        matchesProgramArea(m)
    );
  }, [memberships, audienceFilter, programAreaFilters, audiences]);

  const comparedMemberships = useMemo(
    () => memberships.filter((m) => comparedSlugs.includes(m.slug)),
    [memberships, comparedSlugs]
  );

  const stepNumber = step === "audience" ? 1 : step === "programArea" ? 2 : 3;
  const selectedAudience = audiences.find((a) => a.slug === audienceFilter);
  const selectedAudienceName = selectedAudience?.name ?? "Anyone";

  const audienceQuizKeys = selectedAudience?.quizProgramAreaKeys;

  const quizProgramAreas = useMemo(
    () =>
      audienceFilter
        ? filterProgramAreasForQuiz(programAreas, audienceQuizKeys)
        : programAreas,
    [programAreas, audienceFilter, audienceQuizKeys]
  );

  const quizUsesAudienceProgramAreas = Boolean(
    audienceFilter &&
      audienceQuizKeys?.length &&
      quizProgramAreas.length < programAreas.length
  );

  return (
    <div className="rounded-2xl mt-16 border border-neutral-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gmcc-navy px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Membership Quiz
            </h3>
            <p className="mt-1 text-sm text-white/70">
              Step {stepNumber} of 3 — {step === "audience" && "Who is the membership for?"}
              {step === "programArea" && "What are you looking for?"}
              {step === "results" && "Your recommendations"}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close quiz"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-full rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gmcc-green-light transition-all duration-500"
            style={{ width: `${(stepNumber / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {/* Step 1: Audience Selection */}
        {step === "audience" && (
          <div className="space-y-4">
            <p className="body font-medium">Who is the membership for?</p>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleAudienceSelect("")}
                className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  audienceFilter === ""
                    ? "border-gmcc-navy bg-gmcc-navy/5"
                    : "border-neutral-200 hover:border-gmcc-navy/40"
                }`}
              >
                <span className="font-semibold text-gmcc-navy">Not sure yet</span>
                <span className="mt-0.5 block text-xs text-neutral-500">Show me all options</span>
              </button>
              {audiences.map((a) => (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => handleAudienceSelect(a.slug)}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    audienceFilter === a.slug
                      ? "border-gmcc-navy bg-gmcc-navy/5"
                      : "border-neutral-200 hover:border-gmcc-navy/40"
                  }`}
                >
                  <span className="font-semibold text-gmcc-navy">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Program Area Selection */}
        {step === "programArea" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-gmcc-navy transition-colors"
                aria-label="Go back"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="body font-medium">
                What type of program(s) are you looking for?
              </p>
            </div>
            <p className="text-xs text-neutral-500">
              Selected audience: <span className="font-semibold">{selectedAudienceName}</span>
              {quizUsesAudienceProgramAreas
                ? " · Only program areas that apply to this audience are shown. Select all that apply, or skip."
                : " · Select all that apply, or skip to see all."}
            </p>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {quizProgramAreas.map((p) => {
                const isSelected = programAreaFilters.includes(p.slug);
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => handleProgramAreaToggle(p.slug)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      isSelected
                        ? "border-gmcc-navy bg-gmcc-navy/5"
                        : "border-neutral-200 hover:border-gmcc-navy/40"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs transition-colors ${
                        isSelected
                          ? "border-gmcc-navy bg-gmcc-navy text-white"
                          : "border-neutral-300"
                      }`}
                    >
                      {isSelected && "✓"}
                    </span>
                    <span className="font-semibold text-gmcc-navy">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeeResults}
                className="btn btn-primary flex-1"
              >
                See My Results
              </button>
              <button
                type="button"
                onClick={() => {
                  setProgramAreaFilters([]);
                  handleSeeResults();
                }}
                className="btn btn-secondary"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-gmcc-navy transition-colors"
                  aria-label="Go back"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="body font-medium">
                  Your Recommended Memberships
                </p>
              </div>
              <button
                type="button"
                onClick={handleRestart}
                className="text-xs font-semibold text-gmcc-navy hover:underline"
              >
                Retake Quiz
              </button>
            </div>

            {filteredMemberships.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                <p className="body">
                  No memberships match those filters yet. Try different selections or{" "}
                  <button type="button" onClick={handleRestart} className="font-semibold text-gmcc-navy underline">
                    retake the quiz
                  </button>.
                </p>
              </div>
            ) : (
              <>
                <p className="small">
                  We found <span className="font-semibold">{filteredMemberships.length}</span>{" "}
                  membership{filteredMemberships.length !== 1 && "s"} that match your needs.
                </p>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMemberships.map((m) => {
                    const pricingSavings = computeMembershipPricingSavings(m.pricing);
                    return (
                    <article key={m.slug} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <h4 className="h3 text-gmcc-navy leading-tight">{m.title}</h4>

                      <div className="mt-3 space-y-1 text-sm">
                        {m.pricing.monthly != null && (
                          <div>
                            <span className="text-neutral-500">Monthly:</span>{" "}
                            <span className="font-bold">${Math.round(m.pricing.monthly)}</span>
                          </div>
                        )}
                        {m.pricing.paymentSplit != null && m.pricing.paymentSplit.cost != null && (
                          <div>
                            <span className="text-neutral-500">{m.pricing.paymentSplit.frequency}:</span>{" "}
                            <span className="font-bold">${Math.round(m.pricing.paymentSplit.cost)}</span>
                            {pricingSavings.splitVsMonthlyPercent != null &&
                              pricingSavings.splitVsMonthlyPercent > 0 && (
                              <span className="ml-1.5 font-semibold text-xs text-gmcc-green">
                                {" "}
                                (Save {pricingSavings.splitVsMonthlyPercent}%)
                              </span>
                            )}
                          </div>
                        )}
                        {m.pricing.annually != null && (
                          <div>
                            <span className="text-neutral-500">Annually:</span>{" "}
                            <span className="font-bold">${Math.round(m.pricing.annually)}</span>
                            {pricingSavings.annualVsMonthlyPercent != null &&
                              pricingSavings.annualVsMonthlyPercent > 0 && (
                              <span className="ml-1.5 font-semibold text-xs text-gmcc-green">
                                {" "}
                                (Save {pricingSavings.annualVsMonthlyPercent}%)
                              </span>
                            )}
                          </div>
                        )}
                        {m.pricing.joiningFee != null && (
                          <div className="text-xs text-neutral-400">
                            One-time impact fee: ${Math.round(m.pricing.joiningFee)}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-4 space-y-2">
                        {m.benefits && m.benefits.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleCompare(m.slug)}
                            className={`btn w-full text-xs ${
                              comparedSlugs.includes(m.slug) ? "btn-secondary" : "btn-primary"
                            }`}
                          >
                            {comparedSlugs.includes(m.slug) ? "Remove from Compare" : "Compare Benefits"}
                          </button>
                        )}
                        {m.joinRenewLink ? (
                          <a
                            href={m.joinRenewLink.url}
                            target={m.joinRenewLink.target ?? "_blank"}
                            rel="noopener noreferrer"
                            className="btn btn-secondary w-full text-xs"
                          >
                            {m.joinRenewLink.label}
                          </a>
                        ) : null}
                      </div>
                    </article>
                    );
                  })}
                </div>

                {/* Comparison panel */}
                {comparedMemberships.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-neutral-200">
                    <h4 className="h3">Side-by-Side Comparison</h4>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {comparedMemberships.map((m) => (
                        <div
                          key={m.slug}
                          className="flex flex-col rounded-xl border-2 border-gmcc-blue-light bg-gmcc-blue-light/10 p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-heading font-semibold text-gmcc-navy text-sm leading-tight">
                              {m.title}
                            </h5>
                            <button
                              type="button"
                              onClick={() => toggleCompare(m.slug)}
                              className="ml-2 shrink-0 text-neutral-400 hover:text-red-500 transition-colors"
                              aria-label={`Remove ${m.title} from comparison`}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <ul className="space-y-1.5 text-xs text-neutral-700 flex-1">
                            {m.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <svg className="mt-0.5 h-3 w-3 shrink-0 text-gmcc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                          {m.joinRenewLink ? (
                            <a
                              href={m.joinRenewLink.url}
                              target={m.joinRenewLink.target ?? "_blank"}
                              rel="noopener noreferrer"
                              className="btn btn-primary w-full text-xs mt-3"
                            >
                              {m.joinRenewLink.label}
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
