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
  return getYoastMetadata("/visit/group-fitness-schedules");
}

const GROUP_FITNESS_SCHEDULES_EXTRA_FIELDS = `
  groupFitnessSchedulesPageFields {
    header
    description
    calendarInstructions
  }
`;

type GroupFitnessSchedulesPageFields = {
  header?: string | null;
  description?: string | null;
  calendarInstructions?: string | null;
};

type GroupFitnessSchedulesExtra = {
  groupFitnessSchedulesPageFields?: GroupFitnessSchedulesPageFields | null;
};

const faqItems = [
  {
    id: "1",
    title: "Community Center",
    content: (
      <div className="gmcc-schedule-embed mt-4">
        <ScheduleEmbedIframe
          src={scheduleEmbedUrl({ type: "fitness", sub: "aquatics" })}
          title="Community Center group fitness schedule"
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
          src={scheduleEmbedUrl({ type: "fitness", sub: "aquatics" })}
          title="Tennis Center group fitness schedule"
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
          title="Coleman Family Center group fitness schedule"
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
          title="North Family Center group fitness schedule"
        />
      </div>
    ),
  },
];

export default async function GroupFitnessSchedulesPage() {
  const page = await fetchPageWithHeroFields<GroupFitnessSchedulesExtra>(
    "group-fitness-schedules",
    GROUP_FITNESS_SCHEDULES_EXTRA_FIELDS,
  );
  const hero = resolvePhotoWaveHeaderProps(page, "Group Fitness Schedules");
  const fields = page?.groupFitnessSchedulesPageFields;

  const header =
    fields?.header?.trim() || "Group Fitness Schedules";
  const description =
    fields?.description?.trim() ||
    "Choose from a variety of group fitness classes to fit your schedule, goals, and interests. View the schedules for all group fitness classes below.";
  const calendarInstructions =
    fields?.calendarInstructions?.trim() ||
    "Click on a class for more information and to register.";

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      />

      <div className="page-section stack-8">
        <h1 className="h1">{header}</h1>
        <h3 className="text-xl text-neutral-700 mt-0 mb-4 whitespace-pre-line">{description}</h3>
        <p className="body">{calendarInstructions}</p>

        <Accordion
          items={faqItems}
          allowMultiple={false}
          defaultOpenIds={[]}
        />
      </div>
    </main>
  );
}
