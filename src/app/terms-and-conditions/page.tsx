import Accordion from "@/components/accordion";
import AttachmentsCard from "@/components/detail/attachmentsCard";
import { wpFetch } from "@/lib/wp";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import type { Metadata } from "next";
import {
  acfFileHref,
  type AttachmentItem,
  type WpMediaFieldInput,
  type WpMediaRef,
} from "@/lib/wp";
import { WEBTRAC_REGISTRATION_URL } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/terms-and-conditions");
}

const TERMS_AND_CONDITIONS_PAGE_QUERY = /* GraphQL */ `
  query TermsAndConditionsPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug

      termsAndConditionsPageFields {
        heroHeader
        heroSubheader
        introductionHeader
        introductionBody
        termAndorCondition {
          header
          body
        }
        contactHeader
        contactSubheader
      }
    }
  }
`;

type TermAndConditionItem = {
  header?: string | null;
  body?: string | null;
};

type TermsAndConditionsPageFields = {
  heroHeader?: string | null;
  heroSubheader?: string | null;
  introductionHeader?: string | null;
  introductionBody?: string | null;
  termAndorCondition?: TermAndConditionItem[] | null;
};

function renderTermAndConditionBody(body: string) {
  const trimmed = body.trim();
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);

  if (looksLikeHtml) {
    return (
      <div
        className="body mt-4 text-neutral-700"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  return (
    <p className="body mt-4 whitespace-pre-line text-neutral-700">{trimmed}</p>
  );
}

function renderTermAndConditionContent(termAndCondition: TermAndConditionItem) {
  const body = termAndCondition.body?.trim();
  return (
    <div>
      {body ? renderTermAndConditionBody(body) : null}
    </div>
  );
}

export default async function TermsAndConditionsPage() {
  const data = await wpFetch<any>(TERMS_AND_CONDITIONS_PAGE_QUERY, { uri: "/terms-and-conditions" });
  const fields = data?.page?.termsAndConditionsPageFields;

  return (
    <main>
      <SolidNavyWaveHeader title={fields?.heroHeader} description={fields?.heroSubheader} />

      <section className="page-section stack-8">
        {fields?.introductionHeader ? (
          <h2 className="h2 text-center">{fields.introductionHeader}</h2>
        ) : null}
        {fields?.introductionBody ? (
          <p className="body whitespace-pre-line text-neutral-700 text-center mx-auto max-w-3xl">
            {fields.introductionBody}
          </p>
        ) : null}

        {fields?.termAndorCondition?.length > 0 ? (
          <Accordion items={fields?.termAndorCondition?.map((termAndCondition: TermAndConditionItem, index: number) => ({
            id: `term-and-condition-${index}`,
            title: termAndCondition.header?.trim() || `Term and Condition ${index + 1}`,
            content: renderTermAndConditionContent(termAndCondition),
          }))} allowMultiple={false} defaultOpenIds={[]} />
        ) : null}
      </section>

      {/* CONTACT CTA */}
      {(fields?.contactHeader || fields?.contactSubheader) && (
        <section className="page-section text-center">
          {fields?.contactHeader ? <h2 className="h2 text-gmcc-navy">{fields.contactHeader}</h2> : null}
          {fields?.contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.contactSubheader}</p>
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
