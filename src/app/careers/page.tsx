import { permanentRedirect } from "next/navigation";
import { ADP_LANDING_PAGE_URL } from "@/lib/constants";

/** Careers UI is archived in `page.archived.tsx`; nav/footer link to ADP directly. */
export default function CareersPage() {
  permanentRedirect(ADP_LANDING_PAGE_URL);
}
