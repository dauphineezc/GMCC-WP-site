// src/app/page.tsx
import { wpFetch } from "@/lib/wp";
import { acfImageFromField } from "@/lib/acf";
import HeroSection from "./(home)/sections/hero";
import AboutSection from "./(home)/sections/about";
import ProgramsSection from "./(home)/sections/programs";
import TestimonialSection from "./(home)/sections/testimonial";
import FeaturedCampaignSection from "./(home)/sections/featuredCampaign";
import ImpactSection from "./(home)/sections/impact";
import HistorySection from "./(home)/sections/history";
import CentersSection from "./(home)/sections/centers";
import EventsSection from "./(home)/sections/events";
import { EVENT_SCHEDULE_GRAPHQL, selectNextUpcomingEvents } from "@/lib/events/eventSchedule";
import { buildEventHref } from "@/lib/events/buildEventHref";
import { formatEventBadgeDate } from "@/lib/events/formatEventDate";
import NewsSection from "./(home)/sections/news";
import UtilityMenu from "@/components/nav/utilityMenu";

/** Regenerate at most once per day; cron can trigger sooner via `/api/revalidate`. */
export const revalidate = 86400;

// ---- Types (match query) ----
type GqlImage = {
  node?: { sourceUrl?: string | null; mediaItemUrl?: string | null; altText?: string | null } | null;
};

type LinkedProgramPage = {
  uri?: string | null;
  featuredImage?: GqlImage | null;
  heroFields?: {
    heroImage?: GqlImage | null;
  } | null;
};

