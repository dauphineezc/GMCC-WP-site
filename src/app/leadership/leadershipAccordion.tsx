"use client";

import Accordion from "@/components/accordion";

type LeadershipAccordionProps = {
  ccBoardMembers?: string | null;
  tcBoardMembers?: string | null;
  cfcBoardMembers?: string | null;
  nfcBoardMembers?: string | null;
};

// Helper function to parse board members text into table format
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

// Helper function to render board members as a table
function renderBoardMembersTable(text: string | null | undefined) {
  const members = parseBoardMembers(text);
  
  if (members.length === 0) {
    return <p className="text-neutral-500">No board members listed.</p>;
  }

  return (
    <table className="w-full table-fixed">
      <colgroup>
        <col className="w-1/3" />
        <col className="w-1/3" />
        <col className="w-1/3" />
      </colgroup>
      <tbody>
        {members.map((member, index) => (
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
  );
}

export default function LeadershipAccordion({
  ccBoardMembers,
  tcBoardMembers,
  cfcBoardMembers,
  nfcBoardMembers,
}: LeadershipAccordionProps) {
  const accordionItems = [
    {
      id: "community-center",
      title: "Community Center",
      content: renderBoardMembersTable(ccBoardMembers),
    },
    {
      id: "tennis-center",
      title: "Tennis Center",
      content: renderBoardMembersTable(tcBoardMembers),
    },
    {
      id: "coleman-family-center",
      title: "Coleman Family Center",
      content: renderBoardMembersTable(cfcBoardMembers),
    },
    {
      id: "north-family-center",
      title: "North Family Center",
      content: renderBoardMembersTable(nfcBoardMembers),
    },
  ];

  return <Accordion items={accordionItems} allowMultiple={false} />;
}
