// src/app/events/[yyyy]/[mm]/[slug]/page.tsx
import { acfAttachmentItems, wpFetch } from "@/lib/wp";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import { buildEventHref } from "@/lib/events/buildEventHref";
import { formatEventDate } from "@/lib/events/formatEventDate";
import { EVENT_SCHEDULE_GRAPHQL, getEventDateInfo } from "@/lib/events/eventSchedule";
import { TestimonialSection, normalizeTestimonials } from "@/components/testimonials";
import SponsorsGrid, { normalizeSponsors } from "@/components/sponsorsGrid";
import AttachmentsCard from "@/components/detail/attachmentsCard";
import DetailGalleryCarousel from "@/components/detail/detailGalleryCarousel";
import RegistrationSidebar from "@/components/detail/registrationSidebar";

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
        ${EVENT_SCHEDULE_GRAPHQL}
        cost
        eventType
        locationOverride
        whatToBring

        gallery {
          photos {
            node { sourceUrl altText mediaDetails { width height } }
          }
        }

        attachments {
          file {
            node {
              sourceUrl
              mediaItemUrl
              title
            }
          }
        }

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

        registrationInformation {
          instructionalSubheader
          registrationLink
          phoneNumber
          email
        }
        additionalInformationLinks {
          link1 {
            linkLabel
            link
          }
          link2 {
            linkLabel
            link
          }
          link3 {
            linkLabel
            link
          }
          linkLabel
          link
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

        sponsors {
          nodes {
            ... on Sponsor {
              name
              sponsorFields {
                tier
                link
                logo {
                  node {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        }

        relatedEvents {
          nodes {
            ... on Event {
              title
              slug
              eventFields {
                summary
                ${EVENT_SCHEDULE_GRAPHQL}
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
  const attachments = acfAttachmentItems(f.attachments);
  const whatToBringItems = Array.isArray(f.whatToBring)
    ? f.whatToBring.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
    : typeof f.whatToBring === "string"
    ? f.whatToBring
        .split("\n")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  const centers = (f.center?.nodes ?? []).map((c: any) => ({ title: c.title, slug: c.slug }));

  // Resolve the schedule: for recurring events, show remaining upcoming
  // occurrences; if every occurrence has passed, fall back to the most recent.
  const dateInfo = getEventDateInfo(f.eventSchedule);
  const displayOccurrences = dateInfo.isPast
    ? dateInfo.active
      ? [dateInfo.active]
      : []
    : dateInfo.upcoming;
  const dateRangeLabels = displayOccurrences
    .map((o) => formatEventDate(o.start, o.end))
    .filter((label): label is string => Boolean(label));

  return (
    <main>
      <SolidNavyWaveHeader title={event.title} description={f.summary} />

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">

      {/* MAIN GRID: content + sidebar */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">

      <div className="min-w-0 stack-4">

        {/* Chips row - all clickable, linking to /events with filters */}
        <div className="flex flex-wrap gap-2">
          {f.eventType?.map((ot: string) => (
            <a 
              key={ot} 
              href={`/events?eventType=${encodeURIComponent(ot)}`}
              className="badge badge-maroon hover:opacity-80 transition-opacity"
            >
              {ot}
            </a>
          ))}
          {/* Centers as clickable chips - link to events filter */}
          {centers.length > 0 &&
            centers.map((c: { title: string; slug: string }) => (
              <a 
                key={c.slug} 
                href={`/centers/${c.slug}`} 
                className="badge badge-teal hover:opacity-80 transition-opacity"
              >
                {c.title}
              </a>
            ))}
          {/* Program areas - clickable */}
          {f.programArea?.nodes?.map((area: any) => (
            <a 
              key={area.slug} 
              href={`/events?programArea=${encodeURIComponent(area.name)}`}
              className="badge badge-green hover:opacity-80 transition-opacity"
            >
              {area.name}
            </a>
          ))}
          {/* Audience - clickable */}
          {f.audience?.nodes?.map((aud: any) => (
            <a 
              key={aud.slug} 
              href={`/events?audience=${encodeURIComponent(aud.slug)}`}
              className="badge badge-grey hover:opacity-80 transition-opacity"
            >
              {aud.name}
            </a>
          ))}
        </div>


        {/* LEFT COLUMN */}
        <div className="stack-8 pt-4">
          {/* Description */}
          {f.longDescription && (
            <article className="prose prose-sm max-w-none sm:prose-base">
              {/* If you stored HTML, use dangerouslySetInnerHTML instead */}
              <p className="whitespace-pre-line">{f.longDescription}</p>
            </article>
          )}

          {/* Attachments card */}
          <AttachmentsCard attachments={attachments} />

          {/* Details card */}
          <h2 className="h2 pt-8 mb-2">Event details</h2>
          <div className="card">
            <dl className="mt-3 stack-2 body">
              {dateRangeLabels.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">When</dt>
                  <dd className="text-right">
                    {dateRangeLabels.length === 1 ? (
                      dateRangeLabels[0]
                    ) : (
                      <ul className="stack-1">
                        {dateRangeLabels.map((label, i) => (
                          <li key={i}>{label}</li>
                        ))}
                      </ul>
                    )}
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

          {/* What to bring card */}
          {whatToBringItems.length > 0 && (
                <div>
                <h2 className="h2 pt-8 mb-2">What to bring</h2>
                <div className="card">
                  <ul className="list-disc pl-5 body">
                    {whatToBringItems.length
                      ? whatToBringItems.map((x: string, i: number) => (
                          <li key={i}>{x}</li>
                        ))
                      : <li>No specific items required.</li>}
                  </ul>
                </div>
              </div>
            )}

          {/* Contact card */}
          {(f.contactName || f.contactEmail || f.contactPhone) && (
            <div className="pt-8">
            <h2 className="h2 mb-2">Contact</h2>
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
            </div>
          )}

          {f.testimonials?.nodes?.length > 0 && (
            <div>
              <h2 className="h2 pt-8 mb-4">Testimonials</h2>
              <TestimonialSection testimonials={normalizeTestimonials(f.testimonials.nodes)} />
            </div>
          )}

        </div>
        </div>

        {/* RIGHT: stretch to row height like /events filters so sticky has a tall scroll span */}
        <div className="flex min-h-0 min-w-0 flex-col gap-6">
          <DetailGalleryCarousel gallery={f.gallery} />

          <RegistrationSidebar
            registrationInformation={f.registrationInformation}
            additionalInformationLinks={f.additionalInformationLinks}
          />
        </div>
      </section>



      {f.relatedEvents?.nodes && f.relatedEvents.nodes.length > 0 && (
        <section className="stack-4 scroll-mt-24" id="similar-events">
          <h2 className="h2 pt-8 mb-2">Explore Similar Events</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {f.relatedEvents.nodes.map((re: any) => {
              const reEventFields = re.eventFields ?? {};
              const reDateInfo = getEventDateInfo(reEventFields.eventSchedule);
              const reStartIso = reDateInfo.start;
              const reEndIso = reDateInfo.end;
              const featuredImage = re.featuredImage?.node;

              return (
                <a
                  key={re.slug}
                  href={buildEventHref(re.slug, reStartIso ?? "")}
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
                    <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-1">
                        {re.title}
                    </h3>

                    {(reStartIso || reEndIso) && (
                    <span className="mt-2 badge badge-green w-fit">
                        {formatEventDate(reStartIso, reEndIso)}
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

      {f.sponsors?.nodes?.length > 0 && (
            <div className="stack-4 pt-16" id="sponsors">
              <SponsorsGrid sponsors={normalizeSponsors(f.sponsors.nodes)} title="Thank You to Our Sponsors" />
            </div>
          )}
      </div>
    </main>
  );
}