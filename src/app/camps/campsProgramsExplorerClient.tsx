"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";
import { mapProgramForExplorer } from "@/app/programs/exploreProgramsClient";
import { PROGRAMS_PAGE_SIZE } from "@/lib/programsListQuery";

/** Camp cards shown per results page (not WP API page size). */
const CAMPS_RESULTS_PER_PAGE = 6;

type ProgramWP = Record<string, unknown> | null;

type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

function isCampProgram(wp: ProgramWP): boolean {
  if (!wp) return false;
  const ot = (wp as { programFields?: { offeringType?: unknown } }).programFields?.offeringType;
  if (Array.isArray(ot)) {
    return ot.some((v) => String(v).toLowerCase().includes("camp"));
  }
  return false;
}

function mergePrograms(prev: ProgramWP[], batch: ProgramWP[]): ProgramWP[] {
  const seen = new Set(
    prev.map((p) => (p as { id?: string; slug?: string })?.id ?? (p as { slug?: string })?.slug),
  );
  const next = [...prev];
  for (const p of batch) {
    const key = (p as { id?: string; slug?: string })?.id ?? (p as { slug?: string })?.slug;
    if (!seen.has(key)) {
      seen.add(key);
      next.push(p);
    }
  }
  return next;
}

export default function CampsProgramsExplorerClient({
  initialPrograms,
  initialPageInfo,
  pageSize = PROGRAMS_PAGE_SIZE,
  resultsHeader,
  resultsBody,
}: {
  initialPrograms: unknown[];
  initialPageInfo: PageInfo;
  pageSize?: number;
  resultsHeader: string;
  resultsBody: string;
}) {
  const [loadedPrograms, setLoadedPrograms] = useState<ProgramWP[]>(initialPrograms as ProgramWP[]);
  const [isBuildingDirectory, setIsBuildingDirectory] = useState(!!initialPageInfo.hasNextPage);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isApplyingUrlStateRef = useRef(false);
  const shouldSyncUrlFromUserActionRef = useRef(false);

  /** Load every WP programs page once so camp counts and pagination stay accurate without infinite scroll. */
  useEffect(() => {
    let alive = true;

    async function loadFullDirectory() {
      if (!initialPageInfo.hasNextPage) {
        setIsBuildingDirectory(false);
        return;
      }

      setIsBuildingDirectory(true);
      setLoadError(null);

      let merged: ProgramWP[] = [...(initialPrograms as ProgramWP[])];
      let hasNext: boolean = initialPageInfo.hasNextPage;
      let cursor = initialPageInfo.endCursor;

      try {
        while (hasNext && alive) {
          const params = new URLSearchParams();
          params.set("first", String(pageSize));
          if (cursor) params.set("after", cursor);

          const res = await fetch(`/api/programs?${params.toString()}`);
          if (!res.ok) throw new Error(`Failed to load programs (${res.status})`);

          const json: { programs: ProgramWP[]; pageInfo: PageInfo } = await res.json();
          if (!alive) return;

          merged = mergePrograms(merged, json.programs ?? []);
          setLoadedPrograms(merged);
          hasNext = json.pageInfo.hasNextPage;
          cursor = json.pageInfo.endCursor;
        }
      } catch (e: unknown) {
        if (alive) {
          setLoadError(e instanceof Error ? e.message : "Failed to load full program list");
        }
      } finally {
        if (alive) {
          setIsBuildingDirectory(false);
        }
      }
    }

    loadFullDirectory();
    return () => {
      alive = false;
    };
    // Intentionally run once on mount with the SSR snapshot (see React strict mode cleanup above).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- full merge uses initial props only
  }, []);

  const retryLoadFullDirectory = useCallback(async () => {
    setLoadError(null);
    setIsBuildingDirectory(true);
    let merged: ProgramWP[] = [...(initialPrograms as ProgramWP[])];
    let hasNext: boolean = initialPageInfo.hasNextPage;
    let cursor = initialPageInfo.endCursor;
    try {
      while (hasNext) {
        const params = new URLSearchParams();
        params.set("first", String(pageSize));
        if (cursor) params.set("after", cursor);
        const res = await fetch(`/api/programs?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to load programs (${res.status})`);
        const json: { programs: ProgramWP[]; pageInfo: PageInfo } = await res.json();
        merged = mergePrograms(merged, json.programs ?? []);
        setLoadedPrograms(merged);
        hasNext = json.pageInfo.hasNextPage;
        cursor = json.pageInfo.endCursor;
      }
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Failed to load full program list");
    } finally {
      setIsBuildingDirectory(false);
    }
  }, [initialPrograms, initialPageInfo.hasNextPage, initialPageInfo.endCursor, pageSize]);

  const campProgramsRaw = useMemo(() => loadedPrograms.filter(isCampProgram), [loadedPrograms]);

  const all = useMemo(() => campProgramsRaw.map((p) => mapProgramForExplorer(p)), [campProgramsRaw]);

  const centerOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach((p) => p.centers.forEach((c) => map.set(c.slug, c.title)));
    return Array.from(map.entries())
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [all]);

  const campTypeOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach((p) => p.campTypes.forEach((ct) => map.set(ct.slug, ct.name)));
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialFilters = useMemo(() => {
    const centerParam = searchParams.get("center");
    const campTypeParam = searchParams.get("campType");
    const qParam = searchParams.get("q");

    const centerSlugs: string[] = [];
    if (centerParam) {
      centerParam.split(",").forEach((val) => {
        const trimmed = val.trim();
        const match = centerOptions.find(
          (c) => c.slug === trimmed || c.title.toLowerCase() === trimmed.toLowerCase(),
        );
        if (match) centerSlugs.push(match.slug);
      });
    }

    const campTypeSlugs: string[] = [];
    if (campTypeParam) {
      campTypeParam.split(",").forEach((raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        const match = campTypeOptions.find(
          (c) => c.slug === trimmed || c.slug.toLowerCase() === trimmed.toLowerCase(),
        );
        if (match) campTypeSlugs.push(match.slug);
      });
    }

    return {
      centers: centerSlugs,
      campTypes: campTypeSlugs,
      q: (qParam ?? "").trim(),
    };
  }, [searchParams, centerOptions, campTypeOptions]);

  const [search, setSearch] = useState(initialFilters.q);
  const [centers, setCenters] = useState<string[]>(initialFilters.centers);
  const [campTypes, setCampTypes] = useState<string[]>(initialFilters.campTypes);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(
    () => new Set(["centers", "campTypes"]),
  );

  useEffect(() => {
    if (isApplyingUrlStateRef.current) return;
    if (!shouldSyncUrlFromUserActionRef.current) return;

    const nextParams = new URLSearchParams(searchParams.toString());

    if (centers.length) nextParams.set("center", centers.join(","));
    else nextParams.delete("center");

    if (campTypes.length) nextParams.set("campType", campTypes.join(","));
    else nextParams.delete("campType");

    if (search.trim()) nextParams.set("q", search.trim());
    else nextParams.delete("q");

    const current = searchParams.toString();
    const next = nextParams.toString();
    if (next !== current) {
      const href = next ? `${pathname}?${next}` : pathname;
      router.replace(href, { scroll: false });
    }
    shouldSyncUrlFromUserActionRef.current = false;
  }, [centers, campTypes, search, pathname, router, searchParams]);

  useEffect(() => {
    isApplyingUrlStateRef.current = true;
    setCenters(initialFilters.centers);
    setCampTypes(initialFilters.campTypes);
    setSearch(initialFilters.q);

    const toOpen = new Set<string>(["centers", "campTypes"]);
    if (initialFilters.centers.length) toOpen.add("centers");
    if (initialFilters.campTypes.length) toOpen.add("campTypes");
    if (toOpen.size > 0) setOpenDropdowns(toOpen);

    const release = window.setTimeout(() => {
      isApplyingUrlStateRef.current = false;
    }, 0);
    return () => window.clearTimeout(release);
  }, [initialFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, centers, campTypes]);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function toggle(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function setCentersFromUser(next: string[]) {
    shouldSyncUrlFromUserActionRef.current = true;
    setCenters(next);
  }

  function setCampTypesFromUser(next: string[]) {
    shouldSyncUrlFromUserActionRef.current = true;
    setCampTypes(next);
  }

  function setSearchFromUser(next: string) {
    shouldSyncUrlFromUserActionRef.current = true;
    setSearch(next);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((p) => {
        if (q) {
          const hay = `${p.title} ${p.summary}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (centers.length) {
          if (!p.centers.some((c) => centers.includes(c.slug))) return false;
        }
        if (campTypes.length) {
          if (!p.campTypes.some((ct) => campTypes.includes(ct.slug))) return false;
        }
        return true;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [all, search, centers, campTypes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CAMPS_RESULTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const pagedResults = useMemo(
    () => filtered.slice((safePage - 1) * CAMPS_RESULTS_PER_PAGE, safePage * CAMPS_RESULTS_PER_PAGE),
    [filtered, safePage],
  );

  /** Only scroll after explicit pagination clicks (not filter-driven `safePage` changes or first paint). */
  const skipScrollOnFirstSafePageFxRef = useRef(true);
  const scrollResultsAfterPageButtonRef = useRef(false);
  useEffect(() => {
    if (skipScrollOnFirstSafePageFxRef.current) {
      skipScrollOnFirstSafePageFxRef.current = false;
      return;
    }
    if (!scrollResultsAfterPageButtonRef.current) return;
    scrollResultsAfterPageButtonRef.current = false;
    const el = document.getElementById("camps-results");
    if (!el) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && el.contains(active)) {
      active.blur();
    }
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [safePage]);

  const activeFilterCount = centers.length + campTypes.length + (search.trim() ? 1 : 0);

  /**
   * Deep-link scroll only for browse-by-center cards (`?center=…#camps-results`).
   * Not `?center=` alone, not `#camps-results` alone — avoids jumping on normal /camps visits.
   * Strip the hash after scrolling so filter-driven `searchParams` updates do not re-scroll.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#camps-results") return;
    if (!searchParams.get("center")) return;
    const el = document.getElementById("camps-results");
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const pathAndQuery = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", pathAndQuery);
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname, searchParams]);

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * CAMPS_RESULTS_PER_PAGE + 1;
  const rangeEnd = filtered.length === 0 ? 0 : Math.min(safePage * CAMPS_RESULTS_PER_PAGE, filtered.length);

  return (
    <div
      id="camps-results"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8 section-y stack-8 lg:scroll-mt-28"
    >
      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card h-fit lg:sticky lg:top-18">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex w-full items-center justify-between p-4 body font-medium lg:hidden"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {activeFilterCount > 0 ? (
                <span className="badge badge-teal ml-1">{activeFilterCount}</span>
              ) : null}
            </span>
            <svg
              className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`stack-4 p-4 pt-0 lg:block lg:pt-4 ${filtersOpen ? "block" : "hidden lg:block"}`}>
            <div className="stack-2 mt-2 border-b border-neutral-200 pb-4">
              <label className="body text-gmcc-navy" htmlFor="camps-program-search">
                Search
              </label>
              <input
                id="camps-program-search"
                className="body mt-2 w-full rounded-lg border border-neutral-500 px-3 py-2"
                placeholder="Search camps…"
                value={search}
                onChange={(e) => setSearchFromUser(e.target.value)}
              />
            </div>

            <div className="border-b border-neutral-200 pb-2">
              <button
                type="button"
                onClick={() => toggleDropdown("centers")}
                className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-neutral-900"
              >
                <span>
                  <span className="text-base text-gmcc-navy">Center</span>
                  {centers.length > 0 ? (
                    <span className="ml-2 text-xs text-neutral-500">({centers.length})</span>
                  ) : null}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${openDropdowns.has("centers") ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdowns.has("centers") ? (
                <div className="space-y-1 pb-2 pt-2">
                  {centerOptions.map((c) => (
                    <label
                      key={c.slug}
                      className="flex cursor-pointer items-center gap-2 text-sm text-gmcc-grey-dark hover:text-neutral-900"
                    >
                      <input
                        type="checkbox"
                        checked={centers.includes(c.slug)}
                        onChange={() => setCentersFromUser(toggle(centers, c.slug))}
                        className="cursor-pointer"
                      />
                      <span>{c.title}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border-b border-neutral-200 pb-2">
              <button
                type="button"
                onClick={() => toggleDropdown("campTypes")}
                className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-neutral-900"
              >
                <span>
                  <span className="text-base text-gmcc-navy">Camp type</span>
                  {campTypes.length > 0 ? (
                    <span className="ml-2 text-xs text-neutral-500">({campTypes.length})</span>
                  ) : null}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${openDropdowns.has("campTypes") ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdowns.has("campTypes") ? (
                <div className="space-y-1 pb-2 pt-2">
                  {campTypeOptions.map((ct) => (
                    <label
                      key={ct.slug}
                      className="flex cursor-pointer items-center gap-2 text-sm text-gmcc-grey-dark hover:text-neutral-900"
                    >
                      <input
                        type="checkbox"
                        checked={campTypes.includes(ct.slug)}
                        onChange={() => setCampTypesFromUser(toggle(campTypes, ct.slug))}
                        className="cursor-pointer"
                      />
                      <span>{ct.name}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => {
                shouldSyncUrlFromUserActionRef.current = true;
                setSearch("");
                setCenters([]);
                setCampTypes([]);
                setCurrentPage(1);
                setOpenDropdowns(new Set(["centers", "campTypes"]));
              }}
            >
              Clear filters
            </button>
          </div>
        </aside>

        <section className="stack-4">
          <div className="w-full text-right">
            <p className="body text-neutral-600">
              {filtered.length === 1 ? "1 camp" : `${filtered.length} camps`}
            </p>
          </div>

          {isBuildingDirectory ? (
            <p className="body rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700">
              Loading full program list for accurate filters and pagination…
            </p>
          ) : null}

          {loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {loadError}
              <button type="button" onClick={retryLoadFullDirectory} className="ml-3 font-semibold underline">
                Try again
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedResults.map((p) => (
              <a
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group card card-hover card-link flex h-[380px] flex-col overflow-hidden"
              >
                <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                  {p.heroUrl ? (
                    <img
                      src={p.heroUrl}
                      alt={p.heroAlt}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                </div>

                <div className="mt-5 flex min-h-0 flex-1 flex-col">
                  <h3 className="line-clamp-1 font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal">
                    {p.title}
                  </h3>

                  <CentersBadgesOneLine centers={p.centers} />

                  {p.summary ? (
                    <p className="mb-3 mt-3 line-clamp-3 text-xs leading-6 text-neutral-600">{p.summary}</p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                    {p.priceFrom != null ? (
                      <div className="text-sm">
                        <span className="text-neutral-500">From </span>
                        <span className="font-semibold text-neutral-900">${p.priceFrom.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div />
                    )}
                    <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {!filtered.length && !isBuildingDirectory ? (
            <div className="rounded-xl border border-dashed p-8 text-center body">No camps match these filters.</div>
          ) : null}

          {filtered.length > 0 && totalPages > 1 ? (
            <nav
              className="flex flex-col gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              aria-label="Camp results pagination"
            >
              <p className="body text-neutral-600">
                Showing {rangeStart}–{rangeEnd} of {filtered.length}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={safePage <= 1 || isBuildingDirectory}
                  onClick={() => {
                    scrollResultsAfterPageButtonRef.current = true;
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                >
                  Previous
                </button>
                <span className="body text-neutral-700">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={safePage >= totalPages || isBuildingDirectory}
                  onClick={() => {
                    scrollResultsAfterPageButtonRef.current = true;
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </section>
    </div>
  );
}
