export type HomeEventCard = {
  id: string;
  title: string;
  uri: string;
  summary: string;
  badgeDay: string;
  badgeMonth: string;
  imageUrl: string | null;
  imageAlt: string;
  objectPosition?: string;
};

export default function EventsSection({ events }: { events?: HomeEventCard[] | null }) {
  if (!events?.length) return null;

  return (
    <section className="page-section relative overflow-x-clip">
      <div className="mx-auto min-w-0 max-w-6xl px-4">
        <h2 className="h2 text-center">Upcoming Events</h2>

        <a
          href="/events"
          className="block text-center mt-2 md:text-right md:mt-0 text-sm text-gmcc-navy font-semibold underline hover:translate-y-[-2px] hover:text-gmcc-teal"
        >
          View all events
        </a>

        <div className="mt-10 grid min-w-0 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <a
              key={event.id}
              href={event.uri || "/events"}
              className="group block min-w-0"
              aria-label={event.title || "View event"}
            >
              <div className="relative overflow-visible pr-3 pl-3 pt-3 sm:p-0">
                <div className="overflow-hidden rounded-2xl bg-neutral-100">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.imageAlt}
                      className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      style={
                        event.objectPosition
                          ? { objectPosition: event.objectPosition }
                          : undefined
                      }
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-56 w-full bg-neutral-200" />
                  )}
                </div>

                <div className="absolute right-0 top-0 flex h-[96px] w-[96px] flex-col items-start justify-center pl-3 rounded-2xl bg-gmcc-green text-white shadow-md sm:-right-6 sm:-top-6">
                  <div className="text-4xl font-bold leading-none">{event.badgeDay}</div>
                  <div className="mt-1 text-center text-sm font-semibold tracking-wider">
                    {event.badgeMonth}
                  </div>
                </div>
              </div>

              <h3 className="mt-4 text-center text-base font-semibold leading-tight text-gmcc-navy group-hover:text-gmcc-teal">
                {event.title || "Event"}
              </h3>
              <p className="mt-1 line-clamp-2 text-center text-sm text-neutral-600">
                {event.summary || ""}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
