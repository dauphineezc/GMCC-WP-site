// src/app/membership/[slug]/centerMembershipsClient.tsx
"use client";

import { useMemo } from "react";
import type { Membership, Testimonial, AmenityWithImage } from "./page";
import AmenitiesCarousel from "@/components/amenitiesCarousel";
import HeaderImage from "@/components/headerImage";

type Props = {
  centerSlug: string;
  centerTitle: string;
  centerSummary: string | null;
  memberships: Membership[];
  allAccessMemberships: Membership[];
  amenitiesWithImages: AmenityWithImage[];
  testimonials: Testimonial[];
  isCommunityCenter: boolean;
};


export default function CenterMembershipsClient({
  centerTitle,
  centerSummary,
  memberships,
  allAccessMemberships,
  amenitiesWithImages,
  testimonials,
  isCommunityCenter,
}: Props) {

  // Extract membership display name from title (e.g., "Center – Family" → "Center")
  // Handles both regular hyphen (-) and en-dash (–)
  const getMembershipDisplayName = (title: string): string => {
    // Try en-dash first (–), then regular hyphen (-)
    let separatorIndex = title.indexOf(" – ");
    if (separatorIndex < 0) {
      separatorIndex = title.indexOf(" - ");
    }
    if (separatorIndex > 0) {
      return title.substring(0, separatorIndex).trim();
    }
    if (title.includes("Membership")) {
      return title.replace("Membership", "").trim();
    }
    return title.trim();
  };

  // Extract audience name from title (e.g., "Center – Family" → "Family")
  // Handles both regular hyphen (-) and en-dash (–)
  const getAudienceFromTitle = (title: string): string => {
    // Try en-dash first (–), then regular hyphen (-)
    let separatorIndex = title.indexOf(" – ");
    if (separatorIndex < 0) {
      separatorIndex = title.indexOf(" - ");
    }
    if (separatorIndex > 0) {
      return title.substring(separatorIndex + 3).trim();
    }
    return "Member"; // Fallback if no separator found
  };

  // For Community Center: Group memberships by tier and deduplicate benefits
  const tieredData = useMemo(() => {
    if (!isCommunityCenter) return null;

    // Group by tier NUMBER (e.g., "1", "2", "3")
    const tierGroups: Record<string, Membership[]> = {};
    memberships.forEach((m) => {
      const tierKey = m.pricing.tier?.toString() ?? "unknown";
      if (!tierGroups[tierKey]) tierGroups[tierKey] = [];
      tierGroups[tierKey].push(m);
    });

    // Sort tiers numerically
    const sortedTiers = Object.keys(tierGroups).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      return a.localeCompare(b);
    });

    // Create a mapping from tier number to SHORT display name (e.g., "All Access" not "All Access - Family")
    const tierDisplayNames: Record<string, string> = {};
    sortedTiers.forEach((tier) => {
      const firstMembership = tierGroups[tier][0];
      if (firstMembership) {
        // Extract just the membership name part (before " - ")
        const fullName = getMembershipDisplayName(firstMembership.title);
        // Further simplify by removing any remaining "Membership" suffix if desired
        tierDisplayNames[tier] = fullName;
      } else {
        tierDisplayNames[tier] = `Tier ${tier}`;
      }
    });

    // Collect benefits in tier order, deduplicating
    const seenBenefits = new Set<string>();
    const tierBenefits: Record<string, string[]> = {};

    sortedTiers.forEach((tier) => {
      const tierMemberships = tierGroups[tier];
      // Get all benefits for this tier (combine from all audience variants)
      const allBenefitsForTier = new Set<string>();
      tierMemberships.forEach((m) => {
        m.benefits.forEach((b) => allBenefitsForTier.add(b));
      });

      // Filter out already-seen benefits
      const uniqueBenefits = Array.from(allBenefitsForTier).filter(
        (b) => !seenBenefits.has(b)
      );
      
      // Mark these as seen for next tier
      uniqueBenefits.forEach((b) => seenBenefits.add(b));
      
      tierBenefits[tier] = uniqueBenefits;
    });

    // Sort memberships within each tier alphabetically by audience from title
    sortedTiers.forEach((tier) => {
      tierGroups[tier].sort((a, b) => {
        const aAud = getAudienceFromTitle(a.title).toLowerCase();
        const bAud = getAudienceFromTitle(b.title).toLowerCase();
        return aAud.localeCompare(bAud);
      });
    });

    return { tierGroups, sortedTiers, tierBenefits, tierDisplayNames };
  }, [isCommunityCenter, memberships]);

  // For non-Community Center: Get center-specific and All Access memberships
  const comparisonData = useMemo(() => {
    if (isCommunityCenter) return null;

    // Center-specific memberships (exclude All Access)
    const centerSpecific = memberships.filter((m) => {
      const title = m.title.toLowerCase();
      return !title.includes("all access");
    });

    // Sort alphabetically by audience from title
    centerSpecific.sort((a, b) => {
      const aAud = getAudienceFromTitle(a.title).toLowerCase();
      const bAud = getAudienceFromTitle(b.title).toLowerCase();
      return aAud.localeCompare(bAud);
    });

    // Get All Access variants sorted alphabetically by audience from title
    const allAccess = [...allAccessMemberships].sort((a, b) => {
      const aAud = getAudienceFromTitle(a.title).toLowerCase();
      const bAud = getAudienceFromTitle(b.title).toLowerCase();
      return aAud.localeCompare(bAud);
    });

    // Get unique benefits for center-specific
    const centerBenefits = new Set<string>();
    centerSpecific.forEach((m) => m.benefits.forEach((b) => centerBenefits.add(b)));

    // Get unique benefits for All Access
    const allAccessBenefits = new Set<string>();
    allAccess.forEach((m) => m.benefits.forEach((b) => allAccessBenefits.add(b)));

    return {
      centerSpecific,
      allAccess,
      centerBenefits: Array.from(centerBenefits),
      allAccessBenefits: Array.from(allAccessBenefits),
    };
  }, [isCommunityCenter, memberships, allAccessMemberships]);

  // Get short membership name (extract just the center name for display)
  const getShortMembershipName = (title: string): string => {
    // Remove audience descriptors and simplify (handles both - and – separators)
    return title
      .replace(/[–-] (Adult|Family|Youth|Young Adult)$/i, "")
      .replace(/(Adult|Family|Youth|Young Adult) /i, "")
      .trim();
  };

  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/MembershipHeaderImage.png" alt="Greater Midland Memberships" />
      </div>

      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Page Header */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gmcc-navy tracking-tight sm:text-4xl">
            {centerTitle} Memberships
          </h1>
          <p className="mt-2 text-neutral-600">
            Explore membership options for the {centerTitle}. Compare pricing, benefits,
            and eligibility to find the best fit for you or your family.
          </p>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left Column - Membership Content */}
        <div className="space-y-8">
          {isCommunityCenter && tieredData ? (
            <CommunityTieredLayout 
              tieredData={tieredData} 
              getAudienceFromTitle={getAudienceFromTitle}
            />
          ) : comparisonData ? (
            <ComparisonLayout
              comparisonData={comparisonData}
              centerTitle={centerTitle}
              getShortMembershipName={getShortMembershipName}
              getAudienceFromTitle={getAudienceFromTitle}
            />
          ) : (
            <p className="text-neutral-600">
              No membership information available for this center yet.
            </p>
          )}
        </div>

        {/* Right Column - Amenities & Testimonials */}
        <aside className="space-y-6">
          {/* Amenities Carousel */}
          {amenitiesWithImages.length > 0 && (
            <AmenitiesCarousel amenities={amenitiesWithImages} title={`${centerTitle} Amenities`} />
          )}

          {/* Testimonial */}
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">
                More Than a Membership
          </h2>
          {testimonials.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              {testimonials[0] && (
                <div className="space-y-3">
                  {/* Testimonial Image */}
                  {testimonials[0].image && (
                    <div className="relative rounded-lg overflow-hidden bg-neutral-100 aspect-[4/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={testimonials[0].image.url}
                        alt={testimonials[0].image.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Quote */}
                  {testimonials[0].quote && (
                    <blockquote className="text-sm text-neutral-700 italic">
                      &ldquo;{testimonials[0].quote}&rdquo;
                    </blockquote>
                  )}

                  {/* Person Name */}
                  {testimonials[0].personName && (
                    <p className="text-xs font-semibold text-neutral-800 mb-0">
                      — {testimonials[0].personName}
                    </p>
                  )}

                  {/* Person Context */}
                  {testimonials[0].personContext && (
                    <p className="text-xs text-neutral-600 italic">
                      {testimonials[0].personContext}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>
        </div>
      </div>
    </main>
  );
}

// Community Center Tiered Layout Component
function CommunityTieredLayout({
  tieredData,
  getAudienceFromTitle,
}: {
  tieredData: {
    tierGroups: Record<string, Membership[]>;
    sortedTiers: string[];
    tierBenefits: Record<string, string[]>;
    tierDisplayNames: Record<string, string>;
  };
  getAudienceFromTitle: (title: string) => string;
}) {
  const { tierGroups, sortedTiers, tierBenefits, tierDisplayNames } = tieredData;

  return (
    <div className="space-y-8">
      {/* Benefits Comparison Table */}
      <section>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {sortedTiers.map((tier, tierIdx) => {
              const displayName = tierDisplayNames[tier] || `Tier ${tier}`;
              const benefits = tierBenefits[tier] || [];
              const prevTier = tierIdx > 0 ? sortedTiers[tierIdx - 1] : null;
              const prevDisplayName = prevTier ? tierDisplayNames[prevTier] : null;
              
              return (
                <div key={tier} className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                  <h3 className="text-center text-xl font-bold uppercase tracking-wide">{displayName}</h3>
                  <div className="p-1 bg-white mt-0">
                    {prevDisplayName && (
                      <p className="text-xs justify-start text-gmcc-navy mb-4 italic">
                        <mark>All the {prevDisplayName} benefits, and:</mark>
                      </p>
                    )}
                    <ul className="space-y-1.5 text-sm text-neutral-700">
                      {benefits.map((benefit, i) => (
                        <li key={i} className="text-center mb-3">{"• " + benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        <p className="text-[10px] text-neutral-400 mt-2 italic text-start">
          *All participants in child and familial activities must hold a membership.
        </p>
      </section>

      {/* Pricing Sections by Tier */}
      {sortedTiers.map((tier) => {
        const displayName = tierDisplayNames[tier] || `Tier ${tier}`;
        const tierMemberships = tierGroups[tier] || [];
        
        return (
          <section key={tier} className="space-y-4">
            <h2 className="mb-2">
              {displayName} Membership Prices:
            </h2>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {tierMemberships.map((m) => {
                const audienceName = getAudienceFromTitle(m.title);
                
                return (
                  <div
                    key={m.slug}
                    className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3"
                  >
                    <h3 className="text-base font-bold text-gmcc-navy">
                      {audienceName}
                    </h3>
                    
                    <div className="space-y-1 text-sm">
                      {m.pricing.monthly != null && (
                        <div>
                          <span className="text-neutral-500">Monthly:</span>{" "}
                          <span className="font-bold">${Math.round(m.pricing.monthly)}</span>
                        </div>
                      )}
                      {m.pricing.annual != null && (
                        <div>
                          <span className="text-neutral-500">Annual:</span>{" "}
                          <span className="font-bold">${Math.round(m.pricing.annual)}</span>
                        </div>
                      )}
                      {m.pricing.joiningFee != null && (
                        <div className="text-xs text-neutral-500">
                          One-time joining fee: ${Math.round(m.pricing.joiningFee)}
                        </div>
                      )}
                    </div>
                    
                    <a
                      href={m.joinRenewLink ?? "https://register.greatermidland.org/webtrac/web/search.html?Action=Start"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded bg-gmcc-navy px-3 py-2 text-sm font-semibold text-white hover:bg-gmcc-navy/80"
                    >
                      Join or Renew
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Other Centers Comparison Layout Component
function ComparisonLayout({
  comparisonData,
  centerTitle,
  getShortMembershipName,
  getAudienceFromTitle,
}: {
  comparisonData: {
    centerSpecific: Membership[];
    allAccess: Membership[];
    centerBenefits: string[];
    allAccessBenefits: string[];
  };
  centerTitle: string;
  getShortMembershipName: (title: string) => string;
  getAudienceFromTitle: (title: string) => string;
}) {
  const { centerSpecific, allAccess, centerBenefits, allAccessBenefits } = comparisonData;

  // Get a representative name for center-specific membership
  const centerMembershipName = centerSpecific[0] 
    ? getShortMembershipName(centerSpecific[0].title)
    : `${centerTitle} Membership`;

  return (
    <div className="space-y-8">
      {/* Benefits Comparison */}
      <section>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 items-start">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
            <h3 className="text-center text-xl font-bold uppercase tracking-wide">{centerMembershipName}</h3>
            <ul className="space-y-1.5 text-sm text-neutral-700">
              {centerBenefits.map((benefit, i) => (
                <li key={i} className="text-center mb-3">{"• " + benefit}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
            <h3 className="text-center text-xl font-bold uppercase tracking-wide">All Access</h3>
            <ul className="space-y-1.5 text-sm text-neutral-700">
              {allAccessBenefits.map((benefit, i) => (
                <li key={i} className="text-center mb-3">{"• " + benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Center-specific Pricing */}
      {centerSpecific.length > 0 && (
        <section className="space-y-4">
          <h2 className="mb-2">
            {centerMembershipName} Prices:
          </h2>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {centerSpecific.map((m) => {
              const audienceName = getAudienceFromTitle(m.title);
              
              return (
                <div
                  key={m.slug}
                  className="rounded-lg bg-white p-4 space-y-3 border border-neutral-200"
                >
                  <h3 className="text-base font-bold text-gmcc-navy">
                    {audienceName}
                  </h3>
                  
                  <div className="space-y-1 text-sm">
                    {m.pricing.monthly != null && (
                      <div>
                        <span className="text-neutral-500">Monthly:</span>{" "}
                        <span className="font-bold">${Math.round(m.pricing.monthly)}</span>
                      </div>
                    )}
                    {m.pricing.annual != null && (
                      <div>
                        <span className="text-neutral-500">Annual:</span>{" "}
                        <span className="font-bold">${Math.round(m.pricing.annual)}</span>
                      </div>
                    )}
                    {m.pricing.joiningFee != null && (
                      <div className="text-xs text-neutral-500">
                        One-time joining fee: ${Math.round(m.pricing.joiningFee)}
                      </div>
                    )}
                  </div>
                  
                  <a
                    href={m.joinRenewLink ?? "https://register.greatermidland.org/webtrac/web/search.html?Action=Start"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded bg-gmcc-navy px-3 py-2 text-sm font-semibold text-white hover:bg-gmcc-navy/80"
                  >
                    Join or Renew
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* All Access Pricing */}
      {allAccess.length > 0 && (
        <section className="space-y-4">
          <h2 className="mb-2">
            All Access Membership Prices:
          </h2>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {allAccess.map((m) => {
              const audienceName = getAudienceFromTitle(m.title);
              
              return (
                <div
                  key={m.slug}
                  className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3"
                >
                  <h3 className="text-base font-bold text-gmcc-navy">
                    {audienceName}
                  </h3>
                  
                  <div className="space-y-1 text-sm">
                    {m.pricing.monthly != null && (
                      <div>
                        <span className="text-neutral-500">Monthly:</span>{" "}
                        <span className="font-bold">${Math.round(m.pricing.monthly)}</span>
                      </div>
                    )}
                    {m.pricing.annual != null && (
                      <div>
                        <span className="text-neutral-500">Annual:</span>{" "}
                        <span className="font-bold">${Math.round(m.pricing.annual)}</span>
                      </div>
                    )}
                    {m.pricing.joiningFee != null && (
                      <div className="text-xs text-neutral-500">
                        One-time joining fee: ${Math.round(m.pricing.joiningFee)}
                      </div>
                    )}
                  </div>
                  
                  <a
                    href={m.joinRenewLink ?? "https://register.greatermidland.org/webtrac/web/search.html?Action=Start"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded bg-gmcc-navy px-3 py-2 text-sm font-semibold text-white hover:bg-gmcc-navy/80"
                  >
                    Join or Renew
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
