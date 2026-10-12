"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import LoadingSpinner from "@/components/loading/loadingSpinner";
import {
  GENERAL_CONTACT_FORM_ID,
  GENERAL_CONTACT_FORM_URL,
} from "@/lib/constants";
import { getJotFormEmbedSrc, getJotFormIdFromUrl } from "@/lib/jotform";

const JOTFORM_EMBED_HANDLER =
  "https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js";

type JotFormEmbedProps = {
  formId?: string;
  /** Full JotForm URL (preserves prefill query params). Takes precedence over formId. */
  formUrl?: string;
  className?: string;
  /** Override iframe id when multiple embeds can appear on one page. */
  iframeId?: string;
  /** Initial height before JotForm's resize handler adjusts it. */
  height?: number | string;
  /**
   * When true (default), JotForm grows the iframe to fit the form so a parent
   * container can scroll (needed for reliable mobile scrolling).
   */
  autoResize?: boolean;
  /**
   * Bump this when the embed becomes visible (e.g. modal open) so JotForm
   * remeasures height after being hidden.
   */
  resizeKey?: string | number | boolean;
  /** When true (default), the embed gets a visible frame in high contrast mode. */
  framed?: boolean;
  /** The form's max width (px) as set in JotForm's builder; sizes the high contrast frame. */
  formWidth?: number;
};

declare global {
  interface Window {
    jotformEmbedHandler?: (selector: string, baseUrl: string) => void;
  }
}

function initEmbedHandler(iframeId: string) {
  window.jotformEmbedHandler?.(
    `iframe[id='${iframeId}']`,
    "https://form.jotform.com/",
  );
}

export default function JotFormEmbed( {
  formId = GENERAL_CONTACT_FORM_ID,
  formUrl,
  className = "",
  iframeId,
  height = 539,
  autoResize = true,
  resizeKey,
  framed = true,
  formWidth = 780,
}: JotFormEmbedProps) {
  const resolvedFormId =
    formId === GENERAL_CONTACT_FORM_ID && formUrl
      ? (getJotFormIdFromUrl(formUrl) ?? formId)
      : formId;
  const resolvedIframeId = iframeId ?? `JotFormIFrame-${resolvedFormId}`;
  const embedSrc = formUrl
    ? getJotFormEmbedSrc(formUrl)
    : resolvedFormId === GENERAL_CONTACT_FORM_ID
      ? `${GENERAL_CONTACT_FORM_URL}?isIframeEmbed=1`
      : `https://form.jotform.com/${resolvedFormId}?isIframeEmbed=1`;

  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);

  // A server-rendered iframe can finish loading before hydration.
  // Once the cross-origin form document is in place, contentDocument reads as null.
  const setFrameRef = useCallback((frame: HTMLDivElement | null) => {
    frameRef.current = frame;
    if (frame?.querySelector("iframe")?.contentDocument === null) setLoaded(true);
  }, []);

  // JotForm's embed handler replaces the iframe with a copy (new src), so React's
  // own iframe node and onLoad go stale. Track loading on the container instead.
  // Must run before initEmbedHandler so the replacement is observed.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    function onLoad(event: Event) {
      const iframe = event.target;
      if (
        iframe instanceof HTMLIFrameElement &&
        iframe.isConnected &&
        iframe.getAttribute("src") !== "about:blank"
      ) {
        setLoaded(true);
      }
    }

    const observer = new MutationObserver(() => setLoaded(false));
    frame.addEventListener("load", onLoad, true);
    observer.observe(frame, { childList: true });
    return () => {
      frame.removeEventListener("load", onLoad, true);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!autoResize) return;
    initEmbedHandler(resolvedIframeId);
  }, [autoResize, resolvedIframeId, resizeKey]);

  return (
    <div
      className={`relative ${framed ? "jotform-embed" : ""} ${className}`}
      style={{ "--jotform-width": `${formWidth}px` } as React.CSSProperties}
    >
      {loaded ? null : (
        <div
          role="status"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gmcc-navy"
        >
          <LoadingSpinner className="h-8 w-8" />
          <span className="text-sm font-medium tracking-wide">Loading form…</span>
        </div>
      )}
      <div
        ref={setFrameRef}
        className={`transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
      >
        <iframe
          id={resolvedIframeId}
          src={embedSrc ?? undefined}
          allow="geolocation; microphone; camera; fullscreen; payment"
          allowFullScreen
          className="block w-full border-0 bg-transparent"
          style={{
            minWidth: "100%",
            maxWidth: "100%",
            height,
            // Avoid an opaque iframe canvas when color-scheme differs from the parent.
            colorScheme: "normal",
          }}
          scrolling="no"
          {...{ allowtransparency: "true" }}
        />
      </div>
      {autoResize ? (
        <Script
          src={JOTFORM_EMBED_HANDLER}
          strategy="afterInteractive"
          onLoad={() => initEmbedHandler(resolvedIframeId)}
        />
      ) : null}
    </div>
  );
}
