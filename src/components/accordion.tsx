"use client";

import { useState, ReactNode } from "react";

type AccordionItemData = {
  id: string;
  title: string;
  content: ReactNode;
};

type AccordionProps = {
  items: AccordionItemData[];
  /** Allow multiple items to be open at once. Default: false */
  allowMultiple?: boolean;
  /** Default open item IDs */
  defaultOpenIds?: string[];
  /** Custom class for the accordion container */
  className?: string;
};

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`w-6 h-6 text-gmcc-navy transition-transform duration-300 ease-in-out ${
        isOpen ? "rotate-[-180deg]" : "rotate-0"
      }`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

function AccordionItem({
  title,
  children,
  isOpen,
  onToggle,
  isFirst = false,
  isLast = false,
}: AccordionItemProps) {
  return (
    <div
      className={`border-neutral-200 ${isFirst ? "border-t" : ""} border-b`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between py-4 px-1 text-left transition-colors hover:text-gmcc-navy/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          isLast && !isOpen ? "rounded-b-lg" : ""
        } ${isFirst ? "rounded-t-lg" : ""}`}
        aria-expanded={isOpen}
      >
        <span className="text-xl text-gmcc-navy">{title}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-1 pb-4 text-neutral-700">{children}</div>
      </div>
    </div>
  );
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className = "",
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(defaultOpenIds)
  );

  const handleToggle = (id: string) => {
    setOpenIds((prev) => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      
      return newSet;
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          isOpen={openIds.has(item.id)}
          onToggle={() => handleToggle(item.id)}
          isFirst={index === 0}
          isLast={index === items.length - 1}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

// Export individual AccordionItem for standalone use if needed
export { AccordionItem };
export type { AccordionItemData, AccordionProps, AccordionItemProps };
