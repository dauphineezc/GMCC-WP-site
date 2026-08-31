"use client";

import type { ReactNode } from "react";
import JotFormLightboxButton from "@/components/jotFormLightboxButton";
import { getJotFormIdFromUrl } from "@/lib/jotform";

type JotFormLinkProps = {
  href?: string | null;
  fallbackHref?: string;
  className?: string;
  children: ReactNode;
};

/** Renders a JotForm link as a lightbox trigger; falls back to a normal anchor. */
export default function JotFormLink({
  href,
  fallbackHref = "#contact",
  className,
  children,
}: JotFormLinkProps) {
  const link = href ?? fallbackHref;
  const jotFormId = href ? getJotFormIdFromUrl(href) : null;

  if (jotFormId && href) {
    return (
      <JotFormLightboxButton formId={jotFormId} formUrl={href} className={className}>
        {children}
      </JotFormLightboxButton>
    );
  }

  return (
    <a href={link} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
