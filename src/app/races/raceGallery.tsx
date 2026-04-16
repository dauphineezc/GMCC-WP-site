"use client";

import { useState, useEffect, useCallback } from "react";

type GalleryPhoto = {
  url: string;
  alt: string;
};

type PhotoSpan = {
  col: number;
  row: number;
  colStart?: number;
  rowStart?: number;
};

const MOSAIC_9: PhotoSpan[] = [
  { col: 1, row: 2, colStart: 1, rowStart: 1 }, // tall col 1
  { col: 1, row: 1, colStart: 2, rowStart: 1 }, // small
  { col: 1, row: 2, colStart: 3, rowStart: 1 }, // tall col 3
  { col: 1, row: 1, colStart: 2, rowStart: 2 }, // small
  { col: 1, row: 1, colStart: 1, rowStart: 3 }, // small
  { col: 1, row: 2, colStart: 2, rowStart: 3 }, // tall col 2
  { col: 1, row: 1, colStart: 3, rowStart: 3 }, // small
  { col: 1, row: 1, colStart: 1, rowStart: 4 }, // small
  { col: 1, row: 1, colStart: 3, rowStart: 4 }, // small
];

const MOSAIC_7: PhotoSpan[] = [
  { col: 2, row: 2, colStart: 1, rowStart: 1 }, // large
  { col: 1, row: 2, colStart: 3, rowStart: 1 }, // tall right
  { col: 1, row: 2, colStart: 1, rowStart: 3 }, // tall left
  { col: 1, row: 1, colStart: 2, rowStart: 3 }, // small
  { col: 1, row: 1, colStart: 3, rowStart: 3 }, // small
  { col: 1, row: 1, colStart: 2, rowStart: 4 }, // small
  { col: 1, row: 1, colStart: 3, rowStart: 4 }, // small
];

const MOSAIC_PATTERNS: Record<number, PhotoSpan[]> = {
  3:  [
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 1 },
  ],
  6:  [
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 1 },
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 1 },
  ],
  7:  MOSAIC_7,
  9:  MOSAIC_9,
  12: [
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 1 },
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 1 },
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 1 },
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 1 },
  ],
};

export default function RaceGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, close, prev, next]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  if (!photos.length) return null;

  const spans = MOSAIC_PATTERNS[photos.length] ?? photos.map(() => ({ col: 1, row: 1 }));

  return (
    <>
      {/* Mosaic grid — 3 equal columns, explicit placement */}
      <div
        className="mt-8 grid gap-2"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "200px",
        }}
      >
        {photos.map((photo, i) => {
          const span = spans[i] ?? { col: 1, row: 1 };
          return (
            <button
              key={`${photo.url}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gmcc-teal focus-visible:ring-offset-2"
              style={{
                gridColumn: span.colStart
                  ? `${span.colStart} / span ${span.col}`
                  : `span ${span.col}`,
                gridRow: span.rowStart
                  ? `${span.rowStart} / span ${span.row}`
                  : `span ${span.row}`,
              }}
              aria-label={photo.alt || `Race photo ${i + 1}`}
            >
              <img
                src={photo.url}
                alt={photo.alt || `Race photo ${i + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:brightness-90"
                loading="lazy"
                decoding="async"
              />
              {/* Hover overlay hint */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100">
                <div className="rounded-full bg-black/40 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zm4-8H7m4-4v8" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={close}
        >
          {/* Prevent click-through on the inner panel */}
          <div
            className="relative flex max-h-[90vh] max-w-5xl w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              className="absolute -top-10 right-0 text-white/80 hover:text-white focus:outline-none"
              aria-label="Close"
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].alt || `Race photo ${lightboxIndex + 1}`}
              className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
            />

            {/* Caption */}
            {photos[lightboxIndex].alt && (
              <p className="mt-3 text-sm text-white/75">{photos[lightboxIndex].alt}</p>
            )}

            {/* Prev / Next */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none"
                  aria-label="Previous photo"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none"
                  aria-label="Next photo"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Counter */}
            <p className="mt-2 text-xs text-white/50">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
