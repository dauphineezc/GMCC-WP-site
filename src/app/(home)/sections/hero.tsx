// src/app/(home)/sections/hero.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Linkish = { title?: string | null; url?: string | null };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);

    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

export default function HeroSection({
  headline,
  subheadline,
  mediaUrl,
  mediaMimeType,
  primaryCta,
  secondaryCta,
}: {
  headline: string;
  subheadline: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  primaryCta: Linkish;
  secondaryCta?: Linkish | null;
}) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  const hasVideo = !!mediaUrl?.trim();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="home-hero-compensate pb-0">
      <div className="relative mb-8 w-full overflow-hidden bg-neutral-100">
        <div className="relative">
          {/* Media */}
          <div
            ref={containerRef}
            className="relative isolate h-[100svh] w-full overflow-hidden bg-neutral-200 select-none md:min-h-[700px]"
          >
            {/* Video layer */}
            <div className="absolute inset-x-0 -top-24 bottom-0 z-0 overflow-hidden md:top-0">
              {hasVideo && !reducedMotion && inView ? (
                <div
                  className="
                    absolute left-1/2 top-1/2
                    h-[56.25vw] min-h-full
                    w-[177.78vh] min-w-full
                    -translate-x-1/2 -translate-y-1/2
                  "
                >
                  <video
                    className="h-full w-full object-cover pointer-events-none"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                  >
                    <source
                      src={mediaUrl ?? undefined}
                      type={mediaMimeType ?? (mediaUrl?.toLowerCase().endsWith(".mp4") ? "video/mp4" : undefined)}
                    />
                  </video>
                </div>
              ) : null}
            </div>

            {/* Dark overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-black/40" />

            {/* Copy — top-aligned on mobile so subhead/CTAs clear the bottom wave */}
            <div className="absolute inset-0 z-20 flex items-start md:items-center">
              <div className="w-full px-8 pt-14 pb-36 md:px-12 md:py-10">
                <div className="max-w-2xl text-white">
                  <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
                    {headline}
                  </h1>
                  <p className="mt-4 text-lg leading-relaxed text-white/90 md:text-2xl">
                    {subheadline}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {primaryCta?.url ? (
                      <a href={primaryCta.url} className="btn btn-tertiary">
                        {primaryCta.title || "Learn more"}
                      </a>
                    ) : null}

                    {secondaryCta?.url ? (
                      <a href={secondaryCta.url} className="btn btn-secondary">
                        {secondaryCta.title || "Explore"}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom navy block to let wave cover ~1/3 of hero */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 md:h-[10%] h-[15%] bg-gmcc-navy" />

            {/* Wave */}
            <div className="pointer-events-none absolute inset-x-0 md:bottom-[8.5%] bottom-[15%] z-40 w-full overflow-hidden leading-none">
              <svg
                viewBox="0 0 1440 180"
                className="-ml-px block h-20 w-[calc(100%+2px)] md:h-28 lg:h-36"
                preserveAspectRatio="none"
              >
                <path
                  d="
                    M0,120
                    C180,70 320,30 520,55
                    C740,85 870,165 1080,145
                    C1260,128 1370,70 1440,35
                    L1440,180
                    L0,180
                    Z
                  "
                  fill="var(--gmcc-navy)"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}