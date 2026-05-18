import type { ReactNode } from "react";
import Link from "next/link";

/** Raw CTA from WP / ACF (string link or WPGraphQL link object). */
export type HeroFieldsCtaRaw = {
  ctaLabel?: string | null;
  title?: string | null;
  label?: string | null;
  cta?: string | null | { url?: string | null; uri?: string | null };
  url?: string | null;
  uri?: string | null;
};

export type PhotoWaveHeaderFields = {
  /** Center CPT (renamed to avoid clash with campaign fields) */
  heroHeader?: string | null;
  heroSubheader?: string | null;
  heroPrimaryCta?: HeroFieldsCtaRaw | null;
  heroSecondaryCta?: HeroFieldsCtaRaw | null;
  /** Page CPT — typical WPGraphQL ACF names before hero* rename */
  header?: string | null;
  subheader?: string | null;
  primaryCta?: HeroFieldsCtaRaw | null;
  secondaryCta?: HeroFieldsCtaRaw | null;
  heroImage?: {
    node?: { sourceUrl?: string | null; mediaItemUrl?: string | null; altText?: string | null } | null;
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
  /** Wave SVG fill (Tailwind `text-*` → currentColor). Default white for pages whose content sits on white. */
  waveFillClassName?: string;
  /** 2px bar under the wave to hide subpixel seams; match `waveFillClassName` when docking to same-colored block. */
  waveEdgeClassName?: string;
  /** Whether to flush the bottom of the header with the content below it */
  flushBottom?: boolean;
};

/**
 * Shared hero layout for directory pages — background image, navy gradient, bottom wave.
 * GraphQL: resolve the WP page with `page(id: $pageUri, idType: URI)` — try `pageUriCandidatesForSlug()` in `src/lib/pageHeroFields.ts`.
 */
export default function PhotoWaveHeader({
  title,
  subheader,
  imageUrl,
  ctas,
  children,
  flushBottom = false,
  waveFillClassName = "text-white",
  waveEdgeClassName = "bg-white",
}: PhotoWaveHeaderProps) {
  return (
    <section
      className={`relative overflow-hidden lg:mt-28 z-10 py-6 ${flushBottom ? "mb-0" : "mb-8"}`}
    >
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

      {/* Mobile gradient — covers more of the header */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,34,68,1) 0%, rgba(0,34,68,0.95) 20%, rgba(0,34,68,0.60) 75%, rgba(0,0,0,.30) 90%)",
        }}
        aria-hidden="true"
      />
      {/* Desktop gradient — original */}
      <div
        className="absolute inset-0 hidden md:block"
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
          <p className={`mt-6 ${ctas && ctas.length > 0 ? "mb-4" : "mb-8"} max-w-3xl text-base leading-relaxed text-neutral-100 md:text-lg`}>{subheader}</p>
        ) : null}

        {(ctas && ctas.length > 0) || children ? (
          <div className="mt-6 mb-6 flex flex-wrap items-center gap-3">
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

      <div className={`pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none`}>
        <svg
          viewBox="0 0 1440 120"
          className={`-ml-px block h-10 w-[calc(100%+2px)] md:h-16 ${waveFillClassName}`}
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
        <div className={`absolute bottom-0 left-0 h-[2px] w-full ${waveEdgeClassName}`} />
      </div>
    </section>
  );
}
