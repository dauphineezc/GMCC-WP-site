// src/app/centers/[slug]/page.tsx
import AmenitiesGrid from "@/components/amenitiesGrid";
import CenterCampaignModule from "@/components/centerCampaignModule";
import PhoneLink from "@/components/phoneLink";
import { extractAmenitySlugs, toAmenityDisplayForCenter } from "@/lib/amenities";
import { fetchAmenitiesWithImages } from "@/lib/amenities";
import { wpFetch } from "@/lib/wp";
import { resolveHeroCta } from "@/lib/pageHeroFields";
import type { HeroCta } from "@/components/photoWaveHeader";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  coerceWpRichText,
  fetchCenterDetailPageFields,
  isCurlingCenterSlug,
  resolveFeaturedProgramEventHref,
} from "@/lib/centerDetailPageFields";

const CENTER_BY_SLUG_QUERY = `
  query CenterBySlug($slug: ID!) {
    center(id: $slug, idType: SLUG) {
      title
      slug
      heroFields {
        heroHeader
        heroSubheader
        heroImage {
          node {
            sourceUrl
            altText
          }
        }
        heroPrimaryCta {
          ctaLabel
          cta
        }
        heroSecondaryCta {
          ctaLabel
          cta
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      centersFields {
        summary
        longDescription
        centerType
        address
        socialLinks
        amenities {
          nodes {
            name
            slug
            ... on Amenity {
              amenitiesFields {
                amenityImage1 {
                  node {
                    sourceUrl
                    altText
                  }
                }
                center1 {
                  nodes {
                    ... on Center {
                      title
                      slug
                    }
                  }
                }
                amenityImage2 {
                  node {
                    sourceUrl
                    altText
                  }
                }
                center2 {
                  nodes {
                    ... on Center {
                      title
                      slug
                    }
                  }
                }
                amenityImage3 {
                  node {
                    sourceUrl
                    altText
                  }
                }
                center3 {
                  nodes {
                    ... on Center {
                      title
                      slug
                    }
                  }
                }
                amenityImage4 {
                  node {
                    sourceUrl
                    altText
                  }
                }
                center4 {
                  nodes {
                    ... on Center {
                      title
                      slug
                    }
                  }
                }
                amenityImage5 {
                  node {
                    sourceUrl
                    altText
                  }
                }
                center5 {
                  nodes {
                    ... on Center {
                      title
                      slug
                    }
                  }
                }
                relevantLink
                linkLabel
                isService
                additionalInformation
                additionalImage {
                  node {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        }
        accessibilityAmenities {
          nodes {
            name
            slug
            ... on AccessibilityAmenity {
              amenitiesFields {
                amenityImage1 {
                  node {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        }
        hours {
          mondayHours {
            closedMonday
            mondayOpenTime
            mondayCloseTime
          }
          tuesdayHours {
            closedTuesday
            tuesdayOpenTime
            tuesdayCloseTime
          }
          wednesdayHours {
            closedWednesday
            wednesdayOpenTime
            wednesdayCloseTime
          }
          thursdayHours {
            closedThursday
            thursdayOpenTime
            thursdayCloseTime
          }
          fridayHours {
            closedFriday
            fridayOpenTime
            fridayCloseTime
          }
          saturdayHours {
            closedSaturday
            saturdayOpenTime
            saturdayCloseTime
          }
          sundayHours {
            closedSunday
            sundayOpenTime
            sundayCloseTime
          }
        }
        contactInfo {
          contactPhone
          contactEmail
        }
      }
      centerCampaignModuleFields {
        header
        description
        subheader
        body
        primaryCta {
          ctaLabel
          cta
        }
        secondaryCta {
          ctaLabel
          cta
        }
        gallery {
          photo1 {
            node {
              sourceUrl
              altText
            }
          }
          photo2 {
            node {
              sourceUrl
              altText
            }
          }
          photo3 {
            node {
              sourceUrl
              altText
            }
          }
          photo4 {
            node {
              sourceUrl
              altText
            }
          }
          photo5 {
            node {
              sourceUrl
              altText
            }
          }
          photo6 {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
    testimonials(first: 100) {
      nodes {
        slug
        testimonialFields {
          quote
          personName
          personContext
          photo { node { sourceUrl altText } }
          relatedCenters {
            nodes {
              ... on Center {
                slug
              }
            }
          }
        }
      }
    }
    memberships(first: 100) {
      nodes {
        title
        membershipFields {
          centers {
            nodes {
              ... on Center {
                slug
              }
            }
          }
        }
      }
    }
  }
`;

