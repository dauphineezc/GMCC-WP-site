// app/private-lessons/page.tsx

import Accordion from "@/components/accordion";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";
import { PersonalTrainingDirectoryHeader } from "@/components/programs/directory-sections/personalTrainingDirectoryHeader";
import type {
  DirectoryAttachment,
  DirectoryHeaderData,
  DirectoryTrainer,
} from "@/components/programs/directoryHeaderShared";
import { wpFetch } from "@/lib/wp";
import { PAGE_HERO_FIELDS_GRAPHQL } from "@/lib/pageHeroFields";
import { resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { normalizeTestimonials } from "@/components/testimonials";
import FeaturedTestimonialsCarousel from "@/components/featuredTestimonialsCarousel";

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
    offeringType?: string | null;
  } | null;
};

const PRIVATE_LESSONS_PAGE_QUERY = /* GraphQL */ `
  query PrivateLessonsPage($uri: ID!, $first: Int!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      privateLessonsDirectoryPageFields {
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

        lessonOptionsHeader
        lessonOptionsSubheader

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
        }

        contactHeader
        contactSubheader
        contactEmail

        testimonialsHeader
        testimonials {
          nodes {
            ... on Testimonial {
              id
              testimonialFields {
                quote
                personName
                personContext
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
          offeringType
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
    trainers,
  };
}

function normalizeOfferingTypes(offeringType: unknown): string[] {
  if (Array.isArray(offeringType)) {
    return offeringType.map((value) => String(value).trim().toLowerCase());
  }
  if (offeringType) {
    return [String(offeringType).trim().toLowerCase()];
  }
  return [];
}

function isLessonsTrainingOffering(offeringType: unknown): boolean {
  return normalizeOfferingTypes(offeringType).some(
    (value) => value === "lessons/training" || value === "lesson/training",
  );
}

function hasCenter(program: WPProgram, centerSlug: string): boolean {
  const slug = centerSlug.toLowerCase();
  return (
    program.programFields?.center?.nodes?.some(
      (center) => (center?.slug ?? "").toLowerCase() === slug,
    ) ?? false
  );
}

function isTennisLessonProgram(program: WPProgram): boolean {
  return (
    isLessonsTrainingOffering(program.programFields?.offeringType) &&
    hasCenter(program, "tennis-center")
  );
}

export default async function PrivateLessonsPage() {
  const data = await wpFetch<any>(PRIVATE_LESSONS_PAGE_QUERY, {
    uri: "/private-lessons",
    first: 60,
  });

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Private Lessons");

  const rawFields = data?.page?.privateLessonsDirectoryPageFields ?? null;
  const fields = normalizeDirectoryData(rawFields);

  const tennisLessonPrograms = (data?.programs?.nodes ?? [])
    .filter((program: WPProgram): program is WPProgram => !!program?.slug && !!program?.title)
    .filter(isTennisLessonProgram);

  const introBody =
    fields.body?.trim() ||
    "Get personalized support from expert trainers to build strength, improve confidence, and make progress you can sustain.";
  const rawBenefits = data?.page?.privateLessonsDirectoryPageFields?.benefits;
  const benefits = [rawBenefits?.benefit1, rawBenefits?.benefit2, rawBenefits?.benefit3, rawBenefits?.benefit4]
    .map((item: any) => ({
      label: (item?.benefit ?? "").trim(),
      iconUrl: item?.benefitIcon?.node?.sourceUrl ?? "",
      iconAlt: item?.benefitIcon?.node?.altText ?? "",
    }))
    .filter((item: { label: string; iconUrl: string; iconAlt: string }) => item.label || item.iconUrl);

    const lessonOptionsHeader = data?.page?.privateLessonsDirectoryPageFields?.lessonOptionsHeader ?? "Lesson Options";
    const lessonOptionsSubheader = data?.page?.privateLessonsDirectoryPageFields?.lessonOptionsSubheader ?? "Browse private lessons options and check availability.";

    const trainersHeader = data?.page?.privateLessonsDirectoryPageFields?.trainersHeader ?? "Meet our Trainers!";
    const trainersSubheader = data?.page?.privateLessonsDirectoryPageFields?.trainersSubheader ?? "Learn from experienced coaches who personalize each session to your goals.";

    const testimonialsHeader = data?.page?.privateLessonsDirectoryPageFields?.testimonialsHeader ?? "Testimonials";
    const featuredTestimonials = normalizeTestimonials(
      data?.page?.privateLessonsDirectoryPageFields?.testimonials?.nodes ?? [],
    );
    const contactHeader = data?.page?.privateLessonsDirectoryPageFields?.contactHeader ?? "Ready to Get Started?";
    const contactSubheader = data?.page?.privateLessonsDirectoryPageFields?.contactSubheader ?? "Fill out the contact form below.";
    const contactEmail = data?.page?.privateLessonsDirectoryPageFields?.contactEmail ?? "info@greatermidland.com";
    const faqs = data?.page?.privateLessonsDirectoryPageFields?.faqs;
    const faqsList = [faqs?.faq1, faqs?.faq2, faqs?.faq3]
    .map((item: any) => ({
      question: item?.question ?? "",
      answer: item?.answer ?? "",
    }))
    .filter((item: { question: string; answer: string }) => item.question || item.answer);

  const lessonOptions = (programs: WPProgram[]): WPProgram[] => {
    return [...programs].sort((a: WPProgram, b: WPProgram) =>
      String(a?.title ?? "").localeCompare(String(b?.title ?? ""), undefined, {
        sensitivity: "base",
      }),
    );
  };

  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} />

      <section className="mx-auto mt-16 max-w-6xl px-6">
        <h2 className="h2 text-gmcc-navy">
          {data?.page?.privateLessonsDirectoryPageFields?.bodyHeader ?? "Why Private Lessons at Greater Midland?"}
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

      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="h2 text-gmcc-navy">{lessonOptionsHeader}</h2>
            <p className="body mt-2 text-neutral-700">
              {lessonOptionsSubheader}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessonOptions(tennisLessonPrograms).slice(0, 6).map((program: WPProgram) => {
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

      <section id="trainers" className="relative mt-16 w-[100dvw] -ml-[calc(50dvw-50%)] overflow-x-clip">
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
            <p className="mt-2 text-white/90">
              {trainersSubheader}
            </p>
            <div className="mt-6 rounded-2xl bg-gmcc-navy p-4 text-neutral-900 md:p-6">
              <PersonalTrainingDirectoryHeader
                data={{ trainers: fields.trainers ?? [] }}
                className="w-full"
              />
            </div>
          </div>

        <div className="mx-auto mt-16 max-w-3xl px-0">
            <h2 className="h2 mb-8 text-center text-white">FAQs</h2>
            <Accordion
              variant="onDark"
              items={faqsList.map((item: { question: string; answer: string }) => ({
                id: item.question,
                title: item.question,
                content: <p className="body text-white/80">{item.answer}</p>,
              }))}
              allowMultiple
            />
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

      {featuredTestimonials.length > 0 ? (
        <section className="px-4 pt-16">
          <div className="mx-auto max-w-6xl">
            <div className="relative text-center">
              <h2 className="h2 text-gmcc-navy">{testimonialsHeader}</h2>
            </div>

            <figure className="mx-auto max-w-3xl">
              <div className="text-5xl mb-0 leading-none text-gmcc-teal/50">“</div>
              <FeaturedTestimonialsCarousel testimonials={featuredTestimonials} />
            </figure>
          </div>
        </section>
      ) : null}

      {/* CONTACT SECTION */}
      {(contactHeader || contactSubheader) ? (
        <section className="mx-auto pt-12 mt-16 mb-16 max-w-6xl px-6 text-center">
        {contactHeader ? <h2 className="h2 text-gmcc-navy">{contactHeader}</h2> : null}
        {contactSubheader ? (
          <p className="body mt-4 whitespace-pre-line text-neutral-700">{contactSubheader}</p>
        ) : null}
        <a
          href={`mailto:${contactEmail}`}
          className="btn bg-gmcc-navy text-white hover:bg-neutral-100 mt-6 text-base px-8 py-3"
          >
          Contact Us
        </a>
      </section>
      ) : null}
    </main>
  );
}