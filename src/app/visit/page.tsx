import Link from "next/link";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import Accordion from "@/components/accordion";
import NavyWaveSection from "@/components/navyWaveSection";
import RichText from "@/components/richText";
import {
  asString,
  acfImageFromField,
  collectNumberedFaqs,
  resolveAcfLink,
  type FaqItem,
} from "@/lib/acf";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import AutoHeightScheduleIframe from "@/components/schedule/autoHeightScheduleIframe";
import TodayEventsGrid from "@/components/events/todayEventsGrid";
import { TODAY_ALL_CENTERS_SCHEDULE_EMBED_URL } from "@/lib/constants";
import { fetchTodaysEvents } from "@/lib/events/todayEvents";

/** Regenerate at most once per day; cron can trigger sooner via `/api/revalidate`. */
export const revalidate = 86400;

// ─── GraphQL fields ───────────────────────────────────────────────────────────

const PLAN_YOUR_VISIT_PAGE_FIELDS = `
  planYourVisitPageFields {
    offeringsOverviewHeader
    offeringCategoryCard1 {
      offeringCategoryIcon
      offeringCategoryHeader
      offeringCategorySubheader
      offerings {
        offeringName
        offeringLink
      }
    }
    offeringCategoryCard2 {
      offeringCategoryIcon
      offeringCategoryHeader
      offeringCategorySubheader
      offerings {
        offeringName
        offeringLink
      }
    }
    offeringCategoryCard3 {
      offeringCategoryIcon
      offeringCategoryHeader
      offeringCategorySubheader
      offerings {
        offeringName
        offeringLink
      }
    }
    offeringCategoryCard4 {
      offeringCategoryIcon
      offeringCategoryHeader
      offeringCategorySubheader
      offerings {
        offeringName
        offeringLink
      }
    }
    offeringCategoryCard5 {
      offeringCategoryIcon
      offeringCategoryHeader
      offeringCategorySubheader
      offerings {
        offeringName
        offeringLink
      }
    }
    offeringCategoryCard6 {
      offeringCategoryIcon
      offeringCategoryHeader
      offeringCategorySubheader
      offerings {
        offeringName
        offeringLink
      }
    }

    todaysScheduleHeader

    accessOptionsHeader
    accessOptionsSubheader
    dayPassCard {
      icon {
        node {
          sourceUrl
          altText
        }
      }
      badgeLabel
      title
      description
      howToGetIt
      details {
        bullet1
        bullet2
        bullet3
      }
    }
    guestPassCard {
      icon {
        node {
          sourceUrl
          altText
        }
      }
      badgeLabel
      title
      description
      howToGetIt
      details {
        bullet1
        bullet2
        bullet3
      }
    }
    freeTrialCard {
      icon {
        node {
          sourceUrl
          altText
        }
      }
      badgeLabel
      title
      description
      howToGetIt
      details {
        bullet1
        bullet2
        bullet3
      }
    }
    membershipCard {
      icon {
        node {
          sourceUrl
          altText
        }
      }
      badgeLabel
      title
      description
      howToGetIt
      details {
        bullet1
        bullet2
        bullet3
      }
    }
    contactPrompt

    sampleDaysHeader
    sampleDaysSubheader
    sampleDay1 {
      header
      subheader
      activity1 {
        name
        time
        location
        description
      }
      activity2 {
        name
        time
        location
        description
      }
      activity3 {
        name
        time
        location
        description
      }
      activity4 {
        name
        time
        location
        description
      }
    }
    sampleDay2 {
      header
      subheader
      activity1 {
        name
        time
        location
        description
      }
      activity2 {
        name
        time
        location
        description
      }
      activity3 {
        name
        time
        location
        description
      }
      activity4 {
        name
        time
        location
        description
      }
    }
    sampleDay3 {
      header
      subheader
      activity1 {
        name
        time
        location
        description
      }
      activity2 {
        name
        time
        location
        description
      }
      activity3 {
        name
        time
        location
        description
      }
      activity4 {
        name
        time
        location
        description
      }
    }
    allAccessMembershipPlug
    varyingScheduleDisclaimer

    faqsHeader
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
    contactHeader
    contactSubheader
  }
`;

// ─── Types & normalizers ──────────────────────────────────────────────────────

