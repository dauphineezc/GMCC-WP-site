// src/app/programs/group-fitness/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function GroupFitnessPage() {
  redirect("/programs?offeringType=Class&programArea=Fitness");
}