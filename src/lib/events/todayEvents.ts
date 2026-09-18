import { buildEventHref } from "@/lib/events/buildEventHref";
import { EVENT_DISPLAY_TIMEZONE, formatEventTimeRange } from "@/lib/events/formatEventDate";
import {
  EVENT_SCHEDULE_GRAPHQL,
  parseEventSchedule,
  type EventOccurrence,
} from "@/lib/events/eventSchedule";
import { wpFetch } from "@/lib/wp";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";
import { REVALIDATE_EVENTS_SECONDS, WP_CACHE_TAGS } from "@/lib/revalidate";

const TODAYS_EVENTS_FETCH_SIZE = 100;

/** Inclusive day window: today through today + (UPCOMING_WEEK_DAYS - 1). */
const UPCOMING_WEEK_DAYS = 7;

export const TODAYS_EVENTS_QUERY = /* GraphQL */ `
  query TodaysEvents($first: Int!) {
    events(first: $first) {
      nodes {
        id
        slug
        title
        featuredImage {
          node { ${WP_MEDIA_IMAGE_FIELDS} }
        }
        eventFields {
          summary
          ${EVENT_SCHEDULE_GRAPHQL}
          center {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
        }
      }
    }
  }
`;

export type TodayEventCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  timeLabel: string;
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  objectPosition?: string;
  centers: { slug: string; title: string }[];
  centerLabel: string | null;
  startDatetime: string;
};

type WpTodayEventNode = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
      focalPointX?: number | string | null;
      focalPointY?: number | string | null;
      hasCustomFocalPoint?: boolean | null;
    } | null;
  } | null;
  eventFields?: {
    summary?: string | null;
    eventSchedule?: unknown;
    center?: {
      nodes?: Array<{ slug?: string | null; title?: string | null } | null> | null;
    } | null;
  } | null;
};

function localDateKey(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-CA", { timeZone });
}

/** Add calendar days to a YYYY-MM-DD key without DST edge cases. */
function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isStartInLocalDateRange(
  startIso: string,
  fromKey: string,
  toKey: string,
  timeZone: string,
): boolean {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  const key = localDateKey(start, timeZone);
  return key >= fromKey && key <= toKey;
}

function findOccurrencesInRange(
  occurrences: EventOccurrence[],
  fromKey: string,
  toKey: string,
  timeZone: string,
): EventOccurrence[] {
  return occurrences.filter(
    (occurrence) =>
      occurrence.start &&
      isStartInLocalDateRange(occurrence.start, fromKey, toKey, timeZone),
  );
}

function formatWeekEventTimeLabel(
  start: string,
  end: string | null,
  timeZone: string,
): string | null {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;

  const dayLabel = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  });
  const timeLabel = formatEventTimeRange(start, end, timeZone);
  if (!timeLabel) return dayLabel;
  return `${dayLabel} • ${timeLabel}`;
}

function mapCenters(
  nodes: Array<{ slug?: string | null; title?: string | null } | null> | null | undefined,
) {
  return (nodes ?? [])
    .map((node) =>
      node?.slug && node?.title ? { slug: node.slug, title: node.title } : null,
    )
    .filter((center): center is { slug: string; title: string } => center != null);
}

export function mapTodaysEvents(
  nodes: WpTodayEventNode[],
  options: {
    onDate?: Date;
    /** Inclusive length of the day window starting at `onDate`. Defaults to 7 (upcoming week). */
    days?: number;
    centerSlug?: string;
    fallbackImageUrl?: string | null;
  } = {},
): TodayEventCardData[] {
  const onDate = options.onDate ?? new Date();
  const days = options.days ?? UPCOMING_WEEK_DAYS;
  const timeZone = EVENT_DISPLAY_TIMEZONE;
  const fallbackImageUrl = options.fallbackImageUrl ?? "/images/VisitPhoto.png";
  const fromKey = localDateKey(onDate, timeZone);
  const toKey = addDaysToDateKey(fromKey, Math.max(days, 1) - 1);

  const cards: TodayEventCardData[] = [];

  for (const node of nodes) {
    if (!node?.id || !node.slug || !node.title) continue;

    const fields = node.eventFields ?? {};
    const centers = mapCenters(fields.center?.nodes);
    if (options.centerSlug && !centers.some((center) => center.slug === options.centerSlug)) {
      continue;
    }

    const weekOccurrences = findOccurrencesInRange(
      parseEventSchedule(fields.eventSchedule),
      fromKey,
      toKey,
      timeZone,
    );

    const hero = node.featuredImage?.node;
    const objectPosition = mediaFocalPositionCss(hero);

    for (const occurrence of weekOccurrences) {
      if (!occurrence.start) continue;

      const timeLabel = formatWeekEventTimeLabel(occurrence.start, occurrence.end, timeZone);
      if (!timeLabel) continue;

      cards.push({
        id: node.id,
        slug: node.slug,
        title: node.title,
        summary: (fields.summary ?? "").trim(),
        timeLabel,
        href: buildEventHref(node.slug, occurrence.start),
        imageUrl: hero?.sourceUrl ?? fallbackImageUrl,
        imageAlt: hero?.altText?.trim() || node.title,
        ...(objectPosition ? { objectPosition } : {}),
        centers,
        centerLabel: centers[0]?.title ?? null,
        startDatetime: occurrence.start,
      });
    }
  }

  return cards.sort(
    (a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime(),
  );
}

export async function fetchTodaysEvents(options: {
  centerSlug?: string;
  fallbackImageUrl?: string | null;
  days?: number;
} = {}): Promise<TodayEventCardData[]> {
  const data = await wpFetch<{
    events?: { nodes?: WpTodayEventNode[] | null } | null;
  }>(TODAYS_EVENTS_QUERY, { first: TODAYS_EVENTS_FETCH_SIZE }, {
    revalidate: REVALIDATE_EVENTS_SECONDS,
    tags: [WP_CACHE_TAGS.events],
  });

  return mapTodaysEvents(data?.events?.nodes ?? [], options);
}
