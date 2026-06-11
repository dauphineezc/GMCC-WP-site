import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
    PAGE_HERO_FIELDS_GRAPHQL,
    resolvePhotoWaveHeaderProps,
    type WpPageWithHeroFields,
  } from "@/lib/pageHeroFields";
import { acfFileHref, acfGalleryCarouselImages, resolveWpMediaUrl, wpFetch } from "@/lib/wp";
import type { MediaRef } from "@/lib/acf";
import ImageCarousel from "@/components/imageCarousel";
import PhoneLink from "@/components/phoneLink";
import CorporateAmenityTiles from "@/components/corporateAmenityTiles";
import CorporateMembershipBenefits from "@/components/corporateMembershipBenefits";
import NavyWaveSection from "@/components/navyWaveSection";

type WpImageNode = {
  sourceUrl?: string | null;
  mediaItemUrl?: string | null;
  altText?: string | null;
};

type CenterHours = {
  mondayHours?: string | null;
  tuesdayHours?: string | null;
  wednesdayHours?: string | null;
  thursdayHours?: string | null;
  fridayHours?: string | null;
  saturdayHours?: string | null;
  sundayHours?: string | null;
};

type CorporateCenterNode = {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  corporateWellnessCenterFields?: {
    websiteLink?: string | null;
    address?: string | null;
    phoneNumber?: string | null;
    emailAddress?: string | null;
    hours?: CenterHours | null;
    logo?: { node?: WpImageNode | null } | null;
    gallery?: unknown;
  } | null;
};

const SERVICE_KEYS = ["service1", "service2", "service3", "service4", "service5"] as const;
const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;
const HOURS_BY_DAY: Array<{ key: keyof CenterHours; label: string }> = [
  { key: "mondayHours", label: "Monday" },
  { key: "tuesdayHours", label: "Tuesday" },
  { key: "wednesdayHours", label: "Wednesday" },
  { key: "thursdayHours", label: "Thursday" },
  { key: "fridayHours", label: "Friday" },
  { key: "saturdayHours", label: "Saturday" },
  { key: "sundayHours", label: "Sunday" },
];

const renderScheduleFile = (url?: string, label?: string) => {
    if (!url) {
      return <p className="text-neutral-600">Schedule file unavailable.</p>;
    }

    const normalizedUrl = url.split("?")[0]?.toLowerCase() ?? "";
    const isPdf = normalizedUrl.endsWith(".pdf");
    const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].some((ext) =>
      normalizedUrl.endsWith(ext),
    );

    if (isPdf) {
      return (
        <div className="space-y-3">
          <div className="overflow-hidden bg-white p-8">
            <iframe
              src={url}
              title={label ? `${label} schedule PDF` : "Schedule PDF"}
              className="h-[720px] w-full"
            />
          </div>
          {/* <a href={url} target="_blank" rel="noopener noreferrer" className="text-gmcc-teal underline">
            Open PDF in new tab
          </a> */}
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="space-y-3">
          <div className="overflow-hidden bg-white p-8">
            <img src={url} alt={label ? `${label} schedule` : "Schedule"} className="h-auto w-full object-contain" />
          </div>
          {/* <a href={url} target="_blank" rel="noopener noreferrer" className="text-gmcc-teal underline">
            Open file in new tab
          </a> */}
        </div>
      );
    }

    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-gmcc-teal underline">
        Open schedule file
      </a>
    );
  };

const CORTEVA_FITNESS_CENTER_PAGE_QUERY = /* GraphQL */ `
query CortevaFitnessCenterPage($uri: ID!) {
  page(id: $uri, idType: URI) {
    id
    title
    slug

    ${PAGE_HERO_FIELDS_GRAPHQL}
    
    cortevaPageFields {
      logos {
        cortevaLogo { node { sourceUrl altText } }
        corporateWellnessLogo { node { sourceUrl altText } }
      }

      cortevaHeader
      cortevaDescription

      services {
        service1
        service2
        service3
        service4
        service5
      }

      membershipHeader
      membershipTiersPdf { node { sourceUrl mediaItemUrl title } }
      cortevaMembershipApplication { node { sourceUrl mediaItemUrl title } }
      threeRiversMembershipApplication { node { sourceUrl mediaItemUrl title } }

      membershipProcessHeader
      membershipProcess {
        step1 { header body }
        step2 { header body }
        step3 { header body }
        step4 { header body }
      }

      membershipEligibilityHeader
      membershipEligibilityBody

      groupFitnessHeader
      groupFitnessBody
      onlineGroupFitnessLink

      personalTrainingHeader
      personalTrainingBody
      personalTrainingContactLink

      memberStoryHeader
      memberStory {
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

  }
  corporateWellnessCenters {
    nodes {
      ... on CorporateWellnessCenter {
        name
        slug
        description
        corporateWellnessCenterFields {
          websiteLink
          address
          phoneNumber
          emailAddress
          hours {
            mondayHours
            tuesdayHours
            wednesdayHours
            thursdayHours
            fridayHours
            saturdayHours
            sundayHours
          }
          logo { node { sourceUrl mediaItemUrl altText } }
          gallery {
            photos {
              node { sourceUrl mediaItemUrl altText }
            }
          }
        }
      }
    }
  }
}
`;

