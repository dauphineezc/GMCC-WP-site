// src/app/programs/lifeguard/page.tsx
import { redirect } from "next/navigation";

export default function LifeguardPage() {
  redirect("/programs?programArea=Aquatics");
}

