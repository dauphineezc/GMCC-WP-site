import type { ReactNode } from "react";
import Link from "next/link";

export type PhotoWaveHeaderFields = {
  header?: string | null;
  subheader?: string | null;
  heroImage?: {
    node?: { sourceUrl?: string | null; altText?: string | null } | null;
  } | null;
  primaryCta?: {
    ctaLabel?: string | null;
    cta?: string | null;
  } | null;
};

export type HeroCta = {
  label: string;
  url: string;
  /** "link" renders an <a>/<Link>; "button" renders a <button> — the consumer passes onClick via children if needed */
  variant?: "primary" | "secondary";
};

type PhotoWaveHeaderProps = {
  /** Resolved display title (ACF header, or page title, or default) */
  title: string;
  subheader?: string | null;
  imageUrl?: string | null;
  /** Optional CTA buttons rendered below the subheader */
  ctas?: HeroCta[];
  /** Extra content below subheader, inside the hero (rare) */
  children?: ReactNode;
};

/**
 * Shared hero layout for directory pages — background image, navy gradient, bottom wave.
 * GraphQL: resolve the WP page with `page(id: $pageUri, idType: URI)` — try `pageUriCandidatesForSlug()` in `src/lib/pageHeroFields.ts`.
 */
export default function PhotoWaveHeader({ title, subheader, imageUrl, ctas, children }: PhotoWaveHeaderProps) {
  return (
    <section className="relative mb-8 overflow-hidden md:mt-28 py-6">
      <div
        className="absolute inset-0"
        aria-hidden
        style={
          imageUrl
            ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,34,68,1) 0%, rgba(0,34,68,0.95) 10%, rgba(0,34,68,0.70) 30%, rgba(0,0,0,0) 70%)",
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0" aria-hidden />
      <div className="relative z-20 max-w-6xl px-8 pb-20 pt-10 md:py-16 md:px-12">
        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:mt-8 md:text-6xl">
          {title}
        </h1>

        {subheader ? (
          <p className="mt-6 mb-4 max-w-3xl text-base leading-relaxed text-neutral-100 md:text-lg">{subheader}</p>
        ) : null}

        {(ctas && ctas.length > 0) || children ? (
          <div className="mt-4 mb-6 flex flex-wrap items-center gap-3">
            {ctas?.map((cta) => (
              <Link
                key={cta.url}
                href={cta.url}
                className={cta.variant === "secondary" ? "btn btn-secondary" : "btn btn-tertiary"}
              >
                {cta.label}
              </Link>
            ))}
            {children}
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 120"
          className="-ml-px block h-10 w-[calc(100%+2px)] text-white md:h-16"
          preserveAspectRatio="none"
        >
          <path
            d="
              M-20,110
              C750,-90  800,120  1200,80
              S1420,0 1460,0
              L1460,0 L-20,0 Z
            "
            transform="translate(0 120) scale(1 -1)"
            fill="currentColor"
          />
        </svg>
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white" />
      </div>
    </section>
  );
}