type CortevaFitnessCenterPageData = {
  page?: WpPageWithHeroFields & {
    cortevaPageFields?: {
      logos?: {
        cortevaLogo?: { node?: WpImageNode | null } | null;
        corporateWellnessLogo?: { node?: WpImageNode | null } | null;
      } | null;
      cortevaHeader?: string | null;
      cortevaDescription?: string | null;
      services?: {
        service1?: string | null;
        service2?: string | null;
        service3?: string | null;
        service4?: string | null;
        service5?: string | null;
      } | null;
      membershipHeader?: string | null;
      membershipTiersPdf?: { node?: MediaRef | null } | null;
      cortevaMembershipApplication?: { node?: MediaRef | null } | null;
      threeRiversMembershipApplication?: { node?: MediaRef | null } | null;
      membershipProcessHeader?: string | null;
      membershipProcess?: {
        step1?: { header?: string | null; body?: string | null } | null;
        step2?: { header?: string | null; body?: string | null } | null;
        step3?: { header?: string | null; body?: string | null } | null;
        step4?: { header?: string | null; body?: string | null } | null;
      } | null;
      membershipEligibilityHeader?: string | null;
      membershipEligibilityBody?: string | null;
      groupFitnessHeader?: string | null;
      groupFitnessBody?: string | null;
      onlineGroupFitnessLink?: string | null;
      personalTrainingHeader?: string | null;
      personalTrainingBody?: string | null;
      personalTrainingContactLink?: string | null;
      memberStoryHeader?: string | null;
      memberStory?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          testimonialFields?: {
            quote?: string | null;
            personName?: string | null;
            personContext?: string | null;
            photo?: { node?: WpImageNode | null } | null;
          } | null;
        } | null> | null;
      } | null;
    } | null;
  };
  corporateWellnessCenters?: {
    nodes?: (CorporateCenterNode | null)[] | null;
  } | null;
};


