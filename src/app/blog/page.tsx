// src/app/blog/page.tsx
import Link from "next/link";
export const revalidate = 60;

type Post = { id: string; title: string; slug: string };

async function getPosts(): Promise<Post[]> {
  const endpoint = process.env.NEXT_PUBLIC_WORDPRESS_URL?.endsWith("/graphql")
    ? process.env.NEXT_PUBLIC_WORDPRESS_URL!
    : `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/graphql`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query LatestPosts($first: Int!) {
          posts(first: $first) { nodes { id title slug } }
        }
      `,
      variables: { first: 10 },
    }),
    // optional: Next can cache+revalidate with the export above
    // cache: "force-cache",
  });
  const json = await res.json();
  return json.data?.posts?.nodes ?? [];
}

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold mb-4">Latest Posts</h1>
      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/blog/${p.slug}`}
              className="block border p-3 rounded hover:bg-gray-50"
            >
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}