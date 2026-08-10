import { fetchPageWithHeroFields, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import { acfCorporatePartnerItems, acfGalleryCarouselImages } from "@/lib/wp";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import ImageCarousel from "@/components/imageCarousel";
import type { Metadata } from "next";
import PhoneLink from "@/components/phoneLink";
import Image from "next/image";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/corporate-wellness-centers");
}

const CORPORATE_WELLNESS_PAGE_EXTRA_FIELDS = /* GraphQL */ `
  corporateWellnessPageFields {
    corporateCentersHeader
    corporateCentersBody
    employeeRequirementDisclaimer
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

    corporatePartners {
      logo { node { ${WP_MEDIA_IMAGE_FIELDS} mediaItemUrl } }
      pageLink
    }
  }
`;

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
  description?: string | null;
  corporateWellnessCenterFields?: {
    websiteLink?: string | null;
    address?: string | null;
    phoneNumber?: string | null;
    emailAddress?: string | null;
    hours?: CenterHours | null;
    gallery?: unknown;
  } | null;
};

type CorporateWellnessPageExtra = {
  corporateWellnessPageFields?: {
    corporateCentersHeader?: string | null;
    corporateCentersBody?: string | null;
    employeeRequirementDisclaimer?: string | null;
    corporatePartners?: unknown;
    corporateWellnessCenters?: {
      nodes?: (CorporateCenterNode | null)[] | null;
    } | null;
  } | null;
};

function centerGalleryImages(center: CorporateCenterNode) {
  return acfGalleryCarouselImages(center.corporateWellnessCenterFields?.gallery);
}

const HOURS_BY_DAY: Array<{ key: keyof CenterHours; label: string }> = [
  { key: "mondayHours", label: "Mon" },
  { key: "tuesdayHours", label: "Tue" },
  { key: "wednesdayHours", label: "Wed" },
  { key: "thursdayHours", label: "Thu" },
  { key: "fridayHours", label: "Fri" },
  { key: "saturdayHours", label: "Sat" },
  { key: "sundayHours", label: "Sun" },
];

function compactHours(hours?: CenterHours | null): Array<{ dayLabel: string; hoursLabel: string }> {
  if (!hours) return [];

  const merged: Array<{ dayLabel: string; hoursLabel: string }> = [];

  for (let i = 0; i < HOURS_BY_DAY.length; i += 1) {
    const day = HOURS_BY_DAY[i];
    const currentHours = hours[day.key]?.trim();
    if (!currentHours) continue;

    let end = i;
    while (end + 1 < HOURS_BY_DAY.length) {
      const next = HOURS_BY_DAY[end + 1];
      if (hours[next.key]?.trim() !== currentHours) break;
      end += 1;
    }

    const dayLabel = i === end ? day.label : `${day.label}-${HOURS_BY_DAY[end].label}`;
    merged.push({ dayLabel, hoursLabel: currentHours });
    i = end;
  }

  return merged;
}

