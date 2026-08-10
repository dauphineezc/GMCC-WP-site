import { acfAttachmentItems } from "@/lib/wp";
import { splitLines } from "@/lib/acf";
import { mediaFocalPositionCss } from "@/lib/mediaFocalPoint";

// adjust typing however you want; keeping it loose for now
export function mapProgram(wp: any) {

  const f = wp.programFields ?? {};

  // Relationship: Center CPT
  const centerNodes = f.center?.nodes ?? [];
  const centers = centerNodes
    .map((n: any) =>
      n && n.title
        ? { title: n.title as string, slug: n.slug as string }
        : null
    )
    .filter(Boolean) as { title: string; slug: string }[];

  // Relationship: Related Programs
  const relatedProgramNodes = f.relatedPrograms?.nodes ?? [];
  const relatedPrograms = relatedProgramNodes
    .map((n: any) => {
      if (!n || !n.title) return null;
      const featuredImage = n.featuredImage?.node;
      const programFields = n.programFields ?? {};
      // Map centers for related programs (from either programFields.center or n.center depending on query structure)
      const relatedCenterNodes = programFields.center?.nodes ?? n.center?.nodes ?? [];
      const relatedCenters = relatedCenterNodes
        .map((c: any) => c && c.title ? { title: c.title as string, slug: c.slug as string } : null)
        .filter(Boolean) as { title: string; slug: string }[];
      const objectPosition = mediaFocalPositionCss(featuredImage);
      return {
        title: n.title as string,
        slug: n.slug as string,
        summary: programFields.summary ?? "",
        heroImage: featuredImage
          ? {
              url: featuredImage.sourceUrl,
              alt: featuredImage.altText ?? "",
              ...(objectPosition ? { objectPosition } : {}),
            }
          : null,
        centers: relatedCenters,
      };
    })
    .filter(Boolean) as {
      title: string;
      slug: string;
      summary: string;
      heroImage: { url: string; alt: string; objectPosition?: string } | null;
      centers: { title: string; slug: string }[];
    }[];

  const taxonomies = {
    center: centers.map((c) => c.title),
    programArea:
      f.programArea?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [],
    audience:
      f.audience?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [],
    session:
      f.session?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [],
  };

  const attachments = acfAttachmentItems(f.attachments);

  const heroNode = wp.featuredImage?.node;
  const heroObjectPosition = mediaFocalPositionCss(heroNode);

  return {



    title: wp.title,
    slug: wp.slug,
    heroImage: heroNode
      ? {
          url: heroNode.sourceUrl,
          alt: heroNode.altText ?? "",
          ...(heroObjectPosition ? { objectPosition: heroObjectPosition } : {}),
        }
      : null,
    summary: f.summary ?? "",
    longDescription: f.longDescription ?? "",
    offeringType: Array.isArray(f.offeringType) ? f.offeringType : [],
    ageRange: f.ageRange ?? null,
    skillLevel: Array.isArray(f.skillLevel) ? f.skillLevel[0] : f.skillLevel ?? "",
    duration: f.duration ?? "",
    priceFrom: typeof f.priceFrom === "number" ? f.priceFrom : null,
    whatToBring: splitLines(f.whatToBring),
    benefits: splitLines(f.benefits),
    developmentalAssets: splitLines(f.developmentalAssets),
    instructors: splitLines(f.instructors),
    registrationSystem: f.registrationSystem ?? [],
    externalSchedule: f.externalSchedule ?? null,
    attachments: attachments,
    registrationInformation: f.registrationInformation ?? null,
    additionalInformationLinks: f.additionalInformationLinks ?? null,
    taxonomies,
    centers,
    relatedPrograms,
  };
}