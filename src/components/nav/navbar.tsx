// components/nav/navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { NavItem } from "@/lib/nav/tree";
import ProgramsMegaMenu from "@/components/nav/programsMegaMenu";
import StandardDropdown from "@/components/nav/standardDropdown";
import MobileMenu from "@/components/nav/mobileMenu";

export default function Navbar({ items }: { items: NavItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Use hysteresis to prevent flickering at threshold
      // Shrink when past 60px, expand only when back below 20px
      if (scrollY > 60) {
        setIsScrolled(true);
      } else if (scrollY < 20) {
        setIsScrolled(false);
      }
      // Between 20-60px, keep current state (don't change)
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Separate Home from other nav items
  const homeItem = items.find((item) => item.label.toLowerCase() === "home");
  const mainItems = items.filter((item) => item.label.toLowerCase() !== "home");

  // Find the currently open item for rendering the dropdown
  const openItem = mainItems.find((item) => item.id === openId);
  const hasOpenDropdown = openItem && openItem.children.length > 0;

  return (
    <>
      {/* Spacer - fixed at shrunken navbar height, expanded navbar overlaps content */}
      <div className="hidden lg:block h-[56px]" />
      
      <header 
        className={`relative bg-white lg:fixed lg:top-0 lg:left-0 lg:right-0 lg:z-50 transition-all duration-300 ${
          isScrolled ? "shadow-sm" : ""
        }`}
        onMouseLeave={() => setOpenId(null)}
      >
        <div className={`mx-auto flex max-w-7xl items-center px-4 transition-all duration-300 ${
          isScrolled ? "py-1" : "py-3"
        }`}>
        {/* Logo - left aligned */}
        <Link href="/" className="shrink-0 mr-auto" title="Home Page" aria-label="Home Page">
          <Image
            src="/GM Logo.jpeg"
            alt="Greater Midland"
            width={220}
            height={96}
            className={`w-auto transition-all duration-300 ${
              isScrolled ? "h-10 lg:h-12" : "h-16 lg:h-[96px]"
            }`}
            priority
          />
        </Link>

        {/* Desktop nav items - hidden on mobile */}
        <nav aria-label="Primary" className="hidden lg:flex flex-1 justify-center">
          <ul className="flex items-center gap-2">
            {mainItems.map((top) => {
              const hasDropdown = top.children.length > 0;
              const open = openId === top.id;

              return (
                <li
                  key={top.id}
                  onMouseEnter={() => hasDropdown ? setOpenId(top.id) : setOpenId(null)}
                >
                  <Link
                    href={top.href}
                    onClick={() => setOpenId(null)}
                    className={`rounded px-5 py-2 font-medium transition-all duration-300 inline-block ${
                      isScrolled ? "text-base" : "text-[22px]"
                    } ${
                      open 
                        ? "bg-gmcc-blue-light text-gmcc-navy" 
                        : "text-gmcc-navy hover:bg-gmcc-blue-light/50"
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
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          aria-label="Open menu"
        >
          <svg
            className="w-8 h-8 text-gmcc-navy"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Gradient line */}
      <div className={`w-full bg-gradient-to-r from-gmcc-teal-light via-gmcc-teal to-gmcc-teal-light transition-all duration-300 ${
        isScrolled ? "h-0.75" : "h-1"
      }`}/>
      
      {/* Gradient shadow overlay - positioned over content below */}
      <div className="absolute left-0 right-0 top-full h-8 bg-gradient-to-b from-neutral-500/30 via-neutral-500/10 to-transparent pointer-events-none z-40" />

      {/* Desktop full-width dropdown panel */}
      {hasOpenDropdown && (
        <div className="hidden lg:block absolute left-0 right-0 top-full z-50 w-full bg-white shadow-lg border-t border-gray-100">
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
