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
import {
  pickAmenityImageForCenter,
  type AmenityWithImage,
} from "@/lib/amenities";
import { getBodyParts } from "@/components/centerCampaignModule";
import SimpleCampaign from "@/components/simpleCampaign";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import type { HeroCta } from "@/components/photoWaveHeader";
import NavyWaveSection from "@/components/navyWaveSection";
import { computeMembershipPricingSavings } from "@/lib/membershipPricingSavings";

export type Audience = {
  name: string;
  slug: string;
  /**
   * Selected values from audience taxonomy ACF (`audienceFields.programAreas` checkbox).
   * Matched against program area `slug` or `name` (case-insensitive) in the membership quiz.
   */
  quizProgramAreaKeys?: string[];
};
export type ProgramArea = { name: string; slug: string };

export type MembershipPayLink = {
  url: string;
  label: string;
  target: string | null;
};

export type Membership = {
  slug: string;
  title: string;
  hero: { url: string; alt: string } | null;
  summary: string | null;
  autoDraftLink: MembershipPayLink | null;
  manualPayLink: MembershipPayLink | null;
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
  /** From each center's `centersFields.amenities` in WordPress */
  amenitySlugs: string[];
};

export type MembershipPageFields = {
  quizCta: { url: string; label: string } | null;
  centers: CenterLink[];
  membershipsHeader: string | null;
  membershipsDescription: string | null;
  quizHeader: string | null;
  quizDescription: string | null;
  benefitsHeader: string | null;
  benefitsDescription: string | null;
  financialAssistanceHeader: string | null;
  financialAssistanceSubheader: string | null;
  financialAssistanceDescription: string | null;
  financialAssistanceCtas: { estimatorLabel: string; applicationCtaLabel: string; applicationPdf: string } | null;
  contactHeader: string | null;
  contactDescription: string | null;
  showCurrentPromotion: boolean;
  currentPromotion: {
    title?: string | null;
    uri?: string | null;
    featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
    campaignFields?: {
      headline?: string | null;
      body?: string | null;
      primaryCta?: { primaryCtaLabel?: string | null; primaryCtaUrl?: string | null } | null;
      secondaryCta?: { secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null } | null;
      backgroundColor?: string | null;
      textColor?: string | null;
      primaryCtaButtonColor?: string | null;
      secondaryCtaButtonColor?: string | null;
    } | null;
  } | null;
  campaign: {
    title?: string | null;
    uri?: string | null;
    featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
    campaignFields?: {
      headline?: string | null;
      body?: string | null;
      primaryCta?: { primaryCtaLabel?: string | null; primaryCtaUrl?: string | null } | null;
      secondaryCta?: { secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null } | null;
      backgroundColor?: string | null;
      textColor?: string | null;
      primaryCtaButtonColor?: string | null;
      secondaryCtaButtonColor?: string | null;
    } | null;
  } | null;
  healthy100Challenge: {
    title?: string | null;
    uri?: string | null;
    featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
    campaignFields?: {
      headline?: string | null;
      body?: string | null;
      primaryCta?: { primaryCtaLabel?: string | null; primaryCtaUrl?: string | null } | null;
      secondaryCta?: { secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null } | null;
      backgroundColor?: string | null;
      textColor?: string | null;
      primaryCtaButtonColor?: string | null;
      secondaryCtaButtonColor?: string | null;
    } | null;
  } | null;
};

