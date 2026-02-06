// src/app/(home)/sections/CentersSection.tsx
"use client";

import { useMemo } from "react";

type Center = {
  id: string;
  slug?: string | null;
  title?: string | null;
  uri?: string | null;
  featuredImage?: { node?: { sourceUrl: string; altText?: string | null } | null } | null;
  centersFields?: {
    address?: string | null;
    contactInfo?: { contactPhone?: string | null; contactEmail?: string | null } | null;
    googleMap?: { src?: string | null; lat?: string | null; lng?: string | null; zoom?: string | null } | null;
  } | null;
};

type Props = {
  heading: string;
  centers: Center[];
};

type Pin = { x: number; y: number }; // percent coords inside the central map pane

function getMapEmbedUrl(center: Center) {
  const cf = center.centersFields ?? {};
  const lat = Number(cf.googleMap?.lat);
  const lng = Number(cf.googleMap?.lng);
  const zoom = Number(cf.googleMap?.zoom ?? 15);
  const hasMap = Number.isFinite(lat) && Number.isFinite(lng);
  if (!hasMap) return null;

  const z = Number.isFinite(zoom) ? zoom : 15;
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=${z}&output=embed`;
}

// helper: works even if slug isn't queried
function getSlug(c: { slug?: string | null; uri?: string | null }) {
  if (c.slug) return c.slug;
  const uri = c.uri ?? "";
  const parts = uri.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function CalloutCard({ center }: { center: Center }) {
  const title = center.title ?? "Center";
  const address = center.centersFields?.address ?? null;
  const phone = center.centersFields?.contactInfo?.contactPhone ?? null;
  const email = center.centersFields?.contactInfo?.contactEmail ?? null;
  const href = center.uri ?? "#";

  return (
    <div className="group relative">
      <div className="relative rounded-2xl border border-neutral-200 bg-white/95 shadow-lg backdrop-blur group-hover:translate-y-[-2px] transition-transform duration-200">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-gmcc-green-lightest text-gmcc-navy">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2c-3.9 0-7 3.1-7 7c0 5.2 6.2 12.6 6.5 12.9c.3.3.7.3 1 0C12.8 21.6 19 14.2 19 9c0-3.9-3.1-7-7-7Zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5Z"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="font-heading text-base font-semibold text-neutral-900 leading-snug group-hover:text-gmcc-teal">{title}</div>

              {address ? (
                <div className="mt-1 text-sm text-neutral-600 whitespace-pre-line">{address}</div>
              ) : null}

              {phone || email ? (
                <div className="mt-2 space-y-1 text-sm text-neutral-700">
                  {phone ? <div>📞 {phone}</div> : null}
                  {email ? <div>✉️ {email}</div> : null}
                </div>
              ) : null}

              <div className="mt-3">
                <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                  View details →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* clickable overlay without nesting <a> tags elsewhere */}
      <a href={href} className="absolute inset-0 rounded-2xl" aria-label={`Open ${title}`} />
    </div>
  );
}

function PinButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className={[
        "group relative grid place-items-center",
        "h-11 w-11 rounded-full",
        "bg-white/95 border border-neutral-200 shadow-md",
        "transition-transform hover:scale-[1.03] focus:scale-[1.03]",
        "focus:outline-none focus:ring-2 focus:ring-gmcc-teal focus:ring-offset-2",
      ].join(" ")}
      aria-label={label}
    >
      <span className="absolute inset-0 rounded-full ring-4 ring-gmcc-teal/15" aria-hidden="true" />
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-gmcc-teal" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2c-3.9 0-7 3.1-7 7c0 5.2 6.2 12.6 6.5 12.9c.3.3.7.3 1 0C12.8 21.6 19 14.2 19 9c0-3.9-3.1-7-7-7Zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5Z"
        />
      </svg>
    </a>
  );
}

/**
 * Clean illustrated map background + 6 small commercial buildings tied to pins.
 * NOTE: This renders ONLY the background illustration/buildings. Pins & callouts are overlaid in HTML.
 */
function NetworkIllustration({ pinBySlug }: { pinBySlug: Record<string, Pin> }) {
  const SVG_W = 1600;
  const SVG_H = 720;

  // stable order
  const SLUGS_IN_ORDER = [
    "community-center",
    "tennis-center",
    "corteva-fitness-center",
    "coleman-family-center",
    "north-family-center",
    "curling-center",
  ];

  // Offsets (in SVG pixels) so buildings sit slightly "behind" each pin.
  // Tuned so they don't cover pins given current PIN_BY_SLUG values.
  const OFFSETS: Record<string, { dx: number; dy: number }> = {
    "community-center": { dx: -180, dy: -100 },
    "tennis-center": { dx: 20, dy: -30 },
    "corteva-fitness-center": { dx: -260, dy:-80 },
    "coleman-family-center": { dx: -65, dy: -70 },
    "north-family-center": { dx: -180, dy: -140 },
    "curling-center": { dx: -60, dy: 20 },
  };

  function pinToSvg(slug: string) {
    const p = pinBySlug[slug];
    if (!p) return null;
    return {
      x: (p.x / 100) * SVG_W,
      y: (p.y / 100) * SVG_H,
    };
  }

  // --- Building variants (small, sharp corners, varied entries) ---
  function BuildingA() {
    // Community Center
    return (
      <g className="b-shadow">
        <ellipse className="b-ground" cx="160" cy="138" rx="205" ry="24" />
        <rect className="b-wall" x="10" y="18" width="300" height="110" />
        <rect className="b-parapet" x="10" y="18" width="300" height="22" />
        <line className="b-accentLine" x1="10" y1="40" x2="310" y2="40" />
      
        <rect className="b-glass" x="85" y="45" width="150" height="83" />
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={i} className="b-line-thin" x1={115 + i * 30} y1="45" x2={115 + i * 30} y2="128" />
        ))}
        {Array.from({ length: 2 }).map((_, i) => (
          <line key={i} className="b-line-thin" x1="85" y1={67 + i * 42} x2="235" y2={67 + i * 42} />
        ))}

        <rect className="b-glass" x="22" y="85" width="52" height="30" />
        <rect className="b-glass" x="246" y="85" width="52" height="30" />
      
        <rect className="b-door" x="141" y="83" width="38" height="45" />
        <line className="b-accentLine" x1="138" y1="80" x2="182" y2="80" />
        <line className="b-line" x1="138" y1="80" x2="182" y2="80" />
        <line className="b-line-thin" x1="160" y1="84" x2="160" y2="128" />
    </g>
    );
  }

  function BuildingB() {
    // Tennis Center
    return (
      <g className="b-shadow">
        <ellipse className="b-ground" cx="180" cy="128" rx="220" ry="24" />
        <rect className="b-wall" x="10" y="18" width="350" height="105" />
        <rect className="b-parapet" x="10" y="18" width="350" height="22" />
        <line className="b-accentLine" x1="10" y1="40" x2="360" y2="40" />

        <rect x="170" y="56" width="28" height="16" fill="#E8F4E0" stroke="#D7E4D6" />
        <line className="b-line-thin" x1="170" y1="58" x2="198" y2="58"/>
        <line className="b-line-thin" x1="170" y1="70" x2="198" y2="70"/>
        <line className="b-line-thin" x1="177.5" y1="64" x2="190.5" y2="64"/>
        <line className="b-line-thin" x1="177.5" y1="58" x2="177.5" y2="70"/>
        <line className="b-line-thin" x1="190.5" y1="58" x2="190.5" y2="70"/>
        <line className="b-line-thin" x1="184" y1="56" x2="184" y2="72"/>

        <rect className="b-glass" x="25" y="62" width="125" height="28" />
        <rect className="b-glass" x="220" y="62" width="125" height="28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={i} className="b-line-thin" x1={50 + i * 25} y1="63" x2={50 + i * 25} y2="89.5" />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={`e2-${i}`} className="b-line-thin" x1={245 + i * 25} y1="63" x2={245 + i * 25} y2="89.5" />
        ))}
        <line className="b-line" x1="20" y1="105" x2="155" y2="105" />
        <line className="b-line" x1="215" y1="105" x2="350" y2="105" />

        <rect className="b-door" x="167" y="78" width="36" height="45" />
        <line className="b-line-thin" x1="185" y1="78" x2="185" y2="122" />
      </g>
    );
  }

  function BuildingC() {
    // Corteva Fitness Center
    return (
      <g className="b-shadow">
        <ellipse className="b-ground" cx="165" cy="150" rx="190" ry="24" />
        <rect className="b-wall" x="10" y="18" width="300" height="125" />
        <rect className="b-parapet" x="10" y="18" width="300" height="22" />
        <line className="b-accentLine" x1="10" y1="40" x2="310" y2="40" />

        {Array.from({ length: 3 }).map((_, i) => (
          <rect key={i} className="b-glass" x={24 + i * 35} y="58" width="26" height="62" />
        ))}

        {Array.from({ length: 3 }).map((_, i) => (
          <rect key={i} className="b-glass" x={200 + i * 35} y="58" width="26" height="62" />
        ))}

        <rect className="b-door" x="136" y="92" width="48" height="51" />
        <line className="b-line-thin" x1="160" y1="94" x2="160" y2="142" />
        <polygon className="b-accentLine" points="133,85 186,85 160,75" fill="#BFD7C0" stroke="#BFD7C0" strokeWidth="8" />
      </g>
    );
  }

  function BuildingD() {
    // Coleman Family Center
    return (
      <g className="b-shadow">
        <ellipse className="b-ground" cx="110" cy="120" rx="170" ry="24" />
        <rect className="b-wall" x="10" y="18" width="200" height="110" />
        <rect className="b-parapet" x="10" y="18" width="200" height="22" />
        <line className="b-accentLine" x1="10" y1="40" x2="210" y2="40" />

        <rect className="b-glass" x="26" y="68" width="60" height="40" />
        <rect className="b-glass" x="135" y="68" width="60" height="40" />
        {Array.from({ length: 2 }).map((_, i) => (
          <line key={i} className="b-line" x1={45 + i * 20} y1="69.5" x2={45 + i * 20} y2="106.5" />
        ))}
        {Array.from({ length: 2 }).map((_, i) => (
          <line key={`r-${i}`} className="b-line" x1={155 + i * 20} y1="69.5" x2={155 + i * 20} y2="106.5" />
        ))}

        <rect className="b-door" x="95" y="78" width="30" height="50" />
        <line className="b-line-thin" x1="110" y1="78" x2="110" y2="128" />
    </g>
    );
  }

  function BuildingE() {
    // North Family Center
    return (
      <g className="b-shadow">
        <ellipse className="b-ground" cx="100" cy="140" rx="180" ry="24" />
        <rect className="b-wall" x="10" y="18" width="190" height="120" />
        <rect className="b-parapet" x="10" y="18" width="190" height="22" />
        <line className="b-accentLine" x1="10" y1="40" x2="200" y2="40" />

        <rect className="b-door" x="26" y="74" width="40" height="64" />
        <circle cx="58" cy="104" r="4" fill="#9FB59E" />
        <rect className="b-glass" x="82" y="64" width="94" height="40" />
        <line className="b-line" x1="130" y1="66" x2="130" y2="103" />
        <rect className="b-awning" x="82" y="64" width="94" height="10" fill="#E8F4E0" stroke="#D7E4D6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={`r-${i}`} className="b-stripe" x1={89.5 + i * 20} y1="64.5" x2={89.5 + i * 20} y2="73.5" strokeWidth="10" stroke="#FFFFFF" />
        ))}
      </g>
    );
  }

  function BuildingF() {
    // Curling Center
    return (
      <g className="b-shadow">
        <ellipse className="b-ground" cx="175" cy="135" rx="220" ry="24" />
        <rect className="b-wall" x="10" y="18" width="330" height="115" />
        <rect className="b-parapet" x="10" y="18" width="330" height="22" />
        <line className="b-accentLine" x1="10" y1="40" x2="340" y2="40" />

        <rect className="b-glass" x="40" y="62" width="210" height="45" />
        {Array.from({ length: 3 }).map((_, i) => (
          <line key={i} className="b-line-thin" x1={95 + i * 50} y1="63" x2={95 + i * 50} y2="107" />
        ))}
        
        <line className="b-line" x1="30" y1="115" x2="270" y2="115" />

        <rect className="b-door" x="280" y="75" width="36" height="58" />
        <line className="b-line-thin" x1="297" y1="76" x2="297" y2="132" />
  
        <circle cx="298" cy="60" r="11" fill="#D7E4D6" />
        <circle cx="298" cy="60" r="7" fill="rgba(255,255,255)" />
        <circle cx="298" cy="60" r="4" fill="#9FB59E" />
        <circle cx="298" cy="60" r="1" fill="rgba(255,255,255)" />

      </g>
    );
  }

  const BUILDINGS = [BuildingA, BuildingB, BuildingC, BuildingD, BuildingE, BuildingF];

  return (
    <svg
      viewBox="0 0 1600 720"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f5fbf2" />
        </linearGradient>

        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .18 0" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1" />
        </filter>

        <style>{`
          .b-shadow { filter: url(#lift); }
          .b-ground { fill: #DDF0D1; opacity: .55; }
          .b-wall { fill: rgba(255,255,255,.95); stroke: #D7E4D6; }
          .b-parapet { fill: #E8F4E0; stroke: #D7E4D6; }
          .b-glass { fill: #F4FAFF; stroke: #D7E4D6; }
          .b-door { fill: #E8F4E0; stroke: #D7E4D6; }
          .b-line { stroke: #D7E4D6; stroke-width: 3; stroke-linecap: square; }
          .b-line-thin { stroke: #D7E4D6; stroke-width: 1; stroke-linecap: square; }
          .b-accentLine { stroke: #BFD7C0; stroke-width: 8; stroke-linecap: square; opacity: .9; }
        `}</style>
      </defs>

      {/* Sky */}
      <rect width="1600" height="720" fill="url(#sky)" />

      {/* Distant hills */}
      <path
        d="M0,440 C300,380 500,400 700,440 C920,490 1200,480 1600,400 L1600,720 L0,720 Z"
        fill="#EAF6E1"
      />
      <path
        d="M0,500 C350,450 550,470 800,500 C1050,540 1300,530 1600,480 L1600,720 L0,720 Z"
        fill="#DDF0D1"
        opacity="0.85"
      />

      {/* Roads */}
      <path
        d="M200,580 C380,520 500,540 660,510 C820,480 900,400 1060,370 C1220,340 1380,360 1480,300"
        fill="none"
        stroke="#BFD7C0"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M340,300 C500,260 680,280 820,330 C980,390 1100,450 1300,460"
        fill="none"
        stroke="#BFD7C0"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Dotted centerlines */}
      <path
        d="M200,580 C380,520 500,540 660,510 C820,480 900,400 1060,370 C1220,340 1380,360 1480,300"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeDasharray="3 12"
        opacity="0.8"
      />
      <path
        d="M340,300 C500,260 680,280 820,330 C980,390 1100,450 1300,460"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeDasharray="3 12"
        opacity="0.8"
      />

      {/* Trees - smaller and simpler */}
      {[
        [380, 615],
        [450, 220],
        [510, 410],
        [800, 110],
        [820, 510],
        [915, 280],
        [1180, 375],
      ].map(([x, y], i) => (
        <g key={i} filter="url(#soft)" opacity="0.8">
          <circle cx={x} cy={y} r="18" fill="#BFE0BF" />
          <rect x={x - 3} y={y + 12} width="6" height="14" rx="3" fill="#9FB59E" />
        </g>
      ))}

      {/* Buildings tied to pins */}
      {SLUGS_IN_ORDER.map((slug, i) => {
        const pt = pinToSvg(slug);
        if (!pt) return null;

        const { dx, dy } = OFFSETS[slug] ?? { dx: -180, dy: -90 };
        const Building = BUILDINGS[i % BUILDINGS.length];

        // Clamp buildings slightly so they don't go out of bounds on extreme pin moves
        const x = Math.max(-20, Math.min(SVG_W - 380, pt.x + dx));
        const y = Math.max(-20, Math.min(SVG_H - 220, pt.y + dy));

        return (
          <g key={slug} transform={`translate(${x} ${y})`}>
            <Building />
          </g>
        );
      })}
    </svg>
  );
}

export default function CentersSection({ heading, centers }: Props) {
  const items = useMemo(() => centers?.slice(0, 6) ?? [], [centers]);
  if (!items.length) return null;

  /**
   * Stable pins (percent inside the central map pane).
   */
  const PIN_BY_SLUG: Record<string, Pin> = {
    "community-center": { x: 40, y: 18 },
    "tennis-center": { x: 30, y: 38 },
    "corteva-fitness-center": { x: 45, y: 70 },
    "coleman-family-center": { x: 60, y: 24 },
    "north-family-center": { x: 70, y: 58},
    "curling-center": { x: 56, y: 100 },
  };

  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-500">{heading}</h2>
        </div>
      </div>

      {/* Mobile fallback list */}
      <div className="px-4">
        <div className="mx-auto mt-10 max-w-6xl grid gap-6 md:hidden">
          {items.map((c) => {
            const mapSrc = getMapEmbedUrl(c);
            return (
              <a key={c.id} href={c.uri ?? "#"} className="group card card-hover overflow-hidden">
                {mapSrc ? (
                  <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                    <iframe
                      src={mapSrc}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map for ${c.title ?? "Center"}`}
                    />
                  </div>
                ) : (
                  <div className="card-bleed aspect-[16/9] bg-gmcc-green-lightest flex items-center justify-center">
                    <span className="small">No map available</span>
                  </div>
                )}

                <div className="pt-4 stack-2">
                  <h3 className="font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal line-clamp-1">
                    {c.title}
                  </h3>

                  {c.centersFields?.address ? (
                    <p className="small whitespace-pre-line">{c.centersFields.address}</p>
                  ) : null}

                  {c.centersFields?.contactInfo?.contactPhone || c.centersFields?.contactInfo?.contactEmail ? (
                    <div className="small stack-2">
                      {c.centersFields?.contactInfo?.contactPhone ? (
                        <div>📞 {c.centersFields.contactInfo.contactPhone}</div>
                      ) : null}
                      {c.centersFields?.contactInfo?.contactEmail ? (
                        <div>✉️ {c.centersFields.contactInfo.contactEmail}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Desktop illustrated network w/ always-visible callouts */}
      <div className="mt-10 hidden md:block">
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <div className="mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-white">
              <div className="relative min-h-[640px]">
                <NetworkIllustration pinBySlug={PIN_BY_SLUG} />

                {/* overlay content */}
                <div className="relative grid grid-cols-[minmax(320px,380px)_1fr_minmax(320px,380px)] gap-8 p-8">
                  {/* LEFT RAIL */}
                  <div className="space-y-6 px-6">
                    {["community-center", "tennis-center", "corteva-fitness-center"].map((slug) => {
                      const c = items.find((x) => getSlug(x) === slug);
                      if (!c) return null;
                      return <CalloutCard key={c.id} center={c} />;
                    })}
                  </div>

                  {/* MAP OVERLAY: pins + connector lines */}
                  <div className="relative">
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 h-full w-full"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="lineFade" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0" stopColor="#0085ad" stopOpacity="0.30" />
                          <stop offset="1" stopColor="#0085ad" stopOpacity="0.18" />
                        </linearGradient>
                      </defs>

                      {/* Left connectors */}
                      {[
                        { slug: "community-center", y: 14 },
                        { slug: "tennis-center", y: 48 },
                        { slug: "corteva-fitness-center", y: 84 },
                      ].map(({ slug, y }) => {
                        const p = PIN_BY_SLUG[slug];
                        if (!p) return null;
                        return (
                          <path
                            key={`L-${slug}`}
                            d={`M 0 ${y} C 18 ${y} 18 ${p.y} ${p.x} ${p.y}`}
                            fill="none"
                            stroke="url(#lineFade)"
                            strokeWidth="0.7"
                            strokeLinecap="round"
                            strokeDasharray="1.2 1.6"
                          />
                        );
                      })}

                      {/* Right connectors */}
                      {[
                        { slug: "coleman-family-center", y: 16 },
                        { slug: "north-family-center", y: 50 },
                        { slug: "curling-center", y: 84 },
                      ].map(({ slug, y }) => {
                        const p = PIN_BY_SLUG[slug];
                        if (!p) return null;
                        return (
                          <path
                            key={`R-${slug}`}
                            d={`M 100 ${y} C 82 ${y} 82 ${p.y} ${p.x} ${p.y}`}
                            fill="none"
                            stroke="url(#lineFade)"
                            strokeWidth="0.7"
                            strokeLinecap="round"
                            strokeDasharray="1.2 1.6"
                          />
                        );
                      })}
                    </svg>

                    {/* pins */}
                    {items.map((c) => {
                      const slug = getSlug(c);
                      const pin = PIN_BY_SLUG[slug];
                      if (!pin) return null;

                      return (
                        <div
                          key={c.id}
                          className="absolute"
                          style={{
                            left: `${pin.x}%`,
                            top: `${pin.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <PinButton href={c.uri ?? "#"} label={`Open ${c.title ?? "Center"}`} />
                        </div>
                      );
                    })}
                  </div>

                  {/* RIGHT RAIL */}
                  <div className="space-y-6 px-6">
                    {["coleman-family-center", "north-family-center", "curling-center"].map((slug) => {
                      const c = items.find((x) => getSlug(x) === slug);
                      if (!c) return null;
                      return <CalloutCard key={c.id} center={c} />;
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-neutral-100 px-6 py-4">
                <div className="text-sm text-neutral-600">Click any card or pin to open the center page.</div>
                <a href="/centers" className="btn btn-secondary">
                  View all centers
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
