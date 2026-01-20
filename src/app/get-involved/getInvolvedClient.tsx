"use client";

import { useMemo, useState } from "react";
import Accordion from "@/components/accordion";
import SponsorshipTabs from "./sponsorshipTabs";

type WPImageNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
};

type MaybeImage = { node?: WPImageNode | null } | null;

type Race = { raceName?: string | null; raceDetails?: string | null } | null;

type GetInvolvedFields = {
  impactBlurb?: string | null;

  volunteerGroup?: {
    volunteerCardSummary?: string | null;
    volunteerLongDescription?: string | null;
    volunteerApplication?: string | null;
    volunteerImage?: MaybeImage;
  } | null;

  donateGroup?: {
    donateCardSummary?: string | null;
    donateLongDescription?: string | null;
    physicalDonationDescription?: string | null;
    physicalDonationList?: string | null;
    physicalDonationWishlist?: string | null;
    donationImage?: MaybeImage;
  } | null;

  sponsorGroup?: {
    sponsorCardSummary?: string | null;
    sponsorLongDescription?: string | null;

    raceSponsorship?: {
      raceSponsorshipSummary?: string | null;
      race1?: Race;
      race2?: Race;
      race3?: Race;
      race4?: Race;
      race5?: Race;
      raceSponsorshipApplication?: string | null;
      raceSponsorshipImage?: MaybeImage;
    } | null;

    leagueSponsorship?: {
      leagueSponsorshipDetails?: string | null;
      leagueSponsorshipApplication?: string | null;
      leagueSponsorshipImage?: MaybeImage;
    } | null;

    centerSponsorship?: {
      centerSponsorshipDetails?: string | null;
      centerSponsorshipApplication?: string | null;
      centerSponsorshipImage?: MaybeImage;
    } | null;
  } | null;
};

function Img({ image, fallbackAlt }: { image?: MaybeImage; fallbackAlt: string }) {
  const src = image?.node?.sourceUrl ?? "";
  if (!src) return null;

  return (
    <img
      src={src}
      alt={image?.node?.altText || fallbackAlt}
      className="w-full h-full object-cover rounded-md"
      loading="lazy"
      decoding="async"
    />
  );
}

function TextBlock({ text }: { text?: string | null }) {
  if (!text) return null;
  return <p className="body whitespace-pre-line">{text}</p>;
}

