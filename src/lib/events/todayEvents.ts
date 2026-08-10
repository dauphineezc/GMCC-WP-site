import { buildEventHref } from "@/lib/events/buildEventHref";
import { EVENT_DISPLAY_TIMEZONE, formatEventTimeRange } from "@/lib/events/formatEventDate";
import {
  EVENT_SCHEDULE_GRAPHQL,
  parseEventSchedule,
  type EventOccurrence,
} from "@/lib/events/eventSchedule";
import { wpFetch } from "@/lib/wp";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";

const TODAYS_EVENTS_FETCH_SIZE = 100;

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

function isStartOnDate(startIso: string, onDate: Date, timeZone: string): boolean {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  return localDateKey(start, timeZone) === localDateKey(onDate, timeZone);
}

function findTodaysOccurrence(
  occurrences: EventOccurrence[],
  onDate: Date,
  timeZone: string,
): EventOccurrence | null {
  return (
    occurrences.find(
      (occurrence) => occurrence.start && isStartOnDate(occurrence.start, onDate, timeZone),
    ) ?? null
  );
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
    centerSlug?: string;
    fallbackImageUrl?: string | null;
  } = {},
): TodayEventCardData[] {
  const onDate = options.onDate ?? new Date();
  const timeZone = EVENT_DISPLAY_TIMEZONE;
  const fallbackImageUrl = options.fallbackImageUrl ?? "/images/VisitPhoto.png";

  const cards: TodayEventCardData[] = [];

  for (const node of nodes) {
    if (!node?.id || !node.slug || !node.title) continue;

    const fields = node.eventFields ?? {};
    const centers = mapCenters(fields.center?.nodes);
    if (options.centerSlug && !centers.some((center) => center.slug === options.centerSlug)) {
      continue;
    }

    const todaysOccurrence = findTodaysOccurrence(
      parseEventSchedule(fields.eventSchedule),
      onDate,
      timeZone,
    );
    if (!todaysOccurrence?.start) continue;

    const timeLabel = formatEventTimeRange(todaysOccurrence.start, todaysOccurrence.end, timeZone);
    if (!timeLabel) continue;

    const hero = node.featuredImage?.node;
    const objectPosition = mediaFocalPositionCss(hero);

    cards.push({
      id: node.id,
      slug: node.slug,
      title: node.title,
      summary: (fields.summary ?? "").trim(),
      timeLabel,
      href: buildEventHref(node.slug, todaysOccurrence.start),
      imageUrl: hero?.sourceUrl ?? fallbackImageUrl,
      imageAlt: hero?.altText?.trim() || node.title,
      ...(objectPosition ? { objectPosition } : {}),
      centers,
      centerLabel: centers[0]?.title ?? null,
      startDatetime: todaysOccurrence.start,
    });
  }

  return cards.sort(
    (a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime(),
  );
}

export async function fetchTodaysEvents(options: {
  centerSlug?: string;
  fallbackImageUrl?: string | null;
} = {}): Promise<TodayEventCardData[]> {
  const data = await wpFetch<{
    events?: { nodes?: WpTodayEventNode[] | null } | null;
  }>(TODAYS_EVENTS_QUERY, { first: TODAYS_EVENTS_FETCH_SIZE });

  return mapTodaysEvents(data?.events?.nodes ?? [], options);
}
