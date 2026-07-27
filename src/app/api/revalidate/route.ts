import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ANNOUNCEMENTS_CACHE_TAG } from "@/lib/wordpress/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevalidateBody = {
  secret?: string;
  tag?: string;
  tags?: string[];
  path?: string;
  paths?: string[];
  /** When true, also refresh the root layout (covers global announcement in Navbar). */
  layout?: boolean;
};

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

function collectTags(req: NextRequest, body: RevalidateBody): string[] {
  const fromQuery = req.nextUrl.searchParams.getAll("tag");
  const fromBody = [
    ...(body.tag ? [body.tag] : []),
    ...(Array.isArray(body.tags) ? body.tags : []),
  ];
  return [...new Set([...fromQuery, ...fromBody].map((t) => t.trim()).filter(Boolean))];
}

function collectPaths(req: NextRequest, body: RevalidateBody): string[] {
  const fromQuery = req.nextUrl.searchParams.getAll("path");
  const fromBody = [
    ...(body.path ? [body.path] : []),
    ...(Array.isArray(body.paths) ? body.paths : []),
  ];
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

  const tags = collectTags(req, body);
  const paths = collectPaths(req, body);
  const refreshLayout =
    body.layout === true ||
    req.nextUrl.searchParams.get("layout") === "1" ||
    tags.includes(ANNOUNCEMENTS_CACHE_TAG);

  if (tags.length === 0 && paths.length === 0 && !refreshLayout) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide at least one tag or path (e.g. tag=announcements)",
        hint: {
          tag: ANNOUNCEMENTS_CACHE_TAG,
          example: `/api/revalidate?secret=…&tag=${ANNOUNCEMENTS_CACHE_TAG}`,
        },
      },
      { status: 400 },
    );
  }

  const revalidated: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  for (const tag of tags) {
    // Immediate expiry: CMS webhooks should not serve stale announcement HTML.
    revalidateTag(tag, { expire: 0 });
    revalidated.tags.push(tag);
  }

  for (const path of paths) {
    revalidatePath(path);
    revalidated.paths.push(path);
  }

  // Announcement bar lives in the root layout — invalidate layout tree site-wide.
  if (refreshLayout) {
    revalidatePath("/", "layout");
    if (!revalidated.paths.includes("/")) {
      revalidated.paths.push("/ (layout)");
    }
  }

  return NextResponse.json({ ok: true, revalidated, now: Date.now() });
}

export async function GET(req: NextRequest) {
  return handleRevalidate(req);
}

export async function POST(req: NextRequest) {
  return handleRevalidate(req);
}
