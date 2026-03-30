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
        header
        subheader
        heroImage {
          node {
            sourceUrl
            altText
          }
        }
        
        bodyHeader
        body

        benefits {
          benefit1 {
            benefit
            benefitIcon {
              node {
                sourceUrl
                altText
              }
            }
          }
          benefit2 {
            benefit
            benefitIcon {
              node {
                sourceUrl
                altText
              }
            }
          }
          benefit3 {
            benefit
            benefitIcon {
              node {
                sourceUrl
                altText
              }
            }
          }
          benefit4 {
            benefit
            benefitIcon {
              node {
                sourceUrl
                altText
              }
            }
          }
        }

        trainingOptionsHeader
        trainingOptionsSubheader

        trainersHeader
        trainersSubheader
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

        faqs {
          faq1 {
            question
            answer
          }
          faq2 {
            question
            answer
          }
          faq3 {
            question
            answer
          }
          faq4 {
            question
            answer
          }
        }

        inquiryFormHeader
        inquiryFormSubheader
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
  const data = await wpFetch<any>(PERSONAL_TRAINING_PAGE_QUERY, {
    uri: "/personal-training",
    first: 60,
  });

  const rawFields = data?.page?.personalTrainingDirectoryPageFields ?? null;
  const fields = normalizeDirectoryData(rawFields);

  const ctas = normalizedAttachmentList(fields.attachments).slice(0, 2);
  const relatedPrograms = (data?.programs?.nodes ?? [])
    .filter((program: WPProgram): program is WPProgram => !!program?.slug && !!program?.title)
    .filter(isPersonalTrainingProgram)
    .slice(0, 6);

  const heroImage = data?.page?.personalTrainingDirectoryPageFields?.heroImage?.node?.sourceUrl ?? data?.page?.featuredImage?.node?.sourceUrl ?? "";
  const pageTitle = fields.header?.trim() || data?.page?.title?.trim() || "Personal Training";
  const subheader = data?.page?.personalTrainingDirectoryPageFields?.subheader?.trim() || "";
  const introBody =
    fields.body?.trim() ||
    "Get personalized support from expert trainers to build strength, improve confidence, and make progress you can sustain.";
  const rawBenefits = data?.page?.personalTrainingDirectoryPageFields?.benefits;
  const benefits = [rawBenefits?.benefit1, rawBenefits?.benefit2, rawBenefits?.benefit3, rawBenefits?.benefit4]
    .map((item: any) => ({
      label: (item?.benefit ?? "").trim(),
      iconUrl: item?.benefitIcon?.node?.sourceUrl ?? "",
      iconAlt: item?.benefitIcon?.node?.altText ?? "",
    }))
    .filter((item: { label: string; iconUrl: string; iconAlt: string }) => item.label || item.iconUrl);

    const trainingOptionsHeader = data?.page?.personalTrainingDirectoryPageFields?.trainingOptionsHeader ?? "Training Options";
    const trainingOptionsSubheader = data?.page?.personalTrainingDirectoryPageFields?.trainingOptionsSubheader ?? "Browse personal training options and check availability.";

    const trainersHeader = data?.page?.personalTrainingDirectoryPageFields?.trainersHeader ?? "Meet our Trainers!";
    const trainersSubheader = data?.page?.personalTrainingDirectoryPageFields?.trainersSubheader ?? "Learn from experienced coaches who personalize each session to your goals.";

    const inquiryFormHeader = data?.page?.personalTrainingDirectoryPageFields?.inquiryFormHeader ?? "Ready to Get Started?";
    const inquiryFormSubheader = data?.page?.personalTrainingDirectoryPageFields?.inquiryFormSubheader ?? "Fill out the inquiry form below.";

    const faqs = data?.page?.personalTrainingDirectoryPageFields?.faqs;
    const faqsList = [faqs?.faq1, faqs?.faq2, faqs?.faq3, faqs?.faq4]
    .map((item: any) => ({
      question: item?.question ?? "",
      answer: item?.answer ?? "",
    }))
    .filter((item: { question: string; answer: string }) => item.question || item.answer);

  const trainingOptionsOrder = [
    "individual training sessions",
    "buddy training sessions",
    "small group training sessions",
  ];

  const trainingOptions = (programs: WPProgram[]): WPProgram[] => {
    return programs
      .filter((program: WPProgram) => program.programFields?.programArea?.nodes?.some((area: { slug?: string | null; name?: string | null } | null) => area?.slug === "personal-training" || area?.name === "Personal Training"))
      .sort((a: WPProgram, b: WPProgram) => {
        const aIndex = trainingOptionsOrder.indexOf(String(a?.title ?? "").trim().toLowerCase());
        const bIndex = trainingOptionsOrder.indexOf(String(b?.title ?? "").trim().toLowerCase());
        const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        return normalizedA - normalizedB;
      });
  };

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
        <h2 className="h2 text-gmcc-navy">
          {data?.page?.personalTrainingDirectoryPageFields?.bodyHeader ?? "Why Personal Training at Greater Midland?"}
        </h2>
        <p className="body mt-4 max-w-6xl whitespace-pre-line">{introBody}</p>

        {benefits.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item) => (
              <div key={`${item.label}-${item.iconUrl}`} className="text-center">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt={item.iconAlt || item.label} className="mx-auto h-24 w-24" />
                ) : null}
                {item.label ? (
                  <p className="font-heading text-lg font-semibold text-gmcc-navy mt-2">{item.label}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="h2 text-gmcc-navy">{trainingOptionsHeader}</h2>
            <p className="body mt-2 text-neutral-700">
              {trainingOptionsSubheader}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainingOptions(relatedPrograms).map((program: WPProgram) => {
            const centers =
              program.programFields?.center?.nodes
                ?.map((center: { slug?: string | null; title?: string | null } | null) => ({
                  slug: center?.slug ?? "",
                  title: center?.title ?? "",
                }))
                .filter((center: { slug: string; title: string }) => center.slug && center.title) ?? [];
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
                        {program.title?.includes("Group") ? <span className="text-neutral-500"> per person</span> : null }
                        {program.title?.includes("Buddy") ? <span className="text-neutral-500"> per person</span> : null }
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
            <h2 className="h2 text-white">{trainersHeader}</h2>
            <p className="mt-2 max-w-3xl text-white/90">
              {trainersSubheader}
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
            items={ faqsList.map((item: { question: string; answer: string }) => ({
              id: item.question,
              title: item.question,
              content: <p>{item.answer}</p>,
            })) }
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
          <h2 className="h2 text-center text-gmcc-navy">{inquiryFormHeader}</h2>
          <p className="body mt-2 text-center text-neutral-700">{inquiryFormSubheader}</p>

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