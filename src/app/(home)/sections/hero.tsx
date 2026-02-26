// src/app/(home)/sections/hero.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Linkish = { title?: string | null; url?: string | null };

function isLikelyHtml(str: string) {
  return /<iframe|<video|<embed|<blockquote/i.test(str);
}

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

function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    let id: string | null = null;

    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
    }

    if (!id) return url;

    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1", // required for autoplay in most browsers
      loop: "1",
      playlist: id, // required for looping a single video
      playsinline: "1",
      controls: "0",
      rel: "0",
      modestbranding: "1",
    });

    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  } catch {
    return url;
  }
}

export default function HeroSection({
  headline,
  subheadline,
  mediaOEmbed,
  primaryCta,
  secondaryCta,
}: {
  headline: string;
  subheadline: string;
  mediaOEmbed?: string | null;
  primaryCta: Linkish;
  secondaryCta?: Linkish | null;
}) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  // Only compute embed URL when needed
  const embedUrl = useMemo(() => {
    const v = mediaOEmbed?.trim();
    if (!v) return null;
    if (isLikelyHtml(v)) return null; // HTML path handled separately
    return toYouTubeEmbed(v);
  }, [mediaOEmbed]);

  const hasVideo = !!mediaOEmbed?.trim();

  // Performance: only mount video when hero is near viewport
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
    <section className="section-y pb-0">
      <div className="relative mb-8 w-full overflow-hidden bg-neutral-100">
        <div className="relative">
          {/* Media */}
          <div
            ref={containerRef}
            className="relative h-[700px] w-full bg-neutral-200 overflow-hidden isolate select-none"
          >
            {/* Video layer */}
            <div className="absolute inset-0 z-0">
              {hasVideo && !reducedMotion && inView ? (
                isLikelyHtml(mediaOEmbed!) ? (
                  <div
                    className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: mediaOEmbed! }}
                  />
                ) : (
                  <iframe
                    className="absolute inset-0 h-full w-full pointer-events-none"
                    src={embedUrl ?? mediaOEmbed!}
                    title={headline}
                    allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : null}
            </div>

            {/* Static overlay layer */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-black/40" />

            {/* Optional: content layer (if you want it inside this box instead of outside) */}
            {/* <div className="absolute inset-0 z-20">...</div> */}
          </div>

          {/* Copy */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-8 py-10 md:px-12">
              <div className="max-w-2xl text-white">
                <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
                  {headline}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-white/90 md:text-2xl">
                  {subheadline}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {primaryCta?.url ? (
                    <a href={primaryCta.url} className="btn btn-primary">
                      {primaryCta.title || "Learn more"}
                    </a>
                  ) : null}

                  {secondaryCta?.url ? (
                    <a
                      href={secondaryCta.url}
                      className="btn btn-secondary">
                      {secondaryCta.title || "Explore"}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Wave */}
          <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
            <svg
              viewBox="0 0 1440 120"
              className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
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
                fill="var(--gmcc-navy)"
              />
            </svg>
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gmcc-navy" />
          </div>

        </div>
      </div>
    </section>
  );
}
