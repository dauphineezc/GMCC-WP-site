"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import NavyWaveSection from "./navyWaveSection";
import type { CenterPageHistoryItem } from "@/lib/centerDetailPageFields";

const FALLBACK_STONE_SRC = "/primaryNavIcons/CurlingCenterIcon.png";
const STONE_SIZE_PX = 64;
const STONE_SIZE_PX_MOBILE = 36;
const CARD_GAP_PX = 24;
const MOBILE_CARD_MIN_PX = 280;
const MOBILE_CARD_MAX_PX = 400;
const MOBILE_CARD_VW = 0.85;

export type CurlingHistoryTimelineProps = {
  heading?: string | null;
  items: CenterPageHistoryItem[];
  /** Curling stone image used as the scrubber handle (desktop) / decorative marker (mobile). */
  stoneUrl?: string | null;
  stoneAlt?: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function fractionForIndex(index: number, count: number) {
  if (count <= 1) return 0;
  return index / (count - 1);
}

function nearestIndex(fraction: number, count: number) {
  if (count <= 1) return 0;
  return clamp(Math.round(fraction * (count - 1)), 0, count - 1);
}

export default function CurlingHistoryTimeline({
  heading,
  items,
  stoneUrl,
  stoneAlt,
}: CurlingHistoryTimelineProps) {
  const count = items.length;
  const labelId = useId();

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const stoneDraggingRef = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimeout = useRef<number | null>(null);
  const cardDraggingRef = useRef(false);
  const cardDragStartX = useRef(0);
  const cardDragScrollLeft = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [fraction, setFraction] = useState(0);
  const [isStoneDragging, setIsStoneDragging] = useState(false);
  const [isMd, setIsMd] = useState(false);
  const [mobileGutter, setMobileGutter] = useState(0);
  const [mobileColW, setMobileColW] = useState(0);

  const fractionRef = useRef(0);

  const stoneSrc = (stoneUrl ?? "").trim() || FALLBACK_STONE_SRC;
  const stoneLabel = (stoneAlt ?? "").trim() || "Curling stone";
  const stoneSize = isMd ? STONE_SIZE_PX : STONE_SIZE_PX_MOBILE;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const calc = () => {
      const md = window.matchMedia("(min-width: 768px)").matches;
      if (md) {
        setMobileGutter((prev) => (prev === 0 ? prev : 0));
        setMobileColW((prev) => (prev === 0 ? prev : 0));
        return;
      }

      // Use clientWidth (not content-minus-padding). Subtracting the gutter we
      // apply as padding feedback-loops ResizeObserver → infinite setState.
      const viewport = scroller.clientWidth;
      const cardW = Math.min(
        MOBILE_CARD_MAX_PX,
        viewport,
        Math.max(Math.min(MOBILE_CARD_MIN_PX, viewport), Math.floor(viewport * MOBILE_CARD_VW)),
      );
      const gutter = Math.max(0, Math.floor((viewport - cardW) / 2));
      setMobileColW((prev) => (prev === cardW ? prev : cardW));
      setMobileGutter((prev) => (prev === gutter ? prev : gutter));
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(scroller);
    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, [count]);

  const isMdRef = useRef(isMd);
  const mobileGutterRef = useRef(mobileGutter);

  // Latest values for scroll/drag handlers; layout effect so they are current before passive effects run.
  useLayoutEffect(() => {
    fractionRef.current = fraction;
    isMdRef.current = isMd;
    mobileGutterRef.current = mobileGutter;
  }, [fraction, isMd, mobileGutter]);

  const getSnapLeftForCell = useCallback((el: HTMLDivElement, scroller: HTMLDivElement) => {
    const leftInScroller = mobileGutterRef.current + el.offsetLeft;
    if (isMdRef.current) return leftInScroller;
    return leftInScroller + el.clientWidth / 2 - scroller.clientWidth / 2;
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      if (!scroller || count <= 0) return;
      const clamped = clamp(index, 0, count - 1);
      const targetEl = cellRefs.current[clamped];
      if (!targetEl) return;

      const target = getSnapLeftForCell(targetEl, scroller);
      isProgrammaticScroll.current = true;
      if (programmaticScrollTimeout.current != null) {
        window.clearTimeout(programmaticScrollTimeout.current);
        programmaticScrollTimeout.current = null;
      }
      // Keep CSS scroll-snap off until we land, or it fights and jerks backward first.
      scroller.style.scrollSnapType = "none";
      scroller.scrollTo({ left: target, behavior });
      // Step stone to the discrete index immediately (mobile doesn't scrub from scroll).
      setActiveIndex(clamped);
      setFraction(fractionForIndex(clamped, count));

      const settleMs = behavior === "smooth" ? 450 : 0;
      programmaticScrollTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
        programmaticScrollTimeout.current = null;
        scroller.style.scrollSnapType = "x mandatory";
      }, settleMs);
    },
    [count, getSnapLeftForCell],
  );

  const snapLeftForFraction = useCallback(
    (nextFraction: number, scroller: HTMLDivElement) => {
      if (count <= 1) return 0;
      const scaled = nextFraction * (count - 1);
      const i0 = clamp(Math.floor(scaled), 0, count - 1);
      const i1 = clamp(i0 + 1, 0, count - 1);
      const t = scaled - i0;
      const el0 = cellRefs.current[i0];
      const el1 = cellRefs.current[i1];
      if (!el0) return 0;
      const s0 = getSnapLeftForCell(el0, scroller);
      if (!el1 || i0 === i1) return s0;
      const s1 = getSnapLeftForCell(el1, scroller);
      return s0 + (s1 - s0) * t;
    },
    [count, getSnapLeftForCell],
  );

  const syncFromScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    // Ignore while the stone is scrubbing (desktop) or arrows are animating cards
    // (mobile) — otherwise fraction fights the intentional step and looks glitchy.
    if (
      !scroller ||
      count <= 0 ||
      stoneDraggingRef.current ||
      isProgrammaticScroll.current
    ) {
      return;
    }

    const current = scroller.scrollLeft;
    const snapLefts: number[] = [];

    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < cellRefs.current.length; i++) {
      const el = cellRefs.current[i];
      if (!el) {
        snapLefts.push(0);
        continue;
      }
      const snapLeft = getSnapLeftForCell(el, scroller);
      snapLefts.push(snapLeft);
      const dist = Math.abs(snapLeft - current);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    // Mobile: stone is decorative — only step to discrete card indexes.
    // Desktop: interpolate so dragging cards keeps the scrubber in sync.
    let nextFraction = fractionForIndex(bestIdx, count);
    if (isMdRef.current && count > 1 && snapLefts.length === count) {
      let i0 = 0;
      for (let i = 0; i < count - 1; i++) {
        if (current >= snapLefts[i]) i0 = i;
      }
      const i1 = Math.min(i0 + 1, count - 1);
      const s0 = snapLefts[i0];
      const s1 = snapLefts[i1];
      const t = s1 === s0 ? 0 : clamp((current - s0) / (s1 - s0), 0, 1);
      nextFraction = (i0 + t) / (count - 1);
    }

    setActiveIndex((prev) => (prev === bestIdx ? prev : bestIdx));
    setFraction((prev) => (Math.abs(prev - nextFraction) < 0.0005 ? prev : nextFraction));
  }, [count, getSnapLeftForCell]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => syncFromScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [syncFromScroll, count]);

  const scrollFromFraction = useCallback(
    (nextFraction: number) => {
      const scroller = scrollerRef.current;
      if (!scroller || count <= 0) return;
      scroller.style.scrollSnapType = "none";
      scroller.scrollLeft = snapLeftForFraction(nextFraction, scroller);
      setFraction(nextFraction);
      setActiveIndex(nearestIndex(nextFraction, count));
    },
    [count, snapLeftForFraction],
  );

  const setStoneFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || count <= 0) return;

      const rect = track.getBoundingClientRect();
      const nextFraction = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      scrollFromFraction(nextFraction);
    },
    [count, scrollFromFraction],
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!stoneDraggingRef.current) return;
      setStoneFromClientX(e.clientX);
    };

    const onPointerUp = () => {
      if (!stoneDraggingRef.current) return;
      stoneDraggingRef.current = false;
      setIsStoneDragging(false);
      // Decisive halfway snap from scrubber position (matches teal indicator).
      scrollToIndex(nearestIndex(fractionRef.current, count), "smooth");
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [setStoneFromClientX, scrollToIndex, count]);

  /** Mouse drag-to-scroll on the card track (desktop). */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !isMd) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || stoneDraggingRef.current) return;
      cardDraggingRef.current = true;
      cardDragStartX.current = e.pageX - scroller.getBoundingClientRect().left;
      cardDragScrollLeft.current = scroller.scrollLeft;
      scroller.style.scrollSnapType = "none";
      scroller.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!cardDraggingRef.current) return;
      e.preventDefault();
      const x = e.pageX - scroller.getBoundingClientRect().left;
      scroller.scrollLeft = cardDragScrollLeft.current - (x - cardDragStartX.current) * 1.5;
    };

    const endDrag = () => {
      if (!cardDraggingRef.current) return;
      cardDraggingRef.current = false;
      scroller.style.scrollSnapType = "x mandatory";
      scroller.style.cursor = "grab";
    };

    scroller.addEventListener("mousedown", onMouseDown);
    scroller.addEventListener("mousemove", onMouseMove);
    scroller.addEventListener("mouseup", endDrag);
    scroller.addEventListener("mouseleave", endDrag);
    return () => {
      scroller.removeEventListener("mousedown", onMouseDown);
      scroller.removeEventListener("mousemove", onMouseMove);
      scroller.removeEventListener("mouseup", endDrag);
      scroller.removeEventListener("mouseleave", endDrag);
    };
  }, [isMd, mobileGutter, mobileColW, count]);

  const [prevCount, setPrevCount] = useState(count);
  if (count !== prevCount) {
    setPrevCount(count);
    setActiveIndex(0);
    setFraction(0);
  }

  if (!count) return null;

  const title = (heading ?? "").trim() || "Our History";
  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= count - 1;
  const canNavigate = count > 1;

  const beginStoneDrag = (clientX: number) => {
    if (!isMd) return;
    stoneDraggingRef.current = true;
    setIsStoneDragging(true);
    const scroller = scrollerRef.current;
    if (scroller) scroller.style.scrollSnapType = "none";
    setStoneFromClientX(clientX);
  };

  const arrowBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <NavyWaveSection
      id="curling-history-timeline"
      bottomWave={true}
      contentClassName="mx-auto py-12"
      className="relative overflow-x-clip px-4 scroll-mt-24"
      aria-labelledby={labelId}
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="text-center">
          <h2 id={labelId} className="h2 mb-2 text-white">
            {title}
          </h2>
          <p className="body text-neutral-300 md:hidden">
            Swipe or use the arrows to explore our history
          </p>
          <p className="body hidden text-neutral-300 md:block">
            Slide the curling stone to explore our history
          </p>
        </div>

        {/* Timeline: decorative marker on mobile; interactive scrubber on desktop */}
        <div
          className="relative mx-auto mt-10 w-[min(100%,18rem)] px-[1.125rem] md:mt-16 md:w-full md:max-w-6xl md:px-4"
          aria-hidden={!isMd}
        >
          <div
            ref={trackRef}
            className={[
              "relative h-1 rounded-full bg-gmcc-teal/40",
              isMd ? "touch-none" : "pointer-events-none",
            ].join(" ")}
            onPointerDown={
              isMd
                ? (e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    beginStoneDrag(e.clientX);
                  }
                : undefined
            }
            role={isMd ? "slider" : undefined}
            aria-valuemin={isMd ? 1 : undefined}
            aria-valuemax={isMd ? count : undefined}
            aria-valuenow={isMd ? activeIndex + 1 : undefined}
            aria-valuetext={isMd ? `History item ${activeIndex + 1} of ${count}` : undefined}
            aria-label={isMd ? "Curling history timeline" : undefined}
            tabIndex={isMd ? 0 : undefined}
            onKeyDown={
              isMd
                ? (e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "Home") {
                      e.preventDefault();
                      scrollToIndex(e.key === "Home" ? 0 : activeIndex - 1);
                    } else if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "End") {
                      e.preventDefault();
                      scrollToIndex(e.key === "End" ? count - 1 : activeIndex + 1);
                    }
                  }
                : undefined
            }
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-gmcc-teal"
              style={{
                width: `${fraction * 100}%`,
                // Mobile steps between card indexes; ease so arrow taps don't pop.
                transition: isMd || isStoneDragging ? undefined : "width 280ms ease-out",
              }}
            />

            {items.map((_, idx) => {
              const nodeClass = [
                "absolute top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition",
                isMd ? "h-4 w-4" : "h-2.5 w-2.5",
                idx === activeIndex
                  ? "scale-125 border-white bg-gmcc-teal"
                  : "border-gmcc-teal bg-white/90",
                isMd ? "hover:bg-white" : "",
              ].join(" ");
              const nodeStyle = { left: `${fractionForIndex(idx, count) * 100}%` };

              if (!isMd) {
                return <span key={idx} className={nodeClass} style={nodeStyle} />;
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={nodeClass}
                  style={nodeStyle}
                  aria-label={`Go to history item ${idx + 1}`}
                  aria-current={idx === activeIndex ? "true" : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToIndex(idx);
                  }}
                />
              );
            })}

            <div
              className={[
                "absolute top-1/2 z-[2] -translate-x-1/2",
                isMd
                  ? [
                      "-translate-y-[3rem] touch-none transition-transform duration-150",
                      isStoneDragging ? "scale-110 cursor-grabbing" : "scale-100 cursor-grab",
                    ].join(" ")
                  : "pointer-events-none -translate-y-[2rem]",
              ].join(" ")}
              style={{
                left: `${fraction * 100}%`,
                width: stoneSize,
                height: stoneSize,
                // Discrete steps on mobile (arrows / swipe settle) — no scrubber sync.
                transition: isMd || isStoneDragging ? undefined : "left 280ms ease-out",
              }}
              onPointerDown={
                isMd
                  ? (e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      e.stopPropagation();
                      beginStoneDrag(e.clientX);
                    }
                  : undefined
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stoneSrc}
                alt=""
                width={stoneSize}
                height={stoneSize}
                draggable={false}
                className="pointer-events-none h-full w-full object-contain drop-shadow-lg"
                aria-hidden
              />
              {isMd ? <span className="sr-only">{stoneLabel}</span> : null}
            </div>
          </div>
        </div>

        <div className="relative mt-10 md:mt-14">
          <div
            ref={scrollerRef}
            className="overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              cursor: isMd ? "grab" : undefined,
              paddingLeft: mobileGutter,
              paddingRight: mobileGutter,
              scrollPaddingLeft: mobileGutter,
              scrollPaddingRight: mobileGutter,
            }}
            aria-roledescription="carousel"
            aria-label="History items"
          >
            <div
              ref={gridRef}
              className="relative inline-grid [grid-auto-flow:column] md:[grid-auto-columns:calc((100%-48px)/2)]"
              style={{
                minWidth: "100%",
                gap: CARD_GAP_PX,
                gridAutoColumns: isMd
                  ? undefined
                  : mobileColW > 0
                    ? `${mobileColW}px`
                    : "100%",
              }}
            >
              {items.map((item, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    cellRefs.current[idx] = el;
                  }}
                  className="relative min-w-0"
                  style={{
                    scrollSnapAlign: isMd ? "start" : "center",
                    scrollSnapStop: "always",
                  }}
                  aria-hidden={idx === activeIndex ? undefined : true}
                >
                  <div
                    className={[
                      "rounded-2xl border bg-white p-6 transition md:p-8",
                      idx === activeIndex
                        ? "border-gmcc-teal shadow-lg"
                        : "border-neutral-200 opacity-90",
                    ].join(" ")}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-gmcc-teal">
                      {idx + 1} / {count}
                    </p>
                    {item.historyItemHeader ? (
                      <h3 className="h3 text-gmcc-navy text-center">{item.historyItemHeader}</h3>
                    ) : null}
                    {item.historyItem ? (
                      <p className="body mt-3 whitespace-pre-line leading-relaxed text-neutral-700 text-center">
                        {item.historyItem}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canNavigate ? (
            <div className="mt-4 flex items-center justify-center gap-4 md:hidden">
              <button
                type="button"
                onClick={() => scrollToIndex(activeIndex - 1)}
                disabled={atStart}
                aria-label="Previous history item"
                className={arrowBtn}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="min-w-[4.5rem] text-center text-sm text-white/80" aria-live="polite">
                {activeIndex + 1} / {count}
              </span>
              <button
                type="button"
                onClick={() => scrollToIndex(activeIndex + 1)}
                disabled={atEnd}
                aria-label="Next history item"
                className={arrowBtn}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </NavyWaveSection>
  );
}
