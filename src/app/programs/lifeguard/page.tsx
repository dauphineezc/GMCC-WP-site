// src/app/programs/lifeguard/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LifeguardPage() {
  redirect("/programs?programArea=Aquatics");
}
