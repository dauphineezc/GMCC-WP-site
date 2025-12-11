// src/app/membership/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";

const MEMBERSHIP_BY_SLUG_QUERY = `
  query MembershipBySlug($slug: ID!) {
    membership(id: $slug, idType: SLUG) {
      title
      slug
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails { width height }
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

        audience {
          nodes { name slug }
        }

        programArea {
          nodes { name slug }
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
`;

type MembershipPageProps = {
  params: { slug: string };
};

export default async function MembershipPage({ params }: MembershipPageProps) {
  const { slug } = params;

  const data = await wpFetch<any>(MEMBERSHIP_BY_SLUG_QUERY, { slug });
  const membership = data?.membership;

  if (!membership) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        Membership not found.
      </main>
    );
  }

  const f = membership.membershipFields ?? {};

  const splitLines = (v: unknown): string[] =>
    typeof v === "string"
      ? v.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

  const benefits = splitLines(f.benefits);
  const eligibility = splitLines(f.eligibility);

  const centers =
    f.centers?.nodes
      ?.map((n: any) =>
        n && n.title ? { title: n.title as string, slug: n.slug as string } : null
      )
      .filter(Boolean) ?? [];

  const audienceNames =
    f.audience?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [];

  const programAreaNames =
    f.programArea?.nodes?.map((n: any) => n?.name).filter(Boolean) ?? [];

  // Pricing “table” (single group for now)
  const pricing = f.pricingTable ?? null;

  // Build attachments array
  const rawAtt = f.attachments ?? {};
  const attachments: { label: string; url: string }[] = [];

  const maybePushAttachment = (
    groupKey: string,
    labelKey: string,
    fileKey: string
  ) => {
    const g = rawAtt[groupKey];
    const fileNode = g?.[fileKey]?.node;
    const label = g?.[labelKey];
    if (fileNode?.mediaItemUrl && label) {
      attachments.push({ label, url: fileNode.mediaItemUrl });
    }
  };

  maybePushAttachment("attachment1", "attachment1Label", "attachment1File");
  maybePushAttachment("attachment2", "attachment2Label", "attachment2File");
  maybePushAttachment("attachment3", "attachment3Label", "attachment3File");
  maybePushAttachment("attachment4", "attachment4Label", "attachment4File");
  maybePushAttachment("attachment5", "attachment5Label", "attachment5File");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* HERO */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {membership.title}
            </h1>
            {f.summary && (
              <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
                {f.summary}
              </p>
            )}
          </div>

          {/* Hero-side metadata */}
          <div className="flex flex-col items-end gap-2 text-xs text-neutral-700">
            {centers.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {centers.map((c: { slug: string; title: string }) => (
                  <a
                    key={c.slug}
                    href={`/centers/${c.slug}`}
                    className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] text-emerald-800 hover:bg-emerald-100"
                  >
                    {c.title}
                  </a>
                ))}
              </div>
            )}
            {audienceNames.length > 0 && (
              <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5">
                Audience: {audienceNames.join(", ")}
              </span>
            )}
            {programAreaNames.length > 0 && (
              <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5">
                Program area: {programAreaNames.join(", ")}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* HERO IMAGE */}
      {membership.featuredImage?.node?.sourceUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 flex justify-center">
          <img
            src={membership.featuredImage.node.sourceUrl}
            alt={membership.featuredImage.node.altText ?? ""}
            className="h-64 object-contain sm:h-72"
          />
        </div>
      )}

      {/* MAIN GRID: left content + right conversion block */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Benefits */}
          {benefits.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-medium">Membership benefits</h2>
              <ul className="mt-1 list-disc pl-5 text-sm text-neutral-700">
                {benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Eligibility */}
          {eligibility.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-medium">Eligibility & verification</h2>
              <ul className="mt-1 list-disc pl-5 text-sm text-neutral-700">
                {eligibility.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </section>
          )}

          {/* (Optional) FAQ stub – you can wire this up to a Policies/FAQs CPT later */}
          <section className="space-y-2">
            <h2 className="text-lg font-medium">FAQs</h2>
            <p className="text-sm text-neutral-600">
              Answers to common questions about this membership, renewal options, and billing can be found here.
              Can also later be wired to a Policies/FAQs content type.
            </p>
          </section>
        </div>

        {/* RIGHT SIDEBAR – pricing + CTA + docs */}
        <aside className="space-y-6">
          {/* Pricing card / comparison-style block */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900">
              Pricing
            </h2>

            {pricing ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-neutral-600">
                        Tier
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-neutral-600">
                        Monthly
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-neutral-600">
                        Annual
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-neutral-600">
                        Joining fee
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="odd:bg-white even:bg-neutral-50">
                      <td className="px-3 py-2 text-neutral-900">
                        {pricing.tier || membership.title}
                      </td>
                      <td className="px-3 py-2 text-neutral-800">
                        {pricing.monthly != null
                          ? `$${Number(pricing.monthly).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-neutral-800">
                        {pricing.annual != null
                          ? `$${Number(pricing.annual).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-neutral-800">
                        {pricing.joiningFee != null
                          ? `$${Number(pricing.joiningFee).toFixed(2)}`
                          : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">
                Pricing details will be posted soon.
              </p>
            )}

            {/* Join / Renew CTA */}
            {f.joinRenewLink ? (
              <a
                href={f.joinRenewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                Join / Renew now
              </a>
            ) : (
              <p className="mt-3 text-xs text-neutral-600">
                Online join / renew link will be available soon. For now, please
                contact the Community Center for assistance.
              </p>
            )}
          </div>

          {/* Documents card – waiver / auto-draft, etc. */}
          {attachments.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-900">
                Forms & documents
              </h2>
              <p className="mt-1 text-xs text-neutral-600">
                Waivers, auto-draft authorization, and related documents.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {attachments.map((att, i) => (
                  <li key={i}>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <span className="inline-block h-6 w-6 rounded-full bg-blue-50 text-center text-[11px] leading-6">
                        PDF
                      </span>
                      <span>{att.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}