import { wpFetch } from "@/lib/wp";
import { mapProgram } from "@/lib/mappers";

// TEMP: inline GraphQL query so we know exactly what gets sent
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
        membershipRequirements
        whatToBring
        instructors
        registrationSystem
        externalSchedule {
          activityCode
          sectionCodes
          deepLink
          nextStartDate
        }
        center      { nodes { name slug } }
        programArea { nodes { name slug } }
        audience    { nodes { name slug } }
        session     { nodes { name slug } }

        mediaGallery {
          image1 {
            node {
              sourceUrl
              altText
              mediaDetails { width height }
            }
          }
          image2 {
            node {
              sourceUrl
              altText
              mediaDetails { width height }
            }
          }
          image3 {
            node {
              sourceUrl
              altText
              mediaDetails { width height }
            }
          }
          image4 {
            node {
              sourceUrl
              altText
              mediaDetails { width height }
            }
          }
        }

        attachments {
          attachment1 {
            attachment1Label
            attachment1File {
              node {
                mediaItemUrl
              }
            }
          }
          attachment2 {
            attachment2Label
            attachment2File {
              node {
                mediaItemUrl
              }
            }
          }
          attachment3 {
            attachment3Label
            attachment3File {
              node {
                mediaItemUrl
              }
            }
          }
          attachment4 {
            attachment4Label
            attachment4File {
              node {
                mediaItemUrl
              }
            }
          }
        }
      }
    }
  }
`;

// note: params is just an object, not a Promise
export default async function ProgramPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const data = await wpFetch<any>(PROGRAM_BY_SLUG_QUERY, { slug });
  const wp = data?.program;
  if (!wp) {
    return <div className="mx-auto max-w-5xl p-6">Program not found.</div>;
  }

  const p = mapProgram(wp);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{p.title}</h1>
        <p className="text-neutral-600">{p.summary}</p>
        {p.externalSchedule?.nextStartDate && (
          <span className="inline-flex rounded-full border px-3 py-1 text-sm">
            Starts {new Date(p.externalSchedule.nextStartDate).toLocaleDateString()}
          </span>
        )}
      </header>

      {p.heroImage?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.heroImage.url} alt={p.heroImage.alt} className="w-full rounded-xl" />
      )}

      {p.descriptionHtml && (
        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
        />
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-medium">Details</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {p.duration && <li><strong>Duration:</strong> {p.duration}</li>}
            {p.skillLevel && <li><strong>Level:</strong> {p.skillLevel}</li>}
            {p.priceFrom != null && <li><strong>Price from:</strong> ${p.priceFrom}</li>}
            {p.taxonomies?.center?.length ? (
              <li><strong>Center:</strong> {p.taxonomies.center.join(", ")}</li>
            ) : null}
            {p.taxonomies?.programArea?.length ? (
              <li><strong>Area:</strong> {p.taxonomies.programArea.join(", ")}</li>
            ) : null}
            {p.taxonomies?.audience?.length ? (
              <li><strong>Audience:</strong> {p.taxonomies.audience.join(", ")}</li>
            ) : null}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-medium">What to bring</h2>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {(p.whatToBring ?? []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      </section>

      {p.externalSchedule?.deepLink && (
        <a
          className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50"
          href={p.externalSchedule.deepLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Register
        </a>
      )}
    </main>
  );
}