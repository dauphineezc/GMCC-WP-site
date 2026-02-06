"use client";

import { useEffect, useMemo, useRef, useState } from "react";


type HistoryItem = {
  date: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string;
};

const GMCC = {
  navy: "#003A70",
  teal: "#0085ad",
  green: "#4C8B2B",
  darkTeal: "#00556f",
};

const COL_GAP_PX = 48;      // gap-8
const SIDE_PADDING_PX = 0; // paddingLeft/Right in your grid
const CARD_COL_MIN_PX = 320;

export default function HistorySection({
  heading,
  intro,
  items,
}: {
  heading: string;
  intro: string;
  items: HistoryItem[];
}) {
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

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const isProgrammaticScroll = useRef(false);

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const scrollToIndex = (idx: number) => {
    const scroller = scrollerRef.current;
    const cell = cellRefs.current[idx];
    if (!scroller || !cell) return;

    const targetLeft = cell.offsetLeft - SIDE_PADDING_PX;

    // Flag that we're doing a programmatic scroll so onScroll doesn't fight us
    isProgrammaticScroll.current = true;
    setActiveIndex(idx);

    scroller.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });

    // Clear the flag after scroll completes (give it enough time for smooth scroll)
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);
  };

  const goPrev = () => scrollToIndex(Math.max(0, activeIndex - 1));
  const goNext = () => scrollToIndex(Math.min(cleanItems.length - 1, activeIndex + 1));

  // Keep activeIndex in sync if the user manually scrolls/swipes
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      // Ignore scroll events during programmatic scrolling
      if (isProgrammaticScroll.current) return;

      const maxLeft = scroller.scrollWidth - scroller.clientWidth;
      const epsilon = 4; // px tolerance for "at the end"

      // If we're basically at the end, force last index
      if (maxLeft <= 0) {
        setActiveIndex(0);
        return;
      }
      if (scroller.scrollLeft >= maxLeft - epsilon) {
        setActiveIndex(cleanItems.length - 1);
        return;
      }
      if (scroller.scrollLeft <= epsilon) {
        setActiveIndex(0);
        return;
      }

      // Otherwise: choose closest cell to left edge
      const left = scroller.scrollLeft + SIDE_PADDING_PX;

      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < cellRefs.current.length; i++) {
        const el = cellRefs.current[i];
        if (!el) continue;
        const dist = Math.abs(el.offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      setActiveIndex((prev) => (prev === bestIdx ? prev : bestIdx));
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [cleanItems.length]);

  // Drag-to-scroll handlers
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onMouseDown = (e: MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      
      setIsDragging(true);
      dragStartX.current = e.pageX - scroller.offsetLeft;
      dragScrollLeft.current = scroller.scrollLeft;
      scroller.style.scrollSnapType = "none"; // Disable snap while dragging
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - scroller.offsetLeft;
      const walk = (x - dragStartX.current) * 1.5; // Multiply for faster scroll
      scroller.scrollLeft = dragScrollLeft.current - walk;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      scroller.style.scrollSnapType = "x mandatory"; // Re-enable snap
    };

    const onMouseLeave = () => {
      if (!isDragging) return;
      setIsDragging(false);
      scroller.style.scrollSnapType = "x mandatory";
    };

    scroller.addEventListener("mousedown", onMouseDown);
    scroller.addEventListener("mousemove", onMouseMove);
    scroller.addEventListener("mouseup", onMouseUp);
    scroller.addEventListener("mouseleave", onMouseLeave);

    return () => {
      scroller.removeEventListener("mousedown", onMouseDown);
      scroller.removeEventListener("mousemove", onMouseMove);
      scroller.removeEventListener("mouseup", onMouseUp);
      scroller.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [isDragging]);

  const [colPx, setColPx] = useState<number>(CARD_COL_MIN_PX);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const calc = () => {
      const w = scroller.clientWidth;
      const isMd = window.matchMedia("(min-width: 768px)").matches;

      const DESKTOP_COLS = 3; // change to 3, 4, etc.

      if (isMd) {
        const cols = 3; // or 2
        const px =
          (w - 2 * SIDE_PADDING_PX - (cols - 1) * COL_GAP_PX) / cols;
      
        setColPx(px)

      } else {
        // mobile: comfy single-card view (no need for exact)
        const px = Math.min(w * 0.82, 420); // tweak if you want
        setColPx(Math.max(CARD_COL_MIN_PX, Math.floor(px)));
      }
    };

    calc();

    const ro = new ResizeObserver(calc);
    ro.observe(scroller);

    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => calc();
    mq.addEventListener?.("change", onMq);

    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      mq.removeEventListener?.("change", onMq);
      window.removeEventListener("resize", calc);
    };
  }, []);


  if (!cleanItems.length) return null;

  return (
    <section className="px-4 py-14 scroll-mt-24 bg-neutral-100">
      <div className="mx-auto max-w-6xl">
        {/* Header row */}
        <div className="text-center">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-500">History</h2>
          {intro ? <p className="mt-10 mx-auto max-w-3xl text-neutral-700">{intro}</p> : null}
        </div>
  
        {/* arrows: move by ONE card */}
        <div className="hidden md:flex gap-2 pt-2 justify-end">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-sm font-semibold shadow-sm disabled:opacity-40"
            aria-label="Previous"
            style={{ color: GMCC.navy }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === cleanItems.length - 1}
            className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-sm font-semibold shadow-sm disabled:opacity-40"
            aria-label="Next"
            style={{ color: GMCC.navy }}
          >
            →
          </button>
        </div>
  
        {/* Shared scroller (timeline + cards in same columns) */}
        <div
          ref={scrollerRef}
          className="mt-8 overflow-x-auto pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: isDragging ? "none" : "auto",
          }}
        >
          {/* 
            Make each column:
            - mobile: minmax(320px, 80vw)
            - md+: exactly 1/2 of the visible scroller width (minus padding + 1gap)
          */}
          <div
            className="relative inline-grid gap-8"
            style={{
              minWidth: "100%",
              gridAutoFlow: "column",
              gridAutoColumns: `${colPx}px`,
              paddingLeft: SIDE_PADDING_PX,
              paddingRight: SIDE_PADDING_PX,
            }}
          >
            {/* Timeline line across the FULL scroll width */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-[44px] h-[2px]"
              style={{ backgroundColor: GMCC.teal, opacity: 0.35 }}
            />
  
            {cleanItems.map((it, idx) => (
              <div
                key={`${it.date}-${idx}`}
                ref={(el) => {
                  cellRefs.current[idx] = el;
                }}
                className="relative"
                style={{
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                }}
              >
                {/* Date label + pin on the line */}
                <button
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  className="group relative mx-auto block w-full select-none"
                  aria-label={`Go to ${it.date || `item ${idx + 1}`}`}
                >
                  <div
                    className="text-center text-sm font-semibold tracking-wide"
                    style={{ color: GMCC.navy }}
                  >
                    {it.date || `Item ${idx + 1}`}
                  </div>
                </button>
  
                {/* Polaroid card */}
                <div className="mt-8 mb-2 flex justify-center">
                  {/* wrapper ensures the card can grow to fill the column nicely */}
                  <div className="w-full max-w-none">
                    <PolaroidCard item={it} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* mobile arrows */}
        <div className="mt-2 flex items-center justify-center gap-2 md:hidden">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-sm font-semibold shadow-sm disabled:opacity-40"
            aria-label="Previous"
            style={{ color: GMCC.navy }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === cleanItems.length - 1}
            className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-sm font-semibold shadow-sm disabled:opacity-40"
            aria-label="Next"
            style={{ color: GMCC.navy }}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}  

function PolaroidCard({ item }: { item: HistoryItem }) {
  return (
    <div
      className={[
        "relative w-full rounded-2xl bg-white border border-neutral-200",
        "transition hover:-translate-y-0.5 hover:shadow-xl hover:border-neutral-300",
      ].join(" ")}
    >
      {/* top pin */}
      <div className="absolute -top-8 left-1/8">
        <div className="grid h-10 w-10 place-items-center">
          <BrandPin className="h-10 w-10 scale-x-[-1]" />
        </div>
      </div>

      <div className="p-5 pt-8">
        <div className="overflow-hidden rounded-sm bg-neutral-100 ring-1 ring-neutral-200">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.imageAlt || ""}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              decoding="async"
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
      {/* darker cap */}
      <path
        d="M24.46 28.298L46.873 5.883L58.33 17.338L35.914 39.753z"
        fill={GMCC.darkTeal}
      />
      {/* main body */}
      <g fill={GMCC.teal}>
        <path d="M43.6 54.6c.9-7.8-2.5-17.1-9.8-24.3S17.2 19.6 9.4 20.4l34.2 34.2" />
        <path d="M64 22.9c-5.2.6-11.4-1.7-16.3-6.6c-4.9-4.9-7.2-11.1-6.6-16.3L64 22.9" />
      </g>
    </svg>
  );
}
