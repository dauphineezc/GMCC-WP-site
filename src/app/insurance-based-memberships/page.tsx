// src/app/membership/insurance-based/page.tsx
import NavyWaveSection from "@/components/navyWaveSection";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  PAGE_HERO_FIELDS_GRAPHQL,
  resolvePhotoWaveHeaderProps,
  type WpPageWithHeroFields,
} from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";
import JotFormLightboxButton from "@/components/jotFormLightboxButton";

const INSURANCE_BASED_MEMBERSHIPS_QUERY = `
  query InsuranceBasedMembershipsPageFields($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      uri
      ${PAGE_HERO_FIELDS_GRAPHQL}
      insuranceBasedMembershipsPageFields {
        silversneakers {
          silversneakersTitle
          silversneakersDescription
          silversneakersApplication
          silversneakersImage {
            node {
              ${WP_MEDIA_IMAGE_FIELDS}
              mediaDetails { width height }
            }
          }
        }

        renewActiveOnePass {
          renewActiveOnePassTitle
          renewActiveOnePassDescription
          renewActiveOnePassApplication
          renewActiveOnePassImage {
            node {
              ${WP_MEDIA_IMAGE_FIELDS}
              mediaDetails { width height }
            }
          }
        }

        insuranceBasedMembershipBenefits

        contactHeader
        contactSubheader

        ssClasses
        renewClasses
      }
    }
  }
`;

type MediaNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
  focalPointX?: number | string | null;
  focalPointY?: number | string | null;
  hasCustomFocalPoint?: boolean | null;
};

type InsuranceBasedMembershipsData = {
  page?: WpPageWithHeroFields & {
    id: string;
    title?: string | null;
    uri?: string | null;
    insuranceBasedMembershipsPageFields?: {
      silversneakers?: {
        silversneakersTitle?: string | null;
        silversneakersDescription?: string | null;
        silversneakersApplication?: string | null; // URL or application link
        silversneakersImage?: { node?: MediaNode | null } | null;
      } | null;

      renewActiveOnePass?: {
        renewActiveOnePassTitle?: string | null;
        renewActiveOnePassDescription?: string | null;
        renewActiveOnePassApplication?: string | null;
        renewActiveOnePassImage?: { node?: MediaNode | null } | null;
      } | null;

      insuranceBasedMembershipBenefits?: string | null;

      contactHeader?: string | null;
      contactSubheader?: string | null;

      ssClasses?: string | null;
      renewClasses?: string | null;
    } | null;
  } | null;
};

