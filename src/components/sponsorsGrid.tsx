export type Sponsor = {
  name: string;
  logoUrl: string;
  logoAlt: string;
  link: string | null;
  tier: string | null;
};

function extractSponsorFromNode(node: unknown): Sponsor | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  const fields = (n.sponsorFields as Record<string, unknown> | undefined) ?? {};
  const logoNode = (
    fields.logo as { node?: { sourceUrl?: string | null; altText?: string | null } } | undefined
  )?.node;
  const logoUrl = (logoNode?.sourceUrl ?? "").trim();
  if (!logoUrl) return null;
  return {
    name: typeof n.name === "string" ? n.name.trim() : "",
    logoUrl,
    logoAlt: (logoNode?.altText ?? "").trim(),
    link: typeof fields.link === "string" && fields.link.trim() ? fields.link.trim() : null,
    tier: typeof fields.tier === "string" && fields.tier.trim() ? fields.tier.trim() : null,
  };
}

/**
 * Normalize a flat array of Sponsor term nodes (e.g. from an event's `sponsors.nodes`).
 * No type filtering — use this when the list is already pre-filtered by the relation field.
 */
export function normalizeSponsors(nodes: unknown[]): Sponsor[] {
  const out: Sponsor[] = [];
  for (const node of nodes) {
    const s = extractSponsorFromNode(node);
    if (s) out.push(s);
  }
  return out;
}

/**
 * Normalize the full Sponsors taxonomy response and filter to only those whose
 * `sponsorType` checkbox includes the given type value (case-insensitive).
 * Use this for pages like /camps that query the whole taxonomy and filter client-side.
 */
export function normalizeSponsorsByType(
  raw: unknown,
  type: string,
): Sponsor[] {
  if (!raw || typeof raw !== "object") return [];
  const nodes = (raw as { nodes?: unknown[] }).nodes ?? [];
  const out: Sponsor[] = [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    const fields = (n.sponsorFields as Record<string, unknown> | undefined) ?? {};
    const sponsorType = fields.sponsorType;
    const types: string[] = Array.isArray(sponsorType) ? sponsorType.map(String) : [];
    if (!types.some((t) => t.toLowerCase() === type.toLowerCase())) continue;
    const s = extractSponsorFromNode(node);
    if (s) out.push(s);
  }
  return out;
}

export default function SponsorsGrid({
  sponsors,
  title,
}: {
  sponsors: Sponsor[];
  title?: string;
}) {
  if (sponsors.length === 0) return null;
  return (
    <div>
      {title ? (
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gmcc-navy" />
          <span className="text-base font-semibold uppercase tracking-widest text-gmcc-navy">{title}</span>
          <div className="h-px flex-1 bg-gmcc-navy" />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        {sponsors.map((sponsor) => {
          const img = (
            <img
              src={sponsor.logoUrl}
              alt={sponsor.logoAlt || sponsor.name || "Sponsor"}
              className="max-h-28 max-w-[180px] w-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          );
          return sponsor.link ? (
            <a
              key={sponsor.name || sponsor.logoUrl}
              href={sponsor.link}
              target="_blank"
              rel="noopener noreferrer"
              title={sponsor.name || undefined}
              className="flex items-center transition-opacity hover:scale-105"
            >
              {img}
            </a>
          ) : (
            <div
              key={sponsor.name || sponsor.logoUrl}
              title={sponsor.name || undefined}
              className="flex items-center"
            >
              {img}
            </div>
          );
        })}
      </div>
    </div>
  );
}
