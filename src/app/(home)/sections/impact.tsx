"use client";

import { useEffect, useRef, useState } from "react";

type Linkish = { title?: string | null; url?: string | null; target?: string | null };

/**
 * Parse a stat value like "10,000+", "$5M", "95%" into its components
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
  // commas, dots, spaces, no-break spaces, and apostrophes.
  const match = trimmed.match(/^([^\d]*)(\d[\d,.\s\u00A0\u202F']*)(.*)$/);
  if (!match) {
    return { prefix: "", number: 0, suffix: trimmed, hasCommas: false, hasNumber: false };
  }
  const [, prefix, numStrRaw, suffix] = match;
  const hasCommas = numStrRaw.includes(",") || numStrRaw.includes(".") || /\s|\u00A0|\u202F/.test(numStrRaw);

  // Strip everything except digits so localized separators do not break parsing.
  const digitsOnly = numStrRaw.replace(/[^\d]/g, "");
  const number = digitsOnly ? parseInt(digitsOnly, 10) : 0;

  return { prefix, number, suffix, hasCommas, hasNumber: digitsOnly.length > 0 };
}

/**
 * Format a number with commas if the original had commas
 */
function formatNumber(num: number, hasCommas: boolean): string {
  if (hasCommas) {
    return num.toLocaleString("en-US");
  }
  return num.toString();
}

/**
 * Animated counter component that ticks up when in view
 */
function AnimatedStat({ value, isInView }: { value: string; isInView: boolean }) {
  const { prefix, number, suffix, hasCommas, hasNumber } = parseStatValue(value);
  // Default to final value so translated/proxied pages still show real numbers
  // even if client-side animation scripts do not run reliably.
  const [displayNum, setDisplayNum] = useState(number);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current || number === 0) return;
    hasAnimated.current = true;
    setDisplayNum(0);

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      // Ease-out curve for smoother animation
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(easeOut * number);
      setDisplayNum(currentValue);

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayNum(number);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, number]);

  // If no numeric value at all, render original string and skip animation.
  if (!hasNumber) {
    return <>{value}</>;
  }

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
}: {
  heading: string;
  body: string;
  stats: Array<{ value?: string | null; label?: string | null }>;
  imageUrl: string | null;
  imageAlt: string;
  cta?: Linkish | null;
}) {
  const hasStats = stats?.some((s) => (s?.value || "").trim() || (s?.label || "").trim());
  const statsRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!statsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-6xl">
        {hasStats ? (
          <div ref={statsRef} className="mb-10 grid gap-4  bg-neutral-100 p-6 md:grid-cols-4 w-full">
            {stats.slice(0, 4).map((s, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-bold text-gmcc-navy">
                  <AnimatedStat value={s.value || ""} isInView={isInView} />
                </div>
                <div className="mt-1 text-xs font-semibold tracking-wide text-neutral-700">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gmcc-navy md:text-3xl">{heading}</h2>
            {body ? <p className="mt-4 text-base leading-relaxed text-neutral-700">{body}</p> : null}

            {cta?.url ? (
              <div className="mt-6 text-center">
                <a
                  href={cta.url}
                  target={cta.target || undefined}
                  className="btn btn-primary"
                >
                  {cta.title || "Get involved"}
                </a>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden bg-neutral-100">
            {imageUrl ? (
            <img src={imageUrl} alt={imageAlt || ""} className="h-full w-full object-cover" />
            ) : (
            <div className="aspect-square bg-neutral-200" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
