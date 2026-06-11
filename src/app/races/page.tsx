import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps, WpPageWithHeroFields } from "@/lib/pageHeroFields";
import { acfFileHref, wpFetch } from "@/lib/wp";
import {
  asImageField,
  asString,
  collectGalleryPhotos,
  isExternalHref,
  type ImageField,
  type MediaFieldInput,
} from "@/lib/acf";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { buildEventHref } from "@/lib/events/buildEventHref";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";
import PhotoGallery from "@/components/photoGallery";
import NavyWaveSection from "@/components/navyWaveSection";

const RACES_PAGE_QUERY = /* GraphQL */ `
  query RacesPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      racesPageFields {
        pdfRegistrationForm {
          node {
            sourceUrl
            mediaItemUrl
            title
          }
        }
        scheduleCard {
          header
          subheader
          schedulePdf {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
          cardIcon {
            node {
              sourceUrl
              altText
            }
          }
        }
        connectCard {
          header
          subheader
          linkLabel
          link
          cardIcon {
            node {
              sourceUrl
              altText
            }
          }
        }

        tripleChallenge {
          header
          body
          racesList
          raceLogo1 { node { sourceUrl altText } }
          raceLogo2 { node { sourceUrl altText } }
          raceLogo3 { node { sourceUrl altText } }
          primaryImage { node { sourceUrl altText } }
          ctaLabel
          cta
        }
        
        racesHeader
        racesSubheader
        dowRunWalkResults
        triKidsTryResults
        runTheRiverResults
        loonsPennantRaceResults

        volunteerCard {
          header
          body
          contactPrompt
          personOfContact {
            nodes {
              ... on StaffProfile {
                title
                staffProfilesFields {
                  title
                  email
                  phone
                }
              }
            }
          }
          ctaLabel
          cta
        }

        sponsorCard {
          header
          body
          contactPrompt
          personOfContact {
            nodes {
              ... on StaffProfile {
                title
                staffProfilesFields {
                  title
                  email
                  phone
                }
              }
            }
          }
          ctaLabel
          cta
          sponsorshipPdfLabel
          sponsorshipPdf {
            node {
            sourceUrl
              mediaItemUrl
              title
            }
          }
        }

        previousRacesHeader
        previousRacesBody
        gallery {
          photo1 { node { sourceUrl altText } }
          photo2 { node { sourceUrl altText } }
          photo3 { node { sourceUrl altText } }
          photo4 { node { sourceUrl altText } }
          photo5 { node { sourceUrl altText } }
          photo6 { node { sourceUrl altText } }
          photo7 { node { sourceUrl altText } }
          photo8 { node { sourceUrl altText } }
          photo9 { node { sourceUrl altText } }
        }
      
        runnersPromo {
          header
          body
          ctaLabel
          cta
          logo { node { sourceUrl altText } }
        }

        contactHeader
        contactSubheader
        raceDirectorContact {
          nodes {
            ... on StaffProfile {
              title
              staffProfilesFields {
                title
                email
                phone
              }
            }
          }
        }
      }
    }
  }
`;



const RACE_EVENTS_QUERY = /* GraphQL */ `
  query RaceEvents($first: Int!) {
    events(first: $first) {
      nodes {
        id
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        eventFields {
          summary
          startDateTime
          endDateTime
          registrationInformation {
            registrationLink
          }
          center {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
          audience {
            nodes {
              name
              slug
            }
          }
          eventType
        }
      }
    }
  }
`;

type RaceEventWP = {
  id: string;
  slug: string;
  title?: string | null;
  featuredImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
  eventFields?: {
    summary?: string | null;
    startDateTime?: string | null;
    endDateTime?: string | null;
    registrationInformation?: { registrationLink?: string | null } | null;
    center?: { nodes?: { slug?: string | null; title?: string | null }[] | null } | null;
    audience?: { nodes?: { name?: string | null; slug?: string | null }[] | null } | null;
    eventType?: string | string[] | null;
  } | null;
};

type RaceCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  startDateTime: string | null;
  endDateTime: string | null;
  heroUrl: string | null;
  heroAlt: string;
  centers: { slug: string; title: string }[];
  audience: { slug: string; name: string }[];
  registrationLink: string;
  isPast: boolean;
};

