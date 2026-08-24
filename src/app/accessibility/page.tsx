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
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";
import JotFormLightboxButton from "@/components/jotFormLightboxButton";
import JotFormEmbed from "@/components/jotFormEmbed";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/accessibility");
}

const CAMPAIGN_FRAGMENT = `
  ... on Campaign {
    id
    title
    uri
    featuredImage {
      node { ${WP_MEDIA_IMAGE_FIELDS} }
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
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}/>

      <section className="page-section stack-4 text-center">
        <h2 className="h2">{accessibilityStatementHeader}</h2>
        <p className="body">{accessibilityStatement}</p>
      </section>

      <section className="page-section stack-4">
        <h2 className="h2 text-center mb-8">{accessibleFeaturesHeader}</h2>
        {amenities.length > 0 ? (
          <AmenitiesGrid amenities={amenities} title="Accessibility amenities" numCols={3} />
        ) : (
          <p className="body text-neutral-600">
            No accessibility amenities are listed yet. Check back soon.
          </p>
        )}
      </section>


      <section className="page-section stack-4">
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

      <section className="page-section stack-4">
        <p className="body text-center">{conclusionContent}</p>
      </section>

      {/* CONTACT CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-4 mt-18 mb-8 text-center">
          <h2 className="h2">
            {contactHeader}
          </h2>
          <p className="mt-3 text-neutral-700 max-w-xl mx-auto">
            {contactSubheader}
          </p>
          </div>
          <div className="relative overflow-hidden -mt-0 pb-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute left-15 bottom-30 w-0 select-none lg:w-100"
            draggable={false}
          />
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute right-15 top-30 w-0 select-none lg:w-100"
            draggable={false}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 lg:-mt-16 lg:-mb-16">
          <JotFormEmbed/>
        </div>
      </div>
      </section>
    </main>
  );
}
