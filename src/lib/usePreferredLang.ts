"use client";

import { useSyncExternalStore } from "react";
import {
  applyGoogleTranslate,
  getGoogleTranslateLang,
  isLocalhost,
  setPreferredLangCookie,
  type TranslateLang,
} from "@/lib/googleTranslate";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function subscribeNever() {
  return () => {};
}

/** Current site language from the preference cookie ("en" during SSR). */
export function usePreferredLang(): TranslateLang {
  return useSyncExternalStore(subscribe, getGoogleTranslateLang, () => "en");
}

/** Persist the preference, run in-browser translation, and update every subscriber. */
export function changePreferredLang(lang: TranslateLang) {
  setPreferredLangCookie(lang);
  applyGoogleTranslate(lang);
  listeners.forEach((listener) => listener());
}

export function useIsLocalhost(): boolean {
  return useSyncExternalStore(subscribeNever, isLocalhost, () => false);
}
