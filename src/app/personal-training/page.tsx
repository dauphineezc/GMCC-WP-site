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
import JotFormEmbed from "@/components/jotFormEmbed";

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
            <p className="body mt-2 mb-4 text-center text-neutral-700">{inquiryFormSubheader}</p>
            <JotFormEmbed formUrl="https://form.jotform.com/262793795382070" formWidth={465} />
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
