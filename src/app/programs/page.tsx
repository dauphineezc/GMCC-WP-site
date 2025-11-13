import { wpFetch } from "@/lib/wp";

const QUERY = `
  query ProgramsIndex($first: Int!) {
    programs(first: $first, where: {orderby: {field: TITLE, order: ASC}}) {
      nodes {
        title
        slug
        featuredImage { node { sourceUrl altText } }
        programFields { summary taxonomies { audience programArea center } externalSchedule { nextStartDate } }
      }
    }
  }
`;

export default async function ProgramsIndex() {
  const data = await wpFetch<any>(QUERY, { first: 24 });
  const items = data?.programs?.nodes ?? [];
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-3xl font-semibold">Programs</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p: any) => (
          <a key={p.slug} href={`/programs/${p.slug}`} className="rounded-xl border p-4 hover:bg-neutral-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.featuredImage?.node?.sourceUrl && <img className="mb-3 rounded" src={p.featuredImage.node.sourceUrl} alt={p.featuredImage.node.altText ?? ""} />}
            <h2 className="text-lg font-medium">{p.title}</h2>
            <p className="mt-1 line-clamp-3 text-sm text-neutral-600">{p.programFields?.summary}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
