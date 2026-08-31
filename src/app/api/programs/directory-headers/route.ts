import { NextResponse } from "next/server";
import { fetchProgramsDirectoryHeaders } from "@/lib/programs/fetchDirectoryHeaders";

export const dynamic = "force-dynamic";

/** On-demand directory headers for /programs when the server skipped them (plain URL). */
export async function GET() {
  try {
    const data = await fetchProgramsDirectoryHeaders();
    return NextResponse.json(data);
  } catch (error) {
    console.error("directory-headers API failed:", error);
    return NextResponse.json({ error: "Failed to load directory headers" }, { status: 500 });
  }
}
