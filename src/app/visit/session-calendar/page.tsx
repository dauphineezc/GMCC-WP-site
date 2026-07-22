import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import type { Metadata } from "next";
import AttachmentsCard from "@/components/detail/attachmentsCard";
import { acfFileHref, type AttachmentItem, type WpMediaFieldInput, type WpMediaRef } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/visit/session-calendar");
}

const SESSION_CALENDAR_EXTRA_FIELDS = `
  sessionCalendarPageFields {
    communityCenterSessionCalendar
    communityCenterSessionBrochure { node { sourceUrl mediaItemUrl title } }
    tennisCenterSessionCalendar
    tennisCenterSessionBrochure { node { sourceUrl mediaItemUrl title } }
    colemanFamilyCenterSessionCalendar
    colemanFamilyCenterSessionBrochure { node { sourceUrl mediaItemUrl title } }
    northFamilyCenterSessionCalendar
    northFamilyCenterSessionBrochure { node { sourceUrl mediaItemUrl title } }
  }
`;

type SessionCalendarPageFields = {
  communityCenterSessionCalendar?: string | null;
  communityCenterSessionBrochure?: WpMediaFieldInput | null;
  tennisCenterSessionCalendar?: string | null;
  tennisCenterSessionBrochure?: WpMediaFieldInput | null;
  colemanFamilyCenterSessionCalendar?: string | null;
  colemanFamilyCenterSessionBrochure?: WpMediaFieldInput | null;
  northFamilyCenterSessionCalendar?: string | null;
  northFamilyCenterSessionBrochure?: WpMediaFieldInput | null;
};

type SessionCalendarExtra = {
  sessionCalendarPageFields?: SessionCalendarPageFields | null;
};

const CENTER_SCHEDULE_SECTIONS = [
  {
    id: "community",
    title: "Community Center",
    field: "communityCenterSessionCalendar",
    brochureField: "communityCenterSessionBrochure",
  },
  {
    id: "tennis",
    title: "Tennis Center",
    field: "tennisCenterSessionCalendar",
    brochureField: "tennisCenterSessionBrochure",
  },
  {
    id: "coleman",
    title: "Coleman Family Center",
    field: "colemanFamilyCenterSessionCalendar",
    brochureField: "colemanFamilyCenterSessionBrochure",
  },
  {
    id: "north",
    title: "North Family Center",
    field: "northFamilyCenterSessionCalendar",
    brochureField: "northFamilyCenterSessionBrochure",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  field: keyof SessionCalendarPageFields;
  brochureField: keyof SessionCalendarPageFields;
}>;

function brochureAttachment(brochure: WpMediaFieldInput | null | undefined): AttachmentItem | null {
  const url = acfFileHref(brochure ?? undefined);
  if (!url) return null;

  const node: WpMediaRef | undefined =
    brochure && typeof brochure === "object" && "node" in brochure
      ? brochure.node
      : (brochure as WpMediaRef | undefined);
  const label = (node?.title ?? "Session brochure").trim();
  return { label, url };
}

function renderScheduleContent(html: string) {
  const trimmed = html.trim();
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);

  if (looksLikeHtml) {
    return (
      <div className="gmcc-schedule-embed mt-4" dangerouslySetInnerHTML={{ __html: trimmed }} />
    );
  }

  return (
    <p className="gmcc-schedule-embed mt-4 whitespace-pre-line text-neutral-700">{trimmed}</p>
  );
}

function renderCenterPanelContent(
  html: string | null | undefined,
  brochure: WpMediaFieldInput | null | undefined,
) {
  const scheduleContent = html?.trim() ? (
    renderScheduleContent(html)
  ) : (
    <p className="text-neutral-600">
      Schedule information is not available yet. Please check back soon.
    </p>
  );

  const attachment = brochureAttachment(brochure);

  return (
    <div>
      {scheduleContent}
      {attachment ? (
        <div className="mt-6">
          <AttachmentsCard header="View the session brochure" attachments={[attachment]} />
        </div>
      ) : null}
    </div>
  );
}

export default async function SessionCalendarPage() {
  const page = await fetchPageWithHeroFields<SessionCalendarExtra>(
    "session-calendar",
    SESSION_CALENDAR_EXTRA_FIELDS,
  );
  const hero = resolvePhotoWaveHeaderProps(page, "Session Calendar");
  const fields = page?.sessionCalendarPageFields;

  const accordionItems = CENTER_SCHEDULE_SECTIONS.map(({ id, title, field, brochureField }) => ({
    id,
    title,
    content: renderCenterPanelContent(fields?.[field], fields?.[brochureField]),
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
          Click on a center to view the session calendar.
        </p>

        <Accordion items={accordionItems} allowMultiple={false} defaultOpenIds={[]} />
      </div>
    </main>
  );
}
