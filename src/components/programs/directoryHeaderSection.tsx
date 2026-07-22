import React from "react";
import { AquaticsDirectoryHeader } from "./directory-sections/aquaticsDirectoryHeader";
import { CampsDirectoryHeader } from "./directory-sections/campsDirectoryHeader";
import { ChildcareDirectoryHeader } from "./directory-sections/childcareDirectoryHeader";
import {
  GroupFitnessDirectoryHeader,
  type GroupFitnessDirectoryHeaderData,
} from "./directory-sections/groupFitnessDirectoryHeader";
import { PersonalTrainingDirectoryHeader } from "./directory-sections/personalTrainingDirectoryHeader";
import { RenewActiveDirectoryHeader } from "./directory-sections/renewActiveDirectoryHeader";
import { SilversneakersDirectoryHeader } from "./directory-sections/silversneakersDirectoryHeader";
import { TennisLessonsDirectoryHeader } from "./directory-sections/tennisLessonsDirectoryHeader";
import type { DirectoryHeaderData } from "./directoryHeaderShared";
import { MiddleSchoolSportsDirectoryHeader } from "./directory-sections/middleSchoolSportsDirectoryHeader";
import { CommunityDirectoryHeader } from "./directory-sections/communityDirectoryHeader";
import { SportsAndRecreationDirectoryHeader } from "./directory-sections/sportsAndRecreationDirectoryHeader";

export type { DirectoryHeaderData };

export type ProgramsPageACF = {
  aquaticsDirectoryPageFields?: DirectoryHeaderData | null;
  sportsAndRecreationDirectoryPageFields?: DirectoryHeaderData | null;
  campsDirectoryPageFields?: DirectoryHeaderData | null;
  childcareDirectoryPageFields?: DirectoryHeaderData | null;
  groupFitnessDirectoryPageFields?: GroupFitnessDirectoryHeaderData | null;
  middleSchoolSportsDirectoryPageFields?: DirectoryHeaderData | null;
  personalTrainingDirectoryPageFields?: DirectoryHeaderData | null;
  renewActiveDirectoryPageFields?: DirectoryHeaderData | null;
  silversneakersDirectoryPageFields?: DirectoryHeaderData | null;
  tennisLessonsDirectoryPageFields?: DirectoryHeaderData | null;
  communityDirectoryPageFields?: DirectoryHeaderData | null;
};

export type DirectoryHeaderVariant =
  | "camps"
  | "aquatics"
  | "sports-and-recreation"
  | "childcare"
  | "group-fitness"
  | "middle-school-sports"
  | "personal-training"
  | "renew-active"
  | "silversneakers"
  | "tennis-lessons"
  | "community";

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
    case "sports-and-recreation":
      return (
        <SportsAndRecreationDirectoryHeader
          data={{ header: "Sports and Recreation", ...(acf.sportsAndRecreationDirectoryPageFields ?? {}) }}
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
    case "renew-active":
      return (
        <RenewActiveDirectoryHeader
          data={{ header: "Renew Active / One Pass", ...(acf.renewActiveDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "silversneakers":
      return (
        <SilversneakersDirectoryHeader
          data={{ header: "SilverSneakers", ...(acf.silversneakersDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    case "community":
      return (
        <CommunityDirectoryHeader
          data={{ header: "Community", ...(acf.communityDirectoryPageFields ?? {}) }}
          className={className}
        />
      );
    default:
      return null;
  }
}