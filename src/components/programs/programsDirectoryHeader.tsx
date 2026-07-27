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

  // Explicit headerVariant param takes top priority (set by nav links, then
  // stripped from the URL so it doesn't stay visible). Use the raw value so
  // hyphens are preserved.
  const rawHeaderVariant = (getParam(searchParams, "headerVariant") ?? "").trim().toLowerCase();
  if (rawHeaderVariant === "none" || rawHeaderVariant === "default") return null;
  if (rawHeaderVariant === "silversneakers") return "silversneakers";
  if (rawHeaderVariant === "renew-active" || rawHeaderVariant === "renewactive") return "renew-active";
  if (rawHeaderVariant === "sports-and-recreation" || rawHeaderVariant === "sportsandrecreation") return "sports-and-recreation";
  if (rawHeaderVariant === "community") return "community";
  if (rawHeaderVariant === "fitness") return "fitness";
  if (rawHeaderVariant === "group-fitness" || rawHeaderVariant === "groupfitness") return "group-fitness";
  if (rawHeaderVariant === "middle-school-sports" || rawHeaderVariant === "middleschoolsports") return "middle-school-sports";
  if (rawHeaderVariant === "personal-training" || rawHeaderVariant === "personaltraining") return "personal-training";
  if (rawHeaderVariant === "aquatics") return "aquatics";
  if (rawHeaderVariant === "childcare") return "childcare";
  if (rawHeaderVariant === "camps") return "camps";
  if (rawHeaderVariant === "tennis-lessons" || rawHeaderVariant === "tennislessons") return "tennis-lessons";

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
  if (
    offeringTypeValues.includes("childcare") ||
    offeringTypeValues.includes("child care")
  ) {
    return "childcare";
  }

  // Exact / exclusive filter matches (sidebar). More specific first.
  if (hasAny(programAreaValues, ["middle school sports"]) && programAreaValues.length === 1) {
    return "middle-school-sports";
  }
  if (hasAny(programAreaValues, ["silversneakers"]) && !hasAny(programAreaValues, ["group fitness"])) {
    return "silversneakers";
  }
  // SilverSneakers + Group Fitness together (sidebar or leftover URL) → silversneakers
  if (hasAny(programAreaValues, ["silversneakers"])) return "silversneakers";
  if (hasAny(programAreaValues, ["community", "community partners"])) return "community";
  if (hasAny(programAreaValues, ["aquatics"]) && programAreaValues.length === 1) return "aquatics";
  if (hasAny(programAreaValues, ["before after school", "onsite care"])) return "childcare";
  if (hasAny(programAreaValues, ["group fitness"]) && programAreaValues.length === 1) return "group-fitness";
  if (hasAny(programAreaValues, ["personal training"]) && programAreaValues.length === 1) return "personal-training";
  if (hasAny(programAreaValues, ["basketball", "cheer and pom", "curling", "misc other sports", "racquet sports", "middle school sports"])) {
    return "sports-and-recreation";
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