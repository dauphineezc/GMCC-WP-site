import type { ReactNode } from "react";
import Accordion from "@/components/accordion";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";
import { PersonalTrainingDirectoryHeader } from "@/components/programs/directory-sections/personalTrainingDirectoryHeader";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import NavyWaveSection from "@/components/navyWaveSection";
import FeaturedTestimonialsCarousel from "@/components/featuredTestimonialsCarousel";
import type { NormalizedTestimonial } from "@/components/testimonials";
import type { LessonBenefit, WPProgram } from "@/lib/programs/lessonsDirectory";
import type { DirectoryTrainer } from "./directoryHeaderShared";

type Faq = { question: string; answer: string };

type LessonsDirectoryProps = {
  hero: { title: string; subheader?: string | null; imageUrl?: string | null };
  bodyHeader: string;
  introBody: string;
  benefits: LessonBenefit[];
  optionsHeader: string;
  optionsSubheader: string;
  /** Programs already filtered, sorted, and (where applicable) sliced by the page. */
  programs: WPProgram[];
  trainersHeader: string;
  trainersSubheader: string;
  trainers: DirectoryTrainer[];
  faqs: Faq[];
  testimonialsHeader: string;
  testimonials: NormalizedTestimonial[];
  /** Page-specific bottom section (e.g. contact CTA or inquiry form). */
  bottomSection?: ReactNode;
};

function ProgramOptionCard({ program }: { program: WPProgram }) {
  const centers =
    program.programFields?.center?.nodes
      ?.map((center) => ({
        slug: center?.slug ?? "",
        title: center?.title ?? "",
      }))
      .filter((center) => center.slug && center.title) ?? [];
  const price = program.programFields?.priceFrom;
  const perPerson =
    program.title?.includes("Group") || program.title?.includes("Buddy");

  return (
    <a
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
              {perPerson ? <span className="text-neutral-500"> per person</span> : null}
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
}

/**
 * Shared layout for the "lessons / training" directory pages. Renders the hero,
 * intro + benefits, program options grid, trainers + FAQ band, and testimonials.
 * The page-specific footer (contact CTA vs inquiry form) is passed as `bottomSection`.
 */
export default function LessonsDirectory({
  hero,
  bodyHeader,
  introBody,
  benefits,
  optionsHeader,
  optionsSubheader,
  programs,
  trainersHeader,
  trainersSubheader,
  trainers,
  faqs,
  testimonialsHeader,
  testimonials,
  bottomSection,
}: LessonsDirectoryProps) {
  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader title={hero.title} subheader={hero.subheader} imageUrl={hero.imageUrl} />

      <section className="page-section">
        <h2 className="h2 text-gmcc-navy">{bodyHeader}</h2>
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

      <section className="page-section">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="h2 text-gmcc-navy">{optionsHeader}</h2>
            <p className="body mt-2 text-neutral-700">{optionsSubheader}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramOptionCard key={program.slug ?? ""} program={program} />
          ))}
        </div>
      </section>

      <NavyWaveSection
        id="trainers"
        className="w-[100dvw] -ml-[calc(50dvw-50%)] overflow-x-clip"
        fullBleed={false}
        bandClassName="py-12"
        contentClassName={false}
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="h2 text-white">{trainersHeader}</h2>
          <p className="mt-2 text-white/90">{trainersSubheader}</p>
          <div className="mt-6 rounded-2xl bg-gmcc-navy p-4 text-neutral-900 md:p-6">
            <PersonalTrainingDirectoryHeader data={{ trainers }} className="w-full" />
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl px-0">
          <h2 className="h2 mb-8 text-center text-white">FAQs</h2>
          <Accordion
            variant="onDark"
            items={faqs.map((item) => ({
              id: item.question,
              title: item.question,
              content: <p className="body text-white/80">{item.answer}</p>,
            }))}
            allowMultiple
          />
        </div>
      </NavyWaveSection>

      {testimonials.length > 0 ? (
        <section className="page-section">
          <div>
            <div className="relative text-center">
              <h2 className="h2 text-gmcc-navy">{testimonialsHeader}</h2>
            </div>

            <figure className="mx-auto max-w-3xl">
              <div className="text-5xl mb-0 leading-none text-gmcc-teal/50">“</div>
              <FeaturedTestimonialsCarousel testimonials={testimonials} />
            </figure>
          </div>
        </section>
      ) : null}

      {bottomSection}
    </main>
  );
}
