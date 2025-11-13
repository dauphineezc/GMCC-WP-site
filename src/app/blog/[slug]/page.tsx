import { notFound } from "next/navigation";
import RichText from "@/components/richText";
import { draftMode } from "next/headers";

export const revalidate = 60;

async function getPost(slug: string) {
  const endpoint = process.env.NEXT_PUBLIC_WORDPRESS_URL?.endsWith("/graphql")
    ? process.env.NEXT_PUBLIC_WORDPRESS_URL!
    : `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/graphql`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query PostBySlug($slug: ID!) {
          post(id: $slug, idType: SLUG) {
            title
            content
            date
          }
        }
      `,
      variables: { slug },
    }),
    // Bypass cache in preview
    cache: (await draftMode()).isEnabled ? "no-store" : "force-cache",
    next: { revalidate: (await draftMode()).isEnabled ? 0 : 60 },
  });

  const json = await res.json();
  return json.data?.post ?? null;
}

type RouteParams = { slug: string };

export default async function PostPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold mb-4">{post.title}</h1>
      <RichText html={post.content} />
    </main>
  );
}