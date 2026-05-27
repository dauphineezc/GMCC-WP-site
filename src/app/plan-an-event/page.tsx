import { wpFetch } from "@/lib/wp";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PlanAnEventClient from "./planAnEventClient";

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
              photo1 {
                node {
                  sourceUrl
                  altText
                }
              }
              photo2 {
                node {
                  sourceUrl
                  altText
                }
              }
              photo3 {
                node {
                  sourceUrl
                  altText
                }
              }
              photo4 {
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

type WPImageNode = {
  sourceUrl?: string | null;
  altText?: string | null;
};

type MaybeImage = { node?: WPImageNode | null } | null;

type SectionCard = {
  sectionHeader?: string | null;
  sectionDescription?: string | null;
  sectionImage?: MaybeImage;
  buttonLabel?: string | null;
} | null;

type CenterRef = { title?: string | null; slug?: string | null };

export type RoomData = {
  title?: string | null;
  slug?: string | null;
  rentableRoomFields?: {
    name?: string | null;
    description?: string | null;
    center?: { nodes?: CenterRef[] | null } | null;
    capacity?: string | null;
    price?: string | null;
    roomAmenities?: string[] | string | null;
    gallery?: {
      photo1?: MaybeImage;
      photo2?: MaybeImage;
      photo3?: MaybeImage;
      photo4?: MaybeImage;
    } | null;
  } | null;
};

export type PartyPackageData = {
  title?: string | null;
  slug?: string | null;
  featuredImage?: MaybeImage;
  partyPackageFields?: {
    name?: string | null;
    photo?: MaybeImage;
    description?: string | null;
    price?: string | null;
    center?: { nodes?: CenterRef[] | null } | null;
    partyType?: string | string[] | null;
  } | null;
};

export type PlanAnEventFields = {
  section1Card?: SectionCard;
  section2Card?: SectionCard;
  section3Card?: SectionCard;
  roomRentalResultsHeader?: string | null;
  roomRentalResultsBody?: string | null;
  birthdayPackagesBody?: string | null;
  allPackagesInclude?: string | null;
  sportsPackagesBody?: string | null;
  locationOfferingsHeader?: string | null;
  locationOfferingsBody?: string | null;
  offeringsByCenter?: {
    communityCenterOfferings?: string | null;
    tennisCenterOfferings?: string | null;
    curlingCenterOfferings?: string | null;
    colemanFamilyCenterOfferings?: string | null;
    northFamilyCenterOfferings?: string | null;
  } | null;
  centerLogos?: {
    communityCenterLogo?: MaybeImage;
    tennisCenterLogo?: MaybeImage;
    curlingCenterLogo?: MaybeImage;
    colemanFamilyCenterLogo?: MaybeImage;
    northFamilyCenterLogo?: MaybeImage;
  } | null;
  faqs?: {
    faq1?: { question?: string | null; answer?: string | null } | null;
    faq2?: { question?: string | null; answer?: string | null } | null;
    faq3?: { question?: string | null; answer?: string | null } | null;
  } | null;
  contactHeader?: string | null;
  contactSubheader?: string | null;
};

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
