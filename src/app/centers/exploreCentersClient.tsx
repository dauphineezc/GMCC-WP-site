"use client";

import { useMemo, useState } from "react";

type CenterNode = any;
type ProgramNode = any;

type Props = {
  centers: CenterNode[];
  programs: ProgramNode[];
};

export default function ExploreCentersClient({ centers, programs }: Props) {
  // Build a lookup: centerSlug -> { programs[], programAreas[] }
  const centerDerivedData = useMemo(() => {
    const map = new Map<string, { programs: { slug: string; title: string }[]; programAreas: string[] }>();

    for (const p of programs) {
      const pf = p?.programFields ?? {};
      const linkedCenters = pf.center?.nodes ?? [];
      const areas = (pf.programArea?.nodes ?? [])
        .map((a: any) => a?.name)
        .filter(Boolean);

      for (const c of linkedCenters) {
        if (!c?.slug) continue;
        const entry = map.get(c.slug) ?? { programs: [], programAreas: [] };
        entry.programs.push({ slug: p.slug, title: p.title });
        entry.programAreas.push(...areas);
        map.set(c.slug, entry);
      }
    }

    // de-dupe
    for (const [slug, entry] of map.entries()) {
      entry.programs = Array.from(
        new Map(entry.programs.map(x => [x.slug, x])).values()
      );
      entry.programAreas = Array.from(new Set(entry.programAreas));
      map.set(slug, entry);
    }

    return map;
  }, [programs]);

  // Build filter option lists from data
  const amenityOptions = useMemo(() => {
    const set = new Map<string, string>(); // slug -> name
    centers.forEach(c => {
      c?.centersFields?.amenities?.nodes?.forEach((t: any) => {
        if (t?.slug && t?.name) set.set(t.slug, t.name);
      });
    });
    return Array.from(set.entries()).map(([slug, name]) => ({ slug, name }));
  }, [centers]);

  const programAreaOptions = useMemo(() => {
    const set = new Map<string, string>();
    programs.forEach(p => {
      p?.programFields?.programArea?.nodes?.forEach((t: any) => {
        if (t?.slug && t?.name) set.set(t.slug, t.name);
      });
    });
    return Array.from(set.entries()).map(([slug, name]) => ({ slug, name }));
  }, [programs]);

  const programOptions = useMemo(() => {
    return programs
      .map(p => ({ slug: p.slug, title: p.title }))
      .filter(p => p.slug && p.title);
  }, [programs]);

  // Selected filters
  const [amenitiesSelected, setAmenitiesSelected] = useState<string[]>([]);
  const [areasSelected, setAreasSelected] = useState<string[]>([]);
  const [programsSelected, setProgramsSelected] = useState<string[]>([]);

  // Filtering logic:
  // - AND across categories
  // - OR within a category
  const filteredCenters = useMemo(() => {
    return centers.filter(c => {
      const cSlug = c?.slug;
      const cf = c?.centersFields ?? {};
      const cAmenities = (cf.amenities?.nodes ?? []).map((t: any) => t?.slug).filter(Boolean);

      const derived = centerDerivedData.get(cSlug) ?? { programs: [], programAreas: [] };
      const cProgramAreas = derived.programAreas; // names
      const cPrograms = derived.programs.map(p => p.slug);

      // amenities OR
      if (amenitiesSelected.length > 0 && !amenitiesSelected.some(a => cAmenities.includes(a))) {
        return false;
      }

      // program areas OR (match by slug OR by name fallback)
      if (areasSelected.length > 0) {
        const areasBySlug = (programs
          .flatMap(p => p?.programFields?.programArea?.nodes ?? [])
          .filter((t: any) => t?.slug && t?.name)
        );
        const areaSlugToName = new Map(areasBySlug.map((t: any) => [t.slug, t.name]));

        const selectedNames = areasSelected
          .map(s => areaSlugToName.get(s))
          .filter(Boolean);

        if (
          !areasSelected.some(slug => selectedNames.includes(slug as any) || cProgramAreas.includes(areaSlugToName.get(slug) as any))
        ) {
          // simpler: just check names
          if (!selectedNames.some(n => cProgramAreas.includes(n))) return false;
        }
      }

      // programs OR
      if (programsSelected.length > 0 && !programsSelected.some(p => cPrograms.includes(p))) {
        return false;
      }

      return true;
    });
  }, [centers, centerDerivedData, amenitiesSelected, areasSelected, programsSelected, programs]);

  const toggle = (arr: string[], value: string, setArr: (v: string[]) => void) => {
    setArr(arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Explore our centers
        </h1>
        <p className="max-w-3xl text-sm text-neutral-600 sm:text-base">
          Find the best location for your goals — filter by amenities, programs, or program areas.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* FILTER SIDEBAR */}
        <aside className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm h-fit sticky top-6">
          {/* Amenities */}
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Amenities</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {amenityOptions.map(a => (
                <button
                  key={a.slug}
                  onClick={() => toggle(amenitiesSelected, a.slug, setAmenitiesSelected)}
                  className={`rounded-full px-3 py-1 text-xs border ${
                    amenitiesSelected.includes(a.slug)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-neutral-50 text-neutral-700 border-neutral-200"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Program Areas */}
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Program areas</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {programAreaOptions.map(a => (
                <button
                  key={a.slug}
                  onClick={() => toggle(areasSelected, a.slug, setAreasSelected)}
                  className={`rounded-full px-3 py-1 text-xs border ${
                    areasSelected.includes(a.slug)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-neutral-50 text-neutral-700 border-neutral-200"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Programs</h2>
            <div className="mt-2 max-h-56 overflow-auto space-y-1 pr-1">
              {programOptions.map(p => (
                <label key={p.slug} className="flex items-center gap-2 text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={programsSelected.includes(p.slug)}
                    onChange={() => toggle(programsSelected, p.slug, setProgramsSelected)}
                  />
                  {p.title}
                </label>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setAmenitiesSelected([]);
              setAreasSelected([]);
              setProgramsSelected([]);
            }}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Clear filters
          </button>
        </aside>

        {/* CENTER CARDS */}
        <div className="space-y-4">
          {filteredCenters.length === 0 && (
            <p className="text-sm text-neutral-600">No centers match those filters.</p>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((c: any) => {
              const cf = c.centersFields ?? {};
              const googleMap = cf.googleMap;
              const hasMap = googleMap?.lat && googleMap?.lng;

              return (
                <a
                  key={c.slug}
                  href={`/centers/${c.slug}`}
                  className="group rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/60 transition overflow-hidden"
                >
                  {hasMap ? (
                    <div className="h-40 w-full overflow-hidden bg-neutral-100">
                      <iframe
                        src={`https://www.google.com/maps?q=${googleMap.lat},${googleMap.lng}&z=${googleMap.zoom || 15}&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Map for ${c.title}`}
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-neutral-100 flex items-center justify-center">
                      <span className="text-xs text-neutral-400">No map available</span>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700">
                      {c.title}
                    </h3>

                    {cf.address && (
                      <p className="text-xs text-neutral-600 whitespace-pre-line">
                        {cf.address}
                      </p>
                    )}

                    {(cf.contactInfo?.contactPhone || cf.contactInfo?.contactEmail) && (
                      <div className="text-xs text-neutral-700 space-y-0.5">
                        {cf.contactInfo?.contactPhone && (
                          <div>📞 {cf.contactInfo.contactPhone}</div>
                        )}
                        {cf.contactInfo?.contactEmail && (
                          <div>✉️ {cf.contactInfo.contactEmail}</div>
                        )}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}