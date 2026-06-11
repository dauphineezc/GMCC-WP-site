import {
  PAGE_HERO_FIELDS_GRAPHQL,
  resolvePhotoWaveHeaderProps,
  type WpPageWithHeroFields,
} from "@/lib/pageHeroFields";
import { acfCorporatePartnerItems, wpFetch } from "@/lib/wp";
import { isExternalHref } from "@/lib/acf";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import CorporateAmenityTiles from "@/components/corporateAmenityTiles";
import CorporateMembershipBenefits from "@/components/corporateMembershipBenefits";
import type { Metadata } from "next";
import Image from "next/image";
import { TestimonialSection, normalizeTestimonials } from "@/components/testimonials";

export const metadata: Metadata = {
  title: "Corporate Wellness Centers",
  description: "Explore Greater Midland corporate wellness center partners.",
};

const CORPORATE_MEMBERSHIPS_PAGE_QUERY = /* GraphQL */ `
query CorporateMembershipsPage($uri: ID!) {
  page(id: $uri, idType: URI) {
    id
    title
    slug

    ${PAGE_HERO_FIELDS_GRAPHQL}
    
    corporateMembershipPageFields {
      redirectForIndividualEmployees
      whyCorporateWellnessHeader
      whyCorporateWellnessBody
      amenities {
        amenity1
        amenity2
        amenity3
        amenity4
        amenity5
      }

      benefitsHeader
      benefits {
        benefit1 { benefitHeader description }
        benefit2 { benefitHeader description }
        benefit3 { benefitHeader description }
        benefit4 { benefitHeader description }
        benefit5 { benefitHeader description }
      }

      testimonialsHeader
      testimonials {
          nodes {
            ... on Testimonial {
              id
              title
              testimonialFields {
                quote
                personName
                personContext
                photo { node { sourceUrl altText } }
              }
            }
          }
        }

      becomeAPartnerHeader
      becomeAPartnerSubheader

      corporatePartners {
        logo { node { sourceUrl mediaItemUrl altText } }
        pageLink
      }
    }   
  }
}
`;

type CorporateMembershipsPageData = {
    page?: WpPageWithHeroFields & {
        corporateMembershipPageFields?: {
            redirectForIndividualEmployees?: string | null;
            whyCorporateWellnessHeader?: string | null;
            whyCorporateWellnessBody?: string | null;
            amenities?: {
                amenity1?: string | null;
                amenity2?: string | null;
                amenity3?: string | null;
                amenity4?: string | null;
                amenity5?: string | null;
            } | null;
            benefitsHeader?: string | null;
            benefits?: {
                benefit1?: { benefitHeader?: string | null; description?: string | null } | null;   
                benefit2?: { benefitHeader?: string | null; description?: string | null } | null;
                benefit3?: { benefitHeader?: string | null; description?: string | null } | null;
                benefit4?: { benefitHeader?: string | null; description?: string | null } | null;
                benefit5?: { benefitHeader?: string | null; description?: string | null } | null;
            } | null;
            testimonialsHeader?: string | null;
            testimonials?: {
                nodes?: Array<{
                    id: string;
                    title?: string | null;
                    testimonialFields?: {
                        quote?: string | null;
                        personName?: string | null;
                        personContext?: string | null;
                        photo?: {
                            node?: {
                                sourceUrl?: string | null;
                                altText?: string | null;
                            } | null;
                        } | null;
                    } | null;
                } | null> | null;
            } | null;
            corporatePartners?: unknown;
            becomeAPartnerHeader?: string | null;
            becomeAPartnerSubheader?: string | null;
        } | null;
    };
};

const AMENITY_KEYS = ["amenity1", "amenity2", "amenity3", "amenity4", "amenity5"] as const;
const BENEFIT_KEYS = ["benefit1", "benefit2", "benefit3", "benefit4", "benefit5"] as const;

function corporateAmenityStrings(
    amenities: NonNullable<
        NonNullable<CorporateMembershipsPageData["page"]>["corporateMembershipPageFields"]
    >["amenities"],
): string[] {
    if (!amenities) return [];
    return AMENITY_KEYS.map((key) => (amenities[key] ?? "").trim()).filter(Boolean);
}

function corporateBenefitCards(
    benefits: NonNullable<
        NonNullable<CorporateMembershipsPageData["page"]>["corporateMembershipPageFields"]
    >["benefits"],
) {
    if (!benefits) return [];
    return BENEFIT_KEYS.flatMap((key) => {
        const b = benefits[key];
        const header = (b?.benefitHeader ?? "").trim();
        const description = (b?.description ?? "").trim();
        if (!header) return [];
        return [{ header, description }];
    });
}

