// src/app/centers/[slug]/page.tsx
import AmenitiesGrid from "@/components/amenitiesGrid";
import CenterCampaignModule from "@/components/centerCampaignModule";
import PhoneLink from "@/components/phoneLink";
import { extractAmenitySlugs, toAmenityDisplayForCenter } from "@/lib/amenities";
import { fetchAmenitiesWithImages } from "@/lib/amenities";
import { wpFetch } from "@/lib/wp";

const CENTER_BY_SLUG_QUERY = `
  query CenterBySlug($slug: ID!) {
    center(id: $slug, idType: SLUG) {
      title
      slug
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
        primaryCta {
          ctaLabel
          cta
        }
        secondaryCta {
          ctaLabel
          cta
        }
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

type CenterPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CenterPage(props: CenterPageProps) {
  const { slug } = await props.params;

  const data = await wpFetch<any>(CENTER_BY_SLUG_QUERY, { slug });
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


  const heroImageUrl = center.featuredImage?.node?.sourceUrl ?? null;
  const heroHeader = center.title ?? null;
  const heroSubheader = center.centersFields?.summary ?? null;
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

  const heroPrimaryCta = normalizeCta(center.centersFields?.primaryCta);
  const heroSecondaryCta = normalizeCta(center.centersFields?.secondaryCta);
  const campaignPrimaryCta = normalizeCta(campaign.primaryCta) ?? heroPrimaryCta;
  const campaignSecondaryCta = normalizeCta(campaign.secondaryCta) ?? heroSecondaryCta;

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

  return (
    <main>
        {/* HERO */}
        <section className="relative overflow-hidden md:mt-28 py-6">
        <div
          className="absolute inset-0"
          aria-hidden
          style={
          heroImageUrl ? {
              backgroundImage: `url(${heroImageUrl})`,
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
            {heroHeader}
          </h1>

          {heroSubheader ? (
          <p className="mt-6 mb-4 max-w-3xl text-base leading-relaxed text-neutral-100 md:text-lg">
            {heroSubheader}
          </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {heroPrimaryCta ? (
                <div className="mt-4 mb-6">
                <a href={heroPrimaryCta.cta} className="btn btn-tertiary">
                    {heroPrimaryCta.ctaLabel}
                </a>
                </div>
            ) : null}
            {heroSecondaryCta ? (
                <div className="mt-4 mb-6">
                <a href={heroSecondaryCta.cta} className="btn btn-secondary">
                    {heroSecondaryCta.ctaLabel}
                </a>
                </div>
            ) : null}
          </div>
        </div>

        {/* Wave */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
            <svg
                viewBox="0 0 1440 120"
                className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
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
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gmcc-navy" />
        </div>
      </section>

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
                    <div className="grid grid-cols-2 items-center">
                        <div className="flex flex-col text-left">
                            <p className="body text-neutral-200 font-bold tracking-wide">Monday</p>
                            <p className="body text-neutral-200 font-bold tracking-wide">Tuesday</p>
                            <p className="body text-neutral-200 font-bold tracking-wide">Wednesday</p>
                            <p className="body text-neutral-200 font-bold tracking-wide">Thursday</p>
                            <p className="body text-neutral-200 font-bold tracking-wide">Friday</p>
                            <p className="body text-neutral-200 font-bold tracking-wide">Saturday</p>
                            <p className="body text-neutral-200 font-bold tracking-wide">Sunday</p>
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
                </div>
            </div>

            {/* Wave */}
            <div className="pointer-events-none relative -mt-12 mb-8 -mx-52 w-[calc(100%+26rem)] overflow-hidden leading-none">
              <svg
                viewBox="0 0 1440 180"
                className="block h-16 w-full md:h-20 lg:h-28"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="center-offers-wave-shadow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
                    <stop offset="55%" stopColor="#000000" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="
                    M0,120
                    C180,70 320,30 520,55
                    C740,85 870,165 1080,145
                    C1260,128 1370,70 1440,35
                    L1440,180
                    L0,180
                    Z
                  "
                  fill="var(--gmcc-navy)"
                />
                <path
                  d="
                    M0,120
                    C180,70 320,30 520,55
                    C740,85 870,165 1080,145
                    C1260,128 1370,70 1440,35
                    L1440,180
                    L0,180
                    Z
                  "
                  fill="url(#center-offers-wave-shadow)"
                />
              </svg>
            </div>

            <div className="grid gap-10 md:gap-16 md:grid-cols-3 items-start">
              <div className="stack-3 md:col-span-2">
                <h2 className="h2 mb-4 text-white">What this center offers</h2>
                <p className="body text-neutral-200 md:mb-8">{centerFields.longDescription}</p>
              </div>
              <div className="col-span-1">
                <h3 className="h3 mb-4 text-white">Quick highlights</h3>
                <div className="grid gap-4 grid-cols-2 items-start">
                  <div className="stack-3 col-span-1">
                    <ul className="text-neutral-200 space-y-2 text-center">
                      <li className="rounded-full bg-gmcc-teal px-4 py-2">Lorem ipsum</li>
                      <li className="rounded-full bg-gmcc-teal px-4 py-2">Lorem ipsum</li>
                    </ul>
                  </div>
                  <div className="stack-3 col-span-1">
                    <ul className="text-neutral-200 space-y-2 text-center">
                      <li className="rounded-full bg-gmcc-teal px-4 py-2">Lorem ipsum</li>
                      <li className="rounded-full bg-gmcc-teal px-4 py-2">Lorem ipsum</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="pointer-events-none -mt-px w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 390 120"
            className="block h-14 w-full text-gmcc-navy md:hidden"
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
            className="hidden h-16 w-full text-gmcc-navy md:block"
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
      </section>

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
        <h2 className="h2 mb-2">Ready to join?</h2>
        <p className="body mb-4">Join online or visit any of our centers to get started today.</p>
        <div className="card bg-gmcc-green py-6">
          <p className="text-3xl text-white font-bold tracking-wide ml-4">
            Start your membership in minutes.
            <a
              href={`/membership?center=${encodeURIComponent(slug)}#plans`}
              className="btn btn-primary justify-end float-right mr-4"
            >
              Join Now
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}