"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useOutsideClick } from "./useOutsideClick";
import {
  applyGoogleTranslate,
  getGoogleTranslateLang,
  isLocalhost,
  setPreferredLangCookie,
  type TranslateLang,
} from "@/lib/googleTranslate";

function getCurrentLang(): TranslateLang {
  return getGoogleTranslateLang();
}

export default function LanguagePopover({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<TranslateLang>("en");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [onLocalhost, setOnLocalhost] = useState(false);

  useEffect(() => {
    setOnLocalhost(isLocalhost());
  }, []);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePanelPosition();
      window.addEventListener("scroll", updatePanelPosition, { passive: true });
      window.addEventListener("resize", updatePanelPosition);
      return () => {
        window.removeEventListener("scroll", updatePanelPosition);
        window.removeEventListener("resize", updatePanelPosition);
      };
    }
  }, [open, updatePanelPosition]);

  useOutsideClick(
    [buttonRef as React.RefObject<HTMLElement>, panelRef as React.RefObject<HTMLElement>],
    () => setOpen(false),
    open
  );

  useEffect(() => {
    setLang(getCurrentLang());
  }, []);

  const handleLanguageChange = (newLang: TranslateLang) => {
    if (newLang === lang) {
      setOpen(false);
      return;
    }

    setPreferredLangCookie(newLang);
    setLang(newLang);
    applyGoogleTranslate(newLang);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const options = useMemo(
    () => [
      { value: "en" as const, label: "English", short: "EN" },
      { value: "es" as const, label: "Español", short: "ES" },
    ],
    []
  );

  return (
    <div className={`relative notranslate ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors font-secondary text-neutral-700 hover:text-gmcc-navy hover:bg-neutral-200/60 leading-none"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>Language</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Language selection"
          className="w-64 rounded-xl border border-neutral-200 bg-white shadow-lg p-3 z-[200]"
          style={panelStyle}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gmcc-navy">Language</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-neutral-100"
              aria-label="Close language menu"
            >
              <IconX className="h-4 w-4 text-neutral-700" />
            </button>
          </div>

          <div className="space-y-1">
            {options.map((opt) => {
              const active = lang === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleLanguageChange(opt.value)}
                  className={[
                    "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-gmcc-blue-light text-gmcc-navy font-medium"
                      : "hover:bg-neutral-50 text-neutral-800",
                  ].join(" ")}
                >
                  <span>{opt.label}</span>
                  {active && (
                    <svg className="w-4 h-4 text-gmcc-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-neutral-500">
            {onLocalhost
              ? "Translation reloads this page in your browser."
              : "Page content is translated in place; you stay on this site."}
          </div>
        </div>
      )}
    </div>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
