// src/app/programs/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import { mapProgram } from "@/lib/mappers";
import HeaderImage from "@/components/headerImage";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";

const PROGRAM_BY_SLUG_QUERY = `
  query ProgramBySlug($slug: ID!) {
    program(id: $slug, idType: SLUG) {
      title
      slug
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails { width height }
        }
      }
      programFields {
        summary
        longDescription
        offeringType
        ageRange { min max }
        skillLevel
        duration
        priceFrom
        benefits
        developmentalAssets
        whatToBring
        instructors {
          edges {
            node {
              id
            }
          }
        }
        registrationSystem {
          nodes { name slug }
        }
        externalSchedule {
          activityCode
          sectionCodes
          deepLink
          nextStartDate
        }
          
        center {
          nodes {
            ... on Center {
              slug
              title
            }
          }
        }

        # Taxonomies
        programArea {
          nodes { name slug }
        }
        audience {
          nodes { name slug }
        }
        session {
          nodes { name slug }
        }

        # Media gallery (ACF group of images)
        mediaGallery {
          image1 { node { sourceUrl altText mediaDetails { width height } } }
          image2 { node { sourceUrl altText mediaDetails { width height } } }
          image3 { node { sourceUrl altText mediaDetails { width height } } }
          image4 { node { sourceUrl altText mediaDetails { width height } } }
        }

        # Attachments (ACF group-of-groups)
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
          attachment5 {
            attachment5Label
            attachment5File { node { mediaItemUrl } }
          }
          }

          relatedPrograms {
            nodes {
              ... on Program {
                title
                slug
                programFields {
                  summary
                  center {
                    nodes {
                      ... on Center {
                        slug
                        title
                      }
                    }
                  }
                }
                featuredImage {
                  node {
                    sourceUrl
                    altText
                  }
                }
              }
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
              ... on Page {
                title
                slug
              }
            }
          }
      }
    }
  }
`;

type ProgramPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;

  const data = await wpFetch<any>(PROGRAM_BY_SLUG_QUERY, { slug });
  const wp = data?.program;
  if (!wp) {
    return (
      <main className="mx-auto max-w-5xl section-y">
        <p className="body">Program not found.</p>
      </main>
    );
  }

  const p = mapProgram(wp);

  // Convenience: pull center names from the mapped relationship
  const centerNames = (p.centers ?? []).map((c: any) => c.title);


  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src={p.heroImage?.url ?? ""} alt={p.heroImage?.alt ?? ""} />
      </div>

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">

      {/* HERO */}
      <section className="stack-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="stack-2">
            <h1 className="h1">{p.title}</h1>
            {p.summary && (
              <p className="body max-w-2xl">{p.summary}</p>
            )}
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-2">
          {p.offeringType?.map((ot: string) => (
            <span key={ot} className="badge badge-maroon">{ot}</span>
          ))}

          {/* Centers as clickable chips */}
          {p.taxonomies?.center?.length > 0 &&
            p.centers.map((c: any) => (
              <a key={c.slug} href={`/centers/${c.slug}`} className="badge badge-teal hover:opacity-80">
                {c.title}
              </a>
            ))}

          {p.ageRange && (p.ageRange.min || p.ageRange.max) && (
            <span className="badge badge-green">
              Ages {p.ageRange.min ?? "?"}–{p.ageRange.max ?? "?"}
            </span>
          )}

          {p.skillLevel && (
            <span className="badge badge-neutral">Level: {p.skillLevel}</span>
          )}

          {p.taxonomies?.programArea?.length > 0 && (
            <span className="badge badge-blue">{p.taxonomies.programArea.join(", ")}</span>
          )}
          {p.taxonomies?.audience?.length > 0 && (
            <span className="badge badge-grey">Audience: {p.taxonomies.audience.join(", ")}</span>
          )}
        </div>
      </section>

      {/* MAIN GRID: content + sidebar */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="stack-8">
          {/* Long description */}
          {p.longDescription && (
            <article className="prose prose-sm max-w-none sm:prose-base">
              {/* If you switch to WYSIWYG later, swap this for dangerouslySetInnerHTML */}
              <p className="whitespace-pre-line">{p.longDescription}</p>
            </article>
          )}

          {/* Details card */}
          <h2 className="h2 mb-2">Program details</h2>
          <div className="card">
            <dl className="mt-3 stack-2 body">
              {p.duration && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Duration</dt>
                  <dd className="text-right">{p.duration}</dd>
                </div>
              )}
              {p.skillLevel && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Level</dt>
                  <dd className="text-right">{p.skillLevel}</dd>
                </div>
              )}
              {p.priceFrom != null && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Price from</dt>
                  <dd className="text-right">${p.priceFrom.toFixed(2)}</dd>
                </div>
              )}

              {/* Center row */}
              {centerNames.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Center</dt>
                  <dd className="text-right">{centerNames.join(", ")}</dd>
                </div>
              )}

              {p.taxonomies?.programArea?.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Program area</dt>
                  <dd className="text-right">{p.taxonomies.programArea.join(", ")}</dd>
                </div>
              )}
              {p.taxonomies?.audience?.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Audience</dt>
                  <dd className="text-right">{p.taxonomies.audience.join(", ")}</dd>
                </div>
              )}
              {p.taxonomies?.session?.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Session</dt>
                  <dd className="text-right">{p.taxonomies.session.join(", ")}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Benefits + What to bring */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
              {p.benefits?.length > 0 && (
              <div>
                <h2 className="h2 mb-2">Benefits</h2>
                <div className="card">
                  <ul className="list-disc pl-5 body">
                    {p.benefits.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                </div>
                )}

              {p.whatToBring?.length > 0 && (
                <div>
                  <h2 className="h2 mb-2">What to bring</h2>
                  <div className="card">
                    <ul className="list-disc pl-5 body">
                      {p.whatToBring?.length
                        ? p.whatToBring.map((x: string, i: number) => (
                            <li key={i}>{x}</li>
                          ))
                        : <li>Standard workout attire.</li>}
                    </ul>
                  </div>
                </div>
              )}
          </div>

          {p.developmentalAssets && p.developmentalAssets.length > 0 && (
                <div>
                  <h2 className="h2 mb-2">Developmental assets</h2>
                  <div className="card">
                    <ul className="list-disc pl-5 body">
                      {p.developmentalAssets.map((da: string, i: number) => (
                        <li key={i}>{da}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

          {/* Instructors (optional) */}
          {p.instructors?.length > 0 && (
            <div>
              <h2 className="h2 mb-3">Instructors</h2>
              <div>
                  <ul className="stack-2 body">
                    {p.instructors.map((name: string, i: number) => (
                      <li key={i}>• {name}</li>
                    ))}
                  </ul>
                </div>
            </div>
          )}

          {/* Attachments card */}
          {p.attachments?.length > 0 && (
            <div>
            <h2 className="h2 mb-2">Documents</h2>
            <div className="card">
              <ul className="mt-3 stack-2 body">
                {p.attachments.map((att: any, i: number) => (
                  <li key={i}>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-2">
                      <span className="badge badge-teal">PDF</span>
                      <span>{att.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
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

            {p.externalSchedule?.deepLink ? (
              <a
                className="btn btn-primary w-full mt-4"
                href={p.externalSchedule.deepLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Register now
              </a>
            ) : (
              <p className="mt-3 small">
                Registration details will be posted soon.
              </p>
            )}

            <h2 className="h3 text-gmcc-navy mt-4">Need more information?</h2>
            <a href={``} className="link body block text-sm">➜ View session calendars</a>
            <a href={``} className="link body block text-sm">➜ Compare centers</a>
            <a href={``} className="link body block text-sm">➜ Explore similar programs</a>
          </div>

        </aside>
      </section>

      {p.relatedPrograms && p.relatedPrograms.length > 0 && (
        <section className="stack-4">
          <h2 className="h2 mb-2">Similar programs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.relatedPrograms.map((p) => (
          <a
            key={p.slug}
            href={`/programs/${p.slug}`}
            className="group card card-hover card-link overflow-hidden h-[380px] flex flex-col"
          >
            {/* Full-bleed image */}
            <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
              {p.heroImage?.url && (
                <img
                  src={p.heroImage.url}
                  alt={p.heroImage.alt}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
            </div>

            <div className="flex flex-1 flex-col min-h-0 mt-5">
              <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-2">
                {p.title}
              </h3>

              <CentersBadgesOneLine centers={p.centers ?? []} />

              {p.summary && (
                <p className="mt-3 text-xs leading-6 text-neutral-600 line-clamp-3 mb-3">
                  {p.summary}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                <div />
                <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                  View →
                </span>
              </div>
            </div>
          </a>
            ))}
          </div>
        </section>
      )}
      </div>
    </main>
  );
}