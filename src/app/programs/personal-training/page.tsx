import Accordion from "@/components/accordion";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";
import { PersonalTrainingDirectoryHeader } from "@/components/programs/directory-sections/personalTrainingDirectoryHeader";
import type {
  DirectoryAttachment,
  DirectoryHeaderData,
  DirectoryTrainer,
} from "@/components/programs/directoryHeaderShared";
import { wpFetch } from "@/lib/wp";

type WPProgram = {
  slug?: string | null;
  title?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
    } | null;
  } | null;
  programFields?: {
    summary?: string | null;
    priceFrom?: number | null;
    center?: {
      nodes?: Array<{ slug?: string | null; title?: string | null } | null> | null;
    } | null;
    programArea?: {
      nodes?: Array<{ slug?: string | null; name?: string | null } | null> | null;
    } | null;
  } | null;
};

const PERSONAL_TRAINING_PAGE_QUERY = /* GraphQL */ `
  query PersonalTrainingPage($uri: ID!, $first: Int!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      personalTrainingDirectoryPageFields {
        heroImage {
          node {
            sourceUrl
            altText
          }
        }
        header
        subheader
        body
        attachments {
          attachment1 {
            label
            file {
              node {
                sourceUrl
                mediaItemUrl
                title
              }
            }
          }
          attachment2 {
            label
            file {
              node {
                sourceUrl
                mediaItemUrl
                title
              }
            }
          }
          attachment3 {
            label
            file {
              node {
                sourceUrl
                mediaItemUrl
                title
              }
            }
          }
          attachment4 {
            label
            file {
              node {
                sourceUrl
                mediaItemUrl
                title
              }
            }
          }
        }
        trainers {
          nodes {
            ... on StaffProfile {
              title
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              staffProfilesFields {
                title
                bio
              }
            }
          }
        }
      }
    }
    programs(first: $first, where: { stati: PUBLISH }) {
      nodes {
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        programFields {
          summary
          priceFrom
          center {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
          programArea {
            nodes {
              slug
              name
            }
          }
        }
      }
    }
  }
`;

function normalizeAttachment(att: any): DirectoryAttachment | null {
  if (!att) return null;
  return {
    label: att.label ?? null,
    file: att.file?.node ?? att.file ?? null,
  };
}

function normalizeDirectoryData(raw: any): DirectoryHeaderData {
  const trainerNodes = raw?.trainers?.nodes ?? [];
  const trainers: DirectoryTrainer[] =
    trainerNodes
      .map((trainer: any) => ({
        name: trainer?.title ?? null,
        photo: trainer?.featuredImage?.node
          ? {
              sourceUrl: trainer.featuredImage.node.sourceUrl ?? null,
              altText: trainer.featuredImage.node.altText ?? null,
            }
          : null,
        jobTitle: trainer?.staffProfilesFields?.title ?? null,
        bio: trainer?.staffProfilesFields?.bio ?? null,
      }))
      .filter(
        (trainer: DirectoryTrainer) =>
          !!trainer.name || !!trainer.jobTitle || !!trainer.photo?.sourceUrl || !!trainer.bio,
      ) ?? [];

  return {
    header: raw?.header ?? null,
    body: raw?.body ?? null,
    attachments: raw?.attachments
      ? {
          attachment1: normalizeAttachment(raw.attachments.attachment1),
          attachment2: normalizeAttachment(raw.attachments.attachment2),
          attachment3: normalizeAttachment(raw.attachments.attachment3),
          attachment4: normalizeAttachment(raw.attachments.attachment4),
        }
      : null,
    trainers,
  };
}

function normalizedAttachmentList(
  attachments: DirectoryHeaderData["attachments"],
): Array<{ label: string; url: string }> {
  if (!attachments) return [];
  const items = [
    attachments.attachment1,
    attachments.attachment2,
    attachments.attachment3,
    attachments.attachment4,
  ];
  return items
    .map((item) => {
      const url = item?.file?.sourceUrl ?? item?.file?.mediaItemUrl ?? "";
      const label = (item?.label ?? item?.file?.title ?? "").trim();
      if (!url || !label) return null;
      return { label, url };
    })
    .filter((item): item is { label: string; url: string } => !!item);
}

function isPersonalTrainingProgram(program: WPProgram): boolean {
  const areaNodes = program.programFields?.programArea?.nodes ?? [];
  return areaNodes.some((area) => {
    const slug = (area?.slug ?? "").toLowerCase();
    const name = (area?.name ?? "").toLowerCase();
    return slug.includes("personal-training") || name.includes("personal training");
  });
}

