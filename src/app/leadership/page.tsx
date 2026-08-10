import { wpFetch } from "@/lib/wp";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import { PAGE_HERO_FIELDS_GRAPHQL, resolvePhotoWaveHeaderProps } from "@/lib/pageHeroFields";
import Image from "next/image";
import Link from "next/link";
import LeadershipAccordion from "./leadershipAccordion";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";

const LEADERSHIP_PAGE_QUERY = /* GraphQL */ `
  query LeadershipPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug

      ${PAGE_HERO_FIELDS_GRAPHQL}
      leadershipPageFields {
        organizationHeader
        organizationBlurb
        elts {
          nodes {
            ...on StaffProfile {
              title
              featuredImage { node { ${WP_MEDIA_IMAGE_FIELDS} }}
              staffProfilesFields {
                title
                dotCardLink
              }
            }
          }
        }
        boardOfTrusteesHeader
        boardOfTrusteesBlurb
        boardMembers
        ccBoardMembers
        tcBoardMembers
        cfcBoardMembers
        nfcBoardMembers
        curlcBoardMembers
      }
    }
  }
`;

type StaffProfile = {
  title?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
      focalPointX?: number | string | null;
      focalPointY?: number | string | null;
      hasCustomFocalPoint?: boolean | null;
    } | null;
  } | null;
  staffProfilesFields?: {
    title?: string | null;
    dotCardLink?: string | null;
  } | null;
};

type LeadershipFields = {
  organizationHeader?: string | null;
  organizationBlurb?: string | null;
  elts?: {
    nodes?: StaffProfile[] | null;
  } | null;
  boardOfTrusteesHeader?: string | null;
  boardOfTrusteesBlurb?: string | null;
  boardMembers?: string | null;
  ccBoardMembers?: string | null;
  tcBoardMembers?: string | null;
  cfcBoardMembers?: string | null;
  nfcBoardMembers?: string | null;
  curlcBoardMembers?: string | null;
};

// Helper function to parse board members text into table rows
function parseBoardMembers(text: string | null | undefined): Array<{ name: string; business: string; position: string }> {
  if (!text) return [];
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Parse format: "Name, Business, Position"
      const parts = line.split(',').map(p => p.trim());
      return {
        name: parts[0] || '',
        business: parts[1] || '',
        position: parts[2] || ''
      };
    })
    .filter(member => member.name);
}