export default async function CorporateWellnessCentersPage() {
  const page = await fetchPageWithHeroFields<CorporateWellnessPageExtra>(
    "corporate-wellness-centers",
    CORPORATE_WELLNESS_PAGE_EXTRA_FIELDS,
  );
  const hero = resolvePhotoWaveHeaderProps(page, "Corporate Wellness Centers");
  const centersHeader = page?.corporateWellnessPageFields?.corporateCentersHeader;
  const centersBody = page?.corporateWellnessPageFields?.corporateCentersBody;
  const centers =
    page?.corporateWellnessPageFields?.corporateWellnessCenters?.nodes?.filter(
      (center): center is CorporateCenterNode => center != null,
    ) ?? [];
  const employeeRequirementDisclaimer = page?.corporateWellnessPageFields?.employeeRequirementDisclaimer;
  const partnerLogoNodes = acfCorporatePartnerItems(
    page?.corporateWellnessPageFields?.corporatePartners,
  );

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}/>

      <section className="page-section stack-6">
        {centersHeader ? <h2 className="h2 text-center">{centersHeader}</h2> : null}
        {centersBody ? (
          <div
            className="body mx-auto max-w-6xl text-center mt-4"
            dangerouslySetInnerHTML={{ __html: centersBody }}
          />
        ) : null}
        {employeeRequirementDisclaimer ? (
          <p className="body mx-auto max-w-6xl text-center text-sm mt-4 italic mb-8">
            <span className="font-semibold uppercase text-gmcc-navy text-sm">Please note:</span>{" "}
            {employeeRequirementDisclaimer}
            <a href="/centers" className="text-gmcc-teal text-sm hover:underline">click here</a>{" "}
          </p>
        ) : null}
        {partnerLogoNodes.length > 0 ? (
          <div className="mx-auto mt-2 mb-8 grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {partnerLogoNodes.map((logo, index) => {
              const alt = logo.altText?.trim() || `Corporate partner logo ${index + 1}`;
              const key = `${logo.resolvedUrl}-${index}`;
              const cellClass =
                "flex h-20 items-center justify-center rounded-lg border border-neutral-200 bg-white p-0";
              const image = (
                <Image
                  src={logo.resolvedUrl}
                  alt={alt}
                  width={180}
                  height={72}
                  className="h-full w-full object-contain"
                />
              );
              if (logo.pageLink) {
                const external = /^https?:\/\//i.test(logo.pageLink);
                return (
                  <a
                    key={key}
                    href={logo.pageLink}
                    className={`${cellClass} text-inherit no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gmcc-teal`}
                    {...(external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {})}
                  >
                    {image}
                  </a>
                );
              }
              return (
                <div key={key} className={cellClass}>
                  {image}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="stack-8">
          {centers.map((center, index) => {
            const fields = center.corporateWellnessCenterFields;
            const galleryImages = centerGalleryImages(center);
            const centerHours = compactHours(fields?.hours);

            return (
              <article
                key={`${center.name ?? "center"}-${index}`}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
              >
                <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                  <div className="stack-2">
                    <h3 className="h3 mb-6">{center.name ?? "Corporate Wellness Center"}</h3>
                    {center.description ? (
                      <div
                        className="body text-neutral-700 mb-6"
                        dangerouslySetInnerHTML={{ __html: center.description }}
                      />
                    ) : null}
                    {fields?.address ? 
                      <p className="body text-neutral-700">
                        <span className="font-semibold uppercase text-gmcc-navy text-sm">Address:</span> {fields.address}
                      </p> : null}
                    {fields?.phoneNumber ? (
                      <p className="body text-neutral-700">
                        <span className="font-semibold uppercase text-gmcc-navy text-sm">Phone:</span> <PhoneLink phone={fields.phoneNumber} className="text-gmcc-teal text-base hover:underline" />
                      </p>
                    ) : null}
                    {fields?.emailAddress ? (
                      <p className="body text-neutral-700">
                        <span className="font-semibold uppercase text-gmcc-navy text-sm">Email:</span> <a href={`mailto:${fields.emailAddress}`} className="text-gmcc-teal text-base hover:underline">{fields.emailAddress}</a>
                      </p>
                    ) : null}
                    {centerHours.length > 0 ? (
                      <div className="body text-neutral-700 mt-3">
                        <p className="font-semibold uppercase text-gmcc-navy text-sm">Hours:</p>
                        <ul className="mt-2 space-y-1">
                          {centerHours.map((entry) => (
                            <li key={`${entry.dayLabel}-${entry.hoursLabel}`}>
                              <span className="pl-4 font-semibold uppercase text-gmcc-navy text-xs">{entry.dayLabel}:</span>{" "}
                              {entry.hoursLabel}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {fields?.websiteLink ? (
                      <a
                        href={fields.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-gmcc-teal font-semibold hover:underline underline-offset-2 mt-6"
                      >
                        Visit Website →
                      </a>
                    ) : null}
                  </div>

                  <div>
                    {galleryImages.length > 0 ? (
                      <ImageCarousel images={galleryImages} />
                    ) : (
                      <div className="flex min-h-60 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500">
                        Photos coming soon.
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}