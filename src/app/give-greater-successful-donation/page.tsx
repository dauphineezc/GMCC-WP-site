// src/app/give-greater-successful-donation/page.tsx

import type { Metadata } from "next";
import { wpFetch } from "@/lib/wp";
import {
  mediaFocalPositionCss,
  WP_MEDIA_IMAGE_FIELDS,
  type MediaFocalPointFields,
} from "@/lib/mediaFocalPoint";

export const metadata: Metadata = {
  title: "Give Greater: Successful Donation",
  description: "Landing page for successful donations.",
  robots: { index: false, follow: true },
};

const PAGE_URI = "/give-greater-successful-donation";

type GqlImage = {
  node?: ({ sourceUrl?: string | null; altText?: string | null } & MediaFocalPointFields) | null;
} | null;

type GiveGreaterSuccessfulDonationPageFields = {
  header?: string | null;
  subheader?: string | null;
  successIcon?: GqlImage;
  emailReceiptNotice?: string | null;
  returnButtonLinkLabel?: string | null;
  returnButtonLink?: string | null;
  image1?: GqlImage;
  image2?: GqlImage;
  image3?: GqlImage;
};

type GiveGreaterSuccessfulDonationPageData = {
  page?: {
    title?: string | null;
    giveGreaterSuccessfulDonationPageFields?: GiveGreaterSuccessfulDonationPageFields | null;
  } | null;
};

const GIVE_GREATER_SUCCESSFUL_DONATION_PAGE_QUERY = /* GraphQL */ `
  query GiveGreaterSuccessfulDonationPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      giveGreaterSuccessfulDonationPageFields {
        header
        subheader
        successIcon { node { ${WP_MEDIA_IMAGE_FIELDS} } }
        emailReceiptNotice
        returnButtonLinkLabel
        returnButtonLink
        image1 { node { ${WP_MEDIA_IMAGE_FIELDS} } }
        image2 { node { ${WP_MEDIA_IMAGE_FIELDS} } }
        image3 { node { ${WP_MEDIA_IMAGE_FIELDS} } }
      }
    }
  }
`;

/** The ACF group is not exposed in WPGraphQL yet, so fall back to static copy. */
async function getFields(): Promise<GiveGreaterSuccessfulDonationPageFields | null> {
  try {
    const data = await wpFetch<GiveGreaterSuccessfulDonationPageData>(
      GIVE_GREATER_SUCCESSFUL_DONATION_PAGE_QUERY,
      { uri: PAGE_URI },
    );
    return data?.page?.giveGreaterSuccessfulDonationPageFields ?? null;
  } catch (err) {
    console.error("Give Greater successful donation page query failed:", err);
    return null;
  }
}

function GalleryImage({ image }: { image: GqlImage | undefined }) {
  const src = image?.node?.sourceUrl;
  if (!src) return null;
  return (
    <div className="aspect-4/3 overflow-hidden bg-neutral-200">
      <img
        src={src}
        alt={image?.node?.altText ?? ""}
        className="h-full w-full object-cover"
        style={{ objectPosition: mediaFocalPositionCss(image?.node) ?? "center" }}
      />
    </div>
  );
}

export default async function GiveGreaterSuccessfulDonationPage() {
  const fields = await getFields();

  const header = fields?.header ?? "Thank you for your gift!";
  const subheader =
    fields?.subheader ?? "Your donation helps us serve the Greater Midland community.";
  const emailReceiptNotice =
    fields?.emailReceiptNotice ?? "A receipt for your donation is on its way to your email inbox.";
  const returnButtonLink = fields?.returnButtonLink ?? "/";
  const returnButtonLinkLabel = fields?.returnButtonLinkLabel ?? "Return Home";

  const successIconUrl = fields?.successIcon?.node?.sourceUrl ?? null;
  const galleryImages = [fields?.image1, fields?.image2, fields?.image3].filter(
    (image) => !!image?.node?.sourceUrl,
  );

  return (
    <main className="mb-[-6rem]">
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

        {emailReceiptNotice ? (
          <p className="text-base mt-4 text-neutral-700">{emailReceiptNotice}</p>
        ) : null}

        <div>
          <a href={returnButtonLink} className="btn btn-secondary mt-6">
            {returnButtonLinkLabel}
          </a>
        </div>
      </section>

      {galleryImages.length ? (
        <section className="position-fixed bottom-0 left-0 right-0 mt-12">
          <div className="grid sm:grid-cols-3">
            {galleryImages.map((image, index) => (
              <GalleryImage key={image?.node?.sourceUrl ?? index} image={image} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
