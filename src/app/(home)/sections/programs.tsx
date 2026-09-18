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
  objectPosition?: string;
};

type ProgramsSectionProps = {
  programs: ProgramCard[];
  heading?: string;
};

// Layout constants
const MAX_COLS = 4;
const COL_GAP_PX = 16; // gap-4
/** Permanent side inset outside the scroller (does not scroll away). */
const EDGE_PAD_PX = 16;
/**
 * Minimum inset inside the scroller so card borders/shadows are never clipped
 * by overflow. Layout always sizes the column track against (width - 2*this).
 */
const MIN_SIDE_GUTTER_PX = 2;
const CARD_MIN_PX = 200;
const CARD_MAX_PX = 240;
/** Triple the track so we can jump between identical copies without a visible reset. */
const LOOP_COPIES = 3;

type CarouselLayout = {
  cols: number;
  cardW: number;
  /**
   * Equal left/right inset for the visible column group.
   * Always >= MIN_SIDE_GUTTER_PX so borders stay fully visible.
   */
  peekGutter: number;
};

/**
 * Fit as many full cards as possible within [CARD_MIN, CARD_MAX].
 * If 4 cannot fit entirely (including side gutters for borders), drop to 3, etc.
 * Leftover width is split equally so the visible group stays centered.
 */
