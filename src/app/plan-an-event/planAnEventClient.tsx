"use client";

import { useState, useMemo } from "react";
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ card, href }: { card: SectionCard; href?: string }) {
  if (!card) return null;
  const imgSrc = card.sectionImage?.node?.sourceUrl;
  const imgAlt = card.sectionImage?.node?.altText ?? card.sectionHeader ?? "";

  return (
    <div className="card stack-4 flex flex-col overflow-hidden">
      {imgSrc && (
        <div className="card-bleed aspect-[4/3] bg-neutral-100">
          <img src={imgSrc} alt={imgAlt} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <h3 className="h2">{card.sectionHeader}</h3>
      {card.sectionDescription && (
        <p className="body whitespace-pre-line flex-grow">{card.sectionDescription}</p>
      )}
      {card.buttonLabel && (
        <a href={href ?? "#"} className="btn btn-primary self-start mt-auto">
          {card.buttonLabel}
        </a>
      )}
    </div>
  );
}

function RoomCard({ room }: { room: RoomData }) {
  const f = room.rentableRoomFields;
  const photo = getFirstPhoto(room);
  const centers = getCenterNames(f?.center?.nodes);
  const amenities = normalizeAmenities(f?.roomAmenities);
  const name = f?.name ?? room.title ?? "Room";

  return (
    <div className="card flex flex-col gap-4">
      {photo && (
        <div className="card-bleed aspect-[16/9] bg-neutral-100">
          <img src={photo} alt={name} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex flex-col gap-2 flex-grow">
        <h3 className="h2">{name}</h3>
        {centers.length > 0 && (
          <p className="small text-gmcc-grey-dark">
            <span className="font-semibold">Location:</span> {centers.join(", ")}
          </p>
        )}
        {f?.capacity && (
          <p className="small text-gmcc-grey-dark">
            <span className="font-semibold">Capacity:</span> {f.capacity}
          </p>
        )}
        {f?.description && (
          <p className="body whitespace-pre-line">{f.description}</p>
        )}
        {amenities.length > 0 && (
          <ul className="mt-1 space-y-1">
            {amenities.map((a, i) => (
              <li key={i} className="small flex gap-2 items-start">
                <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-gmcc-teal inline-block" />
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-100">
        <a href="#contact" className="btn btn-primary text-sm">
          View Availability
        </a>
        <a href="#contact" className="btn btn-secondary text-sm">
          Contact About this Space
        </a>
      </div>
    </div>
  );
}

function PartyPackageCard({ pkg }: { pkg: PartyPackageData }) {
  const f = pkg.partyPackageFields;
  const name = f?.name ?? pkg.title ?? "Package";
  const centers = getCenterNames(f?.center?.nodes);

  return (
    <div className="card stack-4 flex flex-col bg-gmcc-blue-light/20">
      <div>
        <h3 className="h2">{name}</h3>
        {centers.length > 0 && (
          <p className="small mt-1">
            <span className="font-semibold">Available at:</span> {centers.join(", ")}
          </p>
        )}
      </div>
      {f?.description && (
        <p className="body whitespace-pre-line flex-grow">{f.description}</p>
      )}
      {f?.price && (
        <p className="eyebrow text-gmcc-navy">{f.price}</p>
      )}
      <a href="#contact" className="btn btn-primary self-start mt-auto">
        Book your Party Now
      </a>
    </div>
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
  const numMatch = capacityStr.match(/\d+/g);
  if (!numMatch) return true;
  const cap = parseInt(numMatch[0], 10);
  if (range === "0-30") return cap <= 30;
  if (range === "31-60") return cap >= 31 && cap <= 60;
  if (range === "61-100") return cap >= 61 && cap <= 100;
  if (range === "100+") return cap > 100;
  return true;
}

function RoomFilterSection({ rooms }: { rooms: RoomData[] }) {
  const [centerFilter, setCenterFilter] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);

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
    return rooms.filter((r) => {
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
    });
  }, [rooms, centerFilter, capacityFilter, amenityFilter]);

  const toggleAmenity = (amenity: string) => {
    setAmenityFilter((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const hasFilters = centerFilter || capacityFilter || amenityFilter.length > 0;

  return (
    <div>
      {/* Filter Bar */}
      <div className="rounded-2xl bg-gmcc-navy p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Center filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Center
            </label>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gmcc-teal"
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
            <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Capacity
            </label>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gmcc-teal"
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
              <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
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
                        : "bg-white/10 text-white hover:bg-white/20"
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
            className="mt-4 text-xs text-white/60 underline hover:text-white/90"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((room, i) => (
            <RoomCard key={room.slug ?? i} room={room} />
          ))}
        </div>
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

        return (
          <div key={key} className="card stack-4 flex flex-col">
            <h3 className="h2">{label}</h3>
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
            <a href="/centers" className="btn btn-secondary self-start mt-auto">
              View Center Details
            </a>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function PlanAnEventClient({ heroProps, fields, rooms, partyPackages }: Props) {

  const getPartyType = (p: PartyPackageData): string => {
    const raw = p.partyPackageFields?.partyType;
    if (!raw) return "";
    if (typeof raw === "string") return raw.toLowerCase();
    if (Array.isArray(raw)) return (raw[0] ?? "").toString().toLowerCase();
    return String(raw).toLowerCase();
  };

  const birthdayPackages = partyPackages.filter((p) => getPartyType(p) === "birthday");
  const sportsPackages = partyPackages.filter((p) => getPartyType(p) === "sport");

  const faqItems = useMemo(() => {
    const faqs = fields?.faqs;
    const raw = [faqs?.faq1, faqs?.faq2, faqs?.faq3];
    return raw
      .filter((f) => f?.question)
      .map((f, i) => ({
        id: `faq-${i}`,
        title: f?.question ?? "",
        content: <p className="body whitespace-pre-line">{f?.answer ?? ""}</p>,
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
      <section id="rent-a-space" className="bg-gmcc-grey-light/40 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 max-w-3xl">
            <h2 className="h1 mb-3">
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
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-3">
            <span className="eyebrow">Party Packages</span>
          </div>
          <div className="mb-8 max-w-3xl">
            <h2 className="h1 mb-3">Birthday Party Packages</h2>
            {fields?.birthdayPackagesBody && (
              <p className="body whitespace-pre-line">{fields.birthdayPackagesBody}</p>
            )}
          </div>
          {fields?.allPackagesInclude && (
            <div className="mb-8 rounded-xl bg-gmcc-blue-light/30 px-6 py-4">
              <p className="body">
                <span className="font-semibold text-gmcc-navy">All packages include: </span>
                {fields.allPackagesInclude}
              </p>
            </div>
          )}
          {birthdayPackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {birthdayPackages.map((pkg, i) => (
                <PartyPackageCard key={pkg.slug ?? i} pkg={pkg} />
              ))}
            </div>
          ) : (
            <p className="body text-gmcc-grey">Birthday packages coming soon.</p>
          )}
          <div className="mt-10 rounded-2xl border-2 border-dashed border-gmcc-navy/30 p-8 text-center">
            <p className="h2 mb-4">Contact Us for Custom Packages</p>
            <a href="#contact" className="btn btn-primary">
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* ── SPORTS EVENTS ── */}
      <section id="sports-events" className="bg-gmcc-navy py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-3">
            <span className="eyebrow text-white/60">Sports Events</span>
          </div>
          <div className="mb-8 max-w-3xl">
            <h2 className="h1 mb-3 text-white">Sports Events</h2>
            {fields?.sportsPackagesBody && (
              <p className="body whitespace-pre-line text-white/80">{fields.sportsPackagesBody}</p>
            )}
          </div>
          {sportsPackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportsPackages.map((pkg, i) => (
                <div key={pkg.slug ?? i} className="card stack-4 flex flex-col">
                  <PartyPackageCard pkg={pkg} />
                </div>
              ))}
            </div>
          ) : (
            <p className="body text-white/70">Sports event packages coming soon.</p>
          )}
        </div>
      </section>

      {/* ── LOCATION OFFERINGS ── */}
      {(fields?.locationOfferingsHeader || fields?.offeringsByCenter) && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 max-w-3xl">
              <h2 className="h1 mb-3">
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
      <section id="contact" className="bg-gmcc-navy py-12 sm:py-16">
        {/* ── FAQs ── */}
      {faqItems.length > 0 && (
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="h1 mb-8 text-center text-white">FAQs</h2>
            <Accordion variant="onDark" items={faqItems.map((item) => ({
              id: item.id,
              title: item.title,
              content: <p className="body text-white/80">{item.content}</p>,
            }))} allowMultiple />
          </div>
      )}
      </section>

      <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="h1 mb-4 text-gmcc-navy">
            {fields?.contactHeader ?? "Start Planning Your Event"}
          </h2>
          {fields?.contactSubheader && (
            <p className="body mb-8 text-neutral-700 whitespace-pre-line">{fields.contactSubheader}</p>
          )}
          <a href="/contact" className="btn btn-hero px-8 py-3 text-base">
            Contact Us About Your Event
          </a>
        </div>
    </section>
</div>
  );
}
