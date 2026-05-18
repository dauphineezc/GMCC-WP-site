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
      return {
        title: n.title as string,
        slug: n.slug as string,
        summary: programFields.summary ?? "",
        heroImage: featuredImage
          ? {
              url: featuredImage.sourceUrl,
              alt: featuredImage.altText ?? "",
            }
          : null,
        centers: relatedCenters,
      };
    })
    .filter(Boolean) as {
      title: string;
      slug: string;
      summary: string;
      heroImage: { url: string; alt: string } | null;
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

  const splitLines = (v: unknown): string[] =>
    typeof v === "string"
      ? v.split("\n").map(s => s.trim()).filter(Boolean)
      : [];

  const connectionToNames = (conn: any): string[] =>
    conn?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [];

  const hero = wp.featuredImage?.node;

  // Build attachments array
  const attachments: { label: string; url: string }[] = [];
  const att = f.attachments ?? {};

  const maybePushAttachment = (groupKey: string, labelKey: string, fileKey: string) => {
    const g = att[groupKey];
    const fileNode = g?.[fileKey]?.node;
    const label = g?.[labelKey];
    if (fileNode?.mediaItemUrl && label) {
      attachments.push({ label, url: fileNode.mediaItemUrl });
    }
  };

  maybePushAttachment("attachment1", "attachment1Label", "attachment1File");
  maybePushAttachment("attachment2", "attachment2Label", "attachment2File");
  maybePushAttachment("attachment3", "attachment3Label", "attachment3File");
  maybePushAttachment("attachment4", "attachment4Label", "attachment4File");

  return {



    title: wp.title,
    slug: wp.slug,
    heroImage: wp.featuredImage?.node
      ? {
          url: wp.featuredImage.node.sourceUrl,
          alt: wp.featuredImage.node.altText ?? "",
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