function computeCarouselLayout(scrollerWidth: number): CarouselLayout {
  const w = Math.max(0, Math.floor(scrollerWidth));
  // Room for the card track after reserving border-safe side gutters.
  const avail = Math.max(0, w - 2 * MIN_SIDE_GUTTER_PX);

  for (let cols = MAX_COLS; cols >= 1; cols--) {
    const gaps = COL_GAP_PX * Math.max(0, cols - 1);
    if (avail < cols * CARD_MIN_PX + gaps) continue;

    let cardW = Math.min(CARD_MAX_PX, Math.floor((avail - gaps) / cols));
    if (cardW < CARD_MIN_PX) continue;

    // Keep the track strictly inside avail (floor can still overshoot by a px).
    while (cols * cardW + gaps > avail && cardW > CARD_MIN_PX) cardW -= 1;
    if (cols * cardW + gaps > avail) continue;

    const track = cols * cardW + gaps;
    const peekGutter = Math.max(MIN_SIDE_GUTTER_PX, Math.floor((w - track) / 2));

    return { cols, cardW, peekGutter };
  }

  // Narrow viewport: one column, centered, still border-safe when possible.
  const cardW = Math.min(CARD_MAX_PX, Math.max(0, avail));
  const peekGutter = Math.max(0, Math.floor((w - cardW) / 2));
  return { cols: 1, cardW: Math.max(cardW, 0), peekGutter };
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

  const [layout, setLayout] = useState<CarouselLayout>({
    cols: MAX_COLS,
    cardW: CARD_MAX_PX,
    peekGutter: MIN_SIDE_GUTTER_PX,
  });

  const isProgrammaticScroll = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDragRef = useRef(false);
  /** Absolute track index we are scrolling toward (survives rapid clicks mid-animation). */
  const pendingAbsIndexRef = useRef<number | null>(null);
  const settleTimeoutRef = useRef<number | null>(null);
  const scrollGenRef = useRef(0);

  const n = items.length;
  // Always center the visible column group:
  // - 1 col: snap each card to the scroller center
  // - multi-col: start-snap with equal scroll-padding gutters so the group is centered
  const useCenterSnap = layout.cols === 1;
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

  // Column widths from scroller viewport (avoids 100% + max-content circular sizing)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const calc = () => {
      const next = computeCarouselLayout(scroller.clientWidth);
      setLayout((prev) =>
        prev.cols === next.cols &&
        prev.cardW === next.cardW &&
        prev.peekGutter === next.peekGutter
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
    // Position relative to the scroller's scroll origin (offsetLeft can be
    // relative to a positioned ancestor outside the scroller).
    const fromScroller =
      el.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft;

    if (useCenterSnap) {
      return Math.round(
        fromScroller + el.clientWidth / 2 - scroller.clientWidth / 2
      );
    }
    // Multi-col: place the card's left edge at peekGutter so the border is never clipped.
    return Math.round(fromScroller - layout.peekGutter);
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

  /**
   * Keep scrollLeft inside the middle copy's snap range.
   * Use the middle copy's first snap position as the band start (not raw setWidth)
   * so peek/center gutters don't push us into a clone set on load.
   */
  const normalizeLoopScroll = () => {
    if (!loopEnabled) return;
    const scroller = scrollerRef.current;
    const setWidth = getSetWidth();
    const positions = getSnapPositions();
    if (!scroller || setWidth <= 0 || positions.length < n * 2) return;

    const bandStart = positions[n];
    const bandEnd = bandStart + setWidth;

    let left = scroller.scrollLeft;
    if (left >= bandStart && left < bandEnd) return;

    while (left < bandStart) left += setWidth;
    while (left >= bandEnd) left -= setWidth;

    if (Math.abs(left - scroller.scrollLeft) < 0.5) return;

    scroller.style.scrollSnapType = "none";
    scroller.scrollLeft = left;
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

  const clearSettleTimeout = () => {
    if (settleTimeoutRef.current != null) {
      window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  };

  /** Index to step from: in-flight target if any, otherwise nearest settled snap. */
  const getStepAbsIndex = () => {
    if (pendingAbsIndexRef.current != null) return pendingAbsIndexRef.current;
    return findNearestAbsIndex();
  };

  /**
   * Map any absolute index into the middle copy [n, 2n) so the next step has
   * runway in both directions after a loop normalize.
   */
  const toMiddleAbsIndex = (absIdx: number) => {
    if (!loopEnabled || n <= 0) return absIdx;
    const logical = ((absIdx % n) + n) % n;
    return n + logical;
  };

  const scrollToAbsIndex = (absIdx: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const positions = getSnapPositions();
    if (!positions.length) return;

    const clamped = Math.max(0, Math.min(absIdx, positions.length - 1));
    const targetLeft = Math.max(0, positions[clamped]);
    const gen = ++scrollGenRef.current;

    clearSettleTimeout();
    pendingAbsIndexRef.current = clamped;
    isProgrammaticScroll.current = true;
    // Disable snap while we animate so native snap can't settle 1px off and clip a border.
    scroller.style.scrollSnapType = "none";
    scroller.scrollTo({ left: targetLeft, behavior });

    const settleMs = behavior === "smooth" ? 450 : 0;
    settleTimeoutRef.current = window.setTimeout(() => {
      settleTimeoutRef.current = null;
      // A newer click superseded this animation.
      if (gen !== scrollGenRef.current) return;

      // Pin to the exact snap target, then normalize the loop band.
      scroller.scrollLeft = targetLeft;
      normalizeLoopScroll();

      const middleIdx = toMiddleAbsIndex(clamped);
      pendingAbsIndexRef.current = middleIdx;
      const settled = getSnapPositions();
      if (settled[middleIdx] != null) {
        scroller.scrollLeft = Math.max(0, settled[middleIdx]);
      }

      scroller.style.scrollSnapType = "";
      isProgrammaticScroll.current = false;
    }, settleMs);
  };

  const canNavigate = loopEnabled;

  const goPrev = () => {
    if (!canNavigate) return;
    scrollToAbsIndex(getStepAbsIndex() - 1);
  };
  const goNext = () => {
    if (!canNavigate) return;
    scrollToAbsIndex(getStepAbsIndex() + 1);
  };

  // Start on the middle copy so both directions have runway.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !n) return;

    clearSettleTimeout();
    scrollGenRef.current += 1;

    if (!loopEnabled) {
      scroller.scrollLeft = 0;
      pendingAbsIndexRef.current = 0;
      isProgrammaticScroll.current = false;
      return;
    }

    // Wait a frame so cell refs / column widths are laid out.
    const id = requestAnimationFrame(() => {
      const middleStart = cellRefs.current[n];
      if (!middleStart) return;
      isProgrammaticScroll.current = true;
      scroller.style.scrollSnapType = "none";
      scroller.scrollLeft = getSnapLeftForCell(middleStart, scroller);
      pendingAbsIndexRef.current = n;
      requestAnimationFrame(() => {
        scroller.style.scrollSnapType = "";
        isProgrammaticScroll.current = false;
      });
    });

    return () => {
      cancelAnimationFrame(id);
      clearSettleTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, loopEnabled, layout.cols, layout.cardW, layout.peekGutter]);

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
  }, [trackItems.length, loopEnabled, layout.cols, layout.cardW, layout.peekGutter]);

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
      scroller.style.cursor = "grab";
      scroller.classList.remove("select-none");

      // Re-enabling snap alone does not settle mid-card after a free drag.
      if (didDragRef.current) {
        scrollToAbsIndex(findNearestAbsIndex(), "smooth");
      } else {
        normalizeLoopScroll();
        scroller.style.scrollSnapType = "";
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
  }, [trackItems.length, loopEnabled, layout.cols, layout.cardW, layout.peekGutter]);

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
                  // Equal gutters keep every visible card's border inside the clip edge.
                  scrollPaddingLeft: useCenterSnap ? undefined : layout.peekGutter,
                  scrollPaddingRight: useCenterSnap ? undefined : layout.peekGutter,
                }}
              >
                {/* Track width is exact: cols*cardW + gaps. Side space is scroll-padding only. */}
                <div
                  className="grid"
                  style={{
                    gridAutoFlow: "column",
                    gridAutoColumns: `${layout.cardW}px`,
                    columnGap: COL_GAP_PX,
                    width: "max-content",
                    ...(loopEnabled
                      ? {}
                      : {
                          minWidth: "100%",
                          justifyContent: "center",
                        }),
                  }}
                >
                  {trackItems.map((entry, idx) => (
                    <div
                      key={entry.key}
                      ref={(el) => {
                        cellRefs.current[idx] = el;
                      }}
                      className={`min-w-0 snap-always ${useCenterSnap ? "snap-center" : "snap-start"}`}
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