type OfferingRow = {
  offeringName?: string | null;
  offeringLink?: unknown;
};

type OfferingCategoryCard = {
  offeringCategoryIcon?: string | null;
  offeringCategoryHeader?: string | null;
  offeringCategorySubheader?: string | null;
  offerings?: OfferingRow[] | OfferingRow | null;
};

type AccessCardDetails = {
  bullet1?: string | null;
  bullet2?: string | null;
  bullet3?: string | null;
};

type AccessCardFields = {
  icon?: unknown;
  badgeLabel?: string | null;
  title?: string | null;
  description?: string | null;
  howToGetIt?: string | null;
  details?: AccessCardDetails | null;
};

type SampleActivity = {
  name?: string | null;
  time?: string | null;
  location?: string | null;
  description?: string | null;
};

type SampleDayFields = {
  header?: string | null;
  subheader?: string | null;
  activity1?: SampleActivity | null;
  activity2?: SampleActivity | null;
  activity3?: SampleActivity | null;
  activity4?: SampleActivity | null;
};

type PlanYourVisitPageFields = {
  offeringsOverviewHeader?: string | null;
  offeringCategoryCard1?: OfferingCategoryCard | null;
  offeringCategoryCard2?: OfferingCategoryCard | null;
  offeringCategoryCard3?: OfferingCategoryCard | null;
  offeringCategoryCard4?: OfferingCategoryCard | null;
  offeringCategoryCard5?: OfferingCategoryCard | null;
  offeringCategoryCard6?: OfferingCategoryCard | null;
  todaysScheduleHeader?: string | null;
  accessOptionsHeader?: string | null;
  accessOptionsSubheader?: string | null;
  dayPassCard?: AccessCardFields | null;
  guestPassCard?: AccessCardFields | null;
  freeTrialCard?: AccessCardFields | null;
  membershipCard?: AccessCardFields | null;
  contactPrompt?: string | null;
  sampleDaysHeader?: string | null;
  sampleDaysSubheader?: string | null;
  sampleDay1?: SampleDayFields | null;
  sampleDay2?: SampleDayFields | null;
  sampleDay3?: SampleDayFields | null;
  allAccessMembershipPlug?: string | null;
  varyingScheduleDisclaimer?: string | null;
  faqsHeader?: string | null;
  faq1?: FaqItem | null;
  faq2?: FaqItem | null;
  faq3?: FaqItem | null;
  contactHeader?: string | null;
  contactSubheader?: string | null;
};

type PlanYourVisitExtra = {
  planYourVisitPageFields?: PlanYourVisitPageFields | null;
};

const CATEGORY_COLORS = [
  "bg-gmcc-navy",
  "bg-gmcc-teal-dark",
  "bg-gmcc-green",
  "bg-gmcc-teal",
  "bg-gmcc-green-dark",
  "bg-gmcc-teal",
] as const;

const ACCESS_BADGE_CLASSES = [
  "badge-blue",
  "badge-teal",
  "badge-green",
  "badge-neutral",
] as const;

const SAMPLE_DAY_THEMES = [
  {
    accentClass: "bg-gmcc-navy",
    textClass: "text-gmcc-navy",
    borderClass: "border-gmcc-navy",
    bgLight: "bg-gmcc-navy/5",
  },
  {
    accentClass: "bg-gmcc-teal",
    textClass: "text-gmcc-teal-dark",
    borderClass: "border-gmcc-teal",
    bgLight: "bg-gmcc-teal-light/30",
  },
  {
    accentClass: "bg-gmcc-green",
    textClass: "text-gmcc-green-dark",
    borderClass: "border-gmcc-green",
    bgLight: "bg-gmcc-green-lightest/50",
  },
] as const;

const OFFERING_CATEGORY_KEYS = [
  "offeringCategoryCard1",
  "offeringCategoryCard2",
  "offeringCategoryCard3",
  "offeringCategoryCard4",
  "offeringCategoryCard5",
  "offeringCategoryCard6",
] as const;

function normalizeOfferings(offerings: OfferingCategoryCard["offerings"]) {
  const rows = Array.isArray(offerings) ? offerings : offerings ? [offerings] : [];
  return rows
    .map((row) => {
      const label = asString(row?.offeringName);
      const { url } = resolveAcfLink(row?.offeringLink);
      return { label, href: url || "#" };
    })
    .filter((row) => row.label);
}

