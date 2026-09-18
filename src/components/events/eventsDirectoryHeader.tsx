import {
  DirectoryHeaderShell,
  type DirectoryHeaderData,
} from "@/components/programs/directoryHeaderShared";

export type EventDirectoryHeaderVariant =
  | "bonspiels"
  | "trips"
  | "tournaments"
  | "socials"
  | "races"
  | "food-distributions";

export type EventsDirectoryHeaderData = Partial<
  Record<EventDirectoryHeaderVariant, DirectoryHeaderData | null>
>;

const EVENT_TYPE_VARIANTS: Record<string, EventDirectoryHeaderVariant> = {
  bonspiel: "bonspiels",
  bonspiels: "bonspiels",
  trip: "trips",
  trips: "trips",
  tournament: "tournaments",
  tournaments: "tournaments",
  social: "socials",
  socials: "socials",
  race: "races",
  races: "races",
  // normalizeEventType turns hyphens into spaces before lookup
  "food distribution": "food-distributions",
  "food distributions": "food-distributions",
};

const VARIANT_TITLES: Record<EventDirectoryHeaderVariant, string> = {
  bonspiels: "Bonspiels",
  trips: "Trips",
  tournaments: "Tournaments",
  socials: "Socials",
  races: "Races",
  "food-distributions": "Food Distributions",
};

function normalizeEventType(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

export function getEventsDirectoryHeaderVariant(
  eventTypes: string[],
): EventDirectoryHeaderVariant | null {
  if (eventTypes.length !== 1) return null;
  return EVENT_TYPE_VARIANTS[normalizeEventType(eventTypes[0])] ?? null;
}

export function EventsDirectoryHeader({
  eventTypes,
  headers,
}: {
  eventTypes: string[];
  headers: EventsDirectoryHeaderData;
}) {
  const variant = getEventsDirectoryHeaderVariant(eventTypes);
  if (!variant) return null;

  const fromWp = headers[variant] ?? {};
  return (
    <DirectoryHeaderShell
      data={{
        ...fromWp,
        // Prefer WP title when editors set one; otherwise keep the fallback.
        header: (fromWp.header ?? "").trim() || VARIANT_TITLES[variant],
      }}
    />
  );
}
