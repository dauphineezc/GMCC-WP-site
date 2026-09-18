import { NextResponse } from "next/server";
import { fetchEventsDirectoryHeaders } from "@/lib/events/fetchDirectoryHeaders";

export const dynamic = "force-dynamic";

/** On-demand event directory headers when the ISR shell is missing specialty content. */
export async function GET() {
  try {
    const data = await fetchEventsDirectoryHeaders();
    return NextResponse.json(data);
  } catch (error) {
    console.error("events directory-headers API failed:", error);
    return NextResponse.json({ error: "Failed to load directory headers" }, { status: 500 });
  }
}