export default async function LeadershipPage() {
  const uri = "leadership";

  const data = await wpFetch<{
    page?: {
      leadershipPageFields?: LeadershipFields | null;
      title?: string | null;
    } | null;
  }>(LEADERSHIP_PAGE_QUERY, { uri });

  const fields = data?.page?.leadershipPageFields ?? null;
  const hero = resolvePhotoWaveHeaderProps(data?.page, "Leadership");
  
  // Define the desired order for ELTs
  const eltOrder = [
    "Terri Johnson",
    "Andrea Secrease",
    "Jeff Rekeweg",
    "Andrea Conquest",
    "Jodi Hayes",
    "Shane Forfar",
    "Andrew Warren",
    "Stephanie Swanson"
  ];
  
  // Sort ELTs according to the defined order
  const rawElts = fields?.elts?.nodes ?? [];
  const elts = [...rawElts].sort((a, b) => {
    const indexA = eltOrder.indexOf(a.title || '');
    const indexB = eltOrder.indexOf(b.title || '');
    
    // If both are in the order list, sort by their position
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only A is in the list, it comes first
    if (indexA !== -1) return -1;
    // If only B is in the list, it comes first
    if (indexB !== -1) return 1;
    // If neither are in the list, maintain original order
    return 0;
  });
  
  const boardMembers = parseBoardMembers(fields?.boardMembers);

  return (
    <main>
      <PhotoWaveHeader
        title={hero.title}
        subheader={hero.subheader}
        imageUrl={hero.imageUrl} imagePosition={hero.imagePosition}
        ctas={hero.ctas}
      />

        {/* Organization + Executive Leaders */}
        {(fields?.organizationHeader || elts.length > 0) && (
          <section className="page-section stack-6">
            {fields?.organizationHeader ? (
              <h2 className="h2 text-gmcc-navy text-center">
                {fields.organizationHeader}
              </h2>
            ) : null}
            {fields?.organizationBlurb ? (
              <div
                className="body text-center text-neutral-700 max-w-4xl mx-auto"
                dangerouslySetInnerHTML={{ __html: fields.organizationBlurb }}
              />
            ) : null}
            {elts.length > 0 ? (
              <>
                <h2 className="h2 text-gmcc-navy text-center">
                  Executive Leaders
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {elts.map((staff, index) => {
                    const dotCardLink = staff.staffProfilesFields?.dotCardLink;
                    const cardClassName =
                      "flex flex-col rounded-2xl border border-neutral-100 bg-white shadow-md overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl hover:border-neutral-300";

                    const cardBody = (
                      <>
                        {staff.featuredImage?.node?.sourceUrl && (
                          <div className="relative w-full aspect-square">
                            <Image
                              src={staff.featuredImage.node.sourceUrl}
                              alt={staff.featuredImage.node.altText || staff.title || ""}
                              fill
                              className="object-cover"
                              style={(() => {
                                const pos = mediaFocalPositionCss(staff.featuredImage.node);
                                return pos ? { objectPosition: pos } : undefined;
                              })()}
                            />
                          </div>
                        )}
                        <div className="bg-gmcc-navy text-white p-4 flex-grow">
                          <h3 className="font-semibold text-lg">{staff.title}</h3>
                          {staff.staffProfilesFields?.title && (
                            <p className="text-sm opacity-90 italic">
                              {staff.staffProfilesFields.title}
                            </p>
                          )}
                        </div>
                      </>
                    );

                    return dotCardLink ? (
                      <Link key={index} href={dotCardLink} className={cardClassName}>
                        {cardBody}
                      </Link>
                    ) : (
                      <div key={index} className={cardClassName}>
                        {cardBody}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </section>
        )}

        {/* Board of Trustees Section */}
        {fields?.boardOfTrusteesHeader && (
          <section className="page-section stack-6">
            <h2 className="h2 text-gmcc-navy text-center">
              {fields.boardOfTrusteesHeader}
            </h2>
            {fields.boardOfTrusteesBlurb ? (
              <div
                className="body text-center text-neutral-700 max-w-4xl mx-auto"
                dangerouslySetInnerHTML={{ __html: fields.boardOfTrusteesBlurb }}
              />
            ) : null}

            {/* Board Members Table */}
            {boardMembers.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-1/4" />
                    <col className="w-2/4" />
                    <col className="w-1/4" />
                  </colgroup>
                  <tbody>
                    {boardMembers.map((member, index) => (
                      <tr 
                        key={index}
                        className={`border-b border-neutral-200 ${
                          index % 2 === 0 ? 'bg-neutral-50' : 'bg-white'
                        }`}
                      >
                        <td className="py-3 px-4 text-left text-gmcc-navy">
                          {member.name}
                        </td>
                        <td className="py-3 px-4 text-center text-neutral-600">
                          {member.business}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600">
                          {member.position}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Operating Unit Boards Accordion */}
        <section className="page-section stack-6">
          <h2 className="h2 text-center">
            Operating Unit Boards
          </h2>
          <div className="max-w-4xl mx-auto">
            <LeadershipAccordion
              ccBoardMembers={fields?.ccBoardMembers}
              tcBoardMembers={fields?.tcBoardMembers}
              cfcBoardMembers={fields?.cfcBoardMembers}
              nfcBoardMembers={fields?.nfcBoardMembers}
              curlcBoardMembers={fields?.curlcBoardMembers}
            />
          </div>
        </section>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/leadership");
}
