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
    const start = typeof dt?.startDatetime === "string" && dt.startDatetime.trim() ? dt.startDatetime : null;
    const end = typeof dt?.endDatetime === "string" && dt.endDatetime.trim() ? dt.endDatetime : null;
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
