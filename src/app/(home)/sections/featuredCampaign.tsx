// src/app/(home)/sections/FeaturedCampaignSection.tsx
import SimpleCampaign, { type SimpleCampaignData } from "@/components/simpleCampaign";

export default function FeaturedCampaignSection({
  campaign,
}: {
  campaign: SimpleCampaignData | null;
}) {
  return <section className="relative mt-12 mb-12"><SimpleCampaign campaign={campaign} /></section>;
}
