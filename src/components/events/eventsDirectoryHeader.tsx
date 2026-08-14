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
  "food distribution": "food-distributions",
  "food distributions": "food-distributions",
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

  return <DirectoryHeaderShell data={headers[variant]} />;
}
