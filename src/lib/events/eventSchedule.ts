// Shared helpers for the ACF `eventSchedule` repeater on the Event post type.
//
// Each event can have multiple occurrences (e.g. a weekly recurring event):
//   eventSchedule: [{ datetime: { startDatetime, endDatetime } }, ...]
//
// Display/visibility logic rolls forward to the next occurrence: an event stays
// "upcoming" until its LAST occurrence has ended. Once every occurrence is past,
// the event is treated as past (hidden from default views, shown under the past
// filter). The "active" occurrence is the next one that hasn't ended yet, or the
// most recent occurrence if they have all passed.

import { EVENT_DISPLAY_TIMEZONE } from "@/lib/events/formatEventDate";

export type EventOccurrence = { start: string | null; end: string | null };

/** GraphQL selection for the eventSchedule repeater; interpolate into queries. */
export const EVENT_SCHEDULE_GRAPHQL = `
  eventSchedule {
    datetime {
      startDatetime
      endDatetime
    }
  }
`;

/** Minutes `timeZone` is ahead of UTC at the given instant (e.g. -240 for EDT). */
function zoneOffsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - utcMs) / 60000);
}

/**
 * WPGraphQL returns the ACF date/time as the editor's wall-clock time with a
 * bogus "+00:00" offset (5 PM local comes back as "...T17:00:00+00:00").
 * Discard the offset and re-anchor the wall-clock time in EVENT_DISPLAY_TIMEZONE
 * so the result is a real instant, e.g. "2026-10-30T17:00:00-04:00".
 */
function toEventInstant(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return value;
  const [, y, mo, d, h, mi, s = "00"] = m;
  const wallMs = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  const guess = zoneOffsetMinutes(wallMs, EVENT_DISPLAY_TIMEZONE);
  const offset = zoneOffsetMinutes(wallMs - guess * 60000, EVENT_DISPLAY_TIMEZONE);
  const sign = offset < 0 ? "-" : "+";
  const abs = Math.abs(offset);
  const oh = String(Math.floor(abs / 60)).padStart(2, "0");
  const om = String(abs % 60).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${sign}${oh}:${om}`;
}

function toMs(value: string | null): number {
  if (!value) return NaN;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/** Effective start (start, falling back to end). */
function occurrenceStartMs(o: EventOccurrence): number {
  const ms = toMs(o.start ?? o.end);
  return Number.isNaN(ms) ? 0 : ms;
}

/** Effective end (end, falling back to start) — used to decide if an occurrence is over. */
function occurrenceEndMs(o: EventOccurrence): number {
  const ms = toMs(o.end ?? o.start);
  return Number.isNaN(ms) ? 0 : ms;
}

/** Normalize the eventSchedule repeater into occurrences sorted chronologically. */
export function parseEventSchedule(eventSchedule: unknown): EventOccurrence[] {
  const rows = Array.isArray(eventSchedule)
    ? eventSchedule
    : eventSchedule
      ? [eventSchedule]
      : [];

  const occurrences: EventOccurrence[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const dt = (row as { datetime?: { startDatetime?: string | null; endDatetime?: string | null } | null }).datetime;
    const start = typeof dt?.startDatetime === "string" && dt.startDatetime.trim() ? toEventInstant(dt.startDatetime.trim()) : null;
    const end = typeof dt?.endDatetime === "string" && dt.endDatetime.trim() ? toEventInstant(dt.endDatetime.trim()) : null;
    if (!start && !end) continue;
    occurrences.push({ start, end });
  }

  occurrences.sort((a, b) => occurrenceStartMs(a) - occurrenceStartMs(b));
  return occurrences;
}

export type EventDateInfo = {
  /** All occurrences, chronological. */
  occurrences: EventOccurrence[];
  /** Occurrences that have not ended yet (chronological). */
  upcoming: EventOccurrence[];
  /** Next upcoming occurrence, or the most recent one if the event is past. */
  active: EventOccurrence | null;
  /** Active occurrence start (convenience). */
  start: string | null;
  /** Active occurrence end (convenience). */
  end: string | null;
  /** True when every occurrence has ended. */
  isPast: boolean;
  /** True when the event has at least one occurrence with a date. */
  hasSchedule: boolean;
};

/**
 * Resolve the active occurrence and past/upcoming state from occurrences that
 * have ALREADY been parsed by {@link parseEventSchedule}.
 */
export function resolveEventDateInfo(
  occurrences: EventOccurrence[],
  now: Date = new Date()
): EventDateInfo {
  const nowMs = now.getTime();
  const upcoming = occurrences.filter((o) => occurrenceEndMs(o) >= nowMs);

  let active: EventOccurrence | null = null;
  let isPast = false;

  if (upcoming.length) {
    active = upcoming[0];
  } else if (occurrences.length) {
    active = occurrences[occurrences.length - 1];
    isPast = true;
  }

  return {
    occurrences,
    upcoming,
    active,
    start: active?.start ?? null,
    end: active?.end ?? null,
    isPast,
    hasSchedule: occurrences.length > 0,
  };
}

/**
 * Resolve the active occurrence and past/upcoming state from a RAW
 * `eventSchedule` repeater value (as returned by WPGraphQL).
 */
export function getEventDateInfo(eventSchedule: unknown, now: Date = new Date()): EventDateInfo {
  return resolveEventDateInfo(parseEventSchedule(eventSchedule), now);
}

export type UpcomingEventSource = {
  id: string;
  slug: string;
  title?: string | null;
  featuredImage?: unknown;
  eventFields?: { summary?: string | null; eventSchedule?: unknown } | null;
};

/** Pick the next N events with an upcoming occurrence, sorted by active start date. */
export function selectNextUpcomingEvents<T extends UpcomingEventSource>(
  events: T[],
  limit = 4,
  now: Date = new Date()
): Array<{ event: T; dateInfo: EventDateInfo }> {
  return events
    .map((event) => ({
      event,
      dateInfo: getEventDateInfo(event.eventFields?.eventSchedule, now),
    }))
    .filter(({ dateInfo }) => dateInfo.hasSchedule && !dateInfo.isPast && dateInfo.start)
    .sort(
      (a, b) =>
        new Date(a.dateInfo.start!).getTime() - new Date(b.dateInfo.start!).getTime()
    )
    .slice(0, limit);
}
