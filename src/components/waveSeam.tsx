/**
 * Shared helpers to hide mobile subpixel hairlines where SVG waves meet
 * solid color blocks (navy↔white). Use these from every wave component so
 * seam coverage stays consistent site-wide.
 */

/** Horizontal bleed so scaled SVGs don’t leave 1px gaps at the sides. */
export const WAVE_SVG_BLEED_CLASS = "-ml-[2px] block w-[calc(100%+4px)]";

/**
 * Clip only the SVG’s horizontal bleed. Keep this on an *inner* wrapper —
 * not on a parent that also uses -mb/-mt overlap, because overflow-x-clip
 * forces overflow-y to compute to auto and eats the vertical seam cover.
 */
export const WAVE_BLEED_CLIP_CLASS = "overflow-x-clip";

/** 4px color-matched bar that seals the join under/over a wave SVG. */
export function WaveEdgeBar({
  side,
  className,
}: {
  side: "top" | "bottom";
  className: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute left-0 h-[4px] w-full ${
        side === "top" ? "top-0" : "bottom-0"
      } ${className}`}
      aria-hidden
    />
  );
}
