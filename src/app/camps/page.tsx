import Accordion from "@/components/accordion";
import Link from "next/link";
import { Suspense } from "react";
import { wpFetch } from "@/lib/wp";
import { CAMPS_PROGRAMS_FIRST, PROGRAMS_LIST_QUERY, PROGRAMS_PAGE_SIZE } from "@/lib/programsListQuery";
import CampsProgramsExplorerClient from "./campsProgramsExplorerClient";
import { PAGE_HERO_FIELDS_GRAPHQL, type WpPageWithHeroFields } from "@/lib/pageHeroFields";
import { resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PhotoWaveHeader from "@/components/photoWaveHeader";

const CAMPS_PAGE_QUERY = /* GraphQL */ `
  query CampsPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      campsDirectoryPageFields {
        campsBrochure {
          node {
            sourceUrl
            mediaItemUrl
            title
          }
        }
        financialAssistanceApplication {
          node {
            sourceUrl
            mediaItemUrl
            title
          }
        }
        browseByCenterHeader
        browseByCenterSubheader
        ccCampsDescription
        ccCampsImage {
          node {
            sourceUrl
            altText
          }
        }
        tcCampsDescription
        tcCampsImage {
          node {
            sourceUrl
            altText
          }
        }
        cfcCampsDescription
        cfcCampsImage {
          node {
            sourceUrl
            altText
          }
        }
        nfcCampsDescription
        nfcCampsImage {
          node {
            sourceUrl
            altText
          }
        }

        formsAndLinks {
          header
          form1 {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
          form2 {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
          form3 {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
          form4 {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
          form5 {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
          form6 {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
          link1 {
            linkLabel
            link
          }
          link2 {
            linkLabel
            link
          }
          link3 {
            linkLabel
            link
          }
          link4 {
            linkLabel
            link
          }
          link5 {
            linkLabel
            link
          }
          link6 {
            linkLabel
            link
          }
        }

        resultsHeader
        resultsBody
        whyGmCampsHeader
        whyGmCampsBody
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

        contactHeader
        contactSubheader
      }
    }
  }
`;

type MediaRef = {
  sourceUrl?: string | null;
  mediaItemUrl?: string | null;
  title?: string | null;
} | null;

/** Shape returned by WPGraphQL for ACF file fields (nested `node`) or a flat media object. */
type MediaFieldInput = { node?: MediaRef } | MediaRef | undefined;

/** ACF file fields often return `{ node: MediaItem }` from WPGraphQL; unwrap when present. */
function mediaHref(m: MediaFieldInput): string {
  if (m && typeof m === "object" && "node" in m && m.node) {
    return mediaHref(m.node);
  }
  const flat = m as MediaRef | undefined;
  const u = flat?.sourceUrl ?? flat?.mediaItemUrl;
  return typeof u === "string" ? u.trim() : "";
}

/**
 * URL from ACF fields that may be a file (MediaItem), link object, or raw string
 * (matches hero CTA handling in `pageHeroFields` plus nested `node` media).
 */
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

function acfCtaTitle(cta: unknown): string {
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

function acfCtaTarget(cta: unknown): string | null | undefined {
  if (cta && typeof cta === "object") {
    const t = (cta as Record<string, unknown>).target;
    if (typeof t === "string") return t;
  }
  return undefined;
}

/** ACF / WPGraphQL link field: string URL or object with `url` / optional `target`. */
function resolveAcfLink(raw: unknown): { url: string; target?: string | null } {
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

function openLinkInNewTab(url: string, linkTarget?: string | null): boolean {
  if (linkTarget === "_blank") return true;
  if (linkTarget === "_self") return false;
  return isExternalHref(url);
}

function isExternalHref(href: string): boolean {
  const t = href.trim();
  return /^https?:\/\//i.test(t) || /^mailto:/i.test(t) || /^tel:/i.test(t);
}

type FormsAttachmentItem =
  | { kind: "file"; label: string; url: string }
  | { kind: "link"; label: string; url: string; linkTarget?: string | null };

function collectFormsAndLinks(formsAndLinks: Record<string, unknown> | null | undefined): FormsAttachmentItem[] {
  if (!formsAndLinks || typeof formsAndLinks !== "object") return [];
  const out: FormsAttachmentItem[] = [];
  for (let i = 1; i <= 6; i++) {
    const form = formsAndLinks[`form${i}`] as { node?: MediaRef } | undefined;
    const node = form?.node;
    const url = mediaHref(node);
    const label = (node?.title ?? `Form ${i}`).trim();
    if (url) out.push({ label, url, kind: "file" });
  }
  for (let i = 1; i <= 6; i++) {
    const row = formsAndLinks[`link${i}`] as { linkLabel?: string | null; link?: unknown } | undefined;
    const { url, target } = resolveAcfLink(row?.link);
    const label = (row?.linkLabel ?? "").trim();
    if (url && label) out.push({ label, url, kind: "link", linkTarget: target });
  }
  return out;
}

type TextCard = {
  header?: string | null;
  body?: string | null;
  ctaLabel?: string | null;
  /** ACF may return MediaItem, Link, or string depending on field config */
  cta?: unknown;
};

type CampsImageField = {
  node?: {
    sourceUrl?: string | null;
    altText?: string | null;
  } | null;
} | null;

type CampsFaqItem = {
  question: string;
  answer: string;
};

type CampsFaqs = {
  faq1: CampsFaqItem;
  faq2: CampsFaqItem;
  faq3: CampsFaqItem;
  faq4: CampsFaqItem;
};

type CampsFormsAndLinks = {
  header: string;
  form1: MediaFieldInput;
  form2: MediaFieldInput;
  form3: MediaFieldInput;
  form4: MediaFieldInput;
  form5: MediaFieldInput;
  form6: MediaFieldInput;
  link1: { linkLabel: string; link: unknown };
  link2: { linkLabel: string; link: unknown };
  link3: { linkLabel: string; link: unknown };
  link4: { linkLabel: string; link: unknown };
  link5: { linkLabel: string; link: unknown };
  link6: { linkLabel: string; link: unknown };
};

type CampsDirectoryPageFields = {
  campsBrochure: MediaFieldInput;
  financialAssistanceApplication: MediaFieldInput;
  browseByCenterHeader: string;
  browseByCenterSubheader: string;
  ccCampsDescription: string;
  ccCampsImage: CampsImageField;
  tcCampsDescription: string;
  tcCampsImage: CampsImageField;
  cfcCampsDescription: string;
  cfcCampsImage: CampsImageField;
  nfcCampsDescription: string;
  nfcCampsImage: CampsImageField;
  formsAndLinks: CampsFormsAndLinks;
  resultsHeader: string;
  resultsBody: string;
  whyGmCampsHeader: string;
  whyGmCampsBody: string;
  benefit1: TextCard;
  benefit2: TextCard;
  benefit3: TextCard;
  faqs: CampsFaqs;
  contactHeader: string;
  contactSubheader: string;
};

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTextCard(value: unknown): TextCard {
  if (!value || typeof value !== "object") {
    return { header: "", body: "", ctaLabel: "", cta: null };
  }
  const v = value as Record<string, unknown>;
  return {
    header: stringOrEmpty(v.header),
    body: stringOrEmpty(v.body),
    ctaLabel: stringOrEmpty(v.ctaLabel),
    cta: v.cta ?? null,
  };
}

function normalizeImageField(value: unknown): CampsImageField {
  if (!value || typeof value !== "object") return null;
  const node = (value as { node?: unknown }).node;
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  return {
    node: {
      sourceUrl: stringOrEmpty(n.sourceUrl),
      altText: stringOrEmpty(n.altText),
    },
  };
}

function normalizeFormLink(value: unknown): { linkLabel: string; link: unknown } {
  if (!value || typeof value !== "object") return { linkLabel: "", link: null };
  const v = value as Record<string, unknown>;
  return {
    linkLabel: stringOrEmpty(v.linkLabel),
    link: v.link ?? null,
  };
}

function normalizeFaqItem(value: unknown): CampsFaqItem {
  if (!value || typeof value !== "object") return { question: "", answer: "" };
  const v = value as Record<string, unknown>;
  return {
    question: stringOrEmpty(v.question),
    answer: stringOrEmpty(v.answer),
  };
}

function initializeCampsDirectoryPageFields(raw: Record<string, unknown> | null | undefined): CampsDirectoryPageFields {
  const f = raw ?? {};
  const formsAndLinks = (f.formsAndLinks as Record<string, unknown> | undefined) ?? {};
  const faqs = (f.faqs as Record<string, unknown> | undefined) ?? {};
  return {
    campsBrochure: (f.campsBrochure as MediaFieldInput) ?? null,
    financialAssistanceApplication: (f.financialAssistanceApplication as MediaFieldInput) ?? null,
    browseByCenterHeader: stringOrEmpty(f.browseByCenterHeader),
    browseByCenterSubheader: stringOrEmpty(f.browseByCenterSubheader),
    ccCampsDescription: stringOrEmpty(f.ccCampsDescription),
    ccCampsImage: normalizeImageField(f.ccCampsImage),
    tcCampsDescription: stringOrEmpty(f.tcCampsDescription),
    tcCampsImage: normalizeImageField(f.tcCampsImage),
    cfcCampsDescription: stringOrEmpty(f.cfcCampsDescription),
    cfcCampsImage: normalizeImageField(f.cfcCampsImage),
    nfcCampsDescription: stringOrEmpty(f.nfcCampsDescription),
    nfcCampsImage: normalizeImageField(f.nfcCampsImage),
    formsAndLinks: {
      header: stringOrEmpty(formsAndLinks.header),
      form1: (formsAndLinks.form1 as MediaFieldInput) ?? null,
      form2: (formsAndLinks.form2 as MediaFieldInput) ?? null,
      form3: (formsAndLinks.form3 as MediaFieldInput) ?? null,
      form4: (formsAndLinks.form4 as MediaFieldInput) ?? null,
      form5: (formsAndLinks.form5 as MediaFieldInput) ?? null,
      form6: (formsAndLinks.form6 as MediaFieldInput) ?? null,
      link1: normalizeFormLink(formsAndLinks.link1),
      link2: normalizeFormLink(formsAndLinks.link2),
      link3: normalizeFormLink(formsAndLinks.link3),
      link4: normalizeFormLink(formsAndLinks.link4),
      link5: normalizeFormLink(formsAndLinks.link5),
      link6: normalizeFormLink(formsAndLinks.link6),
    },
    resultsHeader: stringOrEmpty(f.resultsHeader),
    resultsBody: stringOrEmpty(f.resultsBody),
    whyGmCampsHeader: stringOrEmpty(f.whyGmCampsHeader),
    whyGmCampsBody: stringOrEmpty(f.whyGmCampsBody),
    benefit1: normalizeTextCard(f.benefit1),
    benefit2: normalizeTextCard(f.benefit2),
    benefit3: normalizeTextCard(f.benefit3),
    faqs: {
      faq1: normalizeFaqItem(faqs.faq1),
      faq2: normalizeFaqItem(faqs.faq2),
      faq3: normalizeFaqItem(faqs.faq3),
      faq4: normalizeFaqItem(faqs.faq4),
    },
    contactHeader: stringOrEmpty(f.contactHeader),
    contactSubheader: stringOrEmpty(f.contactSubheader),
  };
}

function blockHasContent(b: TextCard | null | undefined): boolean {
  if (!b) return false;
  return (
    !!(b.header?.trim()) ||
    !!(b.body?.trim()) ||
    !!(b.ctaLabel?.trim()) ||
    !!acfCtaHref(b.cta)
  );
}

/** Order matches browse-by-center design: Community, Tennis, North, Coleman */
const CENTER_CAMPS_CONFIG: Array<{
  descField: string;
  imageField: string;
  label: string;
  programsCenterSlug: string;
}> = [
  { descField: "ccCampsDescription", imageField: "ccCampsImage", label: "Community Center", programsCenterSlug: "community-center" },
  { descField: "tcCampsDescription", imageField: "tcCampsImage", label: "Tennis Center", programsCenterSlug: "tennis-center" },
  { descField: "nfcCampsDescription", imageField: "nfcCampsImage", label: "North Family Center", programsCenterSlug: "north-family-center" },
  { descField: "cfcCampsDescription", imageField: "cfcCampsImage", label: "Coleman Family Center", programsCenterSlug: "coleman-family-center" },
];

function centerHeroImage(
  fields: Record<string, unknown> | null | undefined,
  imageField: string,
): { url: string; alt: string } | null {
  const block = fields?.[imageField] as { node?: { sourceUrl?: string | null; altText?: string | null } } | null;
  const url = block?.node?.sourceUrl?.trim();
  if (!url) return null;
  return { url, alt: (block?.node?.altText ?? "").trim() || "Center" };
}

function CampsResultsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit space-y-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="h-10 animate-pulse rounded bg-neutral-100" />
          <div className="h-8 animate-pulse rounded bg-neutral-100" />
          <div className="h-8 animate-pulse rounded bg-neutral-100" />
        </aside>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md"
              >
                <div className="h-36 bg-neutral-200" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-[75%] rounded bg-neutral-200" />
                  <div className="h-3 rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TextCardBlock({
  item,
  className = "",
  variant = "default",
}: {
  item: TextCard;
  className?: string;
  variant?: "default" | "navy";
}) {
  const href = acfCtaHref(item.cta);
  const openNewTab = openLinkInNewTab(href, acfCtaTarget(item.cta));
  const ctaLinkText =
    item.ctaLabel?.trim() || acfCtaTitle(item.cta) || (href ? "Open link" : "");

  const shell =
    variant === "navy"
      ? "rounded-xl border border-white/20 bg-gmcc-navy p-5 shadow-md text-white"
      : "rounded-xl border border-neutral-200 bg-white p-5 shadow-sm";
  const titleClass =
    variant === "navy"
      ? "font-heading text-lg font-semibold text-white"
      : "font-heading text-lg font-semibold text-gmcc-navy";
  const bodyClass =
    variant === "navy"
      ? "body mt-2 whitespace-pre-line text-sm text-white/90"
      : "body mt-2 whitespace-pre-line text-sm text-neutral-700";
  const ctaClass = "btn btn-tertiary";

  return (
    <div className={`${shell} ${className}`}>
      {item.header?.trim() ? <h3 className={titleClass}>{item.header.trim()}</h3> : null}
      {item.body?.trim() ? <p className={bodyClass}>{item.body.trim()}</p> : null}
      {href ? (
        <div className="mt-4 flex justify-center">
          <a
            href={href}
            className={ctaClass}
            {...(openNewTab ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : {})}
          >
            {ctaLinkText}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default async function CampsPage() {
  const [data, programsData] = await Promise.all([
    wpFetch<{
      page?:
        | (WpPageWithHeroFields & {
            campsDirectoryPageFields?: Record<string, unknown> | null;
          })
        | null;
    }>(CAMPS_PAGE_QUERY, {
      uri: "/camps",
    }),
    wpFetch<{
      programs?: {
        pageInfo?: { hasNextPage: boolean; endCursor: string | null };
        nodes?: unknown[] | null;
      } | null;
    }>(PROGRAMS_LIST_QUERY, {
      first: CAMPS_PROGRAMS_FIRST,
      after: null,
    }),
  ]);

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Camps");
  const f = initializeCampsDirectoryPageFields(data?.page?.campsDirectoryPageFields);
  const formsAndLinks = f.formsAndLinks as unknown as Record<string, unknown>;
  const formsAndLinksHeader = f.formsAndLinks.header;
  const formsAndLinksSectionTitle = formsAndLinksHeader || "Forms and links";
  const attachmentItems = collectFormsAndLinks(formsAndLinks);

  const programsNodes = programsData?.programs?.nodes ?? [];
  const programsPageInfo = programsData?.programs?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  };

  const browseHeader = f.browseByCenterHeader;
  const browseSubheader = f.browseByCenterSubheader;

  const browseCenterCards = CENTER_CAMPS_CONFIG.map((cfg) => {
    const text = stringOrEmpty((f as unknown as Record<string, unknown>)[cfg.descField]);
    const image = centerHeroImage(f, cfg.imageField);
    const href = `/camps?center=${encodeURIComponent(cfg.programsCenterSlug)}#camps-results`;
    return {
      key: cfg.programsCenterSlug,
      title: `${cfg.label} Camps`,
      text,
      image,
      href,
    };
  });

  const hasBrowseByCenterSection =
    !!browseHeader ||
    !!browseSubheader ||
    browseCenterCards.some((c) => c.text || c.image);

  const resultsHeader = f.resultsHeader || "Camp programs";
  const resultsBody = f.resultsBody;

  const whyHeader = f.whyGmCampsHeader;
  const whyBody = f.whyGmCampsBody;

  const benefits = [f.benefit1, f.benefit2, f.benefit3].filter((b) => blockHasContent(b as TextCard)) as TextCard[];

  const faqsList = [f.faqs.faq1, f.faqs.faq2, f.faqs.faq3, f.faqs.faq4]
    .map((item) => ({
      question: item?.question ?? "",
      answer: item?.answer ?? "",
    }))
    .filter((item) => item.question.trim() || item.answer.trim());

  const contactHeader = f.contactHeader;
  const contactSubheader = f.contactSubheader;

  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} children={<div className="mt-6 mb-6 flex flex-wrap items-center gap-3">
        <a href={mediaHref(f?.campsBrochure as MediaFieldInput)} target="_blank" rel="noopener noreferrer" className="btn btn-tertiary">{hero.primaryCta?.label ?? "Camps brochure"}</a>
        <a href={mediaHref(f?.financialAssistanceApplication as MediaFieldInput)} className="btn btn-secondary">{hero.secondaryCta?.label ?? "Financial assistance application"}</a>
      </div>} />

      {hasBrowseByCenterSection ? (
        <section className="mx-auto max-w-6xl px-6">
          {browseHeader ? <h2 className="h2">{browseHeader}</h2> : null}
          {browseSubheader ? (
            <div className="body mt-4 text-neutral-700">
              {browseSubheader.split(/\n\n+/).map((para, i) => (
                <p key={i} className={i > 0 ? "mt-4 whitespace-pre-line" : "whitespace-pre-line"}>
                  {para}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {browseCenterCards.map((c) => (
              <article
                key={c.key}
                className="flex flex-col overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5"
              >
                <div className="relative aspect-[4/3] bg-neutral-200 overflow-hidden rounded-t-2xl">
                  {c.image ? (
                    <img
                      src={c.image.url}
                      alt={c.image.alt || c.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col bg-gmcc-navy px-5 pb-5 pt-5">
                  <h3 className="font-heading text-lg font-bold leading-snug text-white">{c.title}</h3>
                  {c.text ? (
                    <p className="mt-3 flex-1 text-sm leading-6 text-white/90 whitespace-pre-line">{c.text}</p>
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}
                  <Link
                    href={c.href}
                    className="mx-auto mt-2 btn btn-tertiary"
                  >
                    View camps
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {attachmentItems.length ? (
        <section className="mx-auto mt-16 max-w-5xl px-6">
          <div className="justify-center items-center">
          <h2 className="h2 mb-2 text-gmcc-navy text-center">{formsAndLinksSectionTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-3 justify-center items-center">
            {attachmentItems.map((item, i) =>
              item.kind === "file" ? (
                <a
                  key={`file-${item.url}-${i}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-gmcc-navy">
                      {item.label}
                    </span>
                      {/* <span className="text-xs text-neutral-500">PDF • Click to download</span> */}
                  </div>
                  <svg
                    className="ml-2 h-4 w-4 shrink-0 text-gmcc-navy transition-transform group-hover:translate-y-0.5 group-hover:text-gmcc-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>
              ) : (
                <a
                  key={`link-${item.url}-${i}`}
                  href={item.url}
                  {...(openLinkInNewTab(item.url, item.linkTarget)
                    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                    : {})}
                  className="group flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-gmcc-navy">
                      {item.label}
                    </span>
                  </div>
                </a>
              ),
            )}
          </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 mt-16">
      {resultsHeader ? <h2 className="h2 text-gmcc-navy">{resultsHeader}</h2> : null}
      {resultsBody ? <p className="body mt-4 text-neutral-700">{resultsBody}</p> : null}

      <Suspense fallback={<CampsResultsSkeleton />}>
        <CampsProgramsExplorerClient
          initialPrograms={programsNodes}
          initialPageInfo={programsPageInfo}
          pageSize={PROGRAMS_PAGE_SIZE}
          resultsHeader={resultsHeader}
          resultsBody={resultsBody}
        />
      </Suspense>
      </section>


      {(whyHeader || whyBody || benefits.length || faqsList.length) ? (
        <section id="resources" className="relative mt-12 scroll-mt-24">
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip">
            {/* Top wave (above navy body; not covered by background) */}
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

            {/* Full-bleed navy band; content aligned to max-w-6xl + horizontal padding */}
            <div className="relative z-0 -mt-px bg-gmcc-navy text-white">
              <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8 md:pt-10 justify-center">
                {(whyHeader || whyBody) ? (
                  <div>
                    {whyHeader ? <h2 className="h2 text-white">{whyHeader}</h2> : null}
                    {whyBody ? <p className="body mt-4 whitespace-pre-line text-white/95">{whyBody}</p> : null}
                  </div>
                ) : null}

                {benefits.length ? (
                  <div
                    className={`grid min-w-0 gap-6 md:grid-cols-3 ${whyHeader || whyBody ? "mt-10" : ""}`}
                  >
                    {benefits.map((item, index) => (
                      <TextCardBlock key={`benefit-${index}`} item={item} />
                    ))}
                  </div>
                ) : null}

                {/* ── FAQs ── */}
                {faqsList.length > 0 && (
                    <div className="mx-auto max-w-3xl px-6 mt-16">
                        <h2 className="h1 mb-8 text-center text-white">FAQs</h2>
                        <Accordion variant="onDark" items={faqsList.map((item) => ({
                        id: item.question,
                        title: item.question,
                        content: <p className="body text-white/80">{item.answer}</p>,
                        }))} allowMultiple />
                    </div>
                )}
              </div>
            </div>

            {/* Bottom wave (below navy body)
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
            </div> */}
          </div>
        </section>
      ) : null}

      {/* CONTACT CTA */}
      {(contactHeader || contactSubheader) && (
        <section className="mx-auto mt-24 mb-18 max-w-6xl px-6 text-center justify-center">
          {contactHeader ? <h2 className="h2 text-gmcc-navy">{contactHeader}</h2> : null}
          {contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{contactSubheader}</p>
          ) : null}
          <div className="mt-6 flex justify-center">
            <a
              href="https://register.greatermidland.org/webtrac/web/search.html?Action=Start"
              className="btn bg-gmcc-navy px-8 py-3 text-base text-white hover:bg-neutral-100"
            >
              Contact Us
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
