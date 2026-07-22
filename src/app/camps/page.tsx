import Accordion from "@/components/accordion";
import Link from "next/link";
import { Suspense } from "react";
import { acfCtaHref, acfFileHref, wpFetch } from "@/lib/wp";
import { WEBTRAC_REGISTRATION_URL } from "@/lib/constants";
import {
  acfCtaTarget,
  acfCtaTitle,
  acfImageFromField,
  asImageField,
  asString,
  collectNumberedFaqs,
  openLinkInNewTab,
  resolveAcfLink,
  type FaqItem,
  type ImageField,
  type MediaFieldInput,
  type MediaRef,
} from "@/lib/acf";
import { CAMPS_PROGRAMS_FIRST, PROGRAMS_LIST_QUERY, PROGRAMS_PAGE_SIZE } from "@/lib/programsListQuery";
import CampsProgramsExplorerClient from "./campsProgramsExplorerClient";
import { PAGE_HERO_FIELDS_GRAPHQL, type WpPageWithHeroFields } from "@/lib/pageHeroFields";
import { resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import SponsorsGrid, { normalizeSponsorsByType } from "@/components/sponsorsGrid";
import NavyWaveSection from "@/components/navyWaveSection";

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
            mediaItemUrl
            altText
          }
        }
        tcCampsDescription
        tcCampsImage {
          node {
            sourceUrl
            mediaItemUrl
            altText
          }
        }
        cfcCampsDescription
        cfcCampsImage {
          node {
            sourceUrl
            mediaItemUrl
            altText
          }
        }
        nfcCampsDescription
        nfcCampsImage {
          node {
            sourceUrl
            mediaItemUrl
            altText
          }
        }

        formsAndLinksHeader

        forms {
          file {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
        }
        links {
          linkLabel
          link
        }

        workAtCampHeader
        workAtCampSubheader
        counselorLink { linkLabel link }
        volunteerLink { linkLabel link }

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

const CAMPS_CENTER_IMAGES_QUERY = /* GraphQL */ `
  query CampsCenterImages {
    centers(first: 20) {
      nodes {
        slug
        title
        featuredImage {
          node {
            sourceUrl
            mediaItemUrl
            altText
          }
        }
      }
    }
  }
`;

const CAMP_SPONSORS_QUERY = /* GraphQL */ `
  query CampSponsors {
    sponsors(first: 100) {
      nodes {
        name
        sponsorFields {
          sponsorType
          tier
          link
          logo {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

type FormsAttachmentItem =
  | { kind: "file"; label: string; url: string }
  | { kind: "link"; label: string; url: string; linkTarget?: string | null };

function collectFormsAndLinksItems(forms: unknown, links: unknown): FormsAttachmentItem[] {
  const out: FormsAttachmentItem[] = [];
  const formRows = Array.isArray(forms) ? forms : forms ? [forms] : [];

  formRows.forEach((row, index) => {
    if (!row || typeof row !== "object") return;
    const node = (row as { file?: { node?: MediaRef } }).file?.node;
    const url = acfFileHref(node);
    const label = (node?.title ?? `Form ${index + 1}`).trim();
    if (url) out.push({ label, url, kind: "file" });
  });

  const linkRows = Array.isArray(links) ? links : links ? [links] : [];
  linkRows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    const r = row as { linkLabel?: string | null; link?: unknown };
    const { url, target } = resolveAcfLink(r.link);
    const label = (r.linkLabel ?? "").trim();
    if (url && label) out.push({ label, url, kind: "link", linkTarget: target });
  });

  return out;
}

function collectWorkAtCampLinks(
  counselor: { linkLabel: string; link: unknown },
  volunteer: { linkLabel: string; link: unknown },
): FormsAttachmentItem[] {
  const out: FormsAttachmentItem[] = [];
  const c = resolveAcfLink(counselor.link);
  const cLabel = counselor.linkLabel.trim();
  if (c.url && cLabel) out.push({ kind: "link", label: cLabel, url: c.url, linkTarget: c.target });
  const v = resolveAcfLink(volunteer.link);
  const vLabel = volunteer.linkLabel.trim();
  if (v.url && vLabel) out.push({ kind: "link", label: vLabel, url: v.url, linkTarget: v.target });
  return out;
}

type TextCard = {
  header?: string | null;
  body?: string | null;
  ctaLabel?: string | null;
  /** ACF may return MediaItem, Link, or string depending on field config */
  cta?: unknown;
};

type CampsDirectoryPageFields = {
  campsBrochure: MediaFieldInput;
  financialAssistanceApplication: MediaFieldInput;
  browseByCenterHeader: string;
  browseByCenterSubheader: string;
  ccCampsDescription: string;
  ccCampsImage: ImageField;
  tcCampsDescription: string;
  tcCampsImage: ImageField;
  cfcCampsDescription: string;
  cfcCampsImage: ImageField;
  nfcCampsDescription: string;
  nfcCampsImage: ImageField;
  formsAndLinksHeader: string;
  forms: unknown;
  links: unknown;
  workAtCampHeader: string;
  workAtCampSubheader: string;
  counselorLink: { linkLabel: string; link: unknown };
  volunteerLink: { linkLabel: string; link: unknown };
  resultsHeader: string;
  resultsBody: string;
  whyGmCampsHeader: string;
  whyGmCampsBody: string;
  benefit1: TextCard;
  benefit2: TextCard;
  benefit3: TextCard;
  faqs: FaqItem[];
  contactHeader: string;
  contactSubheader: string;
};

function normalizeTextCard(value: unknown): TextCard {
  if (!value || typeof value !== "object") {
    return { header: "", body: "", ctaLabel: "", cta: null };
  }
  const v = value as Record<string, unknown>;
  return {
    header: asString(v.header),
    body: asString(v.body),
    ctaLabel: asString(v.ctaLabel),
    cta: v.cta ?? null,
  };
}

function normalizeFormLink(value: unknown): { linkLabel: string; link: unknown } {
  if (!value || typeof value !== "object") return { linkLabel: "", link: null };
  const v = value as Record<string, unknown>;
  return {
    linkLabel: asString(v.linkLabel),
    link: v.link ?? null,
  };
}

function initializeCampsDirectoryPageFields(raw: Record<string, unknown> | null | undefined): CampsDirectoryPageFields {
  const f = raw ?? {};
  return {
    campsBrochure: (f.campsBrochure as MediaFieldInput) ?? null,
    financialAssistanceApplication: (f.financialAssistanceApplication as MediaFieldInput) ?? null,
    browseByCenterHeader: asString(f.browseByCenterHeader),
    browseByCenterSubheader: asString(f.browseByCenterSubheader),
    ccCampsDescription: asString(f.ccCampsDescription),
    ccCampsImage: asImageField(f.ccCampsImage),
    tcCampsDescription: asString(f.tcCampsDescription),
    tcCampsImage: asImageField(f.tcCampsImage),
    cfcCampsDescription: asString(f.cfcCampsDescription),
    cfcCampsImage: asImageField(f.cfcCampsImage),
    nfcCampsDescription: asString(f.nfcCampsDescription),
    nfcCampsImage: asImageField(f.nfcCampsImage),
    formsAndLinksHeader: asString(f.formsAndLinksHeader),
    forms: f.forms ?? [],
    links: f.links ?? [],
    workAtCampHeader: asString(f.workAtCampHeader),
    workAtCampSubheader: asString(f.workAtCampSubheader),
    counselorLink: normalizeFormLink(f.counselorLink),
    volunteerLink: normalizeFormLink(f.volunteerLink),
    resultsHeader: asString(f.resultsHeader),
    resultsBody: asString(f.resultsBody),
    whyGmCampsHeader: asString(f.whyGmCampsHeader),
    whyGmCampsBody: asString(f.whyGmCampsBody),
    benefit1: normalizeTextCard(f.benefit1),
    benefit2: normalizeTextCard(f.benefit2),
    benefit3: normalizeTextCard(f.benefit3),
    faqs: collectNumberedFaqs(f.faqs, 4),
    contactHeader: asString(f.contactHeader),
    contactSubheader: asString(f.contactSubheader),
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
  fallbackAlt: string,
): { url: string; alt: string } | null {
  return acfImageFromField(fields?.[imageField], fallbackAlt);
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

function isFinancialAssistanceBenefit(item: TextCard): boolean {
  return /financial\s*assistance/i.test(item.header ?? "");
}

function TextCardBlock({
  item,
  className = "",
  variant = "default",
  ctaHrefOverride,
}: {
  item: TextCard;
  className?: string;
  variant?: "default" | "navy";
  /** When set, used instead of resolving `item.cta` (e.g. ACF file field for a benefit PDF). */
  ctaHrefOverride?: string;
}) {
  const href = (ctaHrefOverride?.trim() || acfCtaHref(item.cta)).trim();
  const openNewTab = ctaHrefOverride
    ? true
    : openLinkInNewTab(href, acfCtaTarget(item.cta));
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
  const [data, programsData, sponsorsData, centersData] = await Promise.all([
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
    wpFetch<{ sponsors?: unknown }>(CAMP_SPONSORS_QUERY, {}),
    wpFetch<{
      centers?: {
        nodes?: Array<{
          slug?: string | null;
          title?: string | null;
          featuredImage?: unknown;
        }> | null;
      } | null;
    }>(CAMPS_CENTER_IMAGES_QUERY, {}),
  ]);

  const campSponsors = normalizeSponsorsByType(sponsorsData?.sponsors, "camp");

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Camps");
  const f = initializeCampsDirectoryPageFields(data?.page?.campsDirectoryPageFields);
  const formsAndLinksSectionTitle = f.formsAndLinksHeader || "Forms and links";
  const attachmentItems = collectFormsAndLinksItems(f.forms, f.links);

  const programsNodes = programsData?.programs?.nodes ?? [];
  const programsPageInfo = programsData?.programs?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  };

  const browseHeader = f.browseByCenterHeader;
  const browseSubheader = f.browseByCenterSubheader;

  const centerImageBySlug = new Map(
    (centersData?.centers?.nodes ?? []).flatMap((center) => {
      const slug = (center.slug ?? "").trim();
      if (!slug) return [];
      const image = acfImageFromField(center.featuredImage, (center.title ?? "").trim() || "Center");
      return image ? [[slug, image] as const] : [];
    }),
  );

  const browseCenterCards = CENTER_CAMPS_CONFIG.map((cfg) => {
    const text = asString((f as unknown as Record<string, unknown>)[cfg.descField]);
    const image =
      centerHeroImage(f, cfg.imageField, cfg.label) ??
      centerImageBySlug.get(cfg.programsCenterSlug) ??
      null;
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

  const faqsList = f.faqs;

  const contactHeader = f.contactHeader;
  const contactSubheader = f.contactSubheader;

  const workAtCampItems = collectWorkAtCampLinks(f.counselorLink, f.volunteerLink);
  const workAtCampSectionTitle = f.workAtCampHeader || "Work at camp";
  const showWorkAtCampSection = !!(f.workAtCampHeader || f.workAtCampSubheader || workAtCampItems.length);

  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl}
        ctas={hero.ctas}
        childrenBeforeCtas
      >
        <a href={acfFileHref(f?.campsBrochure as MediaFieldInput)} target="_blank" rel="noopener noreferrer" className="btn btn-tertiary">{hero.primaryCta?.label ?? "Camps brochure"}</a>
      </PhotoWaveHeader>

      {hasBrowseByCenterSection ? (
        <section className="page-section">
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
        <section className="page-section-narrow">
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


      <section className="page-section">
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

      {showWorkAtCampSection ? (
        <section className="page-section-narrow">
          <div className="justify-center items-center">
            <h2 className="h2 mb-2 text-gmcc-navy text-center">{workAtCampSectionTitle}</h2>
            {f.workAtCampSubheader ? (
              <div className="body mt-4 text-center text-neutral-700">
                {f.workAtCampSubheader.split(/\n\n+/).map((para, i) => (
                  <p key={i} className={i > 0 ? "mt-4 whitespace-pre-line" : "whitespace-pre-line"}>
                    {para}
                  </p>
                ))}
              </div>
            ) : null}
            {workAtCampItems.length ? (
              <div className="mt-4 flex flex-wrap gap-3 justify-center items-center">
                {workAtCampItems.map((item, i) => (
                  <a
                    key={`work-at-camp-${item.url}-${i}`}
                    href={item.url}
                    {...(openLinkInNewTab(item.url, item.kind === "link" ? item.linkTarget : undefined)
                      ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                      : {})}
                    className="group flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold text-gmcc-navy">{item.label}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}


      {(whyHeader || whyBody || benefits.length || faqsList.length) ? (
        <NavyWaveSection id="resources" bottomWave={false} contentClassName="mx-auto w-full max-w-6xl px-6 pb-12 pt-8 md:pt-16 justify-center">
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
                <TextCardBlock
                  key={`benefit-${index}`}
                  item={item}
                  ctaHrefOverride={
                    isFinancialAssistanceBenefit(item)
                      ? acfFileHref(f.financialAssistanceApplication)
                      : undefined
                  }
                />
              ))}
            </div>
          ) : null}

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
        </NavyWaveSection>
      ) : null}

      {/* CAMP SPONSORS */}
      {campSponsors.length > 0 && (
        <section className="page-section">
          <SponsorsGrid sponsors={campSponsors} title="Thank You to Our Camp Sponsors" />
        </section>
      )}

      {/* CONTACT CTA */}
      {(contactHeader || contactSubheader) && (
        <section className="page-section text-center">
          {contactHeader ? <h2 className="h2 text-gmcc-navy">{contactHeader}</h2> : null}
          {contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{contactSubheader}</p>
          ) : null}
          <div className="mt-6 flex justify-center">
            <a
              href={WEBTRAC_REGISTRATION_URL}
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

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/camps");
}
