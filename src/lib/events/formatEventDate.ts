/**
 * Badge / summary line for event start/end.
 * Same calendar day: "Sep 20, 2026 • 9:30 AM–10:30 AM"
 * Multiple days: "Sep 20, 2026–Sep 26, 2026" (no times; avoids implying same-day times)
 */

/** Fixed timezone for event date badges (matches GMCC service area). */
export const EVENT_DISPLAY_TIMEZONE = "America/Detroit";

/** Day/month badge for home page event cards — uses a fixed timezone for SSR stability. */
export function formatEventBadgeDate(iso?: string | null): { day: string; month: string } {
  if (!iso) return { day: "--", month: "" };

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "--", month: "" };

  return {
    day: d.toLocaleDateString("en-US", { day: "2-digit", timeZone: EVENT_DISPLAY_TIMEZONE }),
    month: d.toLocaleDateString("en-US", { month: "long", timeZone: EVENT_DISPLAY_TIMEZONE }),
  };
}

export function formatEventTimeRange(
  start?: string | null,
  end?: string | null,
  timeZone: string = EVENT_DISPLAY_TIMEZONE,
): string | null {
  if (!start) return null;

  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  };
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;

  if (!end) {
    return startDate.toLocaleTimeString("en-US", timeOpts);
  }

  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) {
    return startDate.toLocaleTimeString("en-US", timeOpts);
  }

  return `${startDate.toLocaleTimeString("en-US", timeOpts)} – ${endDate.toLocaleTimeString("en-US", timeOpts)}`;
}

export function formatEventDate(
  start?: string | null,
  end?: string | null,
): string | null {
  if (!start) return null;

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const timeZone = EVENT_DISPLAY_TIMEZONE;
  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  };
  const formatDate = (d: Date) => d.toLocaleDateString("en-US", dateOpts);
  const formatTime = (d: Date) => d.toLocaleTimeString("en-US", timeOpts);
  const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone });

  if (!endDate) {
    return `${formatDate(startDate)} • ${formatTime(startDate)}`;
  }

  if (dayKey(startDate) !== dayKey(endDate)) {
    return `${formatDate(startDate)}–${formatDate(endDate)}`;
  }

  return `${formatDate(startDate)} • ${formatTime(startDate)}–${formatTime(endDate)}`;
}
