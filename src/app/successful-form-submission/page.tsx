// src/app/successful-form-submission/page.tsx

import type { Metadata } from "next";
import { wpFetch } from "@/lib/wp";
import {
  mediaFocalPositionCss,
  WP_MEDIA_IMAGE_FIELDS,
  type MediaFocalPointFields,
} from "@/lib/mediaFocalPoint";

export const metadata: Metadata = {
  title: "Successful Form Submission",
  description: "Landing page for successful form submissions.",
  robots: { index: false, follow: true },
};

const PAGE_URI = "/successful-form-submission";

type GqlImage = {
  node?: ({ sourceUrl?: string | null; altText?: string | null } & MediaFocalPointFields) | null;
} | null;

type SuccessfulFormSubmissionPageFields = {
  header?: string | null;
  subheader?: string | null;
  successIcon?: GqlImage;
  returnButtonLinkLabel?: string | null;
  returnButtonLink?: string | null;
};

type SuccessfulFormSubmissionPageData = {
  page?: {
    title?: string | null;
    successfulFormSubmissionPageFields?: SuccessfulFormSubmissionPageFields | null;
  } | null;
};

const SUCCESSFUL_FORM_SUBMISSION_PAGE_QUERY = /* GraphQL */ `
  query SuccessfulFormSubmissionPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      successfulFormSubmissionPageFields {
        header
        subheader
        successIcon { node { ${WP_MEDIA_IMAGE_FIELDS} } }
        returnButtonLinkLabel
        returnButtonLink
      }
    }
  }
`;

/** The ACF group is not exposed in WPGraphQL yet, so fall back to static copy. */
async function getFields(): Promise<SuccessfulFormSubmissionPageFields | null> {
  try {
    const data = await wpFetch<SuccessfulFormSubmissionPageData>(
      SUCCESSFUL_FORM_SUBMISSION_PAGE_QUERY,
      { uri: PAGE_URI },
    );
    return data?.page?.successfulFormSubmissionPageFields ?? null;
  } catch (err) {
    console.error("Successful form submission page query failed:", err);
    return null;
  }
}

export default async function SuccessfulFormSubmissionPage() {
  const fields = await getFields();

  const header = fields?.header ?? "Successful Submission";
  const subheader =
    fields?.subheader ?? "Your submission has been received.";
  const returnButtonLink = fields?.returnButtonLink ?? "/";
  const returnButtonLinkLabel = fields?.returnButtonLinkLabel ?? "Return Home";
  const successIconUrl = fields?.successIcon?.node?.sourceUrl ?? null;

  return (
    <main className="mb-[-2rem]">
      <section className="page-section mt-12 text-center">

        <h1 className="h1">{header}</h1>
        <div className="flex my-8 justify-center">
          {successIconUrl ? (
            <img
              src={successIconUrl}
              alt={fields?.successIcon?.node?.altText ?? ""}
              className="h-24 w-24 object-contain"
            />
          ) : null}
        </div>

        {subheader ? (
          <p className="text-lg whitespace-pre-line text-neutral-700">{subheader}</p>
        ) : null}

        <div>
          <a href={returnButtonLink} className="btn btn-secondary mt-6">
            {returnButtonLinkLabel}
          </a>
        </div>
      </section>
    </main>
  );
}
