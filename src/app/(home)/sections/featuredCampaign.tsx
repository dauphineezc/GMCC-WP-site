// src/app/(home)/sections/FeaturedCampaignSection.tsx
export default function FeaturedCampaignSection({
    campaign,
    bgColor,
    textColor,
  }: {
    campaign: null | {
      title?: string | null;
      uri?: string | null;
      featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
      campaignFields?: {
        headline?: string | null;
        body?: string | null;
        primaryCta?: { primaryCtaLabel?: string | null; primaryCtaUrl?: string | null } | null;
        secondaryCta?: { secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null } | null;
      } | null;
    };
    bgColor: string | null;
    textColor: string | null;
  }) {
    if (!campaign) return null;
  
    const title = campaign.campaignFields?.headline || campaign.title || "Featured Campaign";
    const body = campaign.campaignFields?.body || "";
    const img = campaign.featuredImage?.node?.sourceUrl ?? null;
  
    const primaryUrl = campaign.campaignFields?.primaryCta?.primaryCtaUrl || campaign.uri || "#";
    const primaryLabel = campaign.campaignFields?.primaryCta?.primaryCtaLabel || "Learn more";
  
    const secondaryUrl = campaign.campaignFields?.secondaryCta?.secondaryCtaUrl || null;
    const secondaryLabel = campaign.campaignFields?.secondaryCta?.secondaryCtaLabel || "Details";
  
    return (
      <section className="px-0 py-10">
        <div className="mx-auto w-full">
          <div className={`overflow-hidden`} style={{ backgroundColor: bgColor ?? "#ffffff" }}>
            <div className="grid md:grid-cols-2">
              <div className="relative min-h-[280px] md:min-h-[360px]">
                {img ? (
                  <img
                    src={img}
                    alt={campaign.featuredImage?.node?.altText ?? ""}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 w-full bg-neutral-700" />
                )}
                <div className="absolute inset-0 bg-black/25" />
              </div>
  
              <div className="flex flex-col justify-center p-10 md:p-14 md:min-h-[360px]">
                <h3 className="text-3xl font-semibold tracking-tight" style={{ color: `${textColor}` }}>{title}</h3>
                {body ? <p className={`mt-4 whitespace-pre-line text-base leading-relaxed`} style={{ color: `${textColor}` }}>{body}</p> : null}
  
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={primaryUrl}
                    className="btn btn-secondary"
                  >
                    {primaryLabel}
                  </a>
  
                  {secondaryUrl ? (
                    <a
                      href={secondaryUrl}
                      className="btn btn-secondary"
                    >
                      {secondaryLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  