// lib/nav/getIconPath.ts

/**
 * Converts a nav item label to its corresponding icon path.
 * E.g., "Our Purpose" -> "/primaryNavIcons/OurPurposeIcon.png"
 */
export function getIconPath(label: string): string {
  // Build a stable PascalCase filename so connector words ("and", "a", "an")
  // map to the same casing expected by production's case-sensitive filesystem.
  const sanitized = label
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  return `/primaryNavIcons/${sanitized}Icon.png`;
}

