import type { Metadata } from "next";
import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  PAGE_HERO_FIELDS_GRAPHQL,
  pageUriCandidatesForSlug,
  resolvePhotoWaveHeaderProps,
  type WpPageWithHeroFields,
} from "@/lib/pageHeroFields";
import { DropInCareSection } from "@/components/dropInCareSection";
import {
  DROP_IN_CARE_FIELDS_GRAPHQL,
  dropInTextCardHasContent,
  normalizeDropInCareFields,
  normalizeDropInTextCard,
  openLinkInNewTab,
  type DropInTextCard,
} from "@/lib/dropInCareFields";
import { wpFetch } from "@/lib/wp";
import PhotoGallery from "@/components/photoGallery";
import EarlyChildhoodCentersClient from "./earlyChildhoodCentersClient";

const EARLY_CHILDHOOD_PAGE_QUERY = /* GraphQL */ `
  query EarlyChildhoodPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug
      ${PAGE_HERO_FIELDS_GRAPHQL}
      earlyChildhoodPageFields {
        ${DROP_IN_CARE_FIELDS_GRAPHQL}
        programsHeader
        programsDescription
        ecePrograms {
          nodes {
            ... on Program {
              slug
              title
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              programFields {
                summary
                priceFrom
                center {
                  nodes {
                    ... on Center {
                      slug
                      title
                    }
                  }
                }
              }
            }
          }
        }
        importantDocumentsHeader
        communityCenterDocuments {
          file1 { node { sourceUrl mediaItemUrl title } }
          file2 { node { sourceUrl mediaItemUrl title } }
          file3 { node { sourceUrl mediaItemUrl title } }
          file4 { node { sourceUrl mediaItemUrl title } }
          file5 { node { sourceUrl mediaItemUrl title } }
          file6 { node { sourceUrl mediaItemUrl title } }
        }
        northFamilyCenterDocuments {
          file1 { node { sourceUrl mediaItemUrl title } }
          file2 { node { sourceUrl mediaItemUrl title } }
          file3 { node { sourceUrl mediaItemUrl title } }
          file4 { node { sourceUrl mediaItemUrl title } }
          file5 { node { sourceUrl mediaItemUrl title } }
          file6 { node { sourceUrl mediaItemUrl title } }
        }
        colemanFamilyCenterDocuments {
          file1 { node { sourceUrl mediaItemUrl title } }
          file2 { node { sourceUrl mediaItemUrl title } }
          file3 { node { sourceUrl mediaItemUrl title } }
          file4 { node { sourceUrl mediaItemUrl title } }
          file5 { node { sourceUrl mediaItemUrl title } }
          file6 { node { sourceUrl mediaItemUrl title } }
        }
        whyEceAtGreaterMidlandHeader
        whyEceAtGreaterMidlandDescription
        benefit1 {
          header
          body
          ctaLabel
          cta
        }
        benefit2 {
          header
          body
          ctaLabel
          cta
        }
        benefit3 {
          header
          body
          ctaLabel
          cta
        }
        faqs {
          faq1 {
            question
            answer
          }
          faq2 {
            question
            answer
          }
          faq3 {
            question
            answer
          }
        }

        galleryHeader
        galleryBody
        gallery {
          galleryItem1 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem2 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem3 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem4 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem5 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem6 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem7 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem8 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
          galleryItem9 {
            photo { node { sourceUrl altText title } }
            photoLabel
          }
        }
        financialAssistanceHeader
        financialAssistanceSubheader
        financialAssistanceBody
        contactHeader
        contactSubheader
      }
    }
  }
`;

import { resolveWpMediaUrl } from "@/lib/wp";
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

type MediaFieldInput = { node?: MediaRef | null } | MediaRef | undefined;
type MediaRef = {
  sourceUrl?: string | null;
  mediaItemUrl?: string | null;
  title?: string | null;
} | null;

