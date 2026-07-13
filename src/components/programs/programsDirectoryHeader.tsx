// components/programs/ProgramsDirectoryHeader.tsx
import React from "react";
import {
  DirectoryHeaderSection,
  type DirectoryHeaderVariant,
  type ProgramsPageACF,
} from "./directoryHeaderSection";

export type { ProgramsPageACF };

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const v = searchParams[key];
  return Array.isArray(v) ? v[0] : v;
}

function normalizeParam(value?: string) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function hasAny(values: string[], candidates: string[]) {
  return candidates.some((candidate) => values.includes(candidate));
}

export function getProgramsDirectoryHeaderVariant(
  searchParams: Record<string, string | string[] | undefined>
): DirectoryHeaderVariant | null {
  const offeringType = getParam(searchParams, "offeringType");
  const programArea = getParam(searchParams, "programArea");

  // Explicit headerVariant param takes top priority (set by nav links).
  // Use raw value (not normalizeParam) to preserve hyphens.
  const rawHeaderVariant = (getParam(searchParams, "headerVariant") ?? "").trim().toLowerCase();
  if (rawHeaderVariant === "silversneakers") return "silversneakers";
  if (rawHeaderVariant === "renew-active" || rawHeaderVariant === "renewactive") return "renew-active";

  const offeringTypeValues = (offeringType ?? "")
    .split(",")
    .map(normalizeParam)
    .filter(Boolean);
  const programAreaValues = (programArea ?? "")
    .split(",")
    .map(normalizeParam)
    .filter(Boolean);

  if (offeringTypeValues.includes("camp") || offeringTypeValues.includes("camps")) {
    return "camps";
  }

  if (hasAny(programAreaValues, ["aquatics"])) return "aquatics";
  if (hasAny(programAreaValues, ["childcare"])) return "childcare";
  // Silversneakers must come before group-fitness since its nav link includes both areas.
  if (hasAny(programAreaValues, ["silversneakers", "silver sneakers", "silver-sneakers"])) return "silversneakers";
  if (hasAny(programAreaValues, ["renew active", "renew-active", "renewactive", "one pass", "onepass"])) return "renew-active";
  if (hasAny(programAreaValues, ["group fitness"])) return "group-fitness";
  if (hasAny(programAreaValues, ["middle school sports", "middle-school-sports", "middleschoolsports"])) return "middle-school-sports";
  if (hasAny(programAreaValues, ["personal training"])) return "personal-training";
  if (hasAny(offeringTypeValues, [
    "lessons/training",
    "lessons training",
    "lesson/training",
    "lesson training",
  ])) {
    if (hasAny(programAreaValues, ["tennis"])) {
      return "tennis-lessons";
    } else {
      return "personal-training";
    }
  }

  return null;
}

export function ProgramsDirectoryHeader({
  searchParams,
  acf,
  className,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  acf: ProgramsPageACF;
  className?: string;
}) {
  const variant = getProgramsDirectoryHeaderVariant(searchParams);
  if (!variant) return null;
  return <DirectoryHeaderSection variant={variant} acf={acf} className={className} />;
}