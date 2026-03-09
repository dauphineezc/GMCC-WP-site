// components/programs/directory-sections/TennisLessonsDirectoryHeader.tsx
import React from "react";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export function TennisLessonsDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  return <DirectoryHeaderShell data={data} className={className} />;
}