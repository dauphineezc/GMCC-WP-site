import PhotoWaveHeader from "@/components/photoWaveHeader";
import AdpRecruitmentWidget from "@/components/careers/adpRecruitmentWidget";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import type { Metadata } from "next";
import { ImageField } from "@/lib/acf";
import { resolveWpMediaUrl } from "@/lib/wp";
import Image from "next/image";
import { WEBTRAC_REGISTRATION_URL } from "@/lib/constants";

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
    linkedinLogo { node { sourceUrl altText } }
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

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Explore career and internship opportunities at Greater Midland.",
};

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
        imageUrl={hero.imageUrl}
        ctas={hero.ctas}
      />

      <section className="page-section stack-8">
        {fields?.introductionHeader ? (
          <h2 className="h2">{fields.introductionHeader}</h2>
        ) : null}
        {fields?.introductionBody ? (
          <p className="body whitespace-pre-line text-neutral-700">
            {fields.introductionBody}
          </p>
        ) : null}
      </section>

      <section className="page-section stack-8">
        {fields?.currentOpeningsHeader ? (
          <h2 className="h2">{fields.currentOpeningsHeader}</h2>
        ) : null}
        {fields?.howToApplyHeader && fields?.howToApplyBody ? (
          <p className="body whitespace-pre-line text-neutral-700">
            <span className="h3 mr-4">{fields.howToApplyHeader}:</span>{" "}
            {fields.howToApplyBody}
          </p>
        ) : null}
        {fields?.currentOpeningsSubheader ? (
          <p className="body whitespace-pre-line text-neutral-700">
            {fields.currentOpeningsSubheader}
          </p>
        ) : null}

        <AdpRecruitmentWidget />
      </section>

      <section className="page-section stack-8">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          <article className="relative card card-hover bg-gmcc-blue-light/30 overflow-hidden p-8 text-center">
            {fields?.internshipOpportunitiesHeader ? (
              <h2 className="h2 mb-4">{fields.internshipOpportunitiesHeader}</h2>
            ) : null}
            {fields?.internshipOpportunitiesBody ? (
              <p className="body whitespace-pre-line">
                {fields.internshipOpportunitiesBody}
              </p>
            ) : null}
          </article>
          {fields?.linkedinLink ? (
            <a
              href={fields.linkedinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group card card-hover card-link relative flex h-full flex-col items-center gap-4 overflow-hidden bg-gmcc-blue-light/30 p-8 text-center no-underline"
            >
              {fields?.stayConnectedHeader ? (
                <h2 className="h2 transition-colors group-hover:text-gmcc-teal">
                  {fields.stayConnectedHeader}
                </h2>
              ) : null}
              {fields?.stayConnectedSubheader ? (
                <h3 className="h3 text-neutral-700 transition-colors group-hover:text-gmcc-teal">
                  {fields.stayConnectedSubheader}
                </h3>
              ) : null}
              {linkedinLogoUrl ? (
                <Image
                  src={linkedinLogoUrl}
                  alt={linkedinLogoAlt}
                  width={90}
                  height={90}
                  className="h-16 w-16 shrink-0 object-contain"
                />
              ) : null}
            </a>
          ) : (
            <article className="relative card card-hover bg-gmcc-blue-light/30 overflow-hidden p-8 text-center">
              {fields?.stayConnectedHeader ? (
                <h2 className="h2">{fields.stayConnectedHeader}</h2>
              ) : null}
              {fields?.stayConnectedSubheader ? (
                <h3 className="h3 mt-4 text-neutral-700">{fields.stayConnectedSubheader}</h3>
              ) : null}
              {linkedinLogoUrl ? (
                <Image
                  src={linkedinLogoUrl}
                  alt={linkedinLogoAlt}
                  width={150}
                  height={150}
                  className="mx-auto mt-4 h-20 w-20 shrink-0 object-contain"
                />
              ) : null}
            </article>
          )}
        </div>
      </section>

      <section className="page-section stack-8 text-center">
        {fields?.contactHeader ? <h2 className="h2 text-gmcc-navy">{fields.contactHeader}</h2> : null}
          {fields?.contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.contactSubheader}</p>
          ) : null}
          <div className="mt-6 flex justify-center">
            <a
              href={WEBTRAC_REGISTRATION_URL}
              className="btn bg-gmcc-navy px-8 py-3 text-base text-white hover:bg-neutral-100"
            >
              Contact Us
            </a>
          </div>
      </section>
    </main>
  );
}
