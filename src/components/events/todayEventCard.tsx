import Link from "next/link";
import type { TodayEventCardData } from "@/lib/events/todayEvents";

type TodayEventCardProps = {
  event: TodayEventCardData;
  showCenter?: boolean;
};

export default function TodayEventCard({ event, showCenter = false }: TodayEventCardProps) {
  return (
    <Link
      href={event.href}
      className="group card card-hover card-link overflow-hidden border-l-4 border-l-gmcc-teal bg-gmcc-blue-light/30 p-0"
    >
      <div className="grid grid-cols-2">
        <div className="col-span-1 py-4 pl-4 pr-2">
          {showCenter && event.centerLabel ? (
            <p className="eyebrow mb-1">{event.centerLabel}</p>
          ) : null}
          <h4 className="h3 mb-1 transition-colors group-hover:text-gmcc-teal">{event.title}</h4>
          <p className="small mb-2 font-semibold text-gmcc-teal-dark">{event.timeLabel}</p>
          {event.summary ? <p className="body">{event.summary}</p> : null}
        </div>
        <div className="relative col-span-1 min-h-0 overflow-hidden rounded-r-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.imageUrl ?? "/images/VisitPhoto.png"}
            alt={event.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            style={
              event.objectPosition
                ? { objectPosition: event.objectPosition }
                : undefined
            }
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </Link>
  );
}
