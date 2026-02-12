"use client";

import Accordion from "@/components/accordion";

type LeadershipAccordionProps = {
  ccBoardMembers?: string | null;
  tcBoardMembers?: string | null;
  curlcBoardMembers?: string | null;
  cfcBoardMembers?: string | null;
  nfcBoardMembers?: string | null;
  cwcBoardMembers?: string | null;
};

// Helper function to parse board members and render as a list
function renderBoardMembersList(text: string | null | undefined) {
  if (!text) return <p className="text-neutral-500">No board members listed.</p>;
  
  const members = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (members.length === 0) {
    return <p className="text-neutral-500">No board members listed.</p>;
  }

  return (
    <ul className="space-y-2">
      {members.map((member, index) => {
        // Parse format: "Name, Position" or just "Name"
        const parts = member.split(',').map(p => p.trim());
        const name = parts[0];
        const position = parts[1];

        return (
          <li key={index} className="flex justify-between items-start">
            <span className="text-gmcc-navy font-medium pl-64">{name}</span>
            {position && (
              <span className="text-neutral-600 text-sm ml-4 pr-64">{position}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function LeadershipAccordion({
  ccBoardMembers,
  tcBoardMembers,
  curlcBoardMembers,
  cfcBoardMembers,
  nfcBoardMembers,
  cwcBoardMembers,
}: LeadershipAccordionProps) {
  const accordionItems = [
    {
      id: "community-center",
      title: "Community Center",
      content: renderBoardMembersList(ccBoardMembers),
    },
    {
      id: "tennis-center",
      title: "Tennis Center",
      content: renderBoardMembersList(tcBoardMembers),
    },
    {
      id: "curling-center",
      title: "Curling Center",
      content: renderBoardMembersList(curlcBoardMembers),
    },
    {
      id: "coleman-family-center",
      title: "Coleman Family Center",
      content: renderBoardMembersList(cfcBoardMembers),
    },
    {
      id: "north-family-center",
      title: "North Family Center",
      content: renderBoardMembersList(nfcBoardMembers),
    },
    {
      id: "corporate-wellness",
      title: "Corporate Wellness",
      content: renderBoardMembersList(cwcBoardMembers),
    },
  ];

  return <Accordion items={accordionItems} allowMultiple={false} />;
}
