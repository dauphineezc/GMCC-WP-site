// src/app/(home)/sections/FeaturedCampaignSection.tsx
import SimpleCampaign, { type SimpleCampaignData } from "@/components/simpleCampaign";

export default function FeaturedCampaignSection({
  campaign,
}: {
  campaign: SimpleCampaignData | null;
}) {
  return <section className="section-y relative"><SimpleCampaign campaign={campaign} /></section>;
}
