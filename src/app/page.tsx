// src/app/page.tsx
import { wpFetch } from "@/lib/wp";

const HOMEPAGE_QUERY = `
query Homepage {
  page(id: "home", idType: URI) {
    id
    title
    slug

    homepageFields {
      hero {
        heroHeadline
        heroSubheadline
        heroMedia
        heroPrimaryCtaLabel
        heroPrimaryCtaUrl
        heroSecondaryCtaLabel
        heroSecondaryCtaUrl
      }

      featuredModules {
        featuredModule1 {
          fm1Enabled
          fm1Title
          fm1Body
          fm1LinkLabel
          fm1LinkUrl
          fm1Icon {
            node { sourceUrl altText }
          }
        }
        featuredModule2 {
          fm2Enabled
          fm2Title
          fm2Body
          fm2LinkLabel
          fm2LinkUrl
          fm2Icon {
            node { sourceUrl altText }
          }
        }
        featuredModule3 {
          fm3Enabled
          fm3Title
          fm3Body
          fm3LinkLabel
          fm3LinkUrl
          fm3Icon {
            node { sourceUrl altText }
          }
        }
      }

      featuredPrograms {
        mode
        audience { nodes { name slug } }
        programArea { nodes { name slug } }
        programs {
          nodes {
            ... on Program {
              slug
              title
              featuredImage {
                node { sourceUrl altText }
              }
              programFields {
                summary
                priceFrom
                offeringType
              }
            }
          }
        }
      }

      upcomingEvents {
        center {
          nodes {
            ... on Center { slug title }
          }
        }
        maxEvents
        events {
          nodes {
            ... on Event {
              slug
              title
              featuredImage { node { sourceUrl altText } }
              eventFields {
                summary
                startDateTime
                endDateTime
                registrationLink
                eventType
              }
            }
          }
        }
      }

      campaignBanner {
        nodes {
          ... on Campaign {
            slug
            title
            featuredImage { node { sourceUrl altText } }
            campaignFields {
              headline
              primaryCta {
                primaryCtaLabel
                primaryCtaUrl
              }
            }
          }
        }
      }

      testimonialCarousel {
        nodes {
          ... on Testimonial {
            slug
            title
            testimonialFields {
              quote
              personName
              personContext
            }
          }
        }
      }

      newsHighlights {
        nodes {
          ... on News {
            slug
            title
            featuredImage { node { sourceUrl altText } }
            newsFields { summary publishDate }
          }
        }
      }

      quickLinksSet {
        nodes {
          ... on QuickLinksSet {
            slug
            title
            quickLinksSetFields {
              description
              link1 {
                label
                url
                icon { node { sourceUrl altText } }
              }
            }
          }
        }
      }
    }
  }
}
`;

type AnyObj = Record<string, any>;

function splitLines(v: unknown): string[] {
  return typeof v === "string"
    ? v.split("\n").map(s => s.trim()).filter(Boolean)
    : [];
}

