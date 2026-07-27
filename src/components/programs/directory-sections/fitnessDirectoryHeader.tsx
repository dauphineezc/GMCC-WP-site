// components/programs/directory-sections/FitnessDirectoryHeader.tsx
import React from "react";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export function FitnessDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  return <DirectoryHeaderShell data={data} className={className} />;
}
