"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import AutoHeightScheduleIframe from "@/components/schedule/autoHeightScheduleIframe";

type ScheduleBesideEventCardsProps = {
  scheduleSrc: string;
  scheduleTitle: string;
  eventCards: ReactNode;
  /** Number of event cards shown (drives lg fill vs max-only behavior). */
  eventCardCount: number;
  seeMoreLink?: ReactNode;
};

/** Side-by-side columns start; event cards still use stacked (image-on-top) layout. */
const SM_MEDIA = "(min-width: 640px)";
/** Event cards switch to side-by-side `h-38` layout. */
const LG_MEDIA = "(min-width: 1024px)";

/** Embed `.today-shell` padding-bottom at sm+ (1rem) + optical align tweak. */
const SHELL_PADDING_AND_ALIGN_PX = 16 + 4;

/**
 * Side-by-side schedule + event cards.
 *
 * Calendar auto-sizes to content, capped at two `h-38` cards + gap (+ shell
 * padding). With two event cards on lg+, it fills that height so bottoms align
 * even when the embed reports a shorter scrolled viewport.
 */
export default function ScheduleBesideEventCards({
  scheduleSrc,
  scheduleTitle,
  eventCards,
  eventCardCount,
  seeMoreLink,
}: ScheduleBesideEventCardsProps) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const [midMaxHeightPx, setMidMaxHeightPx] = useState<number | null>(null);
  const fillHeightLg = eventCardCount >= 2;

  useEffect(() => {
    const cardsEl = cardsRef.current;
    if (!cardsEl) return;

    const smMedia = window.matchMedia(SM_MEDIA);
    const lgMedia = window.matchMedia(LG_MEDIA);

    const update = () => {
      if (!smMedia.matches || lgMedia.matches) {
        setMidMaxHeightPx(null);
        return;
      }

      const firstCard = cardsEl.firstElementChild as HTMLElement | null;
      if (!firstCard) {
        setMidMaxHeightPx(null);
        return;
      }

      const next = Math.round(firstCard.offsetHeight + SHELL_PADDING_AND_ALIGN_PX);
      setMidMaxHeightPx(next > 0 ? next : null);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(cardsEl);
    smMedia.addEventListener("change", update);
    lgMedia.addEventListener("change", update);

    return () => {
      observer.disconnect();
      smMedia.removeEventListener("change", update);
      lgMedia.removeEventListener("change", update);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
      {/* sm:-mb-4 cancels shell padding so a filled calendar's visible card
          bottom lines up with two event cards. */}
      <div className="gmcc-schedule-embed self-start overflow-hidden sm:row-start-1 sm:-mb-4">
        <AutoHeightScheduleIframe
          src={scheduleSrc}
          title={scheduleTitle}
          maxHeightLg
          fillHeightLg={fillHeightLg}
          midMaxHeightPx={midMaxHeightPx}
        />
      </div>

      <div ref={cardsRef} className="grid gap-5 self-start px-4 sm:row-start-1 sm:px-0">
        {eventCards}
      </div>

      {seeMoreLink ? (
        <div className="px-3 sm:col-start-2 sm:row-start-2 sm:px-0">{seeMoreLink}</div>
      ) : null}
    </div>
  );
}
