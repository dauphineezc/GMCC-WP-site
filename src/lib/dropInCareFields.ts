import { acfCtaHref, resolveWpMediaUrl } from "@/lib/wp";
import { asString, type MediaFieldInput, type MediaRef } from "@/lib/acf";

/** GraphQL selection set for drop-in care on `earlyChildhoodPageFields`. */
export const DROP_IN_CARE_FIELDS_GRAPHQL = `
  dropInCareHeader
  dropInCareDescription
  childwatchCard {
    header
    body
    ctaLabel
    cta
    icon { node { sourceUrl altText } }
  }
  theZoneCard {
    header
    body
    ctaLabel
    cta
    icon { node { sourceUrl altText } }
  }
`;

export type DropInTextCard = {
  header: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  icon: { src: string; alt: string };
};

export type DropInCareFields = {
  dropInCareHeader: string;
  dropInCareDescription: string;
  childwatchCard: DropInTextCard;
  theZoneCard: DropInTextCard;
};

function mediaHref(m: MediaFieldInput): string {
  if (m && typeof m === "object" && "node" in m && m.node) {
    return mediaHref(m.node);
  }
  const flat = m as MediaRef | undefined;
  const u = flat?.sourceUrl ?? flat?.mediaItemUrl;
  const raw = typeof u === "string" ? u.trim() : "";
  return resolveWpMediaUrl(raw) ?? raw;
}

export function dropInTextCardHasContent(card: DropInTextCard): boolean {
  return Boolean(card.header || card.body || card.ctaLabel || card.ctaHref || card.icon.src);
}

export function normalizeDropInTextCard(raw: unknown): DropInTextCard {
  if (!raw || typeof raw !== "object") {
    return { header: "", body: "", ctaLabel: "", ctaHref: "", icon: { src: "", alt: "" } };
  }
  const o = raw as Record<string, unknown> & { icon?: MediaFieldInput };
  const cta = o.cta;
  return {
    header: asString(o.header),
    body: asString(o.body),
    ctaLabel: asString(o.ctaLabel),
    ctaHref: acfCtaHref(cta),
    icon: {
      src: mediaHref(o.icon) ?? "",
      alt: asString(
        o.icon && typeof o.icon === "object" && "node" in o.icon
          ? (o.icon as { node?: Record<string, unknown> }).node?.altText
          : (o.icon as Record<string, unknown> | null | undefined)?.altText
      ),
    },
  };
}

export function normalizeDropInCareFields(
  acf: Record<string, unknown> | null | undefined
): DropInCareFields {
  const f = acf ?? {};
  return {
    dropInCareHeader: asString(f.dropInCareHeader),
    dropInCareDescription: asString(f.dropInCareDescription),
    childwatchCard: normalizeDropInTextCard(f.childwatchCard),
    theZoneCard: normalizeDropInTextCard(f.theZoneCard),
  };
}

export function hasDropInCareContent(acf: Record<string, unknown> | null | undefined): boolean {
  if (!acf) return false;
  const normalized = normalizeDropInCareFields(acf);
  return Boolean(
    normalized.dropInCareHeader ||
      normalized.dropInCareDescription ||
      dropInTextCardHasContent(normalized.childwatchCard) ||
      dropInTextCardHasContent(normalized.theZoneCard)
  );
}

/** @deprecated Import from `@/lib/acf` instead. Re-exported for backward compatibility. */
export { isExternalHref, openLinkInNewTab } from "@/lib/acf";

