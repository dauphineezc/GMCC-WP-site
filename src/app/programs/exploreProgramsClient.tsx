"use client";

import { useMemo, useState } from "react";

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

  // --- filter state ---
  const [search, setSearch] = useState("");
  const [offeringTypes, setOfferingTypes] = useState<string[]>([]);
  const [centers, setCenters] = useState<string[]>([]);
  const [programAreas, setProgramAreas] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<string[]>([]);
  const [memberships, setMemberships] = useState<string[]>([]); 
  const [audience, setAudience] = useState<string[]>([]);
  
  // --- dropdown state ---
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  
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
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore our programs</h1>
        <p className="text-sm text-neutral-600 sm:text-base">
          Browse all programs and filter by location, type, age, and more.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* FILTER SIDEBAR */}
        <aside className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm h-fit">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
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
              <span>Offering type{offeringTypes.length > 0 && <span className="ml-2 text-xs text-neutral-500">({offeringTypes.length})</span>}</span>
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
              <span>Center{centers.length > 0 && <span className="ml-2 text-xs text-neutral-500">({centers.length})</span>}</span>
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
              <span>Program area{programAreas.length > 0 && <span className="ml-2 text-xs text-neutral-500">({programAreas.length})</span>}</span>
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
              <span>Skill level{skillLevels.length > 0 && <span className="ml-2 text-xs text-neutral-500">({skillLevels.length})</span>}</span>
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
              <span>Audience{audience.length > 0 && <span className="ml-2 text-xs text-neutral-500">({audience.length})</span>}</span>
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
              <span>Membership required{memberships.length > 0 && <span className="ml-2 text-xs text-neutral-500">({memberships.length})</span>}</span>
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
            className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
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
        </aside>

        {/* RESULTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="text-sm text-neutral-600">{filtered.length} programs</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <a
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500/60 transition"
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
    </main>
  );
}