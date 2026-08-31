/** Extract a JotForm form ID from a jotform.com URL, or null if not a JotForm link. */
export function getJotFormIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)jotform\.com$/i.test(parsed.hostname)) return null;
    const match = parsed.pathname.match(/(?:\/form)?\/(\d{6,})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Build an iframe embed URL, preserving any prefill query params. */
export function getJotFormEmbedSrc(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)jotform\.com$/i.test(parsed.hostname)) return null;
    parsed.searchParams.set("isIframeEmbed", "1");
    return parsed.toString();
  } catch {
    return null;
  }
}
