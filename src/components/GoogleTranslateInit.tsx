"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  escapeLegacyTranslateProxy,
  getGoogleTranslateLang,
  initGoogleTranslateOnPage,
  isOnLegacyGoogleTranslateProxy,
} from "@/lib/googleTranslate";

export default function GoogleTranslateInit() {
  const pathname = usePathname();
  // Stores the pathname seen on the very first render so we can distinguish
  // "initial mount" from "the user actually navigated to a new page".
  const mountedPathname = useRef<string | null>(null);

  useEffect(() => {
    // ── Initial mount ────────────────────────────────────────────────────────
    if (mountedPathname.current === null) {
      mountedPathname.current = pathname;

      if (isOnLegacyGoogleTranslateProxy()) {
        escapeLegacyTranslateProxy();
        return;
      }
      if (getGoogleTranslateLang() === "es") {
        document.documentElement.classList.add("gmcc-translated");
        initGoogleTranslateOnPage();
      } else {
        document.documentElement.classList.remove("gmcc-translated");
      }
      return;
    }

    // ── Subsequent client-side navigation ────────────────────────────────────
    // Next.js routes without a full reload, so GT never sees the new content.
    // Force a hard reload so the incoming page gets translated from scratch.
    // We only act when the pathname has genuinely changed; this guard prevents
    // React strict-mode double-invocation from triggering an extra reload.
    if (mountedPathname.current !== pathname) {
      mountedPathname.current = pathname;
      if (getGoogleTranslateLang() === "es") {
        window.location.reload();
      }
    }
  // pathname is the only real dependency; the ref updates are side-effects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <div id="google_translate_element" className="hidden" aria-hidden="true" />;
}
