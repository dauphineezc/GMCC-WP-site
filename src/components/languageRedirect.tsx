// src/components/languageRedirect.tsx
"use client";

import { useEffect } from "react";

const LANG_COOKIE = "gmcc_preferred_lang";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [cookieName, value] = c.trim().split("=");
    if (cookieName === name) return value || "";
  }
  return "";
}

function isLocalhost(): boolean {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.")
  );
}

function isOnGoogleTranslate(): boolean {
  return window.location.hostname.includes("translate.goog");
}

function getCurrentTranslateLang(): string | null {
  // Check if we're on Google Translate and what language
  const url = new URL(window.location.href);
  return url.searchParams.get("_x_tr_tl");
}

export default function LanguageRedirect() {
  useEffect(() => {
    // Don't run on localhost
    if (isLocalhost()) return;

    // Check user's language preference
    const preferredLang = getCookie(LANG_COOKIE);

    // If on Google Translate already
    if (isOnGoogleTranslate()) {
      const currentTranslateLang = getCurrentTranslateLang();
      
      // If user wants English but we're on translated page, redirect to original
      if (preferredLang === "en" || !preferredLang) {
        // Extract original URL and redirect
        const originalHost = window.location.hostname
          .replace(".translate.goog", "")
          .replace(/-/g, ".");
        
        const url = new URL(window.location.href);
        const cleanParams = new URLSearchParams();
        url.searchParams.forEach((value, key) => {
          if (!key.startsWith("_x_tr_")) {
            cleanParams.set(key, value);
          }
        });
        
        const queryString = cleanParams.toString();
        const originalUrl = `https://${originalHost}${url.pathname}${queryString ? `?${queryString}` : ""}`;
        window.location.replace(originalUrl);
        return;
      }
      
      // Already on correct translation, do nothing
      if (currentTranslateLang === preferredLang) return;
    }

    // If user prefers Spanish and we're not on Google Translate, redirect
    if (preferredLang === "es" && !isOnGoogleTranslate()) {
      const currentUrl = window.location.href;
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(currentUrl)}`;
      window.location.replace(translateUrl);
    }
  }, []);

  return null;
}
