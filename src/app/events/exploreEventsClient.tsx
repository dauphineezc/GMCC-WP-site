"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buildEventHref } from "@/lib/events/buildEventHref";
import { formatEventDate } from "@/lib/events/formatEventDate";
import {
  parseEventSchedule,
  resolveEventDateInfo,
  type EventOccurrence,
} from "@/lib/events/eventSchedule";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";

type EventWP = any;
type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

type EventCard = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    occurrences: EventOccurrence[];
    heroUrl: string | null;
    heroAlt: string;
    centers: { slug: string; title: string }[];
    audience: { slug: string; name: string }[];
    eventType: string[];
  };
  
  function mapEventForExplorer(wp: EventWP): EventCard {
    const f = wp.eventFields ?? {};
    const hero = wp.featuredImage?.node;
  
    return {
      id: wp.id,
      slug: wp.slug,
      title: wp.title ?? "",
      summary: f.summary ?? "",
      occurrences: parseEventSchedule(f.eventSchedule),
      heroUrl: hero?.sourceUrl ?? null,
      heroAlt: hero?.altText ?? "",
      centers:
        f.center?.nodes?.map((c: any) => ({
          slug: c.slug,
          title: c.title,
        })).filter((c: any) => c.slug && c.title) ?? [],
      audience:
        f.audience?.nodes?.map((a: any) => ({
          slug: a.slug,
          name: a.name,
        })) ?? [],
        eventType: toStringArray(f.eventType),
    };
  }  

  function toStringArray(val: unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(v => String(v)).map(s => s.trim()).filter(Boolean);
    if (typeof val === "string") {
      return val
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);
    }
    // numbers, objects, weird stuff -> stringify safely
    return [String(val)].map(s => s.trim()).filter(Boolean);
  }
  


