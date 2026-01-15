// src/app/membership/[slug]/page.tsx
// Center-specific membership page with tiered (Community Center) or comparison (other centers) layout

import { wpFetch } from "@/lib/wp";
import {
  fetchAmenitiesWithImages,
  extractAmenitySlugs,
  type AmenityWithImage,
} from "@/lib/amenities";
import CenterMembershipsClient from "./centerMembershipsClient";

const CENTER_MEMBERSHIPS_QUERY = `
  query CenterMemberships($centerSlug: ID!) {
    center(id: $centerSlug, idType: SLUG) {
      id
      slug
      title
      centersFields {
        summary
        amenities {
          nodes {
            name
            slug
          }
        }
      }
    }

    memberships(first: 100) {
      nodes {
        slug
        title
        membershipFields {
          summary
          benefits
          pricingTable {
            tier
            monthly
            annual
            joiningFee
          }
          joinRenewLink
          audience {
            nodes { name slug }
          }
          centers {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
        }
      }
    }

    testimonials(first: 100) {
      nodes {
        slug
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        testimonialFields {
          quote
          personName
          personContext
          relatedCenters {
            nodes {
              ... on Center {
                slug
              }
            }
          }
        }
      }
    }
  }
`;

export type Membership = {
  slug: string;
  title: string;
  summary: string | null;
  benefits: string[];
  pricing: {
    tier: string | null;
    monthly: number | null;
    annual: number | null;
    joiningFee: number | null;
  };
  joinRenewLink: string | null;
  audience: { name: string; slug: string }[];
  centers: { slug: string; title: string }[];
};

export type Testimonial = {
  slug: string;
  image: { url: string; alt: string } | null;
  quote: string | null;
  personName: string | null;
  personContext: string | null;
};

// Re-export for use in client component
export type { AmenityWithImage };

function splitLines(val: unknown): string[] {
  return typeof val === "string"
    ? val.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
}

function mapMembership(wp: any): Membership {
  const f = wp.membershipFields ?? {};
  const pricing = f.pricingTable ?? {};

  return {
    slug: wp.slug as string,
    title: wp.title as string,
    summary: (f.summary as string) ?? null,
    benefits: splitLines(f.benefits),
    pricing: {
      tier: (pricing.tier as string) ?? null,
      monthly: pricing.monthly ?? null,
      annual: pricing.annual ?? null,
      joiningFee: pricing.joiningFee ?? null,
    },
    joinRenewLink: (f.joinRenewLink as string) ?? null,
    audience: f.audience?.nodes?.map((n: any) => ({
      name: n?.name as string,
      slug: n?.slug as string,
    })).filter(Boolean) ?? [],
    centers: f.centers?.nodes?.map((n: any) => ({
      slug: n?.slug as string,
      title: n?.title as string,
    })).filter(Boolean) ?? [],
  };
}

type CenterMembershipPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CenterMembershipPage({ params }: CenterMembershipPageProps) {
  const { slug: centerSlug } = await params;

  const data = await wpFetch<any>(CENTER_MEMBERSHIPS_QUERY, { centerSlug });
  const center = data?.center;

  if (!center) {
    return (
      <main className="mx-auto max-w-5xl px-4 section-y">
        <h1 className="h2">Center not found</h1>
        <p className="mt-2 body">
          The membership page you&apos;re looking for doesn&apos;t exist.
        </p>
      </main>
    );
  }

  const cf = center.centersFields ?? {};

  // Filter memberships for this center
  const allMemberships = data?.memberships?.nodes ?? [];
  const centerMemberships: Membership[] = allMemberships
    .filter((m: any) =>
      m.membershipFields?.centers?.nodes?.some(
        (c: any) => c?.slug === centerSlug
      )
    )
    .map(mapMembership);

  // Also get All Access memberships for non-community-center pages
  const allAccessMemberships: Membership[] = allMemberships
    .filter((m: any) => {
      const title = (m.title as string)?.toLowerCase() ?? "";
      return title.includes("all access");
    })
    .map(mapMembership);

  // Filter testimonials for this center
  const allTestimonials = data?.testimonials?.nodes ?? [];
  const centerTestimonials: Testimonial[] = allTestimonials
    .filter((t: any) =>
      t.testimonialFields?.relatedCenters?.nodes?.some(
        (c: any) => c?.slug === centerSlug
      )
    )
    .map((t: any) => ({
      slug: t.slug,
      image: t.featuredImage?.node
        ? { url: t.featuredImage.node.sourceUrl, alt: t.featuredImage.node.altText ?? "" }
        : null,
      quote: t.testimonialFields?.quote ?? null,
      personName: t.testimonialFields?.personName ?? null,
      personContext: t.testimonialFields?.personContext ?? null,
    }));

  // Fetch amenity details with images using shared utility
  const amenitySlugs = extractAmenitySlugs(cf.amenities?.nodes);
  const amenitiesWithImages = await fetchAmenitiesWithImages(amenitySlugs);

  // Check if this is the Community Center (special tiered layout)
  const isCommunityCenter = centerSlug === "community-center";

  return (
    <CenterMembershipsClient
      centerSlug={centerSlug}
      centerTitle={center.title}
      centerSummary={cf.summary ?? null}
      memberships={centerMemberships}
      allAccessMemberships={allAccessMemberships}
      amenitiesWithImages={amenitiesWithImages}
      testimonials={centerTestimonials}
      isCommunityCenter={isCommunityCenter}
    />
  );
}
