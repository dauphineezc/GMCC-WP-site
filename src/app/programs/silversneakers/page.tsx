// src/app/programs/silversneakers/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SilversneakersPage() {
  redirect("/programs?Audience=Senior");
}

