// src/app/page.tsx
import { wpFetch } from "@/lib/wp";
import HeroSection from "./(home)/sections/hero";
import AboutSection from "./(home)/sections/about";
import TestimonialsSection from "./(home)/sections/testimonials";
import FeaturedCampaignSection from "./(home)/sections/featuredCampaign";
import ImpactSection from "./(home)/sections/impact";
import HistorySection from "./(home)/sections/history";
import CentersSection from "./(home)/sections/centers";
import NewsSection from "./(home)/sections/news";
import UtilityMenu from "@/components/nav/utilityMenu";

// ---- Types (match your query) ----
type GqlImage = { node?: { sourceUrl: string; altText?: string | null } | null };

type HomeData = {
  page: {
    title: string;
    uri: string;
    homepageFields?: {
      hero?: {
        heroHeadline?: string | null;
        heroSubheadline?: string | null;
        heroMedia?: GqlImage | null;
        heroPrimaryCtaLabel?: string | null;
        heroPrimaryCtaUrl?: string | null;
        heroSecondaryCtaLabel?: string | null;
        heroSecondaryCtaUrl?: string | null;
      } | null;

      aboutBlurb?: string | null;
      aboutImage?: GqlImage | null;

      campaignBanner?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          uri?: string | null;
          featuredImage?: GqlImage | null;
          campaignFields?: {
            headline?: string | null;
            body?: string | null;
            primaryCta?: { primaryCtaLabel?: string | null; primaryCtaUrl?: string | null } | null;
            secondaryCta?: { secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null } | null;
          } | null;
        }> | null;
      } | null;

      impact?: {
        impactHeader?: string | null;
        impactBody?: string | null;
        impactImage?: GqlImage | null;
        impactCta1?: string | null; // url only
        impactCta2?: string | null; // url only
        impactStats?: {
          stat1?: { statValue?: string | null; statLabel?: string | null } | null;
          stat2?: { statValue?: string | null; statLabel?: string | null } | null;
          stat3?: { statValue?: string | null; statLabel?: string | null } | null;
          stat4?: { statValue?: string | null; statLabel?: string | null } | null;
        } | null;
      } | null;

      historyTimeline?: {
        historyHeader?: string | null;
        historyDescription?: string | null;
        timelineItems?: {
          item1?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item2?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item3?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item4?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item5?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item6?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
        } | null;
      } | null;

      testimonials?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          testimonialFields?: {
            quote?: string | null;
            personName?: string | null;
            personContext?: string | null;
            photo?: GqlImage | null;
          } | null;
        }> | null;
      } | null;

      centers?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          uri?: string | null;
          featuredImage?: GqlImage | null;
          centersFields?: {
            address?: string | null;
            contactInfo?: { contactPhone?: string | null; contactEmail?: string | null } | null;
            map?: { latitude?: string | null; longitude?: string | null; zoom?: string | null } | null;
          } | null;
        }> | null;
      } | null;

      upcomingEvents?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          uri?: string | null;
          featuredImage?: GqlImage | null;
          eventFields?: { startDateTime?: string | null; endDateTime?: string | null } | null;
        }> | null;
      } | null;

      newsHighlights?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          uri?: string | null;
          date?: string | null;
          featuredImage?: GqlImage | null;
        }> | null;
      } | null;
    } | null;
  };
};

// ---- Helpers ----
function normalizeImpactStats(stats: HomeData["page"]["homepageFields"] extends infer H
  ? H extends { impact?: infer I }
    ? I extends { impactStats?: infer S }
      ? S
      : any
    : any
  : any) {
  const slots = ["stat1", "stat2", "stat3", "stat4"] as const;
  return slots
    .map((k) => (stats as any)?.[k])
    .filter(Boolean)
    .map((s: any) => ({ value: s?.statValue ?? "", label: s?.statLabel ?? "" }))
    .filter((s) => (s.value || "").trim() || (s.label || "").trim());
}

function normalizeTimelineItems(timelineItems: any) {
  const slots = ["item1", "item2", "item3", "item4", "item5", "item6"] as const;
  return slots
    .map((k) => timelineItems?.[k])
    .filter(Boolean)
    .map((it: any) => ({
      date: it?.date ?? "",
      title: it?.title ?? "",
      body: it?.body ?? "",
      imageUrl: it?.image?.node?.sourceUrl ?? null,
      imageAlt: it?.image?.node?.altText ?? "",
    }))
    .filter((it) => (it.date || "").trim() || (it.title || "").trim() || (it.body || "").trim());
}

