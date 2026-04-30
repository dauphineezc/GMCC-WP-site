// src/app/page.tsx
import { wpFetch } from "@/lib/wp";
import HeroSection from "./(home)/sections/hero";
import AboutSection from "./(home)/sections/about";
import ProgramsSection from "./(home)/sections/programs";
import TestimonialSection from "./(home)/sections/testimonial";
import FeaturedCampaignSection from "./(home)/sections/featuredCampaign";
import ImpactSection from "./(home)/sections/impact";
import HistorySection from "./(home)/sections/history";
import CentersSection from "./(home)/sections/centers";
import EventsSection from "./(home)/sections/events";
import NewsSection from "./(home)/sections/news";
import UtilityMenu from "@/components/nav/utilityMenu";

// ---- Types (match query) ----
type GqlImage = { node?: { sourceUrl: string; altText?: string | null } | null };

type HomeData = {
  page: {
    title: string;
    uri: string;
    homepageFields?: {
      hero?: {
        heroHeadline?: string | null;
        heroSubheadline?: string | null;
        heroMedia?: {
          node?: {
            sourceUrl?: string | null;
            mediaItemUrl?: string | null;
            mimeType?: string | null;
          } | null;
        } | null;
        heroPrimaryCtaLabel?: string | null;
        heroPrimaryCtaUrl?: string | null;
        heroSecondaryCtaLabel?: string | null;
        heroSecondaryCtaUrl?: string | null;
      } | null;

      aboutHeader?: string | null;
      aboutBlurb?: string | null;
      aboutCtaLabel?: string | null;

      programs?: {
        program1?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
        program2?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
        program3?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
        program4?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
        program5?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
        program6?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
        program7?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
        program8?: {
          programPageLink?: string | null;
          programLabel?: string | null;
          programCaption?: string | null;
          programImage?: GqlImage | null;
        } | null;
      } | null;

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
            backgroundColor?: string | null;
            textColor?: string | null;
            primaryCtaButtonColor?: string | null;
            secondaryCtaButtonColor?: string | null;
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
          stat1?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
          stat2?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
          stat3?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
          stat4?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        } | null;
      } | null;

      historyTimeline?: {
        historyHeader?: string | null;
        timelineItems?: {
          item1?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item2?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item3?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item4?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item5?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item6?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
        } | null;
      } | null;

      testimonialHeader?: string | null;
      testimonial?: {
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
          } | null;
        }> | null;
      } | null;
      corporateWellnessCentersCaption?: string | null;
      corporateWellnessCentersImage?: GqlImage | null;

      upcomingEvents?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          uri?: string | null;
          featuredImage?: GqlImage | null;
          eventFields?: { startDateTime?: string | null; summary?: string | null } | null;
        }> | null;
      } | null;

      newsHighlights?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          uri?: string | null;
          date?: string | null;
          newsFields?: { body?: string | null } | null;
          featuredImage?: GqlImage | null;
        }> | null;
      } | null;
      newsletterSubscriptionHeader?: string | null;
      newsletterSubscriptionSubtext?: string | null;
    } | null;
  };
};


// ---- Helpers ----
type ProgramCard = {
  href: string;
  label: string;
  caption?: string;
  imageUrl: string | null;
  imageAlt: string;
};


