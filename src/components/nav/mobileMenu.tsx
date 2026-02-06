// components/nav/mobileMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NavItem } from "@/lib/nav/tree";

type MobileMenuProps = {
  items: NavItem[];
  utilityItems?: NavItem[];
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileMenu({
  items,
  utilityItems = [],
  isOpen,
  onClose,
}: MobileMenuProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Clear search when menu closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      onClose();
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const showUtility = utilityItems.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <span className="text-xl font-semibold text-gmcc-navy font-large">
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-7 h-7 text-gmcc-navy"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Gradient line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-gmcc-teal-light via-gmcc-teal to-gmcc-teal-light" />

        {/* Search box */}
        <div className="border-b border-gray-100 px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gmcc-teal focus:ring-1 focus:ring-gmcc-teal/30 font-body"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-gmcc-teal text-white text-sm font-medium rounded-lg hover:bg-gmcc-teal-dark transition-colors"
            >
              Go
            </button>
          </form>
        </div>

        {/* Utility links (optional) */}
        {showUtility && (
          <div className="border-b border-gray-100 bg-white">
            <nav aria-label="Utility" className="py-2">
              <ul className="px-6">
                {utilityItems
                  .filter((u) => u.label.toLowerCase() !== "search")
                  .map((u) => (
                    <li key={u.id}>
                      <Link
                        href={u.href}
                        onClick={onClose}
                        className="block py-2 text-sm font-medium text-neutral-700 hover:text-gmcc-navy transition-colors"
                      >
                        {u.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`overflow-y-auto ${
            showUtility ? "h-[calc(100%-64px-56px)]" : "h-[calc(100%-64px)]"
          }`}
        >
          <ul className="py-2">
            {items.map((item) => {
              const hasChildren = item.children.length > 0;
              const isExpanded = expandedId === item.id;

              return (
                <li key={item.id} className="border-b border-gray-100">
                  {hasChildren ? (
                    <>
                      <div className="flex items-center">
                        {/* Clickable label - navigates to page */}
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="flex-1 px-6 py-4 text-gmcc-navy font-medium hover:bg-gmcc-blue-light/30 transition-colors"
                        >
                          {item.label}
                        </Link>
                        {/* Chevron button - toggles submenu */}
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="px-4 py-4 hover:bg-gmcc-blue-light/30 transition-colors"
                          aria-label={
                            isExpanded
                              ? `Collapse ${item.label} submenu`
                              : `Expand ${item.label} submenu`
                          }
                        >
                          <svg
                            className={`w-5 h-5 text-gmcc-navy transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Submenu - using grid for smooth expand/collapse */}
                      <div
                        className="grid transition-[grid-template-rows] duration-300 ease-out"
                        style={{
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                        }}
                      >
                        <div className="overflow-hidden">
                          <ul className="bg-gray-50 py-2">
                            {item.children.map((child) => (
                              <li key={child.id}>
                                {child.children.length > 0 ? (
                                  <NestedSubmenu item={child} onClose={onClose} />
                                ) : (
                                  <Link
                                    href={child.href}
                                    onClick={onClose}
                                    className="block px-10 py-3 text-gray-700 hover:text-gmcc-navy hover:bg-gmcc-blue-light/20 transition-colors"
                                  >
                                    {child.label}
                                  </Link>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block px-6 py-4 text-gmcc-navy font-medium hover:bg-gmcc-blue-light/30 transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}

// Component for nested submenus (third level, like Programs > Aquatics > items)
function NestedSubmenu({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-center">
        {/* Clickable label - navigates to category page */}
        <Link
          href={item.href}
          onClick={onClose}
          className="flex-1 px-10 py-3 text-gray-700 font-medium hover:text-gmcc-navy hover:bg-gmcc-blue-light/20 transition-colors"
        >
          {item.label}
        </Link>
        {/* Chevron button - toggles submenu */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-3 hover:bg-gmcc-blue-light/20 transition-colors"
          aria-label={
            isExpanded
              ? `Collapse ${item.label} submenu`
              : `Expand ${item.label} submenu`
          }
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Using grid for smooth expand/collapse */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <ul className="bg-gray-100 py-1">
            {item.children.map((leaf) => (
              <li key={leaf.id}>
                <Link
                  href={leaf.href}
                  onClick={onClose}
                  className="block px-14 py-2 text-sm text-gray-600 hover:text-gmcc-navy transition-colors"
                >
                  {leaf.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
