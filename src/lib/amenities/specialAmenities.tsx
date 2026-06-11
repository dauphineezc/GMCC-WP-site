import type { ReactNode } from "react";
import AdvantageProShopSection from "@/components/amenities/advantageProShopSection";

type SpecialAmenityRenderArgs = {
  amenityPageFields?: {
    advantageProShopFields?: {
      contactInformation?: {
        phone?: string | null;
        email?: string | null;
        pointOfContactName?: string | null;
      } | null;
      hours?: {
        mondayHours?: string | null;
        tuesdayHours?: string | null;
        wednesdayHours?: string | null;
        thursdayHours?: string | null;
        fridayHours?: string | null;
        saturdayHours?: string | null;  
        sundayHours?: string | null;
      } | null;
      gallery?: unknown;
    } | null;
    [key: string]: unknown;
  } | null;
};

export type SpecialAmenityConfig = {
  slug: string;
  /** Field name in amenityPageFields that mirrors the amenity slug. */
  groupFieldName: string;
  renderSection: (args: SpecialAmenityRenderArgs) => ReactNode;
};

export const specialAmenities: Record<string, SpecialAmenityConfig> = {
  "advantage-pro-shop": {
    slug: "advantage-pro-shop",
    groupFieldName: "advantageProShopFields",
    renderSection: ({ amenityPageFields }) => (
      <AdvantageProShopSection
        advantageProShopFields={amenityPageFields?.advantageProShopFields ?? null}
      />
    ),
  },
};

