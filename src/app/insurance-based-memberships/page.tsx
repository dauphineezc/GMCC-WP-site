// src/app/membership/insurance-based/page.tsx
import PhotoWaveHeader from "@/components/photoWaveHeader";
import {
  PAGE_HERO_FIELDS_GRAPHQL,
  resolvePhotoWaveHeaderProps,
  type WpPageWithHeroFields,
} from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";

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
              sourceUrl
              altText
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
              sourceUrl
              altText
              mediaDetails { width height }
            }
          }
        }

        insuranceBasedMembershipBenefits

        contact {
          contactName
          personContext
          phoneNumber
        }

        silversneakersClasses
      }
    }
  }
`;

type MediaNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
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

      contact?: {
        contactName?: string | null;
        personContext?: string | null;
        phoneNumber?: number | string | null;
      } | null;

      silversneakersClasses?: string | null;
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

  const contact = fields?.contact ?? null;
  const contactPhone = ensureString(contact?.phoneNumber);
  const classesUrl = fields?.silversneakersClasses ?? null;

  return (
    <main>
      <PhotoWaveHeader
        title={heroProps.title}
        subheader={heroProps.subheader ?? null}
        imageUrl={heroProps.imageUrl ?? null}
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

        <section>
        {/* Insurance benefits */}
        {insurance ? (
          <>
            <h2 className="h2 mb-2">Insurance-based membership benefits</h2>
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
        {classesUrl ? (
          <section className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="h3">SilverSneakers classes</h2>
                <p className="small mt-1">
                  View class options and schedules for SilverSneakers participants.
                </p>
              </div>
              <ExternalLink href={classesUrl} className="btn btn-secondary">
                View classes
              </ExternalLink>
            </div>
          </section>
        ) : null}

        {/* Contact */}
        {(contact?.contactName || contact?.personContext || contactPhone) ? (
          <>
            <h2 className="h2 mb-4 text-center">Have Questions?</h2>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start text-center">
              <div>
                {contact?.contactName ? (
                  <div className="font-secondary text-base font-semibold text-neutral-700">
                    Contact {contact.contactName}
                  </div>
                ) : null}

                {contact?.personContext ? (
                  <div className="small mt-2 text-neutral-700">
                    {contact.personContext}
                  </div>
                ) : null}

                {contactPhone ? (
                  <div className="mt-3 text-base text-neutral-700">
                    <span className="text-neutral-700">Phone: </span>
                    <a className="link text-gmcc-teal" href={`tel:${toTel(contactPhone)}`}>
                      {contactPhone}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