export default function GetInvolvedClient({ fields }: { fields: GetInvolvedFields | null }) {
  const volunteer = fields?.volunteerGroup ?? null;
  const donate = fields?.donateGroup ?? null;
  const sponsor = fields?.sponsorGroup ?? null;

  const [sponsorTab, setSponsorTab] = useState<"race" | "league" | "center">("race");

  // Sponsor: races accordion items
  const raceItems = useMemo(() => {
    const rs = sponsor?.raceSponsorship ?? null;
    const races: Array<{ key: string; race: Race }> = [
      { key: "race1", race: rs?.race1 ?? null },
      { key: "race2", race: rs?.race2 ?? null },
      { key: "race3", race: rs?.race3 ?? null },
      { key: "race4", race: rs?.race4 ?? null },
      { key: "race5", race: rs?.race5 ?? null },
    ];

    return races
      .filter((r) => (r.race?.raceName || "").trim().length > 0 || (r.race?.raceDetails || "").trim().length > 0)
      .map((r, idx) => ({
        id: `race-${idx + 1}`,
        title: r.race?.raceName ?? `Race ${idx + 1}`,
        content: <p className="body whitespace-pre-line">{r.race?.raceDetails ?? ""}</p>,
      }));
  }, [sponsor]);

  return (
    <>
      {/* TOP 3 CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 items-start">
        {/* Volunteer */}
        <div className="relative card bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden">
          {/* icon */}
          <img
            src="/images/VolunteerIcon.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-4 top-4 h-12 w-12"
          />

          <h3 className="h2 text-center mb-2 pt-4">Volunteer</h3>
          <p className="body text-center flex-grow whitespace-pre-line">
            {volunteer?.volunteerCardSummary ?? ""}
          </p>
          <a href="#volunteer" className="btn btn-primary mx-auto">
            Volunteer
          </a>
        </div>

        {/* Donate */}
        <div className="relative card bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden">
          {/* icon */}
          <img
            src="/images/DonateIcon.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-4 top-4 h-12 w-12"
          />

          <h3 className="h2 text-center mb-2 pt-4">Donate</h3>
          <p className="body text-center flex-grow whitespace-pre-line">
            {donate?.donateCardSummary ?? ""}
          </p>
          <a href="#donate" className="btn btn-primary mx-auto">
            Donate
          </a>
        </div>

        {/* Sponsor */}
        <div className="relative card bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden">
          {/* icon */}
          <img
            src="/images/SponsorshipIcon.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-4 top-4 h-12 w-12"
          />

          <h3 className="h2 text-center mb-2 pt-4">Sponsor</h3>
          <p className="body text-center flex-grow whitespace-pre-line">
            {sponsor?.sponsorCardSummary ?? ""}
          </p>
          <a href="#sponsor" className="btn btn-primary mx-auto">
            Sponsor
          </a>
        </div>
      </div>

      {/* IMPACT BLURB */}
      <div className="stack-4">
        <p className="body text-center whitespace-pre-line">{fields?.impactBlurb ?? ""}</p>
        <div className="flex justify-center">
          <a href="/our-purpose" className="btn btn-secondary">
            See more of our impact
          </a>
        </div>
      </div>

      {/* DONATE */}
      <section id="donate" className="stack-6 scroll-mt-24">
        <h2 className="h2 mb-2">Donate</h2>

        <div className="grid gap-16 md:grid-cols-2 items-start">
          {/* LEFT COLUMN */}
          <div className="stack-6">
            <TextBlock text={donate?.donateLongDescription} />

            {/* physical donation content */}
            <div className="stack-3">
              <h3 className="h3 tracking-wide text-gmcc-navy mt-4 mb-2">Support us with a physical donation:</h3>

              <TextBlock text={donate?.physicalDonationDescription} />

              <p className="body whitespace-pre-line mt-2 mb-2">Popular items always in need:</p>
              {donate?.physicalDonationList ? (
                <div className="body whitespace-pre-line ml-4">{donate.physicalDonationList}</div>
              ) : null}

              {donate?.physicalDonationWishlist ? (
                <div className="pt-2">
                  <a
                    href={donate.physicalDonationWishlist}
                    className="btn btn-secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Childcare &amp; Preschool Amazon Wishlist
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="relative overflow-hidden h-full w-full">
            <iframe
              title="Donation form powered by Zeffy"
              src="https://www.zeffy.com/embed/donation-form/give-greater"
              allow="payment"
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </div>
      </section>

      {/* VOLUNTEER */}
      <section id="volunteer" className="stack-6 scroll-mt-24">
        <h2 className="h2 mb-2">Volunteer</h2>

        <div className="grid gap-16 md:grid-cols-2 items-start">
          <div className="stack-3">
            <TextBlock text={volunteer?.volunteerLongDescription} />

            {volunteer?.volunteerApplication ? (
              <div className="pt-2 text-center mx-auto">
                <a
                  href={volunteer.volunteerApplication}
                  className="btn btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sign up as a volunteer
                </a>
              </div>
            ) : null}
          </div>

          <div className="stack-2">
            <Img image={volunteer?.volunteerImage ?? null} fallbackAlt="Volunteer" />
          </div>
        </div>
      </section>

      {/* SPONSOR */}
      <section id="sponsor" className="stack-6 scroll-mt-24">
        <h2 className="h2 mb-2">Sponsor</h2>

        <TextBlock text={sponsor?.sponsorLongDescription} />

        {/* Tabs */}
        <SponsorshipTabs tabs={[
          { id: "race", label: "Sponsor a race", content:
            <div className="stack-6 pt-4">
              <div className="grid gap-16 md:grid-cols-2 items-start">
                <div className="stack-3">
                    <TextBlock text={sponsor?.raceSponsorship?.raceSponsorshipSummary} />
    
                    {sponsor?.raceSponsorship?.raceSponsorshipApplication ? (
                    <div className="pt-2 text-center mx-auto">
                        <a
                        href={sponsor.raceSponsorship.raceSponsorshipApplication}
                        className="btn btn-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        Sponsorship Application
                        </a>
                    </div>
                    ) : null}

                  <div className="mt-8">
                    {raceItems.length > 0 ? <Accordion items={raceItems} /> : null}
                  </div>
                </div>
    
                <div className="stack-2">
                    <Img image={sponsor?.raceSponsorship?.raceSponsorshipImage ?? null} fallbackAlt="Race sponsorship" />
                </div>
              </div>
            </div>
            },

          { id: "league", label: "Sponsor a sports league", content:
            <div className="stack-6 pt-4">
                <div className="grid gap-16 md:grid-cols-2 items-start">
                <div className="stack-3">
                    <TextBlock text={sponsor?.leagueSponsorship?.leagueSponsorshipDetails} />

                    {sponsor?.leagueSponsorship?.leagueSponsorshipApplication ? (
                    <div className="pt-2 text-center mx-auto">
                        <a
                        href={sponsor.leagueSponsorship.leagueSponsorshipApplication}
                        className="btn btn-primary mx-auto"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        Sponsorship Application
                        </a>
                    </div>
                    ) : null}
                </div>

                <div className="stack-2">
                    <Img image={sponsor?.leagueSponsorship?.leagueSponsorshipImage ?? null} fallbackAlt="League sponsorship" />
                </div>
                </div>
            </div>
          },

          { id: "center", label: "Sponsor a center", content: 
            <div className="stack-6 pt-4">
              <div className="grid gap-16 md:grid-cols-2 items-start">
                <div className="stack-3">
                    <TextBlock text={sponsor?.centerSponsorship?.centerSponsorshipDetails} />

                    {sponsor?.centerSponsorship?.centerSponsorshipApplication ? (
                    <div className="pt-2 text-center mx-auto">
                        <a
                        href={sponsor.centerSponsorship.centerSponsorshipApplication}
                        className="btn btn-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        Sponsorship Application
                        </a>
                    </div>
                    ) : null}
                </div>

                <div className="stack-2">
                    <Img image={sponsor?.centerSponsorship?.centerSponsorshipImage ?? null} fallbackAlt="Center sponsorship" />
                </div>
              </div>
            </div>
           },
        ]} defaultTab={"race"} />
      </section>
    </>
  );
}
