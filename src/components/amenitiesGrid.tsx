"use client";

import Link from "next/link";
import { useState } from "react";
import type { AmenityDisplay } from "@/types/amenities";


type AmenitiesGridProps = {
  amenities: AmenityDisplay[];
  title?: string;
  numCols?: number;
};


export default function AmenitiesGrid({ amenities, title = "What we offer", numCols = 3 }: AmenitiesGridProps) {
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityDisplay | null>(null);
  const [showAll, setShowAll] = useState(false);


  if (!amenities || amenities.length === 0) return null;

  const sortedAmenities = [...amenities].sort((a, b) => {
    const featuredDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    if (featuredDiff !== 0) return featuredDiff;

    return a.name.localeCompare(b.name);
  });
  const maxVisibleItems = Math.max(1, numCols * 2);
  const hasHiddenAmenities = sortedAmenities.length > maxVisibleItems;
  const visibleAmenities = showAll ? sortedAmenities : sortedAmenities.slice(0, maxVisibleItems);

  const handleAmenityClick = (amenity: AmenityDisplay, forceOpen = false) => {
    if (forceOpen || amenity.description) {
      setSelectedAmenity(amenity);
    }
  };

  return (
    <div className="space-y-3">
      <div className="md:hidden">
        <div className="space-y-2">
          {visibleAmenities.map((amenity) => {
            const hasDescription = !!amenity.description;
            return (
              <button
                key={amenity.slug}
                type="button"
                onClick={() => handleAmenityClick(amenity, true)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left transition hover:border-gmcc-teal/60"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-base font-semibold text-gmcc-navy">{amenity.name}</span>
                  <span className="text-sm font-medium text-gmcc-teal">
                    {hasDescription ? "View details" : "View image"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`hidden gap-8 md:grid md:grid-cols-${numCols}`}>
        {visibleAmenities.map((amenity) => {
          const hasDescription = !!amenity.description;
          return (
            <div key={amenity.slug} className="relative card card-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="card-bleed relative aspect-[16/9] bg-neutral-100 overflow-hidden rounded-t-2xl">
              <img
                src={amenity.image.sourceUrl} 
                alt={amenity.image.altText ?? amenity.name} 
                className={`w-full h-full object-cover ${hasDescription ? "cursor-pointer" : ""}`}
                style={
                  amenity.image.objectPosition
                    ? { objectPosition: amenity.image.objectPosition }
                    : undefined
                }
                onClick={() => handleAmenityClick(amenity)}
              />
              </div>
              {/* Click hint for items with description */}
                {/* {hasDescription && (
                <div className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-1.5 shadow-md">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-neutral-600"
                    onClick={() => setSelectedAmenity(amenity)}
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                    </svg>
                </div>
                )} */}
              <div className="flex flex-col mt-4">
                <p className="text-lg font-semibold text-gmcc-navy flex items-center gap-2"><span className="items-start flex-1">{amenity.name}</span>
                {hasDescription && (
                  <button
                    onClick={() => setSelectedAmenity(amenity)}
                    className="btn btn-tertiary items-end justify-end"
                  >
                    Learn more
                  </button>
                )}
                </p>
                {amenity.centers && amenity.centers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2" aria-label="Available at these centers">
                    {amenity.centers.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/centers/${c.slug}`}
                        className="badge badge-grey no-underline transition-opacity hover:opacity-90"
                      >
                        {c.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasHiddenAmenities && (
        <div className="pt-4 flex justify-center items-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-gmcc-navy hover:underline text-sm font-semibold"
          >
            {showAll ? "Show less" : `Show more (${sortedAmenities.length - maxVisibleItems} more)`}
          </button>
        </div>
      )}

      {/* Modal for description */}
      {selectedAmenity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedAmenity(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            {selectedAmenity.image?.sourceUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedAmenity.image.sourceUrl}
                alt={selectedAmenity.image.altText ?? selectedAmenity.name}
                className="w-full h-48 object-cover"
                style={
                  selectedAmenity.image.objectPosition
                    ? { objectPosition: selectedAmenity.image.objectPosition }
                    : undefined
                }
              />
            )}

            {/* Modal Content */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gmcc-navy mb-3">
                {selectedAmenity.name}
              </h3>
              {selectedAmenity.description ? (
                <p className="text-neutral-700 text-sm whitespace-pre-line">
                  {selectedAmenity.description} {selectedAmenity.relevantLink && (
                    <a href={selectedAmenity.relevantLink} className="text-gmcc-teal hover:underline text-sm font-semibold">
                      {selectedAmenity.linkLabel ? `${selectedAmenity.linkLabel} →` : "Learn more →"}
                    </a>
                  )}
                </p>
              ) : (
                <p className="text-neutral-700 text-sm">More details coming soon for this amenity.</p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedAmenity(null)}
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