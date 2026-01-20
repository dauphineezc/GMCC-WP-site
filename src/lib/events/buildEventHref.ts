// lib/events/buildEventHref.ts
function pad2(n: number) {
    return String(n).padStart(2, "0");
  }
  
  /**
   * Accepts common ACF date formats:
   * - "2026-01-15"
   * - "20260115"
   * - ISO strings like "2026-01-15T09:00:00"
   */
  export function buildEventHref(slug: string, startDateRaw: string) {
    if (!startDateRaw) return `/events/${slug}`; // safe fallback
  
    // YYYYMMDD
    const ymd = startDateRaw.replaceAll("-", "").slice(0, 8);
    if (/^\d{8}$/.test(ymd)) {
      const yyyy = ymd.slice(0, 4);
      const mm = ymd.slice(4, 6);
      return `/events/${yyyy}/${mm}/${slug}`;
    }
  
    // ISO-ish (YYYY-MM-DD...)
    const m = startDateRaw.match(/^(\d{4})-(\d{2})-/);
    if (m) {
      const [, yyyy, mm] = m;
      return `/events/${yyyy}/${mm}/${slug}`;
    }
  
    // Last resort: Date parse (can be timezone-sensitive)
    const d = new Date(startDateRaw);
    if (!Number.isNaN(d.getTime())) {
      const yyyy = String(d.getFullYear());
      const mm = pad2(d.getMonth() + 1);
      return `/events/${yyyy}/${mm}/${slug}`;
    }
  
    // If parsing fails, degrade gracefully
    return `/events/${slug}`;
  }
  