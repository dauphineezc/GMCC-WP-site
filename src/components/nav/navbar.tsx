// components/nav/navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { NavItem } from "@/lib/nav/tree";
import ProgramsMegaMenu from "@/components/nav/programsMegaMenu";
import StandardDropdown from "@/components/nav/standardDropdown";
import MobileMenu from "@/components/nav/mobileMenu";

export default function Navbar({ items }: { items: NavItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Separate Home from other nav items
  const homeItem = items.find((item) => item.label.toLowerCase() === "home");
  const mainItems = items.filter((item) => item.label.toLowerCase() !== "home");

  // Find the currently open item for rendering the dropdown
  const openItem = mainItems.find((item) => item.id === openId);
  const hasOpenDropdown = openItem && openItem.children.length > 0;

  return (
    <header 
      className="relative bg-white"
      onMouseLeave={() => setOpenId(null)}
    >
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
        {/* Logo - left aligned */}
        <Link href="/" className="shrink-0 mr-auto" title="Home Page" aria-label="Home Page">
          <Image
            src="/GM Logo.jpeg"
            alt="Greater Midland"
            width={220}
            height={96}
            className="h-16 lg:h-[96px] w-auto"
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
                    className={`rounded px-5 py-2 text-[22px] font-medium transition-colors inline-block ${
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
      <div className="h-1 w-full bg-gradient-to-r from-gmcc-teal-light via-gmcc-teal to-gmcc-teal-light" />

      {/* Desktop full-width dropdown panel */}
      {hasOpenDropdown && (
        <div className="hidden lg:block absolute left-0 right-0 top-full z-50 w-full bg-white shadow-lg border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="flex justify-center">
              {isMegaMenu(openItem) ? (
                <ProgramsMegaMenu item={openItem} />
              ) : (
                <StandardDropdown item={openItem} />
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
  );
}

function isMegaMenu(item: NavItem) {
  return item.children.some((c) => c.children.length > 0);
}
