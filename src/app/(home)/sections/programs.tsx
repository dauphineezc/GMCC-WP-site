// src/app/(home)/sections/programs.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import Link from "next/link";
import { getScrollerContentWidth } from "@/lib/scrollerContentWidth";

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
const EDGE_PAD_PX = 6; // scroller px-[6px]; scroll-padding only
/** Triple the track so we can jump between identical copies without a visible reset. */
const LOOP_COPIES = 3;

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
  const [desktopColW, setDesktopColW] = useState<number>(260);
  const [mobileColW, setMobileColW] = useState<number>(0);

  const isProgrammaticScroll = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDragRef = useRef(false);

  const n = items.length;
  // Loop whenever there is more than one full viewport of cards to scroll through.
  const loopEnabled = n > (isMd ? DESKTOP_COLS : 1);

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

  // Column widths from scroller viewport (avoids 100% + max-content circular sizing on mobile)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const calc = () => {
      const md = window.matchMedia("(min-width: 768px)").matches;
      const viewport = getScrollerContentWidth(scroller);

      if (md) {
        const w = Math.floor(
          (viewport - COL_GAP_PX * (DESKTOP_COLS - 1)) / DESKTOP_COLS
        );
        setDesktopColW(Math.max(220, w));
        return;
      }

      setMobileColW(Math.max(260, viewport));
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

  const getSnapLeftForCell = (el: HTMLDivElement, scroller: HTMLDivElement) => {
    return (
      el.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft -
      EDGE_PAD_PX
    );
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

    const prevSnap = scroller.style.scrollSnapType;
    scroller.style.scrollSnapType = "none";
    scroller.scrollLeft = left;
    // Restore snap after the jump so the next gesture still snaps.
    requestAnimationFrame(() => {
      scroller.style.scrollSnapType = prevSnap || "x mandatory";
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
  }, [n, loopEnabled, isMd, desktopColW, mobileColW]);

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
  }, [trackItems.length, isMd, desktopColW, mobileColW, loopEnabled]);

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
      normalizeLoopScroll();
      syncActiveIndex();
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
  }, [trackItems.length, isMd, loopEnabled]);

  if (!items.length) return null;

  const arrowBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-gmcc-navy text-white border border-gmcc-navy body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gmcc-navy/80";

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

            {/* Scroller: must be width-constrained so its overflow stays internal */}
            <div
              ref={scrollerRef}
              className="min-w-0 flex-1 overflow-x-auto pb-4 pt-1 px-[6px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                  gridAutoColumns: isMd
                    ? `${desktopColW}px`
                    : mobileColW > 0
                      ? `${mobileColW}px`
                      : "min(100%, 420px)",
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
                    className="min-w-0"
                    style={{
                      scrollSnapAlign: "start",
                      scrollSnapStop: "always",
                    }}
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
              className={arrowBtn}
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canNavigate}
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
    <div className="group card card-hover card-link min-w-0 max-w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
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
