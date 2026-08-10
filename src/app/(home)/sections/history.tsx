"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NavyTopWave } from "@/components/navyWaveSection";

type HistoryItem = {
  date: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string;
  objectPosition?: string;
};

type HistorySectionProps = {
  heading: string;
  items: HistoryItem[];
};

// Layout constants (keep in sync with Tailwind classes below)
const SIDE_PADDING_PX = 0; // extra left/right padding applied inside the grid (we use gutter on the scroller instead)
const MOBILE_CARD_MIN_PX = 320;
const MOBILE_CARD_MAX_PX = 420;
const MOBILE_CARD_VW = 0.82;

export default function HistorySection({ heading, items }: HistorySectionProps) {
  /**
   * Filter out completely-empty items so the timeline doesn't render blank cards.
   */
  const cleanItems = useMemo(
    () =>
      (items ?? []).filter(
        (it) =>
          (it?.date || "").trim() ||
          (it?.title || "").trim() ||
          (it?.body || "").trim() ||
          !!it?.imageUrl
      ),
    [items]
  );

  /**
   * Refs for measuring and controlling horizontal scroll/snap.
   */
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);

  /**
   * UI state
   */
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxReachableIndex, setMaxReachableIndex] = useState(0);

  /**
   * Responsive state
   */
  const [isMd, setIsMd] = useState(false);
  const [mobileGutter, setMobileGutter] = useState(0);
  const [mobileColW, setMobileColW] = useState(0);

  /**
   * Timeline line width (must match the scrollable grid width)
   */
  const [trackWidth, setTrackWidth] = useState<number>(0);

  /**
   * Guard to keep our "active item" computation from fighting smooth programmatic scroll.
   */
  const isProgrammaticScroll = useRef(false);

  /**
   * Mouse drag-to-scroll state (desktop convenience)
   */
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  /**
   * Track breakpoint (md) in JS so we can compute snap positions accurately:
   * - desktop: snap to "start" of each card
   * - mobile: snap to "center" of each card + gutter padding so ends can center
   */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  /**
   * Compute mobile "gutter" padding so each card can be centered when snapping.
   * This creates equal left/right padding on the scroller, matching the mobile card width.
   *
   * Use clientWidth (not content-minus-padding): gutters are applied as padding on this
   * same scroller, so subtracting padding would feedback into an infinite resize loop.
   */
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

      const w = Math.floor(scroller.clientWidth);
      const cardW = Math.min(
        MOBILE_CARD_MAX_PX,
        w,
        Math.max(
          Math.min(MOBILE_CARD_MIN_PX, w),
          Math.floor(w * MOBILE_CARD_VW)
        )
      );
      const gutter = Math.max(0, Math.floor((w - cardW) / 2));
      setMobileColW((prev) => (prev === cardW ? prev : cardW));
      setMobileGutter((prev) => (prev === gutter ? prev : gutter));
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

  /**
   * Measure the full scrollable width of the grid so the teal "timeline line" spans the entire track.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    const grid = gridRef.current;
    if (!scroller || !grid) return;

    const calc = () => setTrackWidth(grid.scrollWidth);

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(scroller);
    ro.observe(grid);

    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, [cleanItems.length]);

  /**
   * Given a card element, compute the scrollLeft value that represents its snap position.
   * - Desktop: align card start to viewport start
   * - Mobile: align card center to viewport center (accounts for mobile gutter padding)
   */
  const getSnapLeftForCell = (el: HTMLDivElement, scroller: HTMLDivElement) => {
    // el.offsetLeft is relative to the grid; scroller padding shifts the content.
    const leftInScroller = mobileGutter + el.offsetLeft - SIDE_PADDING_PX;

    if (isMd) return leftInScroller;

    // Center snap on mobile
    return leftInScroller + el.clientWidth / 2 - scroller.clientWidth / 2;
  };

  /**
   * The last card index whose snap position is actually reachable by scrollLeft.
   * On desktop we show multiple cards at once, so this is often less than (items - 1).
   */
  const getMaxReachableIndex = (scroller: HTMLDivElement) => {
    const epsilon = isMd ? 4 : 10;
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);

    let reachable = 0;
    for (let i = 0; i < cellRefs.current.length; i++) {
      const el = cellRefs.current[i];
      if (!el) continue;

      const snapLeft = getSnapLeftForCell(el, scroller);
      if (snapLeft <= maxScrollLeft + epsilon) {
        reachable = i;
      }
    }

    return reachable;
  };

  /**
   * Scroll to a specific card index (membership-style index navigation).
   */
  const scrollToIndex = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const maxIndex = getMaxReachableIndex(scroller);
    const clamped = Math.max(0, Math.min(index, maxIndex));
    const targetEl = cellRefs.current[clamped];
    if (!targetEl) return;
    const target = getSnapLeftForCell(targetEl, scroller);

    isProgrammaticScroll.current = true;
    scroller.scrollTo({ left: target, behavior: "smooth" });
    setActiveIndex(clamped);

    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 450);
  };

  const goPrev = () => scrollToIndex(activeIndex - 1);
  const goNext = () => scrollToIndex(activeIndex + 1);
  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= maxReachableIndex;

  /**
   * Keep activeIndex + edge state in sync when user manually scrolls/swipes.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      const current = scroller.scrollLeft;
      const currentMaxReachable = getMaxReachableIndex(scroller);
      setMaxReachableIndex(currentMaxReachable);

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

      setActiveIndex(Math.min(bestIdx, currentMaxReachable));
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initialize
    return () => scroller.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanItems.length, isMd, mobileGutter, mobileColW]);

  /**
   * Mouse drag-to-scroll (desktop only behavior; safe on mobile).
   * We temporarily disable snap while dragging to avoid jitter.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      isDraggingRef.current = true;
      dragStartX.current = e.pageX - scroller.getBoundingClientRect().left;
      dragScrollLeft.current = scroller.scrollLeft;

      scroller.style.scrollSnapType = "none";
      scroller.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const x = e.pageX - scroller.getBoundingClientRect().left;
      const walk = (x - dragStartX.current) * 1.5;
      scroller.scrollLeft = dragScrollLeft.current - walk;
    };

    const endDrag = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMd, mobileGutter, mobileColW]);
  if (!cleanItems.length) return null;

  return (
    <section className="relative scroll-mt-24">
      {/* Standard top wave — sits above the navy band so troughs show page white */}
      <NavyTopWave />

      <div className="relative -mt-[3px] overflow-x-clip bg-gmcc-navy px-4 pt-8 pb-14 md:pt-10">
        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center">
            <h2 className="h2 mt-8 mb-0 text-white">{heading}</h2>
          </div>

          {/* Desktop arrows */}
          <div className="mt-0 hidden justify-end gap-2 pt-2 md:flex">
            <button
              type="button"
              onClick={goPrev}
              disabled={atStart}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-300 body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={atEnd}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-300 body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90"
              aria-label="Next"
            >
              →
            </button>
          </div>

          {/* Scroller */}
          <div
            ref={scrollerRef}
            className="mt-8 overflow-x-auto pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
              className="relative inline-grid gap-8 [grid-auto-flow:column] md:[grid-auto-columns:calc((100%-64px)/3)]"
              style={{
                minWidth: "100%",
                gridAutoColumns: isMd
                  ? undefined
                  : mobileColW > 0
                    ? `${mobileColW}px`
                    : "100%",
              }}
            >
              {/* Timeline track line spanning full scroll width */}
              <div
                className="pointer-events-none absolute left-0 top-[44px] h-[4px]"
                style={{
                  width: trackWidth ? `${trackWidth}px` : "100%",
                  backgroundColor: "var(--gmcc-teal)",
                  borderRadius: "9999px",
                }}
              />

              {cleanItems.map((it, idx) => (
                <div
                  key={`${it.date}-${idx}`}
                  ref={(el) => {
                    cellRefs.current[idx] = el;
                  }}
                  className="relative min-w-0"
                  style={{
                    scrollSnapAlign: isMd ? "start" : "center",
                    scrollSnapStop: "always",
                  }}
                >
                  {/* Date label */}
                  <button
                    type="button"
                    onClick={() => scrollToIndex(idx)}
                    className="group relative mx-auto block w-full select-none"
                    aria-label={`Go to ${it.date || `item ${idx + 1}`}`}
                  >
                    <div className="text-center text-base font-semibold tracking-widest text-white">
                      {it.date || `Item ${idx + 1}`}
                    </div>
                  </button>

                  {/* Card */}
                  <div className="mt-10 mb-2 flex justify-center">
                    <div className="min-w-0 w-full max-w-full select-none">
                      <PolaroidCard item={it} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile arrows */}
          <div className="mt-2 flex items-center justify-center gap-2 md:hidden">
            <button
              type="button"
              onClick={goPrev}
              disabled={atStart}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-300 body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={atEnd}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-300 body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90"
              aria-label="Next"
            >
              →
            </button>
          </div>
        </div>

        {/* Custom bottom wave — absolute so Centers can overlap cleanly */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 390 120"
            className="block h-14 w-full text-gmcc-navy md:hidden"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="
                M0,98
                C78,62 135,54 195,74
                C255,96 322,88 390,60
                L390,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>

          <svg
            viewBox="0 0 1440 120"
            className="hidden h-16 w-full text-gmcc-navy md:block"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="
                M0,110
                C300,-50  500,120  800,100
                S1000,0 1440,0
                L1440,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

function PolaroidCard({ item }: { item: HistoryItem }) {
  return (
    <div
      className={[
        "relative min-w-0 max-w-full w-full rounded-2xl border border-neutral-200 bg-white",
        "transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-xl",
      ].join(" ")}
    >
      {/* Top pin */}
      <div className="absolute -top-11 left-4 md:left-1/12">
        <div className="grid h-12 w-12 place-items-center">
          <BrandPin className="h-14 w-14 scale-x-[-1] rotate-[20deg]" />
        </div>
      </div>

      <div className="p-5 pt-8">
        <div className="overflow-hidden rounded-sm bg-neutral-100 ring-1 ring-neutral-200">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.imageAlt || ""}
              className="aspect-[4/3] w-full select-none object-cover"
              style={
                item.objectPosition ? { objectPosition: item.objectPosition } : undefined
              }
              loading="lazy"
              decoding="async"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            <div className="aspect-[4/3] w-full bg-neutral-200" />
          )}
        </div>

        <div className="mt-4 text-center">
          <div className="text-xs font-semibold tracking-wide text-neutral-500">{item.date}</div>
          <div className="mt-1 text-base font-semibold text-neutral-900">{item.title}</div>
        </div>

        {item.body ? (
          <p className="mt-4 text-center text-sm leading-relaxed text-neutral-700">{item.body}</p>
        ) : null}
      </div>
    </div>
  );
}

function BrandPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* needle / metal */}
      <path
        d="M24.5 35.5C17.8 42.9 2.9 60.9.6 63.1c0 0-.1 0-.1.1c-.9.9-.6 1.2.3.3c2-2 20.2-17.2 27.6-23.9l-3.9-4.1"
        fill="#d0d0d0"
      />
      {/* main body */}
      <path
        d="M24.46 28.298L46.873 5.883L58.33 17.338L35.914 39.753z"
        fill="var(--gmcc-green-dark)"
      />
      {/* caps */}
      <g fill="var(--gmcc-green)">
        <path d="M43.6 54.6c.9-7.8-2.5-17.1-9.8-24.3S17.2 19.6 9.4 20.4l34.2 34.2" />
        <path d="M64 22.9c-5.2.6-11.4-1.7-16.3-6.6c-4.9-4.9-7.2-11.1-6.6-16.3L64 22.9" />
      </g>
    </svg>
  );
}
