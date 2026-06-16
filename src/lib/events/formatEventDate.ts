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

export function formatEventDate(
  start?: string | null,
  end?: string | null
): string | null {
  if (!start) return null;

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const formatDate = (d: Date) => d.toLocaleDateString(undefined, dateOpts);

  if (!endDate) {
    const time = startDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${formatDate(startDate)} • ${time}`;
  }

  const sameLocalDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (!sameLocalDay) {
    return `${formatDate(startDate)}–${formatDate(endDate)}`;
  }

  const startTime = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = endDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatDate(startDate)} • ${startTime}–${endTime}`;
}
