// components/programs/directory-sections/PersonalTrainingDirectoryHeader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DirectoryHeaderData,
  DirectoryHeaderShell,
  DirectoryTrainer,
} from "../directoryHeaderShared";

// Layout constants (same pattern as ProgramsSection)
const DESKTOP_COLS = 4;
const COL_GAP_PX = 16; // gap-4
const EDGE_PAD_PX = 6; // matches px-[6px]

export function PersonalTrainingDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  const trainers = useMemo(
    () =>
      (data?.trainers ?? []).filter(
        (t) => !!t?.name || !!t?.jobTitle || !!t?.photo?.sourceUrl
      ),
    [data?.trainers]
  );

  const dataWithoutTrainers: DirectoryHeaderData = {
    ...(data ?? {}),
    trainers: [],
  };

  // Carousel refs/state (copied from ProgramsSection)
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [isMd, setIsMd] = useState(false);
  const [desktopColW, setDesktopColW] = useState<number>(260);

  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const isProgrammaticScroll = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDragRef = useRef(false);

  // Flip state
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  // Breakpoint tracking (copied)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Keep refs array aligned to item count (prevents stale nulls)
  useEffect(() => {
    cellRefs.current = cellRefs.current.slice(0, trainers.length);
    // also reset active state when list size changes
    setActiveIndex(0);
    setAtStart(true);
    setAtEnd(false);
  }, [trainers.length]);

  // Compute desktop column width so 4 cards fit exactly (copied; adjusted gap constant)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const calc = () => {
      const md = window.matchMedia("(min-width: 768px)").matches;
      if (!md) return;

      const viewport = scroller.clientWidth - EDGE_PAD_PX * 2;
      const w = Math.floor(
        (viewport - COL_GAP_PX * (DESKTOP_COLS - 1)) / DESKTOP_COLS
      );
      setDesktopColW(Math.max(220, w));
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

  // Snap helpers (copied)
  const getSnapLeftForCell = (el: HTMLDivElement) => el.offsetLeft;

  const getSnapPositions = () =>
    cellRefs.current
      .slice(0, trainers.length)
      .map((el) => (el ? getSnapLeftForCell(el) : null))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

  const getMaxIndex = (n: number) => {
    if (n <= 0) return 0;
    if (!isMd) return n - 1;
    return Math.max(0, n - DESKTOP_COLS);
  };

  const getMaxReachableIndex = (scroller: HTMLDivElement, positions: number[]) => {
    const epsilon = isMd ? 4 : 10;
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
      // If offsets aren't ready yet, fall back to scrollWidth check
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

    setAtEnd(
      maxIdx === 0 ||
        Math.abs(current - positions[maxIdx]) <= epsilon ||
        clampedIdx === maxIdx
    );
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

  // Keep active + edges in sync on scroll (copied)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (!isProgrammaticScroll.current) syncEdgeAndActive();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });

    // IMPORTANT: layout can settle after images/3D transforms.
    // Do a couple passes like a "layout-safe" version of ProgramsSection:
    syncEdgeAndActive();
    const raf = requestAnimationFrame(() => syncEdgeAndActive());
    const t = window.setTimeout(() => syncEdgeAndActive(), 60);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainers.length, isMd, desktopColW]);

  // Mouse drag-to-scroll (copied exactly)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("a,button,input,textarea,select,label"));
    };

    const onMouseDown = (e: MouseEvent) => {
      // Keep controls and inner interactive elements clickable.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainers.length, isMd]);

  const toggleFlip = (index: number) => {
    if (didDragRef.current) return;
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const onKeyFlip =
    (index: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFlip(index);
      }
    };

  const arrowBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-gmcc-navy bg-gmcc-navy text-white body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gmcc-navy/80";

  return (
    <>
      <DirectoryHeaderShell data={dataWithoutTrainers} className={className} />

      {trainers.length ? (
        <section className="w-full">
          <div className="bg-white pt-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="eyebrow">Meet the trainers</h3>

              {trainers.length > 1 ? (
                <div className="flex gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={atStart}
                    className={arrowBtn}
                    aria-label="Scroll trainers left"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={atEnd}
                    className={arrowBtn}
                    aria-label="Scroll trainers right"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>

            {/* IMPORTANT: relative + z ordering so arrows sit above tiles */}
            <div className="mt-2 relative w-full min-w-0 max-w-full">
              {/* Desktop arrows (same layout pattern as ProgramsSection) */}
              {trainers.length > 1 ? (
                <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden md:block z-30">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={atStart}
                    aria-label="Previous trainers"
                    className={`${arrowBtn} pointer-events-auto absolute left-[-6px] top-1/2 -translate-y-1/2 z-30`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    disabled={atEnd}
                    aria-label="Next trainers"
                    className={`${arrowBtn} pointer-events-auto absolute right-[-6px] top-1/2 -translate-y-1/2 z-30`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              ) : null}

              <div className="mx-auto w-full min-w-0 max-w-6xl overflow-visible">
                <div
                  ref={scrollerRef}
                  className="w-full min-w-0 max-w-full overflow-x-auto pb-2 pt-1 px-[6px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    cursor: "grab",
                    scrollPaddingLeft: EDGE_PAD_PX,
                    scrollPaddingRight: EDGE_PAD_PX,
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
                    {trainers.map((trainer, idx) => {
                      const isFlipped = !!flipped[idx];
                      const canFlip = !!trainer.bio;

                      return (
                        <div
                          key={`${trainer.name ?? "trainer"}-${idx}`}
                          ref={(el) => {
                            cellRefs.current[idx] = el;
                          }}
                          style={{
                            scrollSnapAlign: "start",
                            scrollSnapStop: "always",
                          }}
                        >
                          {/* Tile: not a <button>, so drag can start on it.
                             Click flips unless it was a drag (same suppression as ProgramsSection). */}
                          <div
                            role={canFlip ? "button" : undefined}
                            tabIndex={canFlip ? 0 : -1}
                            onClick={() => (canFlip ? toggleFlip(idx) : undefined)}
                            onKeyDown={canFlip ? onKeyFlip(idx) : undefined}
                            className={[
                              "w-full",
                              canFlip ? "cursor-pointer" : "cursor-default",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-gmcc-teal focus-visible:ring-offset-2 rounded-2xl",
                            ].join(" ")}
                            aria-label={
                              canFlip
                                ? `View bio for ${trainer.name ?? "trainer"}`
                                : `${trainer.name ?? "Trainer"}`
                            }
                          >
                            {/* 3D flip container */}
                            <div className="relative w-full" style={{ perspective: "1200px" }}>
                              <div
                                className="relative h-[320px] w-full transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                                style={{
                                  transformStyle: "preserve-3d",
                                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                                }}
                              >
                                {/* FRONT */}
                                <div
                                  className="absolute inset-0 overflow-hidden rounded-2xl bg-neutral-100 shadow-sm"
                                  style={{ backfaceVisibility: "hidden" }}
                                >
                                  {trainer.photo?.sourceUrl ? (
                                    <img
                                      src={trainer.photo.sourceUrl}
                                      alt={trainer.photo.altText ?? trainer.name ?? "Trainer"}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                      decoding="async"
                                      draggable={false}
                                      onDragStart={(e) => e.preventDefault()}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                                      Photo coming soon
                                    </div>
                                  )}

                                  {canFlip ? (
                                    <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gmcc-navy shadow-sm">
                                      Tap to flip
                                    </div>
                                  ) : null}
                                </div>

                                {/* BACK */}
                                <div
                                  className="absolute inset-0 rounded-2xl bg-white shadow-sm border border-neutral-200 p-5"
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                  }}
                                >
                                  <div className="flex h-full flex-col">
                                    <div className="text-sm font-semibold text-gmcc-navy">
                                      {trainer.name ?? "Trainer"}
                                    </div>
                                    {trainer.jobTitle ? (
                                      <div className="mt-0.5 text-xs text-neutral-500">
                                        {trainer.jobTitle}
                                      </div>
                                    ) : null}

                                    <div className="mt-4 overflow-auto pr-1">
                                      <p
                                        className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-800"
                                        style={{
                                          fontFamily:
                                            `"Bradley Hand", "Segoe Print", "Comic Sans MS", "Apple Chancery", cursive`,
                                        }}
                                      >
                                        {trainer.bio ?? ""}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Name pill */}
                            {trainer.name ? (
                              <div className="mt-3 flex items-center justify-center">
                                <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-gmcc-navy px-4 py-2 text-sm font-semibold text-white shadow-sm">
                                  {trainer.name}
                                  {/* {trainer.jobTitle ? (
                                    <span className="hidden sm:inline text-white/75 font-medium">
                                      • {trainer.jobTitle}
                                    </span>
                                  ) : null} */}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile arrows bottom (same pattern) */}
                {trainers.length > 1 ? (
                  <div className="mt-3 flex items-center justify-center gap-3 md:hidden">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={atStart}
                      aria-label="Previous trainers"
                      className={arrowBtn}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={atEnd}
                      aria-label="Next trainers"
                      className={arrowBtn}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}