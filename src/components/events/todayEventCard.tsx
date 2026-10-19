import Link from "next/link";
import type { TodayEventCardData } from "@/lib/events/todayEvents";

type TodayEventCardProps = {
  event: TodayEventCardData;
  showCenter?: boolean;
  /** Breakpoint at which the card switches from image-on-top to side-by-side. */
  stackUntil?: "sm" | "lg";
};

const LAYOUT_CLASSES = {
  sm: {
    card: "sm:h-38",
    grid: "sm:h-full sm:grid-cols-2",
    text: "sm:py-4 sm:pl-4 sm:pr-2",
    image: "sm:order-none sm:aspect-auto sm:h-full sm:rounded-r-2xl",
  },
  lg: {
    card: "lg:h-38",
    grid: "lg:h-full lg:grid-cols-2",
    text: "lg:py-4 lg:pl-4 lg:pr-2",
    image: "lg:order-none lg:aspect-auto lg:h-full lg:rounded-r-2xl",
  },
} as const;

export default function TodayEventCard({
  event,
  showCenter = false,
  stackUntil = "sm",
}: TodayEventCardProps) {
  const layout = LAYOUT_CLASSES[stackUntil];

  return (
    <Link
      href={event.href}
      className={`group card card-hover card-link overflow-hidden border-l-4 border-l-gmcc-teal bg-gmcc-blue-light/30 p-0 ${layout.card}`}
    >
      <div className={`grid grid-cols-1 ${layout.grid}`}>
        <div className={`col-span-1 flex min-h-0 min-w-0 flex-col overflow-hidden p-4 ${layout.text}`}>
          {showCenter && event.centerLabel ? (
            <p className="eyebrow mb-1 truncate">{event.centerLabel}</p>
          ) : null}
          <h4 className="h3 mb-1 line-clamp-1 transition-colors group-hover:text-gmcc-teal">{event.title}</h4>
          <p className="small mb-2 truncate font-semibold text-gmcc-teal-dark">{event.timeLabel}</p>
          {event.summary ? <p className="body line-clamp-2">{event.summary}</p> : null}
        </div>
        <div className={`relative order-first col-span-1 aspect-[16/9] min-h-0 overflow-hidden ${layout.image}`}>
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