export default function ExploreEventsClient({
  initialEvents,
  initialPageInfo,
  pageSize,
}: {
  initialEvents: EventWP[];
  initialPageInfo: PageInfo;
  pageSize: number;
}) {
  // Infinite scroll state
  const [loadedEvents, setLoadedEvents] = useState<EventWP[]>(initialEvents);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    if (!pageInfo.hasNextPage) return;

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams();
      params.set("first", String(pageSize));
      if (pageInfo.endCursor) params.set("after", pageInfo.endCursor);

      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load more events (${res.status})`);

      const json: { events: EventWP[]; pageInfo: PageInfo } = await res.json();

      // de-dupe by id/slug just in case
      setLoadedEvents((prev) => {
        const seen = new Set(prev.map((e) => e?.id ?? e?.slug));
        const next = [...prev];

        for (const e of json.events ?? []) {
          const key = e?.id ?? e?.slug;
          if (!seen.has(key)) {
            seen.add(key);
            next.push(e);
          }
        }
        return next;
      });

      setPageInfo(json.pageInfo);
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load more events");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, pageInfo.hasNextPage, pageInfo.endCursor, pageSize]);

  // IntersectionObserver triggers loadMore near bottom
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) loadMore();
      },
      {
        root: null,
        rootMargin: "800px 0px",
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const all = useMemo(() => loadedEvents.map(mapEventForExplorer), [loadedEvents]);

  // --- simple filters (for now) ---
  const audienceOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach(e => e.audience.forEach(a => map.set(a.slug, a.name)));
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);
  
  const eventTypeOptions = useMemo(() => {
    const s = new Set<string>();
    all.forEach(e => e.eventType.forEach(t => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [all]);

  // --- Read URL search params ---
  const searchParams = useSearchParams();

  // Parse initial values from URL
  const initialFilters = useMemo(() => {
    const audienceParam = searchParams.get("audience");
    const eventTypeParam = searchParams.get("eventType");

    // audience param can be comma-separated slugs
    const audienceSlugs: string[] = [];
    if (audienceParam) {
      audienceParam.split(",").forEach(val => {
        const trimmed = val.trim();
        // Check if it's a valid audience slug
        const existingSlug = audienceOptions.find(a => a.slug === trimmed || a.name.toLowerCase() === trimmed.toLowerCase());
        if (existingSlug) {
          audienceSlugs.push(existingSlug.slug);
        }
      });
    }

    // eventType param - case-insensitive match
    const eventTypeValues: string[] = [];
    if (eventTypeParam) {
      eventTypeParam.split(",").forEach(val => {
        const trimmed = val.trim();
        const match = eventTypeOptions.find(o => o.toLowerCase() === trimmed.toLowerCase());
        if (match) eventTypeValues.push(match);
      });
    }

    return {
      audience: audienceSlugs,
      eventTypes: eventTypeValues,
    };
  }, [searchParams, audienceOptions, eventTypeOptions]);

  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState<string[]>(initialFilters.audience);
  const [eventTypes, setEventTypes] = useState<string[]>(initialFilters.eventTypes);
  const [dateFilter, setDateFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync state when URL params change (e.g., navigating from navbar)
  useEffect(() => {
    setAudience(initialFilters.audience);
    setEventTypes(initialFilters.eventTypes);
    
    // Auto-open dropdowns that have active filters
    const toOpen = new Set<string>(["date"]);
    if (initialFilters.audience.length) toOpen.add("audience");
    if (initialFilters.eventTypes.length) toOpen.add("eventType");
    if (toOpen.size > 1) setOpenDropdowns(toOpen);
  }, [initialFilters]);
  
  // --- dropdown state (same as programs) ---
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(() => {
    // Initialize with dropdowns that have active filters from URL
    const toOpen = new Set<string>(["date"]);
    if (initialFilters.audience.length) toOpen.add("audience");
    if (initialFilters.eventTypes.length) toOpen.add("eventType");
    return toOpen;
  });
  
  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  
  function toggle(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }
  

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();

    const list = all
      // Resolve each event's active occurrence (rolls forward to next date)
      .map(e => {
        const info = resolveEventDateInfo(e.occurrences, now);
        return {
          ...e,
          displayStart: info.start,
          displayEnd: info.end,
          isPast: info.isPast,
          hasSchedule: info.hasSchedule,
        };
      })
      .filter(e => {
        // text search
        if (q) {
          const hay = `${e.title} ${e.summary}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        // audience
        if (audience.length) {
          if (!e.audience.some(a => audience.includes(a.slug))) return false;
        }

        // event type
        if (eventTypes.length) {
          if (!e.eventType.some(t => eventTypes.includes(t))) return false;
        }

        // date: an event is "upcoming" until its last occurrence ends
        if (dateFilter === "upcoming" && e.hasSchedule && e.isPast) return false;
        if (dateFilter === "past" && (!e.hasSchedule || !e.isPast)) return false;

        return true;
      });

    const startKey = (e: { displayStart: string | null }) => {
      if (!e.displayStart) {
        return dateFilter === "past" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      }
      return new Date(e.displayStart).getTime();
    };

    return [...list].sort((a, b) =>
      dateFilter === "past" ? startKey(b) - startKey(a) : startKey(a) - startKey(b)
    );
  }, [all, search, audience, eventTypes, dateFilter]);  
  

  return (
    <>
      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* FILTER SIDEBAR */}
          <aside className="card h-fit lg:sticky lg:top-18">
            {/* Mobile toggle button */}
            <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden w-full flex items-center justify-between p-4 body font-medium"
            >
                <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {(audience.length + eventTypes.length + (dateFilter !== "upcoming" ? 1 : 0)) > 0 && (
                    <span className="badge badge-teal ml-1">
                    {audience.length + eventTypes.length + (dateFilter !== "upcoming" ? 1 : 0)}
                    </span>
                )}
                </span>
                <svg
                className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Filter content */}
            <div className={`stack-4 p-4 pt-0 lg:pt-4 ${filtersOpen ? "block" : "hidden lg:block"}`}>
                {/* Search */}
                <div className="stack-2 border-b border-neutral-200 pb-4 mt-2">
                <label className="body text-gmcc-navy">Search</label>
                <input
                    className="w-full rounded-lg border border-neutral-500 px-3 py-2 body mt-2"
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                </div>

                {/* Date */}
                <div className="border-b border-neutral-200 pb-2">
                <button
                    type="button"
                    onClick={() => toggleDropdown("date")}
                    className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
                >
                    <span>
                    <label className="text-base text-gmcc-navy">Date</label>
                    {dateFilter !== "upcoming" && (
                        <span className="ml-2 text-xs text-neutral-500">(1)</span>
                    )}
                    </span>
                    <svg
                    className={`w-4 h-4 transition-transform ${openDropdowns.has("date") ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {openDropdowns.has("date") && (
                    <div className="space-y-2 pt-2 pb-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                        <input
                        type="radio"
                        name="dateFilter"
                        checked={dateFilter === "upcoming"}
                        onChange={() => setDateFilter("upcoming")}
                        />
                        <span>Upcoming</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                        <input
                        type="radio"
                        name="dateFilter"
                        checked={dateFilter === "past"}
                        onChange={() => setDateFilter("past")}
                        />
                        <span>Past</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                        <input
                        type="radio"
                        name="dateFilter"
                        checked={dateFilter === "all"}
                        onChange={() => setDateFilter("all")}
                        />
                        <span>All</span>
                    </label>
                    </div>
                )}
                </div>

                {/* Event type */}
                <div className="border-b border-neutral-200 pb-2">
                <button
                    type="button"
                    onClick={() => toggleDropdown("eventType")}
                    className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
                >
                    <span>
                    <label className="text-base text-gmcc-navy">Event type</label>
                    {eventTypes.length > 0 && (
                        <span className="ml-2 text-xs text-neutral-500">({eventTypes.length})</span>
                    )}
                    </span>
                    <svg
                    className={`w-4 h-4 transition-transform ${openDropdowns.has("eventType") ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {openDropdowns.has("eventType") && (
                    <div className="space-y-1 pt-2 pb-2">
                    {eventTypeOptions.map((t) => (
                        <label key={t} className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                        <input
                            type="checkbox"
                            checked={eventTypes.includes(t)}
                            onChange={() => setEventTypes(toggle(eventTypes, t))}
                            className="cursor-pointer"
                        />
                        <span>{t}</span>
                        </label>
                    ))}
                    </div>
                )}
                </div>

                {/* Audience */}
                <div className="border-b border-neutral-200 pb-2">
                <button
                    type="button"
                    onClick={() => toggleDropdown("audience")}
                    className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
                >
                    <span>
                    <label className="text-base text-gmcc-navy">Age group</label>
                    {audience.length > 0 && (
                        <span className="ml-2 text-xs text-neutral-500">({audience.length})</span>
                    )}
                    </span>
                    <svg
                    className={`w-4 h-4 transition-transform ${openDropdowns.has("audience") ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {openDropdowns.has("audience") && (
                    <div className="space-y-1 pt-2 pb-2">
                    {audienceOptions.map((a) => (
                        <label key={a.slug} className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                        <input
                            type="checkbox"
                            checked={audience.includes(a.slug)}
                            onChange={() => setAudience(toggle(audience, a.slug))}
                            className="cursor-pointer"
                        />
                        <span>{a.name}</span>
                        </label>
                    ))}
                    </div>
                )}
                </div>

                {/* Clear */}
                <button
                className="btn btn-secondary w-full"
                onClick={() => {
                    setSearch("");
                    setAudience([]);
                    setEventTypes([]);
                    setDateFilter("upcoming");
                    setOpenDropdowns(new Set());
                }}
                >
                Clear filters
                </button>
            </div>
            </aside>

          {/* RESULTS */}
          <section className="stack-4">
            <div className="flex items-center justify-between">
              <h2 className="h2">Results</h2>
              <div className="body">
                {filtered.length === 1
                  ? `${filtered.length} event`
                  : `${filtered.length} events`}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => (
                <a
                  key={e.slug}
                  href={buildEventHref(e.slug, e.displayStart ?? "")}
                  className="group card card-hover card-link overflow-hidden h-[380px] flex flex-col"
                >
                  {/* Full-bleed image */}
                  <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                    {e.heroUrl && (
                      <img
                        src={e.heroUrl}
                        alt={e.heroAlt}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col min-h-0 mt-5">
                    <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-1">
                        {e.title}
                    </h3>

                    {(e.displayStart || e.displayEnd) && (
                    <span className="mt-2 badge badge-green w-fit">
                        {formatEventDate(e.displayStart, e.displayEnd)}
                    </span>
                    )}

                    <CentersBadgesOneLine centers={e.centers} />

                    {e.summary && (
                    <p className="mt-3 text-xs leading-6 text-neutral-600 line-clamp-3">
                        {e.summary}
                    </p>
                    )}

                    <div className="mt-auto flex items-center justify-end border-t border-neutral-100 pt-4">
                      <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                        View →
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {!filtered.length && (
              <div className="rounded-xl border border-dashed p-8 text-center body">
                No events match these filters.
              </div>
            )}

            {/* Infinite scroll footer */}
            <div className="pt-4">
              {loadError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {loadError}
                  <button type="button" onClick={loadMore} className="ml-3 underline">
                    Try again
                  </button>
                </div>
              )}

              {pageInfo.hasNextPage && (
                <div className="flex items-center justify-center py-6 text-sm text-neutral-600">
                  {isLoadingMore ? "Loading more events…" : "Scroll to load more"}
                </div>
              )}

              {/* The sentinel element observed by IntersectionObserver */}
              <div ref={sentinelRef} className="h-1" />
            </div>
          </section>
        </section>
      </div>
    </>
  );
}
