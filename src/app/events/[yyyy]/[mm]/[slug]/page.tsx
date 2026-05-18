// src/app/events/[yyyy]/[mm]/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import { buildEventHref } from "@/lib/events/buildEventHref";
import { formatEventDate } from "@/lib/events/formatEventDate";
import ImageCarousel from "@/components/imageCarousel";
import { TestimonialSection, normalizeTestimonials } from "@/components/testimonials";
import PhoneLink from "@/components/phoneLink";
import SponsorsGrid, { normalizeSponsors } from "@/components/sponsorsGrid";

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
        eventType
        locationOverride
        whatToBring

        mediaGallery {
          photo1 { node { sourceUrl altText } }
          photo2 { node { sourceUrl altText } }
          photo3 { node { sourceUrl altText } }
          photo4 { node { sourceUrl altText } }
          photo5 { node { sourceUrl altText } }
        }

        attachments {
          attachment1 {
            attachment1Label
            attachment1File { node { mediaItemUrl } }
          }
          attachment2 {
            attachment2Label
            attachment2File { node { mediaItemUrl } }
          }
          attachment3 {
            attachment3Label
            attachment3File { node { mediaItemUrl } }
          }
          attachment4 {
            attachment4Label
            attachment4File { node { mediaItemUrl } }
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
                startDateTime
                endDateTime
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
  const whatToBringItems = Array.isArray(f.whatToBring)
    ? f.whatToBring.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
    : typeof f.whatToBring === "string"
    ? f.whatToBring
        .split("\n")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  const centers = (f.center?.nodes ?? []).map((c: any) => ({ title: c.title, slug: c.slug }));

  const dateRangeLabel = formatEventDate(f.startDateTime ?? null, f.endDateTime ?? null);

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
          {f.attachments?.length > 0 && (
            <div>
              <h3 className="eyebrow mb-3">Relevant documents</h3>
              <div className="flex flex-wrap gap-3">
                {f.attachments.map((att: any, i: number) => (
                  <a 
                    key={i}
                    href={att.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
                  >
                    {/* Document icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gmcc-teal/10 text-gmcc-teal">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 3v6h6" />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-neutral-800 group-hover:text-gmcc-navy truncate">
                        {att.label}
                      </span>
                      <span className="text-xs text-neutral-500">PDF • Click to download</span>
                    </div>
                    {/* Download arrow icon */}
                    <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-y-0.5 group-hover:text-gmcc-teal ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Details card */}
          <h2 className="h2 pt-8 mb-2">Event details</h2>
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
          {/* Media Gallery Carousel */}
          {(() => {
            const gallery = f.mediaGallery;
            if (!gallery) return null;
            
            // Transform media gallery images into carousel format
            const carouselImages = [
              gallery.photo1,
              gallery.photo2,
              gallery.photo3,
              gallery.photo4,
              gallery.photo5,
            ]
              .filter((img) => img?.node?.sourceUrl)
              .map((img) => ({
                image: {
                  sourceUrl: img.node.sourceUrl,
                  altText: img.node.altText ?? null,
                },
                cta: null,
                url: null,
              }));
            
            if (carouselImages.length === 0) return null;
            
            return (
              <div>
                {/* <h2 className="h2 mb-2">See {p.title} in action</h2> */}
                <ImageCarousel images={carouselImages} />
              </div>
            );
          })()}


          <aside className="card h-fit sticky top-18 z-10 w-full min-w-0 shrink-0 border-gmcc-teal/40 bg-gmcc-blue-light/30 p-6">
            <h2 className="h2 text-gmcc-navy">Ready to register?</h2>
            <p className="mt-2 small mb-2">{f.registrationInformation?.instructionalSubheader}</p>

            {f.registrationInformation?.registrationLink || f.registrationInformation?.phoneNumber || f.registrationInformation?.email ? (
              <>
              {f.registrationInformation?.registrationLink && (
              <a
                className="btn btn-primary w-full mt-4 mb-4"
                href={f.registrationInformation.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Register now
              </a>
              )}
              {f.registrationInformation?.phoneNumber && (
                <PhoneLink className="mt-4 small text-gmcc-teal font-bold hover:text-gmcc-navy hover:underline" phone={f.registrationInformation.phoneNumber}></PhoneLink>
              )}
              <br />
              {f.registrationInformation?.email && (
                <a href={`mailto:${f.registrationInformation.email}`} className="mt-4 small text-gmcc-teal font-bold hover:text-gmcc-navy hover:underline">{f.registrationInformation.email}</a>
              )}
              </>
            ) : (
              <p className="mt-4 small">
                Registration details will be posted soon.
              </p>
            )}

            {(() => {
              const { link1, link2, link3 } = f.additionalInformationLinks ?? {};
              const links = [link1, link2, link3].filter((l: any) => l?.link && l?.linkLabel);
              if (links.length === 0) return null;
              return (
                <div className="mt-4">
                  <h2 className="h3">Need more information?</h2>
                  <ul className="text-sm mt-2">
                    {links.map((link: any, i: number) => (
                      <li key={i}><a href={link.link} className="link body block text-sm">➜ {link.linkLabel}</a></li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </aside>
        </div>
      </section>


      {f.relatedEvents?.nodes && f.relatedEvents.nodes.length > 0 && (
        <section className="stack-4 scroll-mt-24" id="similar-events">
          <h2 className="h2 pt-8 mb-2">Explore Similar Events</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {f.relatedEvents.nodes.map((re: any) => {
              const reEventFields = re.eventFields ?? {};
              const reEndIso = reEventFields.endDateTime ?? null;
              const featuredImage = re.featuredImage?.node;

              return (
                <a
                  key={re.slug}
                  href={buildEventHref(re.slug, reEventFields.startDateTime ?? "")}
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

                    {(reEventFields.startDateTime || reEndIso) && (
                    <span className="mt-2 badge badge-green w-fit">
                        {formatEventDate(reEventFields.startDateTime ?? null, reEndIso)}
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
              {/* <h2 className="h2 pt-8 mb-4">Sponsors</h2> */}
              <SponsorsGrid sponsors={normalizeSponsors(f.sponsors.nodes)} title="Thank You to Our Sponsors" />
            </div>
          )}
      </div>
    </main>
  );
}