import PhotoWaveHeader from "@/components/photoWaveHeader";
import ScheduleEmbedIframe from "@/components/schedule/scheduleEmbedIframe";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { scheduleEmbedUrl } from "@/lib/constants";
import type { Metadata } from "next";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import WysiwygText from "@/components/wysiwygText";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/visit/pool-availability");
}

const POOL_AVAILABILITY_EXTRA_FIELDS = `
  poolAvailabilityPageFields {
    header
    description
    calendarInstructions
    poolRulesHeader
    poolRules
  }
`;

type PoolAvailabilityPageFields = {
  header?: string | null;
  description?: string | null;
  calendarInstructions?: string | null;
  poolRulesHeader?: string | null;
  poolRules?: string | null;
};

type PoolAvailabilityExtra = {
  poolAvailabilityPageFields?: PoolAvailabilityPageFields | null;
};

export default async function PoolAvailabilityPage() {
  const page = await fetchPageWithHeroFields<PoolAvailabilityExtra>(
    "pool-availability",
    POOL_AVAILABILITY_EXTRA_FIELDS,
  );
  const hero = resolvePhotoWaveHeaderProps(page, "Pool Availability");
  const fields = page?.poolAvailabilityPageFields;

  const header = fields?.header?.trim() || null;
  const description = fields?.description?.trim() || null;
  const calendarInstructions = fields?.calendarInstructions?.trim() || null;
  const poolRulesHeader = fields?.poolRulesHeader?.trim() || null;
  const poolRules = fields?.poolRules?.trim() || null;

  return (
    <main>
      {/* <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/PoolPhoto.png"}
        imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      /> */}

      <SolidNavyWaveHeader title={hero.title} description={hero.subheader} />

      <div className="page-section stack-8">
        {header ? <h1 className="h1">{header}</h1> : null}
        {description ? <WysiwygText html={description} /> : null}
        {calendarInstructions ? <p className="body">{calendarInstructions}</p> : null}

        <div className="gmcc-schedule-embed mt-4">
          <ScheduleEmbedIframe
            src={scheduleEmbedUrl({ center: "community", type: "dropin", sub: "aquatics" })}
            title="Community Center pool availability"
          />
        </div>

        {poolRulesHeader ? <h2 className="h2">{poolRulesHeader}</h2> : null}
        {poolRules ? <WysiwygText html={poolRules} /> : null}
      </div>
    </main>
  );
}
