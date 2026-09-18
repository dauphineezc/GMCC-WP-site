import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  WP_CACHE_TAGS,
  WP_CACHE_TAG_PATHS,
  WP_CACHE_TAG_LAYOUT_PATHS,
  WP_CACHE_TAGS_THAT_REFRESH_LAYOUT,
} from "@/lib/revalidate";
import {
  mapWpRevalidatePayload,
  type WpRevalidateWebhookBody,
} from "@/lib/wordpress/mapWpRevalidatePayload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevalidateBody = WpRevalidateWebhookBody;

function getExpectedSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET || process.env.FAUSTWP_SECRET_KEY;
}

function extractSecret(req: NextRequest, body: RevalidateBody): string {
  const header =
    req.headers.get("x-revalidate-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return (
    header?.trim() ||
    req.nextUrl.searchParams.get("secret")?.trim() ||
    body.secret?.trim() ||
    ""
  );
}

function arrayOf(values: string[] | undefined): string[] {
  return Array.isArray(values) ? values : [];
}

function collectExplicitTags(req: NextRequest, body: RevalidateBody): string[] {
  const fromQuery = req.nextUrl.searchParams.getAll("tag");
  const fromBody = [...(body.tag ? [body.tag] : []), ...arrayOf(body.tags)];
  return [...new Set([...fromQuery, ...fromBody].map((t) => t.trim()).filter(Boolean))];
}

function collectExplicitPaths(req: NextRequest, body: RevalidateBody): string[] {
  const fromQuery = req.nextUrl.searchParams.getAll("path");
  const fromBody = [...(body.path ? [body.path] : []), ...arrayOf(body.paths)];
  return [...new Set([...fromQuery, ...fromBody].map((p) => p.trim()).filter(Boolean))];
}

async function handleRevalidate(req: NextRequest) {
  let body: RevalidateBody = {};
  if (req.method === "POST") {
    try {
      body = (await req.json()) as RevalidateBody;
    } catch {
      body = {};
    }
  }

  const expected = getExpectedSecret();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET (or FAUSTWP_SECRET_KEY) is not configured" },
      { status: 500 },
    );
  }

  if (extractSecret(req, body) !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
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
    req.nextUrl.searchParams.get("layout") === "1" ||
    [...tags].some((tag) => WP_CACHE_TAGS_THAT_REFRESH_LAYOUT.has(tag));

  if (tags.size === 0 && paths.size === 0 && !refreshLayout) {
    return NextResponse.json(
      {
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
      },
      { status: 400 },
    );
  }

  const revalidated: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  for (const tag of tags) {
    // Immediate expiry so CMS webhooks do not serve stale GraphQL Data Cache.
    revalidateTag(tag, { expire: 0 });
    revalidated.tags.push(tag);
  }

  for (const path of paths) {
    if (WP_CACHE_TAG_LAYOUT_PATHS.has(path)) {
      revalidatePath(path, "layout");
    } else {
      revalidatePath(path);
    }
    revalidated.paths.push(path);
  }

  if (refreshLayout) {
    revalidatePath("/", "layout");
    if (!revalidated.paths.includes("/ (layout)")) {
      revalidated.paths.push("/ (layout)");
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated,
    source: mapped ? "wordpress-webhook" : "manual",
    now: Date.now(),
  });
}

export async function GET(req: NextRequest) {
  return handleRevalidate(req);
}

export async function POST(req: NextRequest) {
  return handleRevalidate(req);
}
