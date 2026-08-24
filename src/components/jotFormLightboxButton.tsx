"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import JotFormEmbed from "@/components/jotFormEmbed";

const DEFAULT_CLASS_NAME =
  "btn bg-gmcc-navy text-white hover:bg-gmcc-navy/80 mt-6 text-base px-8 py-3";

type JotFormLightboxButtonProps = {
  children?: ReactNode;
  className?: string;
  formId?: string;
};

export default function JotFormLightboxButton({
  children = "Contact Us",
  className = DEFAULT_CLASS_NAME,
  formId,
}: JotFormLightboxButtonProps) {
  const reactId = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  // Keep the iframe mounted after first open so partial form progress survives close/reopen.
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

  return (
    <>
      <button type="button" className={className} onClick={openModal}>
        {children}
      </button>

      {mounted ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${
            open ? "" : "pointer-events-none invisible"
          }`}
          role="dialog"
          aria-modal="true"
          hidden={!open}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex h-[min(90dvh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end bg-gmcc-navy px-4 py-3 text-white">

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/15 p-1.5 transition-colors hover:bg-white/25"
                aria-label={`Close form`}
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

            {/*
              Scroll the modal body (not the iframe). iOS Safari does not reliably
              scroll nested iframes; a tall auto-resized iframe inside an
              overflow container does.
            */}
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white touch-pan-y"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <JotFormEmbed
                formId={formId}
                iframeId={`JotFormIFrame-modal-${reactId}`}
                height={560}
                autoResize
                resizeKey={open}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
