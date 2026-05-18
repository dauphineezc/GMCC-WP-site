"use client";

import React from "react";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";
import SponsorsGrid from "@/components/sponsorsGrid";
import type { Sponsor } from "@/components/sponsorsGrid";

function toSponsorGridItems(sponsors: DirectoryHeaderData["sponsors"]): Sponsor[] {
  if (!sponsors?.length) return [];
  return sponsors.flatMap((s) => {
    if (!s?.logoUrl) return [];
    return [{
      name: s.name ?? "",
      logoUrl: s.logoUrl,
      logoAlt: s.logoAlt ?? "",
      link: s.link ?? null,
      tier: s.tier ?? null,
    }];
  });
}

export function MiddleSchoolSportsDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  const sponsors = toSponsorGridItems(data?.sponsors);
  return (
    <div className={"grid grid-cols-1 md:grid-cols-3 gap-4"}>
      <div className="md:col-span-2">
        <DirectoryHeaderShell data={data} />
      </div>
      <div className="md:col-span-1 flex items-center justify-center">
        {sponsors.length > 0 && (
          <div>
            <SponsorsGrid sponsors={sponsors} title="Thank You to Our Sponsors" />
          </div>
        )}
      </div>
    </div>
  );
}