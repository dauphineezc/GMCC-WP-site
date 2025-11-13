import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") ?? "";
  const slug = searchParams.get("slug") ?? "";

  if (secret !== process.env.FAUSTWP_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
  }

  const dm = await draftMode();   // 👈 await it
  dm.enable();

  return NextResponse.redirect(new URL(slug ? `/blog/${slug}` : "/", req.url));
}