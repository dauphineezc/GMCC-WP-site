// src/app/programs/personal-training/page.tsx
import { redirect } from "next/navigation";

export default function PersonalTrainingPage() {
  redirect("/programs?programArea=Personal+Training");
}

