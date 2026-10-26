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

  const gmccPolicies = policyItems.filter((policy: PolicyItem) => policy.policyName?.includes("Community Center"));
  const gmtcPolicies = policyItems.filter((policy: PolicyItem) => policy.policyName?.includes("Tennis Center"));
  const gmcfcPolicies = policyItems.filter((policy: PolicyItem) => policy.policyName?.includes("Coleman Family Center"));
  const gmnfcPolicies = policyItems.filter((policy: PolicyItem) => policy.policyName?.includes("North Family Center"));
  const gmcurlcPolicies = policyItems.filter((policy: PolicyItem) => policy.policyName?.includes("Curling Center"));
  
  const organizationWidePolicies = policyItems.filter((policy: PolicyItem) =>
    ![
      ...gmccPolicies,
      ...gmtcPolicies,
      ...gmcfcPolicies,
      ...gmnfcPolicies,
      ...gmcurlcPolicies,
    ].includes(policy),
  );

  const accordionItems = organizationWidePolicies.map((policy: PolicyItem, index: number) => ({
    id: `policy-${index}`,
    title: policy.policyName?.trim() || `Policy ${index + 1}`,
    content: renderPolicyContent(policy),
  }));

  const gmccAccordionItems = gmccPolicies.map((policy: PolicyItem, index: number) => ({
    id: `policy-${index}`,
    title: policy.policyName?.trim() || `Policy ${index + 1}`,
    content: renderPolicyContent(policy),
  }));

  const gmtcAccordionItems = gmtcPolicies.map((policy: PolicyItem, index: number) => ({
    id: `policy-${index}`,
    title: policy.policyName?.trim() || `Policy ${index + 1}`,
    content: renderPolicyContent(policy),
  }));
  
  const gmcfcAccordionItems = gmcfcPolicies.map((policy: PolicyItem, index: number) => ({
    id: `policy-${index}`,
    title: policy.policyName?.trim() || `Policy ${index + 1}`,
    content: renderPolicyContent(policy),
  }));

  const gmnfcAccordionItems = gmnfcPolicies.map((policy: PolicyItem, index: number) => ({
    id: `policy-${index}`,
    title: policy.policyName?.trim() || `Policy ${index + 1}`,
    content: renderPolicyContent(policy),
  }));

  const gmcurlcAccordionItems = gmcurlcPolicies.map((policy: PolicyItem, index: number) => ({
    id: `policy-${index}`,
    title: policy.policyName?.trim() || `Policy ${index + 1}`,
    content: renderPolicyContent(policy),
  }));

  return (
    <main>
      <SolidNavyWaveHeader title={fields?.heroHeader} description={fields?.heroSubheader} />

      <section className="page-section">
        {fields?.introductionHeader ? (
          <h2 className="h2 text-center mb-8">{fields.introductionHeader}</h2>
        ) : null}
        {fields?.introductionBody ? (
          <p className="body whitespace-pre-line text-neutral-700 text-center mx-auto max-w-3xl mb-12">
            {fields.introductionBody}
          </p>
        ) : null}

        {accordionItems.length > 0 ? (
          <>
            <h2 className="eyebrow mb-4">Organization-Wide Policies</h2>
            <Accordion items={accordionItems} allowMultiple={false} defaultOpenIds={[]} />
          </>
        ) : null}
      </section>

      {gmccAccordionItems.length > 0 ? (
        <>
        <section className="page-section">
          <h2 className="eyebrow mb-4">Community Center Policies</h2>
          <Accordion items={gmccAccordionItems} allowMultiple={false} defaultOpenIds={[]} />
          </section>
        </>
      ) : null}

      {gmtcAccordionItems.length > 0 ? (
        <>
        <section className="page-section">
          <h2 className="eyebrow mb-4">Tennis Center Policies</h2>
          <Accordion items={gmtcAccordionItems} allowMultiple={false} defaultOpenIds={[]} />
          </section>
        </>
      ) : null}

      {gmcfcAccordionItems.length > 0 ? (
        <>
        <section className="page-section">
          <h2 className="eyebrow mb-4">Coleman Family Center Policies</h2>
          <Accordion items={gmcfcAccordionItems} allowMultiple={false} defaultOpenIds={[]} />
          </section>
        </>
      ) : null}

      {gmnfcAccordionItems.length > 0 ? (
        <>
        <section className="page-section">
          <h2 className="eyebrow mb-4">North Family Center Policies</h2>
          <Accordion items={gmnfcAccordionItems} allowMultiple={false} defaultOpenIds={[]} />
          </section>
        </>
      ) : null}

      {gmcurlcAccordionItems.length > 0 ? (
        <>
        <section className="page-section">
          <h2 className="eyebrow mb-4">Curling Center Policies</h2>
          <Accordion items={gmcurlcAccordionItems} allowMultiple={false} defaultOpenIds={[]} />
          </section>
        </>
      ) : null}

      {/* CONTACT SECTION */}
      <section className="page-section text-center">
        <h2 className="h2 text-gmcc-navy">{fields?.contactHeader}</h2>
        {fields?.contactSubheader ? (
          <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields?.contactSubheader}</p>
        ) : null}
        <JotFormLightboxButton />
      </section>
    </main>
  );
}
