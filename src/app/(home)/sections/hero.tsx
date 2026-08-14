// src/app/(home)/sections/hero.tsx
"use client";

import { WAVE_BLEED_CLIP_CLASS, WAVE_SVG_BLEED_CLASS } from "@/components/waveSeam";
import {
  HERO_VIDEO_VIMEO_EMBED_URL,
  HERO_VIDEO_VIMEO_THUMBNAIL_URL,
} from "@/lib/constants";
import { useReduceMotionPreference } from "@/lib/useReduceMotionPreference";
import Player from "@vimeo/player";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Linkish = { title?: string | null; url?: string | null };

const coverMediaClassName =
  "absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2";

export default function HeroSection({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
}: {
  headline: string;
  subheadline: string;
  primaryCta: Linkish;
  secondaryCta?: Linkish | null;
}) {
  const reduceMotion = useReduceMotionPreference();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const [inView, setInView] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const showVideo = !reduceMotion && inView;

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

  useEffect(() => {
    if (reduceMotion) {
      setVideoPaused(false);
      setPlayerReady(false);
    }
  }, [reduceMotion]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!showVideo || !iframe) {
      playerRef.current?.destroy().catch(() => {});
      playerRef.current = null;
      setPlayerReady(false);
      return;
    }

    const player = new Player(iframe);
    playerRef.current = player;
    let cancelled = false;

    player
      .ready()
      .then(() => {
        if (!cancelled) setPlayerReady(true);
      })
      .catch(() => {
        if (!cancelled) setPlayerReady(false);
      });

    const onPlay = () => setVideoPaused(false);
    const onPause = () => setVideoPaused(true);

    player.on("play", onPlay);
    player.on("pause", onPause);

    return () => {
      cancelled = true;
      player.off("play", onPlay);
      player.off("pause", onPause);
      player.destroy().catch(() => {});
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, [showVideo]);

  const toggleVideoPlayback = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;

    try {
      const paused = await player.getPaused();
      if (paused) {
        await player.play();
      } else {
        await player.pause();
      }
    } catch {
      // Ignore transient player errors (e.g. during teardown).
    }
  }, []);

  return (
    <section className="pb-0">
      <div className="relative mb-8 w-full overflow-hidden bg-neutral-100">
        <div className="relative">
          {/* Media */}
          <div
            ref={containerRef}
            className="relative isolate h-[100svh] w-full overflow-hidden bg-neutral-200 select-none md:min-h-[700px]"
          >
            {/* Video / thumbnail layer */}
            <div
              id="hero-background-media"
              className="absolute inset-x-0 -top-24 bottom-0 z-0 overflow-hidden md:top-0"
              aria-hidden="true"
            >
              {reduceMotion || !showVideo ? (
                <div className={`${coverMediaClassName} relative`}>
                  <Image
                    src={HERO_VIDEO_VIMEO_THUMBNAIL_URL}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="pointer-events-none object-cover"
                  />
                </div>
              ) : null}

              {showVideo ? (
                <div className={coverMediaClassName}>
                  <iframe
                    ref={iframeRef}
                    src={HERO_VIDEO_VIMEO_EMBED_URL}
                    className="pointer-events-none h-full w-full"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="Hero Video"
                  />
                </div>
              ) : null}
            </div>

            {!reduceMotion ? (
              <button
                type="button"
                className="absolute right-4 top-4 z-50 rounded-full border border-white/40 bg-black/40 px-3 py-2 text-xs font-sm text-white backdrop-blur-sm transition hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 md:right-8 md:top-8"
                aria-pressed={!videoPaused}
                aria-controls="hero-background-media"
                disabled={!playerReady}
                onClick={() => void toggleVideoPlayback()}
              >
                {videoPaused ? "Play" : "Pause"}
              </button>
            ) : null}

            {/* Dark overlay */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-black/40" />

            {/* Copy — top-aligned on mobile so subhead/CTAs clear the bottom wave */}
            <div className="absolute inset-0 z-20 flex items-end">
              <div className="w-full px-8 md:px-12 pb-[16rem]">
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[15%] bg-gmcc-navy md:h-[10%]" />

            {/* Wave — overlaps navy block + edge bar to hide mobile subpixel seam */}
            <div className="pointer-events-none absolute inset-x-0 bottom-[calc(15%-3px)] z-40 w-full leading-none md:bottom-[calc(8.5%-3px)]">
              <div className={WAVE_BLEED_CLIP_CLASS}>
                <svg
                  viewBox="0 0 1440 180"
                  className={`${WAVE_SVG_BLEED_CLASS} h-20 md:h-28 lg:h-36`}
                  preserveAspectRatio="none"
                  aria-hidden
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
              <div className="absolute bottom-0 left-0 h-[4px] w-full bg-gmcc-navy" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
