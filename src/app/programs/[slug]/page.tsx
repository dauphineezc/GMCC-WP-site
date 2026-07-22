// src/app/programs/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import { mapProgram } from "@/lib/mappers";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import { TestimonialSection, normalizeTestimonials } from "@/components/testimonials";
import AttachmentsCard from "@/components/detail/attachmentsCard";
import DetailGalleryCarousel from "@/components/detail/detailGalleryCarousel";
import RegistrationSidebar from "@/components/detail/registrationSidebar";
import { getYoastMetadata } from "@/lib/wordpress/seo";

/** Map age range to audience slug(s) for filtering */
type AgeRangeValue = string | number | null | undefined;

function ageRangeHasMonths(value: AgeRangeValue): boolean {
  return typeof value === "string" && value.toLowerCase().includes("months");
}

function parseAgeNumber(value: AgeRangeValue): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    if (ageRangeHasMonths(value)) return 0;
    const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getAudienceSlugFromAgeRange(min: AgeRangeValue, max: AgeRangeValue): string | null {
  if (ageRangeHasMonths(min) || ageRangeHasMonths(max)) return "youth";
  return getAudienceSlugFromAge(parseAgeNumber(min), parseAgeNumber(max));
}

function formatAgeRangeLabel(min: AgeRangeValue, max: AgeRangeValue): string {
  const hasMin = min != null && min !== "";
  const hasMax = max != null && max !== "";
  if (hasMin && hasMax) return `Ages ${min}–${max}`;
  if (hasMin) return `Ages ${min}+`;
  if (hasMax) return `Ages up to ${max}`;
  return "";
}

function hasAgeRangeData(ageRange: { min?: AgeRangeValue; max?: AgeRangeValue } | null | undefined): boolean {
  if (!ageRange) return false;
  return (ageRange.min != null && ageRange.min !== "") || (ageRange.max != null && ageRange.max !== "");
}

function getAudienceSlugFromAge(min: number | null, max: number | null): string | null {
  // If no age data, can't determine audience
  if (min == null && max == null) return null;
  
  const ageMin = min ?? 0;
  const ageMax = max ?? 100;
  
  // Determine primary audience based on age range
  // These slugs should match your WordPress audience taxonomy
  if (ageMax <= 12) return "youth";
  if (ageMin >= 13 && ageMax <= 17) return "teen";
  if (ageMin >= 18 && ageMax <= 64) return "adult";
  if (ageMin >= 55 || ageMin >= 50) return "senior";
  
  // Default for mixed/general ages - use youth if it includes children
  if (ageMin < 13) return "youth";
  if (ageMin >= 13 && ageMin < 18) return "teen";
  
  return "adult";
}

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

