import ImageCarousel from "@/components/imageCarousel";
import { acfGalleryCarouselImages } from "@/lib/wp";

/**
 * Gallery carousel shown in the sidebar of the program and event detail pages.
 * Accepts the raw ACF `gallery` repeater value. Renders nothing when empty.
 */
export default function DetailGalleryCarousel({ gallery }: { gallery: unknown }) {
  const images = acfGalleryCarouselImages(gallery);

  if (images.length === 0) return null;

  return (
    <div>
      <ImageCarousel images={images} />
    </div>
  );
}
