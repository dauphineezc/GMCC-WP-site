"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HeaderImage from "@/components/headerImage";

type ProgramWP = any;

type ProgramCard = {
  slug: string;
  title: string;
  summary: string;
  heroUrl: string | null;
  heroAlt: string;
  offeringType: string[];      // ACF select
  skillLevel: string[];        // ACF select
  membershipRequirements: { slug: string; name: string }[]; // taxonomy
  audience: { slug: string; name: string }[]; // taxonomy
  centers: { slug: string; title: string }[];
  programAreas: { slug: string; name: string }[];
  priceFrom: number | null;
};

function splitLines(val: unknown): string[] {
  return typeof val === "string"
    ? val.split("\n").map(s => s.trim()).filter(Boolean)
    : [];
}

function firstNumber(s?: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function mapProgramForExplorer(wp: ProgramWP): ProgramCard {
  const f = wp.programFields ?? {};
  const hero = wp.featuredImage?.node;

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
    heroUrl: hero?.sourceUrl ?? null,
    heroAlt: hero?.altText ?? "",
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
  };
}

export default function ExploreProgramsClient({ programs }: { programs: ProgramWP[] }) {
  const all = useMemo(() => programs.map(mapProgramForExplorer), [programs]);

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
  const searchParams = useSearchParams();

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

    // programArea param uses names like "Aquatics", need to convert to slugs
    const programAreaSlugs: string[] = [];
    if (programAreaParam) {
      programAreaParam.split(",").forEach(name => {
        const slug = findSlugByName(programAreaOptions, name.trim());
        if (slug) programAreaSlugs.push(slug);
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync state when URL params change (e.g., navigating from navbar)
  useEffect(() => {
    setOfferingTypes(initialFilters.offeringTypes);
    setCenters(initialFilters.centers);
    setProgramAreas(initialFilters.programAreas);
    setSkillLevels(initialFilters.skillLevels);
    setAudience(initialFilters.audience);
    
    // Auto-open dropdowns that have active filters
    const toOpen = new Set<string>();
    if (initialFilters.offeringTypes.length) toOpen.add("offeringType");
    if (initialFilters.centers.length) toOpen.add("centers");
    if (initialFilters.programAreas.length) toOpen.add("programAreas");
    if (initialFilters.skillLevels.length) toOpen.add("skillLevels");
    if (initialFilters.audience.length) toOpen.add("audience");
    if (toOpen.size > 0) setOpenDropdowns(toOpen);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return all.filter(p => {
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

      // membership requirements
      if (memberships.length) {
        if (!p.membershipRequirements.some((m: any) => memberships.includes(m.slug))) return false;
      }

      // audience
      if (audience.length) {
        if (!p.audience.some((a: any) => audience.includes(a.slug))) return false;
      }

      return true;
    });
  }, [
    all,
    search,
    offeringTypes,
    centers,
    programAreas,
    skillLevels,
    memberships,
    audience,
  ]);

  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/MembershipHeaderImage.png" alt="Greater Midland Memberships" />
      </div>

      {/* Page content - constrained width */}
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore our programs</h1>
        <p className="text-sm text-neutral-600 sm:text-base">
          Browse all programs and filter by location, type, age, and more.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* FILTER SIDEBAR */}
        <aside className="rounded-2xl border border-neutral-200 bg-white shadow-sm h-fit sticky top-18">
          {/* Mobile toggle button */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden w-full flex items-center justify-between p-4 text-sm font-medium text-neutral-700"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {(offeringTypes.length + centers.length + programAreas.length + skillLevels.length + memberships.length + audience.length) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
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
          <div className={`space-y-6 p-4 pt-0 lg:pt-4 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>

          {/* Search */}
          <div className="space-y-2 border-b border-neutral-200 pb-4 mt-2">
            <label className="text-base text-gmcc-navy">Search</label>
            <input
              className="w-full rounded-lg border border-neutral-500 px-3 py-2 text-sm mt-2"
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
                  <label key={ot} className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                    <input
                      type="checkbox"
                      checked={offeringTypes.includes(ot)}
                      onChange={() => setOfferingTypes(toggle(offeringTypes, ot))}
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
                  <label key={c.slug} className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
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
                  <label key={a.slug} className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                    <input
                      type="checkbox"
                      checked={programAreas.includes(a.slug)}
                      onChange={() => setProgramAreas(toggle(programAreas, a.slug))}
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
              <span><label className="text-base text-gmcc-navy">Skill level</label>{skillLevels.length > 0 && <span className="ml-2 text-xs text-neutral-500">({skillLevels.length})</span>}</span>
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
                  <label key={sl} className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
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
              <span><label className="text-base text-gmcc-navy">Audience</label>{audience.length > 0 && <span className="ml-2 text-xs text-neutral-500">({audience.length})</span>}</span>
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

          {/* Membership Requirements */}
          <div className="border-b border-neutral-200 pb-2">
            <button
              type="button"
              onClick={() => toggleDropdown("memberships")}
              className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
            >
              <span><label className="text-base text-gmcc-navy">Membership required</label>{memberships.length > 0 && <span className="ml-2 text-xs text-neutral-500">({memberships.length})</span>}</span>
              <svg
                className={`w-4 h-4 transition-transform ${openDropdowns.has("memberships") ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdowns.has("memberships") && (
              <div className="space-y-1 pt-2 pb-2">
                {membershipOptions.map((mr) => (
                  <label key={mr.slug} className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-900">
                    <input
                      type="checkbox"
                      checked={memberships.includes(mr.slug)}
                      onChange={() => setMemberships(toggle(memberships, mr.slug))}
                      className="cursor-pointer"
                    />
                    <span>{mr.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Clear */}
          <button
            className="w-full rounded-lg border border-neutral-500 text-neutral-700 px-3 py-2 text-sm hover:bg-neutral-50"
            onClick={() => {
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
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="text-sm text-neutral-600">{filtered.length === 1 ? `${filtered.length} program` : `${filtered.length} programs`}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <a
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-md hover:shadow-lg hover:border-emerald-500 translate-y-1"
              >
                {p.heroUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.heroUrl}
                    alt={p.heroAlt}
                    className="h-36 w-full object-cover"
                  />
                )}

                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700">
                    {p.title}
                  </h3>
                  {p.summary && (
                    <p className="text-xs text-neutral-600 line-clamp-3">
                      {p.summary}
                    </p>
                  )}

                  {/* chips */}
                  <div className="flex flex-wrap gap-1 text-[11px] text-neutral-700">
                    {/* {p.offeringType.map((ot) => (
                      <span key={ot} className="rounded-full bg-neutral-100 px-2 py-0.5">
                        {ot}
                      </span>
                    ))} */}
                    {p.centers.map((c) => (
                      <span key={c.slug} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
                        {c.title}
                      </span>
                    ))}
                    {p.skillLevel.map((sl) => (
                      <span key={sl} className="rounded-full bg-green-50 px-2 py-0.5 text-green-800">
                        {sl}
                      </span>
                    ))}
                  </div>

                  {/* price */}
                  {p.priceFrom != null && (
                    <div className="text-xs text-neutral-800">
                      From <span className="font-semibold">${p.priceFrom.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>

          {!filtered.length && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-600">
              No programs match these filters.
            </div>
          )}
        </section>
      </section>
      </div>
    </main>
  );
}