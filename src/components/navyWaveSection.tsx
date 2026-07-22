import type { ReactNode } from "react";

const TOP_WAVE_PATH =
  "M-20,110 C750,-90 800,120 1200,80 S1420,0 1460,0 L1460,0 L-20,0 Z";

export const BOTTOM_WAVE_MOBILE_PATH =
  "M0,98 C78,62 135,54 195,74 C255,96 322,88 390,60 L390,0 L0,0 Z";

export const BOTTOM_WAVE_DESKTOP_PATH =
  "M0,110 C300,-50 500,120 800,100 S1000,0 1440,0 L1440,0 L0,0 Z";

const FULL_BLEED_CLASS =
  "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip";

/** Inverted navy wave above a full-bleed navy band. */
export function NavyTopWave() {
  return (
    <div className="relative z-[1] pointer-events-none w-full overflow-hidden leading-none">
      <svg
        viewBox="0 0 1440 120"
        className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={TOP_WAVE_PATH}
          transform="translate(0 120) scale(1 -1)"
          fill="var(--gmcc-navy)"
        />
      </svg>
    </div>
  );
}

/** Bottom wave below a navy band (mobile + desktop paths). */
export function NavyBottomWave({
  fillClassName = "text-gmcc-navy",
  underfillClassName,
}: {
  fillClassName?: string;
  underfillClassName?: string;
}) {
  return (
    <WaveBottomStack
      fillClassName={fillClassName}
      underfillClassName={underfillClassName}
    />
  );
}

function WaveBottomFill({
  className,
  wrapperClassName = "relative z-[1] -mt-px",
}: {
  className: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={`pointer-events-none w-full overflow-hidden leading-none ${wrapperClassName}`}
    >
      <svg
        viewBox="0 0 390 120"
        className={`block h-14 w-full md:hidden ${className}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={BOTTOM_WAVE_MOBILE_PATH} fill="currentColor" />
      </svg>
      <svg
        viewBox="0 0 1440 120"
        className={`hidden h-16 w-full md:block ${className}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={BOTTOM_WAVE_DESKTOP_PATH} fill="currentColor" />
      </svg>
    </div>
  );
}

/** Navy scallops on top; optional underfill shows through the wave troughs (e.g. announcement red). */
function WaveBottomStack({
  fillClassName = "text-gmcc-navy",
  underfillClassName,
}: {
  fillClassName?: string;
  underfillClassName?: string;
}) {
  return (
    <div className="relative -mt-px w-full">
      {underfillClassName ? (
        <div
          className={`absolute inset-0 z-0 ${underfillClassName}`}
          aria-hidden
        />
      ) : null}
      <WaveBottomFill className={fillClassName} wrapperClassName="relative z-[1]" />
    </div>
  );
}

type NavyWaveSectionProps = {
  id?: string;
  className?: string;
  /** Classes on the navy band wrapper (default: bg-gmcc-navy text-white). */
  bandClassName?: string;
  /** Classes on the inner max-w-6xl content container. Set to false to render children directly in the band. */
  contentClassName?: string | false;
  topWave?: boolean;
  bottomWave?: boolean;
  /**
   * When true, only the top wave uses the full-bleed clip; the navy band sits below it at page width.
   * Used on tournaments browse section.
   */
  splitTopWave?: boolean;
  /**
   * Wrap waves + band in the full-bleed clip container. Set false when the section itself
   * is already full width (e.g. personal-training trainers band).
   */
  fullBleed?: boolean;
  /** Tailwind text-* class for bottom wave fill (defaults to navy). */
  bottomWaveFillClassName?: string;
  /** Fill visible through navy wave troughs (e.g. announcement red below a center bar). */
  bottomWaveUnderfillClassName?: string;
  children: ReactNode;
};

function NavyBand({
  bandClassName,
  contentClassName,
  children,
}: Pick<NavyWaveSectionProps, "bandClassName" | "contentClassName" | "children">) {
  const band = (
    <div className={`relative z-0 -mt-px bg-gmcc-navy text-white ${bandClassName ?? ""}`.trim()}>
      {contentClassName === false ? (
        children
      ) : (
        <div
          className={
            contentClassName ??
            "mx-auto w-full max-w-6xl px-6 pb-12 pt-8 md:pt-10"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
  return band;
}

/**
 * Full-bleed navy section with optional top/bottom wave SVGs.
 * Replaces the repeated wave + bg-gmcc-navy markup across marketing pages.
 */
export default function NavyWaveSection({
  id,
  className = "",
  bandClassName,
  contentClassName,
  topWave = true,
  bottomWave = true,
  bottomWaveFillClassName = "text-gmcc-navy",
  bottomWaveUnderfillClassName,
  splitTopWave = false,
  fullBleed = true,
  children,
}: NavyWaveSectionProps) {
  const sectionClass = `relative scroll-mt-24 ${topWave ? "section-gap" : "-mt-px" } ${bottomWave ? "mb-8" : ""} ${className}`.trim();
  const bottomWaveEl = bottomWave ? (
    <NavyBottomWave
      fillClassName={bottomWaveFillClassName}
      underfillClassName={bottomWaveUnderfillClassName}
    />
  ) : null;

  if (splitTopWave) {
    return (
      <section id={id} className={sectionClass}>
        <div className={FULL_BLEED_CLASS}>
          {topWave ? <NavyTopWave /> : null}
        </div>
        <NavyBand bandClassName={bandClassName} contentClassName={contentClassName}>
          {children}
        </NavyBand>
        {bottomWaveEl}
      </section>
    );
  }

  if (!fullBleed) {
    return (
      <section id={id} className={sectionClass}>
        {topWave ? <NavyTopWave /> : null}
        <NavyBand bandClassName={bandClassName} contentClassName={contentClassName}>
          {children}
        </NavyBand>
        {bottomWaveEl}
      </section>
    );
  }

  return (
    <section id={id} className={sectionClass}>
      <div className={FULL_BLEED_CLASS}>
        {topWave ? <NavyTopWave /> : null}
        <NavyBand bandClassName={bandClassName} contentClassName={contentClassName}>
          {children}
        </NavyBand>
        {bottomWaveEl}
      </div>
    </section>
  );
}
