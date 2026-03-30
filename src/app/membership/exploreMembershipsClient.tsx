// app/membership/exploreMembershipsClient.tsx

"use client";

import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import FinancialAidEstimator from "@/components/financialAidEstimator";
import MembershipQuiz from "@/components/membershipQuiz";
import AmenitiesGrid from "@/components/amenitiesGrid";
import type { AmenityDisplay } from "@/types/amenities";
import { getBodyParts } from "@/components/centerCampaignModule";
import FeaturedCampaignSection from "@/app/(home)/sections/featuredCampaign";

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
    annually: number | null;
    joiningFee: number | null;
    paymentSplit: { frequency: string; cost: number | null } | null;
  };
  audience: Audience[];
  programArea: ProgramArea[];
  benefits: string[];
};

type CenterLink = {
  slug: string;
  label: string;
};

export type MembershipPageFields = {
  header: string | null;
  subheader: string | null;
  heroImage: { url: string; alt: string } | null;
  primaryCta: { url: string; label: string } | null;
  quizCta: { url: string; label: string } | null;
  centers: CenterLink[];
  membershipsHeader: string | null;
  membershipsDescription: string | null;
  quizHeader: string | null;
  quizDescription: string | null;
  benefitsHeader: string | null;
  benefitsDescription: string | null;
  amenitySlugs: string[];
  financialAssistanceHeader: string | null;
  financialAssistanceSubheader: string | null;
  financialAssistanceDescription: string | null;
  financialAssistanceCta: { url: string; label: string } | null;
  contactHeader: string | null;
  contactDescription: string | null;
  campaign: {
    title?: string | null;
    uri?: string | null;
    featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
    campaignFields?: {
      headline?: string | null;
      body?: string | null;
      primaryCta?: { primaryCtaLabel?: string | null; primaryCtaUrl?: string | null } | null;
      secondaryCta?: { secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null } | null;
    } | null;
  } | null;
  campaignBgColor: string | null;
  campaignTextColor: string | null;
  footerPhoto: { url: string; alt: string } | null;
};

export type SerializedAmenity = {
  name: string;
  slug: string;
  description: string | null;
  relevantLink: string | null;
  linkLabel: string | null;
  defaultImage: { sourceUrl: string; altText: string | null } | null;
  centerImageCandidates: {
    centerSlug: string;
    image: { sourceUrl: string; altText: string | null };
  }[];
};

type Props = {
  centerLinks: CenterLink[];
  audiences: Audience[];
  programAreas: ProgramArea[];
  memberships: Membership[];
  fields: MembershipPageFields;
  amenities: SerializedAmenity[];
};