function renderHoursReplacementContent(htmlOrText: string) {
  const c = htmlOrText.trim();
  if (!c) return null;
  if (/<[a-z][\s\S]*>/i.test(c)) {
    return (
      <div
        className="body text-neutral-200 space-y-3 [&_a]:text-white [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: c }}
      />
    );
  }
  return <p className="body text-neutral-200 whitespace-pre-line">{c}</p>;
}

type CenterPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CenterPage(props: CenterPageProps) {
  const { slug } = await props.params;
  const [data, centerDetailFields] = await Promise.all([
    wpFetch<any>(CENTER_BY_SLUG_QUERY, { slug }),
    fetchCenterDetailPageFields(),
  ]);

  const center = data?.center;

  if (!center) {
    return (
      <main className="mx-auto max-w-5xl section-y">
        <p className="body">Center not found.</p>
      </main>
    );
  }

  const amenityNodes = center.centersFields?.amenities?.nodes ?? [];

  // Fetch amenities for this center
  const amenitySlugs = extractAmenitySlugs(amenityNodes);
  const amenitiesWithImages = await fetchAmenitiesWithImages(amenitySlugs);
  const amenitiesForThisCenter = toAmenityDisplayForCenter(amenitiesWithImages, slug);


  const heroFields = center.heroFields ?? null;
  const heroImageUrl =
    heroFields?.heroImage?.node?.sourceUrl ?? center.featuredImage?.node?.sourceUrl ?? null;
  const heroHeader =
    (heroFields?.heroHeader ?? "").trim() || (center.title ?? "").trim() || "Center";
  const heroSubheaderRaw = (heroFields?.heroSubheader ?? "").trim();
  const heroSubheader = heroSubheaderRaw || center.centersFields?.summary || null;

  const heroCtas: HeroCta[] = [
    resolveHeroCta(heroFields?.heroPrimaryCta, "primary"),
    resolveHeroCta(heroFields?.heroSecondaryCta, "secondary"),
  ].filter((c): c is HeroCta => c != null);

  const centerFields = center.centersFields ?? {};
  const campaign = center.centerCampaignModuleFields ?? {};

  const firstNonEmptyString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  const findStringByKeyMatch = (
    input: unknown,
    keyMatcher: (key: string) => boolean,
    depth = 0
  ): string | null => {
    if (depth > 4 || !input || typeof input !== "object") return null;
    const obj = input as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      if (keyMatcher(key) && typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    for (const value of Object.values(obj)) {
      if (typeof value === "object" && value !== null) {
        const nested = findStringByKeyMatch(value, keyMatcher, depth + 1);
        if (nested) return nested;
      }
    }

    return null;
  };

  const normalizeCta = (cta: any) => {
    if (!cta) return null;

    const ctaLabel = firstNonEmptyString(
      cta?.ctaLabel,
      cta?.title,
      cta?.label,
      cta?.text,
      cta?.primaryCtaLabel,
      cta?.secondaryCtaLabel,
      findStringByKeyMatch(cta, (key) => /label|title|text/i.test(key))
    );

    const ctaHref = firstNonEmptyString(
      typeof cta?.cta === "string" ? cta.cta : null,
      cta?.cta?.url,
      cta?.cta?.uri,
      cta?.cta?.href,
      cta?.url,
      cta?.uri,
      cta?.href,
      cta?.primaryCtaUrl,
      cta?.secondaryCtaUrl,
      findStringByKeyMatch(cta, (key) => /url|uri|href/i.test(key))
    );

    if (!ctaHref) return null;
    return { ctaLabel: ctaLabel ?? "Learn more", cta: ctaHref };
  };

  const campaignPrimaryCta = normalizeCta(campaign.primaryCta);
  const campaignSecondaryCta = normalizeCta(campaign.secondaryCta);

  const campaignModule = {
    header: campaign.header ?? null,
    description: campaign.description ?? null,
    subheader: campaign.subheader ?? null,
    body: campaign.body ?? null,
    primaryCta: campaignPrimaryCta,
    secondaryCta: campaignSecondaryCta,
    gallery: {
      photo1: campaign.gallery?.photo1?.node ?? null,
      photo2: campaign.gallery?.photo2?.node ?? null,
      photo3: campaign.gallery?.photo3?.node ?? null,
      photo4: campaign.gallery?.photo4?.node ?? null,
    },
  };

  const isCurlingCenter = isCurlingCenterSlug(slug, center.slug ?? null);
  const curlingLayout = centerDetailFields?.curlingCenterPageFields;
  const readyToJoinLayout = centerDetailFields?.readyToJoinSection;
  const hoursReplacement = coerceWpRichText(curlingLayout?.hoursReplacementStatement).trim();
  const showCurlingHoursReplacement = isCurlingCenter && hoursReplacement.length > 0;

  const replacementCta = curlingLayout?.membershipReplacementCta;
  const membershipPlansHref = `/membership?center=${encodeURIComponent(slug)}#plans`;

  let joinSectionHeader: string;
  let joinSectionSubheader: string;
  let joinCardText: string;
  let joinCtaLabel: string;
  let joinCtaHref: string | null;

  if (isCurlingCenter) {
    joinSectionHeader =
      coerceWpRichText(replacementCta?.header).trim() || "Ready to join?";
    joinSectionSubheader = coerceWpRichText(replacementCta?.subheader).trim();
    joinCardText = coerceWpRichText(replacementCta?.cardText).trim();
    joinCtaLabel = coerceWpRichText(replacementCta?.ctaLabel).trim() || "Learn more";
    joinCtaHref =
      resolveFeaturedProgramEventHref(replacementCta?.featuredProgramEvent?.node ?? undefined) ??
      null;
  } else {
    joinSectionHeader = (readyToJoinLayout?.header ?? "").trim() || "Ready to join?";
    joinSectionSubheader =
      (readyToJoinLayout?.subheader ?? "").trim() ||
      "Join online or stop in to get started today.";
    joinCardText =
      (readyToJoinLayout?.cardText ?? "").trim() || "Start your membership in minutes.";
    joinCtaLabel = (readyToJoinLayout?.ctaLabel ?? "").trim() || "Join Now";
    joinCtaHref = membershipPlansHref;
  }

  return (
    <main>
      <PhotoWaveHeader
        title={heroHeader}
        subheader={heroSubheader}
        imageUrl={heroImageUrl}
        ctas={heroCtas.length > 0 ? heroCtas : undefined}
        flushBottom
        waveFillClassName="text-gmcc-navy"
        waveEdgeClassName="bg-gmcc-navy"
      />

      <section
        className="relative w-screen -ml-[calc(50vw-50%)] overflow-x-clip scroll-mt-24"
      >
        <div className="bg-gmcc-navy py-10">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 md:grid-cols-3 items-start">
                <div className="stack-3 col-span-1 mb-8">
                    <h2 className="h2 mb-4 text-white">Location</h2>
                    <p className="body text-neutral-200">{centerFields.address}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centerFields.address)}`} target="_blank" rel="noopener noreferrer" className="mt-2 btn btn-tertiary">View on Google Maps</a>
                </div>
                <div className="stack-3 col-span-1 mb-8">
                    <h2 className="h2 mb-4 text-white">Contact</h2>
                    <PhoneLink className="body text-neutral-200 hover:text-white hover:underline" phone={centerFields.contactInfo.contactPhone} /> <br />
                    <a href={`mailto:${centerFields.contactInfo.contactEmail}`} className="body text-neutral-200 hover:text-white hover:underline mb-8">{centerFields.contactInfo.contactEmail}</a>
                </div>
                <div className="stack-3 col-span-1 mb-14 md:mb-0">
                    <h2 className="h2 mb-4 text-white">Hours</h2>
                    {showCurlingHoursReplacement ? (
                      renderHoursReplacementContent(hoursReplacement)
                    ) : (
                    <div className="grid grid-cols-2 items-center">
                        <div className="flex flex-col text-left">
                            <p className="body text-sm text-neutral-200 font-bold uppercase tracking-wide">Monday</p>
                            <p className="body text-sm text-neutral-200 font-bold uppercase tracking-wide">Tuesday</p>
                            <p className="body text-sm text-neutral-200 font-bold uppercase tracking-wide">Wednesday</p>
                            <p className="body text-sm text-neutral-200 font-bold uppercase tracking-wide">Thursday</p>
                            <p className="body text-sm text-neutral-200 font-bold uppercase tracking-wide">Friday</p>
                            <p className="body text-sm text-neutral-200 font-bold uppercase tracking-wide">Saturday</p>
                            <p className="body text-sm text-neutral-200 font-bold uppercase tracking-wide">Sunday</p>
                        </div>
                        <div className="flex flex-col text-right">
                            {centerFields.hours.mondayHours.closedMonday ? (
                              <p className="body text-neutral-200">Closed</p>
                            ) : (
                              <p className="body text-neutral-200">{centerFields.hours.mondayHours.mondayOpenTime} - {centerFields.hours.mondayHours.mondayCloseTime}</p>
                            )}
                            {centerFields.hours.tuesdayHours.closedTuesday ? (
                              <p className="body text-neutral-200">Closed</p>
                            ) : (
                              <p className="body text-neutral-200">{centerFields.hours.tuesdayHours.tuesdayOpenTime} - {centerFields.hours.tuesdayHours.tuesdayCloseTime}</p>
                            )}
                            {centerFields.hours.wednesdayHours.closedWednesday ? (
                              <p className="body text-neutral-200">Closed</p>
                            ) : (
                              <p className="body text-neutral-200">{centerFields.hours.wednesdayHours.wednesdayOpenTime} - {centerFields.hours.wednesdayHours.wednesdayCloseTime}</p>
                            )}
                            {centerFields.hours.thursdayHours.closedThursday ? (
                              <p className="body text-neutral-200">Closed</p>
                            ) : (
                              <p className="body text-neutral-200">{centerFields.hours.thursdayHours.thursdayOpenTime} - {centerFields.hours.thursdayHours.thursdayCloseTime}</p>
                            )}
                            {centerFields.hours.fridayHours.closedFriday ? (
                              <p className="body text-neutral-200">Closed</p>
                            ) : (
                              <p className="body text-neutral-200">{centerFields.hours.fridayHours.fridayOpenTime} - {centerFields.hours.fridayHours.fridayCloseTime}</p>
                            )}
                            {centerFields.hours.saturdayHours.closedSaturday ? (
                              <p className="body text-neutral-200">Closed</p>
                            ) : (
                              <p className="body text-neutral-200">{centerFields.hours.saturdayHours.saturdayOpenTime} - {centerFields.hours.saturdayHours.saturdayCloseTime}</p>
                            )}
                            {centerFields.hours.sundayHours.closedSunday ? (
                              <p className="body text-neutral-200">Closed</p>
                            ) : (
                              <p className="body text-neutral-200">{centerFields.hours.sundayHours.sundayOpenTime} - {centerFields.hours.sundayHours.sundayCloseTime}</p>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outside overflow-x-clip so width isn't clipped (same pattern as site footer: w-full under full-width main) */}
      <div className="pointer-events-none -mt-px w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 390 120"
          className="-ml-px block h-14 w-[calc(100%+2px)] text-gmcc-navy md:hidden"
          preserveAspectRatio="none"
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
          className="-ml-px hidden h-16 w-[calc(100%+2px)] text-gmcc-navy md:block"
          preserveAspectRatio="none"
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

      <section className="mx-auto max-w-6xl px-4 py-8 section-y stack-4">
        <h2 className="h2 mb-4">What you'll find here</h2>
        <p className="body mb-8">{centerFields.longDescription}</p>
        {/* Amenities Grid */}
        {amenitiesForThisCenter.length > 0 && (
          <AmenitiesGrid amenities={amenitiesForThisCenter} title="What we offer" />
        )}
        
        <CenterCampaignModule module={campaignModule} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 pb-12 section-y stack-4">
        <h2 className="h2 mb-2">{joinSectionHeader}</h2>
        {joinSectionSubheader ? (
          <p className="body mb-4">{joinSectionSubheader}</p>
        ) : null}
        <div className="card bg-gmcc-green py-6">
          <p className="flex flex-col gap-4 text-3xl text-white font-bold tracking-wide sm:flex-row sm:items-center sm:justify-between sm:pl-4 sm:pr-4">
            <span>{joinCardText}</span>
            {joinCtaHref ? (
              <a href={joinCtaHref} className="btn btn-primary shrink-0">
                {joinCtaLabel}
              </a>
            ) : isCurlingCenter ? (
              <span className="btn btn-primary shrink-0 cursor-not-allowed opacity-70" aria-disabled="true">
                {joinCtaLabel}
              </span>
            ) : null}
          </p>
        </div>
      </section>
    </main>
  );
}