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

export const PROGRAMS_DIRECTORY_VARIANT_TITLES: Record<DirectoryHeaderVariant, string> = {
  camps: "Camps",
  aquatics: "Aquatics",
  "sports-and-recreation": "Sports and Recreation",
  fitness: "Fitness",
  childcare: "Childcare",
  "group-fitness": "Group Fitness",
  "middle-school-athletics": "Middle School Athletics",
  "personal-training": "Personal Training",
  "renew-active": "Renew Active / One Pass",
  silversneakers: "SilverSneakers",
  "tennis-lessons": "Tennis Lessons",
  community: "Community",
};

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
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.campsDirectoryPageFields)}
          className={className}
        />
      );
    case "aquatics":
      return (
        <AquaticsDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.aquaticsDirectoryPageFields)}
          className={className}
        />
      );
    case "sports-and-recreation":
      return (
        <SportsAndRecreationDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.sportsAndRecreationDirectoryPageFields)}
          className={className}
        />
      );
    case "fitness":
      return (
        <FitnessDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.fitnessDirectoryPageFields)}
          className={className}
        />
      );
    case "childcare":
      return (
        <ChildcareDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.childcareDirectoryPageFields)}
          className={className}
        />
      );
    case "group-fitness":
      return (
        <GroupFitnessDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.groupFitnessDirectoryPageFields)}
          className={className}
        />
      );
    case "middle-school-athletics":
      return (
        <MiddleSchoolAthleticsDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.middleSchoolAthleticsDirectoryPageFields)}
          className={className}
        />
      );
    case "personal-training":
      return (
        <PersonalTrainingDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.personalTrainingDirectoryPageFields)}
          className={className}
        />
      );
    case "tennis-lessons":
      return (
        <TennisLessonsDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.tennisLessonsDirectoryPageFields)}
          className={className}
        />
      );
    case "renew-active":
      return (
        <RenewActiveDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.renewActiveDirectoryPageFields)}
          className={className}
        />
      );
    case "silversneakers":
      return (
        <SilversneakersDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.silversneakersDirectoryPageFields)}
          className={className}
        />
      );
    case "community":
      return (
        <CommunityDirectoryHeader
          data={withFallbackTitle(PROGRAMS_DIRECTORY_VARIANT_TITLES[variant], acf.communityDirectoryPageFields)}
          className={className}
        />
      );
    default:
      return null;
  }
}