export default function ExploreMembershipsClient({
  centerLinks,
  audiences,
  programAreas,
  memberships,
  fields,
  amenities,
}: Props) {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"compare" | "quiz">("compare");
  const [activeCenter, setActiveCenter] = useState(centerLinks[0]?.slug ?? "");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const quizRef = useRef<HTMLDivElement>(null);
  const membershipsRef = useRef<HTMLDivElement>(null);
  const plansSectionRef = useRef<HTMLElement | null>(null);

  /** Deep link: /membership?center=tennis-center#plans */
  useLayoutEffect(() => {
    const raw = searchParams.get("center");
    if (!raw) return;
    const normalized = raw.trim().toLowerCase();
    const match = centerLinks.find(
      (c) => c.slug === raw || c.slug.toLowerCase() === normalized
    );
    if (match) setActiveCenter(match.slug);
  }, [searchParams, centerLinks]);

  /**
   * App Router often does not scroll to `#plans` on client navigations.
   * Scroll after paint when we have a deep link (?center=… and/or #plans).
   */
  useEffect(() => {
    if (activeTab !== "compare") return;
    if (typeof window === "undefined") return;

    const hash = window.location.hash.replace(/^#/, "").toLowerCase();
    const hasCenterParam = Boolean(searchParams.get("center")?.trim());
    if (hash !== "plans" && !hasCenterParam) return;

    const scrollPlans = () => {
      const el = plansSectionRef.current ?? document.getElementById("plans");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollPlans();
    const t0 = window.setTimeout(scrollPlans, 0);
    const t1 = window.setTimeout(scrollPlans, 120);
    const t2 = window.setTimeout(scrollPlans, 350);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [activeTab, searchParams]);

  const amenityDisplayItems: AmenityDisplay[] = useMemo(() => {
    return amenities
      .map((a) => {
        const centerMatch = a.centerImageCandidates.find(
          (c) => c.centerSlug === activeCenter
        );
        if (!centerMatch) return null;

        return {
          name: a.name,
          slug: a.slug,
          description: a.description ?? null,
          relevantLink: a.relevantLink ?? null,
          linkLabel: a.linkLabel ?? null,
          image: centerMatch.image,
        };
      })
      .filter(Boolean) as AmenityDisplay[];
  }, [amenities, activeCenter]);

  const getMembershipTierName = useCallback((title: string): string => {
    let separatorIndex = title.indexOf(" – ");
    if (separatorIndex < 0) separatorIndex = title.indexOf(" - ");
    if (separatorIndex > 0) return title.substring(0, separatorIndex).trim();
    if (title.includes("Membership")) return title.replace("Membership", "").trim();
    return title.trim();
  }, []);

  const getAudienceFromTitle = useCallback((title: string): string => {
    let separatorIndex = title.indexOf(" – ");
    if (separatorIndex < 0) separatorIndex = title.indexOf(" - ");
    if (separatorIndex > 0) return title.substring(separatorIndex + 3).trim();
    return "Member";
  }, []);

  type TierGroup = {
    tierName: string;
    variants: Membership[];
  };

  const { intro, bullets } = getBodyParts(fields.quizDescription);

  const isCorporateCenter = activeCenter.toLowerCase().includes("corteva") ||
    activeCenter.toLowerCase().includes("corporate");

  const isActivityPassTitle = useCallback((title: string) => {
    return title.toLowerCase().includes("activity pass");
  }, []);

  /** Community Center only: activity pass shown as a fourth, secondary card */
  const activityPassTier: TierGroup | null = useMemo(() => {
    if (!activeCenter || isCorporateCenter) return null;
    const centerName = centerLinks.find((c) => c.slug === activeCenter)?.label ?? "";
    const centerLower = centerName.toLowerCase();
    const isCommunity =
      centerLower.includes("community") ||
      activeCenter.toLowerCase().includes("community");
    if (!isCommunity) return null;

    const variants = memberships.filter((m) => isActivityPassTitle(m.title));
    if (variants.length === 0) return null;

    const tierName = getMembershipTierName(variants[0]!.title);
    return {
      tierName,
      variants: variants.sort((a, b) => {
        const aAud = getAudienceFromTitle(a.title).toLowerCase();
        const bAud = getAudienceFromTitle(b.title).toLowerCase();
        const audOrder = (s: string) =>
          s.includes("youth") ? 0 : s.includes("adult") ? 1 : s.includes("family") ? 2 : 3;
        return audOrder(aAud) - audOrder(bAud);
      }),
    };
  }, [
    memberships,
    activeCenter,
    centerLinks,
    isCorporateCenter,
    getMembershipTierName,
    getAudienceFromTitle,
    isActivityPassTitle,
  ]);

  const tierGroups: TierGroup[] = useMemo(() => {
    if (!activeCenter || isCorporateCenter) return [];
    const centerName = centerLinks.find((c) => c.slug === activeCenter)?.label ?? "";
    const centerLower = centerName.toLowerCase();
    const isCommunity =
      centerLower.includes("community") ||
      activeCenter.toLowerCase().includes("community");

    const relevantMemberships = memberships.filter((m) => {
      const title = m.title.toLowerCase();
      if (isActivityPassTitle(m.title)) return false;

      if (isCommunity) {
        return (
          (title.includes("center") || title.includes("all access")) &&
          !title.includes("north") &&
          !title.includes("coleman") &&
          !title.includes("tennis") &&
          !title.includes("curling")
        );
      }
      const centerKeyword = centerLower.split(" ")[0];
      return title.includes(centerKeyword) || title.includes("all access");
    });

    const groupMap = new Map<string, Membership[]>();
    for (const m of relevantMemberships) {
      const tier = getMembershipTierName(m.title);
      const existing = groupMap.get(tier) ?? [];
      existing.push(m);
      groupMap.set(tier, existing);
    }

    const TIER_ORDER: Record<string, number> = {
      center: 0,
      "center plus": 1,
      "all access": 2,
    };

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => {
        const aOrder = TIER_ORDER[a.toLowerCase()] ?? 99;
        const bOrder = TIER_ORDER[b.toLowerCase()] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.localeCompare(b);
      })
      .map(([tierName, variants]) => ({
        tierName,
        variants: variants.sort((a, b) => {
          const aAud = getAudienceFromTitle(a.title).toLowerCase();
          const bAud = getAudienceFromTitle(b.title).toLowerCase();
          const audOrder = (s: string) =>
            s.includes("youth") ? 0 : s.includes("adult") ? 1 : s.includes("family") ? 2 : 3;
          return audOrder(aAud) - audOrder(bAud);
        }),
      }));
  }, [
    memberships,
    activeCenter,
    centerLinks,
    isCorporateCenter,
    getMembershipTierName,
    getAudienceFromTitle,
    isActivityPassTitle,
  ]);

  const scrollToQuiz = () => {
    setActiveTab("quiz");
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden md:mt-28 py-6">
        <div
          className="absolute inset-0"
          aria-hidden
          style={
          fields.heroImage?.url ? {
              backgroundImage: `url(${fields.heroImage.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
            : undefined
          }
        />

        {/* Left-side navy overlay */}
        <div
          className="absolute inset-0"
          style={{
          background:
            "linear-gradient(90deg, rgba(0,34,68,1) 0%, rgba(0,34,68,0.95) 10%, rgba(0,34,68,0.70) 30%, rgba(0,0,0,0) 70%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0" aria-hidden />
        <div className="relative z-20 max-w-6xl px-8 pb-20 pt-10 md:py-16 md:px-12">
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:mt-8 md:text-6xl">
            {fields.header}
          </h1>

          {fields.subheader ? (
          <p className="mt-6 mb-4 max-w-3xl text-base leading-relaxed text-neutral-100 md:text-lg">
            {fields.subheader}
          </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {fields.primaryCta ? (
                <div className="mt-4 mb-6">
                <a href={fields.primaryCta.url} className="btn btn-tertiary">
                    {fields.primaryCta.label}
                </a>
                </div>
            ) : null}
            {fields.quizCta ? (
                <div className="mt-4 mb-6">
                <button
                      type="button"
                      onClick={scrollToQuiz}
                      className="btn btn-secondary justify-center"
                    >
                      {fields.quizCta?.label || "Take our Membership Quiz"}
                    </button>
                </div>
            ) : null}
          </div>
        </div>

        {/* Wave */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
            <svg
                viewBox="0 0 1440 120"
                className="-ml-px block h-10 w-[calc(100%+2px)] text-white md:h-16"
                preserveAspectRatio="none"
            >
              <path
                d="
                    M-20,110
                    C750,-90  800,120  1200,80
                    S1420,0 1460,0
                    L1460,0 L-20,0 Z
                "
                transform="translate(0 120) scale(1 -1)"
                fill="currentColor"
                />
            </svg>
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white" />
        </div>
      </section>

      {/* COMPARE TAB CONTENT */}
      {activeTab === "compare" && (
        <div>

          {/* SEE WHAT YOU CAN GET — Amenities */}
          {amenityDisplayItems.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 py-8 pt-12">
              <h2 className="h2 mb-2">
                {fields.benefitsHeader || "See What You Can Get with Your Membership"}
              </h2>
              {fields.benefitsDescription && (
                <p className="body mb-8 max-w-2xl">
                  {fields.benefitsDescription}
                </p>
              )}
              <AmenitiesGrid amenities={amenityDisplayItems} title="" numCols={4} />
            </section>
          )}

          {/* CENTER TAB NAVIGATION + MEMBERSHIP CARDS */}
          <section
            id="plans"
            ref={plansSectionRef}
            className="scroll-mt-28 md:scroll-mt-32"
          >
            <div className="mx-auto max-w-6xl px-4 py-8">
              <h2 className="h2 mb-2">{fields.membershipsHeader}</h2>
              <p className="body mb-8 max-w-2xl">
                {fields.membershipsDescription}
              </p>

              {/* Center tabs */}
              <div ref={membershipsRef} className="mb-8 flex flex-wrap gap-2 scroll-mt-24">
                {centerLinks.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setActiveCenter(c.slug);
                      setTimeout(() => {
                        membershipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 50);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      activeCenter === c.slug
                        ? "bg-gmcc-navy text-white shadow-md"
                        : "bg-white text-gmcc-navy border border-neutral-200 hover:border-gmcc-navy/40"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Membership tier cards */}
              {isCorporateCenter ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
                  <h3 className="h3 mb-2">Corporate Wellness</h3>
                  <p className="body mb-4">
                    Corporate memberships are available through Corporate partners. Please visit the dedicated page for pricing and enrollment details.
                  </p>
                  <a href="/membership/corporate" className="btn btn-primary">
                    View Corporate Wellness Options
                  </a>
                </div>
              ) : tierGroups.length > 0 || activityPassTier ? (
                <div className="space-y-8">
                  {tierGroups.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {tierGroups.map((group) => (
                        <TierCard
                          key={`${activeCenter}-${group.tierName}`}
                          tierName={group.tierName}
                          variants={group.variants}
                          getAudienceFromTitle={getAudienceFromTitle}
                        />
                      ))}
                    </div>
                  ) : null}
                  {activityPassTier ? (
                      <div className="flex justify-center lg:justify-start">
                        <div className="w-full max-w-sm">
                          <TierCard
                            key={`${activeCenter}-${activityPassTier.tierName}`}
                            tierName={activityPassTier.tierName}
                            variants={activityPassTier.variants}
                            getAudienceFromTitle={getAudienceFromTitle}
                            secondary
                          />
                        </div>
                      </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                  <p className="body">
                    No memberships found for this center. Visit the{" "}
                    <a href={`/membership/${activeCenter}`} className="link">
                      center membership page
                    </a>{" "}
                    for full details.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* QUIZ CTA SECTION */}
          <section>
            <div className="mt-12 card bg-gmcc-navy text-white mx-auto max-w-6xl px-12 py-8">
              <div className="grid gap-4 md:grid-cols-2 items-center">
                <div className="col-span-1 gap-4">
                  <h2 className="h2 mb-4 text-white">
                    {fields.quizHeader || "Quick path to get the right fit"}
                  </h2>
                  <p className="body max-w-md text-neutral-200">
                    {intro}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {bullets.map((item: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-base text-neutral-200">
                        <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-1 flex flex-col items-center justify-center text-center card bg-white px-6 py-4 text-gmcc-navy">
                    <p className="small mt-2 text-gmcc-navy">
                      Perfect for first-time visitors who are not sure which membership to choose
                    </p>
                    <button
                      type="button"
                      onClick={scrollToQuiz}
                      className="btn btn-tertiary mt-6"
                    >
                      {fields.quizCta?.label || "Take our Membership Quiz"}
                    </button>
                </div>
              </div>
            </div>
          </section>

          {/* FINANCIAL ASSISTANCE */}
          <section>
            <div className="mx-auto max-w-6xl px-4 py-16 sm:py-16">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] items-center">
                <div>
                  <h2 className="h2">
                    {fields.financialAssistanceHeader || "Financial Assistance"}
                  </h2>
                  <p className="eyebrow mt-2">
                    {fields.financialAssistanceSubheader || "Need help covering membership costs?"}
                  </p>
                  {fields.financialAssistanceDescription && (
                    <p className="body mt-3 max-w-xl">
                      {fields.financialAssistanceDescription}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {fields.financialAssistanceCta?.url ? (
                    <a
                      href={fields.financialAssistanceCta.url}
                      className="btn btn-primary"
                    >
                      {fields.financialAssistanceCta.label || "Apply / Get Started"}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED CAMPAIGN */}
          {fields.campaign && (
            <section className="relative mt-12" style={{ backgroundColor: fields.campaignBgColor ?? "#ffffff" }}>
              <FeaturedCampaignSection campaign={fields.campaign} bgColor={fields.campaignBgColor ?? "#ffffff"} textColor={fields.campaignTextColor ?? "#003A70"} />
            </section>
          )}

          {/* CONTACT CTA */}
          <section>
            <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16 text-center">
              <h2 className="font-heading text-2xl font-bold text-gmcc-navy sm:text-3xl">
                {fields.contactHeader}
              </h2>
              <p className="mt-3 text-gmcc-navy/70 max-w-xl mx-auto">
                {fields.contactDescription}
              </p>
              <a
                href="https://register.greatermidland.org/webtrac/web/search.html?Action=Start"
                className="btn bg-gmcc-navy text-white hover:bg-neutral-100 mt-6 text-base px-8 py-3"
              >
                Contact Us
              </a>
            </div>
          </section>

        </div>
      )}

      {/* FOOTER PHOTO — wave overlaps top, photo tucks behind footer */}
      {fields.footerPhoto && (
        <section className="relative z-10 -mb-10 md:-mb-14">
          <img
            src={fields.footerPhoto.url}
            alt={fields.footerPhoto.alt}
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
          <div className="pointer-events-none absolute top-0 left-0 z-20 w-full overflow-hidden leading-none">
            <svg
              viewBox="0 0 1440 120"
              className="-ml-px block h-10 w-[calc(100%+2px)] text-white md:h-16"
              preserveAspectRatio="none"
            >
              <path
                d="
                  M-20,110
                  C750,-90  800,120  1200,80
                  S1420,0 1460,0
                  L1460,0 L-20,0 Z
                "
                fill="currentColor"
              />
            </svg>
          </div>
        </section>
      )}

      {/* QUIZ TAB CONTENT */}
      {activeTab === "quiz" && (
        <div ref={quizRef} className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <MembershipQuiz
            audiences={audiences}
            programAreas={programAreas}
            memberships={memberships}
            onClose={() => setActiveTab("compare")}
          />
        </div>
      )}
    </main>
  );
}

const VISIBLE_BENEFITS = 5;

/** A single tier card with audience-switching pills */
function TierCard({
  tierName,
  variants,
  getAudienceFromTitle,
  secondary = false,
}: {
  tierName: string;
  variants: Membership[];
  getAudienceFromTitle: (title: string) => string;
  secondary?: boolean;
}) {
  const defaultIdx = variants.findIndex((v) => {
    const aud = getAudienceFromTitle(v.title).toLowerCase();
    return aud.includes("adult") && !aud.includes("young");
  });
  const [selectedIdx, setSelectedIdx] = useState(defaultIdx >= 0 ? defaultIdx : 0);
  const [benefitsExpanded, setBenefitsExpanded] = useState(false);
  const selected = variants[selectedIdx] ?? variants[0];
  if (!selected) return null;

  const hiddenCount = Math.max(0, selected.benefits.length - VISIBLE_BENEFITS);
  const shownBenefits = benefitsExpanded
    ? selected.benefits
    : selected.benefits.slice(0, VISIBLE_BENEFITS);

  const articleClass = secondary
    ? "flex flex-col rounded-2xl border border-neutral-300 bg-neutral-50 shadow-none overflow-hidden ring-1 ring-neutral-100"
    : "flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden";

  return (
    <article className={articleClass}>
      {selected.hero && (
        <div className={`relative bg-neutral-100 ${secondary ? "h-32 opacity-90" : "h-40"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.hero.url}
            alt={selected.hero.alt}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className={`flex flex-col flex-1 ${secondary ? "p-4" : "p-5"}`}>
        <h3
          className={`font-heading font-bold text-gmcc-navy ${
            secondary ? "text-lg text-gmcc-navy" : "text-xl"
          }`}
        >
          {tierName}
        </h3>

        {/* Pricing */}
        <div className="mt-3 space-y-1 text-sm">
          {selected.pricing.monthly != null && (
            <div>
              <span className={`font-bold ${secondary ? "text-3xl" : "text-4xl"}`}>
                ${Math.round(selected.pricing.monthly)}
              </span>
              <span className="text-neutral-500">/month</span>
            </div>
          )}
          {selected.pricing.paymentSplit?.cost != null && (
            <div>
              <span className="text-neutral-500">{selected.pricing.paymentSplit.frequency}:</span>{" "}
              <span className="font-bold">${Math.round(selected.pricing.paymentSplit.cost)}</span>
            </div>
          )}
          {selected.pricing.annually != null && (
            <div>
              <span className="text-neutral-500">Annual:</span>{" "}
              <span className="font-bold">${Math.round(selected.pricing.annually)}</span>
            </div>
          )}
          {selected.pricing.joiningFee != null && (
            <div className="text-xs text-neutral-400">
              One-time impact fee: ${Math.round(selected.pricing.joiningFee)}
            </div>
          )}
        </div>

        {/* Audience pills */}
        {variants.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {variants.map((v, i) => {
              const aud = getAudienceFromTitle(v.title);
              return (
                <button
                  key={v.slug}
                  type="button"
                  onClick={() => {
                    setSelectedIdx(i);
                    setBenefitsExpanded(false);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedIdx === i
                      ? "bg-gmcc-navy text-white shadow-sm"
                      : "bg-neutral-100 text-gmcc-navy hover:bg-neutral-200"
                  }`}
                >
                  {aud}
                </button>
              );
            })}
          </div>
        )}

        {selected.summary && (
          <p className="small mt-3">{selected.summary}</p>
        )}

        {/* Benefits — show first 5 then fade + "see X more" */}
        {selected.benefits.length > 0 && (
          <div className="mt-3 relative">
            <ul className="space-y-1">
              {shownBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-neutral-600">
                  <svg className="mt-0.5 h-3 w-3 shrink-0 text-gmcc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            {!benefitsExpanded && hiddenCount > 0 && (
              <>
                <div
                  className={`pointer-events-none absolute bottom-6 left-0 right-0 h-8 bg-gradient-to-t to-transparent ${
                    secondary ? "from-neutral-50" : "from-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setBenefitsExpanded(true)}
                  className="mt-1 text-xs font-semibold text-gmcc-navy hover:underline"
                >
                  See {hiddenCount} more benefit{hiddenCount !== 1 && "s"}
                </button>
              </>
            )}

            {benefitsExpanded && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setBenefitsExpanded(false)}
                className="mt-1 text-xs font-semibold text-gmcc-navy hover:underline"
              >
                Show less
              </button>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <a
            href="https://register.greatermidland.org/webtrac/web/search.html?Action=Start"
            className={secondary ? "btn btn-secondary w-full" : "btn btn-primary w-full"}
          >
            Join Now
          </a>
        </div>
      </div>
    </article>
  );
}
