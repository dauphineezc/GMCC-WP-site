/**
 * WordPress media focal-point helpers (custom plugin metadata on MediaItem).
 *
 * GraphQL fields: focalPointX, focalPointY, hasCustomFocalPoint (percentages 0–100).
 * Unset defaults from the plugin are typically 50 / 50.
 * *
 * Set WP_FOCAL_POINT_GRAPHQL=false when the focal-point plugin is deactivated on
 * WordPress — otherwise every query using WP_MEDIA_IMAGE_FIELDS will fail with
 * "Cannot query field focalPointX on type MediaItem".
 */

export type MediaFocalPointFields = {
  focalPointX?: number | string | null;
  focalPointY?: number | string | null;
  hasCustomFocalPoint?: boolean | null;
};

/** When false, omit plugin-only fields so GraphQL still works without the plugin. */
const INCLUDE_FOCAL_POINT_GRAPHQL =
  process.env.WP_FOCAL_POINT_GRAPHQL !== "false";
const WP_MEDIA_FOCAL_POINT_FIELDS = INCLUDE_FOCAL_POINT_GRAPHQL
  ? `
  focalPointX
  focalPointY
  hasCustomFocalPoint`
  : "";

/** GraphQL selection for image media nodes (interpolate inside `node { ... }`). */
export const WP_MEDIA_IMAGE_FIELDS = `
  sourceUrl
  altText
  ${WP_MEDIA_FOCAL_POINT_FIELDS}
`;

function asFiniteNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * CSS background-position / object-position value, e.g. `"69.2% 38.7%"`.
 * Returns undefined when X/Y are missing so callers can keep center defaults.
 */
export function mediaFocalPositionCss(
  node: MediaFocalPointFields | null | undefined,
): string | undefined {
  if (!node) return undefined;
  const x = asFiniteNumber(node.focalPointX);
  const y = asFiniteNumber(node.focalPointY);
  if (x === undefined || y === undefined) return undefined;
  return `${x}% ${y}%`;
}

export function objectPositionStyle(
  node: MediaFocalPointFields | null | undefined,
): { objectPosition: string } | undefined {
  const pos = mediaFocalPositionCss(node);
  return pos ? { objectPosition: pos } : undefined;
}

export function backgroundPositionStyle(
  node: MediaFocalPointFields | null | undefined,
): { backgroundPosition: string } | undefined {
  const pos = mediaFocalPositionCss(node);
  return pos ? { backgroundPosition: pos } : undefined;
}

/** Pick focal fields from a loose media node / mapper payload. */
export function pickMediaFocalPoint(
  node: Record<string, unknown> | MediaFocalPointFields | null | undefined,
): MediaFocalPointFields | undefined {
  if (!node || typeof node !== "object") return undefined;
  const n = node as Record<string, unknown>;
  if (
    n.focalPointX == null &&
    n.focalPointY == null &&
    n.hasCustomFocalPoint == null
  ) {
    return undefined;
  }
  return {
    focalPointX: n.focalPointX as MediaFocalPointFields["focalPointX"],
    focalPointY: n.focalPointY as MediaFocalPointFields["focalPointY"],
    hasCustomFocalPoint: n.hasCustomFocalPoint as MediaFocalPointFields["hasCustomFocalPoint"],
  };
}
