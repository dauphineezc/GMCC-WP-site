// src/app/about/page.tsx
import UtilityMenu from "@/components/nav/utilityMenu";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { TestimonialSection, normalizeTestimonials } from "@/components/testimonials";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import { wpFetch } from "@/lib/wp";

// ---- Types ----
type GqlImage = { node?: { sourceUrl: string; altText?: string | null } | null };

type AboutPageFields = {
  page: {
    title: string;
    uri: string;
    aboutPageFields?: {
      header?: string | null;
      purposeStatement?: string | null;
      heroCta?: {
        nodes?: Array<
          | {
              uri?: string | null;
            }
          | null
        > | null;
      } | null;
      heroImage?: GqlImage | null;

      impactHeader?: string | null;

      stats?: {
        stat1?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        stat2?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        stat3?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        stat4?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        stat5?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        stat6?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        stat7?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
        stat8?: { statValue?: string | null; statLabel?: string | null; statContext?: string | null } | null;
      } | null;

      mainContentHeader?: string | null;

      bodySubheading1?: string | null;
      body1?: string | null;
      image1?: GqlImage | null;

      bodySubheading2?: string | null;
      body2?: string | null;
      image2?: GqlImage | null;

      annualReportBgImage?: GqlImage | null;
      annualReportHeader?: string | null;
      annualReportSubtext?: string | null;
      annualReportButtonCta?: string | null;
      annualReport?: {
        node?: {
          sourceUrl?: string | null;
          mediaItemUrl?: string | null;
          mimeType?: string | null;
          title?: string | null;
        } | null;
      } | null;

      getInvolvedHeader?: string | null;
      getInvolvedBody?: string | null;
      volunteerCta?: string | null;
      volunteerImage?: GqlImage | null;
      donateCta?: string | null;
      donateImage?: GqlImage | null;
      sponsorCta?: string | null;
      sponsorImage?: GqlImage | null;

      testimonialsHeader?: string | null;
      testimonials?: {
        nodes?: Array<{
          id: string;
          title?: string | null;
          testimonialFields?: {
            quote?: string | null;
            personName?: string | null;
            personContext?: string | null;
            photo?: GqlImage | null;
          } | null;
        }> | null;
      } | null;
    } | null;
  };
};

type Stat = { value: string; label: string; context?: string };
type AboutFieldsData = NonNullable<AboutPageFields["page"]["aboutPageFields"]>;

function buildStats(stats: AboutFieldsData["stats"]): Stat[] {
  const list = [
    stats?.stat1,
    stats?.stat2,
    stats?.stat3,
    stats?.stat4,
    stats?.stat5,
    stats?.stat6,
    stats?.stat7,
    stats?.stat8,
  ];

  return list
    .map((s) => ({
      value: s?.statValue ?? "",
      label: s?.statLabel ?? "",
      context: s?.statContext ?? "",
    }))
    .filter((s) => (s.value || s.label || s.context) && (s.value || s.label));
}

/**
 * NOTE: Your original query was missing a closing brace after stats {...}.
 * That will throw WPGraphQL 500 Syntax Error.
 */
const ABOUT_PAGE_QUERY = /* GraphQL */ `
  query AboutPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      uri

      ${PAGE_HERO_FIELDS_GRAPHQL}
      aboutPageFields {
        impactHeader
        stats {
          stat1 { statValue statLabel statContext }
          stat2 { statValue statLabel statContext }
          stat3 { statValue statLabel statContext }
          stat4 { statValue statLabel statContext }
          stat5 { statValue statLabel statContext }
          stat6 { statValue statLabel statContext }
          stat7 { statValue statLabel statContext }
          stat8 { statValue statLabel statContext }
        }

        mainContentHeader

        bodySubheading1
        body1
        image1 { node { sourceUrl altText } }

        bodySubheading2
        body2
        image2 { node { sourceUrl altText } }

        annualReportBgImage { node { sourceUrl altText } }
        annualReportHeader
        annualReportSubtext
        annualReportButtonCta
        annualReport {
          node {
            sourceUrl
            mediaItemUrl
            mimeType
            title
          }
        }

        getInvolvedHeader
        getInvolvedBody
        volunteerCta
        volunteerImage { node { sourceUrl altText } }
        donateCta
        donateImage { node { sourceUrl altText } }
        sponsorCta
        sponsorImage { node { sourceUrl altText } }

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
      }
    }
  }
`;


