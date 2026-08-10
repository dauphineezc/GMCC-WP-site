import type { DirectoryTrainer } from "@/components/programs/directoryHeaderShared";
import { mediaFocalPositionCss, WP_MEDIA_IMAGE_FIELDS } from "@/lib/mediaFocalPoint";

/**
 * Shared data layer for the near-identical "lessons / training" directory pages
 * (`/personal-training`, `/private-lessons`). Both query the same `programs`
 * collection + an ACF field group with the same benefits/trainers/faqs/testimonials
 * shape, then filter by program area.
 */

export type WPProgram = {
  slug?: string | null;
  title?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
      focalPointX?: number | string | null;
      focalPointY?: number | string | null;
      hasCustomFocalPoint?: boolean | null;
    } | null;
  } | null;
  programFields?: {
    summary?: string | null;
    priceFrom?: number | null;
    center?: {
      nodes?: Array<{ slug?: string | null; title?: string | null } | null> | null;
    } | null;
    offeringType?: string | string[] | null;
    programArea?: {
      nodes?: Array<{ slug?: string | null; name?: string | null } | null> | null;
    } | null;
  } | null;
};

export type LessonBenefit = {
  label: string;
  iconUrl: string;
  iconAlt: string;
};

/** ACF benefits repeater (benefit1–benefit4) selection set. */
export const LESSONS_BENEFITS_GQL = /* GraphQL */ `
  benefits {
    benefit1 { benefit benefitIcon { node { ${WP_MEDIA_IMAGE_FIELDS} } } }
    benefit2 { benefit benefitIcon { node { ${WP_MEDIA_IMAGE_FIELDS} } } }
    benefit3 { benefit benefitIcon { node { ${WP_MEDIA_IMAGE_FIELDS} } } }
    benefit4 { benefit benefitIcon { node { ${WP_MEDIA_IMAGE_FIELDS} } } }
  }
`;

/** ACF trainers relationship (StaffProfile) selection set. */
export const LESSONS_TRAINERS_GQL = /* GraphQL */ `
  trainers {
    nodes {
      ... on StaffProfile {
        title
        featuredImage { node { ${WP_MEDIA_IMAGE_FIELDS} } }
        staffProfilesFields { title bio }
      }
    }
  }
`;

/** ACF faqs repeater (faq1–faq3) selection set. */
export const LESSONS_FAQS_GQL = /* GraphQL */ `
  faqs {
    faq1 { question answer }
    faq2 { question answer }
    faq3 { question answer }
  }
`;

/** ACF testimonials relationship selection set. */
export const LESSONS_TESTIMONIALS_GQL = /* GraphQL */ `
  testimonialsHeader
  testimonials {
    nodes {
      ... on Testimonial {
        id
        testimonialFields { quote personName personContext }
      }
    }
  }
`;

/** Top-level `programs` query block shared by both directory pages. */
export const LESSONS_PROGRAMS_GQL = /* GraphQL */ `
  programs(first: $first, where: { stati: PUBLISH }) {
    nodes {
      slug
      title
      featuredImage { node { ${WP_MEDIA_IMAGE_FIELDS} } }
      programFields {
        summary
        priceFrom
        center { nodes { ... on Center { slug title } } }
        offeringType
        programArea { nodes { slug name } }
      }
    }
  }
`;

function normalizeOfferingTypes(offeringType: unknown): string[] {
  if (Array.isArray(offeringType)) {
    return offeringType.map((value) => String(value).trim().toLowerCase());
  }
  if (offeringType) {
    return [String(offeringType).trim().toLowerCase()];
  }
  return [];
}

export function isLessonsTrainingOffering(offeringType: unknown): boolean {
  return normalizeOfferingTypes(offeringType).some(
    (value) => value === "lessons/training" || value === "lesson/training",
  );
}

/** Predicate over a single program area's (slug, name) pair. */
export type ProgramAreaPredicate = (area: { slug: string; name: string }) => boolean;

/**
 * Keep only "lessons/training" programs whose program area matches `areaMatches`.
 */
export function filterLessonsPrograms(
  programs: unknown,
  areaMatches: ProgramAreaPredicate,
): WPProgram[] {
  return ((programs as WPProgram[] | null | undefined) ?? [])
    .filter((program): program is WPProgram => !!program?.slug && !!program?.title)
    .filter((program) => {
      if (!isLessonsTrainingOffering(program.programFields?.offeringType)) return false;
      const areaNodes = program.programFields?.programArea?.nodes ?? [];
      return areaNodes.some((area) =>
        areaMatches({
          slug: (area?.slug ?? "").toLowerCase(),
          name: (area?.name ?? "").toLowerCase(),
        }),
      );
    });
}

/** Normalize the ACF trainers relationship into the shared DirectoryTrainer shape. */
export function normalizeLessonsTrainers(rawFieldGroup: any): DirectoryTrainer[] {
  const trainerNodes = rawFieldGroup?.trainers?.nodes ?? [];
  return trainerNodes
    .map((trainer: any) => {
      const photoNode = trainer?.featuredImage?.node;
      const objectPosition = mediaFocalPositionCss(photoNode);
      return {
        name: trainer?.title ?? null,
        photo: photoNode
          ? {
              sourceUrl: photoNode.sourceUrl ?? null,
              altText: photoNode.altText ?? null,
              ...(objectPosition ? { objectPosition } : {}),
            }
          : null,
        jobTitle: trainer?.staffProfilesFields?.title ?? null,
        bio: trainer?.staffProfilesFields?.bio ?? null,
      };
    })
    .filter(
      (trainer: DirectoryTrainer) =>
        !!trainer.name || !!trainer.jobTitle || !!trainer.photo?.sourceUrl || !!trainer.bio,
    );
}

/** Normalize the ACF benefits repeater (benefit1–benefit4) into a flat list. */
export function normalizeLessonsBenefits(rawBenefits: any): LessonBenefit[] {
  return [rawBenefits?.benefit1, rawBenefits?.benefit2, rawBenefits?.benefit3, rawBenefits?.benefit4]
    .map((item: any) => ({
      label: (item?.benefit ?? "").trim(),
      iconUrl: item?.benefitIcon?.node?.sourceUrl ?? "",
      iconAlt: item?.benefitIcon?.node?.altText ?? "",
    }))
    .filter((item) => item.label || item.iconUrl);
}
