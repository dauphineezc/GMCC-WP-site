"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

/** Above sticky sidebar (z-10), fixed nav (z-50), and utility popovers (z-200). */
const OVERLAY_Z_CLASS = "z-[300]";

export type RaceResultLink = {
  label: string;
  href: string;
};

type RaceResultsButtonProps = {
  buttonLabel: string;
  links: RaceResultLink[];
  className?: string;
  /** Lightbox heading. Defaults to the button label. */
  dialogTitle?: string;
};

function usableLinks(links: RaceResultLink[]): RaceResultLink[] {
  return links.filter((link) => link.href.trim());
}

/**
 * One result opens that page directly. Several results open a lightbox
 * that lists each category link.
 */
export default function RaceResultsButton({
  buttonLabel,
  links,
  className = "btn btn-secondary",
  dialogTitle,
}: RaceResultsButtonProps) {
  const items = usableLinks(links);
  if (items.length === 0) return null;
  if (items.length === 1) {
    return (
      <a
        href={items[0].href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {buttonLabel}
      </a>
    );
  }

  return (
    <RaceResultsLightbox
      buttonLabel={buttonLabel}
      links={items}
      className={className}
      dialogTitle={dialogTitle || buttonLabel}
    />
  );
}

function RaceResultsLightbox({
  buttonLabel,
  links,
  className,
  dialogTitle,
}: {
  buttonLabel: string;
  links: RaceResultLink[];
  className: string;
  dialogTitle: string;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  function openModal() {
    setMounted(true);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const overlay = mounted
    ? createPortal(
        <div
          className={`fixed inset-0 ${OVERLAY_Z_CLASS} flex items-center justify-center bg-black/50 p-4 ${
            open ? "" : "pointer-events-none invisible"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          hidden={!open}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 bg-gmcc-navy px-5 py-3 text-white">
              <h3 id={titleId} className="text-lg font-semibold">
                {dialogTitle}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full bg-white/15 p-1.5 transition-colors hover:bg-white/25"
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
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <ul className="flex flex-col gap-2 p-5">
              {links.map((link, index) => (
                <li key={`${link.href}-${index}`}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-gmcc-navy transition-colors hover:border-gmcc-teal hover:text-gmcc-teal"
                  >
                    <span>{link.label.trim() || link.href}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={openModal}
        aria-haspopup="dialog"
      >
        {buttonLabel}
      </button>
      {overlay}
    </>
  );
}
