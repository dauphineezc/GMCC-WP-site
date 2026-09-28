"use client";

import { useEffect, useSyncExternalStore } from "react";

export type TextSize = "normal" | "large" | "xlarge";

export type A11yState = {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
};

export const A11Y_STORAGE_KEY = "gmcc_a11y";

export const DEFAULT_A11Y_STATE: A11yState = {
  textSize: "normal",
  highContrast: false,
  reduceMotion: false,
};

function applyA11yToDom(state: A11yState) {
  const root = document.documentElement;
  root.dataset.textSize = state.textSize;
  root.classList.toggle("a11y-contrast", state.highContrast);
  root.classList.toggle("reduce-motion", state.reduceMotion);
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(A11Y_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): A11yState {
  if (!raw) return DEFAULT_A11Y_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<A11yState>;
    return {
      textSize: parsed.textSize ?? DEFAULT_A11Y_STATE.textSize,
      highContrast: !!parsed.highContrast,
      reduceMotion: !!parsed.reduceMotion,
    };
  } catch {
    return DEFAULT_A11Y_STATE;
  }
}

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedState: A11yState = DEFAULT_A11Y_STATE;

/** Must return the same object until storage changes, or useSyncExternalStore loops. */
function getSnapshot(): A11yState {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parse(raw);
  }
  return cachedState;
}

function getServerSnapshot(): A11yState {
  return DEFAULT_A11Y_STATE;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === A11Y_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setA11yPreferences(
  next: A11yState | ((prev: A11yState) => A11yState),
) {
  const resolved = typeof next === "function" ? next(getSnapshot()) : next;
  try {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(resolved));
  } catch {}
  applyA11yToDom(resolved);
  listeners.forEach((listener) => listener());
}

/** Site accessibility settings shared by the desktop popover and the mobile menu. */
export function useA11yPreferences(): A11yState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyA11yToDom(state);
  }, [state]);

  return state;
}
