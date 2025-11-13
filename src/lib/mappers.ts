import type { Program, ImageAsset } from "@/types/content";

const img = (node?: any): ImageAsset | undefined =>
  node ? { url: node.sourceUrl ?? node.url, alt: node.altText ?? node.alt } : undefined;

export function mapProgram(wp: any): Program {
  const f = wp.programFields ?? {};
  const hero = img(wp.featuredImage?.node) ?? f.heroImage;
  return {
    type: "program",
    version: "v1",
    id: wp.databaseId?.toString() ?? crypto.randomUUID(),
    slug: wp.slug,
    title: wp.title,
    summary: f.summary ?? "",
    heroImage: hero!,
    descriptionHtml: wp.content ?? f.descriptionHtml,
    offeringType: f.offeringType,
    ageRange: f.ageRange ?? undefined,
    skillLevel: f.skillLevel ?? undefined,
    duration: f.duration ?? undefined,
    priceFrom: f.priceFrom ?? undefined,
    benefits: f.benefits ?? [],
    whatToBring:
    typeof f.whatToBring === "string"
      ? f.whatToBring.split("\n").map((s: string) => s.trim()).filter(Boolean)
      : [],
    instructors: f.instructors ?? [],
    taxonomies: f.taxonomies ?? {},
    externalSchedule: f.externalSchedule ?? undefined,
    mediaGallery: f.mediaGallery ?? [],
    attachments: f.attachments ?? [],
    relatedPrograms: f.relatedPrograms ?? [],
    seo: f.seo ?? {},
    governance: f.governance ?? { owner: "Unknown", status: "Draft", reviewDate: new Date().toISOString().slice(0,10), contentCategory: "Core" },
    canonicalUrl: f.canonicalUrl ?? undefined,
    vanityPaths: f.vanityPaths ?? [],
  };
}
