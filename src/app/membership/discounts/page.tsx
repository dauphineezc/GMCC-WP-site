// src/app/membership/discounts/page.tsx
import HeaderImage from "@/components/headerImage";
import { wpFetch } from "@/lib/wp";

const MEMBERSHIP_DISCOUNTS_QUERY = `
  query MembershipDiscountPageFields($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      uri
      membershipDiscountPageFields {
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

        promotion {
          promotionTitle
          promotionDescription
          promotionCta
          promotionImage {
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

type DiscountsData = {
  page?: {
    id: string;
    title?: string | null;
    uri?: string | null;
    membershipDiscountPageFields?: {
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

      promotion?: {
        promotionTitle?: string | null;
        promotionDescription?: string | null;
        promotionCta?: string | null;
        promotionImage?: { node?: MediaNode | null } | null;
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
    <article className="card overflow-hidden p-0">
      <div className="grid md:grid-cols-[240px_1fr]">
        <div className="relative bg-neutral-100">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={image?.altText ?? ""}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full min-h-[160px]" />
          )}
        </div>

        <div className="p-5">
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

function PromotionBanner({
  title,
  description,
  ctaUrl,
  image,
}: {
  title?: string | null;
  description?: string | null;
  ctaUrl?: string | null;
  image?: MediaNode | null;
}) {
  if (!title && !description && !ctaUrl && !image?.sourceUrl) return null;

  return (
    <section className="card overflow-hidden p-0">
      <div className="grid md:grid-cols-[1.2fr_0.8fr]">
        <div className="p-6">
          <div className="mb-3">
            <span className="badge badge-green">Limited-time promotion</span>
          </div>

          <h2 className="h2">{title ?? "Promotion"}</h2>

          {description ? (
            <p className="mt-2 body max-w-prose">{description}</p>
          ) : null}

          {ctaUrl ? (
            <div className="mt-5">
              <a className="btn btn-primary" href={ctaUrl} target="_blank" rel="noreferrer">
                View details
              </a>
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[200px] bg-neutral-100">
          {image?.sourceUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.sourceUrl}
              alt={image.altText ?? ""}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full" />
          )}
        </div>
      </div>
    </section>
  );
}

export default async function DiscountsPage() {
  // Adjust this URI to match your actual route in WP
  const uri = "/membership-discounts/";

  const data = await wpFetch<DiscountsData>(MEMBERSHIP_DISCOUNTS_QUERY, {
    uri,
  });

  const fields = data?.page?.membershipDiscountPageFields;

  const promo = fields?.promotion ?? null;

  const silver = fields?.silversneakers ?? null;
  const silverImg = silver?.silversneakersImage?.node ?? null;

  const renew = fields?.renewActiveOnePass ?? null;
  const renewImg = renew?.renewActiveOnePassImage?.node ?? null;

  const insurance = fields?.insuranceBasedMembershipBenefits ?? null;

  const contact = fields?.contact ?? null;
  const contactPhone = ensureString(contact?.phoneNumber);
  const classesUrl = fields?.silversneakersClasses ?? null;

  return (
    <main>
      <HeaderImage src="/images/MembershipDiscountsPhoto.png" alt="Discounts" />

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <h1 className="h1">Membership Discounts</h1>
          <p className="body max-w-2xl">
            Explore membership discounts and partner programs. If you have questions, our team can help you confirm eligibility and next steps.
          </p>
        </header>

        {/* Promotion */}
        {promo ? (
          <PromotionBanner
            title={promo.promotionTitle}
            description={promo.promotionDescription}
            ctaUrl={promo.promotionCta}
            image={promo.promotionImage?.node ?? null}
          />
        ) : null}

        {/* Programs */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h2">Insurance-based memberships</h2>
            <p className="small max-w-lg text-right">
              Apply online using the links below. Eligibility varies by provider.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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

        {/* Insurance benefits */}
        {insurance ? (
          <>
            <h3 className="h3 mb-2">Insurance-based membership benefits</h3>
            <p className="mt-3 body max-w-prose whitespace-pre-line">
              {insurance}
            </p>
          </>
        ) : null}

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
            <h3 className="h3 mb-2">Have Questions?</h3>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                {contact?.contactName ? (
                  <div className="font-secondary text-base font-semibold text-neutral-900">
                    Contact {contact.contactName}
                  </div>
                ) : null}

                {contact?.personContext ? (
                  <div className="small mt-1">
                    {contact.personContext}
                  </div>
                ) : null}

                {contactPhone ? (
                  <div className="mt-3 text-sm text-neutral-700">
                    <span className="text-neutral-500">Phone: </span>
                    <a className="link" href={`tel:${toTel(contactPhone)}`}>
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
