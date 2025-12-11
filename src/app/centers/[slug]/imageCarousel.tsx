"use client";

import { useState } from "react";

type CarouselImage = {
  image: {
    sourceUrl: string;
    altText: string | null;
  } | null;
  cta: string | null;
  url: string | null;
};

type ImageCarouselProps = {
  images: CarouselImage[];
};

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
      {/* Image */}
      {currentImage?.image?.sourceUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentImage.image.sourceUrl}
          alt={currentImage.image.altText ?? ""}
          className="h-72 w-full object-cover sm:h-80"
        />
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 hover:bg-white p-2 shadow-md transition-colors"
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 hover:bg-white p-2 shadow-md transition-colors"
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </>
      )}

      {/* Bottom Controls - CTA Button and Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        {/* CTA Button */}
        {currentImage?.cta && currentImage?.url && (
          <a
            href={currentImage.url}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-lg font-large text-white hover:bg-emerald-700 transition-colors shadow-lg"
          >
            {currentImage.cta}
          </a>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

