import { wpFetch } from "@/lib/wp";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PlanAnEventClient from "./planAnEventClient";
import type {
  MaybeImage,
  PartyPackageData,
  PlanAnEventFields,
  RoomData,
} from "./planAnEventFields";

const PLAN_AN_EVENT_PAGE_QUERY = /* GraphQL */ `
  query PlanAnEventPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      planAnEventPageFields {
        section1Card {
          sectionHeader
          sectionDescription
          sectionImage {
            node {
              sourceUrl
              altText
            }
          }
          buttonLabel
        }
        section2Card {
          sectionHeader
          sectionDescription
          sectionImage {
            node {
              sourceUrl
              altText
            }
          }
          buttonLabel
        }
        section3Card {
          sectionHeader
          sectionDescription
          sectionImage {
            node {
              sourceUrl
              altText
            }
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
          communityCenterLogo { node { sourceUrl altText } }
          tennisCenterLogo { node { sourceUrl altText } }
          curlingCenterLogo { node { sourceUrl altText } }
          colemanFamilyCenterLogo { node { sourceUrl altText } }
          northFamilyCenterLogo { node { sourceUrl altText } }
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
                node {
                  sourceUrl
                  altText
                }
              }
            }
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
            node {
              sourceUrl
              altText
            }
          }
          partyPackageFields {
            name
            photo { node { sourceUrl altText } }
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
