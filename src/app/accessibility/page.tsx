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
    "Accessibility amenities and features available at Greater Midland Community Center locations.",
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
    campaigns {
      nodes {
        ${CAMPAIGN_FRAGMENT}
      }
    }
  }
`;

type AccessibilityExtra = {
  accessibilityPageFields?: {
    campaigns?: { nodes?: (SimpleCampaignData & { id?: string })[] | null } | null;
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

  const campaignNodes =
    pageBlock?.accessibilityPageFields?.campaigns?.nodes?.filter(
      (n): n is SimpleCampaignData & { id?: string } => n != null,
    ) ?? [];

  return (
    <main>
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} />

      <section className="mx-auto max-w-6xl px-4 py-12 section-y stack-4">
        {amenities.length > 0 ? (
          <AmenitiesGrid amenities={amenities} title="Accessibility amenities" numCols={3} />
        ) : (
          <p className="body text-neutral-600">
            No accessibility amenities are listed yet. Check back soon.
          </p>
        )}
      </section>

      {campaignNodes.map((campaign, index) => (
        <section
          key={campaign.id ?? `accessibility-campaign-${index}`}
          className={`${index === 0 ? "relative mt-0" : "relative mt-12"} ${index === campaignNodes.length - 1 ? "mb-12" : ""}`}
        >
          <SimpleCampaign campaign={campaign} />
        </section>
      ))}
    </main>
  );
}
