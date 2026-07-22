// components/programs/directory-sections/SportsAndRecreationDirectoryHeader.tsx
import React from "react";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export function SportsAndRecreationDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  return <DirectoryHeaderShell data={data} className={className} />;
}
