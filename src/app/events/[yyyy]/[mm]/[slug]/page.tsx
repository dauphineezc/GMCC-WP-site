// src/app/events/[yyyy]/[mm]/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import HeaderImage from "@/components/headerImage";
import { buildEventHref } from "@/lib/events/buildEventHref";

const EVENT_BY_SLUG_QUERY = `
  query EventBySlug($slug: ID!) {
    event(id: $slug, idType: SLUG) {
      title
      slug
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails { width height }
        }
      }
      eventFields {
        summary
        longDescription
        startDateTime
        endDateTime
        cost
        registrationLink
        eventType
        locationOverride

        center {
          nodes {
            ... on Center {
              slug
              title
            }
          }
        }
        programArea {
          nodes { name slug }
        }
        audience {
          nodes { name slug }
        }
        session {
          nodes { name slug }
        }

        contactName
        contactEmail
        contactPhone

        relatedEvents {
          nodes {
            ... on Event {
              title
              slug
              eventFields {
                summary
                startDateTime
              }
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

type EventPageProps = {
  params: Promise<{
    yyyy: string;
    mm: string;
    slug: string;
  }>;
};

export default async function EventPage(props: EventPageProps) {
  const { slug } = await props.params;

  const data = await wpFetch<any>(EVENT_BY_SLUG_QUERY, { slug });
  const event = data?.event;

  if (!event) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        Event not found.
      </main>
    );
  }

  const f = event.eventFields ?? {};

  const start = f.startDateTime ? new Date(f.startDateTime) : null;
  const end = f.endDateTime ? new Date(f.endDateTime) : null;

  const centers = (f.center?.nodes ?? []).map((c: any) => ({ title: c.title, slug: c.slug }));
  const programAreaNames = (f.programArea?.nodes ?? []).map((pa: any) => pa.name);
  const audienceNames = (f.audience?.nodes ?? []).map((a: any) => a.name);

  const dateRangeLabel =
    start && end
      ? `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })} – ${end.toLocaleDateString()} ${end.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`
      : start
      ? `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`
      : null;

  return (
    <main>

      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src={event.featuredImage?.node?.sourceUrl ?? ""} alt={event.featuredImage?.node?.altText ?? ""} />
      </div>

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">

      {/* HERO */}
      <section className="stack-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="stack-2">
          <h1 className="h1">{event.title}</h1>
          {f.summary && (
            <p className="body max-w-2xl">{f.summary}</p>
          )}
        </div>
      </div>


        {/* Chips row */}
        <div className="flex flex-wrap gap-2">
          {f.eventType?.map((ot: string) => (
            <span key={ot} className="badge badge-maroon">{ot}</span>
          ))}
          {/* Centers as clickable chips */}
          {centers.length > 0 &&
            centers.map((c: { title: string; slug: string }) => (
              <a key={c.slug} href={`/centers/${c.slug}`} className="badge badge-teal hover:opacity-80">
                {c.title}
              </a>
            ))}
          {programAreaNames.length > 0 && (
            <span className="badge badge-green">
              {programAreaNames.join(", ")}
            </span>
          )}
          {audienceNames.length > 0 && (
            <span className="badge badge-grey">Audience: {audienceNames.join(", ")}</span>
          )}
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="stack-8">
          {/* Description */}
          {f.longDescription && (
            <article className="prose prose-sm max-w-none sm:prose-base">
              {/* If you stored HTML, use dangerouslySetInnerHTML instead */}
              <p className="whitespace-pre-line">{f.longDescription}</p>
            </article>
          )}

          {/* Details card */}
          <h2 className="h2 mb-2">Event details</h2>
          <div className="card">
            <dl className="mt-3 stack-2 body">
              {dateRangeLabel && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">When</dt>
                  <dd className="text-right">
                    {dateRangeLabel}
                  </dd>
                </div>
              )}

            {/* Location */}
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Where</dt>
              <dd className="text-right">
                {f.locationOverride ? (
                  <>{f.locationOverride}</>
                ) : centers.length > 0 ? (
                  <>
                    {centers.map((c: { title: string; slug: string }) => c.title).join(", ")}
                  </>
                ) : (
                  <span className="text-neutral-500">
                    Location details coming soon.
                  </span>
                )}
              </dd>
            </div>

            {f.cost && (
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Cost</dt>
                <dd className="text-right">{f.cost}</dd>
              </div>
            )}

            {f.eventType && (
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Type</dt>
                <dd className="text-right">{f.eventType}</dd>
              </div>
            )}
          </dl>
          </div>

          {/* Contact card */}
          <h2 className="h2 mb-2">Contact</h2>
          {(f.contactName || f.contactEmail || f.contactPhone) && (
            <div className="card">
              <div className="stack-2 body">
                {f.contactName && <div>{f.contactName}</div>}
                {f.contactEmail && (
                  <div>
                    <a
                      href={`mailto:${f.contactEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {f.contactEmail}
                    </a>
                  </div>
                )}
                {f.contactPhone && (
                  <div>
                    <a
                      href={`tel:${f.contactPhone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {f.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:sticky lg:top-18 h-fit">
          {/* Registration card */}
          <div className="sticky top-8 card bg-gmcc-blue-light/30 border-gmcc-teal/40">
            <h2 className="h2 text-gmcc-navy">Ready to register?</h2>
            <p className="mt-1 small">
              You&apos;ll be taken to our secure registration system to
              complete signup.
            </p>

            {f.registrationLink ? (
              <a
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                href={f.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Register now
              </a>
            ) : (
              <p className="mt-3 text-xs text-emerald-900/70">
                Registration details will be posted soon.
              </p>
            )}
            <br />
            <br />
            <a href={``} className="link body block text-sm">➜ Explore similar events</a>
          </div>
        </aside>
      </section>

      {f.relatedEvents?.nodes && f.relatedEvents.nodes.length > 0 && (
        <section className="stack-4">
          <h2 className="h2 mb-2">
            Similar events
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {f.relatedEvents.nodes.map((re: any) => {
              const reEventFields = re.eventFields ?? {};
              const reStart = reEventFields.startDateTime ? new Date(reEventFields.startDateTime) : null;
              const yyyy = reStart ? reStart.getFullYear() : "2025";
              const mm = reStart ? String(reStart.getMonth() + 1).padStart(2, "0") : "01";
              const featuredImage = re.featuredImage?.node;
              
              return (
                <a
                  key={re.slug}
                  href={buildEventHref(re.slug, reStart?.toISOString() ?? "")}
                  className="group card card-hover card-link overflow-hidden h-[380px] flex flex-col"
                >
                {/* Full-bleed image */}
                <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                    {featuredImage?.sourceUrl && (
                      <img
                        src={featuredImage.sourceUrl}
                        alt={featuredImage.altText ?? ""}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col min-h-0 mt-5">
                    <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-2">
                        {re.title}
                    </h3>

                    {(reStart?.toISOString() ?? "") && (
                    <span className="mt-2 inline-flex w-fit rounded-full bg-gmcc-blue-light/30 px-3 py-1 text-xs font-medium text-gmcc-navy">
                        {reStart?.toLocaleDateString()} {reStart?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                    )}

                    {reEventFields.summary && (
                    <p className="mt-3 text-xs leading-6 text-neutral-600 line-clamp-3">
                        {reEventFields.summary}
                    </p>
                    )}

                    <div className="mt-auto flex items-center justify-end border-t border-neutral-100 pt-4">
                      <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                        View →
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
            </div>
        </section>
      )}
      </div>
    </main>
  );
}