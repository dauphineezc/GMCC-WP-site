"use client";

import { useEffect } from "react";

/**
 * Keeps the browser tab title in sync with client-only state (e.g. directory
 * filters). Next re-renders the metadata `<title>` on soft navigations and
 * `router.replace`, so the override is re-applied whenever `<head>` changes.
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;

    const apply = () => {
      if (document.title !== title) document.title = title;
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [title]);
}
