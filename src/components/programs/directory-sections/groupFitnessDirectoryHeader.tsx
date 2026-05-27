import React from "react";
import { DropInCareSection } from "@/components/dropInCareSection";
import type { DropInCareFields } from "@/lib/dropInCareFields";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export type GroupFitnessDirectoryHeaderData = DirectoryHeaderData & Partial<DropInCareFields>;

export function GroupFitnessDirectoryHeader({
  data,
  className,
}: {
  data: GroupFitnessDirectoryHeaderData | null | undefined;
  className?: string;
}) {
  const safe = data ?? ({} as GroupFitnessDirectoryHeaderData);

  return (
    <div className={className}>
      <DirectoryHeaderShell data={safe} />
      <DropInCareSection
        fields={{
          dropInCareHeader: safe.dropInCareHeader ?? "",
          dropInCareDescription: safe.dropInCareDescription ?? "",
          childwatchCard: safe.childwatchCard ?? {
            header: "",
            body: "",
            ctaLabel: "",
            ctaHref: "",
            icon: { src: "", alt: "" },
          },
          theZoneCard: safe.theZoneCard ?? {
            header: "",
            body: "",
            ctaLabel: "",
            ctaHref: "",
            icon: { src: "", alt: "" },
          },
        }}
      />
    </div>
  );
}
