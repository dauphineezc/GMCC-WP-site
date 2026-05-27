import React from "react";
import { AquaticsDirectoryHeader } from "./directory-sections/aquaticsDirectoryHeader";
import { CampsDirectoryHeader } from "./directory-sections/campsDirectoryHeader";
import { ChildcareDirectoryHeader } from "./directory-sections/childcareDirectoryHeader";
import {
  GroupFitnessDirectoryHeader,
  type GroupFitnessDirectoryHeaderData,
} from "./directory-sections/groupFitnessDirectoryHeader";
import { PersonalTrainingDirectoryHeader } from "./directory-sections/personalTrainingDirectoryHeader";
import { TennisLessonsDirectoryHeader } from "./directory-sections/tennisLessonsDirectoryHeader";
import type { DirectoryHeaderData, DirectoryTrainer } from "./directoryHeaderShared";
import { MiddleSchoolSportsDirectoryHeader } from "./directory-sections/middleSchoolSportsDirectoryHeader";

export type { DirectoryHeaderData, DirectoryTrainer };

export type ProgramsPageACF = {
  aquaticsDirectoryPageFields?: DirectoryHeaderData | null;
  campsDirectoryPageFields?: DirectoryHeaderData | null;
  childcareDirectoryPageFields?: DirectoryHeaderData | null;
  groupFitnessDirectoryPageFields?: GroupFitnessDirectoryHeaderData | null;
  middleSchoolSportsDirectoryPageFields?: DirectoryHeaderData | null;
  personalTrainingDirectoryPageFields?: DirectoryHeaderData | null;
  tennisLessonsDirectoryPageFields?: DirectoryHeaderData | null;
};

export type DirectoryHeaderVariant =
  | "camps"
  | "aquatics"
  | "childcare"
  | "group-fitness"
  | "middle-school-sports"
  | "personal-training"
  | "tennis-lessons";

export function DirectoryHeaderSection({
  variant,
  acf,
  className,
}: {
  variant: DirectoryHeaderVariant;
  acf: ProgramsPageACF;
  className?: string;
}) {
  switch (variant) {
    case "camps":
      return (
        <CampsDirectoryHeader
          data={{ header: "Camps", ...(acf.campsDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "aquatics":
      return (
        <AquaticsDirectoryHeader
          data={{ header: "Aquatics", ...(acf.aquaticsDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "childcare":
      return (
        <ChildcareDirectoryHeader
          data={{ header: "Childcare", ...(acf.childcareDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "group-fitness":
      return (
        <GroupFitnessDirectoryHeader
          data={{ header: "Group Fitness", ...(acf.groupFitnessDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "middle-school-sports":
      return (
        <MiddleSchoolSportsDirectoryHeader
          data={{ header: "Middle School Sports", ...(acf.middleSchoolSportsDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "personal-training":
      return (
        <PersonalTrainingDirectoryHeader
          data={{ header: "Personal Training", ...(acf.personalTrainingDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "tennis-lessons":
      return (
        <TennisLessonsDirectoryHeader
          data={{ header: "Tennis Lessons", ...(acf.tennisLessonsDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    default:
      return null;
  }
}