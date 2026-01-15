// src/lib/wp.ts
export async function wpFetch<T>(query: string, variables?: Record<string, any>) {
  const endpoint = process.env.WP_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    throw new Error("WP_GRAPHQL_ENDPOINT is not set");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables ? { query, variables } : { query }),
    next: { revalidate: 60 },
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("WPGraphQL HTTP error:", res.status, text);
    throw new Error(`WPGraphQL error: ${res.status}`);
  }

  const json = JSON.parse(text);

  if (json.errors) {
    console.error("WPGraphQL GraphQL errors:", json.errors);
    throw new Error(JSON.stringify(json.errors));
  }

  return json.data as T;
}
