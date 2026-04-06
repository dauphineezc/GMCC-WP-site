export type SimpleCampaignFields = {
  headline?: string | null;
  body?: string | null;
  primaryCta?: {
    primaryCtaLabel?: string | null;
    primaryCtaUrl?: string | null;
  } | null;
  secondaryCta?: {
    secondaryCtaLabel?: string | null;
    secondaryCtaUrl?: string | null;
  } | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  primaryCtaButtonColor?: string | null;
  secondaryCtaButtonColor?: string | null;
} | null;

export type SimpleCampaignData = {
  title?: string | null;
  uri?: string | null;
  featuredImage?: {
    node?: { sourceUrl: string; altText?: string | null } | null;
  } | null;
  campaignFields?: SimpleCampaignFields;
};

type Props = {
  campaign: SimpleCampaignData | null;
};

/** ACF select values: primary | secondary | tertiary (see WP field config). */
const CAMPAIGN_BTN_CLASSES = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  tertiary: "btn btn-tertiary",
} as const;

type CampaignBtnVariant = keyof typeof CAMPAIGN_BTN_CLASSES;

/** WPGraphQL / ACF may return a string, enum, or `{ value }` object for select fields. */
function coerceSelectString(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number" || typeof raw === "boolean") {
    return String(raw).trim();
  }
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const v = (raw as { value?: unknown }).value;
    return coerceSelectString(v);
  }
  return String(raw).trim();
}

function campaignButtonClass(
  raw: unknown,
  fallback: CampaignBtnVariant,
): string {
  const key = coerceSelectString(raw).toLowerCase();
  if (!key) {
    return CAMPAIGN_BTN_CLASSES[fallback];
  }
  if (key in CAMPAIGN_BTN_CLASSES) {
    return CAMPAIGN_BTN_CLASSES[key as CampaignBtnVariant];
  }
  return CAMPAIGN_BTN_CLASSES[fallback];
}

export default function SimpleCampaign({ campaign }: Props) {
  if (!campaign) return null;

  const title =
    campaign.campaignFields?.headline || campaign.title || "Featured Campaign";
  const body = campaign.campaignFields?.body || "";
  const img = campaign.featuredImage?.node?.sourceUrl ?? null;

  const primaryUrl =
    campaign.campaignFields?.primaryCta?.primaryCtaUrl || campaign.uri || "#";
  const primaryLabel =
    campaign.campaignFields?.primaryCta?.primaryCtaLabel || "Learn more";

  const secondaryUrl =
    campaign.campaignFields?.secondaryCta?.secondaryCtaUrl || null;
  const secondaryLabel =
    campaign.campaignFields?.secondaryCta?.secondaryCtaLabel || "Details";

  const textColor = campaign.campaignFields?.textColor ?? "#003A70";
  const primaryClass = campaignButtonClass(
    campaign.campaignFields?.primaryCtaButtonColor,
    "primary",
  );
  const secondaryClass = campaignButtonClass(
    campaign.campaignFields?.secondaryCtaButtonColor,
    "secondary",
  );

  return (
    <section className="px-0 py-0">
      <div className="mx-auto w-full">
        <div
          className="overflow-hidden"
          style={{
            backgroundColor: campaign.campaignFields?.backgroundColor ?? "#ffffff",
          }}
        >
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
              {/* <div className="absolute inset-0 bg-black/25" /> */}
              <div className="absolute inset-0" />
            </div>

            <div className="flex flex-col justify-center p-10 md:p-14 md:min-h-[360px]">
              <h3
                className="text-3xl font-semibold tracking-tight"
                style={{ color: textColor }}
              >
                {title}
              </h3>
              {body ? (
                <p
                  className="mt-4 whitespace-pre-line text-base leading-relaxed"
                  style={{ color: textColor }}
                >
                  {body}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <a href={primaryUrl} className={primaryClass}>
                  {primaryLabel}
                </a>
                {secondaryUrl ? (
                  <a href={secondaryUrl} className={secondaryClass}>
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
