"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DirectoryTrainer } from "@/components/programs/directoryHeaderShared";

const DESKTOP_COLS = 4;
const COL_GAP_PX = 16; // gap-4
const EDGE_PAD_PX = 6;

type TrainersCarouselProps = {
  trainers: Array<DirectoryTrainer | null | undefined>;
  title?: string;
  className?: string;
};

export default function TrainersCarousel({
  trainers,
  className = "",
}: TrainersCarouselProps) {
  const normalized = useMemo(
    () =>
      (trainers ?? []).filter(
        (t): t is DirectoryTrainer =>
          !!t && (!!t.name || !!t.jobTitle || !!t.photo?.sourceUrl),
      ),
    [trainers],
  );

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [isMd, setIsMd] = useState(false);
  const [desktopColW, setDesktopColW] = useState<number>(260);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const isProgrammaticScroll = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDragRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    cellRefs.current = cellRefs.current.slice(0, normalized.length);
    setActiveIndex(0);
    setAtStart(true);
    setAtEnd(false);
    setExpanded({});
  }, [normalized.length]);

  // Compute desktop column width so exactly 4 cards fit in frame
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const calc = () => {
      const md = window.matchMedia("(min-width: 768px)").matches;
      if (!md) return;
      const viewport = scroller.clientWidth - EDGE_PAD_PX * 2;
      const width = Math.floor((viewport - COL_GAP_PX * (DESKTOP_COLS - 1)) / DESKTOP_COLS);
      setDesktopColW(Math.max(220, width));
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(scroller);
    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener?.("change", calc);
    window.addEventListener("resize", calc);

    return () => {
      ro.disconnect();
      mq.removeEventListener?.("change", calc);
      window.removeEventListener("resize", calc);
    };
  }, []);

  const getSnapPositions = () =>
    cellRefs.current
      .slice(0, normalized.length)
      .map((el) => (el ? el.offsetLeft : null))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

  const getMaxIndex = (n: number) => {
    if (n <= 0) return 0;
    if (!isMd) return n - 1;
    return Math.max(0, n - DESKTOP_COLS);
  };

  const getMaxReachableIndex = (scroller: HTMLDivElement, positions: number[]) => {
    // Give desktop a slightly larger tolerance so the last full frame
    // remains reachable when offset/padding rounding differs by a few px.
    const epsilon = isMd ? 12 : 10;
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    let reachable = 0;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] <= maxScrollLeft + epsilon) reachable = i;
    }
    return Math.min(reachable, getMaxIndex(positions.length));
  };

  const syncEdgeAndActive = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const positions = getSnapPositions();
    if (!positions.length) {
      const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      setAtStart(true);
      setAtEnd(maxScrollLeft <= 1);
      setActiveIndex(0);
      return;
    }

    const epsilon = isMd ? 4 : 10;
    const current = scroller.scrollLeft;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < positions.length; i++) {
      const dist = Math.abs(positions[i] - current);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const maxIdx = getMaxReachableIndex(scroller, positions);
    const clampedIdx = Math.max(0, Math.min(bestIdx, maxIdx));
    setActiveIndex(clampedIdx);
    setAtStart(clampedIdx === 0);
    setAtEnd(maxIdx === 0 || Math.abs(current - positions[maxIdx]) <= epsilon || clampedIdx === maxIdx);
  };

  const scrollToIndex = (idx: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const positions = getSnapPositions();
    if (!positions.length) return;

    const maxIdx = getMaxReachableIndex(scroller, positions);
    const targetIdx = Math.max(0, Math.min(idx, maxIdx));
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const targetLeft = Math.max(0, Math.min(positions[targetIdx], maxScrollLeft));

    isProgrammaticScroll.current = true;
    scroller.scrollTo({ left: targetLeft, behavior: "smooth" });

    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
      syncEdgeAndActive();
    }, 450);
  };

  const goPrev = () => scrollToIndex(activeIndex - 1);
  const goNext = () => scrollToIndex(activeIndex + 1);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (!isProgrammaticScroll.current) syncEdgeAndActive();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    syncEdgeAndActive();
    const raf = requestAnimationFrame(() => syncEdgeAndActive());
    const timeout = window.setTimeout(() => syncEdgeAndActive(), 60);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [normalized.length, isMd, desktopColW]);

  // Mouse drag-to-scroll (same interaction as programs carousel).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("a,button,input,textarea,select,label"));
    };

    const onMouseDown = (e: MouseEvent) => {
      if (isInteractiveTarget(e.target)) return;
      if (e.button !== 0) return;

      isDraggingRef.current = true;
      didDragRef.current = false;
      dragStartX.current = e.pageX - scroller.getBoundingClientRect().left;
      dragScrollLeft.current = scroller.scrollLeft;
      scroller.style.scrollSnapType = "none";
      scroller.style.cursor = "grabbing";
      scroller.classList.add("select-none");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const x = e.pageX - scroller.getBoundingClientRect().left;
      const walk = (x - dragStartX.current) * 1.5;
      if (Math.abs(walk) > 6) didDragRef.current = true;
      scroller.scrollLeft = dragScrollLeft.current - walk;
    };

    const endDrag = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      scroller.style.scrollSnapType = "x mandatory";
      scroller.style.cursor = "grab";
      scroller.classList.remove("select-none");
      syncEdgeAndActive();
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!didDragRef.current) return;
      e.preventDefault();
      e.stopPropagation();
    };

    scroller.addEventListener("mousedown", onMouseDown);
    scroller.addEventListener("mousemove", onMouseMove);
    scroller.addEventListener("mouseup", endDrag);
    scroller.addEventListener("mouseleave", endDrag);
    scroller.addEventListener("click", onClickCapture, true);

    return () => {
      scroller.removeEventListener("mousedown", onMouseDown);
      scroller.removeEventListener("mousemove", onMouseMove);
      scroller.removeEventListener("mouseup", endDrag);
      scroller.removeEventListener("mouseleave", endDrag);
      scroller.removeEventListener("click", onClickCapture, true);
    };
  }, [normalized.length, isMd]);

  if (!normalized.length) return null;

  const arrowBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-gmcc-navy bg-white text-gmcc-navy body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/80";

  return (
    <section className={`w-full ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        {normalized.length > 1 ? (
          <div className="flex gap-2 md:hidden">
            <button type="button" onClick={goPrev} disabled={atStart} aria-label="Previous trainers" className={arrowBtn}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button type="button" onClick={goNext} disabled={atEnd} aria-label="Next trainers" className={arrowBtn}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative mx-auto mt-2 w-full min-w-0 max-w-6xl">
        {normalized.length > 1 ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 hidden md:block">
            <button
              type="button"
              onClick={goPrev}
              disabled={atStart}
              aria-label="Previous trainers"
              className={`${arrowBtn} pointer-events-auto absolute left-[-44px] top-1/2 -translate-y-1/2`}
              >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={atEnd}
              aria-label="Next trainers"
              className={`${arrowBtn} pointer-events-auto absolute right-[-44px] top-1/2 -translate-y-1/2`}
              >
              →
            </button>
          </div>
        ) : null}

        <div
          ref={scrollerRef}
          className="w-full min-w-0 max-w-full overflow-x-auto pb-2 pt-1 px-[6px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollPaddingLeft: EDGE_PAD_PX,
            scrollPaddingRight: EDGE_PAD_PX,
            cursor: "grab",
          }}
        >
          <div
            className="grid gap-4"
            style={{
              gridAutoFlow: "column",
              gridAutoColumns: isMd ? `${desktopColW}px` : "100%",
              width: "max-content",
              minWidth: "100%",
            }}
          >
            {normalized.map((trainer, idx) => {
            const isExpanded = !!expanded[idx];
            const canExpand = !!trainer.bio;
            return (
              <div
                key={`${trainer.name ?? "trainer"}-${idx}`}
                ref={(el) => {
                  cellRefs.current[idx] = el;
                }}
                style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
                className="overflow-visible"
              >
                <div className="relative flex w-full flex-col items-center overflow-visible pb-2">
                  <div className="relative z-10 h-[260px] w-full overflow-hidden rounded-[999px] bg-neutral-100 shadow-sm md:h-[280px]">
                    {trainer.photo?.sourceUrl ? (
                      <img
                        src={trainer.photo.sourceUrl}
                        alt={trainer.photo.altText ?? trainer.name ?? "Trainer"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                        Photo coming soon
                      </div>
                    )}
                  </div>

                  <div className="relative z-20 -mt-4 flex w-full justify-center overflow-visible">
                    {canExpand ? (
                      <div className="relative w-full overflow-visible">
                        <div
                          className={`absolute bottom-0 left-1/2 w-full -translate-x-1/2 overflow-hidden rounded-[22px] bg-white text-neutral-700 shadow-lg transition-all duration-300 ease-out ${
                            isExpanded
                              ? "pointer-events-auto max-h-[320px] opacity-100"
                              : "pointer-events-none max-h-[52px] opacity-0"
                          }`}
                        >
                          <div className="px-4 pb-4 pt-3 text-left">
                            <div className="max-h-[245px] overflow-y-auto pr-1">
                              {trainer.jobTitle ? (
                                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                  About {trainer.name?.split(" ")[0] ?? "Trainer"}
                                </p>
                              ) : null}
                              <p className={`whitespace-pre-line text-sm leading-relaxed ${trainer.jobTitle ? "mt-2" : ""}`}>
                                {trainer.bio ?? ""}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpanded((prev) => ({ ...prev, [idx]: false }))}
                            aria-expanded={isExpanded}
                            aria-label={`Hide bio for ${trainer.name ?? "trainer"}`}
                            className="flex w-full items-center justify-center rounded-full bg-gmcc-green px-4 py-2 text-center text-sm font-semibold text-white shadow-sm"
                          >
                            Hide {trainer.name?.split(" ")[0] ?? "Trainer"}&rsquo;s Bio
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [idx]: true }))}
                          aria-expanded={isExpanded}
                          aria-label={`Show bio for ${trainer.name ?? "trainer"}`}
                          className={`relative z-30 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gmcc-navy focus-visible:ring-offset-2 ${
                            isExpanded
                              ? "pointer-events-none opacity-0"
                              : "bg-white text-neutral-900 opacity-100 hover:bg-neutral-100"
                          }`}
                        >
                          {trainer.name ?? "Trainer"}
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex w-full items-center justify-center rounded-full bg-gmcc-green px-5 py-3 text-center text-sm font-semibold text-white shadow-sm">
                        {trainer.name ?? "Trainer"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {normalized.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-3 md:hidden">
          <button type="button" onClick={goPrev} disabled={atStart} aria-label="Previous trainers" className={arrowBtn}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button type="button" onClick={goNext} disabled={atEnd} aria-label="Next trainers" className={arrowBtn}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      ) : null}
    </section>
  );
}
