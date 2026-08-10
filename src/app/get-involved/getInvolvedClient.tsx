"use client";

import { useMemo } from "react";
import Accordion from "@/components/accordion";
import Tabs from "@/components/tabs";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import NavyWaveSection from "@/components/navyWaveSection";
import { mediaFocalPositionCss, type MediaFocalPointFields } from "@/lib/mediaFocalPoint";

type WPImageNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
} & MediaFocalPointFields;

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
    volunteerCardIcon?: MaybeImage;
    volunteerLongDescription?: string | null;
    volunteerApplication?: string | null;
    volunteerImage?: MaybeImage;
  } | null;

  donateGroup?: {
    donateCardSummary?: string | null;
    donateCardIcon?: MaybeImage;
    donateLongDescription?: string | null;
    physicalDonationDescription?: string | null;
    physicalDonationList?: string | null;
    physicalDonationWishlist?: string | null;
    donationImage?: MaybeImage;
  } | null;

  sponsorGroup?: {
    sponsorCardSummary?: string | null;
    sponsorCardIcon?: MaybeImage;
    sponsorLongDescription?: string | null;
    sponsorImage?: MaybeImage;
    sponsorApplication?: string | null;
    viewSponsorsPageCta?: {
      ctaLabel?: string | null;
      cta?: string | null;
    } | null;
  } | null;
};

function Img({
  image,
  fallbackAlt,
  className = "w-full h-full object-cover rounded-md",
}: {
  image?: MaybeImage;
  fallbackAlt: string;
  className?: string;
}) {
  const src = image?.node?.sourceUrl ?? "";
  if (!src) return null;
  const objectPosition = mediaFocalPositionCss(image?.node);

  return (
    <img
      src={src}
      alt={image?.node?.altText || fallbackAlt}
      className={className}
      style={objectPosition ? { objectPosition } : undefined}
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

    <section className="page-section">
      {/* TOP 3 CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 items-start">
        {/* Volunteer */}
        <div className="relative card card-hover bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden">
          {/* icon */}
          <Img image={volunteer?.volunteerCardIcon} fallbackAlt="Volunteer" className="pointer-events-none absolute left-4 top-4 h-14 w-14" />
    
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
          <Img image={donate?.donateCardIcon} fallbackAlt="Donate" className="pointer-events-none absolute left-4 top-4 h-14 w-14" />

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
          <Img image={sponsor?.sponsorCardIcon} fallbackAlt="Sponsor" className="pointer-events-none absolute left-4 top-4 h-14 w-14" />

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
      <div className="stack-4 section-gap">
        <p className="body text-center whitespace-pre-line">{fields?.impactBlurb ?? ""}</p>
        <div className="flex justify-center">
          <a href="/our-purpose" className="btn btn-secondary">
            See more of our impact
          </a>
        </div>
      </div>

      {/* DONATE */}
      </section>

      <section id="donate" className="page-section stack-6 scroll-mt-24">
        <h2 className="h2 mb-2">Donate</h2>
        <div className="grid gap-16 md:grid-cols-2 items-start pt-4">
          {/* LEFT COLUMN */}
          <div className="stack-6">
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
      <NavyWaveSection
        id="volunteer"
        className="w-screen -ml-[calc(50vw-50%)] overflow-x-clip"
        fullBleed={false}
        bandClassName="py-12"
      >
        <h2 className="h2 mb-2 text-white">Volunteer</h2>
        <div className="grid gap-16 md:grid-cols-2 items-start pt-4">
          <div className="stack-3 [&_p]:text-white">
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
              style={(() => {
                const pos = mediaFocalPositionCss(volunteer?.volunteerImage?.node);
                return pos ? { objectPosition: pos } : undefined;
              })()}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="aspect-square bg-neutral-200" />
          )}
        </div>
      </NavyWaveSection>

      {/* SPONSOR */}
      <section id="sponsor" className="page-section stack-6 scroll-mt-24">
        <h2 className="h2 mb-2">Sponsor</h2>
            <div className="stack-6 pt-4">
              <div className="grid gap-16 md:grid-cols-2 items-start">
                <div className="stack-3">
                    <TextBlock text={sponsor?.sponsorLongDescription} />

                    <div className="flex justify-center gap-4 mt-4">
                      {sponsor?.sponsorApplication ? (
                      <div>
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

                      {sponsor?.viewSponsorsPageCta?.cta ? (
                        <div>
                          <a
                          href={sponsor.viewSponsorsPageCta.cta}
                          className="btn btn-secondary"
                          target="_blank"
                          rel="noopener noreferrer"
                          >
                          {sponsor.viewSponsorsPageCta.ctaLabel}
                          </a>
                        </div>
                      ) : null}
                    </div>
                </div>
    
                {sponsor?.sponsorImage?.node?.sourceUrl && (
                  <img
                    src={sponsor?.sponsorImage?.node?.sourceUrl}
                    alt={sponsor?.sponsorImage?.node?.altText || ""}
                    className="block h-full w-full object-cover"
                    style={(() => {
                      const pos = mediaFocalPositionCss(sponsor?.sponsorImage?.node);
                      return pos ? { objectPosition: pos } : undefined;
                    })()}
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            </div>
      </section>

    </div>
  );
}
