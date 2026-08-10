// Data layer for the Early Childhood page: center constants, ACF
// normalization, and the serialized view model shared with
// earlyChildhoodCentersClient.tsx. Kept out of page.tsx so the route file
// only exports what Next.js expects.

import {
  dropInTextCardHasContent,
  normalizeDropInCareFields,
  normalizeDropInTextCard,
  type DropInTextCard,
} from "@/lib/dropInCareFields";
import { asString, collectGalleryFromFields, collectNumberedFaqs } from "@/lib/acf";
import { acfAttachmentItems, resolveWpMediaUrl } from "@/lib/wp";
import { mediaFocalPositionCss } from "@/lib/mediaFocalPoint";
import type { GalleryPhoto } from "@/components/photoGallery";

export type EceCenterSlug = "community-center" | "coleman-family-center" | "north-family-center";

export const ECE_CENTER_ORDER: EceCenterSlug[] = [
  "community-center",
  "coleman-family-center",
  "north-family-center",
];

const CENTER_TAB_LABEL: Record<EceCenterSlug, string> = {
  "community-center": "Community Center",
  "coleman-family-center": "Coleman Family Center",
  "north-family-center": "North Family Center",
};

const DOCUMENTS_FIELD_BY_CENTER: Record<EceCenterSlug, string> = {
  "community-center": "communityCenterDocuments",
  "coleman-family-center": "colemanFamilyCenterDocuments",
  "north-family-center": "northFamilyCenterDocuments",
};

export type TextCardFields = DropInTextCard;

export type SerializedEceProgram = {
  slug: string;
  title: string;
  summary: string;
  heroUrl: string | null;
  heroAlt: string | null;
  objectPosition?: string;
  priceFrom: number | null;
  centerSlugs: string[];
};

function parseProgramNode(node: unknown): SerializedEceProgram | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  const slug = asString(n.slug);
  const title = asString(n.title);
  if (!slug || !title) return null;

  const img = n.featuredImage as {
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
      focalPointX?: number | string | null;
      focalPointY?: number | string | null;
      hasCustomFocalPoint?: boolean | null;
    };
  } | undefined;
  const heroRaw = img?.node?.sourceUrl ?? null;
  const heroUrl =
    (resolveWpMediaUrl(heroRaw) ?? (typeof heroRaw === "string" ? heroRaw.trim() : null)) || null;
  const heroAlt = typeof img?.node?.altText === "string" ? img.node.altText.trim() : null;
  const objectPosition = mediaFocalPositionCss(img?.node);

  const pf = n.programFields as Record<string, unknown> | undefined;
  const summary = pf ? asString(pf.summary) : "";
  let priceFrom: number | null = null;
  if (pf && pf.priceFrom != null) {
    const num = Number(pf.priceFrom);
    if (!Number.isNaN(num)) priceFrom = num;
  }

  const centerBlock = pf?.center as { nodes?: unknown[] } | undefined;
  const centerSlugs: string[] = [];
  for (const c of centerBlock?.nodes ?? []) {
    if (c && typeof c === "object" && "slug" in c) {
      const cs = asString((c as Record<string, unknown>).slug);
      if (cs) centerSlugs.push(cs);
    }
  }

  return {
    slug,
    title,
    summary,
    heroUrl,
    heroAlt,
    ...(objectPosition ? { objectPosition } : {}),
    priceFrom,
    centerSlugs,
  };
}

export type EarlyChildhoodPageViewModel = {
  dropInCareHeader: string;
  dropInCareDescription: string;
  childwatchCard: TextCardFields;
  theZoneCard: TextCardFields;
  programsHeader: string;
  programsDescription: string;
  importantDocumentsHeader: string;
  documentsByCenter: Record<EceCenterSlug, { label: string; href: string }[]>;
  programsByCenter: Record<EceCenterSlug, SerializedEceProgram[]>;
  whyHeader: string;
  whyDescription: string;
  benefits: TextCardFields[];
  faqs: { question: string; answer: string }[];
  galleryPhotos: GalleryPhoto[];
  financialAssistanceHeader: string;
  financialAssistanceSubheader: string;
  financialAssistanceBody: string;
  galleryHeader: string;
  galleryBody: string;
  contactHeader: string;
  contactSubheader: string;
};

export function buildEarlyChildhoodViewModel(
  acf: Record<string, unknown> | null | undefined,
): EarlyChildhoodPageViewModel {
  const f = acf ?? {};

  const dropIn = normalizeDropInCareFields(f);

  const programsHeader = asString(f.programsHeader);
  const programsDescription = asString(f.programsDescription);
  const importantDocumentsHeader = asString(f.importantDocumentsHeader);

  const documentsByCenter = {} as Record<EceCenterSlug, { label: string; href: string }[]>;
  for (const slug of ECE_CENTER_ORDER) {
    const key = DOCUMENTS_FIELD_BY_CENTER[slug];
    documentsByCenter[slug] = acfAttachmentItems(f[key]).map(({ label, url }) => ({ label, href: url }));
  }

  const ecePrograms = f.ecePrograms as { nodes?: unknown[] } | undefined;
  const programNodes = (ecePrograms?.nodes ?? [])
    .map(parseProgramNode)
    .filter((p): p is SerializedEceProgram => p != null);

  const programsByCenter = {} as Record<EceCenterSlug, SerializedEceProgram[]>;
  for (const slug of ECE_CENTER_ORDER) {
    programsByCenter[slug] = [];
  }
  for (const p of programNodes) {
    const addedTo = new Set<EceCenterSlug>();
    for (const cslug of p.centerSlugs) {
      if (!ECE_CENTER_ORDER.includes(cslug as EceCenterSlug)) continue;
      const key = cslug as EceCenterSlug;
      if (addedTo.has(key)) continue;
      addedTo.add(key);
      programsByCenter[key].push(p);
    }
  }
  for (const slug of ECE_CENTER_ORDER) {
    programsByCenter[slug].sort((a, b) => a.title.localeCompare(b.title));
  }

  const benefit1 = normalizeDropInTextCard(f.benefit1);
  const benefit2 = normalizeDropInTextCard(f.benefit2);
  const benefit3 = normalizeDropInTextCard(f.benefit3);
  const benefits = [benefit1, benefit2, benefit3].filter(dropInTextCardHasContent);

  const faqs = collectNumberedFaqs(f.faqs, 3);

  return {
    ...dropIn,
    programsHeader,
    programsDescription,
    importantDocumentsHeader,
    documentsByCenter,
    programsByCenter,
    whyHeader: asString(f.whyEceAtGreaterMidlandHeader),
    whyDescription: asString(f.whyEceAtGreaterMidlandDescription),
    benefits,
    faqs,
    galleryHeader: asString(f.galleryHeader),
    galleryBody: asString(f.galleryBody),
    galleryPhotos: collectGalleryFromFields(f),
    financialAssistanceHeader: asString(f.financialAssistanceHeader),
    financialAssistanceSubheader: asString(f.financialAssistanceSubheader),
    financialAssistanceBody: asString(f.financialAssistanceBody),
    contactHeader: asString(f.contactHeader),
    contactSubheader: asString(f.contactSubheader),
  };
}

export function centerTabsForEce(): { slug: EceCenterSlug; label: string }[] {
  return ECE_CENTER_ORDER.map((slug) => ({ slug, label: CENTER_TAB_LABEL[slug] }));
}
