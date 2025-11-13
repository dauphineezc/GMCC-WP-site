import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const dm = await draftMode();   // 👈 await it
  dm.disable();
  return NextResponse.redirect(new URL("/", req.url));
}