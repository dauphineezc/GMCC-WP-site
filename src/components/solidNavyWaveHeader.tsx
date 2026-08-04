import type { ReactNode } from "react";
import { WAVE_SVG_BLEED_CLASS, WaveEdgeBar } from "@/components/waveSeam";

type SolidNavyWaveHeaderProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  waveFillClassName?: string;
  /** Edge bar under the wave; match `waveFillClassName` (default white). */
  waveEdgeClassName?: string;
};

export default function SolidNavyWaveHeader({
  eyebrow,
  title,
  description,
  children,
  className = "",
  containerClassName = "",
  waveFillClassName = "text-white",
  waveEdgeClassName = "bg-white",
}: SolidNavyWaveHeaderProps) {
  return (
    <section className={`relative bg-gmcc-navy ${className}`}>
      <div className={`relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 md:pb-38 lg:pt-24 ${containerClassName}`}>
        {eyebrow ? <p className="text-base font-semibold tracking-wide text-white/90 md:text-lg">{eyebrow}</p> : null}
        {title ? <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h1> : null}
        {description ? (
          <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-white/90 md:text-xl">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>

      <div className="pointer-events-none absolute -bottom-[3px] left-0 z-20 w-full leading-none">
        <svg
          viewBox="0 0 1440 120"
          className={`${WAVE_SVG_BLEED_CLASS} h-12 ${waveFillClassName} md:h-20`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="
              M-20,110
              C750,-90  800,120  1200,80
              S1420,0 1460,0
              L1460,120 L-20,120 Z
            "
            fill="currentColor"
          />
        </svg>
        <WaveEdgeBar side="bottom" className={waveEdgeClassName} />
      </div>
    </section>
  );
}
