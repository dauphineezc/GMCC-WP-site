// src/app/(home)/sections/CentersSection.tsx
"use client";

import { useMemo, useState } from "react";
import PhoneLink from "@/components/phoneLink";

type Center = {
  id: string;
  slug?: string | null;
  title?: string | null;
  uri?: string | null;
  featuredImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
  centersFields?: {
    address?: string | null;
    contactInfo?: { contactPhone?: string | null; contactEmail?: string | null } | null;
  } | null;
};

type Props = {
  heading: string;
  centers: Center[];
  corporateWellnessCentersCaption?: string | null;
  corporateWellnessCentersImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
};

function getSlug(c: { slug?: string | null; uri?: string | null }) {
  if (c.slug) return c.slug;
  const uri = c.uri ?? "";
  const parts = uri.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function CenterAccordionItem({
  center,
  corporateWellnessCentersCaption,
  isActive,
  onSelect,
}: {
  center: Center;
  corporateWellnessCentersCaption?: string | null;
  isActive: boolean;
  onSelect: () => void;
}) {
  const title = center.title ?? "Center";
  const slug = getSlug(center);
  const isCorporateWellness = slug === "corporate-wellness-centers";
  const address = center.centersFields?.address ?? null;
  const phone = center.centersFields?.contactInfo?.contactPhone ?? null;
  const href = isCorporateWellness ? "/corporate-wellness-centers" : center.uri ?? "#";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={[
          "w-full text-left rounded-2xl",
          "px-5 py-4",
          "transition-colors duration-150",
          isActive ? "bg-gmcc-teal/90" : "bg-transparent hover:bg-white/10",
          "focus:outline-none focus:ring-2 focus:ring-gmcc-teal focus:ring-offset-2 focus:ring-offset-transparent",
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          <span
            className={[
              "mt-1 h-5 w-5 rounded-full ring-4",
              isActive ? "bg-gmcc-green ring-gmcc-navy" : "bg-gmcc-navy ring-gmcc-navy",
            ].join(" ")}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="font-heading text-xl font-semibold text-white">{title}</div>

            {isActive ? (
              <div className="mt-2 text-sm text-white/90">
                {isCorporateWellness ? (
                  <p className="text-white/90">
                    {corporateWellnessCentersCaption}
                  </p>
                ) : null}

                {!isCorporateWellness && address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-pre-line hover:text-white hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {address}
                  </a>
                ) : null}

                {!isCorporateWellness && phone ? (
                  <div className="mt-2">
                    <PhoneLink
                      phone={phone}
                      className="underline decoration-white/50 underline-offset-4 hover:decoration-white text-white"
                    />
                  </div>
                ) : null}

                <div className="mt-3">
                  <a
                    href={href}
                    className="text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    See more information →
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}

const ORDERED_SLUGS = [
  "community-center",
  "tennis-center",
  "coleman-family-center",
  "north-family-center",
  "curling-center",
  "corporate-wellness-centers",
] as const;

export default function CentersSection({ heading, centers, corporateWellnessCentersCaption, corporateWellnessCentersImage }: Props) {
  const items = useMemo(() => {
    const bySlug = new Map<string, Center>();
    for (const c of centers ?? []) {
      const slug = getSlug(c);
      if (slug) bySlug.set(slug, c); // last wins, but typically unique
    }

    // Include only known center slugs from WP data.
    const orderedCenters = ORDERED_SLUGS
      .filter((slug) => slug !== "corporate-wellness-centers")
      .map((slug) => bySlug.get(slug))
      .filter(Boolean) as Center[];

    // Corporate wellness is a page, not a Center CPT, so append it manually.
    orderedCenters.push({
      id: "corporate-wellness-centers",
      slug: "corporate-wellness-centers",
      title: "Corporate Wellness Centers",
      uri: "/corporate-wellness-centers",
      featuredImage: corporateWellnessCentersImage,
      centersFields: null,
    });

    return orderedCenters;
  }, [centers, corporateWellnessCentersImage]);

  if (!items.length) return null;

  const [selectedId, setSelectedId] = useState(items[0].id);
  const selected = items.find((c) => c.id === selectedId) ?? items[0];
  const selectedIsCorporateWellness = getSlug(selected) === "corporate-wellness-centers";
  const bgUrl = selectedIsCorporateWellness
    ? (corporateWellnessCentersImage?.node?.sourceUrl ?? selected.featuredImage?.node?.sourceUrl ?? null)
    : (selected.featuredImage?.node?.sourceUrl ?? null);

  return (
    // no top padding; full-width section handled inside
    <section className="relative z-10 -mt-14 pt-0 md:-mt-16 mb-16">
      
      {/* Mobile: desktop-like accordion + image beneath */}
      <div className="md:hidden">
        <div className="relative w-full">
          {/* Top area: list on navy overlay */}
          <div className="relative -mb-[3px] bg-gmcc-navy">
            {/* faint texture/overlay */}
            <div className="absolute inset-0 bg-white/5" aria-hidden="true" />

            <div className="relative mx-auto max-w-6xl px-4 py-8">
              <h2 className="h2 mt-8 mb-0 text-3xl font-semibold tracking-wide text-white">{heading}</h2>

              <ul className="mt-5 space-y-3">
                {items.map((c) => (
                  <CenterAccordionItem
                    key={c.id}
                    center={c}
                    corporateWellnessCentersCaption={corporateWellnessCentersCaption}
                    isActive={c.id === selectedId}
                    onSelect={() => setSelectedId(c.id)}
                  />
                ))}
              </ul>

              <div className="mt-6">
                <a href="/centers" className="btn btn-secondary">
                  View all centers
                </a>
              </div>
            </div>
          </div>

          {/* Bottom area: selected image with horizontal gradient (-mt overlap closes mobile navy/photo seam) */}
          <div className="relative -mt-[3px] h-[260px] w-full overflow-hidden bg-gmcc-navy">
            {bgUrl ? (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${bgUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                aria-hidden="true"
              />
            ) : null}

            {/* horizontal gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,34,68,0.92) 0%, rgba(0,34,68,0.55) 45%, rgba(0,0,0,0) 100%)",
              }}
              aria-hidden="true"
            />

            {/* Subtle photo label */}
            <div className="relative mx-auto max-w-6xl px-4 py-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                <span className="h-2.5 w-2.5 rounded-full bg-gmcc-green" aria-hidden="true" />
                {selected.title}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="mt-0 hidden md:block mb-12">
        <div className="relative w-full">
          <div className="relative h-[700px] w-full overflow-hidden">
            {/* Background image – fixed 700px so zoom never changes with content */}
            <div className="absolute inset-0 bg-neutral-100" aria-hidden="true" />
            {bgUrl ? (
              <img
                src={bgUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[700px] w-full object-cover object-center"
              />
            ) : null}

            {/* Right-side navy overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,34,68,0.70) 50%, rgba(0,34,68,0.95) 72%, rgba(0,34,68,1) 100%)",
              }}
              aria-hidden="true"
            />

            {/* Content – scrollable if list overflows the fixed height */}
            <div className="relative flex h-full flex-col mx-auto max-w-6xl pl-48 pr-10 pt-16 pb-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid grid-cols-[1fr_minmax(400px,340px)] gap-10 flex-1">
                <div />

                <div className="flex flex-col justify-center">
                  <h2 className="h2 mt-0 mb-0 text-white">{heading}</h2>

                  <ul className="mt-4 space-y-2">
                    {items.map((c) => {
                      const isActive = c.id === selectedId;
                      const title = c.title ?? "Center";
                      const slug = getSlug(c);
                      const isCorporateWellness = slug === "corporate-wellness-centers";
                      const address = c.centersFields?.address ?? null;
                      const phone = c.centersFields?.contactInfo?.contactPhone ?? null;
                      const href = isCorporateWellness ? "/corporate-wellness-centers" : c.uri ?? "#";

                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(c.id)}
                            className={[
                              "w-full text-left rounded-2xl px-4 py-2.5",
                              "transition-all duration-300 ease-in-out",
                              isActive ? "bg-gmcc-teal/80" : "bg-white/0 hover:bg-gmcc-teal/20",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={[
                                  "mt-1.5 h-4 w-4 shrink-0 rounded-full ring-3 transition-all duration-300",
                                  isActive ? "bg-gmcc-green scale-115 ring-gmcc-navy" : "bg-gmcc-navy ring-gmcc-navy",
                                ].join(" ")}
                                aria-hidden="true"
                              />
                              <div className="min-w-0 w-full">
                                <div className="font-heading text-lg font-semibold text-white">{title}</div>

                                {/* Always rendered — animates open/closed with max-height + opacity */}
                                <div
                                  className={[
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    isActive ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0",
                                  ].join(" ")}
                                >
                                  <div className="text-sm text-neutral-200">
                                    {isCorporateWellness ? (
                                      <p className="text-neutral-200">
                                        {corporateWellnessCentersCaption}
                                      </p>
                                    ) : null}

                                    {!isCorporateWellness && address ? (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="whitespace-pre-line hover:text-white hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {address}
                                      </a>
                                    ) : null}

                                    {!isCorporateWellness && phone ? (
                                      <div className="mt-1">
                                        <PhoneLink
                                          phone={phone}
                                          className="text-neutral-200 hover:text-white hover:underline"
                                        />
                                      </div>
                                    ) : null}

                                    <div className="mt-2">
                                      <a
                                        href={href}
                                        className="text-sm text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        See more information →
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-6 flex justify-center">
                    <a href="/centers" className="btn btn-secondary">
                      View all centers
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