function mediaHref(m: MediaFieldInput): string {
  if (m && typeof m === "object" && "node" in m && m.node) {
    return mediaHref(m.node);
  }
  const flat = m as MediaRef | undefined;
  const u = flat?.sourceUrl ?? flat?.mediaItemUrl;
  const raw = typeof u === "string" ? u.trim() : "";
  return resolveWpMediaUrl(raw) ?? raw;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function acfCtaHref(cta: unknown): string {
  if (cta == null) return "";
  if (typeof cta === "string") return cta.trim();
  if (typeof cta !== "object") return "";
  const o = cta as Record<string, unknown>;
  const node = o.node;
  if (node && typeof node === "object") {
    const n = node as Record<string, unknown>;
    const nu = n.sourceUrl ?? n.mediaItemUrl ?? n.uri ?? n.url;
    if (typeof nu === "string" && nu.trim()) return nu.trim();
  }
  const flatMedia = o.sourceUrl ?? o.mediaItemUrl;
  if (typeof flatMedia === "string" && flatMedia.trim()) return flatMedia.trim();
  const linkUrl = o.url ?? o.href ?? o.uri;
  if (typeof linkUrl === "string" && linkUrl.trim()) return linkUrl.trim();
  return "";
}

function acfCtaTarget(cta: unknown): string | null | undefined {
  if (cta && typeof cta === "object") {
    const t = (cta as Record<string, unknown>).target;
    if (typeof t === "string") return t;
  }
  return undefined;
}

export type TextCardFields = DropInTextCard;

function textCardHasContent(card: TextCardFields): boolean {
  return dropInTextCardHasContent(card);
}

export type SerializedEceProgram = {
  slug: string;
  title: string;
  summary: string;
  heroUrl: string | null;
  heroAlt: string | null;
  priceFrom: number | null;
  centerSlugs: string[];
};

function parseProgramNode(node: unknown): SerializedEceProgram | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  const slug = asString(n.slug);
  const title = asString(n.title);
  if (!slug || !title) return null;

  const img = n.featuredImage as { node?: { sourceUrl?: string | null; altText?: string | null } } | undefined;
  const heroRaw = img?.node?.sourceUrl ?? null;
  const heroUrl =
    (resolveWpMediaUrl(heroRaw) ?? (typeof heroRaw === "string" ? heroRaw.trim() : null)) || null;
  const heroAlt = typeof img?.node?.altText === "string" ? img.node.altText.trim() : null;

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

  return { slug, title, summary, heroUrl, heroAlt, priceFrom, centerSlugs };
}

function collectDocumentsFromCenterBlock(block: unknown): { label: string; href: string }[] {
  if (!block || typeof block !== "object") return [];
  const o = block as Record<string, unknown>;
  const out: { label: string; href: string }[] = [];
  for (let i = 1; i <= 6; i++) {
    const field = o[`file${i}`] as MediaFieldInput;
    const href = mediaHref(field);
    if (!href) continue;
    const node =
      field && typeof field === "object" && "node" in field
        ? (field as { node?: MediaRef }).node
        : (field as MediaRef);
    const flat = node as MediaRef | undefined;
    const label = (flat?.title ?? `Download ${i}`).trim();
    out.push({ label, href });
  }
  return out;
}

function pushGalleryAcfRow(row: unknown, out: GalleryPhoto[]) {
  if (!row || typeof row !== "object") return;
  const ro = row as Record<string, unknown>;
  const photo = ro.photo as { node?: { sourceUrl?: string | null; altText?: string | null } } | undefined;
  const node = photo?.node;
  const rawUrl = node?.sourceUrl ?? null;
  const url = resolveWpMediaUrl(rawUrl) ?? (typeof rawUrl === "string" ? rawUrl.trim() : "");
  if (!url) return;
  const alt = typeof node?.altText === "string" ? node.altText.trim() : "";
  const label = asString(ro.photoLabel) || null;
  out.push({ url, alt, label: label || undefined });
}

/**
 * Supports WP/ACF shapes:
 * - Repeater: `gallery { galleryItem[] }` or `galleryItems`
 * - Numbered clones: `gallery { galleryItem1 { photo photoLabel } ... }` (matches current GraphQL query)
 * - Races-style: `gallery { photo1 { node { ... } } ... }`
 */
