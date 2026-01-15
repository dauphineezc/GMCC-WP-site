// src/app/programs/virtual-fitness/page.tsx
import { redirect } from "next/navigation";

export default function VirtualFitnessPage() {
  redirect("/programs?programArea=Virtual+Fitness");
}

