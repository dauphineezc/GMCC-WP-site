"use client";

import { useEffect } from "react";

export function useOutsideClick(
  refs: Array<React.RefObject<HTMLElement>>,
  onOutside: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const inside = refs.some((r) => r.current && r.current.contains(target));
      if (!inside) onOutside();
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [refs, onOutside, enabled]);
}
