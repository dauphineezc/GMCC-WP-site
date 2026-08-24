"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCHEDULE_EMBED_BASE_URL } from "@/lib/constants";

type ScheduleEmbedIframeProps = {
  src: string;
  title: string;
};

const SCHEDULE_EMBED_ORIGIN = new URL(SCHEDULE_EMBED_BASE_URL).origin;
const MOBILE_MAX_HEIGHT = 8000;

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

/**
 * Weekly drop-in / fitness calendar.
 * Mobile uses a tall iframe so nested 80vh scrollers inside the live embed
 * usually don't activate; the visit page scrolls instead. After the schedule
 * app reports `gmcc-schedule-height`, the iframe shrinks to content.
 */
export default function ScheduleEmbedIframe({ src, title }: ScheduleEmbedIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reportedHeight, setReportedHeight] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (!mobile) setReportedHeight(null);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const applyHeight = useCallback((next: number) => {
    setReportedHeight(Math.min(Math.max(320, Math.ceil(next)), MOBILE_MAX_HEIGHT));
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isMobile) return;
      if (!isAllowedScheduleEmbedOrigin(event.origin)) return;

      const nextHeight = parseScheduleHeightMessage(event.data);
      if (nextHeight == null) return;

      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;

      applyHeight(nextHeight);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applyHeight, isMobile]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      className="block w-full h-[4800px] md:h-[1200px]"
      style={{
        border: 0,
        ...(isMobile && reportedHeight ? { height: `${reportedHeight}px` } : {}),
      }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