export function collectGalleryFromFields(fields: Record<string, unknown> | null | undefined): GalleryPhoto[] {
  const g = fields?.gallery;
  if (!g || typeof g !== "object") return [];
  const go = g as Record<string, unknown>;

  const rawItems = go.galleryItem ?? go.galleryItems;
  const items = Array.isArray(rawItems)
    ? rawItems
    : rawItems && typeof rawItems === "object"
      ? [rawItems]
      : [];

  const out: GalleryPhoto[] = [];
  for (const row of items) {
    pushGalleryAcfRow(row, out);
  }

  if (out.length) return out;

  /* Numbered gallery rows (galleryItem1 … galleryItemN) from ACF */
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
    documentsByCenter[slug] = collectDocumentsFromCenterBlock(f[key]);
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
  const benefits = [benefit1, benefit2, benefit3].filter(textCardHasContent);

  const faqsRaw = f.faqs as Record<string, unknown> | undefined;
  const faqs: { question: string; answer: string }[] = [];
  if (faqsRaw && typeof faqsRaw === "object") {
    for (let i = 1; i <= 3; i++) {
      const item = faqsRaw[`faq${i}`] as Record<string, unknown> | undefined;
      const question = item ? asString(item.question) : "";
      const answer = item ? asString(item.answer) : "";
      if (question || answer) faqs.push({ question, answer });
    }
  }

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


type EarlyChildhoodQueryData = {
  page?: (WpPageWithHeroFields & { earlyChildhoodPageFields?: Record<string, unknown> | null }) | null;
};

export const metadata: Metadata = {
  title: "Early Childhood Education",
  description:
    "Drop-in childcare, preschool, and early learning programs across Greater Midland Community Centers.",
};

function BenefitCard({ item }: { item: TextCardFields }) {
  const hasCta = Boolean(item.ctaHref && (item.ctaLabel || item.ctaHref));
  const ctaText = item.ctaLabel?.trim() || "Learn more";
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {item.header ? <h3 className="font-heading text-lg font-semibold text-gmcc-navy">{item.header}</h3> : null}
      {item.body ? <p className="body mt-2 whitespace-pre-line text-sm text-neutral-700">{item.body}</p> : null}
      {hasCta ? (
        <div className="mt-4 flex justify-center">
          <a
            href={item.ctaHref}
            className="btn btn-tertiary"
            {...(openLinkInNewTab(item.ctaHref) ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : {})}
          >
            {ctaText}
          </a>
        </div>
      ) : null}
    </div>
  );
}

async function fetchEarlyChildhoodPage(): Promise<EarlyChildhoodQueryData["page"]> {
  for (const uri of pageUriCandidatesForSlug("early-childhood")) {
    try {
      const data = await wpFetch<EarlyChildhoodQueryData>(EARLY_CHILDHOOD_PAGE_QUERY, { uri }, { suppressGraphQLErrorLogging: true });
      if (data?.page) return data.page;
    } catch {
      /* try next URI */
    }
  }
  return null;
}

