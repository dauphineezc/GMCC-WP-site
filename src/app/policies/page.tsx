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
import JotFormEmbed from "@/components/jotFormEmbed";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/policies");
}

const POLICIES_PAGE_QUERY = /* GraphQL */ `
  query PoliciesPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug

      policiesPageFields {
        heroHeader
        heroSubheader
        introductionHeader
        introductionBody
        policies {
          policyName
          policyBody
          policyFileVersion { node { sourceUrl mediaItemUrl title } }
        }
        contactHeader
        contactSubheader
      }
    }
  }
`;

type PolicyItem = {
  policyName?: string | null;
  policyBody?: string | null;
  policyFileVersion?: WpMediaFieldInput | null;
};

type PoliciesPageFields = {
  heroHeader?: string | null;
  heroSubheader?: string | null;
  introductionHeader?: string | null;
  introductionBody?: string | null;
  policies?: PolicyItem[] | null;
  contactHeader?: string | null;
  contactSubheader?: string | null;
};

function policyFileAttachment(file: WpMediaFieldInput | null | undefined): AttachmentItem | null {
  const url = acfFileHref(file ?? undefined);
  if (!url) return null;

  const node: WpMediaRef | undefined =
    file && typeof file === "object" && "node" in file
      ? file.node
      : (file as WpMediaRef | undefined);

  return { label: (node?.title ?? "Download policy").trim(), url };
}

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
  const body = policy.policyBody?.trim();
  const attachment = policyFileAttachment(policy.policyFileVersion);

  return (
    <div>
      {body ? renderPolicyBody(body) : null}
      {attachment ? (
        <div className="mt-6">
          <AttachmentsCard attachments={[attachment]} />
        </div>
      ) : null}
    </div>
  );
}

export default async function PoliciesPage() {
  const data = await wpFetch<any>(POLICIES_PAGE_QUERY, { uri: "/policies" });
  const fields = data?.page?.policiesPageFields;

  const policyItems = (fields?.policies ?? []).filter(
    (policy: PolicyItem): policy is PolicyItem =>
      Boolean(policy?.policyName?.trim() || policy?.policyBody?.trim() || policy?.policyFileVersion),
  );

  const accordionItems = policyItems.map((policy: PolicyItem, index: number) => ({
    id: `policy-${index}`,
    title: policy.policyName?.trim() || `Policy ${index + 1}`,
    content: renderPolicyContent(policy),
  }));

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

        {accordionItems.length > 0 ? (
          <Accordion items={accordionItems} allowMultiple={false} defaultOpenIds={[]} />
        ) : null}
      </section>

      {/* CONTACT CTA */}
      {(fields?.contactHeader || fields?.contactSubheader) && (
        <section className="page-section text-center">
          {fields?.contactHeader ? <h2 className="h2 text-gmcc-navy">{fields.contactHeader}</h2> : null}
          {fields?.contactSubheader ? (
            <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.contactSubheader}</p>
          ) : null}
        </section>
      )}

      <div className="relative overflow-hidden -mt-0 pb-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute left-15 bottom-30 w-0 select-none lg:w-100"
            draggable={false}
          />
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute right-15 top-30 w-0 select-none lg:w-100"
            draggable={false}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 lg:-mt-16 lg:-mb-16">
            <JotFormEmbed formId="262285543716058"/>
        </div>
      </div>
    </main>
  );
}