type HomeProgramSlot = {
  programPageLink?: { nodes?: LinkedProgramPage[] | null } | null;
  programLabel?: string | null;
  programCaption?: string | null;
  programImage?: GqlImage | null;
};

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
        program1?: HomeProgramSlot | null;
        program2?: HomeProgramSlot | null;
        program3?: HomeProgramSlot | null;
        program4?: HomeProgramSlot | null;
        program5?: HomeProgramSlot | null;
        program6?: HomeProgramSlot | null;
        program7?: HomeProgramSlot | null;
        program8?: HomeProgramSlot | null;
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
          item7?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
          item8?: { date?: string | null; title?: string | null; body?: string | null; image?: GqlImage | null } | null;
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
    ? P
    : Record<string, HomeProgramSlot | null | undefined> | null | undefined
  : Record<string, HomeProgramSlot | null | undefined> | null | undefined) {
  const slots = ["program1", "program2", "program3", "program4", "program5", "program6", "program7", "program8"] as const;

  return slots
    .map((k) => programs?.[k])
    .filter(Boolean)
    .map((p) => {
      const slot = p as HomeProgramSlot;
      const linkedPage = slot.programPageLink?.nodes?.[0];
      const rawLink = linkedPage?.uri;
      const href = typeof rawLink === "string" ? rawLink : "/programs";

      const label = (slot.programLabel ?? "").trim();
      const caption = (slot.programCaption ?? "").trim();
      const resolvedImage =
        acfImageFromField(slot.programImage, label) ??
        acfImageFromField(linkedPage?.heroFields?.heroImage, label) ??
        acfImageFromField(linkedPage?.featuredImage, label);

      return {
        href: href || "/programs",
        label,
        caption: caption || undefined,
        imageUrl: resolvedImage?.url ?? null,
        imageAlt: resolvedImage?.alt ?? "",
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

type RecentNewsData = {
  allNews?: {
    nodes?: Array<{
      id: string;
      title?: string | null;
      uri?: string | null;
      slug?: string | null;
      featuredImage?: GqlImage | null;
      newsFields?: { body?: string | null; publishDate?: string | null } | null;
    }> | null;
  } | null;
};

function toNewsDateValue(d?: string | null) {
  if (!d) return 0;
  if (/^\d{8}$/.test(d)) {
    const yyyy = Number(d.slice(0, 4));
    const mm = Number(d.slice(4, 6));
    const dd = Number(d.slice(6, 8));
    return new Date(yyyy, mm - 1, dd).valueOf();
  }
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

function getRecentNewsItems(data: RecentNewsData | null | undefined) {
  const raw = data?.allNews?.nodes ?? [];
  return [...raw]
    .sort(
      (a, b) =>
        toNewsDateValue(b.newsFields?.publishDate) - toNewsDateValue(a.newsFields?.publishDate)
    )
    .slice(0, 3)
    .map((n) => ({
      id: n.id,
      title: n.title ?? "",
      uri: n.uri ?? (n.slug ? `/news/${n.slug}` : ""),
      date: n.newsFields?.publishDate ?? "",
      newsFields: n.newsFields ?? {},
      featuredImage: n.featuredImage ?? null,
    }));
}

const RECENT_NEWS_QUERY = /* GraphQL */ `
  query RecentNews($first: Int!) {
    allNews(first: $first) {
      nodes {
        id
        title
        uri
        slug
        featuredImage { node { sourceUrl altText } }
        newsFields { body publishDate }
      }
    }
  }
`;

const UPCOMING_EVENTS_LIMIT = 4;
const UPCOMING_EVENTS_FETCH_SIZE = 100;

const UPCOMING_EVENTS_QUERY = /* GraphQL */ `
  query UpcomingEvents($first: Int!) {
    events(first: $first) {
      nodes {
        id
        slug
        title
        featuredImage { node { sourceUrl altText } }
        eventFields {
          summary
          ${EVENT_SCHEDULE_GRAPHQL}
        }
      }
    }
  }
`;

type UpcomingEventsData = {
  events?: {
    nodes?: Array<{
      id: string;
      slug: string;
      title?: string | null;
      featuredImage?: GqlImage | null;
      eventFields?: { summary?: string | null; eventSchedule?: unknown } | null;
    }> | null;
  } | null;
};

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
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
              altText
            }
          }
        }
        program2 {
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
              altText
            }
          }
        }
        program3 {
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
              altText
            }
          }
        }
        program4 {
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
              altText
            }
          }
        }
        program5 {
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
              altText
            }
          }
        }
        program6 {
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
              altText
            }
          }
        }
        program7 {
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
              altText
            }
          }
        }
        program8 {
          programPageLink {
            nodes {
              ... on Page {
                uri
                featuredImage { node { sourceUrl mediaItemUrl altText } }
                heroFields { heroImage { node { sourceUrl mediaItemUrl altText } } }
              }
            }
          }
          programLabel
          programCaption
          programImage {
            node {
              sourceUrl
              mediaItemUrl
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
          item7 { date title body image { node { sourceUrl altText } } }
          item8 { date title body image { node { sourceUrl altText } } }
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

      newsletterSubscriptionHeader
      newsletterSubscriptionSubtext
    }
  }
}
`;

export default async function HomePage() {
  const [data, recentNewsData, upcomingEventsData] = await Promise.all([
    wpFetch<HomeData>(HOME_QUERY, { uri: "/" }),
    wpFetch<RecentNewsData>(RECENT_NEWS_QUERY, { first: 50 }),
    wpFetch<UpcomingEventsData>(UPCOMING_EVENTS_QUERY, { first: UPCOMING_EVENTS_FETCH_SIZE }),
  ]);
  const f = data?.page?.homepageFields;

  const hero = f?.hero;
  const programs = normalizeProgramsCards(f?.programs);
  const campaign = safeFirst(f?.campaignBanner?.nodes);
  const testimonial = safeFirst(f?.testimonial?.nodes);
  const centers = f?.centers?.nodes ?? [];
  const corporateWellnessCentersCaption = f?.corporateWellnessCentersCaption;
  const corporateWellnessCentersImage = f?.corporateWellnessCentersImage;
  const news = getRecentNewsItems(recentNewsData);
  const upcomingEvents = selectNextUpcomingEvents(
    upcomingEventsData?.events?.nodes ?? [],
    UPCOMING_EVENTS_LIMIT
  );

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

      <EventsSection events={upcomingEvents.map(({ event, dateInfo }) => {
        const badge = formatEventBadgeDate(dateInfo.start);
        return {
          id: event.id,
          title: event.title ?? "",
          uri: buildEventHref(event.slug, dateInfo.start ?? ""),
          summary: event.eventFields?.summary ?? "",
          badgeDay: badge.day,
          badgeMonth: badge.month,
          imageUrl: event.featuredImage?.node?.sourceUrl ?? null,
          imageAlt: event.featuredImage?.node?.altText ?? "",
        };
      })} />

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

      <NewsSection heading="Latest News" items={news} cta={{ title: "View all news", url: "/news" }}
       newsletterSubscriptionHeader={f?.newsletterSubscriptionHeader ?? null}
       newsletterSubscriptionSubtext={f?.newsletterSubscriptionSubtext ?? null}
       />
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/");
}
