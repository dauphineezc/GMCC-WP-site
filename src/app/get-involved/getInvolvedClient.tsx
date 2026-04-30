"use client";

import { useMemo } from "react";
import Accordion from "@/components/accordion";
import Tabs from "@/components/tabs";
import PhotoWaveHeader from "@/components/photoWaveHeader";

type WPImageNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
};

type MaybeImage = { node?: WPImageNode | null } | null;

type GetInvolvedFields = {
  heroFields?: {
    heroHeader?: string | null;
    heroSubheader?: string | null;
    heroImage?: MaybeImage;
  } | null;
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
    sponsorImage?: MaybeImage;
    sponsorApplication?: string | null;
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

  return (
    <div className="overflow-x-clip">

    <section className="mx-auto max-w-6xl px-6 mt-6">
      {/* TOP 3 CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 items-start">
        {/* Volunteer */}
        <div className="relative card card-hover bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden">
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
        <div className="relative card card-hover bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden">
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
        <div className="relative card card-hover bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden">
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
      <div className="stack-4 mt-12">
        <p className="body text-center whitespace-pre-line">{fields?.impactBlurb ?? ""}</p>
        <div className="flex justify-center">
          <a href="/our-purpose" className="btn btn-secondary">
            See more of our impact
          </a>
        </div>
      </div>

      {/* DONATE */}
      <section id="donate" className="stack-6 scroll-mt-24 mt-12">
        <div className="grid gap-16 md:grid-cols-2 items-start">
          {/* LEFT COLUMN */}
          <div className="stack-6">
            <h2 className="h2 mb-2">Donate</h2>

            <TextBlock text={donate?.donateLongDescription} />

            {/* physical donation content */}
            <div className="stack-3">
              <h3 className="h3 mt-6 mb-4">Support us with a physical donation:</h3>

              <TextBlock text={donate?.physicalDonationDescription} />

              <p className="body whitespace-pre-line font-bold mt-4 mb-2">Popular items always in need:</p>
              {donate?.physicalDonationList ? (
                <div className="body whitespace-pre-line ml-4">{donate.physicalDonationList}</div>
              ) : null}

              {donate?.physicalDonationWishlist ? (
                <div className="pt-4">
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
      <section
        id="volunteer"
        className="relative mt-12 w-screen -ml-[calc(50vw-50%)] overflow-x-clip scroll-mt-24"
      >
        {/* Top wave */}
        <div className="pointer-events-none w-full overflow-hidden leading-none">
          <svg
              viewBox="0 0 1440 120"
              className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
              preserveAspectRatio="none"
            >
              <path
                d="
                  M-20,110
                  C750,-90  800,120  1200,80
                  S1420,0 1460,0
                  L1460,0 L-20,0 Z
                "
                transform="translate(0 120) scale(1 -1)"
                fill="var(--gmcc-navy)"
              />
            </svg>
        </div>

        <div className="-mt-px py-12 bg-gmcc-navy text-white">
          <div className="mx-auto max-w-6xl px-6">

            <div className="grid gap-16 md:grid-cols-2 items-start">
              <div className="stack-3 [&_p]:text-white">
                <h2 className="h2 mb-2 text-white">Volunteer</h2>
                <TextBlock text={volunteer?.volunteerLongDescription} />

                {volunteer?.volunteerApplication ? (
                  <div className="pt-4 text-center mx-auto">
                    <a
                      href={volunteer.volunteerApplication}
                      className="btn btn-secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sign up as a volunteer
                    </a>
                  </div>
                ) : null}
              </div>

              {volunteer?.volunteerImage?.node?.sourceUrl ? (
                <img
                  src={volunteer?.volunteerImage?.node?.sourceUrl}
                  alt={volunteer?.volunteerImage?.node?.altText || ""}
                  className="block h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="aspect-square bg-neutral-200" />
              )}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="pointer-events-none -mt-px w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 390 120"
            className="block h-14 w-full text-gmcc-navy md:hidden"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,98
                C78,62 135,54 195,74
                C255,96 322,88 390,60
                L390,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>

          <svg
            viewBox="0 0 1440 120"
            className="hidden h-16 w-full text-gmcc-navy md:block"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,110
                C300,-50  500,120  800,100
                S1000,0 1440,0
                L1440,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* SPONSOR */}
      <section id="sponsor" className="stack-6 scroll-mt-24 mt-12 pb-12">
        <h2 className="h2 mb-2">Sponsor</h2>

        <TextBlock text={sponsor?.sponsorLongDescription} />
            <div className="stack-6 pt-4">
              <div className="grid gap-16 md:grid-cols-2 items-start">
                <div className="stack-3">
                    <TextBlock text={sponsor?.sponsorLongDescription} />
    
                    {sponsor?.sponsorApplication ? (
                    <div className="pt-4 text-center mx-auto">
                        <a
                        href={sponsor.sponsorApplication}
                        className="btn btn-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        Apply to sponsor
                        </a>
                    </div>
                    ) : null}
                </div>
    
                {sponsor?.sponsorImage?.node?.sourceUrl && (
                  <img
                    src={sponsor?.sponsorImage?.node?.sourceUrl}
                    alt={sponsor?.sponsorImage?.node?.altText || ""}
                    className="block h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            </div>
      </section>

    </section>
    </div>
  );
}
