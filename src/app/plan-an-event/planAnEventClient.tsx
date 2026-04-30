"use client";

import { useState, useMemo, useEffect } from "react";
import Accordion from "@/components/accordion";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import type { RoomData, PartyPackageData } from "./page";

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionCard = {
  sectionHeader?: string | null;
  sectionDescription?: string | null;
  sectionImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
  buttonLabel?: string | null;
} | null;

type PlanAnEventFields = {
  section1Card?: SectionCard;
  section2Card?: SectionCard;
  section3Card?: SectionCard;
  roomRentalResultsHeader?: string | null;
  roomRentalResultsBody?: string | null;
  birthdayPackagesBody?: string | null;
  allPackagesInclude?: string | null;
  sportsPackagesBody?: string | null;
  locationOfferingsHeader?: string | null;
  locationOfferingsBody?: string | null;
  offeringsByCenter?: {
    communityCenterOfferings?: string | null;
    tennisCenterOfferings?: string | null;
    curlingCenterOfferings?: string | null;
    colemanFamilyCenterOfferings?: string | null;
    northFamilyCenterOfferings?: string | null;
  } | null;
  faqs?: {
    faq1?: { question?: string | null; answer?: string | null } | null;
    faq2?: { question?: string | null; answer?: string | null } | null;
    faq3?: { question?: string | null; answer?: string | null } | null;
  } | null;
  contactHeader?: string | null;
  contactSubheader?: string | null;
} | null;

type HeroProps = {
  title: string;
  subheader?: string | null;
  imageUrl?: string | null;
  primaryCta?: { label: string; url: string; variant?: "primary" | "secondary" } | null;
  secondaryCta?: { label: string; url: string; variant?: "primary" | "secondary" } | null;
  ctas?: { label: string; url: string; variant?: "primary" | "secondary" }[];
};

type Props = {
  heroProps: HeroProps;
  fields: PlanAnEventFields;
  rooms: RoomData[];
  partyPackages: PartyPackageData[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeAmenities(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON — treat as single value
    }
    return raw ? [raw] : [];
  }
  return [];
}

function getCenterNames(nodes?: { title?: string | null; slug?: string | null }[] | null): string[] {
  if (!nodes) return [];
  return nodes.map((n) => n.title ?? "").filter(Boolean) as string[];
}

function getFirstPhoto(room: RoomData): string | null {
  const g = room.rentableRoomFields?.gallery;
  return (
    g?.photo1?.node?.sourceUrl ??
    g?.photo2?.node?.sourceUrl ??
    g?.photo3?.node?.sourceUrl ??
    g?.photo4?.node?.sourceUrl ??
    null
  );
}

