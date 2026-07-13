import TodayEventCard from "@/components/events/todayEventCard";
import type { TodayEventCardData } from "@/lib/events/todayEvents";

type TodayEventsGridProps = {
  events: TodayEventCardData[];
  header?: string | null;
  showCenter?: boolean;
  className?: string;
};

export default function TodayEventsGrid({
  events,
  showCenter = false,
  className = "mt-12",
}: TodayEventsGridProps) {
  if (!events.length) return null;

  return (
    <div className={className}>
      {events.length > 1 ? (
        <h3 className="h3 mb-6">Don't Miss These Fun Events Happening Today!</h3>
      ) : (events.length === 1 ? (
        <h3 className="h3 mb-6">Don't Miss This Fun Event Happening Today!</h3>
      ) : null)}
      <div className="grid gap-5 sm:grid-cols-2">
        {events.map((event) => (
          <TodayEventCard key={event.id} event={event} showCenter={showCenter} />
        ))}
      </div>
    </div>
  );
}
