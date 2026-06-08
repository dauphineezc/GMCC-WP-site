"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { LAZY_LOAD_PROGRAMS } from "@/lib/programsListQuery";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";
import {
  ProgramsDirectoryHeader,
  getProgramsDirectoryHeaderVariant,
  type ProgramsPageACF,
} from "@/components/programs/programsDirectoryHeader";
type ProgramWP = any;

type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type ProgramCard = {
  slug: string;
  title: string;
  summary: string;
  heroUrl: string | null;
  heroAlt: string;
  offeringType: string[];
  skillLevel: string[];
  membershipRequirements: { slug: string; name: string }[];
  audience: { slug: string; name: string }[];
  centers: { slug: string; title: string }[];
  programAreas: { slug: string; name: string }[];
  groupFitnessClassType: string | null;
  registrationLink: string | null;
  priceFrom: number | null;
  campTypes: { slug: string; name: string }[];
};

export function mapProgramForExplorer(wp: ProgramWP): ProgramCard {
  const f = wp.programFields ?? {};
  const hero = wp.featuredImage?.node;
  const galleryHero = f?.mediaGallery?.image1?.node;

  const centers =
    f.center?.nodes?.map((c: any) => ({
      slug: c?.slug,
      title: c?.title,
    })).filter((c: any) => c?.slug && c?.title) ?? [];

  const programAreas =
    f.programArea?.nodes?.map((n: any) => ({
      slug: n?.slug,
      name: n?.name,
    })).filter((x: any) => x?.slug && x?.name) ?? [];

  const ageMinRaw = f.ageRange?.min ?? null;
  const ageMaxRaw = f.ageRange?.max ?? null;

  return {
    slug: wp.slug,
    title: wp.title,
    summary: f.summary ?? "",
    heroUrl: hero?.sourceUrl ?? galleryHero?.sourceUrl ?? null,
    heroAlt: hero?.altText ?? galleryHero?.altText ?? "",
    offeringType: Array.isArray(f.offeringType) ? f.offeringType : [],
    skillLevel: Array.isArray(f.skillLevel) ? f.skillLevel : [],
    membershipRequirements: f.membershipRequirements?.nodes?.map((n: any) => ({
      slug: n?.slug,
      name: n?.name,
    })).filter((x: any) => x?.slug && x?.name) ?? [],
    audience: f.audience?.nodes?.map((n: any) => ({
      slug: n?.slug,
      name: n?.name,
    })).filter((x: any) => x?.slug && x?.name) ?? [],
    centers,
    programAreas,
    priceFrom: typeof f.priceFrom === "number" ? f.priceFrom : null,

    campTypes: f.campType?.nodes?.map((n: any) => ({
      slug: n?.slug,
      name: n?.name,
    })).filter((x: any) => x?.slug && x?.name) ?? [],

    groupFitnessClassType: Array.isArray(f.groupFitnessClassType)
      ? (f.groupFitnessClassType[0] ?? null)
      : typeof f.groupFitnessClassType === "string"
      ? f.groupFitnessClassType
      : null,
    registrationLink: f.registrationInformation?.registrationLink ?? null,
  };
}