export default async function CorporateMembershipsPage() {
    const data = await wpFetch<CorporateMembershipsPageData>(
        CORPORATE_MEMBERSHIPS_PAGE_QUERY,
        { uri: "/corporate-memberships/" },
        { suppressGraphQLErrorLogging: true },
    );

    const page = data?.page ?? null;
    const heroProps = resolvePhotoWaveHeaderProps(page, "Corporate Memberships");
    const redirectForIndividualEmployees = page?.corporateMembershipPageFields?.redirectForIndividualEmployees;
    const whyCorporateWellnessHeader = page?.corporateMembershipPageFields?.whyCorporateWellnessHeader;
    const whyCorporateWellnessBody = page?.corporateMembershipPageFields?.whyCorporateWellnessBody;
    const amenities = page?.corporateMembershipPageFields?.amenities;
    const benefitsHeader = page?.corporateMembershipPageFields?.benefitsHeader;
    const benefits = page?.corporateMembershipPageFields?.benefits;
    const becomeAPartnerHeader = page?.corporateMembershipPageFields?.becomeAPartnerHeader;
    const becomeAPartnerSubheader = page?.corporateMembershipPageFields?.becomeAPartnerSubheader;
    const amenityStrings = corporateAmenityStrings(amenities);
    const benefitCards = corporateBenefitCards(benefits);
    const testimonialsHeader = page?.corporateMembershipPageFields?.testimonialsHeader;
    const testimonials = page?.corporateMembershipPageFields?.testimonials;
    const normalizedTestimonials = normalizeTestimonials(testimonials?.nodes ?? []);
    const partnerLogoNodes = acfCorporatePartnerItems(
        page?.corporateMembershipPageFields?.corporatePartners,
    );

    return (

    <main>
        <PhotoWaveHeader
          title={heroProps.title}
          subheader={heroProps.subheader ?? null}
          imageUrl={heroProps.imageUrl ?? null}
          ctas={heroProps.ctas}
        />
        
        <section className="page-section stack-6">
          {redirectForIndividualEmployees ? <p className="body mx-auto max-w-6xl text-center text-sm italic mb-8"> {redirectForIndividualEmployees}</p> : null}
          {whyCorporateWellnessHeader ? <h2 className="h2 text-center">{whyCorporateWellnessHeader}</h2> : null}
          {whyCorporateWellnessBody ? <p className="body mx-auto max-w-6xl text-center text-base mt-4">{whyCorporateWellnessBody}</p> : null}
          {amenityStrings.length > 0 ? <CorporateAmenityTiles items={amenityStrings} /> : null}
        </section>

        {benefitsHeader && benefitCards.length > 0 ? (
          <CorporateMembershipBenefits sectionTitle={benefitsHeader} benefits={benefitCards} />
        ) : null}

        {/* TESTIMONIALS */}
        {testimonialsHeader || normalizedTestimonials.length || partnerLogoNodes.length > 0 ? (
            <section className="page-section">
            {testimonialsHeader ? (
                <h2 className="h2 text-center">{testimonialsHeader}</h2>
            ) : null}
            {partnerLogoNodes.length > 0 ? (
            <div className="mx-auto mt-6 grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {partnerLogoNodes.map((logo, index) => {
                    const alt = logo.altText?.trim() || `Corporate partner logo ${index + 1}`;
                    const key = `${logo.resolvedUrl}-${index}`;
                    const cellClass =
                        "flex h-20 items-center justify-center rounded-lg border border-neutral-200 bg-white p-0";
                    const image = (
                        <Image
                            src={logo.resolvedUrl}
                            alt={alt}
                            width={180}
                            height={72}
                            className="h-full w-full object-contain"
                        />
                    );
                    if (logo.pageLink) {
                        const external = isExternalHref(logo.pageLink);
                        return (
                            <a
                                key={key}
                                href={logo.pageLink}
                                className={`${cellClass} text-inherit no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gmcc-teal`}
                                {...(external
                                    ? { target: "_blank" as const, rel: "noopener noreferrer" }
                                    : {})}
                            >
                                {image}
                            </a>
                        );
                    }
                    return (
                        <div key={key} className={cellClass}>
                            {image}
                        </div>
                    );
                })}
            </div>
            ) : null}
            <TestimonialSection testimonials={normalizedTestimonials} />
            </section>
        ) : null}

        <section className="page-section stack-6">
            {becomeAPartnerHeader ? <h2 className="h2 text-center">{becomeAPartnerHeader}</h2> : null}
            {becomeAPartnerSubheader ? <p className="body mx-auto max-w-6xl text-center text-base mt-4">{becomeAPartnerSubheader}</p> : null}

            <div className="relative mt-8 overflow-hidden pb-8">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
                <img
                src="/GreaterLogoBG.png"
                alt=""
                className="absolute left-10 bottom-0 w-58 select-none md:w-80"
                draggable={false}
                />
                <img
                src="/GreaterLogoBG.png"
                alt=""
                className="absolute right-10 top-0 w-58 select-none md:w-80"
                draggable={false}
                />
            </div>

            <div className="mx-auto max-w-6xl px-10">
            <div className="relative mx-auto w-full rounded-2xl border border-neutral-300 bg-neutral-100 p-10 shadow-sm lg:w-[calc((3*(100%-4rem))/5+2rem)]">
                <form className="mt-4 space-y-4" aria-label="Placeholder contact form">
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="contact-name" className="block text-sm text-neutral-700">
                    First Name
                    </label>
                    <input
                    id="contact-name"
                    name="first-name"
                    type="text"
                    placeholder=""
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                    />
                </div>
                <div>
                    <label htmlFor="contact-name" className="block text-sm text-neutral-700">
                    Last Name
                    </label>
                    <input
                    id="contact-name"
                    name="last-name"
                    type="text"
                    placeholder=""
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                    />
                </div>
                </div>

                <div>
                    <label htmlFor="contact-email" className="block text-sm text-neutral-700">
                    Email address
                    </label>
                    <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder=""
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                    />
                </div>

                <div>
                    <label htmlFor="contact-email" className="block text-sm text-neutral-700">
                    Business Name
                    </label>
                    <input
                    id="business-name"
                    name="business-name"
                    type="text"
                    placeholder=""
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                    />
                </div>

                <div>
                    <label htmlFor="contact-message" className="block text-sm text-neutral-700">
                    Message
                    </label>
                    <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                    />
                </div>

                <div className="pt-1 text-center">
                    <button type="button" className="btn btn-primary min-w-28">
                    Submit
                    </button>
                </div>
                </form>
            </div>
            </div>
            </div>
        </section>
    </main>
);
}