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
import JotFormLightboxButton from "@/components/jotFormLightboxButton";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/privacy-policy");
}

const PRIVACY_POLICY_PAGE_QUERY = /* GraphQL */ `
  query PrivacyPolicyPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug

      privacyPolicyPageFields {
        heroHeader
        heroSubheader
        introductionHeader
        introductionBody
        policies {
          header
          body
        }
        contactHeader
        contactSubheader
      }
    }
  }
`;

type PolicyItem = {
  header?: string | null;
  body?: string | null;
};

type PrivacyPolicyPageFields = {
  heroHeader?: string | null;
  heroSubheader?: string | null;
  introductionHeader?: string | null;
  introductionBody?: string | null;
  policies?: PolicyItem[] | null;
};

function renderPolicyBody(body: string) {
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

function renderPolicyContent(policy: PolicyItem) {
  const body = policy.body?.trim();
  return (
    <div>
      {body ? renderPolicyBody(body) : null}
    </div>
  );
}

export default async function PrivacyPolicyPage() {
  const data = await wpFetch<any>(PRIVACY_POLICY_PAGE_QUERY, { uri: "/privacy-policy" });
  const fields = data?.page?.privacyPolicyPageFields;

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

        {fields?.policies?.length > 0 ? (
          <Accordion items={fields?.policies?.map((policy: PolicyItem, index: number) => ({
            id: `policy-${index}`,
            title: policy.header?.trim() || `Policy ${index + 1}`,
            content: renderPolicyContent(policy),
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
          <div className="flex justify-center">
            <JotFormLightboxButton />
          </div>
        </section>
      )}
    </main>
  );
}
