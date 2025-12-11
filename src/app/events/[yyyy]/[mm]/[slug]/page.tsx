// src/app/events/[yyyy]/[mm]/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";

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

  // Support multiple possible shapes for eventFields.center:
  // - single post object
  // - connection with nodes
  // - (future-proof) direct array
  let centerNodes: any[] = [];

  if (Array.isArray(f.center)) {
    // e.g. center is already an array of centers
    centerNodes = f.center;
  } else if (Array.isArray(f.center?.nodes)) {
    // e.g. center is a connection { nodes: [...] }
    centerNodes = f.center.nodes;
  } else if (f.center) {
    // e.g. center is a single object
    centerNodes = [f.center];
  }

  const centerNames =
    centerNodes.map((n: any) => n?.title || n?.name).filter(Boolean);

  const programAreaNames =
    f.programArea?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [];
  const audienceNames =
    f.audience?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [];
  const sessionNames =
    f.session?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [];

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
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">

      {/* HERO IMAGE */}
      {event.featuredImage?.node?.sourceUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
          <img
            src={event.featuredImage.node.sourceUrl}
            alt={event.featuredImage.node.altText ?? ""}
            className="h-72 w-full object-cover sm:h-80"
          />
        </div>
      )}

      {/* HERO */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {event.title}
            </h1>
            {f.summary && (
              <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
                {f.summary}
              </p>
            )}
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-2 text-xs text-neutral-700">
          {f.eventType && (
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
              {f.eventType}
            </span>
          )}
          {centerNames.length > 0 && (
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-amber-800">
              {centerNames.join(", ")}
            </span>
          )}
          {programAreaNames.length > 0 && (
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
              {programAreaNames.join(", ")}
            </span>
          )}
          {audienceNames.length > 0 && (
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
              Audience: {audienceNames.join(", ")}
            </span>
          )}
          {sessionNames.length > 0 && (
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
              Session: {sessionNames.join(", ")}
            </span>
          )}
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Description */}
          {f.longDescription && (
            <article className="prose prose-sm max-w-none sm:prose-base">
              {/* If you stored HTML, use dangerouslySetInnerHTML instead */}
              <p className="whitespace-pre-line">{f.longDescription}</p>
            </article>
          )}

          {/* Details card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900">
              Event details
            </h2>
            <dl className="mt-3 space-y-2 text-sm text-neutral-700">
              {dateRangeLabel && (
                <div>
                  <dt className="text-neutral-500">When</dt>
                  <dd className="text-sm text-neutral-800">
                    {dateRangeLabel}
                  </dd>
                </div>
              )}

            {/* Location */}
            <div>
              <dt className="text-neutral-500">Where</dt>
              <dd className="text-sm text-neutral-800">
                {f.locationOverride ? (
                  <>{f.locationOverride}</>
                ) : centerNames.length > 0 ? (
                  <>
                    {centerNames.join(", ")}
                    {f.locationOverride && (
                      <>
                        {" "}
                        - {f.locationOverride}
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-neutral-500">
                    Location details coming soon.
                  </span>
                )}
              </dd>
            </div>

            {f.cost && (
              <div>
                <dt className="text-neutral-500">Cost</dt>
                <dd className="text-sm text-neutral-800">{f.cost}</dd>
              </div>
            )}

            {f.eventType && (
              <div>
                <dt className="text-neutral-500">Type</dt>
                <dd className="text-sm text-neutral-800">{f.eventType}</dd>
              </div>
            )}
          </dl>
          </div>

          {/* Contact card */}
          {(f.contactName || f.contactEmail || f.contactPhone) && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-900">
                Contact
              </h2>
              <div className="mt-2 text-sm text-neutral-700 space-y-1">
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
        <aside className="space-y-6">
          {/* Registration card */}
          <div className="sticky top-8 rounded-2xl border border-emerald-500/40 bg-emerald-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-emerald-900">
              Ready to register?
            </h2>
            <p className="mt-1 text-xs text-emerald-900/80">
              You&apos;ll be taken to our secure registration system to complete
              signup.
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
            <a href={``} className="text-neutral-600 hover:underline" style={{ fontSize: "14px" }}>Explore similar events</a>
          </div>
        </aside>
      </section>

      {f.relatedEvents?.nodes && f.relatedEvents.nodes.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Similar events
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {f.relatedEvents.nodes.map((re: any) => {
              const reEventFields = re.eventFields ?? {};
              const reStart = reEventFields.startDateTime ? new Date(reEventFields.startDateTime) : null;
              const yyyy = reStart ? reStart.getFullYear() : "2025";
              const mm = reStart ? String(reStart.getMonth() + 1).padStart(2, "0") : "01";
              const featuredImage = re.featuredImage?.node;
              
              return (
                <a
                  key={re.slug}
                  href={`/events/${yyyy}/${mm}/${re.slug}`}
                  className="group flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm hover:border-emerald-500/70 hover:shadow-md transition overflow-hidden"
                >
                  {featuredImage?.sourceUrl && (
                    <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featuredImage.sourceUrl}
                        alt={featuredImage.altText ?? ""}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-emerald-700 mb-2">
                      {re.title}
                    </h3>
                    {reEventFields.summary && (
                      <p className="text-sm text-neutral-600 line-clamp-3 flex-1">
                        {reEventFields.summary}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}