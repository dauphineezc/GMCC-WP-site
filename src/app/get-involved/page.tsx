// src/app/get-involved/page.tsx
import HeaderImage from "@/components/headerImage";
import { acfFileHref, wpFetch, type WpMediaFieldInput } from "@/lib/wp";
import GetInvolvedClient, { type DocLink, type GetInvolvedClientFields } from "./getInvolvedClient";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";

const GET_INVOLVED_PAGE_QUERY = /* GraphQL */ `
query GetInvolvedPage($uri: ID!) {
  page(id: $uri, idType: URI) {
    id
    title
    slug

    ${PAGE_HERO_FIELDS_GRAPHQL}
    getInvolvedPageFields {
      impactBlurb
      seeImpactButton {
        node {
          sourceUrl
          mediaItemUrl
          title
        }
      }

      volunteerGroup {
        volunteerCardSummary
        volunteerCardIcon {
          node { ${WP_MEDIA_IMAGE_FIELDS} }
        }
        volunteerLongDescription
        volunteerApplication
        volunteerImage {
          node {
            ${WP_MEDIA_IMAGE_FIELDS}
            mediaDetails { width height }
          }
        }
      }

      donateGroup {
        donateCardSummary
        donateCardIcon {
          node { ${WP_MEDIA_IMAGE_FIELDS} }
        }
        donateLongDescription
        physicalDonationDescription
        physicalDonationList
        wishlistLink
        donationImage {
          node {
            ${WP_MEDIA_IMAGE_FIELDS}
            mediaDetails { width height }
          }
        }
      }

      sponsorGroup {
        sponsorCardSummary
        sponsorCardIcon {
          node { ${WP_MEDIA_IMAGE_FIELDS} }
        }
        sponsorLongDescription

        sponsorImage {
          node {
            ${WP_MEDIA_IMAGE_FIELDS}
            mediaDetails { width height }
          }
        }
        sponsorApplication {
          node {
            sourceUrl
            mediaItemUrl
            title
          }
        }
        viewSponsorsPageCta {
          ctaLabel
          cta
        }
      }
    }
  }
}
`;

type WPImageNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
};

type MaybeImage = { node?: WPImageNode | null } | null;

type GetInvolvedFields = {
  heroFields?: {
    heroHeader?: string | null;
    heroSubheader?: string | null;
    heroImage?: MaybeImage;
  } | null;
  impactBlurb?: string | null;
  seeImpactButton?: WpMediaFieldInput | null;

  volunteerGroup?: {
    volunteerCardSummary?: string | null;
    volunteerCardIcon?: MaybeImage;
    volunteerLongDescription?: string | null;
    volunteerApplication?: string | null;
    volunteerImage?: MaybeImage;
  } | null;

  donateGroup?: {
    donateCardSummary?: string | null;
    donateCardIcon?: MaybeImage;
    donateLongDescription?: string | null;
    physicalDonationDescription?: string | null;
    physicalDonationList?: string | null;
    wishlistLink?: string | null;
    donationImage?: MaybeImage;
  } | null;

  sponsorGroup?: {
    sponsorCardSummary?: string | null;
    sponsorCardIcon?: MaybeImage;
    sponsorLongDescription?: string | null;
    sponsorImage?: MaybeImage;
    sponsorApplication?: WpMediaFieldInput | null;
    viewSponsorsPageCta?: {
      ctaLabel?: string | null;
      cta?: string | null;
    } | null;
  } | null;
};

function fileDocLink(field: WpMediaFieldInput | null): DocLink | null {
  const href = acfFileHref(field ?? undefined);
  if (!href) return null;
  const node = field && "node" in field ? field.node : null;
  return { label: node?.title?.trim() ?? "", href };
}

export default async function GetInvolvedPage() {
  // Your page slug/uri — adjust if your WP URI differs (e.g., "/get-involved/")
  const uri = "get-involved";

  const data = await wpFetch<{
    page?: {
      getInvolvedPageFields?: GetInvolvedFields | null;
      title?: string | null;
    } | null;
  }>(GET_INVOLVED_PAGE_QUERY, { uri });

  const raw = data?.page?.getInvolvedPageFields ?? null;
  const fields: GetInvolvedClientFields | null = raw
    ? {
        ...raw,
        seeImpactButton: fileDocLink(raw.seeImpactButton ?? null),
        sponsorGroup: raw.sponsorGroup
          ? { ...raw.sponsorGroup, sponsorApplication: fileDocLink(raw.sponsorGroup.sponsorApplication ?? null) }
          : null,
      }
    : null;
  const heroProps = resolvePhotoWaveHeaderProps(data?.page, "Get Involved");
  return (
    <main>
        <PhotoWaveHeader
          title={heroProps.title}
          subheader={heroProps.subheader ?? null}
          imageUrl={heroProps.imageUrl ?? null}
          imagePosition={heroProps.imagePosition}
          ctas={heroProps.ctas}
        />
        <GetInvolvedClient fields={fields} />
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/get-involved");
}
