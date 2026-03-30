import React from "react";
import TrainersCarousel from "@/components/trainersCarousel";
import { DirectoryHeaderData, DirectoryHeaderShell } from "../directoryHeaderShared";

export function TennisLessonsDirectoryHeader({
  data,
  className,
}: {
  data: DirectoryHeaderData | null | undefined;
  className?: string;
}) {
  const trainers = (data?.trainers ?? []).filter(
    (trainer) => !!trainer?.name || !!trainer?.jobTitle || !!trainer?.photo?.sourceUrl,
  );

  const dataWithoutTrainers: DirectoryHeaderData = {
    ...(data ?? {}),
    trainers: [],
  };

  return (
    <>
      <DirectoryHeaderShell data={dataWithoutTrainers} className={className} />
      {trainers.length ? (
        <TrainersCarousel trainers={trainers} title="Meet the instructors" />
      ) : null}
    </>
  );
}
