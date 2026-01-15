// src/app/programs/personal-training/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PersonalTrainingPage() {
  redirect("/programs?programArea=Fitness");
}