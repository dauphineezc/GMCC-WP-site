// src/app/membership/center/[center]/page.tsx
import { wpFetch } from "@/lib/wp";

const MEMBERSHIPS_FOR_CENTER_QUERY = `
  query MembershipsForCenter($centerSlug: ID!) {
    center(id: $centerSlug, idType: SLUG) {
      id
      slug
      title
    }

    memberships(first: 100) {
      nodes {
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        membershipFields {
          summary
          benefits
          pricingTable {
            tier
            monthly
            annual
            joiningFee
          }
          eligibility
          joinRenewLink

          centers {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }

          attachments {
            attachment1 {
              attachment1Label
              attachment1File { node { mediaItemUrl } }
            }
            attachment2 {
              attachment2Label
              attachment2File { node { mediaItemUrl } }
            }
            attachment3 {
              attachment3Label
              attachment3File { node { mediaItemUrl } }
            }
            attachment4 {
              attachment4Label
              attachment4File { node { mediaItemUrl } }
            }
            attachment5 {
              attachment5Label
              attachment5File { node { mediaItemUrl } }
            }
          }
        }
      }
    }
  }
`;

type MembershipWP = any;

type Membership = {
  slug: string;
  title: string;
  hero: { url: string; alt: string } | null;
  summary: string | null;
  benefits: string[];
  eligibility: string[];
  pricing: {
    tier: string | null;
    monthly: number | null;
    annual: number | null;
    joiningFee: number | null;
  };
  joinRenewLink: string | null;
  centers: { title: string; slug: string }[];
  attachments: { label: string; url: string }[];
};

function splitLines(val: unknown): string[] {
  return typeof val === "string"
    ? val.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
}

function mapAttachmentGroup(group: any, labelKey: string, fileKey: string) {
  const label = group?.[labelKey];
  const fileNode = group?.[fileKey]?.node;
  if (!label || !fileNode?.mediaItemUrl) return null;
  return { label, url: fileNode.mediaItemUrl as string };
}

function mapMembership(wp: MembershipWP): Membership {
  const f = wp.membershipFields ?? {};

  const pricing = f.pricingTable ?? {};
  const centers =
    f.centers?.nodes
      ?.map((n: any) =>
        n?.slug && n?.title ? { title: n.title as string, slug: n.slug as string } : null
      )
      .filter(Boolean) ?? [];

  const attachmentsRaw = f.attachments ?? {};
  const attachments = [
    mapAttachmentGroup(attachmentsRaw.attachment1, "attachment1Label", "attachment1File"),
    mapAttachmentGroup(attachmentsRaw.attachment2, "attachment2Label", "attachment2File"),
    mapAttachmentGroup(attachmentsRaw.attachment3, "attachment3Label", "attachment3File"),
    mapAttachmentGroup(attachmentsRaw.attachment4, "attachment4Label", "attachment4File"),
    mapAttachmentGroup(attachmentsRaw.attachment5, "attachment5Label", "attachment5File"),
  ].filter(Boolean) as { label: string; url: string }[];

  return {
    slug: wp.slug as string,
    title: wp.title as string,
    hero: wp.featuredImage?.node
      ? {
          url: wp.featuredImage.node.sourceUrl as string,
          alt: (wp.featuredImage.node.altText as string) ?? "",
        }
      : null,
    summary: (f.summary as string) ?? null,
    benefits: splitLines(f.benefits),
    eligibility: splitLines(f.eligibility),
    pricing: {
      tier: (pricing.tier as string) ?? null,
      monthly: pricing.monthly ?? null,
      annual: pricing.annual ?? null,
      joiningFee: pricing.joiningFee ?? null,
    },
    joinRenewLink: (f.joinRenewLink as string) ?? null,
    centers,
    attachments,
  };
}

type MembershipCenterPageProps = {
  params: {
    center: string; // center CPT slug, e.g. "tennis-center"
  };
};

