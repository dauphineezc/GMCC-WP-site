"use client";

import Script from "next/script";
import { useEffect } from "react";
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

  useEffect(() => {
    if (!autoResize) return;
    initEmbedHandler(resolvedIframeId);
  }, [autoResize, resolvedIframeId, resizeKey]);

  return (
    <div className={className}>
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
