import { fetchPageWithHeroFields, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import { resolveWpMediaUrl } from "@/lib/wp";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import ImageCarousel from "@/components/imageCarousel";
import type { Metadata } from "next";
import PhoneLink from "@/components/phoneLink";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Corporate Wellness Centers",
  description: "Explore Greater Midland corporate wellness center partners.",
};

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
            logo { node { sourceUrl mediaItemUrl altText } }
            gallery {
              photo1 { node { sourceUrl mediaItemUrl altText } }
              photo2 { node { sourceUrl mediaItemUrl altText } }
              photo3 { node { sourceUrl mediaItemUrl altText } }
              photo4 { node { sourceUrl mediaItemUrl altText } }
              photo5 { node { sourceUrl mediaItemUrl altText } }
              photo6 { node { sourceUrl mediaItemUrl altText } }
            }
          }
        }
      }
    }

    partnerLogos {
      logo1 { node { sourceUrl mediaItemUrl altText } }
      logo2 { node { sourceUrl mediaItemUrl altText } }
      logo3 { node { sourceUrl mediaItemUrl altText } }
      logo4 { node { sourceUrl mediaItemUrl altText } }
      logo5 { node { sourceUrl mediaItemUrl altText } }
    }
  }
`;

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
  description?: string | null;
  corporateWellnessCenterFields?: {
    websiteLink?: string | null;
    address?: string | null;
    phoneNumber?: string | null;
    emailAddress?: string | null;
    hours?: CenterHours | null;
    gallery?: {
      photo1?: { node?: WpImageNode | null } | null;
      photo2?: { node?: WpImageNode | null } | null;
      photo3?: { node?: WpImageNode | null } | null;
      photo4?: { node?: WpImageNode | null } | null;
      photo5?: { node?: WpImageNode | null } | null;
      photo6?: { node?: WpImageNode | null } | null;
    } | null;
  } | null;
};

type CorporateWellnessPageExtra = {
  corporateWellnessPageFields?: {
    corporateCentersHeader?: string | null;
    corporateCentersBody?: string | null;
    employeeRequirementDisclaimer?: string | null;
    partnerLogos?: {
      logo1?: { node?: WpImageNode | null } | null;
      logo2?: { node?: WpImageNode | null } | null;
      logo3?: { node?: WpImageNode | null } | null;
      logo4?: { node?: WpImageNode | null } | null;
      logo5?: { node?: WpImageNode | null } | null;
    } | null;
    corporateWellnessCenters?: {
      nodes?: (CorporateCenterNode | null)[] | null;
    } | null;
  } | null;
};

function centerGalleryImages(center: CorporateCenterNode) {
  const gallery = center.corporateWellnessCenterFields?.gallery;
  const photos = [
    gallery?.photo1?.node,
    gallery?.photo2?.node,
    gallery?.photo3?.node,
    gallery?.photo4?.node,
    gallery?.photo5?.node,
    gallery?.photo6?.node,
  ];

  return photos
    .filter((photo): photo is WpImageNode => Boolean(photo?.sourceUrl || photo?.mediaItemUrl))
    .map((photo) => {
      const url = resolveWpMediaUrl(photo.sourceUrl ?? photo.mediaItemUrl);
      if (!url) return null;
      return {
        image: {
          sourceUrl: url,
          altText: photo.altText ?? null,
        },
        cta: null,
        url: null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
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
  const partnerLogos = page?.corporateWellnessPageFields?.partnerLogos;
  const partnerLogoNodes = [
    partnerLogos?.logo1?.node,
    partnerLogos?.logo2?.node,
    partnerLogos?.logo3?.node,
    partnerLogos?.logo4?.node,
    partnerLogos?.logo5?.node,
  ]
    .map((logo) => {
      const url = resolveWpMediaUrl(logo?.sourceUrl ?? logo?.mediaItemUrl);
      if (!url || !logo) return null;
      return { ...logo, resolvedUrl: url } as WpImageNode & { resolvedUrl: string };
    })
    .filter((logo): logo is WpImageNode & { resolvedUrl: string } => logo != null);

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} />

      <section className="mx-auto max-w-6xl px-4 py-10 section-y stack-6">
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
            {partnerLogoNodes.map((logo, index) => (
              <div
                key={`${logo.resolvedUrl}-${index}`}
                className="flex h-20 items-center justify-center rounded-lg border border-neutral-200 bg-white p-0"
              >
                <Image
                  src={logo.resolvedUrl}
                  alt={logo.altText?.trim() || `Corporate partner logo ${index + 1}`}
                  width={180}
                  height={72}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
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
                    <h3 className="h3">{center.name ?? "Corporate Wellness Center"}</h3>
                    {center.description ? (
                      <div
                        className="body text-neutral-700 mt-6 mb-6"
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