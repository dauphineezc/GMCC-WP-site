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
      mute: "1",
      loop: "1",
      playlist: id,
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

  const embedUrl = useMemo(() => {
    const v = mediaOEmbed?.trim();
    if (!v) return null;
    if (isLikelyHtml(v)) return null;
    return toYouTubeEmbed(v);
  }, [mediaOEmbed]);

  const hasVideo = !!mediaOEmbed?.trim();

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
    <section className="pb-0">
      <div className="relative mb-8 w-full overflow-hidden bg-neutral-100">
        <div className="relative">
          {/* Media */}
          <div
            ref={containerRef}
            className="relative isolate h-[100svh] min-h-[700px] w-full overflow-hidden bg-neutral-200 select-none"
          >
            {/* Video layer */}
            <div className="absolute inset-x-0 -top-24 bottom-0 z-0 overflow-hidden md:top-0">              {hasVideo && !reducedMotion && inView ? (
                isLikelyHtml(mediaOEmbed!) ? (
                  <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2">
                    <div
                      className="
                        absolute left-1/2 top-1/2
                        h-[56.25vw] min-h-full
                        w-[177.78vh] min-w-full
                        -translate-x-1/2 -translate-y-1/2
                        [&_iframe]:pointer-events-none
                        [&_iframe]:absolute
                        [&_iframe]:left-0
                        [&_iframe]:top-0
                        [&_iframe]:h-full
                        [&_iframe]:w-full
                        [&_video]:pointer-events-none
                        [&_video]:absolute
                        [&_video]:left-0
                        [&_video]:top-0
                        [&_video]:h-full
                        [&_video]:w-full
                        [&_video]:object-cover
                      "
                      dangerouslySetInnerHTML={{ __html: mediaOEmbed! }}
                    />
                  </div>
                ) : (
                  <div
                    className="
                      absolute left-1/2 top-1/2
                      h-[56.25vw] min-h-full
                      w-[177.78vh] min-w-full
                      -translate-x-1/2 -translate-y-1/2
                    "
                  >
                    <iframe
                      className="pointer-events-none absolute left-0 top-0 h-full w-full"
                      src={embedUrl ?? mediaOEmbed!}
                      title={headline}
                      allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )
              ) : null}
            </div>

            {/* Dark overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-black/40" />

            {/* Copy */}
            <div className="absolute inset-0 z-20 flex items-center">
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