export default async function CortevaFitnessCenterPage() {
    const data = await wpFetch<CortevaFitnessCenterPageData>(
        CORTEVA_FITNESS_CENTER_PAGE_QUERY,
        { uri: "/corteva-fitness-center/" },
        { suppressGraphQLErrorLogging: true },
    );

    const page = data?.page ?? null;
    const heroProps = resolvePhotoWaveHeaderProps(page, "Corteva Fitness Center");
    const logos = page?.cortevaPageFields?.logos;
    const cortevaLogo = logos?.cortevaLogo?.node;
    const corporateWellnessLogo = logos?.corporateWellnessLogo?.node;
    const cortevaHeader = page?.cortevaPageFields?.cortevaHeader;
    const cortevaDescription = page?.cortevaPageFields?.cortevaDescription;
    const services = page?.cortevaPageFields?.services;
    const membershipHeader = page?.cortevaPageFields?.membershipHeader;
    const membershipTiersPdf = page?.cortevaPageFields?.membershipTiersPdf;
    const cortevaMembershipApplication = page?.cortevaPageFields?.cortevaMembershipApplication;
    const threeRiversMembershipApplication = page?.cortevaPageFields?.threeRiversMembershipApplication;
    const membershipProcessHeader = page?.cortevaPageFields?.membershipProcessHeader;
    const membershipProcess = page?.cortevaPageFields?.membershipProcess;
    const membershipEligibilityHeader = page?.cortevaPageFields?.membershipEligibilityHeader;
    const membershipEligibilityBody = page?.cortevaPageFields?.membershipEligibilityBody;
    const groupFitnessHeader = page?.cortevaPageFields?.groupFitnessHeader;
    const groupFitnessBody = page?.cortevaPageFields?.groupFitnessBody;
    const onlineGroupFitnessLink = page?.cortevaPageFields?.onlineGroupFitnessLink;
    const personalTrainingHeader = page?.cortevaPageFields?.personalTrainingHeader;
    const personalTrainingBody = page?.cortevaPageFields?.personalTrainingBody;
    const personalTrainingContactLink = page?.cortevaPageFields?.personalTrainingContactLink;
    const memberStoryHeader = page?.cortevaPageFields?.memberStoryHeader;
    const memberStory = page?.cortevaPageFields?.memberStory;
    const corporateWellnessCenters =
      data?.corporateWellnessCenters?.nodes?.filter(
        (center): center is CorporateCenterNode => center != null,
      ) ?? [];
    const cortevaCenter =
      corporateWellnessCenters.find((center) => {
        const slug = (center.slug ?? "").toLowerCase();
        const name = (center.name ?? "").toLowerCase();
        return slug.includes("corteva") || name.includes("corteva");
      }) ?? null;
    const cortevaCenterFields = cortevaCenter?.corporateWellnessCenterFields ?? null;
    const cortevaGalleryImages = acfGalleryCarouselImages(cortevaCenterFields?.gallery);
    const serviceItems =
      services == null
        ? []
        : SERVICE_KEYS.map((key) => (services[key] ?? "").trim()).filter(Boolean);
    const hourRows = HOURS_BY_DAY.map((day) => ({
      day: day.label,
      hours: cortevaCenterFields?.hours?.[day.key]?.trim() || "Closed",
    }));
    const address = cortevaCenterFields?.address?.trim() || null;
    const phone = cortevaCenterFields?.phoneNumber?.trim() || null;
    const email = cortevaCenterFields?.emailAddress?.trim() || null;
    const membershipTiersPdfHref = acfFileHref(membershipTiersPdf);
    const cortevaApplicationHref = acfFileHref(cortevaMembershipApplication);
    const threeRiversApplicationHref = acfFileHref(threeRiversMembershipApplication);
    const membershipSteps =
      membershipProcess == null
        ? []
        : STEP_KEYS.flatMap((key, index) => {
            const step = membershipProcess[key];
            const header = (step?.header ?? "").trim();
            const body = (step?.body ?? "").trim();
            if (!header && !body) return [];
            return [{ number: index + 1, header, body }];
          });
    const eligibilityBenefits = membershipSteps.map((step) => ({
      header: step.header || `Step ${step.number}`,
      description: step.body,
    }));
    const memberStoryTestimonial =
      memberStory?.nodes?.find((node): node is NonNullable<typeof node> => node != null) ?? null;
    const memberStoryImageUrl = resolveWpMediaUrl(
      memberStoryTestimonial?.testimonialFields?.photo?.node?.sourceUrl,
    );
    const memberStoryPersonName =
      memberStoryTestimonial?.testimonialFields?.personName?.trim() ||
      memberStoryTestimonial?.title?.trim() ||
      "";
    const memberStoryQuote = memberStoryTestimonial?.testimonialFields?.quote?.trim() || "";
    const memberStoryPersonContext = memberStoryTestimonial?.testimonialFields?.personContext?.trim() || "";
    const memberStoryPhotoAlt = memberStoryTestimonial?.testimonialFields?.photo?.node?.altText ?? "";

    return (
        <main>
            <PhotoWaveHeader
                title={heroProps.title}
                subheader={heroProps.subheader ?? null}
                imageUrl={heroProps.imageUrl ?? null}
                ctas={heroProps.ctas}
                flushBottom={true}
                waveFillClassName="text-gmcc-navy"
                waveEdgeClassName="bg-gmcc-navy"
            />

            <NavyWaveSection
              className="relative w-screen -ml-[calc(50vw-50%)] overflow-x-clip scroll-mt-24"
              fullBleed={false}
              topWave={false}
              bandClassName="py-10"
            >
              <div className="grid gap-16 items-start md:grid-cols-3">
                <div className="stack-3 col-span-1 mb-8">
                  <h2 className="h2 mb-4 text-white">Location</h2>
                  {address ? (
                    <p className="body text-neutral-200">{address}</p>
                  ) : (
                    <p className="body text-neutral-200">Location coming soon.</p>
                  )}
                  {address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 btn btn-tertiary"
                    >
                      View on Google Maps
                    </a>
                  ) : null}
                </div>
                <div className="stack-3 col-span-1 mb-8">
                  <h2 className="h2 mb-4 text-white">Contact</h2>
                  {phone ? (
                    <PhoneLink className="body text-neutral-200 hover:text-white hover:underline" phone={phone} />
                  ) : (
                    <p className="body text-neutral-200">Phone coming soon.</p>
                  )}
                  {email ? (
                    <a href={`mailto:${email}`} className="body text-neutral-200 hover:text-white hover:underline">
                      {email}
                    </a>
                  ) : (
                    <p className="body text-neutral-200">Email coming soon.</p>
                  )}
                </div>
                <div className="stack-3 col-span-1 mb-14 md:mb-0">
                  <h2 className="h2 mb-4 text-white">Hours</h2>
                  <div className="grid grid-cols-2 items-center gap-y-1">
                    <div className="flex flex-col text-left">
                      {hourRows.map((row) => (
                        <p
                          key={`day-${row.day}`}
                          className="body text-sm text-neutral-200 font-bold uppercase tracking-wide"
                        >
                          {row.day}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-col text-right">
                      {hourRows.map((row) => (
                        <p key={`hours-${row.day}`} className="body text-neutral-200">
                          {row.hours}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </NavyWaveSection>

            <section className="page-section stack-4">
                {cortevaHeader ? <h2 className="h2 mb-4 text-center">{cortevaHeader}</h2> : null}
                {cortevaDescription ? <p className="body mb-8 text-center">{cortevaDescription}</p> : null}
                {cortevaGalleryImages.length > 0 ? (
                  <div className="mb-8">
                    <ImageCarousel images={cortevaGalleryImages} />
                  </div>
                ) : null}
                {serviceItems.length > 0 ? <CorporateAmenityTiles items={serviceItems} /> : null}
            </section>

            <NavyWaveSection
              splitTopWave
              bottomWave={false}
              bandClassName=""
              contentClassName="mx-auto max-w-6xl px-4 pt-16 pb-16"
            >
              <h2 className="h2 text-center text-white mb-8">Guided Workouts With Our Experts</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <article className="card card-hover bg-white p-8 text-center">
                  {groupFitnessHeader ? <h3 className="h3 text-gmcc-navy">{groupFitnessHeader}</h3> : null}
                  {groupFitnessBody ? <p className="body mt-4 text-neutral-700">{groupFitnessBody}</p> : null}
                  {onlineGroupFitnessLink ? (
                    <a
                      href={onlineGroupFitnessLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-tertiary mt-6"
                    >
                      View Group Fitness
                    </a>
                  ) : null}
                </article>

                <article className="card card-hover bg-white p-8 text-center">
                  {personalTrainingHeader ? (
                    <h3 className="h3 text-gmcc-navy">{personalTrainingHeader}</h3>
                  ) : null}
                  {personalTrainingBody ? (
                    <p className="body mt-4 text-neutral-700">{personalTrainingBody}</p>
                  ) : null}
                  {personalTrainingContactLink ? (
                    <a
                      href={personalTrainingContactLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-tertiary mt-6"
                    >
                      Contact us to get started
                    </a>
                  ) : null}
                </article>
              </div>
            </NavyWaveSection>

            {memberStoryTestimonial ? (
              <section className="relative mt-0">
                <div className="mx-auto w-full">
                  <div className="overflow-hidden bg-white">
                    <div className="grid md:grid-cols-2">
                      <div className="relative min-h-[280px] md:min-h-[360px]">
                        {memberStoryImageUrl ? (
                          <img
                            src={memberStoryImageUrl}
                            alt={memberStoryPhotoAlt}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full bg-neutral-700" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center p-10 md:p-14 bg-[#e6f2ef]">
                        {memberStoryHeader ? (
                          <h2 className="h2 text-gmcc-navy">{memberStoryHeader}</h2>
                        ) : null}
                        {memberStoryQuote ? (
                          <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-gmcc-navy">
                            {memberStoryQuote}
                          </p>
                        ) : null}
                        <div className="mt-8">
                            <div className="text-sm font-bold text-gmcc-navy">{memberStoryPersonName}</div>
                            {memberStoryPersonContext ? <div className="text-xs text-neutral-500">{memberStoryPersonContext}</div> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="page-section stack-6">
                {membershipHeader ? <h2 className="h2 text-center mt-8">{membershipHeader}</h2> : null}
                <div className="stack-3">
                    {renderScheduleFile(
                    membershipTiersPdfHref,
                    "Membership Tiers PDF",
                    )}
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-8">
                    {cortevaApplicationHref ? (
                      <a
                        href={cortevaApplicationHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        Corteva Membership Application
                      </a>
                    ) : null}
                    {threeRiversApplicationHref ? (
                      <a
                        href={threeRiversApplicationHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        Three Rivers Membership Application
                      </a>
                    ) : null}
                </div>
            </section>

            {membershipEligibilityHeader && membershipEligibilityBody ? (
              <section className="mx-auto max-w-2xl px-4 pt-6 pb-16">
                <h2 className="h2 text-center">{membershipEligibilityHeader}</h2>
                <ul className="body mt-8">
                  {membershipEligibilityBody.split('\n').map((b: string, i: number) => (
                    <li key={i} className="list-disc pl-2 pb-2 marker:text-gmcc-navy">{b}</li>
                  ))}
                </ul>
                <p className="text-sm mt-4 pl-2 text-start text-neutral-700 italic">* Eligible family members include spouse and/or dependents age 14-25.</p>
              </section>
            ) : null}

        </main>
    );
}