"use client";

import { useMemo, useState } from "react";
import ImageCarousel from "@/components/imageCarousel";
import HeaderImage from "@/components/headerImage";

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
  
  // Mobile filter panel state (collapsed by default)
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/MembershipHeaderImage.png" alt="Greater Midland Memberships" />
      </div>

    {/* Page content - constrained width */}
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
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
              {(amenitiesSelected.length + areasSelected.length + programsSelected.length) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                  {amenitiesSelected.length + areasSelected.length + programsSelected.length}
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
            {/* Amenities */}
            <div>
              <h3>Amenities</h3>
              <div className="mt-2 max-h-56 overflow-auto space-y-1 pr-1">
                {amenityOptions.map(a => (
                  <label key={a.slug} className="flex items-center gap-2 text-xs text-neutral-700">
                    <input
                      type="checkbox"
                      checked={amenitiesSelected.includes(a.slug)}
                      onChange={() => toggle(amenitiesSelected, a.slug, setAmenitiesSelected)}
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Program Areas */}
            <div>
              <h3>Program areas</h3>
              <div className="mt-2 max-h-56 overflow-auto space-y-1 pr-1">
                {programAreaOptions.map(a => (
                  <label key={a.slug} className="flex items-center gap-2 text-xs text-neutral-700">
                    <input
                      type="checkbox"
                      checked={areasSelected.includes(a.slug)}
                      onChange={() => toggle(areasSelected, a.slug, setAreasSelected)}
                    />
                    {a.name}
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
          </div>
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
      </div>
    </main>
  );
}