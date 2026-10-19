"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import NavyWaveSection from "@/components/navyWaveSection";
import { mediaFocalPositionCss, type MediaFocalPointFields } from "@/lib/mediaFocalPoint";
import WysiwygText from "@/components/wysiwygText";

const GIVE_GREATER_FORM_URL = "https://www.zeffy.com/donation-form/give-greater";
const OVERLAY_Z_CLASS = "z-[300]";

const PAYMENT_METHODS = [
  {
    title: "Credit or Debit Card",
    description: "Visa, Mastercard, American Express, and most major cards",
    limit: "Up to $4,999",
  },
  {
    title: "Bank Transfer (ACH)",
    description: "Donate directly from your bank account",
    limit: "Up to $20,000",
  },
  {
    title: "Donor-Advised Fund (DAF)",
    description:
      "Available for one-time donations of",
    limit: "$1,000 or more",
    additionalInfo: "Select your DAF provider during checkout (e.g., Fidelity Charitable, BNY Charitable, DAFgiving360).",
  },
  {
    title: "Check",
    description: "Available for one-time donations of",
    limit: "$1,000 or more",
  },
] as const;

type WPImageNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
} & MediaFocalPointFields;

type MaybeImage = { node?: WPImageNode | null } | null;
export type DocLink = { label: string; href: string };

export type GetInvolvedClientFields = {
  heroFields?: {
    heroHeader?: string | null;
    heroSubheader?: string | null;
    heroImage?: MaybeImage;
  } | null;
  impactBlurb?: string | null;
  seeImpactButton?: DocLink | null;

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
    wishlistLink?: string | null;
    donationImage?: MaybeImage;
  } | null;

  sponsorGroup?: {
    sponsorCardSummary?: string | null;
    sponsorCardIcon?: MaybeImage;
    sponsorLongDescription?: string | null;
    sponsorImage?: MaybeImage;
    sponsorApplication?: DocLink | null;
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

function PaymentMethodsLightbox() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  function openModal() {
    setMounted(true);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const overlay = mounted
    ? createPortal(
        <div
          className={`fixed inset-0 ${OVERLAY_Z_CLASS} flex items-center justify-center bg-black/50 p-4 ${
            open ? "" : "pointer-events-none invisible"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-methods-title"
          hidden={!open}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-gmcc-navy px-5 py-3 text-white">
              <h3 id="payment-methods-title" className="text-lg font-semibold">
                Supported Payment Methods
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/15 p-1.5 transition-colors hover:bg-white/25"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="stack-5 p-6">
              <ul className="stack-4 pb-2">
                {PAYMENT_METHODS.map((method) => (
                  <li key={method.title}>
                    <p className="font-semibold text-gmcc-navy">{method.title}</p>
                    {method.description.includes("of") ? (
                      <p className="mt-0.5 body text-sm text-neutral-700">{method.description} <span className="mt-0.5 text-sm font-medium text-neutral-600 italic">{method.limit}</span></p>
                    ) : (
                      <div>
                      <p className="mt-0.5 body text-sm text-neutral-700">{method.description}</p>
                      <p className="mt-0.5 text-sm font-medium text-neutral-600 italic">{method.limit}</p>
                      </div>
                    )}
                    {"additionalInfo" in method && method.additionalInfo ? (
                      <p className="mt-0.5 body text-sm text-neutral-700 italic">{method.additionalInfo}</p>
                    ) : null}
                  </li>
                ))}
              </ul>

              <p className="body text-sm text-neutral-700 border-t border-neutral-200 pt-2 italic">
                Apple Pay and Google Pay are available on the{" "}
                <a
                  href={GIVE_GREATER_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Give Greater Donation Form
                </a>
                .
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 underline text-sm font-semibold text-gmcc-navy hover:text-gmcc-teal"
        onClick={openModal}
      >
        Supported Payment Methods
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {overlay}
    </>
  );
}

export default function GetInvolvedClient({ fields }: { fields: GetInvolvedClientFields | null }) {
  const volunteer = fields?.volunteerGroup ?? null;
  const donate = fields?.donateGroup ?? null;
  const sponsor = fields?.sponsorGroup ?? null;
  const sponsorApplicationHref = sponsor?.sponsorApplication?.href;
  const seeImpactHref = fields?.seeImpactButton?.href;

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
        {seeImpactHref ? (
        <div className="flex justify-center">
          <a
            href={seeImpactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            See more of our impact
          </a>
        </div>
        ) : null}
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
                <WysiwygText html={donate.physicalDonationList} />
              ) : null}

              {donate?.wishlistLink ? (
                <div className="pt-4">
                  <a
                    href={donate.wishlistLink}
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
          <div className="flex h-full w-full flex-col gap-3">
            <div className="flex justify-end">
              <PaymentMethodsLightbox />
            </div>
            <div className="relative min-h-[480px] flex-1 overflow-hidden">
              <iframe
                title="Donation form powered by Zeffy"
                src="https://www.zeffy.com/embed/donation-form/give-greater"
                allow="payment"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
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
                    <WysiwygText html={sponsor?.sponsorLongDescription} />

                    <div className="flex justify-center gap-4 mt-4">
                      {sponsorApplicationHref ? (
                      <div>
                          <a
                          href={sponsorApplicationHref}
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