function toTel(phone: string) {
  // remove anything that isn't digit or +
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+1${cleaned}`;
}

function ensureString(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function ExternalLink({
  href,
  children,
  className = "link",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

function InfoCard({
  title,
  description,
  image,
  ctaUrl,
  ctaLabel = "Learn more",
  badge,
}: {
  title?: string | null;
  description?: string | null;
  image?: MediaNode | null;
  ctaUrl?: string | null;
  ctaLabel?: string;
  badge?: string;
}) {
  const src = image?.sourceUrl ?? null;
  const objectPosition = mediaFocalPositionCss(image);

  return (
    <article className="card h-full overflow-hidden p-0">
      <div className="grid h-full items-stretch md:grid-cols-[240px_1fr]">
        <div className="relative h-full overflow-hidden bg-neutral-100">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={image?.altText ?? ""}
              className="absolute inset-0 h-full w-full object-cover"
              style={objectPosition ? { objectPosition } : undefined}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full min-h-[200px] w-full" />
          )}
        </div>

        <div className="h-full p-5">
          {badge ? (
            <div className="mb-2">
              <span className="badge badge-teal">{badge}</span>
            </div>
          ) : null}

          <h2 className="h3">{title}</h2>

          {description ? (
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {description}
            </p>
          ) : null}

          {ctaUrl ? (
            <div className="mt-4">
              <a className="btn btn-secondary" href={ctaUrl} target="_blank" rel="noreferrer">
                {ctaLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}


export default async function InsuranceBasedMembershipsPage() {
  const uri = "/insurance-based-memberships";

  const data = await wpFetch<InsuranceBasedMembershipsData>(INSURANCE_BASED_MEMBERSHIPS_QUERY, {
    uri,
  });

  const page = data?.page ?? null;
  const heroProps = resolvePhotoWaveHeaderProps(page, "Insurance-based memberships");
  const fields = page?.insuranceBasedMembershipsPageFields;

  const silver = fields?.silversneakers ?? null;
  const silverImg = silver?.silversneakersImage?.node ?? null;

  const renew = fields?.renewActiveOnePass ?? null;
  const renewImg = renew?.renewActiveOnePassImage?.node ?? null;

  const insurance = fields?.insuranceBasedMembershipBenefits ?? null;
  const insuranceLines = insurance
    ? insurance
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean)
    : [];
  const insuranceIntro = insuranceLines[0] ?? "";
  const insuranceItems = insuranceLines.slice(1);

  const ssClassesUrl = fields?.ssClasses ?? null;
  const renewClassesUrl = fields?.renewClasses ?? null;

  return (
    <main>
      <PhotoWaveHeader
        title={heroProps.title}
        subheader={heroProps.subheader ?? null}
        imageUrl={heroProps.imageUrl ?? null}
        imagePosition={heroProps.imagePosition}
        ctas={heroProps.ctas}
      />

      <div className="page-section stack-8">

        {/* Programs */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h2">Insurance-based memberships</h2>
            <p className="small max-w-lg text-right">
              Apply online using the links below. Eligibility varies by provider.
            </p>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-2">
            <InfoCard
              title={silver?.silversneakersTitle ?? "SilverSneakers"}
              description={silver?.silversneakersDescription ?? ""}
              image={silverImg}
              ctaUrl={silver?.silversneakersApplication ?? undefined}
              ctaLabel="Apply / Get started"
            />

            <InfoCard
              title={renew?.renewActiveOnePassTitle ?? "Renew Active / One Pass"}
              description={renew?.renewActiveOnePassDescription ?? ""}
              image={renewImg}
              ctaUrl={renew?.renewActiveOnePassApplication ?? undefined}
              ctaLabel="Apply / Get started"
            />
          </div>
        </section>

          <section className="page-section text-white">
        {/* Insurance benefits */}
        {insurance ? (
          <>
            <h2 className="h2 mb-2">Insurance-Based Membership Benefits</h2>
            {insuranceIntro ? <p className="mt-3 text-base text-neutral-700">{insuranceIntro}</p> : null}
            {insuranceItems.length > 0 ? (
              <ul className="space-y-2 pl-6 mt-4">
                {insuranceItems.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-base text-neutral-700">
                    <svg className="h-4 w-4 shrink-0 text-gmcc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 pl-6 text-sm text-neutral-700">*Must reserve your spot within 48 hours of class time.</p>
          </>
        ) : null}
        </section>

        {/* SilverSneakers classes link */}
        {ssClassesUrl && renewClassesUrl ? (
          <section className="page-section">
            <div className="flex flex-col grid-cols-2 gap-6 sm:flex-row sm:items-center sm:justify-between text-center">
              <div className="col-span-1 card bg-gmcc-blue-light/30 p-8 text-center">
                <h2 className="h3">SilverSneakers Classes</h2>
                <p className="small mt-1">
                  Explore class options and schedules for SilverSneakers participants.
                </p>
              <ExternalLink href={ssClassesUrl} className="btn btn-secondary mt-4">
                View classes
              </ExternalLink>
            </div>
            <div className="col-span-1 card bg-gmcc-blue-light/30 p-8 text-center">
                <h2 className="h3">Renew Active/One Pass Classes</h2>
                <p className="small mt-1">
                  Explore class options and schedules for Renew Active/One Pass participants.
                </p>
              <ExternalLink href={renewClassesUrl} className="btn btn-secondary mt-4">
                View classes
              </ExternalLink>
            </div>
            </div>
          </section>
        ) : null}

        {/* Contact */}
          <section>
            <div className="mx-auto max-w-6xl px-4 mt-18 mb-8 text-center">
              <h2 className="h2">
                {fields?.contactHeader}
              </h2>
              <p className="mt-3 text-neutral-700 max-w-xl mx-auto">
                {fields?.contactSubheader}
              </p>
              <JotFormLightboxButton formId="262285373322052" />
            </div>
          </section>
        </div>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/insurance-based-memberships");
}
