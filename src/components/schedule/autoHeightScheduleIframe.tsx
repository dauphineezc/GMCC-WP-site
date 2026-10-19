"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCHEDULE_EMBED_BASE_URL } from "@/lib/constants";

type AutoHeightScheduleIframeProps = {
  src: string;
  title: string;
  className?: string;
  id?: string;
  /** Minimum iframe height in pixels. */
  minHeight?: number;
  /** Initial height before the embed reports its content height. */
  defaultHeight?: number;
  /** Safety cap — ignores runaway resize feedback from the embed. */
  maxHeight?: number;
  /**
   * On lg+, cap auto-height at two `h-38` cards + gap-5 + 1rem shell padding
   * + 4px. Offset shell padding with `sm:-mb-4` / `lg:-mb-4`.
   */
  maxHeightLg?: boolean;
  /**
   * On lg+, force height to that same two-card stack size. Use when bottoms
   * must align with two event cards — the embed often reports a shorter height
   * because it scrolls activities internally.
   */
  fillHeightLg?: boolean;
  /**
   * Max pixel height below `lg` (typically sm–md). Auto-height still applies
   * up to this cap when set.
   */
  midMaxHeightPx?: number | null;
};

const SCHEDULE_EMBED_ORIGIN = new URL(SCHEDULE_EMBED_BASE_URL).origin;

function isAllowedScheduleEmbedOrigin(origin: string): boolean {
  if (origin === SCHEDULE_EMBED_ORIGIN) return true;
  if (typeof window !== "undefined" && origin === window.location.origin) return true;
  return false;
}

function parseScheduleHeightMessage(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { type?: unknown; height?: unknown };
  if (record.type !== "gmcc-schedule-height") return null;
  if (typeof record.height !== "number" || !Number.isFinite(record.height) || record.height <= 0) {
    return null;
  }
  return Math.ceil(record.height);
}

export default function AutoHeightScheduleIframe({
  src,
  title,
  className = "",
  id,
  minHeight = 100,
  defaultHeight = 400,
  maxHeight = 1400,
  maxHeightLg = false,
  fillHeightLg = false,
  midMaxHeightPx = null,
}: AutoHeightScheduleIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(defaultHeight);
  const midMax =
    typeof midMaxHeightPx === "number" && midMaxHeightPx > 0 ? midMaxHeightPx : null;

  const applyHeight = useCallback(
    (next: number) => {
      setHeight(Math.min(Math.max(minHeight, Math.ceil(next)), maxHeight));
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAllowedScheduleEmbedOrigin(event.origin)) return;

      const nextHeight = parseScheduleHeightMessage(event.data);
      if (nextHeight == null) return;

      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;

      applyHeight(nextHeight);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applyHeight]);

  // Full static strings so Tailwind emits the utilities.
  const heightClass = fillHeightLg
    ? "h-[var(--schedule-auto-height)] lg:h-[calc(var(--spacing)*85+4px)] lg:max-h-[calc(var(--spacing)*85+4px)] lg:min-h-0"
    : maxHeightLg
      ? "lg:max-h-[calc(var(--spacing)*85+4px)]"
      : "";

  return (
    <iframe
      ref={iframeRef}
      id={id}
      src={src}
      title={title}
      className={`block w-full ${heightClass} ${className}`.trim()}
      style={{
        ["--schedule-auto-height" as string]: `${height}px`,
        // When fillHeightLg is on, height comes from the lg:h-[…] class — an
        // inline height would override it and keep the iframe at the (shorter)
        // embed-reported size.
        ...(fillHeightLg
          ? {}
          : { height: `${height}px`, minHeight: `${minHeight}px` }),
        ...(midMax != null ? { maxHeight: `${midMax}px` } : {}),
        border: 0,
        display: "block",
      }}
      loading="lazy"
      scrolling="no"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