function safeFirst<T>(arr: T[] | null | undefined) {
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

// ---- Query (your exact query text) ----
const HOME_QUERY = /* GraphQL */ `
query HomePage($uri: ID!) {
  page(id: $uri, idType: URI) {
    title
    uri

    homepageFields {
      hero {
        heroHeadline
        heroSubheadline
        heroMedia {
          node { sourceUrl altText }
        }
        heroPrimaryCtaLabel
        heroPrimaryCtaUrl
        heroSecondaryCtaLabel
        heroSecondaryCtaUrl
      }

      aboutBlurb
      aboutImage {
        node {
          sourceUrl
          altText
        }
      }

      campaignBanner {
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
            }
          }
        }
      }

      impact {
        impactHeader
        impactBody
        impactImage { node { sourceUrl altText } }
        impactCta1
        impactCta2

        impactStats {
          stat1 { statValue statLabel }
          stat2 { statValue statLabel }
          stat3 { statValue statLabel }
          stat4 { statValue statLabel }
        }
      }

      historyTimeline {
        historyHeader
        historyDescription
        timelineItems {
          item1 { date title body image { node { sourceUrl altText } } }
          item2 { date title body image { node { sourceUrl altText } } }
          item3 { date title body image { node { sourceUrl altText } } }
          item4 { date title body image { node { sourceUrl altText } } }
          item5 { date title body image { node { sourceUrl altText } } }
          item6 { date title body image { node { sourceUrl altText } } }
        }
      }

      testimonials {
        nodes {
          ... on Testimonial {
            id
            title
            testimonialFields {
              quote
              personName
              personContext
              photo { node { sourceUrl altText } }
            }
          }
        }
      }

      centers {
        nodes {
          ... on Center {
            id
            title
            uri
            featuredImage { node { sourceUrl altText } }
            centersFields {
              address
              contactInfo {
                contactPhone
                contactEmail
              }
              map {
                latitude
                longitude
                zoom
              }
            }
          }
        }
      }

      upcomingEvents {
        nodes {
          ... on Event {
            id
            title
            uri
            featuredImage { node { sourceUrl altText } }
            eventFields { startDateTime endDateTime }
          }
        }
      }

      newsHighlights {
        nodes {
          ... on News {
            id
            title
            uri
            date
            featuredImage { node { sourceUrl altText } }
          }
        }
      }
    }
  }
}
`;

export default async function HomePage() {
  const data = await wpFetch<HomeData>(HOME_QUERY, { uri: "/" });
  const f = data?.page?.homepageFields;

  const hero = f?.hero;
  const campaign = safeFirst(f?.campaignBanner?.nodes);
  const testimonials = f?.testimonials?.nodes ?? [];
  const centers = f?.centers?.nodes ?? [];
  const news = f?.newsHighlights?.nodes ?? [];

  const impactStats = normalizeImpactStats(f?.impact?.impactStats);
  const timeline = normalizeTimelineItems(f?.historyTimeline?.timelineItems);

  return (
    <main className="bg-white">

      <header>
        <div className="flex items-center justify-end">
          <UtilityMenu />
        </div>
      </header>
      
      <HeroSection
        headline={hero?.heroHeadline ?? "Serving Greater Midland for Over a Century"}
        subheadline={hero?.heroSubheadline ?? "Building healthier people, stronger families, and a more connected community."}
        imageUrl={hero?.heroMedia?.node?.sourceUrl ?? null}
        imageAlt={hero?.heroMedia?.node?.altText ?? ""}
        primaryCta={{
          title: hero?.heroPrimaryCtaLabel ?? "Explore Programs",
          url: hero?.heroPrimaryCtaUrl ?? "/programs",
        }}
      />

      <AboutSection
        eyebrow="About Us"
        heading="About Us"
        body={f?.aboutBlurb ?? ""}
        imageUrl={f?.aboutImage?.node?.sourceUrl ?? null}
        imageAlt={f?.aboutImage?.node?.altText ?? ""}
        cta={{ title: "Learn more about our mission", url: "/about" }}
      />
      
      <ImpactSection
        heading={f?.impact?.impactHeader ?? "Our Impact"}
        body={f?.impact?.impactBody ?? ""}
        stats={impactStats}
        imageUrl={f?.impact?.impactImage?.node?.sourceUrl ?? null}
        imageAlt={f?.impact?.impactImage?.node?.altText ?? ""}
        cta={f?.impact?.impactCta1 ? { title: "Get involved", url: f.impact.impactCta1 } : null}
      />

      <FeaturedCampaignSection campaign={campaign} />

      <TestimonialsSection
        heading="Testimonials"
        testimonials={testimonials}
      />

      <HistorySection
        heading={f?.historyTimeline?.historyHeader ?? "Our History"}
        intro={f?.historyTimeline?.historyDescription ?? ""}
        items={timeline}
      />

      <CentersSection heading="Centers" centers={centers} />

      <NewsSection heading="News" items={news} cta={{ title: "View all news", url: "/news" }} />
    </main>
  );
}
