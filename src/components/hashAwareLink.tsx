"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { handleSamePageHashClick } from "@/lib/samePageHashClick";

type HashAwareLinkProps = ComponentProps<typeof Link>;

/**
 * Next.js `Link` that still scrolls on repeated same-page hash clicks
 * (e.g. hero CTA → `#browse-races` after the user scrolled back up).
 */
export default function HashAwareLink({ onClick, ...props }: HashAwareLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        handleSamePageHashClick(e);
      }}
    />
  );
}
