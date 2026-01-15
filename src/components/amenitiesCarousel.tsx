"use client";

import { useState } from "react";

type AmenityImage = {
  name: string;
  slug: string;
  description?: string | null;
  image: {
    sourceUrl: string;
    altText: string | null;
  };
};

type AmenitiesCarouselProps = {
  amenities: AmenityImage[];
  title?: string;
};

export default function AmenitiesCarousel({ amenities, title = "Amenities" }: AmenitiesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  if (!amenities || amenities.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? amenities.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === amenities.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleImageClick = () => {
    if (currentAmenity?.description) {
      setShowModal(true);
    }
  };

  const currentAmenity = amenities[currentIndex];
  const hasDescription = !!currentAmenity?.description;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="relative overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
        {/* Image */}
        {currentAmenity?.image?.sourceUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentAmenity.image.sourceUrl}
            alt={currentAmenity.image.altText ?? currentAmenity.name}
            className={`h-56 w-full object-cover sm:h-64 ${hasDescription ? "cursor-pointer" : ""}`}
            onClick={handleImageClick}
          />
        )}
        {/* Click hint for items with description */}
        {hasDescription && (
          <div className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-1.5 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 text-neutral-600"
              onClick={handleImageClick}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </div>
        )}

        {/* Navigation Arrows */}
        {amenities.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 hover:bg-white p-1.5 shadow-md transition-colors"
              aria-label="Previous amenity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 hover:bg-white p-1.5 shadow-md transition-colors"
              aria-label="Next amenity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
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

        {/* Dots Indicator */}
        {amenities.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {amenities.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-6 bg-white shadow-md"
                    : "w-1.5 bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Go to amenity ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Amenity Name - Below carousel */}
      <p className="text-neutral-700 font-medium text-md text-center">
        {currentAmenity.name}
        {hasDescription && (
          <button
            onClick={() => setShowModal(true)}
            className="ml-2 text-blue-600 hover:underline text-xs font-normal"
          >
            Learn more
          </button>
        )}
      </p>

      {/* Modal for description */}
      {showModal && currentAmenity?.description && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            {currentAmenity.image?.sourceUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAmenity.image.sourceUrl}
                alt={currentAmenity.image.altText ?? currentAmenity.name}
                className="w-full h-48 object-cover"
              />
            )}

            {/* Modal Content */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {currentAmenity.name}
              </h3>
              <p className="text-neutral-700 text-sm whitespace-pre-line">
                {currentAmenity.description}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 rounded-full bg-white/90 hover:bg-white p-1.5 shadow-md transition-colors"
              aria-label="Close modal"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

