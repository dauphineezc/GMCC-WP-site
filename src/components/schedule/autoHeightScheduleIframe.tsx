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
  /** Initial / fallback height until the embed reports its content height. */
  defaultHeight?: number;
};

const SCHEDULE_EMBED_ORIGIN = new URL(SCHEDULE_EMBED_BASE_URL).origin;

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
  minHeight = 320,
  defaultHeight = 1100,
}: AutoHeightScheduleIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(defaultHeight);

  const applyHeight = useCallback(
    (next: number) => {
      setHeight(Math.max(minHeight, Math.ceil(next)));
    },
    [minHeight],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== SCHEDULE_EMBED_ORIGIN) return;

      const nextHeight = parseScheduleHeightMessage(event.data);
      if (nextHeight == null) return;

      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;

      applyHeight(nextHeight);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applyHeight]);

  return (
    <iframe
      ref={iframeRef}
      id={id}
      src={src}
      title={title}
      className={`block w-full ${className}`.trim()}
      style={{
        height: `${height}px`,
        minHeight: `${minHeight}px`,
        border: 0,
        display: "block",
      }}
      loading="lazy"
      scrolling="no"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
