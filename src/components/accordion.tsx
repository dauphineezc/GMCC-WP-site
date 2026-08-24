"use client";

import { useState, ReactNode } from "react";

type AccordionItemData = {
  id: string;
  title: string;
  content: ReactNode;
};

type AccordionVariant = "default" | "onDark";

type AccordionProps = {
  items: AccordionItemData[];
  /** Allow multiple items to be open at once. Default: false */
  allowMultiple?: boolean;
  /** Default open item IDs */
  defaultOpenIds?: string[];
  /** Custom class for the accordion container */
  className?: string;
  /** `onDark`: white titles and chevrons for navy (or other dark) backgrounds */
  variant?: AccordionVariant;
};

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  variant?: AccordionVariant;
};

function ChevronIcon({ isOpen, variant = "default" }: { isOpen: boolean; variant?: AccordionVariant }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`w-6 h-6 transition-transform duration-300 ease-in-out ${
        variant === "onDark" ? "text-white" : "text-gmcc-navy"
      } ${isOpen ? "rotate-[-180deg]" : "rotate-0"}`}
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
  variant = "default",
}: AccordionItemProps) {
  const borderClass = variant === "onDark" ? "border-white/25" : "border-neutral-200";
  const titleClass = variant === "onDark" ? "text-xl text-white" : "text-xl text-gmcc-navy";
  const buttonHover =
    variant === "onDark"
      ? "hover:text-white/90 focus-visible:ring-white/60 focus-visible:ring-offset-gmcc-navy"
      : "hover:text-gmcc-navy/80 focus-visible:ring-blue-500";
  const bodyText = variant === "onDark" ? "text-white/90" : "text-neutral-700";

  return (
    <div className={`${borderClass} ${isFirst ? "border-t" : ""} border-b`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between py-4 px-1 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          variant === "onDark" ? "focus-visible:ring-offset-gmcc-navy" : ""
        } ${buttonHover} ${isLast && !isOpen ? "rounded-b-lg" : ""} ${isFirst ? "rounded-t-lg" : ""}`}
        aria-expanded={isOpen}
      >
        <span className={titleClass}>{title}</span>
        <ChevronIcon isOpen={isOpen} variant={variant} />
      </button>

      {/* Content — 0fr/1fr so tall embeds (mobile calendars) are not clipped by a max-height cap. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`px-1 pb-4 ${bodyText}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className = "",
  variant = "default",
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
          variant={variant}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

// Export individual AccordionItem for standalone use if needed
export { AccordionItem };
export type { AccordionItemData, AccordionProps, AccordionItemProps, AccordionVariant };
