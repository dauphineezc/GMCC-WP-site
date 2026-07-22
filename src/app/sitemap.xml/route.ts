import type { MetadataRoute } from "next";
import { getPublicSitemapEntries } from "@/lib/sitemap/getPublicSitemapEntries";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSitemapXml(entries: MetadataRoute.Sitemap): string {
  const body = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `\n    <lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
        : "";

      return `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${lastModified}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export async function GET() {
  const entries = await getPublicSitemapEntries();

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
