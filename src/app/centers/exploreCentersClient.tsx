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
        const pSlug = typeof p?.slug === "string" ? p.slug : "";
        const pTitle = typeof p?.title === "string" ? p.title : "";
        if (pSlug && pTitle) entry.programs.push({ slug: pSlug, title: pTitle });
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
      const cSlug = typeof c?.slug === "string" ? c.slug : "";
      if (!cSlug) return false;
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
    <div className="mx-auto max-w-6xl px-4 section-y stack-8">
      <header className="mb-8 stack-2">
        <h1 className="h1">Explore our centers</h1>
        <p className="body max-w-3xl">
          Find the best location for your goals — filter by amenities, programs, or program areas.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* FILTER SIDEBAR */}
        <aside className="card h-fit sticky top-18">
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
              {(amenitiesSelected.length + areasSelected.length + programsSelected.length) > 0 && (
                <span className="badge badge-teal ml-1">
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
          <div className={`stack-4 p-4 pt-0 lg:pt-4 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Amenities */}
            <div>
              <h3 className="h3">Amenities</h3>
              <div className="mt-2 max-h-56 overflow-auto stack-2 pr-1">
                {amenityOptions.map(a => (
                  <label key={a.slug} className="flex items-center gap-2 small">
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
              <h3 className="h3">Program areas</h3>
              <div className="mt-2 max-h-56 overflow-auto stack-2 pr-1">
                {programAreaOptions.map(a => (
                  <label key={a.slug} className="flex items-center gap-2 small">
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
              className="btn btn-secondary w-full"
            >
              Clear filters
            </button>
          </div>
        </aside>

        {/* CENTER CARDS */}
        <div className="stack-4">
          {filteredCenters.length === 0 && (
            <p className="body">No centers match those filters.</p>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((c: any) => {
              const cf = c.centersFields ?? {};
              const lat = Number(cf.googleMap?.lat);
              const lng = Number(cf.googleMap?.lng);
              const zoom = Number(cf.googleMap?.zoom ?? 15);
              const hasMap = Number.isFinite(lat) && Number.isFinite(lng);
              const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
                `${lat},${lng}`
              )}&z=${Number.isFinite(zoom) ? zoom : 15}&output=embed`;

              return (
                <a
                  key={c.slug}
                  href={`/centers/${c.slug}`}
                  className="group card card-hover overflow-hidden"
                >
                  {mapSrc ? (
                    <div className="h-40 w-full overflow-hidden bg-neutral-100">
                      <iframe
                        src={mapSrc}
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
                      <span className="small">No map available</span>
                    </div>
                  )}

                  <div className="p-4 stack-2">
                    <h3 className="h3 group-hover:text-gmcc-teal">{c.title}</h3>

                    {cf.address && (
                      <p className="small whitespace-pre-line">{cf.address}</p>
                    )}

                    {(cf.contactInfo?.contactPhone || cf.contactInfo?.contactEmail) && (
                      <div className="small stack-2">
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