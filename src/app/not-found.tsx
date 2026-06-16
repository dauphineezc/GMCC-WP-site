export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 section-y mt-32">
      <h1 className="h1">Page not found</h1>
      <p className="body mt-3">
        Sorry — we couldn’t find that page.
      </p>
      <a href="/" className="btn btn-primary mt-6 inline-flex">
        Go home
      </a>
    </main>
  );
}
