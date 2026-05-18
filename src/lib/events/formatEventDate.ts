/**
 * Badge / summary line for event start/end.
 * Same calendar day: "Sep 20, 2026 • 9:30 AM–10:30 AM"
 * Multiple days: "Sep 20, 2026–Sep 26, 2026" (no times; avoids implying same-day times)
 */
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
