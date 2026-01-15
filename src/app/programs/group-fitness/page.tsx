// src/app/programs/group-fitness/page.tsx
import { redirect } from "next/navigation";

export default function GroupFitnessPage() {
  // Redirect to the main programs page with group fitness filter
  redirect("/programs?programArea=Group+Fitness");
}

