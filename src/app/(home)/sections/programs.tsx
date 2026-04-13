// src/app/(home)/sections/programs.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export type ProgramCard = {
  href: string;
  label: string;
  caption?: string;
  imageUrl: string | null;
  imageAlt: string;
};

type ProgramsSectionProps = {
  programs: ProgramCard[];
  heading?: string;
};

// Layout constants
const DESKTOP_COLS = 4;
const COL_GAP_PX = 24; // gap-6
const MOBILE_CARD_MAX_PX = 420;
/** Subpixel / gap / floor(column width) can make the last snap a few px past maxScrollLeft; too small breaks the final desktop "page". */
const SNAP_EPSILON_PX = { md: 32, sm: 12 } as const;

export default function ProgramsSection({
  programs,
  heading = "Programs",
}: 
  ProgramsSectionProps) {
  const items = useMemo(
    () =>
      (programs ?? []).filter(
        (p) =>
          (p?.href || "").trim() &&
          ((p?.label || "").trim() ||
            (p?.caption || "").trim() ||
            !!p?.imageUrl)
      ),
    [programs]
  );

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

  // Breakpoint tracking
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Compute desktop column width so 4 cards fit exactly (no peeking)
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

  // Snap helpers
  const getSnapLeftForCell = (el: HTMLDivElement) => el.offsetLeft;

  const getSnapPositions = () =>
    cellRefs.current
      .map((el) => (el ? getSnapLeftForCell(el) : null))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

  // Max snap index to keep only FULL cards visible:
  // - mobile: last card
  // - desktop: last "frame start" = (n - DESKTOP_COLS)
  const getMaxIndex = (n: number) => {
    if (n <= 0) return 0;
    if (!isMd) return n - 1;
    return Math.max(0, n - DESKTOP_COLS);
  };

  // Last snap index actually reachable by scrollLeft.
  const getMaxReachableIndex = (scroller: HTMLDivElement, positions: number[]) => {
    const epsilon = isMd ? SNAP_EPSILON_PX.md : SNAP_EPSILON_PX.sm;
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const cap = getMaxIndex(positions.length);
    let reachable = 0;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] <= maxScrollLeft + epsilon) reachable = i;
    }
    reachable = Math.min(reachable, cap);
    // Last desktop frame: layout math can overshoot maxScrollLeft by more than epsilon; still allow scrolling to the end.
    if (isMd && cap > reachable && positions.length > DESKTOP_COLS) {
      const lastSnap = positions[cap];
      if (lastSnap > maxScrollLeft && lastSnap - maxScrollLeft <= COL_GAP_PX * 2 + 8) {
        reachable = cap;
      }
    }
    return reachable;
  };

  const syncEdgeAndActive = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const positions = getSnapPositions();
    if (!positions.length) return;

    const epsilon = isMd ? SNAP_EPSILON_PX.md : SNAP_EPSILON_PX.sm;
    const current = scroller.scrollLeft;

    // nearest snap index (History-style)
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

    // treat as "end" if you’re within epsilon of the last full-frame snap
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

    const n = positions.length;
    const maxIdx = getMaxReachableIndex(scroller, positions);
    const targetIdx = Math.max(0, Math.min(idx, maxIdx));
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const lastFrameIdx = getMaxIndex(n);
    const rawLeft = positions[targetIdx];
    // Last desktop frame: ideal snap can sit barely beyond maxScrollLeft; scroll to the true end so card 8 is not clipped off the rail.
    const targetLeft =
      isMd && targetIdx === lastFrameIdx && n > DESKTOP_COLS && rawLeft > maxScrollLeft
        ? maxScrollLeft
        : Math.max(0, Math.min(rawLeft, maxScrollLeft));

    isProgrammaticScroll.current = true;
    scroller.scrollTo({ left: targetLeft, behavior: "smooth" });

    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
      syncEdgeAndActive();
    }, 450);
  };

  const goPrev = () => scrollToIndex(activeIndex - 1);
  const goNext = () => scrollToIndex(activeIndex + 1);
  const EDGE_PAD_PX = 6; // prevents left/right edge clipping (shadow/border)

  // Keep active + edges in sync on scroll
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (!isProgrammaticScroll.current) syncEdgeAndActive();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    syncEdgeAndActive();

    return () => scroller.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, isMd, desktopColW]);

  // Mouse drag-to-scroll (history-style). We disable snap while dragging and
  // suppress click-through when the gesture was actually a drag.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("a,button,input,textarea,select,label"));
    };

    const onMouseDown = (e: MouseEvent) => {
      // Keep controls and card links clickable.
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
      // Clear after click-capture phase has a chance to run.
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
  }, [items.length, isMd]);

  if (!items.length) return null;

  const arrowBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-gmcc-navy text-white border border-gmcc-navy body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gmcc-navy/80";

  return (
    <section className="relative overflow-hidden pt-8 pb-8">
      {/* Background logo pieces, clipped to section bounds
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src="/GreaterLogoBG.png"
          alt=""
          className="absolute bottom-0 left-0 w-[min(500px,42vw)] select-none opacity-50"
          draggable={false}
        />
        <img
          src="/GreaterLogoBG.png"
          alt=""
          className="absolute right-0 top-0 w-[min(500px,42vw)] select-none opacity-50"
          draggable={false}
        />
      </div> */}

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="h2 tracking-wide text-gmcc-navy text-3xl text-center">{heading}</h2>
        </div>

        <a
          href={'/programs'}
          className="block text-right text-sm text-gmcc-navy font-semibold underline hover:translate-y-[-2px] hover:text-gmcc-teal"
        >
          {"View all programs"}
        </a>

        <div className="mt-4 relative w-full min-w-0 max-w-full">
          {/* Desktop arrows (in outer margins) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden md:block">
            <button
              type="button"
              onClick={goPrev}
              disabled={atStart}
              aria-label="Previous programs"
              className={`${arrowBtn} pointer-events-auto absolute left-[-6px] top-1/2 -translate-y-1/2`}
            >
              ←
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={atEnd}
              aria-label="Next programs"
              className={`${arrowBtn} pointer-events-auto absolute right-[-6px] top-1/2 -translate-y-1/2`}
            >
              →
            </button>
          </div>

          {/* Cards rail uses full content width; arrows live outside this width */}
          <div className="mx-auto w-full min-w-0 max-w-6xl overflow-visible">
            {/* Scroller: must be width-constrained so its overflow stays internal */}
            <div
              ref={scrollerRef}
              className="w-full min-w-0 max-w-full overflow-x-auto pb-4 pt-1 px-[6px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                cursor: "grab",
                scrollPaddingLeft: EDGE_PAD_PX,
                scrollPaddingRight: EDGE_PAD_PX,
              }}
            >
              {/* Use block-level grid (not inline-grid) to avoid shrinkwrap overflow.
                  Width strategy:
                  - width: max-content => grid grows horizontally inside scroller only
                  - minWidth: 100% => first frame still fills viewport
              */}
              <div
                className="grid gap-6"
                style={{
                  gridAutoFlow: "column",
                  gridAutoColumns: isMd ? `${desktopColW}px` : "100%",
                  width: "max-content",
                  minWidth: "100%",
                }}
              >
                {items.map((p, idx) => (
                  <div
                    key={`${p.href}-${idx}`}
                    ref={(el) => {
                      cellRefs.current[idx] = el;
                    }}
                    style={{
                      scrollSnapAlign: "start",
                      scrollSnapStop: "always",
                    }}
                  >
                    {/* Mobile: center card within the 100% slide */}
                    <div
                      className="mx-auto w-full md:mx-0"
                      style={{ maxWidth: isMd ? undefined : MOBILE_CARD_MAX_PX }}
                    >
                      <ProgramCardView program={p} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile controls */}
          <div className="mt-4 flex items-center justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={goPrev}
              disabled={atStart}
              aria-label="Previous programs"
              className={arrowBtn}
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={atEnd}
              aria-label="Next programs"
              className={arrowBtn}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgramCardView({ program }: { program: ProgramCard }) {
  return (
    <div className="group card card-hover card-link overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
        {program.imageUrl ? (
          <img
            src={program.imageUrl}
            alt={program.imageAlt || ""}
            className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
            loading="lazy"
            decoding="async"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <div className="h-40 w-full bg-neutral-200" />
        )}
      </div>

      <div className="pt-4 text-center">
        <div className="text-lg font-semibold text-gmcc-navy group-hover:text-gmcc-teal">
          {program.label}
        </div>

        {program.caption ? (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {program.caption}
          </p>
        ) : (
          <div className="mt-2 h-5" />
        )}

        <div className="mt-4 flex justify-center">
          <Link href={program.href} className="btn btn-primary group-hover:bg-gmcc-navy/85">
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}
