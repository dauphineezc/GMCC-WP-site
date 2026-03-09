// components/programs/directory-sections/GroupFitnessDirectoryInfo.tsx
import React from "react";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export function GroupFitnessDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  return <DirectoryHeaderShell data={data} className={className} />;
}