export type SerializedAmenity = {
  name: string;
  slug: string;
  description: string | null;
  relevantLink: string | null;
  linkLabel: string | null;
  isService: boolean;
  isFeatured: boolean;
  defaultImage: { sourceUrl: string; altText: string | null } | null;
  centerImageCandidates: {
    centerSlug: string;
    centerTitle?: string | null;
    relevantLink?: string | null;
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
  heroTitle: string;
  heroSubheader?: string;
  heroImageUrl?: string;
  /** From WP heroFields primary + secondary CTAs */
  heroCtas?: HeroCta[] | null;
};

export default function ExploreMembershipsClient({
  centerLinks,
  audiences,
  programAreas,
  memberships,
  fields,
  amenities,
  heroTitle,
  heroSubheader,
  heroImageUrl,
  heroCtas,
}: Props) {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"compare" | "quiz" | "estimator">("compare");
  const [activeCenter, setActiveCenter] = useState(centerLinks[0]?.slug ?? "");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllTierCards, setShowAllTierCards] = useState(false);

  const quizRef = useRef<HTMLDivElement>(null);
  const membershipsRef = useRef<HTMLDivElement>(null);
  const plansSectionRef = useRef<HTMLElement | null>(null);
  const estimatorRef = useRef<HTMLDivElement>(null);

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
    const slugSet = new Set(
      centerLinks.find((c) => c.slug === activeCenter)?.amenitySlugs ?? []
    );
    return amenities
      .map((a) => {
        if (!slugSet.has(a.slug) || a.isService) return null;
        const image = pickAmenityImageForCenter(a as AmenityWithImage, activeCenter);
        if (!image) return null;

        return {
          name: a.name,
          slug: a.slug,
          description: a.description ?? null,
          relevantLink: a.relevantLink ?? null,
          linkLabel: a.linkLabel ?? null,
          image,
        };
      })
      .filter(Boolean) as AmenityDisplay[];
  }, [amenities, activeCenter, centerLinks]);

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

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => {
        const aOrder = getMembershipTierSortOrder(a);
        const bOrder = getMembershipTierSortOrder(b);
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

  const MEMBERSHIP_TIER_COLS = 3;
  const maxVisibleTierCards = Math.max(1, MEMBERSHIP_TIER_COLS);
  const hiddenTierCount = Math.max(0, tierGroups.length - maxVisibleTierCards);
  const hiddenActivityPassCount = activityPassTier ? 1 : 0;
  const hiddenMembershipCardCount = hiddenTierCount + hiddenActivityPassCount;
  const hasHiddenMembershipCards = hiddenMembershipCardCount > 0;
  const visibleTierGroups = showAllTierCards
    ? tierGroups
    : tierGroups.slice(0, maxVisibleTierCards);

  useEffect(() => {
    setShowAllTierCards(false);
  }, [activeCenter]);

  const scrollToQuiz = () => {
    setActiveTab("quiz");
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const scrollToEstimator = () => {
    setActiveTab("estimator");
    setTimeout(() => {
      estimatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      estimatorRef.current?.focus();
    }, 100);
  };
  const headerCtas = heroCtas?.length ? heroCtas : undefined;

  return (
    <main>
      <PhotoWaveHeader
        title={heroTitle}
        subheader={heroSubheader}
        imageUrl={heroImageUrl}
        ctas={headerCtas}
      >
        {fields.quizCta ? (
          <button
            type="button"
            onClick={scrollToQuiz}
            className="btn btn-secondary justify-center"
          >
            {fields.quizCta.label || "Take our Membership Quiz"}
          </button>
        ) : null}
      </PhotoWaveHeader>

      {/* COMPARE TAB CONTENT */}
      {activeTab === "compare" && (
        <div className="overflow-x-clip">
          {/* CURRENT PROMOTION */}
      {fields.showCurrentPromotion && fields.currentPromotion && (
        <div className="page-section">
          <div className="relative card bg-gmcc-navy p-0 text-white">
          <div className="grid gap-y-4 md:grid-cols-5 md:items-stretch md:gap-x-0">
            <div className="col-span-3 flex flex-col justify-center gap-4 p-8">
              <h2 className="h2 mb-4 text-white">
                {fields.currentPromotion.campaignFields?.headline}
              </h2>
              <p className="body max-w-2xl text-neutral-200">
                {fields.currentPromotion.campaignFields?.body}
              </p>
              <div className="flex flex-row items-start gap-2 justify-start mt-4">
                {fields.currentPromotion.campaignFields?.primaryCta?.primaryCtaUrl ? (
                  <a
                    href={fields.currentPromotion.campaignFields.primaryCta.primaryCtaUrl}
                    className="btn btn-tertiary"
                  >
                    {fields.currentPromotion.campaignFields?.primaryCta?.primaryCtaLabel || "Learn More"}
                  </a>
                ) : null}
                {fields.currentPromotion.campaignFields?.secondaryCta?.secondaryCtaUrl ? (
                  <a
                    href={fields.currentPromotion.campaignFields.secondaryCta.secondaryCtaUrl}
                    className="btn btn-secondary"
                  >
                    {fields.currentPromotion.campaignFields?.secondaryCta?.secondaryCtaLabel || "Learn More"}
                  </a>
                ) : null}
              </div>
            </div>
            <div className="relative col-span-2 min-h-[200px] overflow-hidden rounded-tr-[calc(1rem-1px)] rounded-br-[calc(1rem-1px)] md:min-h-0">
              <img
                src={fields.currentPromotion.featuredImage?.node?.sourceUrl ?? ""}
                alt={fields.currentPromotion.featuredImage?.node?.altText ?? ""}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
          </div>
        </div>
      )}

          {/* SEE WHAT YOU CAN GET — Amenities */}
          {amenityDisplayItems.length > 0 && (
            <section className="page-section">
              <h2 className="h2 mb-2">
                {fields.benefitsHeader || "See What You Can Get with Your Membership"}
              </h2>
              {fields.benefitsDescription && (
                <p className="body mb-8">
                  {fields.benefitsDescription}
                </p>
              )}
              {/* Center tabs */}
              <div className="mb-8 flex flex-wrap gap-2 scroll-mt-24">
                {centerLinks.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setActiveCenter(c.slug);
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
              <AmenitiesGrid amenities={amenityDisplayItems} title="" numCols={4} />
            </section>
          )}

          {/* FEATURED CAMPAIGN */}
          {fields.campaign && (
            <div className="section-y">
              <SimpleCampaign campaign={fields.campaign} />
            </div>
          )}

          {/* CENTER TAB NAVIGATION + MEMBERSHIP CARDS */}
          <section
            id="plans"
            ref={plansSectionRef}
            className="scroll-mt-6 md:scroll-mt-12"
          >
            <div className="mx-auto max-w-6xl px-4 py-8">
              <h2 className="h2 mb-2">{fields.membershipsHeader}</h2>
              <p className="body mb-8">
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
                <div className="space-y-6">
                  <div className="space-y-3">
                    {tierGroups.length > 0 ? (
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleTierGroups.map((group) => (
                          <TierCard
                            key={`${activeCenter}-${group.tierName}`}
                            tierName={group.tierName}
                            variants={group.variants}
                            getAudienceFromTitle={getAudienceFromTitle}
                            featured={isAllAccessTier(group.tierName)}
                          />
                        ))}
                      </div>
                    ) : null}
                    {hasHiddenMembershipCards && !showAllTierCards ? (
                      <div className="pt-4 flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => setShowAllTierCards(true)}
                          className="text-gmcc-navy hover:underline text-sm font-semibold"
                        >
                          {`Show more (${hiddenMembershipCardCount} more)`}
                        </button>
                      </div>
                    ) : null}
                    {hasHiddenMembershipCards && showAllTierCards && !activityPassTier ? (
                      <div className="pt-4 flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => setShowAllTierCards(false)}
                          className="text-gmcc-navy hover:underline text-sm font-semibold"
                        >
                          Show less
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {activityPassTier && showAllTierCards ? (
                    <div className="space-y-3">
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="lg:col-start-2">
                          <TierCard
                            key={`${activeCenter}-${activityPassTier.tierName}`}
                            tierName={activityPassTier.tierName}
                            variants={activityPassTier.variants}
                            getAudienceFromTitle={getAudienceFromTitle}
                            secondary
                          />
                        </div>
                      </div>
                      {hasHiddenMembershipCards ? (
                        <div className="pt-4 flex justify-center items-center">
                          <button
                            type="button"
                            onClick={() => setShowAllTierCards(false)}
                            className="text-gmcc-navy hover:underline text-sm font-semibold"
                          >
                            Show less
                          </button>
                        </div>
                      ) : null}
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
            <div className="page-section">
              <div className="card bg-gmcc-navy px-12 py-8 text-white">
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
                        <svg className="h-4 w-4 shrink-0 text-gmcc-green-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            </div>
          </section>

          {/* FINANCIAL ASSISTANCE */}
          <NavyWaveSection
            splitTopWave
            bottomWave={false}
            bandClassName="pb-4 mb-0"
            contentClassName="mx-auto max-w-6xl px-4 pt-16 sm:py-16 text-center justify-center items-center"
          >
            <h2 className="h2 text-white">
              {fields.financialAssistanceHeader || "Financial Assistance"}
            </h2>
            <p className="eyebrow mt-6 text-gmcc-green-light">
              {fields.financialAssistanceSubheader || "Need help covering membership costs?"}
            </p>
            {fields.financialAssistanceDescription && (
              <p className="body mt-6 max-w-4xl text-neutral-200 mx-auto">
                {fields.financialAssistanceDescription}
              </p>
            )}

            <button
              type="button"
              onClick={scrollToEstimator}
              className="btn btn-tertiary mt-8 mx-auto mr-1"
            >
              {fields.financialAssistanceCtas?.estimatorLabel || "Apply / Get Started"}
            </button>

            {fields.financialAssistanceCtas?.applicationPdf ? (
              <a
                href={fields.financialAssistanceCtas.applicationPdf}
                className="btn btn-secondary mt-8 mx-auto ml-1"
              >
                {fields.financialAssistanceCtas.applicationCtaLabel || "Apply / Get Started"}
              </a>
            ) : null}
          </NavyWaveSection>

          {/* HEALTHY 100 CHALLENGE */}
          {fields.healthy100Challenge && (
            <div className="relative mb-16">
              <SimpleCampaign campaign={fields.healthy100Challenge} />
            </div>
          )}
          {/* {fields.healthy100Challenge && (
            <div className="relative mt-20 mx-auto max-w-6xl p-0 card bg-gmcc-navy text-white">
              <div className="grid gap-y-4 md:grid-cols-5 md:items-stretch md:gap-x-0">
                <div className="col-span-3 flex flex-col justify-center gap-4 p-8">
                  <h2 className="h2 mb-4 text-white">
                    {fields.healthy100Challenge.campaignFields?.headline}
                  </h2>
                  <p className="body max-w-2xl text-neutral-200">
                    {fields.healthy100Challenge.campaignFields?.body}
                  </p>
                  <div className="flex flex-row items-start gap-2 justify-start mt-4">
                    {fields.healthy100Challenge.campaignFields?.primaryCta?.primaryCtaUrl ? (
                      <a
                        href={fields.healthy100Challenge.campaignFields.primaryCta.primaryCtaUrl}
                        className="btn btn-tertiary"
                      >
                        {fields.healthy100Challenge.campaignFields?.primaryCta?.primaryCtaLabel || "Learn More"}
                      </a>
                    ) : null}
                    {fields.healthy100Challenge.campaignFields?.secondaryCta?.secondaryCtaUrl ? (
                      <a
                        href={fields.healthy100Challenge.campaignFields.secondaryCta.secondaryCtaUrl}
                        className="btn btn-secondary"
                      >
                        {fields.healthy100Challenge.campaignFields?.secondaryCta?.secondaryCtaLabel || "Learn More"}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="relative col-span-2 min-h-[200px] overflow-hidden rounded-tr-[calc(1rem-1px)] rounded-br-[calc(1rem-1px)] md:min-h-0">
                  <img
                    src={fields.healthy100Challenge.featuredImage?.node?.sourceUrl ?? ""}
                    alt={fields.healthy100Challenge.featuredImage?.node?.altText ?? ""}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          )} */}

          {/* CONTACT CTA */}
          <section>
            <div className="mx-auto max-w-6xl px-4 mt-18 mb-8 text-center">
              <h2 className="h2">
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

      {/* QUIZ TAB CONTENT */}
      {activeTab === "quiz" && (
        <div ref={quizRef} className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <MembershipQuiz
            audiences={audiences}
            programAreas={programAreas}
            memberships={memberships}
            onClose={() => {
              setActiveTab("compare");
              setTimeout(() => {
                membershipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 50);
            }}
          />
        </div>
      )}


      {/* ESTIMATOR TAB CONTENT */}
      {activeTab === "estimator" && (
        <div ref={estimatorRef} className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <FinancialAidEstimator
            onClose={() => {
              setActiveTab("compare");
              setTimeout(() => {
                membershipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 50);
            }}
          />
        </div>
      )}
    </main>
  );
}

const VISIBLE_BENEFITS = 5;
const DEFAULT_JOIN_URL =
  "https://register.greatermidland.org/webtrac/web/search.html?Action=Start";

function resolveJoinAction(membership: Membership): "modal" | "direct" {
  const hasAuto = Boolean(membership.autoDraftLink?.url);
  const hasManual = Boolean(membership.manualPayLink?.url);
  if (hasAuto && hasManual) return "modal";
  return "direct";
}

function resolveDirectJoinUrl(membership: Membership): string {
  return (
    membership.autoDraftLink?.url ??
    membership.manualPayLink?.url ??
    DEFAULT_JOIN_URL
  );
}

function isAllAccessTier(tierName: string): boolean {
  return tierName.toLowerCase().includes("all access");
}

function getMembershipTierSortOrder(tierName: string): number {
  const lower = tierName.toLowerCase();
  if (lower.includes("all access")) return 2;
  if (lower.includes("center plus")) return 1;
  if (lower.includes("center")) return 0;
  return 99;
}

function isDefaultAdultAudience(audienceLabel: string): boolean {
  const aud = audienceLabel.toLowerCase();
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

function PricingSavingsCallout({ percent }: { percent: number | null }) {
  if (percent == null || percent <= 0) return null;
  return (
    <span className="ml-1.5 font-semibold text-xs text-gmcc-green">
      {" "}
      (Save {percent}%)
    </span>
  );
}

/** A single tier card with audience-switching pills */
function TierCard({
  tierName,
  variants,
  getAudienceFromTitle,
  secondary = false,
  featured = false,
}: {
  tierName: string;
  variants: Membership[];
  getAudienceFromTitle: (title: string) => string;
  secondary?: boolean;
  featured?: boolean;
}) {
  const defaultIdx = variants.findIndex((v) =>
    isDefaultAdultAudience(getAudienceFromTitle(v.title))
  );
  const [selectedIdx, setSelectedIdx] = useState(defaultIdx >= 0 ? defaultIdx : 0);
  const [benefitsExpanded, setBenefitsExpanded] = useState(false);
  const [joinChoiceOpen, setJoinChoiceOpen] = useState(false);
  const selected = variants[selectedIdx] ?? variants[0];
  if (!selected) return null;

  const joinAction = resolveJoinAction(selected);
  const directJoinUrl = resolveDirectJoinUrl(selected);
  const joinButtonClass = secondary
    ? "btn btn-secondary w-full"
    : "btn btn-primary w-full";

  const pricingSavings = computeMembershipPricingSavings(selected.pricing);

  const hiddenCount = Math.max(0, selected.benefits.length - VISIBLE_BENEFITS);
  const shownBenefits = benefitsExpanded
    ? selected.benefits
    : selected.benefits.slice(0, VISIBLE_BENEFITS);

  const articleClass = secondary
    ? "flex flex-col rounded-2xl border border-neutral-300 bg-neutral-50 shadow-none overflow-hidden ring-1 ring-neutral-100"
    : featured
      ? "flex flex-col rounded-2xl border-2 border-gmcc-teal/40 bg-gmcc-blue-light/15 shadow-md overflow-hidden ring-2 ring-gmcc-teal/15"
      : "flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden";

  const benefitsListFadeClass =
    !benefitsExpanded && hiddenCount > 0
      ? "[mask-image:linear-gradient(to_bottom,black_0,black_calc(100%-3rem),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0,black_calc(100%-3rem),transparent_100%)]"
      : "";

  return (
    <article
      className={`${articleClass}${joinChoiceOpen ? " z-50 overflow-visible" : ""}`}
    >
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
              <PricingSavingsCallout percent={pricingSavings.splitVsMonthlyPercent} />
            </div>
          )}
          {selected.pricing.annually != null && (
            <div>
              <span className="text-neutral-500">Annual:</span>{" "}
              <span className="font-bold">${Math.round(selected.pricing.annually)}</span>
              <PricingSavingsCallout percent={pricingSavings.annualVsMonthlyPercent} />
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
                    setJoinChoiceOpen(false);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedIdx === i ? "bg-gmcc-navy text-white shadow-sm"
                      : featured
                        ? "bg-white text-gmcc-navy hover:bg-neutral-200"
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
            <ul className={`space-y-1 ${benefitsListFadeClass}`}>
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
              <button
                type="button"
                onClick={() => setBenefitsExpanded(true)}
                className="mt-1 text-xs font-semibold text-gmcc-navy hover:underline"
              >
                See {hiddenCount} more benefit{hiddenCount !== 1 && "s"}
              </button>
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

        <div className="relative mt-auto pt-4">
          {joinChoiceOpen && joinAction === "modal" && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/15"
                onClick={() => setJoinChoiceOpen(false)}
                aria-hidden
              />
              <div
                className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`join-choice-title-${selected.slug}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    id={`join-choice-title-${selected.slug}`}
                    className="text-base font-semibold text-gmcc-navy"
                  >
                    Choose how to pay
                  </h3>
                  <button
                    type="button"
                    onClick={() => setJoinChoiceOpen(false)}
                    className="shrink-0 rounded-full bg-neutral-100 p-1 text-neutral-600 transition hover:bg-neutral-200"
                    aria-label="Close"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-xs text-neutral-600">
                  Continue registration for{" "}
                  <span className="font-semibold text-gmcc-navy">{tierName}</span>
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {selected.autoDraftLink ? (
                    <a
                      href={selected.autoDraftLink.url}
                      target={selected.autoDraftLink.target ?? "_blank"}
                      rel="noopener noreferrer"
                      className="btn btn-primary w-full text-sm"
                    >
                      {selected.autoDraftLink.label}
                    </a>
                  ) : null}
                  {selected.manualPayLink ? (
                    <a
                      href={selected.manualPayLink.url}
                      target={selected.manualPayLink.target ?? "_blank"}
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full text-sm"
                    >
                      {selected.manualPayLink.label}
                    </a>
                  ) : null}
                </div>
              </div>
            </>
          )}
          {joinAction === "modal" ? (
            <button
              type="button"
              onClick={() => setJoinChoiceOpen(true)}
              className={joinButtonClass}
            >
              Join Now
            </button>
          ) : (
            <a
              href={directJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={joinButtonClass}
            >
              Join Now
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
