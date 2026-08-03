import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps, WpPageWithHeroFields } from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";
import { asImageField, asString, collectGalleryPhotos, type ImageField } from "@/lib/acf";
import { WEBTRAC_REGISTRATION_URL } from "@/lib/constants";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { buildEventHref } from "@/lib/events/buildEventHref";
import { EVENT_SCHEDULE_GRAPHQL, getEventDateInfo } from "@/lib/events/eventSchedule";
import PhotoGallery from "@/components/photoGallery";
import SimpleCampaign, { SimpleCampaignData } from "@/components/simpleCampaign";
import NavyWaveSection from "@/components/navyWaveSection";

const TOURNAMENTS_PAGE_QUERY = /* GraphQL */ `
  query TournamentsPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      tournamentsPageFields {
        tournamentPartnersHeader
        tournamentPartnersBody
        tournamentPartners {
          tournamentPartner1 { logo { node { sourceUrl altText } } link }
          tournamentPartner2 { logo { node { sourceUrl altText } } link }
          tournamentPartner3 { logo { node { sourceUrl altText } } link }
          tournamentPartner4 { logo { node { sourceUrl altText } } link }
        }

        featuredTournament {
          nodes {
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

        inHouseTournamentsHeader
        inHouseTournamentsBody

        galleryHeader
        gallerySubheader
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

        contactHeader
        contactSubheader
      }
    }
  }
`;

