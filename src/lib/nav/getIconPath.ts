// lib/nav/getIconPath.ts

/**
 * Converts a nav item label to its corresponding icon path.
 * E.g., "Our Purpose" -> "/primaryNavIcons/OurPurposeIcon.png"
 */
export function getIconPath(label: string): string {
  // Remove spaces and special characters, keeping only alphanumeric
  const sanitized = label
    .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric
    .replace(/\s+/g, '');           // Remove any remaining spaces
  
  return `/primaryNavIcons/${sanitized}Icon.png`;
}