function mapRaceEvent(wp: RaceEventWP, now: Date): RaceCard {
  const f = wp.eventFields ?? {};
  const hero = wp.featuredImage?.node;
  const end = f.endDateTime ? new Date(f.endDateTime) : null;
  const start = f.startDateTime ? new Date(f.startDateTime) : null;
  const isPast = end ? end < now : start ? start < now : false;
  return {
    id: wp.id,
    slug: wp.slug,
    title: wp.title ?? "",
    summary: f.summary ?? "",
    startDateTime: f.startDateTime ?? null,
    endDateTime: f.endDateTime ?? null,
    heroUrl: hero?.sourceUrl ?? null,
    heroAlt: hero?.altText ?? "",
    centers:
      (f.center?.nodes ?? [])
        .filter((c) => c.slug && c.title)
        .map((c) => ({ slug: c.slug!, title: c.title! })),
    audience:
      (f.audience?.nodes ?? [])
        .filter((a) => a.slug && a.name)
        .map((a) => ({ slug: a.slug!, name: a.name! })),
    registrationLink: f.registrationInformation?.registrationLink ?? "",
    isPast,
  };
}

function formatRaceDate(start?: string | null, end?: string | null): string | null {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const date = startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!endDate) return `${date} • ${time}`;
  const endTime = endDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} • ${time}–${endTime}`;
}

type StaffNode = {
  title?: string | null;
  staffProfilesFields?: {
    title?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

type ContactField = {
  nodes?: StaffNode[] | null;
} | null;

type RacesPageFields = {
  pdfRegistrationForm: MediaFieldInput;
  scheduleCard: {
    header: string;
    subheader: string;
    schedulePdf: MediaFieldInput;
    cardIcon: ImageField;
  };
  connectCard: {
    header: string;
    subheader: string;
    linkLabel: string;
    link: string;
    cardIcon: ImageField;
  };
  tripleChallenge: {
    header: string;
    body: string;
    racesList: string;
    raceLogo1: ImageField;
    raceLogo2: ImageField;
    raceLogo3: ImageField;
    primaryImage: ImageField;
    ctaLabel: string;
    cta: string;
  };
  racesHeader: string;
  racesSubheader: string;
  dowRunWalkResults: string;
  triKidsTryResults: string;
  runTheRiverResults: string;
  loonsPennantRaceResults: string;
  volunteerCard: {
    header: string;
    body: string;
    contactPrompt: string;
    personOfContact: ContactField;
    ctaLabel: string;
    cta: string;
  };
  sponsorCard: {
    header: string;
    body: string;
    contactPrompt: string;
    personOfContact: ContactField;
    ctaLabel: string;
    cta: string;
    sponsorshipPdfLabel: string;
    sponsorshipPdf: MediaFieldInput;
  };
  previousRacesHeader: string;
  previousRacesBody: string;
  gallery: {
    photo1: ImageField;
    photo2: ImageField;
    photo3: ImageField;
    photo4: ImageField;
    photo5: ImageField;
    photo6: ImageField;
    photo7: ImageField;
    photo8: ImageField;
    photo9: ImageField;
  };
  runnersPromo: {
    header: string;
    body: string;
    ctaLabel: string;
    cta: string;
    logo: ImageField;
  };
  contactHeader: string;
  contactSubheader: string;
  raceDirectorContact: ContactField;
};

function asContactField(value: unknown): ContactField {
  if (!value || typeof value !== "object") return { nodes: [] };
  const nodes = (value as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodes)) return { nodes: [] };
  return {
    nodes: nodes.map((node) => {
      const record = (node && typeof node === "object" ? node : {}) as Record<string, unknown>;
      const staff = (record.staffProfilesFields && typeof record.staffProfilesFields === "object"
        ? record.staffProfilesFields
        : {}) as Record<string, unknown>;
      return {
        title: asString(record.title),
        staffProfilesFields: {
          title: asString(staff.title),
          email: asString(staff.email),
          phone: asString(staff.phone),
        },
      };
    }),
  };
}

function initializeRacesPageFields(raw: Record<string, unknown> | null | undefined): RacesPageFields {
  const f = raw ?? {};
  const scheduleCard = (f.scheduleCard as Record<string, unknown> | undefined) ?? {};
  const connectCard = (f.connectCard as Record<string, unknown> | undefined) ?? {};
  const tripleChallenge = (f.tripleChallenge as Record<string, unknown> | undefined) ?? {};
  const volunteerCard = (f.volunteerCard as Record<string, unknown> | undefined) ?? {};
  const sponsorCard = (f.sponsorCard as Record<string, unknown> | undefined) ?? {};
  const gallery = (f.gallery as Record<string, unknown> | undefined) ?? {};
  const runnersPromo = (f.runnersPromo as Record<string, unknown> | undefined) ?? {};

  return {
    pdfRegistrationForm: (f.pdfRegistrationForm as MediaFieldInput) ?? null,
    scheduleCard: {
      header: asString(scheduleCard.header),
      subheader: asString(scheduleCard.subheader),
      schedulePdf: (scheduleCard.schedulePdf as MediaFieldInput) ?? null,
      cardIcon: asImageField(scheduleCard.cardIcon),
    },
    connectCard: {
      header: asString(connectCard.header),
      subheader: asString(connectCard.subheader),
      linkLabel: asString(connectCard.linkLabel),
      link: asString(connectCard.link),
      cardIcon: asImageField(connectCard.cardIcon),
    },
    tripleChallenge: {
      header: asString(tripleChallenge.header),
      body: asString(tripleChallenge.body),
      racesList: asString(tripleChallenge.racesList),
      raceLogo1: asImageField(tripleChallenge.raceLogo1),
      raceLogo2: asImageField(tripleChallenge.raceLogo2),
      raceLogo3: asImageField(tripleChallenge.raceLogo3),
      primaryImage: asImageField(tripleChallenge.primaryImage),
      ctaLabel: asString(tripleChallenge.ctaLabel),
      cta: asString(tripleChallenge.cta),
    },
    racesHeader: asString(f.racesHeader),
    racesSubheader: asString(f.racesSubheader),
    dowRunWalkResults: asString(f.dowRunWalkResults),
    triKidsTryResults: asString(f.triKidsTryResults),
    runTheRiverResults: asString(f.runTheRiverResults),
    loonsPennantRaceResults: asString(f.loonsPennantRaceResults),
    volunteerCard: {
      header: asString(volunteerCard.header),
      body: asString(volunteerCard.body),
      contactPrompt: asString(volunteerCard.contactPrompt),
      personOfContact: asContactField(volunteerCard.personOfContact),
      ctaLabel: asString(volunteerCard.ctaLabel),
      cta: asString(volunteerCard.cta),
    },
    sponsorCard: {
      header: asString(sponsorCard.header),
      body: asString(sponsorCard.body),
      contactPrompt: asString(sponsorCard.contactPrompt),
      personOfContact: asContactField(sponsorCard.personOfContact),
      ctaLabel: asString(sponsorCard.ctaLabel),
      cta: asString(sponsorCard.cta),
      sponsorshipPdfLabel: asString(sponsorCard.sponsorshipPdfLabel),
      sponsorshipPdf: (sponsorCard.sponsorshipPdf as MediaFieldInput) ?? null,
    },
    previousRacesHeader: asString(f.previousRacesHeader),
    previousRacesBody: asString(f.previousRacesBody),
    gallery: {
      photo1: asImageField(gallery.photo1),
      photo2: asImageField(gallery.photo2),
      photo3: asImageField(gallery.photo3),
      photo4: asImageField(gallery.photo4),
      photo5: asImageField(gallery.photo5),
      photo6: asImageField(gallery.photo6),
      photo7: asImageField(gallery.photo7),
      photo8: asImageField(gallery.photo8),
      photo9: asImageField(gallery.photo9),
    },
    runnersPromo: {
      header: asString(runnersPromo.header),
      body: asString(runnersPromo.body),
      ctaLabel: asString(runnersPromo.ctaLabel),
      cta: asString(runnersPromo.cta),
      logo: asImageField(runnersPromo.logo),
    },
    contactHeader: asString(f.contactHeader),
    contactSubheader: asString(f.contactSubheader),
    raceDirectorContact: asContactField(f.raceDirectorContact),
  };
}

export default async function RacesPage() {
  const [data, raceEventsData] = await Promise.all([
    wpFetch<{
      page?:
        | (WpPageWithHeroFields & {
            racesPageFields?: Record<string, unknown> | null;
          })
        | null;
    }>(RACES_PAGE_QUERY, { uri: "/races" }),
    wpFetch<{ events?: { nodes?: RaceEventWP[] | null } | null }>(
      RACE_EVENTS_QUERY,
      { first: 20 },
    ),
  ]);

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Races");

  const fields = initializeRacesPageFields(data?.page?.racesPageFields);

  // Build the pdf registration form as a secondary hero CTA if available
  const pdfHeroSecondary = acfFileHref(fields.pdfRegistrationForm)
    ? { label: "Download Registration Form", url: acfFileHref(fields.pdfRegistrationForm), variant: "secondary" as const }
    : null;
  const heroCtas = [
    ...(hero.ctas ?? []),
    // Only add the pdf if no secondary CTA already came from the hero fields
    ...(!hero.secondaryCta && pdfHeroSecondary ? [pdfHeroSecondary] : []),
  ];
  const schedulePdfHref = acfFileHref(fields.scheduleCard.schedulePdf) || acfFileHref(fields.pdfRegistrationForm);
  const connectHref = fields.connectCard.link;
  const tripleChallengeHref = fields.tripleChallenge.cta;
  const tripleChallengeCtaLabel = fields.tripleChallenge.ctaLabel || "Take the Triple Challenge";
  const tripleChallengeLogos = [
    fields.tripleChallenge.raceLogo1,
    fields.tripleChallenge.raceLogo2,
    fields.tripleChallenge.raceLogo3,
  ].filter((logo) => !!logo?.node?.sourceUrl);
  const tripleChallengeBullets = fields.tripleChallenge.racesList
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[•\-\s]+/, "").trim())
    .filter(Boolean);

  const now = new Date();
  const rawRaceNodes = (raceEventsData?.events?.nodes ?? []).filter((wp) => {
    const et = wp.eventFields?.eventType;
    if (!et) return false;
    const types = Array.isArray(et) ? et : typeof et === "string" ? et.split("\n") : [];
    return types.some((t) => t.trim().toLowerCase() === "race");
  });
  const raceCards = rawRaceNodes.map((wp) => mapRaceEvent(wp, now));

  // Upcoming races sorted soonest-first; past races sorted most-recent-first, appended at end
  const upcomingRaces = raceCards
    .filter((r) => !r.isPast)
    .sort((a, b) => {
      const da = a.startDateTime ? new Date(a.startDateTime).getTime() : Infinity;
      const db = b.startDateTime ? new Date(b.startDateTime).getTime() : Infinity;
      return da - db;
    });
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const pastRaces = raceCards
    .filter((r) => {
      if (!r.isPast) return false;
      const date = r.startDateTime ? new Date(r.startDateTime) : null;
      return date ? date >= oneYearAgo : false;
    })
    .sort((a, b) => {
      const da = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const db = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return db - da;
    });
  const sortedRaces = [...upcomingRaces, ...pastRaces];

  // Map race slug to results URL from page fields
  const raceResultsMap: Record<string, string> = {
    "dow-run-walk": fields.dowRunWalkResults,
    "tri-kids-try": fields.triKidsTryResults,
    "run-the-river": fields.runTheRiverResults,
    "loons-pennant-race": fields.loonsPennantRaceResults,
  };
  function resultsUrlForRace(slug: string): string {
    // Try exact match first, then partial-match any key that appears in slug
    if (raceResultsMap[slug]) return raceResultsMap[slug];
    const matched = Object.entries(raceResultsMap).find(([key]) => slug.includes(key) || key.includes(slug));
    return matched ? matched[1] : "";
  }

  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} ctas={heroCtas.length ? heroCtas : undefined} />
      <section className="py-4">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          <article className="relative card card-hover bg-gmcc-blue-light/30 overflow-hidden p-8">
          {/* icon */}
          {fields.scheduleCard.cardIcon?.node?.sourceUrl ? (
            <img
              src={fields.scheduleCard.cardIcon.node.sourceUrl}
              alt={fields.scheduleCard.cardIcon.node.altText ?? "Schedule icon"}
              aria-hidden
              className="pointer-events-none absolute left-6 top-6 h-14 w-14"
            />
          ) : null}
            {fields.scheduleCard.header ? <h2 className="h2 text-center pt-4">{fields.scheduleCard.header}</h2> : null}
            {fields.scheduleCard.subheader ? (
              <p className="body mt-2 leading-6 text-neutral-700 text-center">{fields.scheduleCard.subheader}</p>
            ) : null}
            {schedulePdfHref ? (
              <div className="mt-6 flex justify-center">
                <a
                  href={schedulePdfHref}
                  className="btn btn-primary"
                  {...(isExternalHref(schedulePdfHref)
                    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                    : {})}
                >
                  Download Race Dates PDF
                </a>
              </div>
            ) : null}
          </article>

          <article className="relative card card-hover bg-gmcc-blue-light/30 overflow-hidden p-8">
            {/* icon */}
            {fields.connectCard.cardIcon?.node?.sourceUrl ? (
              <img
                src={fields.connectCard.cardIcon.node.sourceUrl}
                alt={fields.connectCard.cardIcon.node.altText ?? "Connect icon"}
                aria-hidden
                className="pointer-events-none absolute left-6 top-6 h-14 w-14"
              />
            ) : null}
            {fields.connectCard.header ? <h2 className="h2 text-center pt-4">{fields.connectCard.header}</h2> : null}
            {fields.connectCard.subheader ? (
              <p className="body mt-2 leading-6 text-neutral-700 text-center">{fields.connectCard.subheader}</p>
            ) : null}
            {connectHref ? (
              <div className="mt-6 flex justify-center">
                <a
                  href={connectHref}
                  className="btn btn-primary"
                  {...(isExternalHref(connectHref)
                    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                    : {})}
                >
                  {fields.connectCard.linkLabel || "Follow us"}
                </a>
              </div>
            ) : null}
          </article>
        </div>

        {(fields.tripleChallenge.header ||
          fields.tripleChallenge.body ||
          tripleChallengeBullets.length ||
          tripleChallengeLogos.length ||
          fields.tripleChallenge.primaryImage?.node?.sourceUrl) ? (
          <div className="mx-auto mt-12 max-w-6xl px-6">
            <section className="rounded-[1.75rem] bg-gmcc-navy p-6 text-white shadow-lg lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
                <div>
                  {fields.tripleChallenge.header ? (
                    <h2 className="font-heading text-3xl font-semibold leading-tight text-white">
                      {fields.tripleChallenge.header}
                    </h2>
                  ) : null}
                  {fields.tripleChallenge.body ? (
                    <p className="mt-4 text-base leading-7 text-white/95">{fields.tripleChallenge.body}</p>
                  ) : null}
                  {tripleChallengeBullets.length ? (
                    <ul className="mt-4 list-disc space-y-1 pl-5 text-base leading-7 text-white/95">
                      {tripleChallengeBullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {tripleChallengeHref ? (
                    <div className="mt-6 flex justify-center">
                      <a
                        href={tripleChallengeHref}
                        className="btn btn-tertiary"
                        {...(isExternalHref(tripleChallengeHref)
                          ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                          : {})}
                      >
                        {tripleChallengeCtaLabel}
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-4">
                  {tripleChallengeLogos.length ? (
                    <div className="grid grid-cols-3 gap-3">
                      {tripleChallengeLogos.map((logo, index) => (
                        <div
                          key={`${logo?.node?.sourceUrl ?? "logo"}-${index}`}
                          className="flex h-16 items-center justify-center overflow-hidden rounded-xl bg-white"
                        >
                          <img
                            src={logo?.node?.sourceUrl ?? ""}
                            alt={logo?.node?.altText || `Triple challenge logo ${index + 1}`}
                            className="h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {fields.tripleChallenge.primaryImage?.node?.sourceUrl ? (
                    <div className="overflow-hidden rounded-2xl">
                      <img
                        src={fields.tripleChallenge.primaryImage.node.sourceUrl}
                        alt={fields.tripleChallenge.primaryImage.node.altText || "Triple challenge race"}
                        className="h-[350px] w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ) : null}


      </section>
      {sortedRaces.length > 0 && (
        <section id="browse-races" className="page-section">
          {fields.racesHeader ? <h2 className="h2">{fields.racesHeader}</h2> : null}
          {fields.racesSubheader ? (
            <p className="body mt-2 text-neutral-700">{fields.racesSubheader}</p>
          ) : null}

          <div className={`mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${fields.racesHeader || fields.racesSubheader ? "" : ""}`}>
            {sortedRaces.map((race) => {
              const eventHref = buildEventHref(race.slug, race.startDateTime ?? "");
              const resultsUrl = resultsUrlForRace(race.slug);
              const dateLabel = formatRaceDate(race.startDateTime, race.endDateTime);

              return (
                <div
                  key={race.id}
                  className="group card card-hover relative flex flex-col overflow-hidden"
                >
                  {/* Hero image */}
                  <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                    {race.heroUrl && (
                      <img
                        src={race.heroUrl}
                        alt={race.heroAlt}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />

                    {/* Past race banner */}
                    {race.isPast && (
                      <div className="absolute inset-x-0 top-0 flex items-center justify-center bg-gmcc-teal/85 py-2">
                        <span className="text-sm font-semibold uppercase tracking-wide text-white">
                          Race Completed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col min-h-0 mt-4">
                    <h3 className="font-heading text-lg font-medium leading-snug text-neutral-900 line-clamp-1 group-hover:text-gmcc-teal">
                      {race.title}
                    </h3>

                    {dateLabel && (
                      <span className="mt-2 badge badge-green w-fit">
                        {dateLabel}
                      </span>
                    )}

                    {race.summary && (
                      <p className="mt-3 mb-3 text-xs leading-6 text-neutral-600 line-clamp-3">
                        {race.summary}
                      </p>
                    )}

                    {/* Footer actions */}
                    <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                      {race.isPast ? (
                        resultsUrl ? (
                          <a
                            href={resultsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 btn btn-secondary text-xs px-3 py-1.5"
                          >
                            View results
                          </a>
                        ) : (
                          <span />
                        )
                      ) : (
                        race.registrationLink ? (
                          <a
                            href={race.registrationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 btn btn-primary text-xs px-3 py-1.5"
                          >
                            Register
                          </a>
                        ) : (
                          <span />
                        )
                      )}

                      <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                        View →
                      </span>
                    </div>
                  </div>

                  {/* Stretched link covers the full card; footer action buttons sit above it via z-10 */}
                  <a
                    href={eventHref}
                    aria-label={race.title}
                    className="card-stretched-link"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}


      {(fields.volunteerCard || fields.sponsorCard) ? (
        <NavyWaveSection id="get-involved" contentClassName="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-2">
          {fields.sponsorCard ? (
            <div className="card card-hover p-8">
              {fields.sponsorCard.header || fields.sponsorCard.body ? (
                <div>
                  {fields.sponsorCard.header ? (
                    <h2 className="h2 text-gmcc-navy">{fields.sponsorCard.header}</h2>
                  ) : null}
                  {fields.sponsorCard.body ? (
                    <p className="body mt-4 mb-2 whitespace-pre-line text-neutral-700">
                      {fields.sponsorCard.body}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div
                className={`${fields.sponsorCard.contactPrompt || fields.sponsorCard.personOfContact || fields.sponsorCard.ctaLabel || fields.sponsorCard.cta ? "mt-4" : ""}`}
              >
                {fields.sponsorCard.contactPrompt || fields.sponsorCard.personOfContact?.nodes?.length ? (
                  <div className="body mt-4 text-neutral-700">
                    {fields.sponsorCard.contactPrompt ? (
                      <span>{fields.sponsorCard.contactPrompt} </span>
                    ) : null}
                    {fields.sponsorCard.personOfContact?.nodes?.map((node, i) => {
                      const sf = node.staffProfilesFields;
                      return (
                        <span key={i}>
                          <span className="font-medium">{node.title}</span>
                          {sf?.email || sf?.phone ? (
                            <span>
                              {" "}
                              at{" "}
                              {sf.email ? (
                                <a href={`mailto:${sf.email}`} className="link">
                                  {sf.email}
                                </a>
                              ) : null}
                              {sf.email && sf.phone ? <span> or </span> : null}
                              {sf.phone ? (
                                <a href={`tel:${sf.phone}`} className="link">
                                  {sf.phone}
                                </a>
                              ) : null}
                            </span>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
                <div className="mt-6 flex items-center justify-center gap-4 text-center">
                  <a
                    href={fields?.sponsorCard?.cta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-tertiary"
                  >
                    {fields?.sponsorCard?.ctaLabel}
                  </a>
                  {fields.sponsorCard.sponsorshipPdf ? (
                    <a
                      href={acfFileHref(fields.sponsorCard.sponsorshipPdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      {fields.sponsorCard.sponsorshipPdfLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {fields.volunteerCard ? (
            <div className="card card-hover p-8">
              {fields.volunteerCard.header || fields.volunteerCard.body ? (
                <div>
                  {fields.volunteerCard.header ? (
                    <h2 className="h2 text-gmcc-navy">{fields.volunteerCard.header}</h2>
                  ) : null}
                  {fields.volunteerCard.body ? (
                    <p className="body mt-4 mb-2 whitespace-pre-line text-neutral-700">
                      {fields.volunteerCard.body}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div
                className={`${fields.volunteerCard.contactPrompt || fields.volunteerCard.personOfContact || fields.volunteerCard.ctaLabel || fields.volunteerCard.cta ? "mt-4" : ""}`}
              >
                {fields.volunteerCard.contactPrompt || fields.volunteerCard.personOfContact?.nodes?.length ? (
                  <div className="body mt-4 text-neutral-700">
                    {fields.volunteerCard.contactPrompt ? (
                      <span>{fields.volunteerCard.contactPrompt} </span>
                    ) : null}
                    {fields.volunteerCard.personOfContact?.nodes?.map((node, i) => {
                      const sf = node.staffProfilesFields;
                      return (
                        <span key={i}>
                          <span className="font-medium">{node.title}</span>
                          {sf?.email || sf?.phone ? (
                            <span>
                              {" "}
                              at{" "}
                              {sf.email ? (
                                <a href={`mailto:${sf.email}`} className="link">
                                  {sf.email}
                                </a>
                              ) : null}
                              {sf.email && sf.phone ? <span> or </span> : null}
                              {sf.phone ? (
                                <a href={`tel:${sf.phone}`} className="link">
                                  {sf.phone}
                                </a>
                              ) : null}
                            </span>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
                <div className="mt-6 flex justify-center">
                  {fields.volunteerCard.cta ? (
                    <a
                      href={fields?.volunteerCard?.cta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-tertiary text-center justify-self-start"
                    >
                      {fields?.volunteerCard?.ctaLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </NavyWaveSection>
      ) : null}


      {/* PREVIOUS RACES */}
      {(() => {
        const galleryPhotos = collectGalleryPhotos(fields.gallery);

        if (!fields.previousRacesHeader && !fields.previousRacesBody && !galleryPhotos.length) {
          return null;
        }

        return (
          <section className="page-section">
            {fields.previousRacesHeader ? (
              <h2 className="h2">{fields.previousRacesHeader}</h2>
            ) : null}
            {fields.previousRacesBody ? (
              <p className="body mt-3 whitespace-pre-line text-neutral-700">{fields.previousRacesBody}</p>
            ) : null}

            {galleryPhotos.length ? (
              <PhotoGallery photos={galleryPhotos} />
            ) : null}
          </section>
        );
      })()}

      {/* RUNNERS PROMO */}
      {(fields.runnersPromo.header || fields.runnersPromo.body || fields.runnersPromo.logo?.node?.sourceUrl) ? (
        <NavyWaveSection
          id="runners-promo"
          splitTopWave
          bottomWave={false}
          bandClassName="pt-12 pb-14"
          contentClassName="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 md:flex-row md:gap-16"
        >
          {fields.runnersPromo.logo?.node?.sourceUrl ? (
            <div className="w-full shrink-0 md:w-110">
              <div className="flex items-center justify-center rounded-2xl bg-white p-8 shadow-lg">
                <img
                  src={fields.runnersPromo.logo.node.sourceUrl}
                  alt={fields.runnersPromo.logo.node.altText || "Partner logo"}
                  className="max-h-56 w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ) : null}

          <div className="flex-1">
            {fields.runnersPromo.header ? (
              <h2 className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                {fields.runnersPromo.header}
              </h2>
            ) : null}
            {fields.runnersPromo.body ? (
              <p className="mt-4 text-base leading-7 text-white/85 whitespace-pre-line">
                {fields.runnersPromo.body}
              </p>
            ) : null}
            {fields.runnersPromo.cta ? (
              <div className="mt-6">
                <a
                  href={fields.runnersPromo.cta}
                  className="btn btn-secondary"
                  {...(isExternalHref(fields.runnersPromo.cta)
                    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                    : {})}
                >
                  {fields.runnersPromo.ctaLabel || "Learn more"}
                </a>
              </div>
            ) : null}
          </div>
        </NavyWaveSection>
      ) : null}

      {/* CONTACT SECTION */}
      {(fields.contactHeader || fields.contactSubheader || fields.raceDirectorContact?.nodes?.length || fields.volunteerCard.personOfContact?.nodes?.length) ? (
        <section className="page-section">
          {fields.contactHeader ? (
            <h2 className="h2">{fields.contactHeader}</h2>
          ) : null}
          {fields.contactSubheader ? (
            <p className="body mt-3 text-neutral-700">{fields.contactSubheader}</p>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Race Director card */}
            {fields.raceDirectorContact?.nodes?.length ? (
              <div className="card card-hover p-6">
                <p className="text-sm font-bold text-gmcc-navy">For Questions about Races</p>
                <dl className="mt-3 space-y-1 text-sm text-neutral-800">
                  {fields.raceDirectorContact.nodes.map((node, i) => {
                    const sf = node.staffProfilesFields;
                    return (
                      <div key={i} className="space-y-1">
                        {node.title ? (
                          <div>
                            <span className="font-bold">
                              {sf?.title ? `${sf.title}: ` : "Race Director: "}
                            </span>
                            {node.title}
                          </div>
                        ) : null}
                        {sf?.email ? (
                          <div>
                            <span className="font-bold">Email: </span>
                            <a href={`mailto:${sf.email}`} className="text-gmcc-navy hover:underline">
                              {sf.email}
                            </a>
                          </div>
                        ) : null}
                        {sf?.phone ? (
                          <div>
                            <span className="font-bold">Phone: </span>
                            <a href={`tel:${sf.phone}`} className="text-gmcc-navy hover:underline">
                              {sf.phone}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </dl>
              </div>
            ) : null}

            {/* Volunteer contact card */}
            {fields.volunteerCard.personOfContact?.nodes?.length ? (
              <div className="card card-hover p-6">
                <p className="text-sm font-bold text-gmcc-navy">For Questions about Volunteering</p>
                <dl className="mt-3 space-y-1 text-sm text-neutral-800">
                  {fields.volunteerCard.personOfContact.nodes.map((node, i) => {
                    const sf = node.staffProfilesFields;
                    return (
                      <div key={i} className="space-y-1">
                        {node.title ? (
                          <div>
                            <span className="font-bold">Contact: </span>
                            {node.title}
                          </div>
                        ) : null}
                        {sf?.email ? (
                          <div>
                            <span className="font-bold">Email: </span>
                            <a href={`mailto:${sf.email}`} className="text-gmcc-navy hover:underline">
                              {sf.email}
                            </a>
                          </div>
                        ) : null}
                        {sf?.phone ? (
                          <div>
                            <span className="font-bold">Phone: </span>
                            <a href={`tel:${sf.phone}`} className="text-gmcc-navy hover:underline">
                              {sf.phone}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </dl>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}