function collectBullets(details: AccessCardDetails | null | undefined): string[] {
  if (!details) return [];
  return [details.bullet1, details.bullet2, details.bullet3]
    .map((b) => asString(b))
    .filter(Boolean);
}

function normalizeAccessCard(card: AccessCardFields | null | undefined, badgeClass: string) {
  if (!card) return null;
  const title = asString(card.title);
  const description = asString(card.description);
  const howToGetIt = asString(card.howToGetIt);
  const includes = collectBullets(card.details);
  if (!title && !description && !howToGetIt && includes.length === 0) return null;

  const iconImage = acfImageFromField(card.icon);

  return {
    iconUrl: iconImage?.url ?? null,
    iconAlt: iconImage?.alt ?? "",
    iconEmoji: iconImage ? "" : asString(card.icon),
    badgeLabel: asString(card.badgeLabel),
    badgeClass,
    title: title || "Access option",
    description,
    howToGetIt,
    includes,
  };
}

function collectSampleActivities(day: SampleDayFields | null | undefined) {
  if (!day) return [];
  return [day.activity1, day.activity2, day.activity3, day.activity4]
    .map((activity) => ({
      time: asString(activity?.time),
      activity: asString(activity?.name),
      center: asString(activity?.location),
      note: asString(activity?.description),
    }))
    .filter((stop) => stop.activity || stop.time);
}

function normalizeSampleDay(day: SampleDayFields | null | undefined, index: number) {
  if (!day) return null;
  const title = asString(day.header);
  const tagline = asString(day.subheader);
  const stops = collectSampleActivities(day);
  if (!title && !tagline && stops.length === 0) return null;

  const theme = SAMPLE_DAY_THEMES[index] ?? SAMPLE_DAY_THEMES[0];
  return {
    id: `sample-day-${index + 1}`,
    title: title || `Sample day ${index + 1}`,
    tagline,
    stops,
    ...theme,
  };
}

