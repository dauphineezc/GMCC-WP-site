import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  fetchPageWithHeroFields,
  resolvePhotoWaveHeaderProps,
} from "@/lib/pageHeroFields";
import { scheduleEmbedUrl } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pool Availability",
  description:
    "View drop-in swim schedules at the Community Center pool.",
};

export default async function PoolAvailabilityPage() {
  const page = await fetchPageWithHeroFields("pool-availability");
  const hero = resolvePhotoWaveHeaderProps(page, "Pool Availability");

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl ?? "/images/PoolPhoto.png"}
        ctas={hero.ctas}
      />

      <div className="page-section stack-8">
        <h3 className="text-xl text-neutral-700 mt-0 mb-4">
          Interested in swimming laps, enjoying a fun swim night with your family, or just
          relaxing by the pool? View the drop-in swim schedule at the Community Center below.
        </h3>
        <p className="text-neutral-700 text-xl mt-0 mb-8">Click on an activity for more information.</p>

        <div className="gmcc-schedule-embed mt-4">
          <iframe
            src={scheduleEmbedUrl({ type: "dropin", sub: "aquatics" })}
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <h2 className="text-2xl font-bold text-gmcc-navy tracking-tight sm:text-3xl mb-4">Pool Rules</h2>
        <p className="text-neutral-700 text-xl mt-0 mb-4">
          Please review the pool rules before visiting the pool.
        </p>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm w-2/3">
          <ul className="list-disc pl-5 text-base text-neutral-700">
            <li>Children under 5 require an adult (18+) in the water within arm&apos;s reach</li>
            <li>Ages 6-11 require a supervising adult (18+) on deck</li>
            <li>Ages 12 and older may access the pool independently</li>
            <li>Ages 6 and under must pass swim test or wear life jacket to access the lap area</li>
            <li>Consider underlying health conditions before use</li>
            <li>Adults responsible for supervising their children</li>
            <li>Short whistle - look to the lifeguards for directions</li>
            <li>Long whistle - exit pool immediately</li>
            <li>Spill-proof drinks permitted in seating areas only</li>
            <li>
              People with open sores, rashes, unhealed wounds, or infectious conditions not permitted
            </li>
            <li>Appropriate swim attire must be worn</li>
            <li>Shower required before entering the pool</li>
            <li className="text-gmcc-navy font-bold">The following are not permitted:</li>
            <ul className="list-disc pl-10 text-base text-neutral-700">
              <li>Diving, jumping, or running</li>
              <li>Rough play including but not limited to: dunking, pushing, throwing, etc</li>
              <li>Street shoes on deck</li>
              <li>Glass</li>
              <li>Food or gum</li>
              <li>Beach toys</li>
            </ul>
          </ul>
          <p className="text-italic text-neutral-700 text-xl mt-4 mb-0">
            All other policies provided in the Greater Midland Handbook.
          </p>
        </div>
      </div>
    </main>
  );
}
