// app/private-lessons/page.tsx

import { PROGRAMS_ALL_AT_ONCE } from "@/lib/programsListQuery";
import { wpFetch } from "@/lib/wp";
import { collectNumberedFaqs } from "@/lib/acf";
import { CONTACT_EMAIL } from "@/lib/constants";
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

const PRIVATE_LESSONS_PAGE_QUERY = /* GraphQL */ `
  query PrivateLessonsPage($uri: ID!, $first: Int!) {
    page(id: $uri, idType: URI) {
      title
      featuredImage { node { sourceUrl altText } }
      ${PAGE_HERO_FIELDS_GRAPHQL}
      privateLessonsDirectoryPageFields {
        bodyHeader
        body
        ${LESSONS_BENEFITS_GQL}
        lessonOptionsHeader
        lessonOptionsSubheader
        trainersHeader
        trainersSubheader
        ${LESSONS_TRAINERS_GQL}
        ${LESSONS_FAQS_GQL}
        contactHeader
        contactSubheader
        contactEmail
        ${LESSONS_TESTIMONIALS_GQL}
      }
    }
    ${LESSONS_PROGRAMS_GQL}
  }
`;

export default async function PrivateLessonsPage() {
  const data = await wpFetch<any>(PRIVATE_LESSONS_PAGE_QUERY, {
    uri: "/private-lessons",
    first: PROGRAMS_ALL_AT_ONCE,
  });

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Private Lessons");
  const f = data?.page?.privateLessonsDirectoryPageFields ?? null;

  const programs = filterLessonsPrograms(
    data?.programs?.nodes,
    (area) => area.slug === "racquet-sports" || area.name === "racquet sports",
  ).sort((a: WPProgram, b: WPProgram) =>
    String(a?.title ?? "").localeCompare(String(b?.title ?? ""), undefined, { sensitivity: "base" }),
  );

  const contactHeader = f?.contactHeader ?? "Ready to Get Started?";
  const contactSubheader = f?.contactSubheader ?? "Fill out the contact form below.";
  const contactEmail = f?.contactEmail ?? CONTACT_EMAIL;

  return (
    <LessonsDirectory
      hero={hero}
      bodyHeader={f?.bodyHeader ?? "Why Private Lessons at Greater Midland?"}
      introBody={
        f?.body?.trim() ||
        "Get personalized support from expert trainers to build strength, improve confidence, and make progress you can sustain."
      }
      benefits={normalizeLessonsBenefits(f?.benefits)}
      optionsHeader={f?.lessonOptionsHeader ?? "Lesson Options"}
      optionsSubheader={
        f?.lessonOptionsSubheader ?? "Browse private lessons options and check availability."
      }
      programs={programs.slice(0, 6)}
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
        contactHeader || contactSubheader ? (
          <section className="page-section text-center">
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
        ) : null
      }
    />
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/private-lessons");
}
