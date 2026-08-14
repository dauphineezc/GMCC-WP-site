// src/app/(home)/sections/programs.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import Link from "next/link";

export type ProgramCard = {
  href: string;
  label: string;
  caption?: string;
  imageUrl: string | null;
  imageAlt: string;
  objectPosition?: string;
};

type ProgramsSectionProps = {
  programs: ProgramCard[];
  heading?: string;
};

// Layout constants
const MAX_COLS = 4;
const COL_GAP_PX = 24; // gap-6
/** Permanent side inset outside the scroller (does not scroll away). */
const EDGE_PAD_PX = 16;
const CARD_MIN_PX = 220;
const CARD_MAX_PX = 280;
/** Triple the track so we can jump between identical copies without a visible reset. */
const LOOP_COPIES = 3;

type CarouselLayout = {
  cols: number;
  cardW: number;
  /**
   * Side inset when the column track is narrower than the scroller.
   * Used as scroll-padding; with center snap, peeks appear on both sides.
   */
  peekGutter: number;
  /** True when gutters are large enough for intentional adjacent-card peeks. */
  peek: boolean;
};

/**
 * Prefer flush even columns within [CARD_MIN, CARD_MAX].
 * Never exceed CARD_MAX — leftover space centers the track (and peeks only when
 * there is at least half a card of room total, ~¼ visible each side).
 *
 * `scrollerWidth` is the width inside the permanent EDGE_PAD wrapper.
 */
function computeCarouselLayout(scrollerWidth: number): CarouselLayout {
  const w = Math.max(0, Math.floor(scrollerWidth));

  const centered = (cols: number, cardW: number, peek: boolean): CarouselLayout => {
    const gaps = COL_GAP_PX * (cols - 1);
    const track = cols * cardW + gaps;
    const peekGutter = Math.max(0, Math.floor((w - track) / 2));
    return { cols, cardW, peekGutter, peek };
  };

  for (let cols = MAX_COLS; cols >= 1; cols--) {
    const gaps = COL_GAP_PX * (cols - 1);
    const flushW = Math.floor((w - gaps) / cols);

    if (flushW < CARD_MIN_PX) continue;

    if (flushW <= CARD_MAX_PX) {
      // Exact even columns — fill the scroller, no side peeks.
      return { cols, cardW: flushW, peekGutter: 0, peek: false };
    }

    // Flush would exceed max — pin to max and center any leftover.
    const leftover = w - (cols * CARD_MAX_PX + gaps);

    if (leftover >= Math.floor(CARD_MAX_PX / 2)) {
      // Half-card total peek budget → ~¼ card each side.
      // w = cols*cardW + gaps + 0.5*cardW
      let cardW = Math.floor((w - gaps) / (cols + 0.5));
      cardW = Math.min(CARD_MAX_PX, Math.max(CARD_MIN_PX, cardW));
      return centered(cols, cardW, true);
    }

    // Not enough room for real peeks — still honor max and center the track.
    return centered(cols, CARD_MAX_PX, false);
  }

  // Narrow viewport: one column, capped at max, centered when narrower than scroller.
  const cardW = Math.min(CARD_MAX_PX, Math.max(0, w));
  const peekGutter = Math.max(0, Math.floor((w - cardW) / 2));
  return {
    cols: 1,
    cardW,
    peekGutter,
    peek: peekGutter >= Math.floor(cardW / 4),
  };
}

