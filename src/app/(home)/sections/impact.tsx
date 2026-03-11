"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Linkish = {
  title?: string | null;
  url?: string | null;
  target?: string | null;
};

type ImpactStat = {
  value?: string | null;
  label?: string | null;
  context?: string | null;
};

type ImpactSectionProps = {
  heading: string;
  body: string;
  stats: ImpactStat[];
  imageUrl: string | null;
  imageAlt: string;
  cta?: Linkish | null;
};

/**
 * Parse a stat value like "10,000+", "$5M", "95%" into its components.
 * Animate only the numeric portion and preserve any prefix/suffix.
 */
function parseStatValue(value: string): {
  prefix: string;
  number: number;
  suffix: string;
  hasCommas: boolean;
  hasNumber: boolean;
} {
  const trimmed = value.trim();

  // Match first numeric chunk with common locale separators:
  // commas, dots, spaces, no-break spaces, narrow no-break spaces, apostrophes.
  const match = trimmed.match(/^([^\d]*)(\d[\d,.\s\u00A0\u202F']*)(.*)$/);
  if (!match) {
    return { prefix: "", number: 0, suffix: trimmed, hasCommas: false, hasNumber: false };
  }

  const [, prefix, numStrRaw, suffix] = match;

  const hasCommas =
    numStrRaw.includes(",") ||
    numStrRaw.includes(".") ||
    /\s|\u00A0|\u202F/.test(numStrRaw);

  // Strip everything except digits so localized separators do not break parsing.
  const digitsOnly = numStrRaw.replace(/[^\d]/g, "");
  const number = digitsOnly ? parseInt(digitsOnly, 10) : 0;

  return { prefix, number, suffix, hasCommas, hasNumber: digitsOnly.length > 0 };
}

/**
 * Format a number with commas if the original value used separators.
 */
function formatNumber(num: number, hasCommas: boolean): string {
  return hasCommas ? num.toLocaleString("en-US") : String(num);
}

/**
 * Animated counter that ticks up once when the stats container is in view.
 * If there's no numeric value at all (e.g. "N/A"), it renders the original string.
 */
function AnimatedStat({ value, isInView }: { value: string; isInView: boolean }) {
  const { prefix, number, suffix, hasCommas, hasNumber } = parseStatValue(value);

  // Default to final value so SSR/slow clients still show real numbers.
  const [displayNum, setDisplayNum] = useState(number);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current || number === 0) return;

    hasAnimated.current = true;
    setDisplayNum(0);

    const durationMs = 1500;
    const steps = 60;
    const stepDuration = durationMs / steps;

    let currentStep = 0;
    const timer = window.setInterval(() => {
      currentStep += 1;

      // Ease-out for smoother finish.
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(easeOut * number);

      setDisplayNum(currentValue);

      if (currentStep >= steps) {
        window.clearInterval(timer);
        setDisplayNum(number);
      }
    }, stepDuration);

    return () => window.clearInterval(timer);
  }, [isInView, number]);

  if (!hasNumber) return <>{value}</>;

  return (
    <>
      {prefix}
      {formatNumber(displayNum, hasCommas)}
      {suffix}
    </>
  );
}

export default function ImpactSection({
  heading,
  body,
  stats,
  imageUrl,
  imageAlt,
  cta,
}: ImpactSectionProps) {
  /**
   * Only render the stats block if at least one stat has meaningful content.
   */
  const hasStats = useMemo(
    () => stats?.some((s) => (s?.value || "").trim() || (s?.label || "").trim()),
    [stats]
  );

  /**
   * Trigger stat animation once when the stats grid enters the viewport.
   */
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // animate once
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative z-10 -mb-10 overflow-x-clip pt-8 pb-0 md:-mb-12">
      <div className="relative z-30 mx-auto max-w-6xl px-4">
        {/* Stats block */}
        {hasStats ? (
          <div className="relative mb-8">
            {/* Navy backdrop behind the teal stat cards */}
            <div
              aria-hidden
              className="absolute -bottom-2 left-1/2 h-200 w-screen -translate-x-1/2 bg-gmcc-navy md:h-52"
            />

            <div ref={statsRef} className="relative z-10 grid w-full gap-8 px-6 pb-6 md:grid-cols-4">
              {stats.slice(0, 4).map((s, idx) => (
                <div key={idx} className="bg-gmcc-teal rounded-2xl shadow-lg p-6 text-center md:text-left">
                  <div className="text-4xl font-bold text-white">
                    <AnimatedStat value={s.value || ""} isInView={isInView} />
                  </div>
                  <div className="mb-4 mt-1 text-2xl font-bold text-white">{s.label}</div>
                  {s.context ? <div className="text-sm text-neutral-200 text-center">{s.context}</div> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Content + image */}
        <div className="grid gap-6 md:grid-cols-2 md:items-start pt-8">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h2 className="h2 mt-8 mb-0 text-3xl font-semibold tracking-wide text-gmcc-navy">{heading}</h2>

            {body ? <p className="mt-4 text-base leading-relaxed text-neutral-700">{body}</p> : null}

            {/* Centered under the blurb on mobile, aligned left on desktop */}
            {cta?.url ? (
              <div className="mt-6 flex w-full justify-center">
                <a href={cta.url} target={cta.target || undefined} className="btn btn-primary">
                  {cta.title || "Get involved"}
                </a>
              </div>
            ) : null}
          </div>

          <div className="relative z-30 translate-y-6 overflow-hidden md:translate-y-10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageAlt || ""}
                className="block h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="aspect-square bg-neutral-200" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom transition wave (responsive shapes for mobile/desktop) */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-10 w-full overflow-hidden leading-none md:-bottom-1">
        <svg
          viewBox="0 -12 390 132"
          className="block h-20 w-full text-white md:hidden"
          preserveAspectRatio="none"
        >
          <path
            d="
              M0,100
              C70,70 130,58 190,78
              C250,98 305,90 390,62
              L390,0 L0,0 Z
            "
            fill="currentColor"
          />
        </svg>

        <svg
          viewBox="0 -60 1440 180"
          className="hidden h-24 w-full text-white md:block"
          preserveAspectRatio="none"
        >
          <path
            d="
              M0,110
              C300,-50  500,120  800,100
              S1000,0 1440,0
              L1440,0 L0,0 Z
            "
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}
