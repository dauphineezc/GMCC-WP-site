import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
    PAGE_HERO_FIELDS_GRAPHQL,
    resolvePhotoWaveHeaderProps,
    type WpPageWithHeroFields,
  } from "@/lib/pageHeroFields";
import { acfFileHref, acfGalleryCarouselImages, wpFetch } from "@/lib/wp";
import type { MediaRef } from "@/lib/acf";
import ImageCarousel from "@/components/imageCarousel";
import PhoneLink from "@/components/phoneLink";
import CorporateAmenityTiles from "@/components/corporateAmenityTiles";
import NavyWaveSection from "@/components/navyWaveSection";
import FeaturedTestimonialsCarousel from "@/components/featuredTestimonialsCarousel";
import { normalizeTestimonials } from "@/components/testimonials";
import { WP_MEDIA_IMAGE_FIELDS, type MediaFocalPointFields } from "@/lib/mediaFocalPoint";

type WpImageNode = {
  sourceUrl?: string | null;
  mediaItemUrl?: string | null;
  altText?: string | null;
} & MediaFocalPointFields;

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

const CORTEVA_FITNESS_CENTER_PAGE_QUERY = /* GraphQL */ `
query CortevaFitnessCenterPage($uri: ID!) {
  page(id: $uri, idType: URI) {
    id
    title
    slug

    ${PAGE_HERO_FIELDS_GRAPHQL}
    
    cortevaPageFields {
      logos {
        cortevaLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
        corporateWellnessLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
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
                photo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
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
          logo { node { ${WP_MEDIA_IMAGE_FIELDS} mediaItemUrl } }
          gallery {
            photos {
              node { ${WP_MEDIA_IMAGE_FIELDS} mediaItemUrl }
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
    const memberStoryTestimonials = normalizeTestimonials(memberStory?.nodes ?? []);

    return (
        <main className="overflow-x-clip">
            <PhotoWaveHeader
                title={heroProps.title}
                subheader={heroProps.subheader ?? null}
                imageUrl={heroProps.imageUrl ?? null}
                imagePosition={heroProps.imagePosition}
                ctas={heroProps.ctas}
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
              <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-16">
                <div className="stack-3">
                  <h2 className="h2 mb-4 text-white">Location</h2>
                  {address ? (
                    <p className="flex items-start gap-2 mt-2 body text-neutral-200 hover:text-white hover:underline">
                      <LocationIcon />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {address}
                      </a>
                    </p>
                  ) : null}
                </div>
                <div className="stack-3 md:col-start-1 lg:col-start-2 lg:row-start-1">
                  <h2 className="h2 mb-4 text-white">Contact</h2>
                  {phone ? (
                    <p className="flex items-center gap-2 body text-neutral-200 hover:text-white hover:underline">
                      <PhoneIcon />
                      <PhoneLink phone={phone} />
                    </p>
                  ) : null}
                  {email ? (
                    <p className="flex items-center gap-2 body text-neutral-200 hover:text-white hover:underline">
                      <EmailIcon />
                      <a href={`mailto:${email}`}>{email}</a>
                    </p>
                  ) : null}
                </div>
                <div className="stack-3 md:col-start-2 md:row-start-1 md:row-span-2 lg:col-start-3 lg:row-start-1">
                  <h2 className="h2 mb-4 text-white">Hours</h2>
                  <div className="grid w-fit grid-cols-[auto_auto] items-baseline gap-x-12">
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
                    <div className="flex flex-col text-left">
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
                {cortevaHeader ? <h2 className="h2 mb-4">{cortevaHeader}</h2> : null}
                {cortevaDescription ? <p className="body mb-8">{cortevaDescription}</p> : null}
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

            {memberStoryTestimonials.length > 0 ? (
              <section className="page-section">
                <div>
                  <div className="relative text-center">
                    {memberStoryHeader ? <h2 className="h2 text-gmcc-navy">{memberStoryHeader}</h2> : null}
                  </div>

                  <figure className="mx-auto max-w-3xl">
                    <div className="text-5xl mb-0 leading-none text-gmcc-teal/50">“</div>
                    <FeaturedTestimonialsCarousel testimonials={memberStoryTestimonials} />
                  </figure>
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

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/corteva-fitness-center");
}