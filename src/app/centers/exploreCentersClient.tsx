"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import PhoneLink from "@/components/phoneLink";
import { CENTER_SLUG_ORDER } from "@/lib/constants";

type CenterNode = any;
type ProgramNode = any;

type Props = {
  centers: CenterNode[];
  programs: ProgramNode[];
};

// Paste Google Maps iframe src URLs here by center slug.
// Example slug key: "community-center"
const CENTER_MAP_IFRAME_SRC_BY_SLUG: Record<string, string> = {
  "community-center":
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5776.855550714916!2d-84.22995452416238!3d43.61845477110376!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8823d5a7ede2564d%3A0xe10e70ea4bf16259!2sGreater%20Midland%20Community%20Center!5e0!3m2!1sen!2sus!4v1774296990953!5m2!1sen!2sus",

  "tennis-center":
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2886.7226574245065!2d-84.21931072416031!3d43.65393827110211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88217e3ac90b3fd3%3A0x446ca88d55a55e29!2sGreater%20Midland%20Tennis%20Center!5e0!3m2!1sen!2sus!4v1774297428863!5m2!1sen!2sus",

  "curling-center":
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5777.059344094783!2d-84.2305027241625!3d43.616333571103894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8823d5a810753f43%3A0x3308642093b40cbb!2sMidland%20Curling!5e0!3m2!1sen!2sus!4v1774297574461!5m2!1sen!2sus",

  "coleman-family-center":
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2881.9681114039395!2d-84.57831382415455!3d43.75275897109748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88218c93cb9606e9%3A0x7470a02186cb2c17!2sGreater%20Midland%20Coleman%20Family%20Center!5e0!3m2!1sen!2sus!4v1774297538605!5m2!1sen!2sus",

  "north-family-center":
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2880.374964317035!2d-84.26638902415257!3d43.78583187109614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8821780c23184edb%3A0x1ba02b20d8839295!2sNorth%20Midland%20Family%20Center!5e0!3m2!1sen!2sus!4v1774297507483!5m2!1sen!2sus",

  "corporate-wellness-center":
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2888.856505429373!2d-84.19133592416293!3d43.60952927110423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8823d56848f2a8a3%3A0x8d994b386146db55!2sCorteva%20Fitness%20Center!5e0!3m2!1sen!2sus!4v1774297603740!5m2!1sen!2sus",

  "corteva-fitness-center":
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2888.856505429373!2d-84.19133592416293!3d43.60952927110423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8823d56848f2a8a3%3A0x8d994b386146db55!2sCorteva%20Fitness%20Center!5e0!3m2!1sen!2sus!4v1774297603740!5m2!1sen!2sus",
};

// Card media sizing (map or image fallback)
const CARD_MEDIA_HEIGHT_CLASS = "h-[200px]";

