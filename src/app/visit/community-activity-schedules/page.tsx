import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import ScheduleEmbedIframe from "@/components/schedule/scheduleEmbedIframe";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { scheduleEmbedUrl } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/visit/community-activity-schedules");
}

const faqItems = [
  {
    id: "1",
    title: "Community Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ type: "dropin", sub: "community" })}
          title="Community Center activity schedule"
        />
      </div>
    ),
  },
];

export default async function CommunityActivitySchedulesPage() {
  const page = await fetchPageWithHeroFields("community-activity-schedules");
  const hero = resolvePhotoWaveHeaderProps(page, "Community Activity Schedules");

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/CommunityActivityPhoto.png"}
        imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      />

      <div className="page-section stack-8">
        <h3 className="text-xl text-neutral-700 mt-0 mb-4">
          Make new friends and learn new skills by participating in a community activity.
          Free for members; $7 per non-member participant. View the schedules for all community
          activities at the Community Center below.
        </h3>
        <p className="text-neutral-700 text-sm mt-8 mb-4">Click on an activity for more information.</p>

        <Accordion items={faqItems} allowMultiple={false} defaultOpenIds={["1"]} />
      </div>
    </main>
  );
}
