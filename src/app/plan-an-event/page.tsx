import { wpFetch } from "@/lib/wp";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PlanAnEventClient from "./planAnEventClient";
import type {
  MaybeImage,
  PartyPackageData,
  PlanAnEventFields,
  RoomData,
} from "./planAnEventFields";
import { WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";

const PLAN_AN_EVENT_PAGE_QUERY = /* GraphQL */ `
  query PlanAnEventPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage {
        node { ${WP_MEDIA_IMAGE_FIELDS} }
      }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      planAnEventPageFields {
        section1Card {
          sectionHeader
          sectionDescription
          sectionImage {
            node { ${WP_MEDIA_IMAGE_FIELDS} }
          }
          buttonLabel
        }
        section2Card {
          sectionHeader
          sectionDescription
          sectionImage {
            node { ${WP_MEDIA_IMAGE_FIELDS} }
          }
          buttonLabel
        }
        section3Card {
          sectionHeader
          sectionDescription
          sectionImage {
            node { ${WP_MEDIA_IMAGE_FIELDS} }
          }
          buttonLabel
        }
        roomRentalResultsHeader
        roomRentalResultsBody
        birthdayPackagesBody
        allPackagesInclude
        sportsPackagesBody
        locationOfferingsHeader
        locationOfferingsBody
        offeringsByCenter {
          communityCenterOfferings
          tennisCenterOfferings
          curlingCenterOfferings
          colemanFamilyCenterOfferings
          northFamilyCenterOfferings
        }
        centerLogos {
          communityCenterLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
          tennisCenterLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
          curlingCenterLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
          colemanFamilyCenterLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
          northFamilyCenterLogo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
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
    rentableRooms(first: 100) {
      nodes {
        ... on RentableRoom {
          title
          slug
          rentableRoomFields {
            name
            description
            center {
              nodes {
                ... on Center {
                  title
                  slug
                }
              }
            }
            capacity
            price
            roomAmenities
            gallery {
              photos {
                node { ${WP_MEDIA_IMAGE_FIELDS} }
              }
            }
            interestFormLink
          }
        }
      }
    }
    partyPackages(first: 100) {
      nodes {
        ... on PartyPackage {
          title
          slug
          featuredImage {
            node { ${WP_MEDIA_IMAGE_FIELDS} }
          }
          partyPackageFields {
            name
            photo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
            description
            price
            center {
              nodes {
                ... on Center {
                  title
                  slug
                }
              }
            }
            partyType
            interestFormLink
          }
        }
      }
    }
  }
`;

export default async function PlanAnEventPage() {
  const data = await wpFetch<{
    page?: {
      title?: string | null;
      heroFields?: Record<string, unknown> | null;
      featuredImage?: MaybeImage;
      planAnEventPageFields?: PlanAnEventFields | null;
    } | null;
    rentableRooms?: { nodes?: RoomData[] | null } | null;
    partyPackages?: { nodes?: PartyPackageData[] | null } | null;
  }>(PLAN_AN_EVENT_PAGE_QUERY, { uri: "/plan-an-event/" });

  const page = data?.page ?? null;
  const fields = page?.planAnEventPageFields ?? null;
  const rooms = data?.rentableRooms?.nodes ?? [];
  const partyPackages = data?.partyPackages?.nodes ?? [];

  const heroProps = resolvePhotoWaveHeaderProps(page as Parameters<typeof resolvePhotoWaveHeaderProps>[0], "Plan an Event");

  return (
    <main>
      <PlanAnEventClient
        heroProps={heroProps}
        fields={fields}
        rooms={rooms}
        partyPackages={partyPackages}
      />
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/plan-an-event");
}
