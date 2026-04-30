import SimpleCampaign from "@/components/simpleCampaign";
import AmenitiesGrid from "@/components/amenitiesGrid";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchAllAccessibilityAmenitiesWithImages,
  toAmenityDisplayDefault,
} from "@/lib/amenities";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import type { Metadata } from "next";
import type { SimpleCampaignData } from "@/components/simpleCampaign";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Accessibility amenities and features available at Greater Midland locations.",
};

const CAMPAIGN_FRAGMENT = `
  ... on Campaign {
    id
    title
    uri
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    campaignFields {
      headline
      body
      primaryCta {
        primaryCtaLabel
        primaryCtaUrl
      }
      secondaryCta {
        secondaryCtaLabel
        secondaryCtaUrl
      }
      backgroundColor
      textColor
      primaryCtaButtonColor
      secondaryCtaButtonColor
    }
  }
`;

const ACCESSIBILITY_EXTRA_FIELDS = `
  accessibilityPageFields {
    accessibilityStatementHeader
    accessibilityStatement
    accessibleFeaturesHeader
    accessibleProgramsHeader
    campaigns {
      nodes {
        ${CAMPAIGN_FRAGMENT}
      }
    }
    conclusionContent
    contactHeader
    contactSubheader
  }
`;

type AccessibilityExtra = {
  accessibilityPageFields?: {
    accessibilityStatementHeader?: string | null;
    accessibilityStatement?: string | null;
    accessibleFeaturesHeader?: string | null;
    accessibleProgramsHeader?: string | null;
    conclusionContent?: string | null;
    campaigns?: { nodes?: (SimpleCampaignData & { id?: string })[] | null } | null;
    contactHeader?: string | null;
    contactSubheader?: string | null;
  } | null;
};

async function fetchAccessibilityPageData() {
  return fetchPageWithHeroFields<AccessibilityExtra>(
    "accessibility",
    ACCESSIBILITY_EXTRA_FIELDS,
  );
}

export default async function AccessibilityPage() {
  const [pageBlock, withImages] = await Promise.all([
    fetchAccessibilityPageData(),
    fetchAllAccessibilityAmenitiesWithImages(),
  ]);

  const amenities = toAmenityDisplayDefault(withImages);
  const hero = resolvePhotoWaveHeaderProps(pageBlock, "Accessibility");

  const accessibilityStatementHeader = pageBlock?.accessibilityPageFields?.accessibilityStatementHeader;
  const accessibilityStatement = pageBlock?.accessibilityPageFields?.accessibilityStatement;
  const accessibleFeaturesHeader = pageBlock?.accessibilityPageFields?.accessibleFeaturesHeader;
  const accessibleProgramsHeader = pageBlock?.accessibilityPageFields?.accessibleProgramsHeader;
  const conclusionContent = pageBlock?.accessibilityPageFields?.conclusionContent;
  const contactHeader = pageBlock?.accessibilityPageFields?.contactHeader;
  const contactSubheader = pageBlock?.accessibilityPageFields?.contactSubheader;
  const campaignNodes =
    pageBlock?.accessibilityPageFields?.campaigns?.nodes?.filter(
      (n): n is SimpleCampaignData & { id?: string } => n != null,
    ) ?? [];

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} />

      <section className="mx-auto max-w-6xl px-4 py-6 section-y stack-4 text-center">
        <h2 className="h2">{accessibilityStatementHeader}</h2>
        <p className="body">{accessibilityStatement}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 section-y stack-4">
        <h2 className="h2 text-center mb-8">{accessibleFeaturesHeader}</h2>
        {amenities.length > 0 ? (
          <AmenitiesGrid amenities={amenities} title="Accessibility amenities" numCols={3} />
        ) : (
          <p className="body text-neutral-600">
            No accessibility amenities are listed yet. Check back soon.
          </p>
        )}
      </section>


      <section className="mx-auto max-w-6xl px-4 py-12 section-y stack-4">
        <h2 className="h2 text-center mb-8">{accessibleProgramsHeader}</h2>
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 md:items-stretch">
          {campaignNodes.map((campaign, index) => (
            <div
              key={campaign.id ?? `accessibility-campaign-${index}`}
              className="flex h-full min-h-0"
            >
              <SimpleCampaign campaign={campaign} stacked />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 section-y stack-4">
        <p className="body text-center">{conclusionContent}</p>
      </section>

      <div className="mx-auto max-w-6xl px-10">
        {contactHeader ? (
          <h3 className="h2 mt-8 text-center">{contactHeader}</h3>
        ) : null}
        {contactSubheader ? (
          <p className="body mt-2 text-center">{contactSubheader}</p>
        ) : null}
          <div className="relative mx-auto mt-8 mb-12 w-full rounded-2xl border border-neutral-300 bg-neutral-100 p-10 shadow-sm lg:w-[calc((3*(100%-4rem))/5+2rem)]">
            <form className="mt-4 space-y-4" aria-label="Placeholder contact form">
              <div>
                <label htmlFor="contact-name" className="block text-sm text-neutral-700">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder=""
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm text-neutral-700">
                  Email address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder=""
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm text-neutral-700">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div className="pt-1 text-center">
                <button type="button" className="btn btn-primary min-w-28">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
    </main>
  );
}