function getRoomGalleryPhotos(room: RoomData): { src: string; alt: string }[] {
  const gallery = room.rentableRoomFields?.gallery;
  const fallbackName = room.rentableRoomFields?.name ?? room.title ?? "Room";
  const rawPhotos = [
    gallery?.photo1,
    gallery?.photo2,
    gallery?.photo3,
    gallery?.photo4,
  ];

  return rawPhotos
    .map((photo, index) => {
      const src = photo?.node?.sourceUrl;
      if (!src) return null;
      return {
        src,
        alt: photo?.node?.altText ?? `${fallbackName} photo ${index + 1}`,
      };
    })
    .filter((photo): photo is { src: string; alt: string } => Boolean(photo));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ card, href }: { card: SectionCard; href?: string }) {
  if (!card) return null;
  const imgSrc = card.sectionImage?.node?.sourceUrl;
  const imgAlt = card.sectionImage?.node?.altText ?? card.sectionHeader ?? "";

  return (
    <div className="card card-hover stack-4 flex flex-col overflow-hidden h-[410px] w-[340px]">
      {imgSrc && (
        <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
          <img src={imgSrc} alt={imgAlt} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <h3 className="h3 mt-2 mb-2 font-semibold">{card.sectionHeader}</h3>
      {card.sectionDescription && (
        <p className="body text-sm flex-grow">{card.sectionDescription}</p>
      )}
      <div className="flex flex-wrap justify-center items-center">
      {card.buttonLabel && (
        <a href={href ?? "#"} className="btn btn-primary">
          {card.buttonLabel}
        </a>
      )}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: RoomData }) {
  const f = room.rentableRoomFields;
  const galleryPhotos = getRoomGalleryPhotos(room);
  const fallbackPhoto = getFirstPhoto(room);
  const centers = getCenterNames(f?.center?.nodes);
  const amenities = normalizeAmenities(f?.roomAmenities);
  const name = f?.name ?? room.title ?? "Room";
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const hasCarousel = galleryPhotos.length > 0;
  const normalizedActivePhotoIndex =
    galleryPhotos.length > 0 ? activePhotoIndex % galleryPhotos.length : 0;
  const activePhoto = hasCarousel
    ? galleryPhotos[normalizedActivePhotoIndex]
    : fallbackPhoto
      ? { src: fallbackPhoto, alt: name }
      : null;

  const showNavigation = galleryPhotos.length > 1;

  const goToPreviousPhoto = () => {
    setActivePhotoIndex((prev) =>
      prev === 0 ? galleryPhotos.length - 1 : prev - 1
    );
  };

  const goToNextPhoto = () => {
    setActivePhotoIndex((prev) =>
      prev === galleryPhotos.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="card flex flex-col gap-4 overflow-hidden">
      {activePhoto && (
        <div className="card-bleed relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-neutral-100">
          <img
            src={activePhoto.src}
            alt={activePhoto.alt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {showNavigation && (
            <>
              <button
                type="button"
                onClick={goToPreviousPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gmcc-navy shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gmcc-teal"
                aria-label={`View previous photo of ${name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goToNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gmcc-navy shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gmcc-teal"
                aria-label={`View next photo of ${name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2 py-1">
                {galleryPhotos.map((photo, index) => (
                  <button
                    key={`${photo.src}-${index}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(index)}
                    className={`h-2 w-2 rounded-full transition ${
                      index === normalizedActivePhotoIndex ? "bg-white" : "bg-white/60 hover:bg-white/80"
                    }`}
                    aria-label={`View photo ${index + 1} of ${galleryPhotos.length} for ${name}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 flex-grow">
        <h3 className="h3 text-2xl font-semibold mt-2">{name}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
          {centers.length > 0 && (
            <p className="small text-gmcc-grey-dark">
              <span className="font-semibold">Location:</span> {centers.join(", ")}
            </p>
          )}
          {f?.capacity && (
            <p className="small text-gmcc-grey-dark mt-2">
              <span className="font-semibold">Capacity:</span> {f.capacity}
            </p>
          )}
          </div>
          <div>
          {f?.price && (
            <p className="small text-gmcc-grey-dark">
              <span className="font-semibold">Price:</span> {f.price}
            </p>
          )}
          {amenities.length > 0 && (
            <p className="small text-gmcc-grey-dark mt-2">
            <span className="font-semibold">Amenities:</span> {amenities.join(", ")}
          </p>
          )}
          </div>
        </div>
        {f?.description && (
          <p className="body whitespace-pre-line">{f.description}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center items-center">
        <a href="#contact" className="btn btn-primary text-sm">
          Contact us about this space
        </a>
      </div>
    </div>
  );
}

const PARTY_PACKAGE_CENTERS = [
  { slug: "community-center", label: "Community Center", aliases: ["community center", "community"] },
  { slug: "tennis-center", label: "Tennis Center", aliases: ["tennis center", "tennis"] },
  { slug: "north-family-center", label: "North Family Center", aliases: ["north family center", "north"] },
  { slug: "coleman-family-center", label: "Coleman Family Center", aliases: ["coleman family center", "coleman"] },
] as const;

function getPartyTypeValues(pkg: PartyPackageData): string[] {
  const raw = pkg.partyPackageFields?.partyType;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  return [String(raw).trim().toLowerCase()].filter(Boolean);
}

function hasPartyCategory(pkg: PartyPackageData, category: "birthday" | "sport"): boolean {
  const values = getPartyTypeValues(pkg);
  if (values.length === 0) return false;
  if (category === "birthday") return values.some((v) => v.includes("birthday"));
  return values.some((v) => v.includes("sport"));
}

function getPartyPillLabel(pkg: PartyPackageData): string {
  const name = (pkg.partyPackageFields?.name ?? pkg.title ?? "").trim();
  if (name) return name.replace(/\s*party$/i, "").trim() || name;
  const firstType = getPartyTypeValues(pkg)[0] ?? "";
  return firstType ? firstType.charAt(0).toUpperCase() + firstType.slice(1) : "Package";
}

function packageMatchesCenter(
  pkg: PartyPackageData,
  centerConfig: (typeof PARTY_PACKAGE_CENTERS)[number]
): boolean {
  const nodes = pkg.partyPackageFields?.center?.nodes ?? [];
  return nodes.some((node) => {
    const slug = (node.slug ?? "").toLowerCase();
    const title = (node.title ?? "").toLowerCase();
    return slug === centerConfig.slug || centerConfig.aliases.some((alias) => title.includes(alias));
  });
}

function CenterPartyPackageCard({
  centerLabel,
  packages,
}: {
  centerLabel: string;
  packages: PartyPackageData[];
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setSelectedIdx(0);
  }, [packages]);

  if (packages.length === 0) {
    return (
      <article className="card flex flex-col gap-4 bg-white">
        <h3 className="h2 text-2xl">{centerLabel}</h3>
        <p className="body text-gmcc-grey-dark">No party package details available for this center yet.</p>
        <a href="#contact" className="btn btn-primary self-start mt-auto">
          Contact Us
        </a>
      </article>
    );
  }

  const safeIdx = Math.min(selectedIdx, packages.length - 1);
  const selected = packages[safeIdx];
  const selectedFields = selected.partyPackageFields;
  const selectedName = selectedFields?.name ?? selected.title ?? "Package";
  const selectedImage = selectedFields?.photo?.node ?? selected.featuredImage?.node;

  return (
    <article className="card flex h-full flex-col overflow-hidden bg-white">
      {selectedImage?.sourceUrl && (
        <div className="card-bleed relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-neutral-100">
          <img
            src={selectedImage.sourceUrl}
            alt={selectedImage.altText ?? selectedName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {/* <div className="absolute inset-x-0 top-0 flex items-center justify-center bg-gmcc-teal py-2">
            <span className="text-lg font-semibold uppercase tracking-wide text-white">
              {centerLabel}
            </span>
          </div> */}
        </div>
      )}
      {/* {!selectedImage?.sourceUrl && (
        // <div className="card-bleed flex items-center justify-center rounded-t-2xl bg-gmcc-teal py-2">
        //   <span className="text-sm font-semibold uppercase tracking-wide text-white">
        //     {centerLabel}
        //   </span>
        // </div>
      )} */}

      <div className="flex flex-1 flex-col gap-3 mt-4">
        <h3 className="h3 text-2xl font-semibold">{centerLabel}</h3>
        {packages.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {packages.map((pkg, index) => (
              <button
                key={pkg.slug ?? `${centerLabel}-${index}`}
                type="button"
                onClick={() => setSelectedIdx(index)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  safeIdx === index
                    ? "bg-gmcc-navy text-white"
                    : "bg-neutral-100 text-gmcc-navy hover:bg-neutral-200"
                }`}
              >
                {getPartyPillLabel(pkg)}
              </button>
            ))}
          </div>
        )}

        <h4 className="h3 text-xl">{selectedName}</h4>
        {selectedFields?.price && <p className="eyebrow text-gmcc-navy">Price: ${selectedFields.price}</p>}
        {selectedFields?.description && (
          <p className="body whitespace-pre-line flex-grow">{selectedFields.description}</p>
        )}
        <a href="#contact" className="btn btn-primary self-center mt-auto">
          Book this party
        </a>
      </div>
    </article>
  );
}

function PartyPackagesByCenterGrid({ packages }: { packages: PartyPackageData[] }) {
  const centerCards = useMemo(
    () =>
      PARTY_PACKAGE_CENTERS.map((center) => {
        const centerPackages = packages
          .filter((pkg) => packageMatchesCenter(pkg, center))
          .sort((a, b) => {
            const aLabel = getPartyPillLabel(a);
            const bLabel = getPartyPillLabel(b);
            return aLabel.localeCompare(bLabel, undefined, { sensitivity: "base" });
          });
        return { ...center, packages: centerPackages };
      }),
    [packages]
  );

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {centerCards.map((center) => (
        <CenterPartyPackageCard
          key={center.slug}
          centerLabel={center.label}
          packages={center.packages}
        />
      ))}
    </div>
  );
}

function SportsPartyPackageCard({ pkg }: { pkg: PartyPackageData }) {
  const f = pkg.partyPackageFields;
  const name = f?.name ?? pkg.title ?? "Sports Party";
  const image = f?.photo?.node ?? pkg.featuredImage?.node;

  return (
    <article className="card flex h-full flex-col overflow-hidden bg-white">
      {image?.sourceUrl && (
        <div className="card-bleed relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-neutral-100">
          <img
            src={image.sourceUrl}
            alt={image.altText ?? name}
            className="h-full w-full object-cover"
            loading="lazy"
          />

        {name.toLowerCase().includes("curling") && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center bg-gmcc-teal/85 py-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-white">
            Available October-March only
          </span>
        </div>
      )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3">
        <h3 className="h3 text-xl font-semibold mt-4">{name}</h3>
        {f?.price && <p className="eyebrow text-gmcc-navy">Price: ${f.price}</p>}
        {f?.description && (
          <p className="body whitespace-pre-line flex-grow">{f.description}</p>
        )}
        <a href="#contact" className="btn btn-primary self-center mt-auto">
          Book this event
        </a>
      </div>
    </article>
  );
}

// ─── Room Filter ──────────────────────────────────────────────────────────────

const CAPACITY_OPTIONS = [
  { label: "Any capacity", value: "" },
  { label: "0–30", value: "0-30" },
  { label: "31–60", value: "31-60" },
  { label: "61–100", value: "61-100" },
  { label: "100+", value: "100+" },
];

function capacityInRange(capacityStr: string | null | undefined, range: string): boolean {
  if (!range || !capacityStr) return true;
  const matches = capacityStr.match(/\d+/g);
  if (!matches || matches.length === 0) return true;

  const nums = matches.map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return true;

  const isExplicitRange = capacityStr.includes("-") && nums.length >= 2;
  const baseMin = nums[0];
  const baseMax = isExplicitRange ? nums[1] : nums[0];
  const minCapacity = Math.min(baseMin, baseMax);
  const maxCapacity = Math.max(baseMin, baseMax);

  const overlaps = (filterMin: number, filterMax: number): boolean => {
    // For values like "30-63", treat the lower edge as exclusive so the room
    // does not get bucketed into the smaller 0-30 range on a boundary-only match.
    const effectiveMin = isExplicitRange ? minCapacity + 1 : minCapacity;
    return effectiveMin <= filterMax && maxCapacity >= filterMin;
  };

  if (range === "0-30") return overlaps(0, 30);
  if (range === "31-60") return overlaps(31, 60);
  if (range === "61-100") return overlaps(61, 100);
  if (range === "100+") return maxCapacity > 100;
  return true;
}

function RoomFilterSection({ rooms }: { rooms: RoomData[] }) {
  const [centerFilter, setCenterFilter] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [resultColumns, setResultColumns] = useState(1);

  const allCenters = useMemo(() => {
    const names = new Set<string>();
    rooms.forEach((r) => {
      getCenterNames(r.rentableRoomFields?.center?.nodes).forEach((n) => names.add(n));
    });
    return Array.from(names).sort();
  }, [rooms]);

  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => {
      normalizeAmenities(r.rentableRoomFields?.roomAmenities).forEach((a) => set.add(a));
    });
    return Array.from(set).sort();
  }, [rooms]);

  const filtered = useMemo(() => {
    return rooms
      .filter((r) => {
        const f = r.rentableRoomFields;
        if (centerFilter) {
          const centers = getCenterNames(f?.center?.nodes);
          if (!centers.includes(centerFilter)) return false;
        }
        if (capacityFilter && !capacityInRange(f?.capacity, capacityFilter)) return false;
        if (amenityFilter.length > 0) {
          const roomAmenities = normalizeAmenities(f?.roomAmenities);
          if (!amenityFilter.every((a) => roomAmenities.includes(a))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const nameA = (a.rentableRoomFields?.name ?? a.title ?? "").trim();
        const nameB = (b.rentableRoomFields?.name ?? b.title ?? "").trim();
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      });
  }, [rooms, centerFilter, capacityFilter, amenityFilter]);

  const toggleAmenity = (amenity: string) => {
    setAmenityFilter((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const hasFilters = centerFilter || capacityFilter || amenityFilter.length > 0;
  const maxVisibleRooms = Math.max(1, resultColumns * 2);
  const hasHiddenRooms = filtered.length > maxVisibleRooms;
  const visibleRooms = showAllRooms ? filtered : filtered.slice(0, maxVisibleRooms);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) {
        setResultColumns(3);
        return;
      }
      if (window.innerWidth >= 768) {
        setResultColumns(2);
        return;
      }
      setResultColumns(1);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    setShowAllRooms(false);
  }, [centerFilter, capacityFilter, amenityFilter]);

  return (
    <div>
      {/* Filter Bar */}
      <div className="rounded-2xl bg-gmcc-navy p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Center filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-white">
              Center
            </label>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="rounded-lg border border-gmcc-teal bg-gmcc-teal/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gmcc-teal"
            >
              <option value="">All Centers</option>
              {allCenters.map((c) => (
                <option key={c} value={c} className="text-gmcc-navy bg-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-white">
              Capacity
            </label>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="rounded-lg border border-gmcc-teal bg-gmcc-teal/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gmcc-teal"
            >
              {CAPACITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="text-gmcc-navy bg-white">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amenities filter */}
          {allAmenities.length > 0 && (
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-white">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {allAmenities.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gmcc-teal ${
                      amenityFilter.includes(a)
                        ? "bg-gmcc-teal text-white"
                        : "bg-gmcc-teal/50 text-white hover:bg-gmcc-teal"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setCenterFilter("");
              setCapacityFilter("");
              setAmenityFilter([]);
            }}
            className="mt-4 text-xs text-white/70 underline hover:text-white"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="body text-center py-12 text-gmcc-grey">
          No spaces match your filters. Try adjusting your selections.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRooms.map((room, i) => (
              <RoomCard key={room.slug ?? i} room={room} />
            ))}
          </div>
          {hasHiddenRooms && (
            <div className="pt-4 flex justify-center items-center">
              <button
                type="button"
                onClick={() => setShowAllRooms((prev) => !prev)}
                className="text-gmcc-navy hover:underline text-sm font-semibold"
              >
                {showAllRooms ? "Show less" : `Show more (${filtered.length - maxVisibleRooms} more)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Center Offerings ─────────────────────────────────────────────────────────

type CenterOfferingsData = {
  communityCenterOfferings?: string | null;
  tennisCenterOfferings?: string | null;
  curlingCenterOfferings?: string | null;
  colemanFamilyCenterOfferings?: string | null;
  northFamilyCenterOfferings?: string | null;
} | null | undefined;

const CENTER_LABELS: { key: keyof NonNullable<CenterOfferingsData>; label: string }[] = [
  { key: "communityCenterOfferings", label: "Community Center" },
  { key: "tennisCenterOfferings", label: "Tennis Center" },
  { key: "curlingCenterOfferings", label: "Curling Center" },
  { key: "colemanFamilyCenterOfferings", label: "Coleman Family Center" },
  { key: "northFamilyCenterOfferings", label: "North Family Center" },
];

function CenterOfferingsSection({ data }: { data: CenterOfferingsData }) {
  const centers = CENTER_LABELS.filter((c) => data?.[c.key]);
  if (centers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {centers.map(({ key, label }) => {
        const text = data?.[key] ?? "";
        const lines = typeof text === "string"
          ? text.split(/\n/).map((l) => l.trim()).filter(Boolean)
          : [];

        const centerSlug = label.toLowerCase().replace(/ /g, "-");

        return (
          <div key={key} className="card stack-4 flex flex-col">
            <h3 className="h3">{label}</h3>
            {lines.length > 0 ? (
              <ul className="space-y-1 flex-grow">
                {lines.map((line, i) => (
                  <li key={i} className="small flex gap-2 items-start">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gmcc-teal inline-block" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="body whitespace-pre-line flex-grow">{text}</p>
            )}
            <a href={`/centers/${centerSlug}`} className="btn btn-secondary self-center mt-auto">
              View center details
            </a>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function PlanAnEventClient({ heroProps, fields, rooms, partyPackages }: Props) {

  const birthdayPackages = partyPackages.filter((p) => hasPartyCategory(p, "birthday"));
  const sportsPackages = partyPackages.filter((p) => hasPartyCategory(p, "sport"));

  const faqItems = useMemo(() => {
    const faqs = fields?.faqs;
    const raw = [faqs?.faq1, faqs?.faq2, faqs?.faq3];
    return raw
      .filter((f) => f?.question)
      .map((f, i) => ({
        id: `faq-${i}`,
        title: f?.question ?? "",
        content: f?.answer ?? "",
      }));
  }, [fields?.faqs]);

  return (
    <div className="overflow-x-clip">

      {/* ── HERO ── */}
      <PhotoWaveHeader
        title={heroProps.title}
        subheader={heroProps.subheader}
        imageUrl={heroProps.imageUrl}
        ctas={heroProps.ctas}
      />

      {/* ── 3-CARD OVERVIEW ── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SectionCard card={fields?.section1Card ?? null} href="#rent-a-space" />
          <SectionCard card={fields?.section2Card ?? null} href="#birthday-packages" />
          <SectionCard card={fields?.section3Card ?? null} href="#sports-events" />
        </div>
      </section>

      {/* ── FIND YOUR PERFECT RENTAL SPACE ── */}
      <section id="rent-a-space" className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 max-w-6xl">
            <h2 className="h2 mb-3">
              {fields?.roomRentalResultsHeader ?? "Find Your Perfect Rental Space"}
            </h2>
            {fields?.roomRentalResultsBody && (
              <p className="body whitespace-pre-line">{fields.roomRentalResultsBody}</p>
            )}
          </div>
          {rooms.length > 0 ? (
            <RoomFilterSection rooms={rooms} />
          ) : (
            <p className="body text-gmcc-grey">Rental spaces coming soon.</p>
          )}
        </div>
      </section>

      {/* ── BIRTHDAY PARTY PACKAGES ── */}
      <section id="birthday-packages" className="py-12 sm:py-16">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip">
          {/* Top wave (above navy body; not covered by background) */}
          <div className="relative z-[1] pointer-events-none w-full overflow-hidden leading-none">
            <svg
              viewBox="0 0 1440 120"
              className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="
                  M-20,110
                  C750,-90  800,120  1200,80
                  S1420,0 1460,0
                  L1460,0 L-20,0 Z
                "
                transform="translate(0 120) scale(1 -1)"
                fill="var(--gmcc-navy)"
              />
            </svg>
          </div>
        </div>
        <div className="relative z-0 -mt-px bg-gmcc-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-4 max-w-6xl">
            <h2 className="h2 text-white">Birthday Party Packages</h2>
            {fields?.birthdayPackagesBody && (
              <p className="body whitespace-pre-line text-neutral-200 mt-4">{fields.birthdayPackagesBody}</p>
            )}
          </div>
          {fields?.allPackagesInclude && (
            <div className="mb-8 rounded-xl bg-white px-6 py-4">
              <p className="body">
                <span className="font-semibold text-gmcc-navy">All packages include: </span>
                {fields.allPackagesInclude}
              </p>
            </div>
          )}
          {birthdayPackages.length > 0 ? (
            <PartyPackagesByCenterGrid packages={birthdayPackages} />
          ) : (
            <p className="body text-gmcc-grey">Birthday packages coming soon.</p>
          )}
        </div>
        </div>

        {/* Bottom wave (below navy body) */}
        <div className="relative z-[1] pointer-events-none -mt-px w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 390 120"
            className="block h-14 w-full text-gmcc-navy md:hidden"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="
            M0,98
            C78,62 135,54 195,74
            C255,96 322,88 390,60
            L390,0 L0,0 Z
          "
              fill="currentColor"
            />
          </svg>

          <svg
            viewBox="0 0 1440 120"
            className="hidden h-16 w-full text-gmcc-navy md:block"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="
            M0,110
            C300,-50  500,120  800,100
            S1000,0 1440,0
            L1440,0 L0,0 Z
          "
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ── SPORTS EVENTS ── */}
      <section id="sports-events" className="pb-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 max-w-6xl">
            <h2 className="h2 mb-3 text-gmcc-navy">Sports Events</h2>
            {fields?.sportsPackagesBody && (
              <p className="body whitespace-pre-line text-neutral-700">{fields.sportsPackagesBody}</p>
            )}
          </div>
          {sportsPackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportsPackages.map((pkg, i) => (
                <SportsPartyPackageCard key={pkg.slug ?? i} pkg={pkg} />
              ))}
            </div>
          ) : (
            <p className="body text-gmcc-navy">Sports event packages coming soon.</p>
          )}
        </div>
      </section>

      {/* ── LOCATION OFFERINGS ── */}
      {(fields?.locationOfferingsHeader || fields?.offeringsByCenter) && (
        <section className="pb-10 pt-10 sm:pb-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 max-w-6xl">
              <h2 className="h2 mb-3">
                {fields?.locationOfferingsHeader ?? "See What Each Location has to Offer"}
              </h2>
              {fields?.locationOfferingsBody && (
                <p className="body whitespace-pre-line">{fields.locationOfferingsBody}</p>
              )}
            </div>
            <CenterOfferingsSection data={fields?.offeringsByCenter} />
          </div>
        </section>
      )}

      {/* ── START PLANNING / CONTACT ── */}
      <section id="contact" className="">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip">
          {/* Top wave (above navy body; not covered by background) */}
          <div className="relative z-[1] pointer-events-none w-full overflow-hidden leading-none">
            <svg
              viewBox="0 0 1440 120"
              className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="
                  M-20,110
                  C750,-90  800,120  1200,80
                  S1420,0 1460,0
                  L1460,0 L-20,0 Z
                "
                transform="translate(0 120) scale(1 -1)"
                fill="var(--gmcc-navy)"
              />
            </svg>
          </div>
        </div>
        <div className="relative z-0 -mt-px bg-gmcc-navy text-white ">
        <div className="mx-auto max-w-6xl px-6 py-12">
        {/* ── FAQs ── */}
      {faqItems.length > 0 && (
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="h2 mb-8 text-center text-white">FAQs</h2>
            <Accordion variant="onDark" items={faqItems.map((item) => ({
              id: item.id,
              title: item.title,
              content: <p className="body text-white/80">{item.content}</p>,
            }))} allowMultiple />
          </div>
      )}
      </div>
      </div>
      </section>

      <section className="pt-16 pb-10 sm:pt-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="h2 mb-4 text-gmcc-navy">
            {fields?.contactHeader ?? "Start Planning Your Event"}
          </h2>
          {fields?.contactSubheader && (
            <p className="body mb-8 text-neutral-700 whitespace-pre-line">{fields.contactSubheader}</p>
          )}
          <a href="/contact" className="btn btn-primary">
            Contact us about your event
          </a>
        </div>
    </section>
</div>
  );
}