const TOURNAMENTS_EVENTS_QUERY = /* GraphQL */ `
  query TournamentsEvents($first: Int!) {
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
          ${EVENT_SCHEDULE_GRAPHQL}
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

type TournamentEventWP = {
  id: string;
  slug: string;
  title?: string | null;
  featuredImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
  eventFields?: {
    summary?: string | null;
    eventSchedule?: unknown;
    registrationInformation?: { registrationLink?: string | null } | null;
    center?: { nodes?: { slug?: string | null; title?: string | null }[] | null } | null;
    audience?: { nodes?: { name?: string | null; slug?: string | null }[] | null } | null;
    eventType?: string | string[] | null;
  } | null;
};

type TournamentCard = {
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

function mapTournamentEvent(wp: TournamentEventWP, now: Date): TournamentCard {
  const f = wp.eventFields ?? {};
  const hero = wp.featuredImage?.node;
  const dateInfo = getEventDateInfo(f.eventSchedule, now);
  const isPast = dateInfo.hasSchedule ? dateInfo.isPast : false;
  return {
    id: wp.id,
    slug: wp.slug,
    title: wp.title ?? "",
    summary: f.summary ?? "",
    startDateTime: dateInfo.start,
    endDateTime: dateInfo.end,
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

function formatTournamentDate(start?: string | null, end?: string | null): string | null {
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

type PartnerField = {
  logo: ImageField;
  link: string;
};

type TournamentsPageFields = {
  tournamentPartnersHeader: string;
  tournamentPartnersBody: string;
  tournamentPartners: {
    tournamentPartner1: PartnerField;
    tournamentPartner2: PartnerField;
    tournamentPartner3: PartnerField;
    tournamentPartner4: PartnerField;
  };
  featuredTournament: SimpleCampaignData | null;
  inHouseTournamentsHeader: string;
  inHouseTournamentsBody: string;
  galleryHeader: string;
  gallerySubheader: string;
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
  contactHeader: string;
  contactSubheader: string;
};

function asPartnerField(value: unknown): PartnerField {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    logo: asImageField(raw.logo),
    link: asString(raw.link),
  };
}

function asFeaturedTournament(value: unknown): SimpleCampaignData | null {
  if (!value || typeof value !== "object") return null;
  const nodes = (value as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodes) || !nodes.length) return null;
  const raw = nodes[0] as Record<string, unknown>;
  if (!raw) return null;
  return raw as SimpleCampaignData;
}

function initializeTournamentsPageFields(raw: Record<string, unknown> | null | undefined): TournamentsPageFields {
  const f = raw ?? {};
  const gallery = (f.gallery as Record<string, unknown> | undefined) ?? {};
  const partners = (f.tournamentPartners as Record<string, unknown> | undefined) ?? {};

  return {
    tournamentPartnersHeader: asString(f.tournamentPartnersHeader),
    tournamentPartnersBody: asString(f.tournamentPartnersBody),
    tournamentPartners: {
      tournamentPartner1: asPartnerField(partners.tournamentPartner1),
      tournamentPartner2: asPartnerField(partners.tournamentPartner2),
      tournamentPartner3: asPartnerField(partners.tournamentPartner3),
      tournamentPartner4: asPartnerField(partners.tournamentPartner4),
    },
    featuredTournament: asFeaturedTournament(f.featuredTournament),
    inHouseTournamentsHeader: asString(f.inHouseTournamentsHeader),
    inHouseTournamentsBody: asString(f.inHouseTournamentsBody),
    galleryHeader: asString(f.galleryHeader),
    gallerySubheader: asString(f.gallerySubheader),
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
    contactHeader: asString(f.contactHeader),
    contactSubheader: asString(f.contactSubheader),
  };
}

export default async function TournamentsPage() {
  const [data, tournamentEventsData] = await Promise.all([
    wpFetch<{
      page?:
        | (WpPageWithHeroFields & {
            tournamentsPageFields?: Record<string, unknown> | null;
          })
        | null;
    }>(TOURNAMENTS_PAGE_QUERY, { uri: "/tournaments" }),
    wpFetch<{ events?: { nodes?: TournamentEventWP[] | null } | null }>(
      TOURNAMENTS_EVENTS_QUERY,
      { first: 20 },
    ),
  ]);

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Tournaments");
  const heroCtas = hero.ctas ?? [];

  const fields = initializeTournamentsPageFields(data?.page?.tournamentsPageFields);

  const now = new Date();
  const rawTournamentNodes = (tournamentEventsData?.events?.nodes ?? []).filter((wp) => {
    const et = wp.eventFields?.eventType;
    if (!et) return false;
    const types = Array.isArray(et) ? et : typeof et === "string" ? et.split("\n") : [];
    return types.some((t) => t.trim().toLowerCase() === "tournament");
  });
  const tournamentCards = rawTournamentNodes.map((wp) => mapTournamentEvent(wp, now));

  const upcomingTournaments = tournamentCards
    .filter((t) => !t.isPast)
    .sort((a, b) => {
      const da = a.startDateTime ? new Date(a.startDateTime).getTime() : Infinity;
      const db = b.startDateTime ? new Date(b.startDateTime).getTime() : Infinity;
      return da - db;
    });
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const pastTournaments = tournamentCards
    .filter((t) => {
      if (!t.isPast) return false;
      const date = t.startDateTime ? new Date(t.startDateTime) : null;
      return date ? date >= oneYearAgo : false;
    })
    .sort((a, b) => {
      const da = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const db = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return db - da;
    });
  const sortedTournaments = [...upcomingTournaments, ...pastTournaments];

  const tournamentPartners = [
    fields.tournamentPartners.tournamentPartner1,
    fields.tournamentPartners.tournamentPartner2,
    fields.tournamentPartners.tournamentPartner3,
    fields.tournamentPartners.tournamentPartner4,
  ].filter((p) => !!p.logo?.node?.sourceUrl);

  const galleryPhotos = collectGalleryPhotos(fields.gallery);

  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl}
        ctas={heroCtas.length ? heroCtas : undefined}
      />

      {/* TOURNAMENT PARTNERS */}
      {(fields.tournamentPartnersHeader || fields.tournamentPartnersBody || tournamentPartners.length > 0) ? (
        <section className="page-section">
          {fields.tournamentPartnersHeader ? (
            <h2 className="h2">{fields.tournamentPartnersHeader}</h2>
          ) : null}
          {fields.tournamentPartnersBody ? (
            <p className="body mt-2 text-neutral-700">{fields.tournamentPartnersBody}</p>
          ) : null}

          {tournamentPartners.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {tournamentPartners.map((partner, i) => {
                const logo = partner.logo?.node;
                const inner = (
                  <div className="flex h-24 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-neutral-100 transition hover:shadow-md">
                    <img
                      src={logo?.sourceUrl ?? ""}
                      alt={logo?.altText || `Tournament partner ${i + 1}`}
                      className="h-full w-full object-contain rounded-xl"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                );
                return partner.link ? (
                  <a
                    key={i}
                    href={partner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={i}>{inner}</div>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* FEATURED TOURNAMENT CAMPAIGN */}
      {fields.featuredTournament ? (
        <section className="page-section">
          <SimpleCampaign campaign={fields.featuredTournament} />
        </section>
      ) : null}

      {/* TOURNAMENT CARDS */}
      {sortedTournaments.length > 0 && (
        <NavyWaveSection id="browse-tournaments" splitTopWave>
          {fields.inHouseTournamentsHeader ? (
            <h2 className="h2 text-white">{fields.inHouseTournamentsHeader}</h2>
          ) : null}
          {fields.inHouseTournamentsBody ? (
            <p className="body mt-2 text-neutral-200">{fields.inHouseTournamentsBody}</p>
          ) : null}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedTournaments.map((tournament) => {
              const eventHref = buildEventHref(tournament.slug, tournament.startDateTime ?? "");
              const dateLabel = formatTournamentDate(tournament.startDateTime, tournament.endDateTime);

              return (
                <div
                  key={tournament.id}
                  className="group card card-hover relative flex flex-col overflow-hidden"
                >
                  {/* Hero image */}
                  <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                    {tournament.heroUrl && (
                      <img
                        src={tournament.heroUrl}
                        alt={tournament.heroAlt}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />

                    {tournament.isPast && (
                      <div className="absolute inset-x-0 top-0 flex items-center justify-center bg-gmcc-teal/85 py-2">
                        <span className="text-sm font-semibold uppercase tracking-wide text-white">
                          Tournament Completed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col min-h-0 mt-4">
                    <h3 className="font-heading text-lg font-medium leading-snug text-neutral-900 line-clamp-2 group-hover:text-gmcc-teal">
                      {tournament.title}
                    </h3>

                    {dateLabel && (
                      <span className="mt-2 badge badge-green w-fit">{dateLabel}</span>
                    )}

                    {tournament.centers.length > 0 && (
                      <p className="mt-2 badge badge-teal w-fit">
                        {tournament.centers.map((c) => c.title).join(" · ")}
                      </p>
                    )}

                    {tournament.summary && (
                      <p className="mt-3 mb-3 text-xs leading-6 text-neutral-600 line-clamp-3">
                        {tournament.summary}
                      </p>
                    )}

                    {/* Footer actions */}
                    <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                      {!tournament.isPast && tournament.registrationLink ? (
                        <a
                          href={tournament.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative z-10 btn btn-primary text-xs px-3 py-1.5"
                        >
                          Register
                        </a>
                      ) : (
                        <span />
                      )}

                      <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                        View →
                      </span>
                    </div>
                  </div>

                  {/* Stretched link covers the full card; Register sits above it via z-10 */}
                  <a href={eventHref} aria-label={tournament.title} className="card-stretched-link" />
                </div>
              );
            })}
          </div>
        </NavyWaveSection>
      )}

      {/* PHOTO GALLERY */}
      {galleryPhotos.length > 0 ? (
        <section className="page-section">
          {fields.galleryHeader ? <h2 className="h2">{fields.galleryHeader}</h2> : null}
          {fields.gallerySubheader ? <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.gallerySubheader}</p> : null}
          <PhotoGallery photos={galleryPhotos} />
        </section>
      ) : null}

      {/* CONTACT SECTION */}
      {(fields.contactHeader || fields.contactSubheader) ? (
        <section className="page-section text-center">
        {fields.contactHeader ? <h2 className="h2 text-gmcc-navy">{fields.contactHeader}</h2> : null}
        {fields.contactSubheader ? (
          <p className="body mt-4 whitespace-pre-line text-neutral-700">{fields.contactSubheader}</p>
        ) : null}
        <a
          href={WEBTRAC_REGISTRATION_URL}
          className="btn bg-gmcc-navy text-white hover:bg-gmcc-navy/80 mt-6 text-base px-8 py-3"
          >
          Contact Us
        </a>
      </section>
      ) : null}
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/tournaments");
}
