"use client";

import { useState } from "react";
import type { NormalizedTestimonial } from "@/components/testimonials";

type FeaturedTestimonialsCarouselProps = {
  testimonials: NormalizedTestimonial[];
};

function CarouselArrow({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-30 w-30 shrink-0 items-center justify-center rounded-full text-gmcc-teal/50 transition hover:text-gmcc-teal"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-25 w-25"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d={direction === "prev" ? "M15 6L9 12L15 18" : "M9 6L15 12L9 18"}
          stroke="currentColor"
          strokeWidth=".5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function FeaturedTestimonialsCarousel({
  testimonials,
}: FeaturedTestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!testimonials.length) return null;

  const current = testimonials[currentIndex];
  const hasMultiple = testimonials.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const showAttribution =
    current.personName || current.personContext || current.photoUrl;

  return (
    <div
      className={`relative ${hasMultiple ? "px-12 sm:px-14" : ""}`}
      aria-roledescription="carousel"
      aria-label="Featured testimonials"
    >
      {hasMultiple ? (
        <>
          <div className="absolute left-[-54px] top-[-28px] z-10">
            <CarouselArrow direction="prev" onClick={goToPrevious} label="Previous testimonial" />
          </div>
          <div className="absolute right-[-54px] top-[-28px] z-10">
            <CarouselArrow direction="next" onClick={goToNext} label="Next testimonial" />
          </div>
        </>
      ) : null}

      <div aria-live="polite">
        <blockquote className="mt-0 text-lg leading-relaxed text-neutral-700 text-center">
          {current.quote}
        </blockquote>

        {showAttribution ? (
          <figcaption className="mt-6 flex items-center justify-center gap-3 text-left">
            {current.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.photoUrl}
                alt={current.photoAlt}
                className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                style={
                  current.photoObjectPosition
                    ? { objectPosition: current.photoObjectPosition }
                    : undefined
                }
                loading="lazy"
                decoding="async"
              />
            ) : null}

            <div className="small text-center">
              {current.personName ? (
                <div className="font-semibold text-neutral-900">{current.personName}</div>
              ) : null}
              {current.personContext ? <div>{current.personContext}</div> : null}
            </div>
          </figcaption>
        ) : null}
      </div>
    </div>
  );
}
