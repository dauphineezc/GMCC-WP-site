import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import ScheduleEmbedIframe from "@/components/schedule/scheduleEmbedIframe";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { scheduleEmbedUrl } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/visit/court-availability");
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

const faqItems = [
  {
    id: "1",
    title: "Community Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ center: "community", type: "dropin", sub: "courtSports" })}
          title="Community Center court availability"
        />
      </div>
    ),
  },
  {
    id: "2",
    title: "Tennis Center",
    content: (
      <div>
        <p>Please visit Club Automation, our Tennis Center's external booking system, to view court availability.</p>
        <a
            href="https://midland.clubautomation.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 group flex items-center gap-3 rounded-lg border border-neutral-200 w-fit bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-neutral-800 group-hover:text-gmcc-navy truncate">
                Club Automation
              </span>
              <span className="text-xs text-neutral-500">Click to open in a new tab</span>
            </div>
              <ExternalLinkIcon />
          </a>
      </div>
      // <div className="gmcc-schedule-embed mt-4">
      //   <ScheduleEmbedIframe
      //     src={scheduleEmbedUrl({ type: "dropin", sub: "courtSports" })}
      //     title="Tennis Center court availability"
      //   />
      // </div>
    ),
  },
  {
    id: "3",
    title: "Coleman Family Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ center: "coleman", type: "dropin", sub: "courtSports" })}
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
          src={scheduleEmbedUrl({ center: "north", type: "dropin", sub: "courtSports" })}
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
      {/* <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/CourtsPhoto.png"}
        imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      /> */}

      <SolidNavyWaveHeader title={hero.title} description={hero.subheader}/>


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
