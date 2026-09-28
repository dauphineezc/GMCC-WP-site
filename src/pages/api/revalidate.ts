import type { NextApiRequest, NextApiResponse } from "next";
import { purgeTags } from "@wpengine/edge-cache";
import {
  EDGE_PURGE_TAGS_BATCH_SIZE,
  WP_CACHE_TAGS,
  WP_CACHE_TAG_PATHS,
  WP_CACHE_TAGS_THAT_REFRESH_LAYOUT,
  WP_LAYOUT_ROOT_PATHS,
} from "@/lib/revalidate";
import {
  mapWpRevalidatePayload,
  type WpRevalidateWebhookBody,
} from "@/lib/wordpress/mapWpRevalidatePayload";
import { wpFetch } from "@/lib/wp";

type RevalidateBody = WpRevalidateWebhookBody;

const CENTER_SLUGS_QUERY = /* GraphQL */ `
  query RevalidateCenterSlugs {
    centers(first: 100) {
      nodes {
        slug
      }
    }
  }
`;

async function fetchCenterDetailPaths(): Promise<string[]> {
  const data = await wpFetch<{
    centers?: { nodes?: Array<{ slug?: string | null } | null> | null } | null;
  }>(CENTER_SLUGS_QUERY);
  return (data?.centers?.nodes ?? [])
    .map((node) => (node?.slug ?? "").trim())
    .filter(Boolean)
    .map((slug) => `/centers/${slug}`);
}

function getExpectedSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET || process.env.FAUSTWP_SECRET_KEY;
}

/** Same gate `@wpengine/edge-cache` uses before calling the platform purge API. */
function isAtlasEdgePlatform(): boolean {
  const url = process.env.HEADLESS_APPS_API_URL_ADDRESS ?? "";
  const token = process.env.HEADLESS_APPS_API_TOKEN ?? "";
  const runtime = String(process.env.HEADLESS_METADATA).toLowerCase() === "true";
  return url.length > 0 && token.length > 0 && runtime;
}

function headerSecret(req: NextApiRequest): string {
  const raw = req.headers["x-revalidate-secret"];
  const fromHeader = Array.isArray(raw) ? raw[0] : raw;
  if (fromHeader?.trim()) return fromHeader.trim();

  const auth = req.headers.authorization;
  if (typeof auth === "string") {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }
  return "";
}

function queryValues(req: NextApiRequest, key: string): string[] {
  const raw = req.query[key];
  if (raw == null) return [];
  return (Array.isArray(raw) ? raw : [raw])
    .map((v) => String(v).trim())
    .filter(Boolean);
}

function arrayOf(values: string[] | undefined): string[] {
  return Array.isArray(values) ? values : [];
}

function collectExplicitTags(req: NextApiRequest, body: RevalidateBody): string[] {
  const fromQuery = queryValues(req, "tag");
  const fromBody = [...(body.tag ? [body.tag] : []), ...arrayOf(body.tags)];
  return [...new Set([...fromQuery, ...fromBody].map((t) => t.trim()).filter(Boolean))];
}

function collectExplicitPaths(req: NextApiRequest, body: RevalidateBody): string[] {
  const fromQuery = queryValues(req, "path");
  const fromBody = [...(body.path ? [body.path] : []), ...arrayOf(body.paths)];
  return [...new Set([...fromQuery, ...fromBody].map((p) => p.trim()).filter(Boolean))];
}

function parseBody(req: NextApiRequest): RevalidateBody {
  if (req.method !== "POST") return {};
  const raw = req.body;
  if (raw == null || raw === "") return {};
  if (typeof raw === "object") return raw as RevalidateBody;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as RevalidateBody;
    } catch {
      return {};
    }
  }
  return {};
}

async function purgeEdgeTags(tags: string[]): Promise<{
  status: "purged" | "skipped" | "error";
  tags: string[];
  error?: string;
}> {
  const unique = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { status: "skipped", tags: [] };
  }

  if (!isAtlasEdgePlatform()) {
    // Still invoke so the package logs its local skip message.
    try {
      await purgeTags(unique.slice(0, EDGE_PURGE_TAGS_BATCH_SIZE));
    } catch {
      // ignore — off-platform
    }
    return { status: "skipped", tags: unique };
  }

  try {
    for (let i = 0; i < unique.length; i += EDGE_PURGE_TAGS_BATCH_SIZE) {
      const batch = unique.slice(i, i + EDGE_PURGE_TAGS_BATCH_SIZE);
      await purgeTags(batch);
    }
    return { status: "purged", tags: unique };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", tags: unique, error: message };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = parseBody(req);
  const expected = getExpectedSecret();
  if (!expected) {
    return res.status(500).json({
      ok: false,
      error: "REVALIDATE_SECRET (or FAUSTWP_SECRET_KEY) is not configured",
    });
  }

  const secret =
    headerSecret(req) ||
    queryValues(req, "secret")[0] ||
    body.secret?.trim() ||
    "";

  if (secret !== expected) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }

  const mapped = mapWpRevalidatePayload(body);
  const tags = new Set<string>([
    ...collectExplicitTags(req, body),
    ...(mapped?.tags ?? []),
  ]);
  const paths = new Set<string>([
    ...collectExplicitPaths(req, body),
    ...(mapped?.paths ?? []),
  ]);

  for (const tag of tags) {
    for (const path of WP_CACHE_TAG_PATHS[tag] ?? []) {
      paths.add(path);
    }
  }

  const refreshLayout =
    body.layout === true ||
    mapped?.layout === true ||
    queryValues(req, "layout")[0] === "1" ||
    [...tags].some((tag) => WP_CACHE_TAGS_THAT_REFRESH_LAYOUT.has(tag));

  if (refreshLayout) {
    for (const root of WP_LAYOUT_ROOT_PATHS) {
      paths.add(root);
    }
  }

  if (tags.size === 0 && paths.size === 0) {
    return res.status(400).json({
      ok: false,
      error:
        "Provide tag/path, or a WordPress webhook body with post_type (and optional slug)",
      hint: {
        tags: Object.values(WP_CACHE_TAGS),
        manual: `/api/revalidate?secret=…&tag=${WP_CACHE_TAGS.programs}`,
        wordpress: {
          post_type: "program",
          slug: "example-program",
        },
      },
    });
  }

  const revalidatedPaths: string[] = [];
  const errors: string[] = [];

  if (mapped?.allCenterDetails) {
    try {
      for (const path of await fetchCenterDetailPaths()) {
        paths.add(path);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`center slugs: ${message}`);
    }
  }

  for (const path of paths) {
    try {
      await res.revalidate(path);
      revalidatedPaths.push(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${path}: ${message}`);
    }
  }

  if (errors.length > 0 && revalidatedPaths.length === 0) {
    return res.status(500).json({
      ok: false,
      error: "Origin revalidation failed; edge was not purged",
      errors,
      revalidated: { paths: [], tags: [...tags] },
      source: mapped ? "wordpress-webhook" : "manual",
      now: Date.now(),
    });
  }

  // Origin first, then edge — never purge edge when origin refresh fully failed.
  const edge = await purgeEdgeTags([...tags]);

  return res.status(200).json({
    ok: true,
    revalidated: {
      paths: revalidatedPaths,
      tags: [...tags],
    },
    edge: {
      status: edge.status,
      tags: edge.tags,
      ...(edge.error ? { error: edge.error } : {}),
    },
    ...(errors.length ? { revalidateErrors: errors } : {}),
    source: mapped ? "wordpress-webhook" : "manual",
    now: Date.now(),
  });
}
