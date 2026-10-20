/** Audience taxonomy term fields used for age-group labels. */
export type AudienceTerm = {
  slug: string;
  name: string;
  description?: string | null;
};

/** Strip HTML and normalize whitespace from a WP term description. */
function plainDescription(description?: string | null): string {
  if (!description) return "";
  return description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull the age-range text from a WP audience term description.
 * Editors store ranges in parentheses, e.g. "Child programs (Ages 5–12)".
 */
export function extractAgeRangeFromDescription(
  description?: string | null,
): string | null {
  const text = plainDescription(description);
  if (!text) return null;

  const match = text.match(/\(([^)]+)\)/);
  const fromParens = match?.[1]?.trim();
  if (fromParens) return fromParens;

  return null;
}

/** Label for filters/badges: "Youth (Ages 5–12)" when a range exists. */
export function formatAudienceOptionLabel(audience: AudienceTerm): string {
  const name = (audience.name ?? "").trim();
  if (!name) return "";

  const age = extractAgeRangeFromDescription(audience.description);
  if (!age) return name;

  // Avoid duplicating if the name already includes the parenthetical range.
  if (name.includes(`(${age})`) || name.toLowerCase().includes(age.toLowerCase())) {
    return name;
  }

  return `${name} (${age})`;
}

type AgeRangeValue = string | number | null | undefined;

function hasAcfAgeRangeData(
  ageRange: { min?: AgeRangeValue; max?: AgeRangeValue } | null | undefined,
): boolean {
  if (!ageRange) return false;
  return (
    (ageRange.min != null && ageRange.min !== "") ||
    (ageRange.max != null && ageRange.max !== "")
  );
}

/** Format program ACF min/max ages for the green age chip. */
export function formatAcfAgeRangeLabel(
  min: AgeRangeValue,
  max: AgeRangeValue,
): string {
  const hasMin = min != null && min !== "";
  const hasMax = max != null && max !== "";
  if (hasMin && hasMax) return `Ages ${min}–${max}`;
  if (hasMin) return `Ages ${min}+`;
  if (hasMax) return `Ages up to ${max}`;
  return "";
}

/**
 * Prefer program-specific ACF min/max; otherwise use audience taxonomy
 * description ranges (not hardcoded age estimates).
 */
export function resolveAgeChipLabels(
  ageRange: { min?: AgeRangeValue; max?: AgeRangeValue } | null | undefined,
  audiences: AudienceTerm[] | null | undefined,
): string[] {
  if (hasAcfAgeRangeData(ageRange)) {
    const label = formatAcfAgeRangeLabel(ageRange?.min, ageRange?.max);
    return label ? [label] : [];
  }

  const seen = new Set<string>();
  const labels: string[] = [];
  for (const aud of audiences ?? []) {
    const age = extractAgeRangeFromDescription(aud.description);
    if (!age) continue;
    const label = /^ages?\b/i.test(age) ? age : `Ages ${age}`;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels;
}

/** Lowest year-like number found in an age-range string (months → 0). */
function parseSortAgeYears(text: string | null | undefined): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes("month")) return 0;

  const numbers = [...lower.matchAll(/(\d+(?:\.\d+)?)/g)]
    .map((m) => Number.parseFloat(m[1]!))
    .filter((n) => Number.isFinite(n));
  if (!numbers.length) return null;
  return Math.min(...numbers);
}

/**
 * Known audience slug order when description ages are missing.
 * Family is always last regardless.
 */
const AUDIENCE_SLUG_ORDER: Record<string, number> = {
  "early-years": 10,
  "earlyyears": 10,
  baby: 20,
  toddler: 30,
  youth: 40,
  child: 40,
  children: 40,
  teen: 50,
  teens: 50,
  adolescent: 50,
  adult: 60,
  adults: 60,
  senior: 70,
  seniors: 70,
  "active-older-adult": 70,
  "active-older-adults": 70,
};

function isFamilyAudience(audience: AudienceTerm): boolean {
  const slug = (audience.slug ?? "").toLowerCase();
  const name = (audience.name ?? "").toLowerCase();
  return slug === "family" || name === "family";
}

/** Sort age groups youngest → oldest; Family last. */
export function compareAudiencesByAge(
  a: AudienceTerm,
  b: AudienceTerm,
): number {
  const aFamily = isFamilyAudience(a);
  const bFamily = isFamilyAudience(b);
  if (aFamily !== bFamily) return aFamily ? 1 : -1;

  const aAge =
    parseSortAgeYears(extractAgeRangeFromDescription(a.description)) ??
    AUDIENCE_SLUG_ORDER[a.slug?.toLowerCase() ?? ""] ??
    500;
  const bAge =
    parseSortAgeYears(extractAgeRangeFromDescription(b.description)) ??
    AUDIENCE_SLUG_ORDER[b.slug?.toLowerCase() ?? ""] ??
    500;

  if (aAge !== bAge) return aAge - bAge;
  return (a.name ?? "").localeCompare(b.name ?? "", "en", { sensitivity: "base" });
}

export function sortAudiencesByAge<T extends AudienceTerm>(audiences: T[]): T[] {
  return [...audiences].sort(compareAudiencesByAge);
}