export default async function MembershipCenterPage({ params }: MembershipCenterPageProps) {
  const centerSlug = params.center;

  const data = await wpFetch<any>(MEMBERSHIPS_FOR_CENTER_QUERY, { centerSlug });

  const center = data?.center;
  const allMemberships = data?.memberships?.nodes ?? [];

  if (!center) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        Center not found.
      </main>
    );
  }

  // 1) Filter raw nodes by center slug
  const membershipsForCenterRaw = allMemberships.filter((m: any) =>
    m.membershipFields?.centers?.nodes?.some(
      (c: any) => c?.slug === centerSlug
    )
  );

  // 2) Map to our Membership shape
  const memberships: Membership[] = membershipsForCenterRaw.map(mapMembership);

  if (!memberships.length) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {center.title} memberships
        </h1>
        <p className="text-sm text-neutral-600">
          We don&apos;t have membership information configured for this center yet.
        </p>
      </main>
    );
  }

  // 3) Optional: sort
  memberships.sort((a, b) => {
    const tA = (a.pricing.tier || "").localeCompare(b.pricing.tier || "");
    if (tA !== 0) return tA;
    return a.title.localeCompare(b.title);
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      {/* PAGE HERO */}
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {center.title} memberships
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
          Explore membership options for the {center.title}. Compare pricing,
          benefits, and eligibility to find the best fit for you or your family.
        </p>
      </section>

      {/* CARD GRID */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Membership options
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {memberships.map((m) => (
            <article
              key={m.slug}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="space-y-1 border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {m.title}
                </h3>

                {m.summary && (
                  <p className="mt-1 text-xs text-neutral-600">{m.summary}</p>
                )}

                <div className="mt-2 space-y-0.5 text-xs text-neutral-800">
                  {m.pricing.monthly != null && (
                    <div>
                      <span className="text-neutral-500">Monthly:</span>{" "}
                      <span className="font-semibold">
                        ${m.pricing.monthly.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {m.pricing.annual != null && (
                    <div>
                      <span className="text-neutral-500">Annual:</span>{" "}
                      <span className="font-semibold">
                        ${m.pricing.annual.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {m.pricing.joiningFee != null && (
                    <div className="text-[11px] text-neutral-500">
                      One-time joining fee: ${m.pricing.joiningFee.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {m.benefits.length > 0 && (
                <div className="mt-3 space-y-1.5 text-xs text-neutral-700">
                  <p className="font-semibold text-neutral-900">
                    Key benefits
                  </p>
                  <ul className="space-y-1">
                    {m.benefits.slice(0, 4).map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-[2px] h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                    {m.benefits.length > 4 && (
                      <li className="text-[11px] text-neutral-500">
                        + {m.benefits.length - 4} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-auto space-y-2 pt-3 border-t border-neutral-100">
                {m.joinRenewLink ? (
                  <a
                    href={m.joinRenewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Join or renew
                  </a>
                ) : (
                  <p className="text-[11px] text-neutral-500">
                    Registration details coming soon.
                  </p>
                )}

                <a
                  href={`/membership/${m.slug}`}
                  className="block text-center text-[11px] text-blue-600 hover:underline"
                >
                  View full membership details
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PRICE TABLE */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          Price comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border border-neutral-200 bg-white">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Membership</th>
                <th className="px-3 py-2 text-left font-medium">Tier</th>
                <th className="px-3 py-2 text-left font-medium">Monthly</th>
                <th className="px-3 py-2 text-left font-medium">Annual</th>
                <th className="px-3 py-2 text-left font-medium">Joining fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {memberships.map((m) => (
                <tr key={m.slug}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-neutral-900">
                      {m.title}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {m.pricing.tier || "—"}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {m.pricing.monthly != null
                      ? `$${m.pricing.monthly.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {m.pricing.annual != null
                      ? `$${m.pricing.annual.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {m.pricing.joiningFee != null
                      ? `$${m.pricing.joiningFee.toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FORMS */}
      {memberships.some((m) => m.attachments.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            Waivers & auto-draft forms
          </h2>
          <ul className="space-y-1 text-sm text-neutral-700">
            {memberships.flatMap((m) =>
              m.attachments.map((att, i) => (
                <li key={`${m.slug}-${i}`}>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {att.label}
                  </a>{" "}
                  <span className="text-xs text-neutral-500">
                    ({m.title})
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </main>
  );
}