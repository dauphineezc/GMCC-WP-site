import type { ReactNode } from "react";

type SolidNavyWaveHeaderProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  waveFillClassName?: string;
};

export default function SolidNavyWaveHeader({
  eyebrow,
  title,
  description,
  children,
  className = "",
  containerClassName = "",
  waveFillClassName = "text-white",
}: SolidNavyWaveHeaderProps) {
  return (
    <section className={`relative overflow-hidden bg-gmcc-navy ${className}`}>
      <div className={`relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 md:pb-38 lg:pt-24 ${containerClassName}`}>
        {eyebrow ? <p className="text-base font-semibold tracking-wide text-white/90 md:text-lg">{eyebrow}</p> : null}
        {title ? <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h1> : null}
        {description ? (
          <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-white/90 md:text-xl">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 120"
          className={`-mb-px -ml-px block h-12 w-[calc(100%+2px)] ${waveFillClassName} md:h-20`}
          preserveAspectRatio="none"
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
      </div>
    </section>
  );
}
