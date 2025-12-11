// src/app/programs/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import { mapProgram } from "@/lib/mappers";

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
        membershipRequirements {
          nodes { name slug }
        }
        whatToBring
        instructors
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
          }

          relatedPrograms {
            nodes {
              ... on Program {
                title
                slug
                programFields {
                  summary
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

type ProgramPageProps = {
  params: { slug: string };
};

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = params;

  const data = await wpFetch<any>(PROGRAM_BY_SLUG_QUERY, { slug });
  const wp = data?.program;
  if (!wp) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        Program not found.
      </main>
    );
  }

  const p = mapProgram(wp);

  // Convenience: pull center names from the mapped relationship
  const centerNames = (p.centers ?? []).map((c: any) => c.title);


  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* HERO IMAGE */}
      {p.heroImage?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <div
          className="flex justify-center"> 
          {/* className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 flex justify-center"  */}
          {/* style={{ maxWidth: "100%" }} */}
          <img
            src={p.heroImage.url}
            alt={p.heroImage.alt}
            className="h-72 object-contain sm:h-80"
            style={{ maxWidth: "100%" }}
          />
        </div>
      )}

      {/* HERO */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {p.title}
            </h1>
            {p.summary && (
              <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
                {p.summary}
              </p>
            )}
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-2 text-xs text-neutral-700">
          {p.offeringType?.map((ot: string) => (
            <span
              key={ot}
              className="inline-flex rounded-full bg-neutral-100 px-3 py-1"
            >
              {ot}
            </span>
          ))}

          {p.ageRange && (p.ageRange.min || p.ageRange.max) && (
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-blue-800">
              Ages {p.ageRange.min ?? "?"}–{p.ageRange.max ?? "?"}
            </span>
          )}

          {p.skillLevel && (
            <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-purple-800">
              Level: {p.skillLevel}
            </span>
          )}

          {/* Centers as clickable chips */}
          {p.centers?.length > 0 &&
            p.centers.map((c: any) => (
              <a
                key={c.slug}
                href={`/centers/${c.slug}`}
                className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-amber-800 hover:bg-amber-100"
              >
                {c.title}
              </a>
            ))}

          {p.taxonomies?.programArea?.length > 0 && (
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
              {p.taxonomies.programArea.join(", ")}
            </span>
          )}
          {p.taxonomies?.audience?.length > 0 && (
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
              Audience: {p.taxonomies.audience.join(", ")}
            </span>
          )}
          {p.taxonomies?.session?.length > 0 && (
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
              Session: {p.taxonomies.session.join(", ")}
            </span>
          )}
        </div>
      </section>

      {/* MAIN GRID: content + sidebar */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Long description */}
          {p.longDescription && (
            <article className="prose prose-sm max-w-none sm:prose-base">
              {/* If you switch to WYSIWYG later, swap this for dangerouslySetInnerHTML */}
              <p className="whitespace-pre-line">{p.longDescription}</p>
            </article>
          )}

          {/* Details card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900">
              Program details
            </h2>
            <dl className="mt-3 space-y-2 text-sm text-neutral-700">
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
                <div>
                  <dt className="text-neutral-500">Center</dt>
                  <dd className="text-sm text-neutral-800">
                    {centerNames.join(", ")}
                  </dd>
                </div>
              )}

              {p.taxonomies?.programArea?.length > 0 && (
                <div>
                  <dt className="text-neutral-500">Program area</dt>
                  <dd className="text-sm text-neutral-800">
                    {p.taxonomies.programArea.join(", ")}
                  </dd>
                </div>
              )}
              {p.taxonomies?.audience?.length > 0 && (
                <div>
                  <dt className="text-neutral-500">Audience</dt>
                  <dd className="text-sm text-neutral-800">
                    {p.taxonomies.audience.join(", ")}
                  </dd>
                </div>
              )}
              {p.taxonomies?.session?.length > 0 && (
                <div>
                  <dt className="text-neutral-500">Session</dt>
                  <dd className="text-sm text-neutral-800">
                    {p.taxonomies.session.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Benefits + What to bring */}
          <div className="grid gap-6 md:grid-cols-2">
            {p.benefits?.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-medium">Benefits</h2>
                <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
                  {p.benefits.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              )}

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium">What to bring</h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
                {p.whatToBring?.length
                  ? p.whatToBring.map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))
                  : <li>Standard workout attire.</li>}
              </ul>
            </div>
          </div>

          {/* Instructors (optional) */}
          {p.instructors?.length > 0 && (
            <div>
              <h2 className="text-lg font-medium">Instructors</h2>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                {p.instructors.map((name: string, i: number) => (
                  <li key={i}>• {name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments card */}
          {p.attachments?.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium">Documents</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {p.attachments.map((att: any, i: number) => (
                  <li key={i}>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <span className="inline-block h-6 w-10 rounded-full bg-blue-50 text-center text-xs leading-6">
                        PDF
                      </span>
                      <span>{att.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
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
              You&apos;ll be taken to our secure registration system to
              complete signup.
            </p>

            {p.externalSchedule?.deepLink ? (
              <a
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                href={p.externalSchedule.deepLink}
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

            <h2 className="text-base font-semibold text-emerald-900 mt-4">
              Need more information?
            </h2>
            <a href={``} className="text-neutral-600 hover:underline" style={{ fontSize: "14px" }}>View session calendars</a> <br />
            <a href={``} className="text-neutral-600 hover:underline" style={{ fontSize: "14px" }}>Compare centers</a> <br />
            <a href={``} className="text-neutral-600 hover:underline" style={{ fontSize: "14px" }}>Explore similar programs</a> <br />
          </div>

        </aside>
      </section>

      {p.relatedPrograms && p.relatedPrograms.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Similar programs
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {p.relatedPrograms.map((rp: any) => (
              <a
                key={rp.slug}
                href={`/programs/${rp.slug}`}
                className="group flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm hover:border-emerald-500/70 hover:shadow-md transition overflow-hidden"
              >
                {rp.heroImage?.url && (
                  <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rp.heroImage.url}
                      alt={rp.heroImage.alt}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-1 p-4">
                  <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-emerald-700 mb-2">
                    {rp.title}
                  </h3>
                  {rp.summary && (
                    <p className="text-sm text-neutral-600 line-clamp-3 flex-1">
                      {rp.summary}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}