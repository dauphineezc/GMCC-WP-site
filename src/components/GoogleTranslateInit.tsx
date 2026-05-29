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
  const initialised = useRef(false);

  // On first mount: escape old translate.goog proxy, or kick off in-browser GT.
  useEffect(() => {
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
    initialised.current = true;
  }, []);

  // Next.js navigates client-side (no full reload), so GT never sees new page
  // content. When the user follows a link while translation is active, force a
  // hard reload so the new page is translated from the start.
  useEffect(() => {
    if (!initialised.current) return;
    if (getGoogleTranslateLang() === "es") {
      window.location.reload();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <div id="google_translate_element" className="hidden" aria-hidden="true" />;
}
