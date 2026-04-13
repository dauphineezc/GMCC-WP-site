// app/membership/page.tsx
import { Suspense } from "react";
import { wpFetch } from "@/lib/wp";
import ExploreMembershipsClient, {
  Membership,
  Audience,
  ProgramArea,
} from "./exploreMembershipsClient";
import type { MembershipPageFields, SerializedAmenity } from "./exploreMembershipsClient";
import { extractAmenitySlugs, fetchAmenitiesWithImages } from "@/lib/amenities";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";

const EXPLORE_MEMBERSHIPS_QUERY = `
  query ExploreMemberships {
    audiences(first: 100) {
      nodes {
        name
        slug
      }
    }

    programAreas(first: 100) {
      nodes {
        name
        slug
      }
    }

    memberships(first: 100) {
      nodes {
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        membershipFields {
          summary
          benefits
          pricingTable {
            tier
            monthly
            annually
            joiningFee
            additionalPaymentSplit {
              frequency
              cost
            }
          }
          audience {
            nodes { name slug }
          }
          programArea {
            nodes { name slug }
          }
        }
      }
    }
  }
`;

const MEMBERSHIP_PAGE_QUERY = /* GraphQL */ `
  query MembershipPage {
    page(id: "membership", idType: URI) {
      id
      title
      slug
      membershipPageFields {
        quizCta {
          cta
          ctaLabel
        }
        centers {
          nodes {
            ... on Center {
              slug
              title
            }
          }
        }
        membershipsHeader
        membershipsDescription
        quizHeader
        quizDescription
        benefitsHeader
        benefitsDescription
        amenities {
          nodes {
            name
            slug
            ... on Amenity {
              amenitiesFields {
                amenityImage1 {
                  node {
                    sourceUrl
                    altText
                  }
                }
                center1 {
                  nodes {
                    ... on Center {
                      title
                      slug
                    }
                  }
                }
                relevantLink
                linkLabel
                isService
                additionalInformation
                additionalImage {
                  node {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        }
        financialAssistanceHeader
        financialAssistanceSubheader
        financialAssistanceDescription
        financialAssistanceCta {
          cta
          ctaLabel
        }
        contactHeader
        contactDescription

        campaign {
          nodes{
            ... on Campaign {
              id
              title
              uri
              featuredImage {
                node { sourceUrl altText }
              }
              campaignFields {
                headline
                body
                primaryCta { primaryCtaLabel primaryCtaUrl }
                secondaryCta { secondaryCtaLabel secondaryCtaUrl }
                backgroundColor
                textColor
                primaryCtaButtonColor
                secondaryCtaButtonColor
              }
            }
          }
        }
        footerPhoto {
          node { sourceUrl altText }
        }
      }
    }
  }
`;

function splitLines(val: unknown): string[] {
  return typeof val === "string"
    ? val.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
}

function mapMembershipNode(wp: any): Membership {
  const f = wp.membershipFields ?? {};
  const pricing = f.pricingTable ?? {};

  const audience =
    f.audience?.nodes?.map((n: any) => ({
      name: n?.name as string,
      slug: n?.slug as string,
    })).filter(Boolean) ?? [];

  const programArea =
    f.programArea?.nodes?.map((n: any) => ({
      name: n?.name as string,
      slug: n?.slug as string,
    })).filter(Boolean) ?? [];

  return {
    slug: wp.slug as string,
    title: wp.title as string,
    hero: wp.featuredImage?.node
      ? {
          url: wp.featuredImage.node.sourceUrl as string,
          alt: (wp.featuredImage.node.altText as string) ?? "",
        }
      : null,
    summary: (f.summary as string) ?? null,
    pricing: {
      tier: (pricing.tier as string) ?? null,
      monthly:
        typeof pricing.monthly === "number" ? (pricing.monthly as number) : null,
      annually:
        typeof pricing.annually === "number" ? (pricing.annually as number) : null,
      joiningFee:
        typeof pricing.joiningFee === "number"
          ? (pricing.joiningFee as number)
          : null,
      paymentSplit: pricing.additionalPaymentSplit
        ? {
            frequency: pricing.additionalPaymentSplit?.frequency as string,
            cost: typeof pricing.additionalPaymentSplit?.cost === "number" ? (pricing.additionalPaymentSplit?.cost as number) : null,
          }
        : null,
    },
    audience,
    programArea,
    benefits: splitLines(f.benefits),
  };
}