export default function ExploreProgramsClient({
  initialPrograms,
  initialPageInfo,
  pageSize,
  directoryHeaderData,
}: {
  initialPrograms: ProgramWP[];
  initialPageInfo: PageInfo;
  pageSize: number;
  directoryHeaderData: ProgramsPageACF;
}) {
  // Infinite scroll state
  const [loadedPrograms, setLoadedPrograms] = useState<ProgramWP[]>(initialPrograms);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isApplyingUrlStateRef = useRef(false);
  const shouldSyncUrlFromUserActionRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    if (!pageInfo.hasNextPage) return;

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams();
      params.set("first", String(pageSize));
      if (pageInfo.endCursor) params.set("after", pageInfo.endCursor);

      const res = await fetch(`/api/programs?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load more programs (${res.status})`);

      const json: { programs: ProgramWP[]; pageInfo: PageInfo } = await res.json();

      // de-dupe by slug/id just in case
      setLoadedPrograms(prev => {
        const seen = new Set(prev.map(p => p?.id ?? p?.slug));
        const next = [...prev];
        for (const p of json.programs ?? []) {
          const key = p?.id ?? p?.slug;
          if (!seen.has(key)) {
            seen.add(key);
            next.push(p);
          }
        }
        return next;
      });

      setPageInfo(json.pageInfo);
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load more programs");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, pageInfo.hasNextPage, pageInfo.endCursor, pageSize]);

  // IntersectionObserver triggers loadMore near bottom (only when lazy loading is enabled)
  useEffect(() => {
    if (!LAZY_LOAD_PROGRAMS) return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "800px 0px", // start loading before you hit bottom
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  
  const all = useMemo(() => loadedPrograms.map(mapProgramForExplorer), [loadedPrograms]);

  // --- build option lists ---
  const offeringTypeOptions = useMemo(() => {
    const s = new Set<string>();
    all.forEach(p => p.offeringType.forEach(x => s.add(x)));
    return Array.from(s).sort();
  }, [all]);

  const skillLevelOptions = useMemo(() => {
    const s = new Set<string>();
    all.forEach(p => p.skillLevel.forEach(x => s.add(x)));
    return Array.from(s).sort();
  }, [all]);

  const membershipOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach(p => p.membershipRequirements.forEach((m: any) => map.set(m.slug, m.name)));
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const centerOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach(p => p.centers.forEach(c => map.set(c.slug, c.title)));
    return Array.from(map.entries())
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [all]);

  const programAreaOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach(p => p.programAreas.forEach(a => map.set(a.slug, a.name)));
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const audienceOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach(p => p.audience.forEach((a: any) => map.set(a.slug, a.name)));
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  // --- Read URL search params ---
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsObj = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams]
  );
  const hasSpecializedHeader = useMemo(
    () => getProgramsDirectoryHeaderVariant(searchParamsObj) !== null,
    [searchParamsObj]
  );

  // Helper to find slug by name (case-insensitive)
  const findSlugByName = (options: { slug: string; name: string }[], name: string) => {
    const lower = name.toLowerCase();
    const match = options.find(o => o.name.toLowerCase() === lower || o.slug.toLowerCase() === lower);
    return match?.slug;
  };

  // Parse initial values from URL
  const initialFilters = useMemo(() => {
    const programAreaParam = searchParams.get("programArea");
    const audienceParam = searchParams.get("audience");
    const offeringTypeParam = searchParams.get("offeringType");
    const centerParam = searchParams.get("center");
    const skillLevelParam = searchParams.get("skillLevel");
    const campTypeParam = searchParams.get("campType");

    // programArea can be slugs or names from nav links.
    const programAreaSlugs: string[] = [];
    if (programAreaParam) {
      programAreaParam.split(",").forEach(raw => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        const directSlug = programAreaOptions.find(a => a.slug.toLowerCase() === trimmed.toLowerCase());
        if (directSlug) {
          programAreaSlugs.push(directSlug.slug);
          return;
        }
        const slug = findSlugByName(programAreaOptions, trimmed);
        if (slug) {
          programAreaSlugs.push(slug);
          return;
        }
        // Preserve unknown slugs to avoid URL thrash during navigation.
        programAreaSlugs.push(trimmed.toLowerCase());
      });
    }

    const campTypeSlugs: string[] = [];
    if (campTypeParam) {
      campTypeParam.split(",").forEach(name => {
        campTypeSlugs.push(name.trim());
      });
    }

    // audience param can be comma-separated slugs or names
    const audienceSlugs: string[] = [];
    if (audienceParam) {
      audienceParam.split(",").forEach(val => {
        const trimmed = val.trim();
        // Check if it's already a slug
        const existingSlug = audienceOptions.find(a => a.slug === trimmed);
        if (existingSlug) {
          audienceSlugs.push(trimmed);
        } else {
          // Try to find by name
          const slug = findSlugByName(audienceOptions, trimmed);
          if (slug) audienceSlugs.push(slug);
        }
      });
    }

    // offeringType uses exact values (they're ACF select values, not taxonomy)
    const offeringTypeValues: string[] = [];
    if (offeringTypeParam) {
      offeringTypeParam.split(",").forEach(val => {
        const trimmed = val.trim();
        // Case-insensitive match against available options
        const match = offeringTypeOptions.find(o => o.toLowerCase() === trimmed.toLowerCase());
        if (match) offeringTypeValues.push(match);
      });
    }

    // center param - can be slug
    const centerSlugs: string[] = [];
    if (centerParam) {
      centerParam.split(",").forEach(val => {
        const trimmed = val.trim();
        const match = centerOptions.find(c => c.slug === trimmed || c.title.toLowerCase() === trimmed.toLowerCase());
        if (match) centerSlugs.push(match.slug);
      });
    }

    // skillLevel - exact match
    const skillLevelValues: string[] = [];
    if (skillLevelParam) {
      skillLevelParam.split(",").forEach(val => {
        const trimmed = val.trim();
        const match = skillLevelOptions.find(s => s.toLowerCase() === trimmed.toLowerCase());
        if (match) skillLevelValues.push(match);
      });
    }

    return {
      programAreas: programAreaSlugs,
      audience: audienceSlugs,
      offeringTypes: offeringTypeValues,
      centers: centerSlugs,
      skillLevels: skillLevelValues,
      campTypes: campTypeSlugs,
    };
  }, [searchParams, programAreaOptions, audienceOptions, offeringTypeOptions, centerOptions, skillLevelOptions]);

  // --- filter state ---
  const [search, setSearch] = useState("");
  const [offeringTypes, setOfferingTypes] = useState<string[]>(initialFilters.offeringTypes);
  const [centers, setCenters] = useState<string[]>(initialFilters.centers);
  const [programAreas, setProgramAreas] = useState<string[]>(initialFilters.programAreas);
  const [skillLevels, setSkillLevels] = useState<string[]>(initialFilters.skillLevels);
  const [memberships, setMemberships] = useState<string[]>([]); 
  const [audience, setAudience] = useState<string[]>(initialFilters.audience);
  const [campTypes, setCampTypes] = useState<string[]>(initialFilters.campTypes);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Keep URL in sync for the two filters that drive directory header selection.
  useEffect(() => {
    if (isApplyingUrlStateRef.current) return;
    if (!shouldSyncUrlFromUserActionRef.current) return;

    const nextParams = new URLSearchParams(searchParams.toString());

    if (offeringTypes.length) {
      nextParams.set("offeringType", offeringTypes.join(","));
    } else {
      nextParams.delete("offeringType");
    }

    if (programAreas.length) {
      nextParams.set("programArea", programAreas.join(","));
    } else {
      nextParams.delete("programArea");
    }

    const current = searchParams.toString();
    const next = nextParams.toString();
    if (next !== current) {
      const href = next ? `${pathname}?${next}` : pathname;
      router.replace(href, { scroll: false });
    }
    shouldSyncUrlFromUserActionRef.current = false;
  }, [offeringTypes, programAreas, pathname, router, searchParams]);

  // Sync state when URL params change (e.g., navigating from navbar)
  useEffect(() => {
    isApplyingUrlStateRef.current = true;
    setOfferingTypes(initialFilters.offeringTypes);
    setCenters(initialFilters.centers);
    setProgramAreas(initialFilters.programAreas);
    setSkillLevels(initialFilters.skillLevels);
    setAudience(initialFilters.audience);
    setCampTypes(initialFilters.campTypes);
    
    // Auto-open dropdowns that have active filters
    const toOpen = new Set<string>();
    if (initialFilters.offeringTypes.length) toOpen.add("offeringType");
    if (initialFilters.centers.length) toOpen.add("centers");
    if (initialFilters.programAreas.length) toOpen.add("programAreas");
    if (initialFilters.skillLevels.length) toOpen.add("skillLevels");
    if (initialFilters.audience.length) toOpen.add("audience");
    if (initialFilters.campTypes.length) toOpen.add("campTypes");
    if (toOpen.size > 0) setOpenDropdowns(toOpen);

    const release = window.setTimeout(() => {
      isApplyingUrlStateRef.current = false;
    }, 0);
    return () => window.clearTimeout(release);
  }, [initialFilters]);
  
  // --- dropdown state ---
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(() => {
    // Initialize with dropdowns that have active filters from URL
    const toOpen = new Set<string>();
    if (initialFilters.offeringTypes.length) toOpen.add("offeringType");
    if (initialFilters.centers.length) toOpen.add("centers");
    if (initialFilters.programAreas.length) toOpen.add("programAreas");
    if (initialFilters.skillLevels.length) toOpen.add("skillLevels");
    if (initialFilters.audience.length) toOpen.add("audience");
    return toOpen;
  });
  
  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  function toggle(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  function setOfferingTypesFromUser(next: string[]) {
    shouldSyncUrlFromUserActionRef.current = true;
    setOfferingTypes(next);
  }

  function setProgramAreasFromUser(next: string[]) {
    shouldSyncUrlFromUserActionRef.current = true;
    setProgramAreas(next);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const results = all.filter(p => {
      // text search
      if (q) {
        const hay = `${p.title} ${p.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // offering type
      if (offeringTypes.length) {
        if (!p.offeringType.some(x => offeringTypes.includes(x))) return false;
      }

      // centers (relationship)
      if (centers.length) {
        if (!p.centers.some(c => centers.includes(c.slug))) return false;
      }

      // program area taxonomy
      if (programAreas.length) {
        if (!p.programAreas.some(a => programAreas.includes(a.slug))) return false;
      }

      // skill level
      if (skillLevels.length) {
        if (!p.skillLevel.some(x => skillLevels.includes(x))) return false;
      }

      // audience
      if (audience.length) {
        if (!p.audience.some((a: any) => audience.includes(a.slug))) return false;
      }

      // camp type
      if (campTypes.length) {
        if (!p.campTypes.some(ct => campTypes.includes(ct.slug))) return false;
      }

      return true;
    });

    // Sort alphabetically by title
    return results.sort((a, b) => a.title.localeCompare(b.title));
  }, [
    all,
    search,
    offeringTypes,
    centers,
    programAreas,
    skillLevels,
    memberships,
    audience,
    campTypes,
  ]);

  return (
    <>
      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 py-8 section-y stack-8">
        <header className="stack-2">
          {hasSpecializedHeader ? (
            <ProgramsDirectoryHeader
              searchParams={searchParamsObj}
              acf={directoryHeaderData}
            />
          ) : (
            <>
              <h1 className="h1">Program directory</h1>
              <p className="body">Browse all programs and filter by location, type, age, and more.</p>
            </>
          )}
        </header>

      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* FILTER SIDEBAR */}
        <aside className="card h-fit lg:top-18">
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
              {(offeringTypes.length + centers.length + programAreas.length + skillLevels.length + memberships.length + audience.length) > 0 && (
                <span className="badge badge-teal ml-1">
                  {offeringTypes.length + centers.length + programAreas.length + skillLevels.length + memberships.length + audience.length}
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Filter content - hidden on mobile by default, always visible on desktop */}
          <div className={`stack-4 p-4 pt-0 lg:pt-4 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>

          {/* Search */}
          <div className="stack-2 border-b border-neutral-200 pb-4 mt-2">
            <label className="body text-gmcc-navy">Search</label>
            <input
              className="w-full rounded-lg border border-neutral-500 px-3 py-2 body mt-2"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Offering Type */}
          <div className="border-b border-neutral-200 pb-2">
            <button
              type="button"
              onClick={() => toggleDropdown("offeringType")}
              className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
            >
              <span><label className="text-base text-gmcc-navy">Offering type</label>{offeringTypes.length > 0 && <span className="ml-2 text-xs text-neutral-500">({offeringTypes.length})</span>}</span>
              <svg
                className={`w-4 h-4 transition-transform ${openDropdowns.has("offeringType") ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdowns.has("offeringType") && (
              <div className="space-y-1 pt-2 pb-2">
                {offeringTypeOptions.map((ot) => (
                  <label key={ot} className="flex items-center gap-2 text-sm cursor-pointer text-gmcc-grey-dark hover:text-neutral-900">
                    <input
                      type="checkbox"
                      checked={offeringTypes.includes(ot)}
                      onChange={() => setOfferingTypesFromUser(toggle(offeringTypes, ot))}
                      className="cursor-pointer"
                    />
                    <span>{ot}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Centers */}
          <div className="border-b border-neutral-200 pb-2">
            <button
              type="button"
              onClick={() => toggleDropdown("centers")}
              className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
            >
              <span><label className="text-base text-gmcc-navy">Center</label>{centers.length > 0 && <span className="ml-2 text-xs text-neutral-500">({centers.length})</span>}</span>
              <svg
                className={`w-4 h-4 transition-transform ${openDropdowns.has("centers") ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdowns.has("centers") && (
              <div className="space-y-1 pt-2 pb-2">
                {centerOptions.map((c) => (
                  <label key={c.slug} className="flex items-center gap-2 text-sm cursor-pointer text-gmcc-grey-dark hover:text-neutral-900">
                    <input
                      type="checkbox"
                      checked={centers.includes(c.slug)}
                      onChange={() => setCenters(toggle(centers, c.slug))}
                      className="cursor-pointer"
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Program Areas */}
          <div className="border-b border-neutral-200 pb-2">
            <button
              type="button"
              onClick={() => toggleDropdown("programAreas")}
              className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
            >
              <span><label className="text-base text-gmcc-navy">Program area</label>{programAreas.length > 0 && <span className="ml-2 text-xs text-neutral-500">({programAreas.length})</span>}</span>
              <svg
                className={`w-4 h-4 transition-transform ${openDropdowns.has("programAreas") ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdowns.has("programAreas") && (
              <div className="space-y-1 pt-2 pb-2">
                {programAreaOptions.map((a) => (
                  <label key={a.slug} className="flex items-center gap-2 text-sm cursor-pointer text-gmcc-grey-dark hover:text-neutral-900">
                    <input
                      type="checkbox"
                      checked={programAreas.includes(a.slug)}
                      onChange={() => setProgramAreasFromUser(toggle(programAreas, a.slug))}
                      className="cursor-pointer"
                    />
                    <span>{a.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Skill Level */}
          <div className="border-b border-neutral-200 pb-2">
            <button
              type="button"
              onClick={() => toggleDropdown("skillLevels")}
              className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
            >
              <span><label className="text-base text-gmcc-navy">Skill level/Intensity</label>{skillLevels.length > 0 && <span className="ml-2 text-xs text-neutral-500">({skillLevels.length})</span>}</span>
              <svg
                className={`w-4 h-4 transition-transform ${openDropdowns.has("skillLevels") ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdowns.has("skillLevels") && (
              <div className="space-y-1 pt-2 pb-2">
                {skillLevelOptions.map((sl) => (
                  <label key={sl} className="flex items-center gap-2 text-sm cursor-pointer text-gmcc-grey-dark hover:text-neutral-900">
                    <input
                      type="checkbox"
                      checked={skillLevels.includes(sl)}
                      onChange={() => setSkillLevels(toggle(skillLevels, sl))}
                      className="cursor-pointer"
                    />
                    <span>{sl}</span>
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
              <span><label className="text-base text-gmcc-navy">Age group</label>{audience.length > 0 && <span className="ml-2 text-xs text-neutral-500">({audience.length})</span>}</span>
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
                  <label key={a.slug} className="flex items-center gap-2 text-sm cursor-pointer text-gmcc-grey-dark hover:text-neutral-900">
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
              shouldSyncUrlFromUserActionRef.current = true;
              setSearch("");
              setOfferingTypes([]);
              setCenters([]);
              setProgramAreas([]);
              setSkillLevels([]);
              setMemberships([]);
              setAudience([]);
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
            <div className="body">{filtered.length === 1 ? `${filtered.length} program` : `${filtered.length} programs`}</div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (

          <div
            key={p.slug}
            className="group card card-hover relative overflow-hidden flex flex-col"
          >
            {/* Full-bleed image */}
            <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
              {p.heroUrl && (
                <img
                  src={p.heroUrl}
                  alt={p.heroAlt}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
              {p.groupFitnessClassType === "silversneakers" ? (
                <span className="absolute top-2 right-2 rounded-full bg-[#6DB626] px-2.5 py-0.75 text-xs font-semibold text-white shadow">
                  SilverSneakers® Exclusive
                </span>
              ) : p.groupFitnessClassType === "specialty fitness" ? (
                <span className="absolute top-2 right-2 rounded-full bg-[#FF004D] px-2.5 py-0.75 text-xs font-semibold text-white shadow">
                  Specialty Program
                </span>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col min-h-0 mt-5">
              <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-1">
                {p.title}
              </h3>

              <CentersBadgesOneLine centers={p.centers} />

              {p.summary && (
                <p className="mt-3 text-xs leading-6 text-neutral-600 line-clamp-3 mb-3">
                  {p.summary}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                {(() => {
                  const isGroupFitness = p.programAreas.some(a => a.slug === "group-fitness");
                  const isSpecialty = p.groupFitnessClassType === "specialty fitness" || p.groupFitnessClassType === "silversneakers";
                  const showQuickRegister = isGroupFitness && !isSpecialty && p.registrationLink;
                  return showQuickRegister ? (
                    <a
                      href={p.registrationLink!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 btn btn-primary text-xs px-3 py-1.5"
                    >
                      Quick Register
                    </a>
                  ) : (
                    p.priceFrom != null ? (
                      <div className="text-sm">
                        <span className="text-neutral-500">From </span>
                        <span className="font-semibold text-neutral-900">
                          ${p.priceFrom.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div />
                    )
                  );
                })()}

                <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                  View →
                </span>
              </div>
            </div>

            {/* Stretched link covers the full card; Quick Register sits above it via z-10 */}
            <a
              href={`/programs/${p.slug}`}
              aria-label={p.title}
              className="card-stretched-link"
            />
          </div>
            ))}
          </div>

          {!filtered.length && (
            <div className="rounded-xl border border-dashed p-8 text-center body">
              No programs match these filters.
            </div>
          )}

          {/* Infinite scroll footer */}
          <div className="pt-4">
            {loadError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {loadError}
                <button
                  type="button"
                  onClick={loadMore}
                  className="ml-3 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {pageInfo.hasNextPage && (
              <div className="flex items-center justify-center py-6 text-sm text-neutral-600">
                {isLoadingMore ? "Loading more programs…" : "Scroll to load more"}
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