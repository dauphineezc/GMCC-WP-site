// src/lib/acf.ts
//
// Shared helpers for normalizing ACF field data returned by WPGraphQL.
// Pages should import these instead of declaring local copies.

import { resolveWpMediaUrl, type WpMediaFieldInput, type WpMediaRef } from "@/lib/wp";

/** Media object (or `{ node }` wrapper) as returned for ACF file/image fields. */
export type { WpMediaRef as MediaRef, WpMediaFieldInput as MediaFieldInput };

/** Trimmed string, or "" for any non-string value. */
export function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Split a textarea value into trimmed, non-empty lines. */
export function splitLines(v: unknown): string[] {
  return typeof v === "string"
    ? v.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
}

/** ACF image field from WPGraphQL: `{ node: { sourceUrl, altText } }`. */
export type ImageField = {
  node?: {
    sourceUrl?: string | null;
    altText?: string | null;
  } | null;
} | null;

export function asImageField(value: unknown): ImageField {
  if (!value || typeof value !== "object") return null;
  const node = (value as { node?: unknown }).node;
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  return {
    node: {
      sourceUrl: asString(record.sourceUrl),
      altText: asString(record.altText),
    },
  };
}

/** `target` from an ACF Link field (`_blank` / `_self`), if present. */
export function acfCtaTarget(cta: unknown): string | null | undefined {
  if (cta && typeof cta === "object") {
    const t = (cta as Record<string, unknown>).target;
    if (typeof t === "string") return t;
  }
  return undefined;
}

/** `title` from an ACF Link field or its nested media node, if present. */
export function acfCtaTitle(cta: unknown): string {
  if (cta && typeof cta === "object") {
    const o = cta as Record<string, unknown>;
    if (typeof o.title === "string" && o.title.trim()) return o.title.trim();
    const node = o.node;
    if (node && typeof node === "object") {
      const t = (node as Record<string, unknown>).title;
      if (typeof t === "string" && t.trim()) return t.trim();
    }
  }
  return "";
}

/** ACF / WPGraphQL link field: string URL or object with `url`/`href` and optional `target`. */
export function resolveAcfLink(raw: unknown): { url: string; target?: string | null } {
  if (raw == null) return { url: "" };
  if (typeof raw === "string") return { url: raw.trim() };
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const u = o.url ?? o.href;
    const t = o.target;
    return {
      url: typeof u === "string" ? u.trim() : "",
      target: typeof t === "string" ? t : null,
    };
  }
  return { url: "" };
}

export function isExternalHref(href: string): boolean {
  const t = href.trim();
  return /^https?:\/\//i.test(t) || /^mailto:/i.test(t) || /^tel:/i.test(t);
}

/** Open in a new tab when the ACF link target says so, or for external/mailto/tel URLs. */
export function openLinkInNewTab(url: string, linkTarget?: string | null): boolean {
  if (linkTarget === "_blank") return true;
  if (linkTarget === "_self") return false;
  return isExternalHref(url);
}

/* ------------------------------------------------------------------ */
/* Galleries                                                           */
/* ------------------------------------------------------------------ */

export type AcfGalleryPhoto = { url: string; alt: string; label?: string };

function pushGalleryAcfRow(row: unknown, out: AcfGalleryPhoto[]) {
  if (!row || typeof row !== "object") return;
  const ro = row as Record<string, unknown>;
  const photo = ro.photo as { node?: { sourceUrl?: string | null; altText?: string | null } } | undefined;
  const node = photo?.node;
  const rawUrl = node?.sourceUrl ?? null;
  const url = resolveWpMediaUrl(rawUrl) ?? (typeof rawUrl === "string" ? rawUrl.trim() : "");
  if (!url) return;
  const alt = typeof node?.altText === "string" ? node.altText.trim() : "";
  const label = asString(ro.photoLabel) || undefined;
  out.push({ url, alt, label });
}

/**
 * Photos from an ACF gallery group. Supports the WP/ACF shapes used across pages:
 * - Repeater: `galleryItem[]` / `galleryItems[]` of `{ photo, photoLabel }`
 * - Numbered clones: `galleryItem1..N { photo photoLabel }`
 * - Numbered photos: `photo1..N { node { sourceUrl altText } }` (races/tournaments style)
 */
export function collectGalleryPhotos(gallery: unknown): AcfGalleryPhoto[] {
  if (!gallery || typeof gallery !== "object") return [];
  const go = gallery as Record<string, unknown>;

  const rawItems = go.galleryItem ?? go.galleryItems;
  const items = Array.isArray(rawItems)
    ? rawItems
    : rawItems && typeof rawItems === "object"
      ? [rawItems]
      : [];

  const out: AcfGalleryPhoto[] = [];
  for (const row of items) {
    pushGalleryAcfRow(row, out);
  }
  if (out.length) return out;

  for (let i = 1; i <= 20; i++) {
    pushGalleryAcfRow(go[`galleryItem${i}`], out);
  }
  if (out.length) return out;

  for (let i = 1; i <= 10; i++) {
    const ph = go[`photo${i}`] as { node?: { sourceUrl?: string | null; altText?: string | null } } | undefined;
    const node = ph?.node;
    const rawUrl = node?.sourceUrl ?? null;
    const url = resolveWpMediaUrl(rawUrl) ?? (typeof rawUrl === "string" ? rawUrl.trim() : "");
    if (!url) continue;
    const alt = typeof node?.altText === "string" ? node.altText.trim() : "";
    out.push({ url, alt });
  }
  return out;
}

/** Photos from `fields.gallery` on an ACF field group. */
export function collectGalleryFromFields(
  fields: Record<string, unknown> | null | undefined,
): AcfGalleryPhoto[] {
  return collectGalleryPhotos(fields?.gallery);
}

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */

export type FaqItem = { question: string; answer: string };

export function normalizeFaqItem(value: unknown): FaqItem {
  if (!value || typeof value !== "object") return { question: "", answer: "" };
  const v = value as Record<string, unknown>;
  return {
    question: asString(v.question),
    answer: asString(v.answer),
  };
}

/** Collect ACF clone fields `faq1..faqN`, keeping only items with content. */
export function collectNumberedFaqs(faqs: unknown, max = 10): FaqItem[] {
  if (!faqs || typeof faqs !== "object") return [];
  const f = faqs as Record<string, unknown>;
  const out: FaqItem[] = [];
  for (let i = 1; i <= max; i++) {
    const item = normalizeFaqItem(f[`faq${i}`]);
    if (item.question || item.answer) out.push(item);
  }
  return out;
}
