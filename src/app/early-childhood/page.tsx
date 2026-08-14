import type { Metadata } from "next";
import { Suspense } from "react";
import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  PAGE_HERO_FIELDS_GRAPHQL,
  pageUriCandidatesForSlug,
  resolvePhotoWaveHeaderProps,
  type WpPageWithHeroFields,
} from "@/lib/pageHeroFields";
import { DropInCareSection } from "@/components/dropInCareSection";
import { DROP_IN_CARE_FIELDS_GRAPHQL } from "@/lib/dropInCareFields";
import { openLinkInNewTab, WP_MEDIA_IMAGE_FIELDS } from "@/lib/acf";
import JotFormLightboxButton from "@/components/jotFormLightboxButton";
import { wpFetch } from "@/lib/wp";
import PhotoGallery from "@/components/photoGallery";
import NavyWaveSection from "@/components/navyWaveSection";
import EarlyChildhoodCentersClient from "./earlyChildhoodCentersClient";
import {
  buildEarlyChildhoodViewModel,
  centerTabsForEce,
  type TextCardFields,
} from "./earlyChildhoodPageFields";

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
                node { ${WP_MEDIA_IMAGE_FIELDS} }
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
          file {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
        }
        northFamilyCenterDocuments {
          file {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
        }
        colemanFamilyCenterDocuments {
          file {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
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
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem2 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem3 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem4 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem5 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem6 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem7 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem8 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
            photoLabel
          }
          galleryItem9 {
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} title } }
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

type EarlyChildhoodQueryData = {
  page?: (WpPageWithHeroFields & { earlyChildhoodPageFields?: Record<string, unknown> | null }) | null;
};

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/early-childhood");
}

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
        imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      />

      <Suspense fallback={null}>
        <EarlyChildhoodCentersClient
          programsHeader={fields.programsHeader}
          programsDescription={fields.programsDescription}
          importantDocumentsHeader={fields.importantDocumentsHeader}
          centers={centerTabsForEce()}
          documentsByCenter={fields.documentsByCenter}
          programsByCenter={fields.programsByCenter}
        />
      </Suspense>

      {financialVisible ? (
        <section className="page-section-wide text-center">
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

      <DropInCareSection fields={fields} contain />
      
      {whySectionVisible ? (
        <NavyWaveSection id="why-early-childhood">
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
        </NavyWaveSection>
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
        <section className="page-section">
          {fields.galleryHeader ? <h2 className="h2">{fields.galleryHeader}</h2> : null}
          {fields.galleryBody ? <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.galleryBody}</p> : null}
          <PhotoGallery photos={fields.galleryPhotos} />
        </section>
      ) : null}

      

      {contactVisible ? (
        <section className="page-section text-center">
          {fields.contactHeader ? <h2 className="h2 text-gmcc-navy">{fields.contactHeader}</h2> : null}
          {fields.contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.contactSubheader}</p>
          ) : null}
          <JotFormLightboxButton />
        </section>
      ) : null}
    </main>
  );
}
