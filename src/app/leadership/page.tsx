import { wpFetch } from "@/lib/wp";
import HeaderImage from "@/components/headerImage";
import Image from "next/image";
import Link from "next/link";
import LeadershipAccordion from "./leadershipAccordion";

const LEADERSHIP_PAGE_QUERY = /* GraphQL */ `
  query LeadershipPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug
  
      leadershipPageFields {
        organizationHeader
        organizationBlurb
        elts {
          nodes {
            ...on StaffProfile {
              title
              featuredImage { node {sourceUrl altText}}
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
      {/* HEADER IMAGE */}
      <div className="w-full">
        <HeaderImage src="/images/MembershipHeaderImage.png" alt="Greater Midland Memberships" />
      </div>

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        {/* Page Title */}
        {/* <div>
          <h1 className="h1 text-gmcc-navy">{data?.page?.title ?? "Leadership"}</h1>
        </div> */}

        {/* Organization Section */}
        {fields?.organizationHeader && (
          <section className="stack-6">
            <h2 className="h2 text-gmcc-navy text-center mb-4">
              {fields.organizationHeader}
            </h2>
            {fields.organizationBlurb && (
              <div 
                className="text-center text-neutral-700 max-w-4xl mx-auto mb-16"
                dangerouslySetInnerHTML={{ __html: fields.organizationBlurb }}
              />
            )}
          </section>
        )}

        {/* Executive Leaders Section */}
        {elts.length > 0 && (
          <section className="stack-6">
            <h2 className="h2 text-gmcc-navy text-center mb-6">
              Executive Leaders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

                return (
                  dotCardLink ? (
                    <Link key={index} href={dotCardLink} className={cardClassName}>
                      {cardBody}
                    </Link>
                  ) : (
                    <div key={index} className={cardClassName}>
                      {cardBody}
                    </div>
                  )
                );
              })}
            </div>
          </section>
        )}

        {/* Board of Trustees Section */}
        {fields?.boardOfTrusteesHeader && (
          <section className="stack-6">
            <h2 className="h2 text-gmcc-navy text-center mb-4">
              {fields.boardOfTrusteesHeader}
            </h2>
            {fields.boardOfTrusteesBlurb && (
              <div 
                className="text-center text-neutral-700 max-w-4xl mx-auto mb-8"
                dangerouslySetInnerHTML={{ __html: fields.boardOfTrusteesBlurb }}
              />
            )}

            {/* Board Members Table */}
            {boardMembers.length > 0 && (
              <div className="max-w-4xl mx-auto mb-16">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                    <col className="w-1/3" />
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
        <section className="stack-6">
        <h2 className="eyebrow pl-28 mb-4">
            Operating Unit Boards
          </h2>
          <div className="max-w-4xl mx-auto">
            <LeadershipAccordion
              ccBoardMembers={fields?.ccBoardMembers}
              tcBoardMembers={fields?.tcBoardMembers}
              cfcBoardMembers={fields?.cfcBoardMembers}
              nfcBoardMembers={fields?.nfcBoardMembers}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

