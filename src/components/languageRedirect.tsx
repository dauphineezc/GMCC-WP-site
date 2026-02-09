// src/components/languageRedirect.tsx
"use client";

import { useEffect } from "react";

const LANG_COOKIE = "gmcc_preferred_lang";
const REDIRECT_FLAG = "gmcc_lang_redirect_pending";

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
  // Check hostname for Google Translate proxy
  if (window.location.hostname.includes("translate.goog")) return true;
  if (window.location.hostname.includes("translate.google")) return true;
  
  // Check for Google Translate query params
  const url = new URL(window.location.href);
  if (url.searchParams.has("_x_tr_sl")) return true;
  
  return false;
}

function hasGoogleTranslateParams(): boolean {
  const url = new URL(window.location.href);
  return url.searchParams.has("_x_tr_sl") || url.searchParams.has("_x_tr_tl");
}

export default function LanguageRedirect() {
  useEffect(() => {
    // Don't run on localhost
    if (isLocalhost()) return;

    // Don't run if we're on any Google Translate page
    if (isOnGoogleTranslate()) return;
    
    // Don't run if we have Google Translate params (edge case)
    if (hasGoogleTranslateParams()) return;

    // Check if we just redirected (prevent loops)
    const redirectPending = sessionStorage.getItem(REDIRECT_FLAG);
    if (redirectPending) {
      // Clear the flag after a delay
      setTimeout(() => {
        sessionStorage.removeItem(REDIRECT_FLAG);
      }, 5000);
      return;
    }

    // Check user's language preference
    const preferredLang = getCookie(LANG_COOKIE);

    // If user prefers Spanish, redirect to Google Translate
    if (preferredLang === "es") {
      // Set flag to prevent loops
      sessionStorage.setItem(REDIRECT_FLAG, "true");
      
      const currentUrl = window.location.href;
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(currentUrl)}`;
      window.location.replace(translateUrl);
    }
  }, []);

  return null;
}
