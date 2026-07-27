"use client";

import { useEffect, useState } from "react";

const A11Y_STORAGE_KEY = "gmcc_a11y";

function readSystemReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readSiteReduceMotion(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("reduce-motion");
}

function readStoredReduceMotion(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { reduceMotion?: boolean };
    return !!parsed.reduceMotion;
  } catch {
    return false;
  }
}

function readReduceMotionPreference(): boolean {
  return (
    readSystemReduceMotion() ||
    readSiteReduceMotion() ||
    readStoredReduceMotion()
  );
}

/** OS setting, site accessibility menu, or stored a11y preference. */
export function useReduceMotionPreference(): boolean {
  // Always start false so SSR and the first client render match (avoids hydration errors).
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const update = () => setReduced(readReduceMotionPreference());

    update();

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", update);

    const onStorage = (event: StorageEvent) => {
      if (event.key === A11Y_STORAGE_KEY) update();
    };
    window.addEventListener("storage", onStorage);

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("storage", onStorage);
      observer.disconnect();
    };
  }, []);

  return reduced;
}