function ImageOrPlaceholder({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt?: string | null;
  className?: string;
}) {
  if (!src) {
    return <div className={"h-full w-full bg-neutral-200 " + className} aria-hidden />;
  }
  return <img src={src} alt={alt ?? ""} className={"h-full w-full object-cover " + className} />;
}

export default async function AboutPage() {
  const data = await wpFetch<AboutPageFields>(ABOUT_PAGE_QUERY, { uri: "/about" });
  const f = data?.page?.aboutPageFields;

  const heroProps = resolvePhotoWaveHeaderProps(data?.page, "Get Involved");

  const impactHeader = f?.impactHeader ?? "Our Community Impact";
  const stats = buildStats(f?.stats);

  const mainContentHeader = f?.mainContentHeader ?? "";

  const bodySubheading1 = f?.bodySubheading1 ?? "";
  const body1 = f?.body1 ?? "";
  const image1Url = f?.image1?.node?.sourceUrl ?? null;
  const image1Alt = f?.image1?.node?.altText ?? "";

  const bodySubheading2 = f?.bodySubheading2 ?? "";
  const body2 = f?.body2 ?? "";
  const image2Url = f?.image2?.node?.sourceUrl ?? null;
  const image2Alt = f?.image2?.node?.altText ?? "";

  const annualBgUrl = f?.annualReportBgImage?.node?.sourceUrl ?? null;
  const annualBgAlt = f?.annualReportBgImage?.node?.altText ?? "";
  const annualHeader = f?.annualReportHeader ?? "See Impact in Action";
  const annualSubtext = f?.annualReportSubtext ?? "";
  const annualBtnLabel = f?.annualReportButtonCta ?? "Read the Annual Report";
  const annualReportUrl =
    f?.annualReport?.node?.mediaItemUrl ??
    f?.annualReport?.node?.sourceUrl ??
    null;

  const getInvolvedHeader = f?.getInvolvedHeader ?? "Get Involved";
  const getInvolvedBody = f?.getInvolvedBody ?? "";
  const volunteerCta = f?.volunteerCta ?? null;
  const volunteerImageUrl = f?.volunteerImage?.node?.sourceUrl ?? null;
  const volunteerImageAlt = f?.volunteerImage?.node?.altText ?? "";
  const donateCta = f?.donateCta ?? null;
  const donateImageUrl = f?.donateImage?.node?.sourceUrl ?? null;
  const donateImageAlt = f?.donateImage?.node?.altText ?? "";
  const sponsorCta = f?.sponsorCta ?? null;
  const sponsorImageUrl = f?.sponsorImage?.node?.sourceUrl ?? null;
  const sponsorImageAlt = f?.sponsorImage?.node?.altText ?? "";

  const testimonialsHeader = f?.testimonialsHeader ?? "";
  const testimonials = normalizeTestimonials(f?.testimonials?.nodes ?? []);

  const hasStats = stats.length > 0;

  return (
    <main>
      {/* HERO */}
      <PhotoWaveHeader
          title={heroProps.title ?? ""}
          subheader={heroProps.subheader ?? null}
          imageUrl={heroProps.imageUrl ?? null}
          ctas={heroProps.ctas}
          waveFillClassName="text-gmcc-navy"
          waveEdgeClassName="bg-gmcc-navy"
          flushBottom={true}
        />

      {/* IMPACT STATS */}
      <section className="pt-16 bg-gmcc-navy">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="h2 text-center text-white z-20 relative">{impactHeader}</h2>
        </div>

        {hasStats ? (
          <div className="relative mt-8">
            {/* Navy backdrop behind the teal stat cards */}
            <div aria-hidden className="absolute inset-x-0 bottom-0" />

            <div className="relative z-10 mx-auto max-w-6xl px-6 pb-10">
              <div className="grid gap-6 md:grid-cols-4">
                {stats.map((s, idx) => (
                  <div key={idx} className="bg-gmcc-teal rounded-2xl shadow-lg p-6 text-center md:text-left">
                    <div className="text-4xl font-bold text-white">{s.value}</div>
                    <div className="mb-3 mt-1 text-xl font-bold text-white">{s.label}</div>
                    {s.context ? <div className="text-sm text-neutral-200">{s.context}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* BODY SECTION 1 (image left, text right) */}
      <section className="page-section">
        <h2 className="h2 text-center mb-8">{mainContentHeader}</h2>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 overflow-hidden bg-neutral-100 md:order-1">
            <div className="aspect-[16/9] w-full">
              <ImageOrPlaceholder src={image1Url} alt={image1Alt} />
            </div>
          </div>

          <div className="order-1 md:order-2">
            {bodySubheading1 ? (
              <h3 className="h3 font-semibold">{bodySubheading1}</h3>
            ) : null}
            {body1 ? <p className="mt-4 leading-relaxed text-neutral-700">{body1}</p> : null}
          </div>
        </div>

        {/* BODY SECTION 2 (text left, image right) */}
        <div className="grid items-center gap-10 mt-8 md:grid-cols-2">
          <div className="md:order-1">
            {bodySubheading2 ? (
              <h3 className="h3 font-semibold">{bodySubheading2}</h3>
            ) : null}
            {body2 ? <p className="mt-4 leading-relaxed text-neutral-700">{body2}</p> : null}
          </div>

          <div className="md:order-2 overflow-hidden bg-neutral-100">
            <div className="aspect-[16/9] w-full">
              <ImageOrPlaceholder src={image2Url} alt={image2Alt} />
            </div>
          </div>
        </div>
      </section>

      {/* ANNUAL REPORT (BACKGROUND IMAGE SECTION + WAVE) */}
      <section className="relative overflow-hidden">
        {/* Background image from annualReportBgImage */}
        <div
          className="absolute inset-0 bg-neutral-900"
          aria-hidden
          style={
            annualBgUrl
              ? {
                  backgroundImage: `url(${annualBgUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gmcc-navy/75" aria-hidden />
        {/* (Accessibility: keep alt available if needed elsewhere) */}
        <span className="sr-only">{annualBgAlt}</span>

        <div className="relative mx-auto max-w-6xl px-6 py-8 text-center text-white md:py-12">
          <h2 className="h2 text-white mt-6">{annualHeader}</h2>
          {annualSubtext ? <p className="mx-auto mt-6 max-w-2xl text-sm text-neutral-200">{annualSubtext}</p> : null}

          {/* Annual report link */}
          <div className="mt-8 mb-20 flex justify-center">
            <a
              href={annualReportUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              {annualBtnLabel}
            </a>
          </div>
        </div>

        {/* Wave */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 390 120"
          className="block h-14 w-full origin-center text-white [transform:scaleY(-1)] md:hidden"
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
          className="hidden h-16 w-full origin-center text-white [transform:scaleY(-1)] md:block"
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

      {/* GET INVOLVED */}
      <section className="page-section">
        <h2 className="h2 text-center">{getInvolvedHeader}</h2>
        {getInvolvedBody ? (
          <p className="mx-auto mt-4 max-w-4xl text-center text-neutral-700">{getInvolvedBody}</p>
        ) : null}

        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {/* Volunteer */}
          <a href={volunteerCta ?? "#"} className="group overflow-hidden rounded-xl bg-gmcc-teal shadow-sm ring-1 ring-neutral-200">
            <div className="aspect-[16/9] w-full">
              <ImageOrPlaceholder src={volunteerImageUrl} alt={volunteerImageAlt} />
            </div>
            <div className="p-5">
              <div className="mt-2 inline-flex w-full items-center justify-center text-xl font-bold text-white group-hover:opacity-90">
                Volunteer
              </div>
            </div>
          </a>

          {/* Donate */}
          <a href={donateCta ?? "#"} className="group overflow-hidden rounded-xl bg-gmcc-teal shadow-sm ring-1 ring-neutral-200">
            <div className="aspect-[16/9] w-full">
              <ImageOrPlaceholder src={donateImageUrl} alt={donateImageAlt} />
            </div>
            <div className="p-5">
              <div className="mt-2 inline-flex w-full items-center justify-center text-xl font-bold text-white group-hover:opacity-90">
                Donate
              </div>
            </div>
          </a>

          {/* Sponsor */}
          <a href={sponsorCta ?? "#"} className="group overflow-hidden rounded-xl bg-gmcc-teal shadow-sm ring-1 ring-neutral-200">
            <div className="aspect-[16/9] w-full">
              <ImageOrPlaceholder src={sponsorImageUrl} alt={sponsorImageAlt} />
            </div>
            <div className="p-5">
              <div className="mt-2 inline-flex w-full items-center justify-center text-xl font-bold text-white group-hover:opacity-90">
                Sponsor
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonialsHeader || testimonials?.length ? (
        <section className="page-section">
          {testimonialsHeader ? (
            <h2 className="h2 text-center">{testimonialsHeader}</h2>
          ) : null}

          <TestimonialSection testimonials={testimonials ?? []} />
        </section>
      ) : null}
    </main>
  );
}