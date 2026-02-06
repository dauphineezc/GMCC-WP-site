"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useOutsideClick } from "./useOutsideClick";

type Lang = "en" | "es";

const LANG_COOKIE = "gmcc_preferred_lang";

function getCurrentLang(): Lang {
  if (typeof document === "undefined") return "en";
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [name, value] = c.trim().split("=");
    if (name === LANG_COOKIE && value === "es") return "es";
  }
  return "en";
}

function setLangCookie(lang: Lang) {
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
  document.cookie = `${LANG_COOKIE}=${lang}; expires=${expires}; path=/; SameSite=Lax`;
}

function isLocalhost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.")
  );
}

function isOnGoogleTranslate(): boolean {
  return window.location.hostname.includes("translate.goog");
}

function getOriginalUrl(): string {
  // Google Translate proxy URLs look like:
  // https://example-com.translate.goog/path?_x_tr_sl=en&_x_tr_tl=es...
  // We need to convert back to https://example.com/path
  const url = new URL(window.location.href);
  
  // Extract original hostname (convert hyphens back to dots, remove .translate.goog)
  const originalHost = url.hostname
    .replace(".translate.goog", "")
    .replace(/-/g, ".");
  
  // Remove Google Translate query params
  const cleanParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!key.startsWith("_x_tr_")) {
      cleanParams.set(key, value);
    }
  });
  
  const queryString = cleanParams.toString();
  return `https://${originalHost}${url.pathname}${queryString ? `?${queryString}` : ""}`;
}

function translateWithGoogle(targetLang: Lang): boolean {
  if (isLocalhost()) {
    // Can't use Google Translate on localhost
    return false;
  }

  if (targetLang === "en") {
    // If on translated page, go back to original
    if (isOnGoogleTranslate()) {
      window.location.href = getOriginalUrl();
      return true;
    }
    // Already on English, no action needed
    return true;
  } else {
    // Get the URL to translate (original if on Google Translate, current otherwise)
    const urlToTranslate = isOnGoogleTranslate() ? getOriginalUrl() : window.location.href;
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${targetLang}&u=${encodeURIComponent(urlToTranslate)}`;
    window.location.href = translateUrl;
    return true;
  }
}

export default function LanguagePopover({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [showLocalWarning, setShowLocalWarning] = useState(false);
  const [onLocalhost, setOnLocalhost] = useState(false);

  // Check if on localhost on mount
  useEffect(() => {
    setOnLocalhost(isLocalhost());
  }, []);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate fixed position when opening
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

  useOutsideClick([buttonRef as React.RefObject<HTMLElement>, panelRef as React.RefObject<HTMLElement>], () => setOpen(false), open);

  // Read current language on mount
  useEffect(() => {
    setLang(getCurrentLang());
  }, []);

  // Handle language change
  const handleLanguageChange = (newLang: Lang) => {
    setLangCookie(newLang);
    setLang(newLang);
    
    const success = translateWithGoogle(newLang);
    if (!success && newLang !== "en") {
      // On localhost, show warning but keep popover open
      setShowLocalWarning(true);
    } else {
      setOpen(false);
      setShowLocalWarning(false);
    }
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
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors font-secondary text-neutral-600 hover:text-gmcc-navy hover:bg-neutral-200/60 leading-none"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <IconGlobe className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{lang.toUpperCase()}</span>
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
              <IconX className="h-4 w-4 text-neutral-600" />
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

          {showLocalWarning ? (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                Translation is not available on localhost. It will work when deployed to production.
              </p>
            </div>
          ) : (
            <div className="mt-3 text-xs text-neutral-500">
              {onLocalhost 
                ? "Translation available in production only."
                : "You will be redirected to view translated content."
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconGlobe({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2c3 3 3 17 0 20" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2c-3 3-3 17 0 20" />
    </svg>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
