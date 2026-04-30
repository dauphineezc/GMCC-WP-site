type EventItem = {
  id: string;
  title?: string | null;
  uri?: string | null;
  date?: string | null;
  summary?: string | null;
  featuredImage?: {
    node?: { sourceUrl: string; altText?: string | null } | null;
  } | null;
};

function safeDateValue(date?: string | null) {
  if (!date) return Number.POSITIVE_INFINITY;
  const t = new Date(date).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

function formatBadgeDate(input?: string | null) {
  const d = input ? new Date(input) : null;
  if (!d || Number.isNaN(d.getTime())) {
    return { day: "--", month: "" };
  }

  return {
    day: d.toLocaleDateString("en-US", { day: "2-digit" }),
    month: d.toLocaleDateString("en-US", { month: "long" }),
  };
}

export default function EventsSection({ events }: { events?: EventItem[] | null }) {
  if (!events?.length) return null;

  const top4 = [...events]
    .sort((a, b) => safeDateValue(a.date) - safeDateValue(b.date))
    .slice(0, 4);

  if (!top4.length) return null;

  return (
    <section className="relative overflow-hidden pt-8 pb-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="h2 text-center">Upcoming Events</h2>

        <a
          href={'/events'}
          className="block text-right text-sm text-gmcc-navy font-semibold underline hover:translate-y-[-2px] hover:text-gmcc-teal"
        >
          {"View all events"}
        </a>

        <div className="mt-10 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {top4.map((event) => {
            const dateBadge = formatBadgeDate(event.date);

            return (
              <a
                key={event.id}
                href={event.uri ?? "/events"}
                className="group block"
                aria-label={event.title ?? "View event"}
              >
                <div className="relative">
                  <div className="overflow-hidden rounded-2xl bg-neutral-100">
                    {event.featuredImage?.node?.sourceUrl ? (
                      <img
                        src={event.featuredImage.node.sourceUrl}
                        alt={event.featuredImage.node.altText ?? ""}
                        className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-56 w-full bg-neutral-200" />
                    )}
                  </div>

                  <div className="absolute -right-6 -top-6 flex h-[96px] w-[96px] flex-col items-start justify-center pl-3 rounded-2xl bg-gmcc-green text-white shadow-md">
                    <div className="text-4xl font-bold leading-none">{dateBadge.day}</div>
                    <div className="mt-1 text-center text-sm font-semibold tracking-wider">
                      {dateBadge.month}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
