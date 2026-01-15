// src/app/programs/virtual-fitness/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function VirtualFitnessPage() {
  redirect("/programs?programArea=Fitness");
}
