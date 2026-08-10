// app/personal-training/page.tsx

import { PROGRAMS_ALL_AT_ONCE } from "@/lib/programsListQuery";
import { wpFetch } from "@/lib/wp";
import { collectNumberedFaqs, WP_MEDIA_IMAGE_FIELDS } from "@/lib/acf";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import { normalizeTestimonials } from "@/components/testimonials";
import LessonsDirectory from "@/components/programs/lessonsDirectory";
import {
  filterLessonsPrograms,
  normalizeLessonsBenefits,
  normalizeLessonsTrainers,
  LESSONS_BENEFITS_GQL,
  LESSONS_FAQS_GQL,
  LESSONS_PROGRAMS_GQL,
  LESSONS_TESTIMONIALS_GQL,
  LESSONS_TRAINERS_GQL,
  type WPProgram,
} from "@/lib/programs/lessonsDirectory";

const PERSONAL_TRAINING_PAGE_QUERY = /* GraphQL */ `
  query PersonalTrainingPage($uri: ID!, $first: Int!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage { node { ${WP_MEDIA_IMAGE_FIELDS} } }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      personalTrainingDirectoryPageFields {
        bodyHeader
        body
        ${LESSONS_BENEFITS_GQL}
        trainingOptionsHeader
        trainingOptionsSubheader
        trainersHeader
        trainersSubheader
        ${LESSONS_TRAINERS_GQL}
        ${LESSONS_FAQS_GQL}
        ${LESSONS_TESTIMONIALS_GQL}
        inquiryFormHeader
        inquiryFormSubheader
      }
    }
    ${LESSONS_PROGRAMS_GQL}
  }
`;

const TRAINING_OPTIONS_ORDER = [
  "individual training sessions",
  "buddy training sessions",
  "small group training sessions",
];

export default async function PersonalTrainingPage() {
  const data = await wpFetch<any>(PERSONAL_TRAINING_PAGE_QUERY, {
    uri: "/personal-training",
    first: PROGRAMS_ALL_AT_ONCE,
  });

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Personal Training");
  const f = data?.page?.personalTrainingDirectoryPageFields ?? null;

  const programs = filterLessonsPrograms(
    data?.programs?.nodes,
    (area) => area.slug === "personal-training" || area.name === "personal training",
  ).sort((a: WPProgram, b: WPProgram) => {
    const aIndex = TRAINING_OPTIONS_ORDER.indexOf(String(a?.title ?? "").trim().toLowerCase());
    const bIndex = TRAINING_OPTIONS_ORDER.indexOf(String(b?.title ?? "").trim().toLowerCase());
    const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    return normalizedA - normalizedB;
  });

  const inquiryFormHeader = f?.inquiryFormHeader ?? "Ready to Get Started?";
  const inquiryFormSubheader = f?.inquiryFormSubheader ?? "Fill out the inquiry form below.";

  return (
    <LessonsDirectory
      hero={hero}
      bodyHeader={f?.bodyHeader ?? "Why Personal Training at Greater Midland?"}
      introBody={
        f?.body?.trim() ||
        "Get personalized support from expert trainers to build strength, improve confidence, and make progress you can sustain."
      }
      benefits={normalizeLessonsBenefits(f?.benefits)}
      optionsHeader={f?.trainingOptionsHeader ?? "Training Options"}
      optionsSubheader={
        f?.trainingOptionsSubheader ?? "Browse personal training options and check availability."
      }
      programs={programs}
      trainersHeader={f?.trainersHeader ?? "Meet our Trainers!"}
      trainersSubheader={
        f?.trainersSubheader ??
        "Learn from experienced coaches who personalize each session to your goals."
      }
      trainers={normalizeLessonsTrainers(f)}
      faqs={collectNumberedFaqs(f?.faqs, 3)}
      testimonialsHeader={f?.testimonialsHeader ?? "Testimonials"}
      testimonials={normalizeTestimonials(f?.testimonials?.nodes ?? [])}
      bottomSection={
        <section className="page-section relative overflow-hidden mb-12">
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
      }
    />
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/personal-training");
}
