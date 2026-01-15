// src/app/programs/silversneakers/page.tsx
import { redirect } from "next/navigation";

export default function SilverSneakersPage() {
  redirect("/programs?programArea=SilverSneakers");
}

