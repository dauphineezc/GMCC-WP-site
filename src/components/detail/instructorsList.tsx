"use client";

import { useCallback, useEffect, useState } from "react";

export type ProgramInstructor = {
  name: string;
  jobTitle: string | null;
  bio: string | null;
  dotCardLink: string | null;
  photo: { url: string; alt: string; objectPosition?: string } | null;
};

type InstructorsListProps = {
  instructors: ProgramInstructor[];
};

function hasLightboxContent(instructor: ProgramInstructor) {
  return !!(instructor.photo?.url || instructor.bio?.trim() || instructor.dotCardLink?.trim());
}

function InfoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export default function InstructorsList({ instructors }: InstructorsListProps) {
  const [selected, setSelected] = useState<ProgramInstructor | null>(null);

  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selected, close]);

  if (!instructors.length) return null;

  return (
    <div>
      <h2 className="h2 pt-8 mb-3">Instructors</h2>
      <ul className="flex flex-row grid-cols-2 gap-12 body">
        {instructors.map((instructor, i) => {
          const canOpen = hasLightboxContent(instructor);
          return (
            <li key={`${instructor.name}-${i}`} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900">{instructor.name}</span>
                  {canOpen ? (
                    <button
                      type="button"
                      onClick={() => setSelected(instructor)}
                      className="inline-flex shrink-0 items-center justify-center rounded-full text-gmcc-navy/70 transition hover:text-gmcc-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-gmcc-navy focus-visible:ring-offset-2"
                      aria-label={`More information about ${instructor.name}`}
                    >
                      <InfoIcon />
                    </button>
                  ) : null}
                </div>
                {instructor.jobTitle ? (
                  <p className="text-sm text-neutral-600">{instructor.jobTitle}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="instructor-lightbox-title"
            className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.photo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photo.url}
                alt={selected.photo.alt || selected.name}
                className="h-82 w-full object-cover"
                style={
                  selected.photo.objectPosition
                    ? { objectPosition: selected.photo.objectPosition }
                    : undefined
                }
              />
            ) : null}

            <div className="p-6">
              <h3
                id="instructor-lightbox-title"
                className="text-xl font-semibold text-gmcc-navy"
              >
                {selected.name}
              </h3>
              {selected.jobTitle ? (
                <p className="mt-1 text-sm italic text-neutral-600">{selected.jobTitle}</p>
              ) : null}
              {selected.bio?.trim() ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {selected.bio.trim()}
                </p>
              ) : null}
              {selected.dotCardLink?.trim() ? (
                <p className="mt-4">
                  <a
                    href={selected.dotCardLink.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gmcc-teal hover:underline"
                  >
                    View Dot Card →
                  </a>
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 shadow-md transition-colors hover:bg-white"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
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
      ) : null}
    </div>
  );
}
