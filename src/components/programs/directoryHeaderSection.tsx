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
import { MiddleSchoolAthleticsDirectoryHeader } from "./directory-sections/middleSchoolAthleticsDirectoryHeader";
import { CommunityDirectoryHeader } from "./directory-sections/communityDirectoryHeader";
import { SportsAndRecreationDirectoryHeader } from "./directory-sections/sportsAndRecreationDirectoryHeader";
import { FitnessDirectoryHeader } from "./directory-sections/fitnessDirectoryHeader";

export type { DirectoryHeaderData };

export type ProgramsPageACF = {
  aquaticsDirectoryPageFields?: DirectoryHeaderData | null;
  sportsAndRecreationDirectoryPageFields?: DirectoryHeaderData | null;
  fitnessDirectoryPageFields?: DirectoryHeaderData | null;
  campsDirectoryPageFields?: DirectoryHeaderData | null;
  childcareDirectoryPageFields?: DirectoryHeaderData | null;
  groupFitnessDirectoryPageFields?: GroupFitnessDirectoryHeaderData | null;
  middleSchoolAthleticsDirectoryPageFields?: DirectoryHeaderData | null;
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
  | "fitness"
  | "childcare"
  | "group-fitness"
  | "middle-school-athletics"
  | "personal-training"
  | "renew-active"
  | "silversneakers"
  | "tennis-lessons"
  | "community";

/** WP returns `header: null` for empty ACF fields, which would override a spread-in default. */
function withFallbackTitle<T extends DirectoryHeaderData>(
  fallback: string,
  fields: T | null | undefined,
): T {
  const wpTitle = (fields?.header ?? "").toString().trim();
  return { ...(fields ?? ({} as T)), header: wpTitle || fallback };
}

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
          data={withFallbackTitle("Camps", acf.campsDirectoryPageFields)}
          className={className}
        />
      );
    case "aquatics":
      return (
        <AquaticsDirectoryHeader
          data={withFallbackTitle("Aquatics", acf.aquaticsDirectoryPageFields)}
          className={className}
        />
      );
    case "sports-and-recreation":
      return (
        <SportsAndRecreationDirectoryHeader
          data={withFallbackTitle("Sports and Recreation", acf.sportsAndRecreationDirectoryPageFields)}
          className={className}
        />
      );
    case "fitness":
      return (
        <FitnessDirectoryHeader
          data={withFallbackTitle("Fitness", acf.fitnessDirectoryPageFields)}
          className={className}
        />
      );
    case "childcare":
      return (
        <ChildcareDirectoryHeader
          data={withFallbackTitle("Childcare", acf.childcareDirectoryPageFields)}
          className={className}
        />
      );
    case "group-fitness":
      return (
        <GroupFitnessDirectoryHeader
          data={withFallbackTitle("Group Fitness", acf.groupFitnessDirectoryPageFields)}
          className={className}
        />
      );
    case "middle-school-athletics":
      return (
        <MiddleSchoolAthleticsDirectoryHeader
          data={withFallbackTitle("Middle School Athletics", acf.middleSchoolAthleticsDirectoryPageFields)}
          className={className}
        />
      );
    case "personal-training":
      return (
        <PersonalTrainingDirectoryHeader
          data={withFallbackTitle("Personal Training", acf.personalTrainingDirectoryPageFields)}
          className={className}
        />
      );
    case "tennis-lessons":
      return (
        <TennisLessonsDirectoryHeader
          data={withFallbackTitle("Tennis Lessons", acf.tennisLessonsDirectoryPageFields)}
          className={className}
        />
      );
    case "renew-active":
      return (
        <RenewActiveDirectoryHeader
          data={withFallbackTitle("Renew Active / One Pass", acf.renewActiveDirectoryPageFields)}
          className={className}
        />
      );
    case "silversneakers":
      return (
        <SilversneakersDirectoryHeader
          data={withFallbackTitle("SilverSneakers", acf.silversneakersDirectoryPageFields)}
          className={className}
        />
      );
    case "community":
      return (
        <CommunityDirectoryHeader
          data={withFallbackTitle("Community", acf.communityDirectoryPageFields)}
          className={className}
        />
      );
    default:
      return null;
  }
}