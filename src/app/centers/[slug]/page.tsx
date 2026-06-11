// src/app/centers/[slug]/page.tsx
import AmenitiesGrid from "@/components/amenitiesGrid";
import CenterCampaignModule from "@/components/centerCampaignModule";
import FeaturedTestimonialsCarousel from "@/components/featuredTestimonialsCarousel";
import PhoneLink from "@/components/phoneLink";
import { normalizeTestimonials } from "@/components/testimonials";
import { extractAmenitySlugs, toAmenityDisplayForCenter } from "@/lib/amenities";
import { fetchAmenitiesWithImages } from "@/lib/amenities";
import { acfGalleryPhotoNodes, wpFetch } from "@/lib/wp";
import { resolveHeroCta } from "@/lib/pageHeroFields";
import type { HeroCta } from "@/components/photoWaveHeader";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import NavyWaveSection from "@/components/navyWaveSection";
import {
  coerceWpRichText,
  fetchCenterDetailPageFields,
  isCurlingCenterSlug,
  resolveCenterSocialLinks,
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
        socialLinks {
          instagram
          facebook
          youtube
          tiktok
        }
        brochureFields {
          brochureHeader
          programBrochure { node { mediaItemUrl } }
          programBrochureLabel
          campBrochure { node { mediaItemUrl } }
          campBrochureLabel
        }
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

        newsletterSignUp {
          header
          subheader
        }

        featuredTestimonials {
          nodes {
            ... on Testimonial {
              id
              title
              testimonialFields {
                quote
                personName
                personContext
                photo { node { sourceUrl altText } }
              }
            }
          }
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
          photos {
            node {
              sourceUrl
              altText
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


function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M12 22c-4.2-4.9-7-8.3-7-12a7 7 0 1 1 14 0c0 3.7-2.8 7.1-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M7.6 2h3.1c.6 0 1.1.4 1.2 1l.7 3.2c.1.5-.1 1-.5 1.3L10 9.5a14.4 14.4 0 0 0 4.5 4.5l2-2.1c.3-.4.8-.6 1.3-.5l3.2.7c.6.1 1 .6 1 1.2v3.1c0 .7-.6 1.3-1.3 1.3C11.6 18 6 12.4 6.3 3.3 6.3 2.6 6.9 2 7.6 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"
        fill="currentColor"
      />
    </svg>
  );
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
  const brochureFields = centerFields.brochureFields ?? {};
  const programBrochureUrl =
    brochureFields.programBrochure?.node?.mediaItemUrl?.trim() || null;
  const programBrochureLabel =
    brochureFields.programBrochureLabel?.trim() || "Program brochure";
  const campBrochureUrl =
    brochureFields.campBrochure?.node?.mediaItemUrl?.trim() || null;
  const campBrochureLabel =
    brochureFields.campBrochureLabel?.trim() || "Camp brochure";
  const hasBrochures = Boolean(programBrochureUrl || campBrochureUrl);
  const brochureHeader = brochureFields.brochureHeader?.trim() || null;
  const centerSocialLinks = resolveCenterSocialLinks(
    centerDetailFields?.socialIcons,
    centerFields.socialLinks,
  );
  const featuredTestimonials = normalizeTestimonials(centerFields.featuredTestimonials?.nodes ?? []);
  const newsletterSignUp = centerFields.newsletterSignUp ?? {};
  const newsletterHeader = (newsletterSignUp.header ?? "").trim() || null;
  const newsletterSubheader = (newsletterSignUp.subheader ?? "").trim() || null;
  const showNewsletterSignUp = Boolean(newsletterHeader || newsletterSubheader);
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
    gallery: acfGalleryPhotoNodes(campaign.gallery).map((node) => ({
      sourceUrl: node.sourceUrl ?? null,
      altText: node.altText ?? null,
    })),
  };

  const isCurlingCenter = isCurlingCenterSlug(slug, center.slug ?? null);
  const curlingLayout = centerDetailFields?.curlingCenterPageFields;
  const readyToJoinLayout = centerDetailFields?.readyToJoinSection;
  const testimonialHeader = centerDetailFields?.testimonialHeader;
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
    <main className="overflow-x-clip">
      <PhotoWaveHeader
        title={heroHeader}
        subheader={heroSubheader}
        imageUrl={heroImageUrl}
        ctas={heroCtas.length > 0 ? heroCtas : undefined}
        flushBottom={true}
        waveFillClassName="text-gmcc-navy"
        waveEdgeClassName="bg-gmcc-navy"
        minHeight={true}
      />

      <NavyWaveSection
        className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip scroll-mt-24"
        fullBleed={false}
        topWave={false}
        bandClassName="py-10"
        contentClassName="mx-auto max-w-6xl px-6"
      >
        <div className="grid gap-8 md:grid-cols-3 md:gap-16 items-start">
          <div className="stack-3">
            <h2 className="h2 mb-4 text-white">Location</h2>
            <p className="flex items-start gap-2 mt-2 body text-neutral-200 hover:text-white hover:underline">
              <LocationIcon />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centerFields.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {centerFields.address}
              </a>
            </p>
          </div>
          <div className="stack-3">
            <h2 className="h2 mb-4 text-white">Contact</h2>
            <p className="flex items-center gap-2 body text-neutral-200 hover:text-white hover:underline">
              <PhoneIcon />
              <PhoneLink phone={centerFields.contactInfo.contactPhone} />
            </p>
            <p className="flex items-center gap-2 body text-neutral-200 hover:text-white hover:underline">
              {centerFields.contactInfo.contactEmail ? (
                <>
                  <EmailIcon />
                  <a href={`mailto:${centerFields.contactInfo.contactEmail}`}>
                    {centerFields.contactInfo.contactEmail}
                  </a>
                </>
              ) : null}
            </p>
            {centerSocialLinks.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {centerSocialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.iconAlt}
                    className="inline-flex rounded-md opacity-90 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gmcc-teal focus-visible:ring-offset-2 focus-visible:ring-offset-gmcc-navy"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={social.iconUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-6 w-6 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div className={`stack-3 md:mb-0${hasBrochures ? " md:row-span-2" : ""}`}>
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
                    <p className="body text-neutral-200">
                      {centerFields.hours.mondayHours.mondayOpenTime} -{" "}
                      {centerFields.hours.mondayHours.mondayCloseTime}
                    </p>
                  )}
                  {centerFields.hours.tuesdayHours.closedTuesday ? (
                    <p className="body text-neutral-200">Closed</p>
                  ) : (
                    <p className="body text-neutral-200">
                      {centerFields.hours.tuesdayHours.tuesdayOpenTime} -{" "}
                      {centerFields.hours.tuesdayHours.tuesdayCloseTime}
                    </p>
                  )}
                  {centerFields.hours.wednesdayHours.closedWednesday ? (
                    <p className="body text-neutral-200">Closed</p>
                  ) : (
                    <p className="body text-neutral-200">
                      {centerFields.hours.wednesdayHours.wednesdayOpenTime} -{" "}
                      {centerFields.hours.wednesdayHours.wednesdayCloseTime}
                    </p>
                  )}
                  {centerFields.hours.thursdayHours.closedThursday ? (
                    <p className="body text-neutral-200">Closed</p>
                  ) : (
                    <p className="body text-neutral-200">
                      {centerFields.hours.thursdayHours.thursdayOpenTime} -{" "}
                      {centerFields.hours.thursdayHours.thursdayCloseTime}
                    </p>
                  )}
                  {centerFields.hours.fridayHours.closedFriday ? (
                    <p className="body text-neutral-200">Closed</p>
                  ) : (
                    <p className="body text-neutral-200">
                      {centerFields.hours.fridayHours.fridayOpenTime} -{" "}
                      {centerFields.hours.fridayHours.fridayCloseTime}
                    </p>
                  )}
                  {centerFields.hours.saturdayHours.closedSaturday ? (
                    <p className="body text-neutral-200">Closed</p>
                  ) : (
                    <p className="body text-neutral-200">
                      {centerFields.hours.saturdayHours.saturdayOpenTime} -{" "}
                      {centerFields.hours.saturdayHours.saturdayCloseTime}
                    </p>
                  )}
                  {centerFields.hours.sundayHours.closedSunday ? (
                    <p className="body text-neutral-200">Closed</p>
                  ) : (
                    <p className="body text-neutral-200">
                      {centerFields.hours.sundayHours.sundayOpenTime} -{" "}
                      {centerFields.hours.sundayHours.sundayCloseTime}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          {hasBrochures ? (
            <div className="stack-3 md:col-span-2">
              {brochureHeader ? <h2 className="h2 mb-4 text-white">{brochureHeader}</h2> : null}
              <div className="flex flex-wrap gap-3">
                {programBrochureUrl ? (
                  <a
                    href={programBrochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn text-neutral-200 border border-neutral-200 hover:text-gmcc-teal hover:border-gmcc-teal w-fit"
                  >
                    {programBrochureLabel}
                  </a>
                ) : null}
                {campBrochureUrl ? (
                  <a
                    href={campBrochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn text-neutral-200 border border-neutral-200 hover:text-gmcc-teal hover:border-gmcc-teal w-fit"
                  >
                    {campBrochureLabel}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </NavyWaveSection>

      <section className="page-section stack-4">
        <h2 className="h2 mb-4">What you'll find here</h2>
        <p className="body mb-8">{centerFields.longDescription}</p>
        {/* Amenities Grid */}
        {amenitiesForThisCenter.length > 0 && (
          <AmenitiesGrid amenities={amenitiesForThisCenter} title="What we offer" />
        )}
        
        <CenterCampaignModule module={campaignModule} />
      </section>

      {featuredTestimonials.length > 0 ? (
        <section className="">
          <div>
            <div className="relative text-center">
              <h2 className="h2 text-gmcc-navy">{testimonialHeader}</h2>
            </div>

            <figure className="mx-auto max-w-3xl">
              <div className="text-5xl mb-0 leading-none text-gmcc-teal/50">“</div>
              <FeaturedTestimonialsCarousel testimonials={featuredTestimonials} />
            </figure>
          </div>
        </section>
      ) : null}

      <section className="page-section stack-4">
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

      {showNewsletterSignUp ? (
        <section className="page-section-wide text-center mt-[-4rem]">
          <div className="card bg-gmcc-navy">
            <div className="col-span-1">
              {newsletterHeader ? <h3 className="h3 mb-2 text-white">{newsletterHeader}</h3> : null}
              {newsletterSubheader ? <p className="text-sm mb-4 mx-8 text-neutral-200">{newsletterSubheader}</p> : null}
            </div>
            <div className="col-span-1 flex justify-center">
              <form
                aria-label="Newsletter signup (placeholder)"
              >
                <div className="flex-1 sm:max-w-md min-w-sm">
                  <input
                    id={`center-newsletter-email-${slug}`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                  />
                </div>
                <div className="mt-4 flex justify-center">
                  <button type="button" className="btn btn-secondary shrink-0">
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}