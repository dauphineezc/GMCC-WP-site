import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { LEAGUE_SCHEDULE_EMBED_URL } from "@/lib/constants";
import type { Metadata } from "next";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import WysiwygText from "@/components/wysiwygText";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/visit/league-schedules");
}

const LEAGUE_SCHEDULES_EXTRA_FIELDS = `
  leagueSchedulesPageFields {
    header
    description
    lmsInstructions
  }
`;

type LeagueSchedulesPageFields = {
  header?: string | null;
  description?: string | null;
  lmsInstructions?: string | null;
};

type LeagueSchedulesExtra = {
  leagueSchedulesPageFields?: LeagueSchedulesPageFields | null;
};

export default async function LeagueSchedulesPage() {
  const page = await fetchPageWithHeroFields<LeagueSchedulesExtra>(
    "league-schedules",
    LEAGUE_SCHEDULES_EXTRA_FIELDS,
  );
  const hero = resolvePhotoWaveHeaderProps(page, "League Schedules");
  const fields = page?.leagueSchedulesPageFields;

  const header = fields?.header?.trim() || null;
  const description = fields?.description?.trim() || null;
  const lmsInstructions = fields?.lmsInstructions?.trim() || null;

  return (
    <main>
      {/* <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/LeaguePhoto.png"}
        imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      /> */}

      <SolidNavyWaveHeader title={hero.title} description={hero.subheader} />

      <div className="page-section stack-8">
        {header ? <h1 className="h1">{header}</h1> : null}
        {description ? <WysiwygText html={description} /> : null}
        {lmsInstructions ? <p className="body">{lmsInstructions}</p> : null}

        <div className="gmcc-schedule-embed mt-4">
          <iframe
            src={LEAGUE_SCHEDULE_EMBED_URL}
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            allow="storage-access *"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </main>
  );
}