export async function generateMetadata({ params }: ProgramPageProps) {
  const { slug } = await params;
  return getYoastMetadata(`/programs/${slug}`);
}

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
      <SolidNavyWaveHeader title={p.title} description={p.summary} />

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">

      {/* MAIN GRID: content + sidebar */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">

      <div className="min-w-0 stack-4">

        {/* Chips row - all clickable, linking to /programs with filters */}
        <div className="flex flex-wrap gap-2">
          {p.offeringType?.map((ot: string) => (
            <a 
              key={ot} 
              href={`/programs?offeringType=${encodeURIComponent(ot)}`}
              className="badge badge-maroon hover:opacity-80 transition-opacity"
            >
              {ot}
            </a>
          ))}

          {/* Centers as clickable chips - link to program filter */}
          {p.centers?.length > 0 &&
            p.centers.map((c: any) => (
              <a 
                key={c.slug} 
                href={`/programs?center=${encodeURIComponent(c.slug)}`} 
                className="badge badge-teal hover:opacity-80 transition-opacity"
              >
                {c.title}
              </a>
            ))}

          {/* Age range - link to audience filter based on age mapping */}
          {hasAgeRangeData(p.ageRange) && (() => {
            const audienceSlug = getAudienceSlugFromAgeRange(p.ageRange.min, p.ageRange.max);
            const ageLabel = formatAgeRangeLabel(p.ageRange.min, p.ageRange.max);
            return audienceSlug ? (
              <a 
                href={`/programs?audience=${encodeURIComponent(audienceSlug)}`}
                className="badge badge-green hover:opacity-80 transition-opacity"
              >
                {ageLabel}
              </a>
            ) : (
              <span className="badge badge-green">
                {ageLabel}
              </span>
            );
          })()}

          {/* Skill level - clickable */}
          {p.skillLevel && (
            <a 
              href={`/programs?skillLevel=${encodeURIComponent(p.skillLevel)}`}
              className="badge badge-neutral hover:opacity-80 transition-opacity"
            >
              Level: {p.skillLevel}
            </a>
          )}

          {/* Program areas - need slugs, so extract from raw data */}
          {wp.programFields?.programArea?.nodes?.map((area: any) => (
            <a 
              key={area.slug} 
              href={`/programs?programArea=${encodeURIComponent(area.name)}`}
              className="badge badge-blue hover:opacity-80 transition-opacity"
            >
              {area.name}
            </a>
          ))}
          
          {/* Audience - need slugs, so extract from raw data */}
          {wp.programFields?.audience?.nodes?.map((aud: any) => (
            <a 
              key={aud.slug} 
              href={`/programs?audience=${encodeURIComponent(aud.slug)}`}
              className="badge badge-grey hover:opacity-80 transition-opacity"
            >
              {aud.name}
            </a>
          ))}
        </div>


        {/* LEFT COLUMN */}
        <div className="stack-8 pt-4">
          {/* Long description */}
          {p.longDescription && (
            <article className="prose prose-sm max-w-none sm:prose-base">
              {/* If you switch to WYSIWYG later, swap this for dangerouslySetInnerHTML */}
              <p className="whitespace-pre-line">{p.longDescription}</p>
            </article>
          )}

          {/* Attachments card */}
          <AttachmentsCard attachments={p.attachments ?? []} />

          {/* Details card */}
          <h2 className="h2 pt-8 mb-2">Program details</h2>
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
                  <dt className="text-neutral-500">Center(s)</dt>
                  <dd className="text-right">{centerNames.join(", ")}</dd>
                </div>
              )}
              {p.taxonomies?.session?.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Session(s)</dt>
                  <dd className="text-right">{p.taxonomies.session.join(", ")}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Benefits + What to bring */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] pt-8">
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
              <h2 className="h2 pt-8 mb-3">Developmental assets</h2>
              <ul className="space-y-2 body mt-4 pl-6">
                {p.developmentalAssets.map((da: string, i: number) => {
                  // Split on em dash (—) to bold the part before it
                  const dashIndex = da.indexOf("—");
                  if (dashIndex > 0) {
                    const before = da.substring(0, dashIndex).trim();
                    const after = da.substring(dashIndex + 1).trim();
                    return (
                      <li key={i}>
                        <span className="font-semibold text-neutral-700">{before} — </span>
                        <span className="text-neutral-600">{after}</span>
                      </li>
                    );
                  }
                  return <li key={i}>{da}</li>;
                })}
              </ul>
            </div>
          )}

          {/* Instructors (optional) */}
          {p.instructors?.length > 0 && (
            <div>
              <h2 className="h2 pt-8 mb-3">Instructors</h2>
              <div>
                  <ul className="stack-2 body">
                    {p.instructors.map((name: string, i: number) => (
                      <li key={i}>• {name}</li>
                    ))}
                  </ul>
                </div>
            </div>
          )}

        {wp.programFields?.testimonials?.nodes?.length > 0 && (
          <div>
            <h2 className="h2 pt-8 mb-4">Testimonials</h2>
            <TestimonialSection testimonials={normalizeTestimonials(wp.programFields.testimonials.nodes)} />
          </div>
        )}
        </div>
        </div>

        {/* RIGHT: stretch to row height like /programs filters (default grid align) so sticky has a tall scroll span */}
        <div className="flex min-h-0 min-w-0 flex-col gap-6">
          <DetailGalleryCarousel gallery={wp.programFields?.gallery} />

          <RegistrationSidebar
            registrationInformation={p.registrationInformation}
            additionalInformationLinks={p.additionalInformationLinks}
          />
        </div>
      </section>


      {p.relatedPrograms && p.relatedPrograms.length > 0 && (
        <section className="stack-4 scroll-mt-24" id="similar-programs">
          <h2 className="h2 pt-8 mb-2">Explore Similar Programs</h2>
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
              <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-1">
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