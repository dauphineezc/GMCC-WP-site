// components/programs/directory-sections/AquaticsDirectoryHeader.tsx
import React from "react";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export function AquaticsDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  return <DirectoryHeaderShell data={data} className={className} />;
}