export default async function PersonalTrainingPage() {
  const data = await wpFetch<{
    page?: {
      title?: string | null;
      featuredImage?: {
        node?: { sourceUrl?: string | null; altText?: string | null } | null;
      } | null;
      personalTrainingDirectoryPageFields?: {
        heroImage?: {
          node?: { sourceUrl?: string | null; altText?: string | null } | null;
        } | null;
        subheader?: string | null;
      } | null;
    } | null;
    programs?: { nodes?: WPProgram[] | null } | null;
  }>(PERSONAL_TRAINING_PAGE_QUERY, { uri: "/personal-training", first: 60 });

  const rawFields = data?.page?.personalTrainingDirectoryPageFields ?? null;
  const fields = normalizeDirectoryData(rawFields);

  const ctas = normalizedAttachmentList(fields.attachments).slice(0, 2);
  const relatedPrograms = (data?.programs?.nodes ?? [])
    .filter((program): program is WPProgram => !!program?.slug && !!program?.title)
    .filter(isPersonalTrainingProgram)
    .slice(0, 6);

  const heroImage = data?.page?.personalTrainingDirectoryPageFields?.heroImage?.node?.sourceUrl ?? data?.page?.featuredImage?.node?.sourceUrl ?? "";
  const pageTitle = fields.header?.trim() || data?.page?.title?.trim() || "Personal Training";
  const subheader = data?.page?.personalTrainingDirectoryPageFields?.subheader?.trim() || "";
  const introBody =
    fields.body?.trim() ||
    "Get personalized support from expert trainers to build strength, improve confidence, and make progress you can sustain.";

  return (
    <main className="overflow-x-clip">
      <section className="relative mb-8 overflow-hidden py-6 md:mt-28">
        <div
          className="absolute inset-0"
          aria-hidden
          style={
            heroImage
              ? {
                  backgroundImage: `url(${heroImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,34,68,1) 0%, rgba(0,34,68,0.95) 10%, rgba(0,34,68,0.70) 30%, rgba(0,0,0,0) 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-20 mx-auto max-w-6xl px-8 pb-20 pt-10 md:px-12 md:py-16">
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:mt-8 md:text-6xl">
            {pageTitle}
          </h1>
          <p className="mb-10 mt-6 max-w-3xl text-base leading-relaxed text-neutral-100 md:text-lg">
            {subheader}
          </p>
          {ctas.length ? (
            <div className="flex flex-wrap gap-3">
              {ctas.map((cta) => (
                <a
                  key={cta.url}
                  href={cta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  {cta.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 120"
            className="-ml-px block h-10 w-[calc(100%+2px)] text-white md:h-16"
            preserveAspectRatio="none"
          >
            <path
              d="
                M-20,110
                C750,-90  800,120  1200,80
                S1420,0 1460,0
                L1460,0 L-20,0 Z
              "
              transform="translate(0 120) scale(1 -1)"
              fill="currentColor"
            />
          </svg>
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white" />
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-6">
        <h2 className="h2 text-gmcc-navy">Why Personal Training at Greater Midland?</h2>
        <p className="body mt-4 max-w-4xl whitespace-pre-line">{introBody}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Beginner Friendly", "Goal Driven", "Rehab and Recovery", "Flexible Scheduling"].map(
            (item) => (
              <div key={item} className="text-center">
                <img src={`/${item.replace(" ", "")}Icon.png`} alt={item} className="w-16 h-16" />
                <p className="font-heading text-lg font-semibold text-gmcc-navy">{item}</p>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="h2 text-gmcc-navy">Training Options</h2>
            <p className="body mt-2 text-neutral-700">
              Browse personal training options and check availability.
            </p>
          </div>
          {/* <a href="/programs?programArea=Personal%20Training" className="btn btn-primary">
            Explore Options
          </a> */}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relatedPrograms.map((program) => {
            const centers =
              program.programFields?.center?.nodes
                ?.map((center) => ({
                  slug: center?.slug ?? "",
                  title: center?.title ?? "",
                }))
                .filter((center) => center.slug && center.title) ?? [];
            const price = program.programFields?.priceFrom;

            return (
              <a
                key={program.slug ?? ""}
                href={`/programs/${program.slug}`}
                className="group card card-hover card-link flex flex-col overflow-hidden"
              >
                <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                  {program.featuredImage?.node?.sourceUrl ? (
                    <img
                      src={program.featuredImage.node.sourceUrl}
                      alt={program.featuredImage.node.altText ?? program.title ?? "Program"}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                </div>

                <div className="mt-5 flex min-h-0 flex-1 flex-col">
                  <h3 className="line-clamp-1 font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal">
                    {program.title}
                  </h3>

                  <CentersBadgesOneLine centers={centers} />

                  {program.programFields?.summary ? (
                    <p className="mb-3 mt-3 line-clamp-3 text-xs leading-6 text-neutral-600">
                      {program.programFields.summary}
                    </p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                    {typeof price === "number" ? (
                      <div className="text-sm">
                        <span className="text-neutral-500">From </span>
                        <span className="font-semibold text-neutral-900">${price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div />
                    )}
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

      <section className="relative mt-14 w-[100dvw] -ml-[calc(50dvw-50%)] overflow-x-clip">
        <div className="pointer-events-none w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 120"
            className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
            preserveAspectRatio="none"
          >
            <path
              d="
                M-20,110
                C750,-90  800,120  1200,80
                S1420,0 1460,0
                L1460,0 L-20,0 Z
              "
              transform="translate(0 120) scale(1 -1)"
              fill="var(--gmcc-navy)"
            />
          </svg>
        </div>

        <div className="-mt-px bg-gmcc-navy py-12 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="h2 text-white">Meet our Trainers!</h2>
            <p className="mt-2 max-w-3xl text-white/90">
              Learn from experienced coaches who personalize each session to your goals.
            </p>
            <div className="mt-6 rounded-2xl bg-gmcc-navy p-4 text-neutral-900 md:p-6">
              <PersonalTrainingDirectoryHeader
                data={{ trainers: fields.trainers ?? [] }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-none -mt-px w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 390 120"
            className="block h-14 w-full text-gmcc-navy md:hidden"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,98
                C78,62 135,54 195,74
                C255,96 322,88 390,60
                L390,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>

          <svg
            viewBox="0 0 1440 120"
            className="hidden h-16 w-full text-gmcc-navy md:block"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,110
                C300,-50  500,120  800,100
                S1000,0 1440,0
                L1440,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <h2 className="h2 text-gmcc-navy">FAQs</h2>
        <div className="mt-4">
          <Accordion
            defaultOpenIds={["faq-1"]}
            items={[
              {
                id: "faq-1",
                title: "How much does personal training cost?",
                content: (
                  <p>
                    Pricing varies by package and trainer. Browse options above, then inquire for
                    current session rates and availability.
                  </p>
                ),
              },
              {
                id: "faq-2",
                title: "How do I schedule sessions?",
                content: (
                  <p>
                    Select a program option and submit the inquiry form. Our team will contact you
                    to match trainer availability with your preferred schedule.
                  </p>
                ),
              },
              {
                id: "faq-3",
                title: "Do I need a membership?",
                content: (
                  <p>
                    Membership status depends on program type. Contact our team through the inquiry
                    form and we will walk you through the best path.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </section>

      <section className="relative mb-12 mt-12 overflow-hidden py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20">
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute bottom-0 left-8 w-56 select-none md:w-72"
            draggable={false}
          />
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute right-8 top-0 w-56 select-none md:w-72"
            draggable={false}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-6">
          <h2 className="h2 text-center text-gmcc-navy">Ready to Get Started?</h2>
          <p className="body mt-2 text-center text-neutral-700">Fill out the inquiry form below.</p>

          <form className="card mt-6 space-y-4 bg-neutral-100" aria-label="Personal training inquiry">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="pt-name" className="block text-sm text-neutral-700">
                  Name
                </label>
                <input
                  id="pt-name"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>
              <div>
                <label htmlFor="pt-email" className="block text-sm text-neutral-700">
                  Email
                </label>
                <input
                  id="pt-email"
                  type="email"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="pt-goal" className="block text-sm text-neutral-700">
                  Primary goal
                </label>
                <input
                  id="pt-goal"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>
              <div>
                <label htmlFor="pt-phone" className="block text-sm text-neutral-700">
                  Phone
                </label>
                <input
                  id="pt-phone"
                  type="tel"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pt-message" className="block text-sm text-neutral-700">
                Message
              </label>
              <textarea
                id="pt-message"
                rows={5}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
              />
            </div>

            <div className="flex justify-center pt-2">
              <button type="button" className="btn btn-primary min-w-36">
                Inquire Here
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}