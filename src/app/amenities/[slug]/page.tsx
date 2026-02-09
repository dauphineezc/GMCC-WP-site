// src/app/amenities/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import ImageCarousel from "@/components/imageCarousel";

const AMENITY_BY_SLUG_QUERY = `
  query AmenityBySlug($slug: ID!) {
    amenity(id: $slug, idType: SLUG) {
      name
      slug
      description
      amenitiesFields {
        amenityImage1 { node { sourceUrl altText } }
        center1 { nodes { ... on Center { slug title } } }

        amenityImage2 { node { sourceUrl altText } }
        center2 { nodes { ... on Center { slug title } } }

        amenityImage3 { node { sourceUrl altText } }
        center3 { nodes { ... on Center { slug title } } }

        amenityImage4 { node { sourceUrl altText } }
        center4 { nodes { ... on Center { slug title } } }

        amenityImage5 { node { sourceUrl altText } }
        center5 { nodes { ... on Center { slug title } } }

        isService
        additionalInformation
        additionalImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

type AmenityPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AmenityPage(props: AmenityPageProps) {
  const { slug } = await props.params;

  const data = await wpFetch<any>(AMENITY_BY_SLUG_QUERY, { slug });
  const amenity = data?.amenity;

  if (!amenity) {
    return (
      <main className="mx-auto max-w-5xl section-y">
        <p className="body">Amenity not found.</p>
      </main>
    );
  }

  const af = amenity.amenitiesFields ?? {};

  // Collect all available images for the carousel
  const carouselImages: Array<{
    image: { sourceUrl: string; altText: string | null } | null;
    cta: string | null;
    url: string | null;
  }> = [];

  // Add center-specific images (amenityImage1-5)
  for (let i = 1; i <= 5; i++) {
    const imageNode = af[`amenityImage${i}` as keyof typeof af] as any;
    if (imageNode?.node?.sourceUrl) {
      carouselImages.push({
        image: {
          sourceUrl: imageNode.node.sourceUrl,
          altText: imageNode.node.altText ?? null,
        },
        cta: null,
        url: null,
      });
    }
  }

  // Add additional image if available
  if (af.additionalImage?.node?.sourceUrl) {
    carouselImages.push({
      image: {
        sourceUrl: af.additionalImage.node.sourceUrl,
        altText: af.additionalImage.node.altText ?? null,
      },
      cta: null,
      url: null,
    });
  }

  // Collect centers that have this amenity
  const centersWithAmenity: Array<{ slug: string; title: string }> = [];
  for (let i = 1; i <= 5; i++) {
    const centerNodes = (af[`center${i}` as keyof typeof af] as any)?.nodes ?? [];
    for (const center of centerNodes) {
      if (center?.slug && center?.title) {
        // Avoid duplicates
        if (!centersWithAmenity.some((c) => c.slug === center.slug)) {
          centersWithAmenity.push({ slug: center.slug, title: center.title });
        }
      }
    }
  }

  // Use description or additionalInformation for the description text
  const description = amenity.description || af.additionalInformation || null;

  // Strip HTML tags from description if needed
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const cleanDescription = description ? stripHtml(description) : null;

  return (
    <main>
      {/* Content Container */}
      <div className="mx-auto mt-32 max-w-6xl px-4 section-y stack-8">
        {/* Title Section */}
        <section className="stack-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="stack-2">
              <h1 className="h1">{amenity.name}</h1>
              {af.isService && (
                <span className="badge badge-teal">Service</span>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
          {/* LEFT COLUMN: Description */}
          <div className="stack-4">
            <h2 className="h2">Description</h2>
            {cleanDescription && (
              <article className="prose prose-sm max-w-none sm:prose-base">
                <p className="whitespace-pre-line">{cleanDescription}</p>
              </article>
            )}
          </div>

          {/* RIGHT COLUMN: Image Carousel */}
            {carouselImages.length > 0 && (
            <div className="w-full">
                <ImageCarousel images={carouselImages} />
            </div>
            )}
        </div>

        {/* Centers with this amenity */}
        {centersWithAmenity.length > 0 && (
          <section className="stack-4">
            <h2 className="h2">Available at</h2>
            <div className="flex flex-wrap gap-3">
              {centersWithAmenity.map((center) => (
                <a
                  key={center.slug}
                  href={`/centers/${center.slug}`}
                  className="card card-hover px-4 py-3"
                >
                  <span className="font-medium text-neutral-900 hover:text-gmcc-teal">
                    {center.title}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