export default async function HomePage() {
  const data = await wpFetch<AnyObj>(HOMEPAGE_QUERY);
  const wp = data?.page;
  const f = wp?.homepageFields;

  if (!wp || !f) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        Homepage not configured yet.
      </main>
    );
  }

  /* ---------------------- HERO ---------------------- */
  const hero = f.hero ?? {};

  /* ------------------ FEATURED MODULES ------------------ */
  const fmRaw = f.featuredModules ?? {};
  const modules = [
    fmRaw.featuredModule1,
    fmRaw.featuredModule2,
    fmRaw.featuredModule3,
  ]
    .filter(Boolean)
    .filter((m: AnyObj) => m.fm1Enabled ?? m.fm2Enabled ?? m.fm3Enabled);

  /* ------------------ FEATURED PROGRAMS ------------------ */
  const fp = f.featuredPrograms ?? {};
  const featuredPrograms =
    fp.programs?.nodes?.filter(Boolean) ?? [];

  /* ------------------ UPCOMING EVENTS ------------------ */
  const ue = f.upcomingEvents ?? {};
  const upcomingEvents =
    ue.events?.nodes?.filter(Boolean) ?? [];

  /* ------------------ CAMPAIGN BANNER ------------------ */
  const campaign = f.campaignBanner ?? null;

  /* ------------------ TESTIMONIALS ------------------ */
  const testimonials =
    f.testimonialCarousel?.nodes?.filter(Boolean) ?? [];

  /* ------------------ NEWS ------------------ */
  const news =
    f.newsHighlights?.nodes?.filter(Boolean) ?? [];

  /* ------------------ QUICK LINKS ------------------ */
  const ql = f.quickLinksSet?.quickLinksFields ?? null;
  const quickLinks =
    ql?.links?.filter(Boolean) ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">

      {/* HERO */}
      <section className="grid gap-8 md:grid-cols-2 items-center">
        <div className="space-y-4">
          {hero.heroHeadline && (
            <h1 className="text-4xl font-semibold tracking-tight">
              {hero.heroHeadline}
            </h1>
          )}
          {hero.heroSubheadline && (
            <p className="text-neutral-600 whitespace-pre-line">
              {hero.heroSubheadline}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            {hero.heroPrimaryCtaUrl && hero.heroPrimaryCtaLabel && (
              <a
                href={hero.heroPrimaryCtaUrl}
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {hero.heroPrimaryCtaLabel}
              </a>
            )}
            {hero.heroSecondaryCtaUrl && hero.heroSecondaryCtaLabel && (
              <a
                href={hero.heroSecondaryCtaUrl}
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {hero.heroSecondaryCtaLabel}
              </a>
            )}
          </div>
        </div>

        {/* oEmbed media: store as URL; if it's a YouTube/Vimeo link you can iframe it */}
        {hero.heroMedia && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border bg-neutral-100">
            {/* simplest sandbox render */}
            <iframe
              src={hero.heroMedia}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="Hero media"
            />
          </div>
        )}
      </section>

      {/* CAMPAIGN BANNER */}
      {campaign && (
        <section className="rounded-2xl border bg-emerald-50 p-6 flex flex-col md:flex-row md:items-center gap-4">
          {campaign.featuredImage?.node?.sourceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.featuredImage.node.sourceUrl}
              alt={campaign.featuredImage.node.altText ?? ""}
              className="h-24 w-24 rounded-xl object-cover"
            />
          )}
          <div className="flex-1 space-y-1">
            <h2 className="text-lg font-semibold">{campaign.title}</h2>
            {campaign.campaignFields?.summary && (
              <p className="text-sm text-emerald-900/80">
                {campaign.campaignFields.summary}
              </p>
            )}
          </div>
          {campaign.campaignFields?.linkUrl && (
            <a
              href={campaign.campaignFields.linkUrl}
              className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              {campaign.campaignFields.linkLabel ?? "Learn more"}
            </a>
          )}
        </section>
      )}

      {/* FEATURED MODULES */}
      {modules.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Featured</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {modules.map((m: AnyObj, i: number) => {
              const enabled = m.fm1Enabled ?? m.fm2Enabled ?? m.fm3Enabled;
              if (!enabled) return null;

              const title = m.fm1Title ?? m.fm2Title ?? m.fm3Title;
              const body = m.fm1Body ?? m.fm2Body ?? m.fm3Body;
              const linkLabel = m.fm1LinkLabel ?? m.fm2LinkLabel ?? m.fm3LinkLabel;
              const linkUrl = m.fm1LinkUrl ?? m.fm2LinkUrl ?? m.fm3LinkUrl;
              const icon = m.fm1Icon ?? m.fm2Icon ?? m.fm3Icon;

              return (
                <article
                  key={title ?? i}
                  className="rounded-2xl border bg-white p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {icon?.node?.sourceUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={icon.node.sourceUrl}
                        alt={icon.node.altText ?? ""}
                        className="h-9 w-9 rounded-md object-cover"
                      />
                    )}
                    {title && <h3 className="font-semibold">{title}</h3>}
                  </div>
                  {body && (
                    <p className="text-sm text-neutral-600 whitespace-pre-line">
                      {body}
                    </p>
                  )}
                  {linkUrl && (
                    <a
                      href={linkUrl}
                      className="text-sm text-emerald-700 hover:underline"
                    >
                      {linkLabel ?? "View details"}
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURED PROGRAMS */}
      {featuredPrograms.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Featured programs</h2>

            {/* show query params you used (nice for sandbox validation) */}
            <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
              {(fp.audience?.nodes ?? []).map((t: AnyObj) => (
                <span key={t.slug} className="rounded-full bg-neutral-100 px-2 py-1">
                  {t.name}
                </span>
              ))}
              {(fp.programArea?.nodes ?? []).map((t: AnyObj) => (
                <span key={t.slug} className="rounded-full bg-neutral-100 px-2 py-1">
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featuredPrograms.map((p: AnyObj) => (
              <a
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                {p.featuredImage?.node?.sourceUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.featuredImage.node.sourceUrl}
                    alt={p.featuredImage.node.altText ?? ""}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                )}
                <div className="mt-3 space-y-1">
                  <h3 className="font-semibold group-hover:text-emerald-700">
                    {p.title}
                  </h3>
                  {p.programFields?.summary && (
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {p.programFields.summary}
                    </p>
                  )}
                  {p.programFields?.priceFrom != null && (
                    <p className="text-xs text-neutral-700">
                      From ${Number(p.programFields.priceFrom).toFixed(2)}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING EVENTS */}
      {upcomingEvents.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming events</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvents.slice(0, ue.maxEvents ?? 6).map((ev: AnyObj) => {
              const ef = ev.eventFields ?? {};
              const start = ef.startDateTime ? new Date(ef.startDateTime) : null;

              // NOTE: you’re using /events/yyyy/mm/slug routing.
              // We’ll compute yyyy/mm from startDateTime if present.
              const yyyy = start ? start.getFullYear() : "2025";
              const mm = start ? String(start.getMonth() + 1).padStart(2, "0") : "01";

              return (
                <a
                  key={ev.slug}
                  href={`/events/${yyyy}/${mm}/${ev.slug}`}
                  className="group rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  {ev.featuredImage?.node?.sourceUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.featuredImage.node.sourceUrl}
                      alt={ev.featuredImage.node.altText ?? ""}
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  )}
                  <div className="mt-3 space-y-1">
                    <h3 className="font-semibold group-hover:text-emerald-700">
                      {ev.title}
                    </h3>
                    {ef.summary && (
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {ef.summary}
                      </p>
                    )}
                    {start && (
                      <p className="text-xs text-neutral-700">
                        {start.toLocaleDateString()}{" "}
                        {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What members say</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t: AnyObj) => {
              const tf = t.testimonialFields ?? {};
              return (
                <figure
                  key={t.slug}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  {tf.quote && (
                    <blockquote className="text-sm text-neutral-700 whitespace-pre-line">
                      “{tf.quote}”
                    </blockquote>
                  )}
                  {(tf.authorName || tf.authorSubtitle) && (
                    <figcaption className="mt-3 text-xs text-neutral-500">
                      <div className="font-semibold text-neutral-800">
                        {tf.authorName}
                      </div>
                      {tf.authorSubtitle && <div>{tf.authorSubtitle}</div>}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* NEWS HIGHLIGHTS */}
      {news.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Latest news</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {news.map((n: AnyObj) => (
              <a
                key={n.slug}
                href={`/news/${n.slug}`}
                className="group rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                {n.featuredImage?.node?.sourceUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.featuredImage.node.sourceUrl}
                    alt={n.featuredImage.node.altText ?? ""}
                    className="h-36 w-full rounded-xl object-cover"
                  />
                )}
                <div className="mt-3 space-y-1">
                  <h3 className="font-semibold group-hover:text-emerald-700">
                    {n.title}
                  </h3>
                  {n.newsFields?.summary && (
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {n.newsFields.summary}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* QUICK LINKS */}
      {quickLinks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Quick links</h2>
          {ql?.description && (
            <p className="text-sm text-neutral-600">{ql.description}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {quickLinks.map((l: AnyObj, i: number) => (
              <a
                key={l.linkUrl ?? i}
                href={l.linkUrl}
                className="flex items-center gap-3 rounded-xl border bg-white p-3 text-sm hover:bg-neutral-50"
              >
                {l.linkIcon?.node?.sourceUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.linkIcon.node.sourceUrl}
                    alt={l.linkIcon.node.altText ?? ""}
                    className="h-7 w-7 rounded-md object-cover"
                  />
                )}
                <span className="font-medium">{l.linkLabel}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}