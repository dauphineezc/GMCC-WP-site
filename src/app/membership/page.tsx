// app/membership/page.tsx
import { wpFetch } from "@/lib/wp";
import ExploreMembershipsClient, {
  Membership,
  Audience,
  ProgramArea,
} from "./exploreMembershipsClient";

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
            annual
            joiningFee
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
      annual:
        typeof pricing.annual === "number" ? (pricing.annual as number) : null,
      joiningFee:
        typeof pricing.joiningFee === "number"
          ? (pricing.joiningFee as number)
          : null,
    },
    audience,
    programArea,
    // if you later want to show benefit bullets in the cards:
    benefits: splitLines(f.benefits),
  };
}

export default async function ExploreMembershipsPage() {
  const data = await wpFetch<any>(EXPLORE_MEMBERSHIPS_QUERY);

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

  // Center links now point directly to /membership/[center-slug]
  const centerLinks = [
    { slug: "community-center", label: "Community Center" },
    { slug: "tennis-center", label: "Tennis Center" },
    { slug: "north-family-center", label: "North Family Center" },
    { slug: "coleman-family-center", label: "Coleman Family Center" },
  ];

  return (
    <ExploreMembershipsClient
      centerLinks={centerLinks}
      audiences={audiences}
      programAreas={programAreas}
      memberships={memberships}
    />
  );
}