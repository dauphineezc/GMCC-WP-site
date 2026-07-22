"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type Maybe<T> = T | null | undefined;

type ModuleImage = {
  sourceUrl?: Maybe<string>;
  altText?: Maybe<string>;
};

type ModuleCta = {
  ctaLabel?: Maybe<string>;
  cta?: Maybe<string>;
};

type CenterCampaignModuleData = {
  header?: Maybe<string>;
  description?: Maybe<string>;
  subheader?: Maybe<string>;
  body?: Maybe<string>;
  primaryCta?: Maybe<ModuleCta>;
  secondaryCta?: Maybe<ModuleCta>;
  gallery?: Maybe<ModuleImage[]>;
};

type CenterCampaignModuleProps = {
  module: CenterCampaignModuleData;
};

export function getBodyParts(body?: Maybe<string>) {
  if (!body) return { intro: "", bullets: [] as string[] };

  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { intro: "", bullets: [] };

  const intro = lines[0];
  const bullets = lines
    .slice(1)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  return { intro, bullets };
}

function getImages(gallery?: CenterCampaignModuleData["gallery"]) {
  return (gallery ?? []).filter((img): img is ModuleImage => !!img?.sourceUrl);
}

export default function CenterCampaignModule({
  module,
}: CenterCampaignModuleProps) {
  const {
    header,
    description,
    subheader,
    body,
    primaryCta,
    secondaryCta,
    gallery,
  } = module;

  const images = useMemo(() => getImages(gallery), [gallery]);
  const imageSetKey = useMemo(
    () => images.map((image) => image.sourceUrl ?? "").join("|"),
    [images]
  );
  const { intro, bullets } = getBodyParts(body);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const canScroll = images.length > 1;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < images.length - 1;

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const slides = Array.from(
      track.querySelectorAll<HTMLElement>("[data-slide]")
    );
    const target = slides[index];
    if (!target) return;

    track.scrollTo({
      left: index === 0 ? 0 : target.offsetLeft,
      behavior: "smooth",
    });
  };

  const handleNext = () => {
    if (!hasNext) return;
    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);
    scrollToIndex(nextIndex);
  };

  const handlePrev = () => {
    if (!hasPrev) return;
    const prevIndex = activeIndex - 1;
    setActiveIndex(prevIndex);
    scrollToIndex(prevIndex);
  };

  useEffect(() => {
    setActiveIndex(0);
    const track = trackRef.current;
    if (track) track.scrollLeft = 0;
  }, [imageSetKey]);

  if (!header && !description && !subheader && !body && !images.length) {
    return null;
  }

  return (
    <section>
      <div className="mx-auto max-w-[1240px]">
        {(header || description) && (
          <div className="mb-8 lg:mb-10">
            {header && (
              <h2 className="h2">
                {header}
              </h2>
            )}

            {description && (
              <p className="mt-5 max-w-6xl body">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-5 lg:gap-4">
          {/* Left gallery card */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-[18px] bg-gmcc-navy py-4 md:py-7">
              <div className="relative">
                <div
                  ref={trackRef}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {images.length > 0 ? (
                    images.map((image, index) => (
                      <div
                        key={`${image.sourceUrl}-${index}`}
                        data-slide
                        className={`relative h-[300px] w-[82%] min-w-[82%] snap-start overflow-hidden rounded-[18px] sm:h-[340px] md:h-[390px] lg:h-[410px]${
                          index === 0 ? " ml-5" : ""
                        }${index === images.length - 1 ? " mr-5" : ""}`}
                      >
                        <Image
                          src={image.sourceUrl as string}
                          alt={image.altText || `Gallery image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1000px) 82vw, 55vw"
                          priority={index === 0}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="h-[300px] w-[82%] min-w-[82%] ml-5 rounded-[18px] bg-slate-200 sm:h-[340px] md:h-[390px] lg:h-[410px]" />
                  )}
                </div>

                {canScroll && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Previous slide"
                      disabled={!hasPrev}
                      className={`absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full md:flex ${
                        hasPrev
                          ? "bg-white/95 text-gmcc-navy shadow-md"
                          : "bg-white/60 text-gmcc-navy/40"
                      } h-12 w-12 transition`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 6L9 12L15 18"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Next slide"
                      disabled={!hasNext}
                      className={`absolute right-3 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center rounded-full ${
                        hasNext
                          ? "bg-gmcc-green text-gmcc-navy shadow-lg"
                          : "bg-gmcc-green/65 text-gmcc-navy/45"
                      } h-14 w-14 transition`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-7 w-7"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 6L15 12L9 18"
                          stroke="currentColor"
                          strokeWidth="2.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right content card */}
          <div className="lg:col-span-2 max-w-[600px]">
            <div className="h-full rounded-[18px] bg-gmcc-blue-light/30 px-6 py-6 md:px-7 md:py-7">
              {subheader && (
                <h3 className="h3">
                  {subheader}
                </h3>
              )}

              {(intro || bullets.length > 0) && (
                <div className="mt-5">
                  {intro && (
                    <p className="body text-black">
                      {intro}
                    </p>
                  )}

                  {bullets.length > 0 && (
                    <ul className="mt-5 space-y-3 pl-5 list-disc marker:text-gmcc-navy">
                      {bullets.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                {primaryCta?.ctaLabel && primaryCta?.cta && (
                  <Link
                    href={primaryCta.cta}
                    className="btn btn-primary"
                  >
                    {primaryCta.ctaLabel}
                  </Link>
                )}

                {secondaryCta?.ctaLabel && secondaryCta?.cta && (
                  <Link
                    href={secondaryCta.cta}
                    className="btn btn-secondary"
                  >
                    {secondaryCta.ctaLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}