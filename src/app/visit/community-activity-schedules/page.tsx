import Accordion from "@/components/accordion";
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
  return getYoastMetadata("/visit/community-activity-schedules");
}

const COMMUNITY_ACTIVITY_SCHEDULES_EXTRA_FIELDS = `
  communityActivitySchedulesPageFields {
    header
    description
    calendarInstructions
  }
`;

type CommunityActivitySchedulesPageFields = {
  header?: string | null;
  description?: string | null;
  calendarInstructions?: string | null;
};

type CommunityActivitySchedulesExtra = {
  communityActivitySchedulesPageFields?: CommunityActivitySchedulesPageFields | null;
};

const faqItems = [
  {
    id: "1",
    title: "Community Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ center: "community", type: "dropin", sub: "community" })}
          title="Community Center activity schedule"
        />
      </div>
    ),
  },
];

export default async function CommunityActivitySchedulesPage() {
  const page = await fetchPageWithHeroFields<CommunityActivitySchedulesExtra>(
    "community-activity-schedules",
    COMMUNITY_ACTIVITY_SCHEDULES_EXTRA_FIELDS,
  );
  const hero = resolvePhotoWaveHeaderProps(page, "Community Activity Schedules");
  const fields = page?.communityActivitySchedulesPageFields;

  const header = fields?.header?.trim() || null;
  const description = fields?.description?.trim() || null;
  const calendarInstructions = fields?.calendarInstructions?.trim() || null;

  return (
    <main>
      {/* <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/CommunityActivityPhoto.png"}
        imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      /> */}

      <SolidNavyWaveHeader title={hero.title} description={hero.subheader} />

      <div className="page-section stack-8">
        {header ? <h1 className="h1">{header}</h1> : null}
        {description ? <WysiwygText html={description} /> : null}
        {calendarInstructions ? <p className="body">{calendarInstructions}</p> : null}

        <Accordion items={faqItems} allowMultiple={false} defaultOpenIds={["1"]} />
      </div>
    </main>
  );
}