function renderRichOrPlain(html: string) {
  const trimmed = html.trim();
  if (!trimmed) return null;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return <RichText html={trimmed} />;
  }
  return <p className="body whitespace-pre-line">{trimmed}</p>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VisitPage() {
  const [page, todaysEvents] = await Promise.all([
    fetchPageWithHeroFields<PlanYourVisitExtra>("visit", PLAN_YOUR_VISIT_PAGE_FIELDS),
    fetchTodaysEvents({ fallbackImageUrl: "/images/VisitPhoto.png" }),
  ]);
  const hero = resolvePhotoWaveHeaderProps(page, "Plan Your Visit");
  const fields = page?.planYourVisitPageFields;

  const categories = OFFERING_CATEGORY_KEYS.map((key, index) => {
    const card = fields?.[key];
    if (!card) return null;
    const title = asString(card.offeringCategoryHeader);
    const description = asString(card.offeringCategorySubheader);
    const subcategories = normalizeOfferings(card.offerings);
    if (!title && !description && subcategories.length === 0) return null;

    return {
      id: key,
      icon: asString(card.offeringCategoryIcon),
      title: title || `Category ${index + 1}`,
      description,
      color: CATEGORY_COLORS[index] ?? CATEGORY_COLORS[0],
      subcategories,
    };
  }).filter((cat): cat is NonNullable<typeof cat> => cat != null);

  const accessOptions = [
    normalizeAccessCard(fields?.dayPassCard, ACCESS_BADGE_CLASSES[0]),
    normalizeAccessCard(fields?.guestPassCard, ACCESS_BADGE_CLASSES[1]),
    normalizeAccessCard(fields?.freeTrialCard, ACCESS_BADGE_CLASSES[2]),
    normalizeAccessCard(fields?.membershipCard, ACCESS_BADGE_CLASSES[3]),
  ].filter((opt): opt is NonNullable<typeof opt> => opt != null);

  const sampleDays = [fields?.sampleDay1, fields?.sampleDay2, fields?.sampleDay3]
    .map((day, index) => normalizeSampleDay(day, index))
    .filter((day): day is NonNullable<typeof day> => day != null);

  const faqItems = collectNumberedFaqs(fields, 3).map((item, index) => ({
    id: `faq-${index + 1}`,
    title: item.question,
    content: renderRichOrPlain(item.answer) ?? <p className="body">{item.answer}</p>,
  }));

  const offeringsHeader =
    asString(fields?.offeringsOverviewHeader) || "What Are You Looking For?";
  const todaysScheduleHeader =
    asString(fields?.todaysScheduleHeader) || "What\u2019s Happening Today?";
  const accessOptionsHeader =
    asString(fields?.accessOptionsHeader) || "Visiting For the Day?";
  const accessOptionsSubheader =
    asString(fields?.accessOptionsSubheader) ||
    "Choose the access option that best fits your visit.";
  const sampleDaysHeader =
    asString(fields?.sampleDaysHeader) || "Build Your Perfect Day";
  const sampleDaysSubheader =
    asString(fields?.sampleDaysSubheader) ||
    "Need inspiration? Here are three ways people spend a day at Greater Midland.";
  const allAccessMembershipPlug =
    asString(fields?.allAccessMembershipPlug) ||
    "Mix and match activities across all four centers \u2014 your Greater Midland All Access Membership covers them all.";
  const varyingScheduleDisclaimer = asString(fields?.varyingScheduleDisclaimer);
  const faqsHeader =
    asString(fields?.faqsHeader) || "FAQs for First-Time Visitors";
  const contactHeader = asString(fields?.contactHeader) || "Have Questions?";
  const contactSubheader = asString(fields?.contactSubheader) || "We're here to help.";
  const contactPrompt = asString(fields?.contactPrompt);

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl}
        ctas={hero.ctas}
        waveFillClassName="text-gmcc-navy"
        waveEdgeClassName="bg-gmcc-navy"
        flushBottom={true}
      />

      {/* ── Section 1: What Are You Looking For? ─────────────────────────── */}
      {categories.length > 0 && (
        <NavyWaveSection
          id="categories"
          topWave={false}
          fullBleed={false}
          bandClassName=""
          contentClassName="mx-auto max-w-6xl px-4 py-12"
        >
          <div className="mb-10 text-center">
            <h2 className="h2 text-white">{offeringsHeader}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.id} className="card flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {cat.icon ? (
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${cat.color}`}
                    >
                      {cat.icon}
                    </span>
                  ) : null}
                  <div>
                    <h3 className="h3">{cat.title}</h3>
                    {cat.description ? (
                      <p className="small mt-0.5">{cat.description}</p>
                    ) : null}
                  </div>
                </div>
                {cat.subcategories.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => (
                      <li key={`${cat.id}-${sub.label}`}>
                        <Link
                          href={sub.href}
                          className="inline-flex items-center gap-1 rounded-full bg-gmcc-grey-light px-3 py-1 text-sm font-medium text-gmcc-grey-dark transition-colors hover:bg-gmcc-navy hover:text-white"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </NavyWaveSection>
      )}

      {/* ── Section 2: What's Happening Today? ───────────────────────────── */}
      <section className="page-section" id="today">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10">
            <h2 className="h2 text-center">{todaysScheduleHeader}</h2>
          </div>

          <div className="gmcc-schedule-embed">
            <AutoHeightScheduleIframe
              id="gmcc-today-schedule"
              src={TODAY_ALL_CENTERS_SCHEDULE_EMBED_URL}
              title="Today's Schedule"
            />
          </div>

          <TodayEventsGrid
            events={todaysEvents}
            showCenter
          />
        </div>
      </section>

      {/* ── Section 3: Visiting For the Day? ─────────────────────────────── */}
      {accessOptions.length > 0 && (
        <NavyWaveSection
          id="access"
          fullBleed={false}
          className="section-gap"
          bandClassName="mt-[-2px] pt-0"
          contentClassName="mx-auto max-w-6xl px-4 pt-12 pb-4"
        >
          <h2 className="h2 text-white">{accessOptionsHeader}</h2>
          {accessOptionsSubheader ? (
            <p className="body mt-2 max-w-2xl text-neutral-200 mb-8">
              {accessOptionsSubheader}
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {accessOptions.map((opt) => (
              <div key={opt.title} className="card flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  {opt.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.iconUrl}
                      alt={opt.iconAlt}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : opt.iconEmoji ? (
                    <span className="text-3xl">{opt.iconEmoji}</span>
                  ) : (
                    <span />
                  )}
                  {opt.badgeLabel ? (
                    <span className={`badge ${opt.badgeClass}`}>{opt.badgeLabel}</span>
                  ) : null}
                </div>
                <div>
                  <h3 className="h3">{opt.title}</h3>
                </div>
                {opt.description ? <p className="body">{opt.description}</p> : null}
                {opt.howToGetIt ? (
                  <div>
                    <p className="eyebrow mb-1">How to get it</p>
                    <p className="small">{opt.howToGetIt}</p>
                  </div>
                ) : null}
                {opt.includes.length > 0 ? (
                  <ul className="space-y-1 border-t border-neutral-100 pt-3">
                    {opt.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 small">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-gmcc-green"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          <div className="body mt-12 text-center">
            {contactPrompt ? (
              <p className="text-neutral-200">{contactPrompt}</p>
            ) : (
              <p>
                Questions about access?{" "}
                <Link href="/contact" className="link text-gmcc-teal">
                  Contact us
                </Link>{" "}
                or ask at the Welcome Desk at any center.
              </p>
            )}
          </div>
        </NavyWaveSection>
      )}

      {/* ── Section 4: Build Your Perfect Day ────────────────────────────── */}
      {sampleDays.length > 0 && (
        <section className="page-section" id="perfect-day">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10">
              <h2 className="h2">{sampleDaysHeader}</h2>
              {sampleDaysSubheader ? (
                <p className="body mt-2">{sampleDaysSubheader}</p>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {sampleDays.map((day) => (
                <div
                  key={day.id}
                  className={`rounded-2xl border-2 ${day.borderClass} ${day.bgLight} p-6 flex flex-col gap-5`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className={`font-heading font-bold text-xl ${day.textClass}`}>
                        {day.title}
                      </h3>
                      {day.tagline ? <p className="small">{day.tagline}</p> : null}
                    </div>
                  </div>

                  <div className="relative">
                    <div
                      className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-neutral-400"
                      aria-hidden
                    />
                    <ol className="space-y-4">
                      {day.stops.map((stop, idx) => (
                        <li key={idx} className="pl-6 relative">
                          <span
                            className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${day.accentClass}`}
                          />
                          {stop.time ? (
                            <p
                              className={`text-xs font-semibold uppercase tracking-wide ${day.textClass}`}
                            >
                              {stop.time}
                            </p>
                          ) : null}
                          {stop.activity ? (
                            <p className="text-sm font-semibold text-neutral-700">
                              {stop.activity}
                            </p>
                          ) : null}
                          {stop.center ? (
                            <p className="text-xs text-neutral-500">{stop.center}</p>
                          ) : null}
                          {stop.note ? (
                            <p className="text-xs text-neutral-500 italic">{stop.note}</p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>

            {allAccessMembershipPlug ? (
              <p className="body mt-8 text-center text-neutral-700 whitespace-pre-line">
                {allAccessMembershipPlug}
              </p>
            ) : null}

            {varyingScheduleDisclaimer ? (
            <p className="text-xs italic mt-4 text-center text-neutral-600 whitespace-pre-line">
              {varyingScheduleDisclaimer}
            </p>
          ) : null}
          </div>
        </section>
      )}

      {/* ── Section 5: FAQs ───────────────────────────────────────────────── */}
      {faqItems.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 section-y" id="faqs">
          <div className="mb-8">
            <h2 className="h2 text-center">{faqsHeader}</h2>
          </div>
          <Accordion items={faqItems} allowMultiple />
        </section>
      )}

      {/* CONTACT SECTION */}
      <section className="page-section text-center">
        <h2 className="h2 text-gmcc-navy">{contactHeader}</h2>
        {contactSubheader ? (
          <p className="body mt-4 whitespace-pre-line text-neutral-700">{contactSubheader}</p>
        ) : null}
        <Link
          href="/contact"
          className="btn bg-gmcc-navy text-white hover:bg-gmcc-navy/80 mt-6 text-base px-8 py-3"
        >
          Contact Us
        </Link>
      </section>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/visit");
}
