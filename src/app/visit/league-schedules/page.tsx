import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { LEAGUE_SCHEDULE_EMBED_URL } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/visit/league-schedules");
}

export default async function LeagueSchedulesPage() {
  const page = await fetchPageWithHeroFields("league-schedules");
  const hero = resolvePhotoWaveHeaderProps(page, "League Schedules");

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/LeaguePhoto.png"}
        ctas={hero.ctas}
      />

      <div className="page-section stack-8">
        <h3 className="text-xl text-neutral-700 mt-0 mb-4">
          Need to check the schedule for a league you&apos;re playing in, or want to watch a thrilling
          game? View the schedules for all in-house leagues (including basketball, volleyball, and more)
          below.
        </h3>
        <p className="text-neutral-700 text-xl mt-0 mb-8">
          Select the league you&apos;re interested in to view the schedule.
        </p>

        <div className="gmcc-schedule-embed mt-4">
          <iframe
            src={LEAGUE_SCHEDULE_EMBED_URL}
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </main>
  );
}