function mapPageFields(wp: any): MembershipPageFields {
  const f = wp?.membershipPageFields ?? {};

  const centers =
    f.centers?.nodes?.map((n: any) => ({
      slug: (n?.slug as string) ?? "",
      label: (n?.title as string) ?? "",
    })).filter((c: any) => c.slug && c.label) ?? [];

  const amenitySlugs: string[] = extractAmenitySlugs(f.amenities?.nodes);

  return {
    quizCta: f.quizCta?.cta && f.quizCta?.ctaLabel
      ? {
          url: (f.quizCta.cta as string) ?? "",
          label: (f.quizCta.ctaLabel as string) ?? "",
        }
      : null,
    centers,
    membershipsHeader: (f.membershipsHeader as string) ?? null,
    membershipsDescription: (f.membershipsDescription as string) ?? null,
    quizHeader: (f.quizHeader as string) ?? null,
    quizDescription: (f.quizDescription as string) ?? null,
    benefitsHeader: (f.benefitsHeader as string) ?? null,
    benefitsDescription: (f.benefitsDescription as string) ?? null,
    amenitySlugs,
    financialAssistanceHeader: (f.financialAssistanceHeader as string) ?? null,
    financialAssistanceSubheader: (f.financialAssistanceSubheader as string) ?? null,
    financialAssistanceDescription: (f.financialAssistanceDescription as string) ?? null,
    financialAssistanceCta: f.financialAssistanceCta
      ? {
          url: (f.financialAssistanceCta.cta as string) ?? "",
          label: (f.financialAssistanceCta.ctaLabel as string) ?? "",
        }
      : null,
    contactHeader: (f.contactHeader as string) ?? null,
    contactDescription: (f.contactDescription as string) ?? null,
    campaign: f.campaign?.nodes?.[0] ?? null,
    footerPhoto: f.footerPhoto?.node
      ? {
          url: f.footerPhoto.node.sourceUrl as string,
          alt: (f.footerPhoto.node.altText as string) ?? "",
        }
      : null,
  };
}

export default async function ExploreMembershipsPage() {
  const [heroPage, data, pageData] = await Promise.all([
    fetchPageWithHeroFields("membership"),
    wpFetch<any>(EXPLORE_MEMBERSHIPS_QUERY),
    wpFetch<any>(MEMBERSHIP_PAGE_QUERY),
  ]);

  const hero = resolvePhotoWaveHeaderProps(heroPage, "Membership");

  const audiences: Audience[] =
    data?.audiences?.nodes?.map((n: any) => ({
      name: n?.name as string,
      slug: n?.slug as string,
    })).filter(Boolean) ?? [];

  const programAreas: ProgramArea[] =
    data?.programAreas?.nodes?.map((n: any) => ({
      name: n?.name as string,
      slug: n?.slug as string,
    })).filter(Boolean) ?? [];

  const memberships: Membership[] =
    data?.memberships?.nodes?.map(mapMembershipNode) ?? [];

  const fields = mapPageFields(pageData?.page);

  const fallbackCenters = [
    { slug: "community-center", label: "Community Center" },
    { slug: "tennis-center", label: "Tennis Center" },
    { slug: "coleman-family-center", label: "Coleman Family Center" },
    { slug: "north-family-center", label: "North Family Center" },
    { slug: "corporate-wellness", label: "Corporate Wellness" },
  ];

  const sourceCenters = fields.centers.length > 0 ? fields.centers : fallbackCenters;
  const centerBySlug = new Map(sourceCenters.map((c) => [c.slug, c]));
  const centerOrder = [
    "community-center",
    "tennis-center",
    "coleman-family-center",
    "north-family-center",
    "corporate-wellness",
  ];

  const orderedCenters = centerOrder
    .map((slug) => centerBySlug.get(slug))
    .filter(Boolean) as typeof sourceCenters;

  const remainingCenters = sourceCenters.filter((c) => !centerOrder.includes(c.slug));

  const centerLinks = [...orderedCenters, ...remainingCenters];

  const amenitiesWithImages = await fetchAmenitiesWithImages(fields.amenitySlugs);

  const serializedAmenities: SerializedAmenity[] = amenitiesWithImages.map((a) => ({
    name: a.name,
    slug: a.slug,
    description: a.description ?? null,
    relevantLink: a.relevantLink ?? null,
    linkLabel: a.linkLabel ?? null,
    defaultImage: a.defaultImage,
    centerImageCandidates: a.centerImageCandidates.map((c) => ({
      centerSlug: c.centerSlug,
      image: c.image,
    })),
  }));

  return (
    <Suspense fallback={null}>
      <ExploreMembershipsClient
        centerLinks={centerLinks}
        audiences={audiences}
        programAreas={programAreas}
        memberships={memberships}
        fields={fields}
        amenities={serializedAmenities}
        heroTitle={hero.title}
        heroSubheader={hero.subheader}
        heroImageUrl={hero.imageUrl}
        heroCtas={hero.ctas}
      />
    </Suspense>
  );
}
