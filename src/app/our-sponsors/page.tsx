import { wpFetch } from "@/lib/wp";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import SponsorsGrid, { normalizeSponsors } from "@/components/sponsorsGrid";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";

const OUR_SPONSORS_PAGE_QUERY = /* GraphQL */ `
  query OurSponsorsPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      ${PAGE_HERO_FIELDS_GRAPHQL}
      ourSponsorsPageFields {
        header
        body
        becomeASponsor {
          header
          subheader
          ctaLabel
          cta
          photo { node { ${WP_MEDIA_IMAGE_FIELDS} } }
        }
      }
    }

    sponsors(first: 100) {
      nodes {
        name
        sponsorFields {
          sponsorType
          tier
          link
          logo {
            node { ${WP_MEDIA_IMAGE_FIELDS} }
          }
        }
      }
    }
  }
`;

export default async function OurSponsorsPage() {
  const data = await wpFetch<any>(OUR_SPONSORS_PAGE_QUERY, {
    uri: "/our-sponsors",
  });

  const hero = resolvePhotoWaveHeaderProps(data?.page, "Our Sponsors");
  const pageFields = data?.page?.ourSponsorsPageFields ?? null;
  const sponsors = normalizeSponsors(data?.sponsors?.nodes ?? []);
  const becomeASponsor = pageFields?.becomeASponsor ?? null;
  const becomeASponsorPhotoPosition = mediaFocalPositionCss(
    becomeASponsor?.photo?.node,
  );

  return (
    <main className="overflow-x-clip">
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      />

      {/* Header + body intro */}
      {(pageFields?.header || pageFields?.body) && (
        <section className="page-section">
          {pageFields?.header && (
            <h2 className="h2 text-gmcc-navy">{pageFields.header}</h2>
          )}
          {pageFields?.body && (
            <p className="body mt-4 max-w-4xl whitespace-pre-line">{pageFields.body}</p>
          )}
        </section>
      )}

      {/* Sponsors grid */}
      {sponsors.length > 0 && (
        <section className="page-section">
          <SponsorsGrid sponsors={sponsors} />
        </section>
      )}

      {/* Become a Sponsor */}
      {becomeASponsor && (
        <section className="page-section">
          <div className="relative card bg-gmcc-navy text-white p-0">
            <div className="grid gap-y-4 md:grid-cols-5 md:items-stretch md:gap-x-0">
              <div className="col-span-3 flex flex-col justify-center gap-4 p-8">
                {becomeASponsor.header && (
                  <h2 className="h2 mb-4 text-white">{becomeASponsor.header}</h2>
                )}
                {becomeASponsor.subheader && (
                  <p className="body max-w-2xl text-neutral-200">{becomeASponsor.subheader}</p>
                )}
                {becomeASponsor.cta && (
                  <div className="mt-4">
                    <a href={becomeASponsor.cta} className="btn btn-tertiary">
                      {becomeASponsor.ctaLabel || "Become a Sponsor"}
                    </a>
                  </div>
                )}
              </div>
              {becomeASponsor.photo?.node?.sourceUrl && (
                <div className="relative col-span-2 min-h-[200px] overflow-hidden rounded-tr-[calc(1rem-1px)] rounded-br-[calc(1rem-1px)] md:min-h-0">
                  <img
                    src={becomeASponsor.photo.node.sourceUrl}
                    alt={becomeASponsor.photo.node.altText ?? ""}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={
                      becomeASponsorPhotoPosition
                        ? { objectPosition: becomeASponsorPhotoPosition }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/our-sponsors");
}
