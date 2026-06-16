import ImageCarousel from "@/components/imageCarousel";
import { acfGalleryPhotoNodes } from "@/lib/wp";

/**
 * Gallery carousel shown in the sidebar of the program and event detail pages.
 * Accepts the raw ACF `gallery` repeater value. Renders nothing when empty.
 */
export default function DetailGalleryCarousel({ gallery }: { gallery: unknown }) {
  const images = acfGalleryPhotoNodes(gallery)
    .filter((node) => Boolean(node.sourceUrl))
    .map((node) => ({
      image: {
        sourceUrl: node.sourceUrl as string,
        altText: node.altText ?? null,
      },
      cta: null,
      url: null,
    }));

  if (images.length === 0) return null;

  return (
    <div>
      <ImageCarousel images={images} />
    </div>
  );
}
