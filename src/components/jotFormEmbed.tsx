"use client";

import Script from "next/script";
import { useEffect } from "react";
import {
  GENERAL_CONTACT_FORM_ID,
  GENERAL_CONTACT_FORM_URL,
} from "@/lib/constants";

const JOTFORM_EMBED_HANDLER =
  "https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js";

type JotFormEmbedProps = {
  title?: string;
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
};

declare global {
  interface Window {
    jotformEmbedHandler?: (selector: string, baseUrl: string) => void;
  }
}

const EMBED_SRC = `${GENERAL_CONTACT_FORM_URL}?isIframeEmbed=1`;

function initEmbedHandler(iframeId: string) {
  window.jotformEmbedHandler?.(
    `iframe[id='${iframeId}']`,
    "https://form.jotform.com/",
  );
}

export default function JotFormEmbed({
  title = "General Contact Form",
  className = "",
  iframeId = `JotFormIFrame-${GENERAL_CONTACT_FORM_ID}`,
  height = 539,
  autoResize = true,
  resizeKey,
}: JotFormEmbedProps) {
  useEffect(() => {
    if (!autoResize) return;
    initEmbedHandler(iframeId);
  }, [autoResize, iframeId, resizeKey]);

  return (
    <div className={className}>
      <iframe
        id={iframeId}
        title={title}
        src={EMBED_SRC}
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
      {autoResize ? (
        <Script
          src={JOTFORM_EMBED_HANDLER}
          strategy="afterInteractive"
          onLoad={() => initEmbedHandler(iframeId)}
        />
      ) : null}
    </div>
  );
}
