"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

type Center = { slug: string; title: string };

function measureBadgeWidth(text: string, className: string): number {
  const el = document.createElement("span");
  el.className = className;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.whiteSpace = "nowrap";
  el.textContent = text;
  document.body.appendChild(el);
  const w = Math.ceil(el.getBoundingClientRect().width);
  document.body.removeChild(el);
  return w;
}

export default function CentersBadgesOneLine({
  centers,
  badgeClassName = "badge badge-teal",
  moreBadgeClassName = "badge badge-grey",
  gapPx = 8, // matches gap-2
}: {
  centers: Center[];
  badgeClassName?: string;
  moreBadgeClassName?: string;
  gapPx?: number;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(centers.length);

  // Pre-measure text widths once per centers list (client-side)
  const badgeWidths = useMemo(() => {
    if (typeof window === "undefined") return [];
    return centers.map((c) => measureBadgeWidth(c.title, badgeClassName));
  }, [centers, badgeClassName]);

  useLayoutEffect(() => {
    if (!rowRef.current) return;
    if (!centers.length) return;

    const compute = () => {
      const rowWidth = Math.floor(rowRef.current!.getBoundingClientRect().width);
      if (!rowWidth) return;

      // First pass: assume no "+N more"
      let used = 0;
      let count = 0;

      for (let i = 0; i < centers.length; i++) {
        const w = badgeWidths[i] ?? 0;
        const next = used === 0 ? w : used + gapPx + w;
        if (next <= rowWidth) {
          used = next;
          count++;
        } else {
          break;
        }
      }

      // If everything fits, done.
      if (count >= centers.length) {
        setVisibleCount(centers.length);
        return;
      }

      // Otherwise reserve space for "+N more"
      // We don’t know N until we know count, but we can iteratively solve.
      let best = Math.max(0, count);

      for (let attempt = best; attempt >= 0; attempt--) {
        const hidden = centers.length - attempt;
        const moreText = `+${hidden} more`;
        const moreW = measureBadgeWidth(moreText, moreBadgeClassName);

        // Recompute used width for first `attempt` badges + gap + more badge
        let used2 = 0;
        for (let i = 0; i < attempt; i++) {
          const w = badgeWidths[i] ?? 0;
          used2 = used2 === 0 ? w : used2 + gapPx + w;
        }

        const total = used2 === 0 ? moreW : used2 + gapPx + moreW;

        if (total <= rowWidth) {
          best = attempt;
          break;
        }
      }

      setVisibleCount(best);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(rowRef.current);

    return () => ro.disconnect();
  }, [centers.length, badgeWidths, gapPx, moreBadgeClassName]);

  const hiddenCount = centers.length - visibleCount;

  return (
    <div
      ref={rowRef}
      className="mt-2 flex items-center gap-2 flex-nowrap overflow-hidden min-w-0"
      style={{ maskImage: "linear-gradient(to right, black 88%, transparent)" }}
    >
      {centers.slice(0, visibleCount).map((c) => (
        <span key={c.slug} className={badgeClassName}>
          {c.title}
        </span>
      ))}

      {hiddenCount > 0 && (
        <span className={moreBadgeClassName}>{`+${hiddenCount} more`}</span>
      )}
    </div>
  );
}
