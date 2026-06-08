// app/membership/page.tsx
import { Suspense } from "react";
import { acfFileHref, wpFetch } from "@/lib/wp";
import ExploreMembershipsClient, {
  Membership,
  Audience,
  ProgramArea,
} from "./exploreMembershipsClient";
import type { MembershipPageFields, SerializedAmenity } from "./exploreMembershipsClient";
import { fetchAmenitiesWithImages } from "@/lib/amenities";
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
        audienceFields {
          programAreas
        }
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
          autoDraftLink
          manualPayLink
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
            nodes {
              name
              slug
            }
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
              centersFields {
                amenities {
                  nodes {
                    name
                    slug
                  }
                }
              }
            }
          }
        }
        membershipsHeader
        membershipsDescription
        quizHeader
        quizDescription
        benefitsHeader
        benefitsDescription
        
        financialAssistanceHeader
        financialAssistanceSubheader
        financialAssistanceDescription
        financialAssistanceCtas {
          estimatorLabel
          applicationCtaLabel
          applicationPdf { node { sourceUrl mediaItemUrl title } }
        }
        contactHeader
        contactDescription

        showCurrentPromotion
        currentPromotion {
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

        healthy100Challenge {
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
      }
    }
  }
`;

function splitLines(val: unknown): string[] {
  return typeof val === "string"
    ? val.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
}

/**
 * ACF checkbox on audience taxonomy — WPGraphQL may return string[], a single string, or related objects.
 */
function normalizeAudienceProgramAreas(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === "string" && item.trim()) {
        out.push(item.trim());
        continue;
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        if (typeof o.slug === "string" && o.slug.trim()) {
          out.push(o.slug.trim());
          continue;
        }
        if (typeof o.name === "string" && o.name.trim()) {
          out.push(o.name.trim());
        }
      }
    }
    return out;
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed) || (parsed && typeof parsed === "object")) {
        return normalizeAudienceProgramAreas(parsed);
      }
    } catch {
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

function mapMembershipPayUrl(
  url: string | null | undefined,
  defaultLabel: string
): { url: string; label: string; target: string | null } | null {
  const trimmed = typeof url === "string" ? url.trim() : "";
  return trimmed ? { url: trimmed, label: defaultLabel, target: "_blank" } : null;
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
    autoDraftLink: mapMembershipPayUrl(f.autoDraftLink, "Auto Draft"),
    manualPayLink: mapMembershipPayUrl(f.manualPayLink, "Manual Pay"),
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

type MediaRef = {
  sourceUrl?: string | null;
  mediaItemUrl?: string | null;
  title?: string | null;
} | null;

/** Shape returned by WPGraphQL for ACF file fields (nested `node`) or a flat media object. */
type MediaFieldInput = { node?: MediaRef } | MediaRef | undefined;

function mapPageFields(wp: any): MembershipPageFields {
  const f = wp?.membershipPageFields ?? {};

  const centers =
    f.centers?.nodes?.map((n: any) => {
      const slug = (n?.slug as string) ?? "";
      const label = (n?.title as string) ?? "";
      const amenityNodes = n?.centersFields?.amenities?.nodes ?? [];
      const amenitySlugs = amenityNodes
        .map((an: any) => an?.slug as string)
        .filter(Boolean);
      return { slug, label, amenitySlugs };
    }).filter((c: any) => c.slug && c.label) ?? [];

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
    financialAssistanceHeader: (f.financialAssistanceHeader as string) ?? null,
    financialAssistanceSubheader: (f.financialAssistanceSubheader as string) ?? null,
    financialAssistanceDescription: (f.financialAssistanceDescription as string) ?? null,
    financialAssistanceCtas: f.financialAssistanceCtas
      ? {
          estimatorLabel: (f.financialAssistanceCtas.estimatorLabel as string) ?? "",
          applicationCtaLabel: (f.financialAssistanceCtas.applicationCtaLabel as string) ?? "",
          applicationPdf: acfFileHref(f.financialAssistanceCtas.applicationPdf as MediaFieldInput),
        }
      : null,
    contactHeader: (f.contactHeader as string) ?? null,
    contactDescription: (f.contactDescription as string) ?? null,
    showCurrentPromotion: (f.showCurrentPromotion as boolean) ?? false,
    currentPromotion: f.currentPromotion?.nodes?.[0] ?? null,
    campaign: f.campaign?.nodes?.[0] ?? null,
    healthy100Challenge: f.healthy100Challenge?.nodes?.[0] ?? null,
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
    data?.audiences?.nodes
      ?.map((n: any) => {
        const keys = normalizeAudienceProgramAreas(n?.audienceFields?.programAreas);
        return {
          name: n?.name as string,
          slug: n?.slug as string,
          ...(keys.length ? { quizProgramAreaKeys: keys } : {}),
        };
      })
      .filter((a: Audience) => a.name && a.slug) ?? [];

  const programAreas: ProgramArea[] =
    data?.programAreas?.nodes?.map((n: any) => ({
      name: n?.name as string,
      slug: n?.slug as string,
    })).filter(Boolean) ?? [];

  const memberships: Membership[] =
    data?.memberships?.nodes?.map(mapMembershipNode) ?? [];

  const fields = mapPageFields(pageData?.page);

  const fallbackCenters = [
    { slug: "community-center", label: "Community Center", amenitySlugs: [] as string[] },
    { slug: "tennis-center", label: "Tennis Center", amenitySlugs: [] as string[] },
    { slug: "coleman-family-center", label: "Coleman Family Center", amenitySlugs: [] as string[] },
    { slug: "north-family-center", label: "North Family Center", amenitySlugs: [] as string[] },
    { slug: "corporate-wellness", label: "Corporate Wellness", amenitySlugs: [] as string[] },
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

  const allAmenitySlugs = [
    ...new Set(fields.centers.flatMap((c) => c.amenitySlugs)),
  ];
  const amenitiesWithImages = await fetchAmenitiesWithImages(allAmenitySlugs);

  const serializedAmenities: SerializedAmenity[] = amenitiesWithImages.map((a) => ({
    name: a.name,
    slug: a.slug,
    description: a.description ?? null,
    relevantLink: a.relevantLink ?? null,
    linkLabel: a.linkLabel ?? null,
    isService: a.isService ?? false,
    isFeatured: a.isFeatured ?? false,
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