function CenterCardMedia({
  slug,
  title,
  featuredImageUrl,
  featuredImageAlt,
}: {
  slug: string;
  title: string;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
}) {
  const [mapFailed, setMapFailed] = useState(false);
  const iframeSrc = CENTER_MAP_IFRAME_SRC_BY_SLUG[slug];
  const showMap = Boolean(iframeSrc) && !mapFailed;

  if (showMap) {
    return (
      <div className={`card-bleed relative bg-neutral-100 overflow-hidden rounded-t-2xl ${CARD_MEDIA_HEIGHT_CLASS}`}>
        <iframe
          src={iframeSrc}
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map for ${title}`}
          onError={() => setMapFailed(true)}
        />
      </div>
    );
  }

  if (featuredImageUrl) {
    return (
      <div className={`card-bleed relative bg-neutral-100 overflow-hidden rounded-t-2xl ${CARD_MEDIA_HEIGHT_CLASS}`}>
        <Image
          src={featuredImageUrl}
          alt={featuredImageAlt || `${title} featured image`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <div className={`card-bleed bg-neutral-100 flex items-center justify-center ${CARD_MEDIA_HEIGHT_CLASS}`}>
      <span className="small">No image available</span>
    </div>
  );
}


function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M12 22c-4.2-4.9-7-8.3-7-12a7 7 0 1 1 14 0c0 3.7-2.8 7.1-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M7.6 2h3.1c.6 0 1.1.4 1.2 1l.7 3.2c.1.5-.1 1-.5 1.3L10 9.5a14.4 14.4 0 0 0 4.5 4.5l2-2.1c.3-.4.8-.6 1.3-.5l3.2.7c.6.1 1 .6 1 1.2v3.1c0 .7-.6 1.3-1.3 1.3C11.6 18 6 12.4 6.3 3.3 6.3 2.6 6.9 2 7.6 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"
        fill="currentColor"
      />
    </svg>
  );
}


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

  // Selected filters
  const [amenitiesSelected, setAmenitiesSelected] = useState<string[]>([]);
  const [areasSelected, setAreasSelected] = useState<string[]>([]);
  const [programsSelected, setProgramsSelected] = useState<string[]>([]);

  // Mobile filter panel state (collapsed by default)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(
    () => new Set(["amenities", "programAreas", "programs"])
  );

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeFilterCount =
    amenitiesSelected.length + areasSelected.length + programsSelected.length;

  // Preferred display order for centers
  const centerOrder = CENTER_SLUG_ORDER;

  // Filtering logic:
  // - AND across categories
  // - OR within a category
  const filteredCenters = useMemo(() => {
    const filtered = centers.filter(c => {
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

    // Sort by the preferred order
    return filtered.sort((a, b) => {
      const aIndex = centerOrder.indexOf(a.slug);
      const bIndex = centerOrder.indexOf(b.slug);
      // Centers not in the order list go to the end
      const aOrder = aIndex === -1 ? centerOrder.length : aIndex;
      const bOrder = bIndex === -1 ? centerOrder.length : bIndex;
      return aOrder - bOrder;
    });
  }, [centers, centerDerivedData, amenitiesSelected, areasSelected, programsSelected, programs]);

  const toggle = (arr: string[], value: string, setArr: (v: string[]) => void) => {
    setArr(arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 section-y stack-8">
      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* FILTER SIDEBAR */}
        <aside className="card h-fit lg:sticky lg:top-18">
          {/* Mobile toggle button */}
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden w-full flex items-center justify-between p-4 body font-medium"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="badge badge-teal ml-1">{activeFilterCount}</span>
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

          {/* Filter content - hidden on mobile by default, always visible on desktop */}
          <div className={`stack-4 p-4 pt-0 lg:pt-4 ${filtersOpen ? "block" : "hidden lg:block"}`}>
            <div className="border-b border-neutral-200 pb-2">
              <button
                type="button"
                onClick={() => toggleDropdown("amenities")}
                className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
              >
                <span>
                  <span className="text-base text-gmcc-navy">Amenities</span>
                  {amenitiesSelected.length > 0 && (
                    <span className="ml-2 text-xs text-neutral-500">({amenitiesSelected.length})</span>
                  )}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${openDropdowns.has("amenities") ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdowns.has("amenities") && (
                <div className="space-y-1 pt-2 pb-2 max-h-56 overflow-auto pr-1">
                  {amenityOptions.map((a) => (
                    <label
                      key={a.slug}
                      className="flex items-center gap-2 text-sm cursor-pointer text-gmcc-grey-dark hover:text-neutral-900"
                    >
                      <input
                        type="checkbox"
                        checked={amenitiesSelected.includes(a.slug)}
                        onChange={() => toggle(amenitiesSelected, a.slug, setAmenitiesSelected)}
                        className="cursor-pointer"
                      />
                      <span>{a.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="border-b border-neutral-200 pb-2">
              <button
                type="button"
                onClick={() => toggleDropdown("programAreas")}
                className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-neutral-900"
              >
                <span>
                  <span className="text-base text-gmcc-navy">Program area</span>
                  {areasSelected.length > 0 && (
                    <span className="ml-2 text-xs text-neutral-500">({areasSelected.length})</span>
                  )}
                </span>
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
                <div className="space-y-1 pt-2 pb-2 max-h-56 overflow-auto pr-1">
                  {programAreaOptions.map((a) => (
                    <label
                      key={a.slug}
                      className="flex items-center gap-2 text-sm cursor-pointer text-gmcc-grey-dark hover:text-neutral-900"
                    >
                      <input
                        type="checkbox"
                        checked={areasSelected.includes(a.slug)}
                        onChange={() => toggle(areasSelected, a.slug, setAreasSelected)}
                        className="cursor-pointer"
                      />
                      <span>{a.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setAmenitiesSelected([]);
                setAreasSelected([]);
                setProgramsSelected([]);
                setOpenDropdowns(new Set(["amenities", "programAreas", "programs"]));
              }}
              className="btn btn-secondary w-full"
            >
              Clear filters
            </button>
          </div>
        </aside>

        {/* CENTER CARDS */}
        <section className="stack-4">
          <div className="flex items-center justify-between">
            <h2 className="h2">Results</h2>
            <div className="body">
              {filteredCenters.length === 1
                ? `${filteredCenters.length} center`
                : `${filteredCenters.length} centers`}
            </div>
          </div>

          {filteredCenters.length === 0 && (
            <p className="body">No centers match those filters.</p>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((c: any) => {
              const cf = c.centersFields ?? {};

              return (
                <div
                  key={c.slug}
                  className="group card card-hover relative overflow-hidden"
                >
                  <CenterCardMedia
                    slug={c.slug}
                    title={c.title}
                    featuredImageUrl={c?.featuredImage?.node?.sourceUrl}
                    featuredImageAlt={c?.featuredImage?.node?.altText}
                  />

                  <div className="pt-4 stack-2">
                    <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-1">{c.title}</h3>

                    {cf.address && (
                      <p className="flex items-start gap-2 small">
                        <LocationIcon />
                        <span className="whitespace-pre-line">{cf.address}</span>
                      </p>
                    )}

                    {(cf.contactInfo?.contactPhone || cf.contactInfo?.contactEmail) && (
                      <div className="small stack-2">
                        {cf.contactInfo?.contactPhone && (
                          <p className="flex items-center gap-2">
                            <PhoneIcon />
                            <PhoneLink
                              phone={cf.contactInfo.contactPhone}
                              className="relative z-10 hover:text-gmcc-teal hover:underline"
                            />
                          </p>
                        )}
                        {cf.contactInfo?.contactEmail && (
                          <p className="flex items-center gap-2">
                            <EmailIcon />
                            <a
                              href={`mailto:${cf.contactInfo.contactEmail}`}
                              className="relative z-10 hover:text-gmcc-teal hover:underline"
                            >
                              {cf.contactInfo.contactEmail}
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <a
                    href={`/centers/${c.slug}`}
                    aria-label={c.title ? `View ${c.title}` : "View center"}
                    className="card-stretched-link"
                  />
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
