"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import NavyWaveSection from "./navyWaveSection";

const FALLBACK_STONE_SRC = "/primaryNavIcons/CurlingCenterIcon.png";
const STONE_SIZE_PX = 64;
const STONE_SIZE_PX_MOBILE = 48;
const CARD_GAP_PX = 24;
const MOBILE_CARD_MIN_PX = 280;
const MOBILE_CARD_MAX_PX = 400;
const MOBILE_CARD_VW = 0.85;

export type CurlingHistoryTimelineProps = {
  heading?: string | null;
  items: string[];
  /** Curling stone image used as the scrubber handle. */
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
  const cleanItems = (items ?? []).map((t) => t.trim()).filter(Boolean);
  const count = cleanItems.length;
  const labelId = useId();

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const stoneDraggingRef = useRef(false);
  const isProgrammaticScroll = useRef(false);
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
  fractionRef.current = fraction;

  const stoneSrc = (stoneUrl ?? "").trim() || FALLBACK_STONE_SRC;
  const stoneLabel = (stoneAlt ?? "").trim() || "Curling stone";

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
  isMdRef.current = isMd;
  mobileGutterRef.current = mobileGutter;

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
      // Keep CSS scroll-snap off until we land, or it fights and jerks backward first.
      scroller.style.scrollSnapType = "none";
      scroller.scrollTo({ left: target, behavior });
      setActiveIndex(clamped);
      setFraction(fractionForIndex(clamped, count));

      const settleMs = behavior === "smooth" ? 450 : 0;
      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
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
    if (!scroller || count <= 0 || stoneDraggingRef.current) return;

    const current = scroller.scrollLeft;

    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < cellRefs.current.length; i++) {
      const el = cellRefs.current[i];
      if (!el) continue;
      const snapLeft = getSnapLeftForCell(el, scroller);
      const dist = Math.abs(snapLeft - current);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const nextFraction = fractionForIndex(bestIdx, count);
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
    if (!scroller) return;

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

  useEffect(() => {
    setActiveIndex(0);
    setFraction(0);
  }, [count]);

  if (!count) return null;

  const title = (heading ?? "").trim() || "Our History";

  const beginStoneDrag = (clientX: number) => {
    stoneDraggingRef.current = true;
    setIsStoneDragging(true);
    const scroller = scrollerRef.current;
    if (scroller) scroller.style.scrollSnapType = "none";
    setStoneFromClientX(clientX);
  };

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
          <p className="body text-neutral-300">
            Slide the curling stone to explore our history
          </p>
        </div>

        {/* Timeline scrubber: line + nodes + stone */}
        <div className="relative mx-auto mt-12 md:max-w-6xl px-4 md:mt-16">
          <div
            ref={trackRef}
            className="relative h-1 touch-none rounded-full bg-gmcc-teal/40"
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              beginStoneDrag(e.clientX);
            }}
            role="slider"
            aria-valuemin={1}
            aria-valuemax={count}
            aria-valuenow={activeIndex + 1}
            aria-valuetext={`History item ${activeIndex + 1} of ${count}`}
            aria-label="Curling history timeline"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "Home") {
                e.preventDefault();
                scrollToIndex(e.key === "Home" ? 0 : activeIndex - 1);
              } else if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "End") {
                e.preventDefault();
                scrollToIndex(e.key === "End" ? count - 1 : activeIndex + 1);
              }
            }}
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-gmcc-teal"
              style={{ width: `${fraction * 100}%` }}
            />

            {cleanItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={[
                  "absolute top-1/2 z-[1] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition",
                  idx === activeIndex
                    ? "scale-125 border-white bg-gmcc-teal"
                    : "border-gmcc-teal bg-white/90 hover:bg-white",
                ].join(" ")}
                style={{ left: `${fractionForIndex(idx, count) * 100}%` }}
                aria-label={`Go to history item ${idx + 1}`}
                aria-current={idx === activeIndex ? "true" : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToIndex(idx);
                }}
              />
            ))}

            <div
              className={[
                "absolute top-1/2 z-[2] -translate-x-1/2 -translate-y-[2.8rem] md:-translate-y-[3rem] touch-none transition-transform duration-150",
                isStoneDragging ? "scale-110 cursor-grabbing" : "scale-100 cursor-grab",
              ].join(" ")}
              style={{
                left: `${fraction * 100}%`,
                width: isMd ? STONE_SIZE_PX : STONE_SIZE_PX_MOBILE,
                height: STONE_SIZE_PX,
              }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                beginStoneDrag(e.clientX);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stoneSrc}
                alt=""
                width={isMd ? STONE_SIZE_PX : STONE_SIZE_PX_MOBILE}
                height={isMd ? STONE_SIZE_PX : STONE_SIZE_PX_MOBILE}
                draggable={false}
                className="pointer-events-none h-full w-full object-contain drop-shadow-lg"
                aria-hidden
              />
              <span className="sr-only">{stoneLabel}</span>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-14 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            cursor: "grab",
            paddingLeft: mobileGutter,
            paddingRight: mobileGutter,
            scrollPaddingLeft: mobileGutter,
            scrollPaddingRight: mobileGutter,
          }}
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
            {cleanItems.map((text, idx) => (
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
                  <p className="body mt-3 whitespace-pre-line leading-relaxed text-neutral-700">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NavyWaveSection>
  );
}
