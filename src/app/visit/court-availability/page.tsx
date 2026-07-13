import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { scheduleEmbedUrl } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Court Availability",
  description:
    "View court availability for tennis, pickleball, basketball, and volleyball at your preferred center.",
};

const faqItems = [
  {
    id: "1",
    title: "Community Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <iframe
          src={scheduleEmbedUrl({ type: "dropin", sub: "courtSports" })}
          style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    ),
  },
  {
    id: "2",
    title: "Tennis Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <iframe
          src={scheduleEmbedUrl({ type: "dropin", sub: "courtSports" })}
          style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    ),
  },
  {
    id: "3",
    title: "Coleman Family Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <iframe
          src={scheduleEmbedUrl({ type: "fitness", sub: "aquatics" })}
          style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    ),
  },
  {
    id: "4",
    title: "North Family Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <iframe
          src={scheduleEmbedUrl({ type: "fitness", sub: "aquatics" })}
          style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
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
