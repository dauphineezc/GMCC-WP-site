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
  return getYoastMetadata("/visit/court-availability");
}

const faqItems = [
  {
    id: "1",
    title: "Community Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ type: "dropin", sub: "courtSports" })}
          title="Community Center court availability"
        />
      </div>
    ),
  },
  {
    id: "2",
    title: "Tennis Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ type: "dropin", sub: "courtSports" })}
          title="Tennis Center court availability"
        />
      </div>
    ),
  },
  {
    id: "3",
    title: "Coleman Family Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ type: "fitness", sub: "aquatics" })}
          title="Coleman Family Center court availability"
        />
      </div>
    ),
  },
  {
    id: "4",
    title: "North Family Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ type: "fitness", sub: "aquatics" })}
          title="North Family Center court availability"
        />
      </div>
    ),
  },
];

export default async function CourtAvailabilityPage() {
  const page = await fetchPageWithHeroFields("court-availability");
  const hero = resolvePhotoWaveHeaderProps(page, "Court Availability");

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/CourtsPhoto.png"}
        imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      />

      <div className="page-section stack-8">
        <h3 className="text-xl text-neutral-700 mt-0 mb-4">
          Interested in playing a game of tennis, pickleball, basketball, or volleyball?
          View the availability of all courts at your preferred center below.
        </h3>
        <p className="text-neutral-700 text-xl mt-0 mb-8">Click on a court for more information.</p>

        <Accordion items={faqItems} allowMultiple={false} defaultOpenIds={[]} />
      </div>
    </main>
  );
}