function normalizeProgramsCards(programs: HomeData["page"]["homepageFields"] extends infer H
  ? H extends { programs?: infer P }
    ? P extends { program1?: infer P1; program2?: infer P2; program3?: infer P3; program4?: infer P4; program5?: infer P5; program6?: infer P6; program7?: infer P7; program8?: infer P8 }
      ? { program1: P1; program2: P2; program3: P3; program4: P4; program5: P5; program6: P6; program7: P7; program8: P8 }
      : any
    : any
  : any) {
  const slots = ["program1", "program2", "program3", "program4", "program5", "program6", "program7", "program8"] as const;

  return slots
    .map((k) => programs?.[k])
    .filter(Boolean)
    .map((p) => {
      // If programPageLink ever becomes a WPGraphQL ACF Link object later,
      // this keeps you safe.
      const rawLink = (p as any)?.programPageLink?.nodes?.[0]?.uri;
      const href =
        typeof rawLink === "string"
          ? rawLink
          : (rawLink?.url as string | undefined) ?? "/programs";

      const label = ((p as any)?.programLabel ?? "").trim();
      const caption = ((p as any)?.programCaption ?? "").trim();

      return {
        href: href || "/programs",
        label,
        caption: caption || undefined,
        imageUrl: (p as any)?.programImage?.node?.sourceUrl ?? null,
        imageAlt: (p as any)?.programImage?.node?.altText ?? "",
      } satisfies ProgramCard;
    })
    // Only keep cards with something meaningful to show
    .filter((p) => p.label || p.caption || p.imageUrl);
}

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
    .map((s: any) => ({ value: s?.statValue ?? "", label: s?.statLabel ?? "", context: s?.statContext ?? "" }))
    .filter((s) => (s.value || "").trim() || (s.label || "").trim() || (s.context || "").trim());
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
          node {
            sourceUrl
            mediaItemUrl
            mimeType
          }
        }
        heroPrimaryCtaLabel
        heroPrimaryCtaUrl
        heroSecondaryCtaLabel
        heroSecondaryCtaUrl
      }

      aboutHeader
      aboutBlurb
      aboutCtaLabel

      programs {
        program1 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
        }
        program2 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
        }
        program3 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
        }
        program4 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
        }
        program5 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
        }
        program6 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
        }
        program7 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
        }
        program8 {
          programPageLink { nodes { uri } }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              altText
            }
          }
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
              backgroundColor
              textColor
              primaryCtaButtonColor
              secondaryCtaButtonColor
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
          stat1 { statValue statLabel statContext }
          stat2 { statValue statLabel statContext }
          stat3 { statValue statLabel statContext }
          stat4 { statValue statLabel statContext }
        }
      }

      historyTimeline {
        historyHeader
        timelineItems {
          item1 { date title body image { node { sourceUrl altText } } }
          item2 { date title body image { node { sourceUrl altText } } }
          item3 { date title body image { node { sourceUrl altText } } }
          item4 { date title body image { node { sourceUrl altText } } }
          item5 { date title body image { node { sourceUrl altText } } }
          item6 { date title body image { node { sourceUrl altText } } }
        }
      }

      testimonialHeader
      testimonial {
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
            }
          }
        }
      }
      corporateWellnessCentersCaption
      corporateWellnessCentersImage { node { sourceUrl altText } }

      upcomingEvents {
        nodes {
          ... on Event {
            id
            title
            uri
            featuredImage { node { sourceUrl altText } }
            eventFields { startDateTime summary }
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
            newsFields { body }
          }
        }
      }

      newsletterSubscriptionHeader
      newsletterSubscriptionSubtext
    }
  }
}
`;

export default async function HomePage() {
  const data = await wpFetch<HomeData>(HOME_QUERY, { uri: "/" });
  const f = data?.page?.homepageFields;

  const hero = f?.hero;
  const programs = normalizeProgramsCards(f?.programs);
  const campaign = safeFirst(f?.campaignBanner?.nodes);
  const testimonial = safeFirst(f?.testimonial?.nodes);
  const centers = f?.centers?.nodes ?? [];
  const corporateWellnessCentersCaption = f?.corporateWellnessCentersCaption;
  const corporateWellnessCentersImage = f?.corporateWellnessCentersImage;
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
        mediaUrl={hero?.heroMedia?.node?.sourceUrl ?? hero?.heroMedia?.node?.mediaItemUrl ?? null}
        mediaMimeType={hero?.heroMedia?.node?.mimeType ?? null}
        primaryCta={{
          title: hero?.heroPrimaryCtaLabel ?? "Explore Programs",
          url: hero?.heroPrimaryCtaUrl ?? "/programs",
        }}
        secondaryCta={
          hero?.heroSecondaryCtaUrl
            ? { title: hero?.heroSecondaryCtaLabel ?? "Learn more", url: hero?.heroSecondaryCtaUrl }
            : null
        }
      />

      <AboutSection
        heading={f?.aboutHeader ?? "About Us"}
        body={f?.aboutBlurb ?? ""}
        cta={{ title: f?.aboutCtaLabel ?? "Learn more about our mission", url: "/about" }}
      />

      <ProgramsSection programs={programs} />

      <FeaturedCampaignSection campaign={campaign}/>

      <EventsSection events={f?.upcomingEvents?.nodes?.map((e) => ({
        id: e.id,
        title: e.title ?? "",
        uri: e.uri ?? "",
        date: e.eventFields?.startDateTime ?? "",
        summary: e.eventFields?.summary ?? "",
        featuredImage: e.featuredImage ?? null,
      }))} />

      <TestimonialSection
        heading={f?.testimonialHeader ?? "Testimonial"}
        testimonial={testimonial}
      />

      <ImpactSection
        heading={f?.impact?.impactHeader ?? "Our Impact"}
        body={f?.impact?.impactBody ?? ""}
        stats={impactStats}
        imageUrl={f?.impact?.impactImage?.node?.sourceUrl ?? null}
        imageAlt={f?.impact?.impactImage?.node?.altText ?? ""}
        cta={f?.impact?.impactCta1 ? { title: "Get involved", url: f.impact.impactCta1 } : null}
      />

      <HistorySection
        heading={f?.historyTimeline?.historyHeader ?? "Our History"}
        items={timeline}
      />

      <CentersSection 
        heading="Centers"
        centers={centers} 
        corporateWellnessCentersCaption={corporateWellnessCentersCaption} 
        corporateWellnessCentersImage={corporateWellnessCentersImage}
      />

      <NewsSection heading="Latest News" items={news.map((n) => ({
        id: n.id,
        title: n.title ?? "",
        uri: n.uri ?? "",
        date: n.date ?? "",
        newsFields: n.newsFields ?? {},
        featuredImage: n.featuredImage ?? null,
      }))} cta={{ title: "View all news", url: "/news" }}
       newsletterSubscriptionHeader={f?.newsletterSubscriptionHeader ?? null}
       newsletterSubscriptionSubtext={f?.newsletterSubscriptionSubtext ?? null}
       />
    </main>
  );
}
