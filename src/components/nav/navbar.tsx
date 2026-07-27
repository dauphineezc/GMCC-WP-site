// components/nav/navbar.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { NavItem } from "@/lib/nav/tree";
import ProgramsMegaMenu from "@/components/nav/programsMegaMenu";
import StandardDropdown from "@/components/nav/standardDropdown";
import MobileMenu from "@/components/nav/mobileMenu";
import AccessibilityPopover from "@/components/nav/accessibilityPopover";
import LanguagePopover from "@/components/nav/languagePopover";

export default function Navbar({
  items,
  utilityItems = [],
  banner,
}: {
  items: NavItem[];
  utilityItems?: NavItem[];
  banner?: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const bannerSlotRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const header = headerRef.current;
    const spacer = spacerRef.current;
    if (!header || !spacer) return;

    const syncHeaderOffset = () => {
      const height = header.offsetHeight;
      spacer.style.height = `${height}px`;
      document.documentElement.style.setProperty("--site-header-height", `${height}px`);

      const bannerHeight = bannerSlotRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty(
        "--announcement-banner-height",
        `${bannerHeight}px`,
      );
    };

    syncHeaderOffset();

    const observer = new ResizeObserver(syncHeaderOffset);
    observer.observe(header);
    if (bannerSlotRef.current) {
      observer.observe(bannerSlotRef.current);
    }
    window.addEventListener("resize", syncHeaderOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderOffset);
    };
  }, [banner]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Hysteresis + close search when condensing
      if (scrollY > 60) {
        setIsScrolled(true);
        if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery("");
        }
      } else if (scrollY < 20) {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [searchOpen]);

  // Close search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Separate Home from other nav items
  const homeItem = items.find((item) => item.label.toLowerCase() === "home");
  const mainItems = items.filter((item) => item.label.toLowerCase() !== "home");

  // Find the currently open item for rendering the dropdown
  const openItem = mainItems.find((item) => item.id === openId);
  const hasOpenDropdown = openItem && openItem.children.length > 0;

  const showUtility = utilityItems && utilityItems.length > 0;

  return (
    <>
      {/* Spacer matches fixed header height (nav + optional announcement banner). */}
      <div ref={spacerRef} className="hidden xl:block" aria-hidden="true" />

      <header
        ref={headerRef}
        className={`relative bg-white xl:fixed xl:top-0 xl:left-0 xl:right-0 xl:z-50 transition-all duration-300 ${
          isScrolled ? "shadow-sm" : ""
        }`}
        onMouseLeave={() => setOpenId(null)}
      >
        {/* Announcement sits above utility/nav so it stays at the very top */}
        <div ref={bannerSlotRef}>{banner ?? null}</div>

        {/* Utility bar (desktop) - OUTER wrapper allows popovers to overflow */}
        {showUtility && (
          <div className="hidden xl:block bg-neutral-50 border-b border-neutral-200/70 overflow-visible relative z-[70]">
            {/* Inner wrapper handles collapse animation and can clip its own height */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isScrolled ? "max-h-0 py-0" : "max-h-20"
              }`}
            >
              <div className="mx-auto max-w-7xl px-4">
                <nav aria-label="Utility" className="py-2">
                  <ul className="flex items-center justify-end gap-2">
                    {utilityItems.map((u) => {
                      const label = u.label.toLowerCase();
                      const isSearch = label === "search";
                      const isDonate = label === "donate";

                      if (label === "accessibility options") {
                        return (
                          <li key={u.id} className="relative">
                            <AccessibilityPopover />
                          </li>
                        );
                      }

                      if (label === "language") {
                        return (
                          <li key={u.id} className="relative">
                            <LanguagePopover />
                          </li>
                        );
                      }

                      if (isSearch) {
                        return (
                          <li key={u.id} className="flex items-center relative">
                            {/* Inline search form - expands when open */}
                            <div
                              className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
                                searchOpen ? "w-64 mr-2" : "w-0"
                              }`}
                            >
                              <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
                                <input
                                  ref={searchInputRef}
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Search…"
                                  className="w-full px-3 py-1 text-sm bg-white rounded-l border-gmcc-navy text-neutral-900 placeholder-neutral-400 font-body transition-colors"
                                />
                                <button
                                  type="submit"
                                  className="px-2 py-1 bg-gmcc-navy hover:bg-gmcc-navy/80 text-white rounded-r transition-colors"
                                  aria-label="Submit search"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                  </svg>
                                </button>
                              </form>
                            </div>

                            {/* Search toggle button */}
                            <button
                              onClick={() => {
                                setSearchOpen((prev) => !prev);
                                if (!searchOpen) {
                                  setTimeout(() => searchInputRef.current?.focus(), 50);
                                } else {
                                  setSearchQuery("");
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors font-secondary ${
                                searchOpen
                                  ? "bg-neutral-200 text-gmcc-navy"
                                  : "text-neutral-700 hover:text-gmcc-navy hover:bg-neutral-200/60"
                              }`}
                              aria-expanded={searchOpen}
                              aria-label={searchOpen ? "Close search" : "Open search"}
                            >
                              {searchOpen ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                              )}
                              {u.label}
                            </button>
                          </li>
                        );
                      }

                      return (
                        <li key={u.id}>
                          <Link
                            href={u.href}
                            className={[
                              "px-3 py-1 text-xs font-medium rounded transition-colors font-secondary",
                              isDonate
                                ? "text-gmcc-navy decoration-gmcc-navy/30 bg-gmcc-navy/20 hover:decoration-gmcc-navy hover:bg-gmcc-navy/30"
                                : "text-neutral-700 hover:text-gmcc-navy hover:bg-neutral-200/80",
                            ].join(" ")}
                            onClick={() => setOpenId(null)}
                          >
                            {u.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        )}

        <div
          className={`mx-auto flex max-w-7xl items-center px-4 transition-all duration-300 ${
            isScrolled ? "py-1" : "py-3"
          }`}
        >
          {/* Logo - left aligned */}
          <Link
            href={homeItem?.href ?? "/"}
            className="shrink-0 mr-auto"
            title="Home Page"
            aria-label="Home Page"
          >
            <Image
              src="/GM Logo.jpeg"
              alt="Greater Midland"
              width={220}
              height={96}
              className={`w-auto transition-all duration-300 ${isScrolled ? "h-10 xl:h-12" : "h-16 xl:h-[96px]"}`}
              priority
            />
          </Link>

          {/* Desktop nav items - hidden below xl (mega menu needs ~1280px) */}
          <nav aria-label="Primary" className="hidden xl:flex flex-1 justify-center">
            <ul className="flex items-center gap-2">
              {mainItems.map((top) => {
                const hasDropdown = top.children.length > 0;
                const open = openId === top.id;

                return (
                  <li key={top.id} onMouseEnter={() => (hasDropdown ? setOpenId(top.id) : setOpenId(null))}>
                    <Link
                      href={top.href}
                      onClick={() => setOpenId(null)}
                      className={`rounded px-5 py-2 font-medium transition-all duration-300 inline-block ${
                        isScrolled ? "text-base" : "text-[22px]"
                      } ${
                        open ? "bg-gmcc-blue-light text-gmcc-navy" : "text-gmcc-navy hover:bg-gmcc-blue-light/50"
                      }`}
                      aria-expanded={hasDropdown ? open : undefined}
                      aria-haspopup={hasDropdown ? "true" : undefined}
                    >
                      {top.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="xl:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            aria-label="Open menu"
          >
            <svg className="w-8 h-8 text-gmcc-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Gradient line */}
        <div
          className={`w-full bg-gradient-to-r from-gmcc-teal-light via-gmcc-teal to-gmcc-teal-light transition-all duration-300 ${
            isScrolled ? "h-0.75" : "h-1"
          }`}
        />

        {/* Gradient shadow overlay - positioned over content below */}
        <div className="absolute left-0 right-0 top-full h-8 bg-gradient-to-b from-neutral-500/30 via-neutral-500/10 to-transparent pointer-events-none z-40" />

        {/* Desktop full-width dropdown panel */}
        {hasOpenDropdown && (
          <div className="hidden xl:block absolute left-0 right-0 top-full z-50 w-full bg-white shadow-lg border-t border-gray-100">
            <div className="mx-auto max-w-7xl px-6 py-10">
              <div className="flex justify-center">
                {isMegaMenu(openItem) ? (
                  <ProgramsMegaMenu item={openItem} onClose={() => setOpenId(null)} />
                ) : (
                  <StandardDropdown item={openItem} onClose={() => setOpenId(null)} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        <MobileMenu
          items={items}
          utilityItems={utilityItems}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </header>
    </>
  );
}

function isMegaMenu(item: NavItem) {
  return item.children.some((c) => c.children.length > 0);
}