export default function ProgramsSection({
  programs,
  heading = "Programs",
}: ProgramsSectionProps) {
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
  const [layout, setLayout] = useState<CarouselLayout>({
    cols: MAX_COLS,
    cardW: 260,
    peekGutter: 0,
    peek: false,
  });

  const isProgrammaticScroll = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDragRef = useRef(false);

  const n = items.length;
  // Single-card (or single-col) inset layouts center-snap so peeks split left/right.
  // Multi-col peeks keep start-snap with equal scroll-padding so a full column group stays in view.
  const useCenterSnap = layout.peekGutter > 0 && layout.cols === 1;
  // Loop whenever there is more than one full viewport of cards to scroll through.
  const loopEnabled = n > layout.cols;

  const trackItems = useMemo(() => {
    if (!n) return [] as Array<{ program: ProgramCard; logical: number; copy: number; key: string }>;
    const copies = loopEnabled ? LOOP_COPIES : 1;
    const out: Array<{ program: ProgramCard; logical: number; copy: number; key: string }> = [];
    for (let copy = 0; copy < copies; copy++) {
      for (let i = 0; i < n; i++) {
        out.push({
          program: items[i],
          logical: i,
          copy,
          key: `${copy}-${items[i].href}-${i}`,
        });
      }
    }
    return out;
  }, [items, n, loopEnabled]);

  // Breakpoint tracking
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Column widths from scroller viewport (avoids 100% + max-content circular sizing)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const calc = () => {
      const next = computeCarouselLayout(scroller.clientWidth);
      setLayout((prev) =>
        prev.cols === next.cols &&
        prev.cardW === next.cardW &&
        prev.peekGutter === next.peekGutter &&
        prev.peek === next.peek
          ? prev
          : next
      );
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(scroller);

    window.addEventListener("resize", calc);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, []);

  const getSnapLeftForCell = (el: HTMLDivElement, scroller: HTMLDivElement) => {
    if (useCenterSnap) {
      return el.offsetLeft + el.clientWidth / 2 - scroller.clientWidth / 2;
    }
    // Start-align into the snapport (inset by scroll-padding when peekGutter > 0).
    return Math.max(0, el.offsetLeft - layout.peekGutter);
  };

  const getSnapPositions = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return [] as number[];
    return cellRefs.current
      .slice(0, trackItems.length)
      .map((el) => (el ? getSnapLeftForCell(el, scroller) : null))
      .filter((v): v is number => v !== null);
  };

  /** Width of one logical set (distance from copy 0 start → copy 1 start). */
  const getSetWidth = () => {
    if (!loopEnabled || n <= 0) return 0;
    const scroller = scrollerRef.current;
    const first = cellRefs.current[0];
    const second = cellRefs.current[n];
    if (!scroller || !first || !second) return 0;
    return getSnapLeftForCell(second, scroller) - getSnapLeftForCell(first, scroller);
  };

  /** Keep scrollLeft inside the middle copy so prev/next never hit a hard edge. */
  const normalizeLoopScroll = () => {
    if (!loopEnabled) return;
    const scroller = scrollerRef.current;
    const setWidth = getSetWidth();
    if (!scroller || setWidth <= 0) return;

    let left = scroller.scrollLeft;
    // Middle copy occupies [setWidth, 2*setWidth)
    if (left >= setWidth && left < setWidth * 2) return;

    while (left < setWidth) left += setWidth;
    while (left >= setWidth * 2) left -= setWidth;

    if (Math.abs(left - scroller.scrollLeft) < 0.5) return;

    scroller.style.scrollSnapType = "none";
    scroller.scrollLeft = left;
    // Clear inline override so Tailwind snap-x/snap-mandatory apply again.
    requestAnimationFrame(() => {
      scroller.style.scrollSnapType = "";
    });
  };

  const findNearestAbsIndex = () => {
    const scroller = scrollerRef.current;
    const positions = getSnapPositions();
    if (!scroller || !positions.length) return loopEnabled ? n : 0;

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
    return bestIdx;
  };

  const syncActiveIndex = () => {
    if (!isProgrammaticScroll.current) normalizeLoopScroll();
  };

  const scrollToAbsIndex = (absIdx: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const positions = getSnapPositions();
    if (!positions.length) return;

    const clamped = Math.max(0, Math.min(absIdx, positions.length - 1));
    const targetLeft = Math.max(0, positions[clamped]);

    isProgrammaticScroll.current = true;
    scroller.scrollTo({ left: targetLeft, behavior });

    const settleMs = behavior === "smooth" ? 450 : 0;
    window.setTimeout(() => {
      normalizeLoopScroll();
      isProgrammaticScroll.current = false;
      syncActiveIndex();
    }, settleMs);
  };

  const canNavigate = loopEnabled;

  const goPrev = () => {
    if (!canNavigate) return;
    scrollToAbsIndex(findNearestAbsIndex() - 1);
  };
  const goNext = () => {
    if (!canNavigate) return;
    scrollToAbsIndex(findNearestAbsIndex() + 1);
  };

  // Start on the middle copy so both directions have runway.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !n) return;

    if (!loopEnabled) {
      scroller.scrollLeft = 0;
      return;
    }

    // Wait a frame so cell refs / column widths are laid out.
    const id = requestAnimationFrame(() => {
      const middleStart = cellRefs.current[n];
      if (!middleStart) return;
      isProgrammaticScroll.current = true;
      scroller.scrollLeft = getSnapLeftForCell(middleStart, scroller);
      requestAnimationFrame(() => {
        isProgrammaticScroll.current = false;
      });
    });

    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, loopEnabled, layout.cols, layout.cardW, layout.peekGutter, layout.peek]);

  // Normalize when the user crosses a copy boundary.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (!isProgrammaticScroll.current) syncActiveIndex();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    syncActiveIndex();

    const raf = requestAnimationFrame(() => syncActiveIndex());
    const timeout = window.setTimeout(() => syncActiveIndex(), 60);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackItems.length, loopEnabled, layout.cols, layout.cardW, layout.peekGutter, layout.peek]);

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
      scroller.style.scrollSnapType = "";
      scroller.style.cursor = "grab";
      scroller.classList.remove("select-none");

      // Re-enabling snap alone does not settle mid-card after a free drag.
      if (didDragRef.current) {
        scrollToAbsIndex(findNearestAbsIndex(), "smooth");
      } else {
        normalizeLoopScroll();
        syncActiveIndex();
      }

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
  }, [trackItems.length, loopEnabled, layout.cols, layout.cardW, layout.peekGutter, layout.peek]);

  if (!items.length) return null;

  const arrowBtn =
    "h-10 w-10 items-center justify-center rounded-full bg-gmcc-navy text-white border border-gmcc-navy body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gmcc-navy/80";

  return (
    <section className="page-section relative overflow-x-clip">
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
          <h2 className="h2 text-center">{heading}</h2>
        </div>

        <a
          href={"/programs"}
          className="block text-center mt-2 md:text-right md:mt-0 text-sm text-gmcc-navy font-semibold underline hover:translate-y-[-2px] hover:text-gmcc-teal"
        >
          {"View all programs"}
        </a>

        <div className="mt-4 w-full min-w-0 max-w-full">
          <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canNavigate}
              aria-label="Previous programs"
              className={`${arrowBtn} hidden shrink-0 md:inline-flex`}
            >
              ←
            </button>

            {/* Permanent edge pad outside the scroller so inset never scrolls away. */}
            <div
              className="min-w-0 flex-1"
              style={{ paddingLeft: EDGE_PAD_PX, paddingRight: EDGE_PAD_PX }}
            >
              <div
                ref={scrollerRef}
                className="w-full min-w-0 snap-x snap-mandatory overflow-x-auto pb-4 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  WebkitOverflowScrolling: "touch",
                  cursor: "grab",
                  scrollPaddingLeft: layout.peekGutter,
                  scrollPaddingRight: layout.peekGutter,
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
                    gridAutoColumns: `${layout.cardW}px`,
                    width: "max-content",
                    minWidth: "100%",
                  }}
                >
                  {trackItems.map((entry, idx) => (
                    <div
                      key={entry.key}
                      ref={(el) => {
                        cellRefs.current[idx] = el;
                      }}
                      className={`min-w-0 snap-always ${useCenterSnap ? "snap-center" : "snap-start"}`}
                      {...(loopEnabled && entry.copy !== 1
                        ? ({ "aria-hidden": true, inert: true } satisfies HTMLAttributes<HTMLDivElement>)
                        : {})}
                    >
                      <div className="min-w-0 w-full max-w-full">
                        <ProgramCardView program={entry.program} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={!canNavigate}
              aria-label="Next programs"
              className={`${arrowBtn} hidden shrink-0 md:inline-flex`}
            >
              →
            </button>
          </div>

          {/* Mobile controls */}
          <div className="mt-4 flex items-center justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canNavigate}
              aria-label="Previous programs"
              className={`${arrowBtn} inline-flex`}
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canNavigate}
              aria-label="Next programs"
              className={`${arrowBtn} inline-flex`}
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
    <div className="group card card-hover card-link min-w-0 max-w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
        {program.imageUrl ? (
          <img
            src={program.imageUrl}
            alt={program.imageAlt || ""}
            className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
            style={
              program.objectPosition
                ? { objectPosition: program.objectPosition }
                : undefined
            }
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