export default async function EarlyChildhoodPage() {
  const wpPage = await fetchEarlyChildhoodPage();
  const hero = resolvePhotoWaveHeaderProps(wpPage, "Early Childhood Education");
  const fields = buildEarlyChildhoodViewModel(wpPage?.earlyChildhoodPageFields ?? undefined);

  const whySectionVisible =
    Boolean(fields.whyHeader || fields.whyDescription || fields.benefits.length || fields.faqs.length);
  const financialVisible = Boolean(fields.financialAssistanceHeader || fields.financialAssistanceBody);
  const contactVisible = Boolean(fields.contactHeader || fields.contactSubheader);

  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl}
        ctas={hero.ctas}
      />

      <EarlyChildhoodCentersClient
        programsHeader={fields.programsHeader}
        programsDescription={fields.programsDescription}
        importantDocumentsHeader={fields.importantDocumentsHeader}
        centers={centerTabsForEce()}
        documentsByCenter={fields.documentsByCenter}
        programsByCenter={fields.programsByCenter}
      />

      {financialVisible ? (
        <section className="mx-auto max-w-4xl px-6 text-center pt-8 pb-8">
          <div className="rounded-2xl bg-gmcc-navy px-8 py-10 shadow-sm">
            {fields.financialAssistanceHeader ? <h2 className="h2 text-white">{fields.financialAssistanceHeader}</h2> : null}
            <p className="eyebrow mt-6 text-gmcc-green-light">
                {fields.financialAssistanceSubheader || "Need help covering membership costs?"}
            </p>
            {fields.financialAssistanceBody ? (
              <p className="body mt-6 whitespace-pre-line text-neutral-200">{fields.financialAssistanceBody}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <DropInCareSection fields={fields} contain className="py-16" />
      
      {whySectionVisible ? (
        <section id="why-early-childhood" className="relative scroll-mt-24">
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip">
            <div className="relative z-[1] pointer-events-none w-full overflow-hidden leading-none">
              <svg
                viewBox="0 0 1440 120"
                className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="
                    M-20,110
                    C750,-90  800,120  1200,80
                    S1420,0 1460,0
                    L1460,0 L-20,0 Z
                  "
                  transform="translate(0 120) scale(1 -1)"
                  fill="var(--gmcc-navy)"
                />
              </svg>
            </div>
            </div>

            <div className="relative z-0 -mt-px bg-gmcc-navy text-white">
              <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8 md:pt-10">
                {fields.whyHeader || fields.whyDescription ? (
                  <div>
                    {fields.whyHeader ? <h2 className="h2 text-white">{fields.whyHeader}</h2> : null}
                    {fields.whyDescription ? (
                      <p className="body mt-4 whitespace-pre-line text-white/95">{fields.whyDescription}</p>
                    ) : null}
                  </div>
                ) : null}

                {fields.benefits.length ? (
                  <div
                    className={`grid min-w-0 gap-6 md:grid-cols-3 ${fields.whyHeader || fields.whyDescription ? "mt-10" : ""}`}
                  >
                    {fields.benefits.map((item, index) => (
                      <BenefitCard key={`benefit-${index}`} item={item} />
                    ))}
                  </div>
                ) : null}

                {fields.faqs.length > 0 ? (
                  <div className="mx-auto mt-16 max-w-3xl px-0">
                    <h2 className="h2 mb-8 text-center text-white">FAQs</h2>
                    <Accordion
                      variant="onDark"
                      items={fields.faqs.map((item) => ({
                        id: item.question,
                        title: item.question,
                        content: <p className="body text-white/80">{item.answer}</p>,
                      }))}
                      allowMultiple
                    />
                  </div>
                ) : null}
              </div>
            </div>

          {/* Bottom wave (below navy body) */}
          <div className="relative z-[1] pointer-events-none -mt-px w-full overflow-hidden leading-none">
              <svg
                viewBox="0 0 390 120"
                className="block h-14 w-full text-gmcc-navy md:hidden"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="
                M0,98
                C78,62 135,54 195,74
                C255,96 322,88 390,60
                L390,0 L0,0 Z
              "
                  fill="currentColor"
                />
              </svg>

              <svg
                viewBox="0 0 1440 120"
                className="hidden h-16 w-full text-gmcc-navy md:block"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="
                M0,110
                C300,-50  500,120  800,100
                S1000,0 1440,0
                L1440,0 L0,0 Z
              "
                  fill="currentColor"
                />
              </svg>
            </div>
        </section>
      ) : null}

    {/* {financialVisible ? (
        <section className="mx-auto mt-6 mb-16 max-w-4xl px-6 text-center pt-16 pb-8">
          <div className="rounded-2xl bg-gmcc-navy px-8 py-10 shadow-sm">
            {fields.financialAssistanceHeader ? <h2 className="h2 text-white">{fields.financialAssistanceHeader}</h2> : null}
            <p className="eyebrow mt-6 text-gmcc-green-light">
                {fields.financialAssistanceSubheader || "Need help covering membership costs?"}
            </p>
            {fields.financialAssistanceBody ? (
              <p className="body mt-6 whitespace-pre-line text-neutral-200">{fields.financialAssistanceBody}</p>
            ) : null}
          </div>
        </section>
      ) : null} */}

    {fields.galleryPhotos.length ? (
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          {fields.galleryHeader ? <h2 className="h2">{fields.galleryHeader}</h2> : null}
          {fields.galleryBody ? <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.galleryBody}</p> : null}
          <PhotoGallery photos={fields.galleryPhotos} />
        </section>
      ) : null}

      

      {contactVisible ? (
        <section className="mx-auto mt-16 mb-18 max-w-6xl px-6 text-center">
          {fields.contactHeader ? <h2 className="h2 text-gmcc-navy">{fields.contactHeader}</h2> : null}
          {fields.contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.contactSubheader}</p>
          ) : null}
          <a
            href="https://register.greatermidland.org/webtrac/web/search.html?Action=Start"
            className="btn bg-gmcc-navy text-white hover:bg-neutral-100 mt-6 text-base px-8 py-3"
            >
            Contact Us
          </a>
        </section>
      ) : null}
    </main>
  );
}
