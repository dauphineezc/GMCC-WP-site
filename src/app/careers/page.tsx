import PhotoWaveHeader from "@/components/photoWaveHeader";
import AdpRecruitmentWidget from "@/components/careers/adpRecruitmentWidget";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { ImageField, WP_MEDIA_IMAGE_FIELDS } from "@/lib/acf";
import { resolveWpMediaUrl } from "@/lib/wp";
import Image from "next/image";
import JotFormLightboxButton from "@/components/jotFormLightboxButton";

const CAREERS_PAGE_FIELDS = `
  careersPageFields {
    introductionHeader
    introductionBody
    currentOpeningsHeader
    currentOpeningsSubheader
    howToApplyHeader
    howToApplyBody
    internshipOpportunitiesHeader
    internshipOpportunitiesBody
    stayConnectedHeader
    stayConnectedSubheader
    linkedinLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
    linkedinLink
    contactHeader
    contactSubheader
  }
`;

type CareersPageFields = {
  introductionHeader?: string | null;
  introductionBody?: string | null;
  currentOpeningsHeader?: string | null;
  currentOpeningsSubheader?: string | null;
  howToApplyHeader?: string | null;
  howToApplyBody?: string | null;
  internshipOpportunitiesHeader?: string | null;
  internshipOpportunitiesBody?: string | null;
  stayConnectedHeader?: string | null;
  stayConnectedSubheader?: string | null;
  linkedinLogo?: ImageField | null;
  linkedinLink?: string | null;
  contactHeader?: string | null;
  contactSubheader?: string | null;
};

type CareersExtra = {
  careersPageFields?: CareersPageFields | null;
};

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/careers");
}

export default async function CareersPage() {
  const page = await fetchPageWithHeroFields<CareersExtra>(
    "careers",
    CAREERS_PAGE_FIELDS,
  );
  const fields = page?.careersPageFields;
  const hero = resolvePhotoWaveHeaderProps(page, "Careers");
  const linkedinLogoUrl = resolveWpMediaUrl(fields?.linkedinLogo?.node?.sourceUrl);
  const linkedinLogoAlt =
    fields?.linkedinLogo?.node?.altText?.trim() || "LinkedIn";

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      />

      <section className="page-section">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            {fields?.introductionHeader ? (
              <h2 className="h2">{fields.introductionHeader}</h2>
            ) : null}
            {fields?.introductionBody ? (
              <p className="body mt-4 whitespace-pre-line text-neutral-700">
                {fields.introductionBody}
              </p>
            ) : null}
          </div>
          <div className="w-full md:col-span-1 flex justify-center md:justify-end">
            {fields?.linkedinLink ? (
              <a
                href={fields.linkedinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group card card-hover card-link flex -mt-4 md:mt-0 h-fit w-fit flex-col items-center gap-2 overflow-hidden bg-gmcc-blue-light/30 p-8 text-center no-underline"
              >
                {fields?.stayConnectedHeader ? (
                  <h2 className="h3 transition-colors group-hover:text-gmcc-teal">
                    {fields.stayConnectedHeader}
                  </h2>
                ) : null}
                {fields?.stayConnectedSubheader ? (
                  <p className="body text-neutral-700 transition-colors group-hover:text-gmcc-teal">
                    {fields.stayConnectedSubheader}
                  </p>
                ) : null}
                {linkedinLogoUrl ? (
                  <Image
                    src={linkedinLogoUrl}
                    alt={linkedinLogoAlt}
                    width={90}
                    height={90}
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                ) : null}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="page-section">
        {fields?.currentOpeningsHeader ? (
          <h2 className="h2">{fields.currentOpeningsHeader}</h2>
        ) : null}
        {fields?.howToApplyHeader && fields?.howToApplyBody ? (
          <p className="body mt-4 whitespace-pre-line text-neutral-700">
            <span className="h3 mr-4">{fields.howToApplyHeader}:</span>{" "}
            {fields.howToApplyBody}
          </p>
        ) : null}
        {fields?.currentOpeningsSubheader ? (
          <p className="body mt-4 whitespace-pre-line text-neutral-700">
            {fields.currentOpeningsSubheader}
          </p>
        ) : null}

        <AdpRecruitmentWidget />
      </section>

      <section className="page-section">
          {fields?.internshipOpportunitiesHeader ? (
            <h2 className="h2">{fields.internshipOpportunitiesHeader}</h2>
          ) : null}
          {fields?.internshipOpportunitiesBody ? (
            <p className="body mt-4 whitespace-pre-line">
              {fields.internshipOpportunitiesBody}
            </p>
          ) : null}
      </section>

      <section className="page-section text-center">
        {fields?.contactHeader ? <h2 className="h2 text-gmcc-navy">{fields.contactHeader}</h2> : null}
          {fields?.contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.contactSubheader}</p>
          ) : null}
          <div className="flex justify-center">
            <JotFormLightboxButton />
          </div>
      </section>
    </main>
  );
}
