// src/app/(home)/sections/FeaturedCampaignSection.tsx
import SimpleCampaign, { type SimpleCampaignData } from "@/components/simpleCampaign";

export default function FeaturedCampaignSection({
  campaign,
}: {
  campaign: SimpleCampaignData | null;
}) {
  return <SimpleCampaign campaign={campaign} />;
}
