import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Session Calendar",
  description:
    "View session calendars by center to see what programs are available and what fits your schedule.",
};

const SESSION_CALENDAR_EXTRA_FIELDS = `
  sessionCalendarPageFields {
    communityCenterSessionCalendar
    tennisCenterSessionCalendar
    colemanFamilyCenterSessionCalendar
    northFamilyCenterSessionCalendar
  }
`;

type SessionCalendarPageFields = {
  communityCenterSessionCalendar?: string | null;
  tennisCenterSessionCalendar?: string | null;
  colemanFamilyCenterSessionCalendar?: string | null;
  northFamilyCenterSessionCalendar?: string | null;
};

type SessionCalendarExtra = {
  sessionCalendarPageFields?: SessionCalendarPageFields | null;
};

const CENTER_SCHEDULE_SECTIONS = [
  {
    id: "community",
    title: "Community Center",
    field: "communityCenterSessionCalendar",
  },
  {
    id: "tennis",
    title: "Tennis Center",
    field: "tennisCenterSessionCalendar",
  },
  {
    id: "coleman",
    title: "Coleman Family Center",
    field: "colemanFamilyCenterSessionCalendar",
  },
  {
    id: "north",
    title: "North Family Center",
    field: "northFamilyCenterSessionCalendar",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  field: keyof SessionCalendarPageFields;
}>;

function renderScheduleEmbed(html: string | null | undefined) {
  if (!html?.trim()) {
    return (
      <p className="text-neutral-600">
        Schedule information is not available yet. Please check back soon.
      </p>
    );
  }

  return (
    <div
      className="gmcc-schedule-embed mt-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function SessionCalendarPage() {
  const page = await fetchPageWithHeroFields<SessionCalendarExtra>(
    "session-calendar",
    SESSION_CALENDAR_EXTRA_FIELDS,
  );
  const hero = resolvePhotoWaveHeaderProps(page, "Session Calendar");
  const fields = page?.sessionCalendarPageFields;

  const accordionItems = CENTER_SCHEDULE_SECTIONS.map(({ id, title, field }) => ({
    id,
    title,
    content: renderScheduleEmbed(fields?.[field]),
  }));

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl}
        ctas={hero.ctas}
      />

      <div className="page-section stack-8">
        <p className="body text-neutral-700">
          Click on a center to view its session calendar.
        </p>

        <Accordion items={accordionItems} allowMultiple={false} defaultOpenIds={[]} />
      </div>
    </main>
  );
}
