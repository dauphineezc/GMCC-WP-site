// src/app/get-involved/page.tsx
import HeaderImage from "@/components/headerImage";
import { wpFetch } from "@/lib/wp";
import GetInvolvedClient from "./getInvolvedClient";

const GET_INVOLVED_PAGE_QUERY = /* GraphQL */ `
query GetInvolvedPage($uri: ID!) {
  page(id: $uri, idType: URI) {
    id
    title
    slug

    getInvolvedPageFields {
      impactBlurb

      volunteerGroup {
        volunteerCardSummary
        volunteerLongDescription
        volunteerApplication
        volunteerImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }

      donateGroup {
        donateCardSummary
        donateLongDescription
        physicalDonationDescription
        physicalDonationList
        wishlistLink
        donationImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }

      sponsorGroup {
        sponsorCardSummary
        sponsorLongDescription

        raceSponsorship {
          raceSponsorshipSummary

          race1 {
            raceName
            raceDetails
          }
          race2 {
            raceName
            raceDetails
          }
          race3 {
            raceName
            raceDetails
          }
          race4 {
            raceName
            raceDetails
          }
          race5 {
            raceName
            raceDetails
          }

          raceSponsorshipApplication
          raceSponsorshipImage {
            node {
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
          }
        }

        leagueSponsorship {
          leagueSponsorshipDetails
          leagueSponsorshipApplication
          leagueSponsorshipImage {
            node {
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
          }
        }

        centerSponsorship {
          centerSponsorshipDetails
          centerSponsorshipApplication
          centerSponsorshipImage {
            node {
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
          }
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

type Race = { raceName?: string | null; raceDetails?: string | null } | null;

type GetInvolvedFields = {
  impactBlurb?: string | null;

  volunteerGroup?: {
    volunteerCardSummary?: string | null;
    volunteerLongDescription?: string | null;
    volunteerApplication?: string | null;
    volunteerImage?: MaybeImage;
  } | null;

  donateGroup?: {
    donateCardSummary?: string | null;
    donateLongDescription?: string | null;
    physicalDonationDescription?: string | null;
    physicalDonationList?: string | null;
    wishlistLink?: string | null;
    donationImage?: MaybeImage;
  } | null;

  sponsorGroup?: {
    sponsorCardSummary?: string | null;
    sponsorLongDescription?: string | null;

    raceSponsorship?: {
      raceSponsorshipSummary?: string | null;
      race1?: Race;
      race2?: Race;
      race3?: Race;
      race4?: Race;
      race5?: Race;
      raceSponsorshipApplication?: string | null;
      raceSponsorshipImage?: MaybeImage;
    } | null;

    leagueSponsorship?: {
      leagueSponsorshipDetails?: string | null;
      leagueSponsorshipApplication?: string | null;
      leagueSponsorshipImage?: MaybeImage;
    } | null;

    centerSponsorship?: {
      centerSponsorshipDetails?: string | null;
      centerSponsorshipApplication?: string | null;
      centerSponsorshipImage?: MaybeImage;
    } | null;
  } | null;
};

export default async function GetInvolvedPage() {
  // Your page slug/uri — adjust if your WP URI differs (e.g., "/get-involved/")
  const uri = "get-involved";

  const data = await wpFetch<{
    page?: {
      getInvolvedPageFields?: GetInvolvedFields | null;
      title?: string | null;
    } | null;
  }>(GET_INVOLVED_PAGE_QUERY, { uri });

  const fields = data?.page?.getInvolvedPageFields ?? null;

  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/GetInvolvedHeaderImage.png" alt="Get Involved" />
      </div>

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        <div>
          <h1 className="h1 text-gmcc-navy">{data?.page?.title ?? "Get Involved"}</h1>
        </div>

        <GetInvolvedClient fields={fields} />
      </div>
    </main>
  );
}
