// components/programs/directory-sections/CommunityDirectoryHeader.tsx
import React from "react";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export function CommunityDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  return (
    <div className={className}>
      <DirectoryHeaderShell data={data} />
    </div>
  );
}