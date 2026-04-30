// components/nav/mobileMenu.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NavItem } from "@/lib/nav/tree";

// Accessibility types and helpers
type TextSize = "normal" | "large" | "xlarge";
type A11yState = {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
};

const A11Y_STORAGE_KEY = "gmcc_a11y";
const LANG_COOKIE = "gmcc_preferred_lang";

const DEFAULT_A11Y_STATE: A11yState = {
  textSize: "normal",
  highContrast: false,
  reduceMotion: false,
};

function applyA11yToDom(state: A11yState) {
  const root = document.documentElement;
  root.dataset.textSize = state.textSize;
  root.classList.toggle("a11y-contrast", state.highContrast);
  root.classList.toggle("reduce-motion", state.reduceMotion);
}

function getLangCookie(): string {
  if (typeof document === "undefined") return "en";
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [name, value] = c.trim().split("=");
    if (name === LANG_COOKIE && value === "es") return "es";
  }
  return "en";
}

function getCurrentPageLang(): "en" | "es" {
  if (typeof window === "undefined") return "en";
  const url = new URL(window.location.href);
  if (url.searchParams.get("_x_tr_tl") === "es") return "es";
  if (window.location.hostname.includes("translate.goog")) return "es";
  return "en";
}

function setLangCookie(lang: string) {
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
  document.cookie = `${LANG_COOKIE}=${lang}; expires=${expires}; path=/; SameSite=Lax`;
}

function isLocalhost(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168."))
  );
}

function resolveTranslatedHref(href: string): string {
  if (typeof window === "undefined") return href;
  if (!window.location.hostname.includes("translate.goog")) return href;
  if (!href || href.startsWith("#")) return href;

  const currentUrl = new URL(window.location.href);
  const targetLang = currentUrl.searchParams.get("_x_tr_tl") || "es";

  let absoluteTarget = href;
  if (!/^https?:\/\//i.test(href)) {
    const originalHost = window.location.hostname
      .replace(".translate.goog", "")
      .replace(/-/g, ".");
    absoluteTarget = `https://${originalHost}${href.startsWith("/") ? href : `/${href}`}`;
  }

  return `https://translate.google.com/translate?sl=en&tl=${targetLang}&u=${encodeURIComponent(
    absoluteTarget
  )}`;
}

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

  // Accessibility state
  const [a11yState, setA11yState] = useState<A11yState>(DEFAULT_A11Y_STATE);
  const [a11yExpanded, setA11yExpanded] = useState(false);

  // Language state
  const [lang, setLang] = useState<string>("en");
  const [langExpanded, setLangExpanded] = useState(false);

  // Load accessibility settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem(A11Y_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<A11yState>;
        const next: A11yState = {
          textSize: parsed.textSize ?? DEFAULT_A11Y_STATE.textSize,
          highContrast: !!parsed.highContrast,
          reduceMotion: !!parsed.reduceMotion,
        };
        setA11yState(next);
      }
    } catch {}
  }, []);

  // Save and apply accessibility settings
  useEffect(() => {
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(a11yState));
    } catch {}
    applyA11yToDom(a11yState);
  }, [a11yState]);

  // Load language preference
  useEffect(() => {
    // Reflect actual page language first; fallback to cookie.
    setLang(getCurrentPageLang() || getLangCookie());
  }, []);

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    setLangCookie(newLang);
    setLang(newLang);
    
    if (isLocalhost()) {
      // Just update state on localhost
      return;
    }

    if (newLang === "es") {
      const currentUrl = window.location.href;
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(currentUrl)}`;
      window.location.href = translateUrl;
    } else if (window.location.hostname.includes("translate.goog")) {
      // Go back to original site
      const originalHost = window.location.hostname
        .replace(".translate.goog", "")
        .replace(/-/g, ".");
      window.location.href = `https://${originalHost}${window.location.pathname}`;
    }
  };

  // Clear search when menu closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setA11yExpanded(false);
      setLangExpanded(false);
    }
  }, [isOpen]);

  // Prevent background page scroll while mobile menu is open.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const { body, documentElement } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevHtmlOverscroll = documentElement.style.overscrollBehavior;

    if (isOpen) {
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      documentElement.style.overflow = "hidden";
      documentElement.style.overscrollBehavior = "none";
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      documentElement.style.overflow = prevHtmlOverflow;
      documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchHref = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      const resolvedSearchHref = resolveTranslatedHref(searchHref);
      if (resolvedSearchHref === searchHref) {
        router.push(searchHref);
      } else {
        window.location.href = resolvedSearchHref;
      }
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
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col overflow-hidden ${
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

        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
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

          {/* Accessibility Section */}
          <div className="border-b border-gray-100">
          <button
            onClick={() => setA11yExpanded(!a11yExpanded)}
            className="w-full flex items-center justify-between pl-6 pr-4 py-2 text-sm font-medium text-neutral-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              {/* <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4a2 2 0 110 4 2 2 0 010-4z" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 8h12" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 20l5-11 5 11" />
              </svg> */}
              Accessibility
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${a11yExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: a11yExpanded ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 space-y-4 bg-gray-50">
                {/* Text Size */}
                <MobileTextSizeSlider
                  value={a11yState.textSize}
                  onChange={(v) => setA11yState((s) => ({ ...s, textSize: v }))}
                />
                
                {/* High Contrast Toggle */}
                <MobileToggle
                  label="High contrast"
                  checked={a11yState.highContrast}
                  onChange={(v) => setA11yState((s) => ({ ...s, highContrast: v }))}
                />
                
                {/* Reduce Motion Toggle */}
                <MobileToggle
                  label="Reduce motion"
                  checked={a11yState.reduceMotion}
                  onChange={(v) => setA11yState((s) => ({ ...s, reduceMotion: v }))}
                />
                
                {/* Reset Button */}
                <button
                  onClick={() => setA11yState(DEFAULT_A11Y_STATE)}
                  className="text-xs font-medium text-neutral-500 hover:text-gmcc-navy"
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          </div>
          </div>

          {/* Language Section */}
          <div className="border-b border-gray-100">
          <button
            onClick={() => setLangExpanded(!langExpanded)}
            className="w-full flex items-center justify-between pl-6 pr-4 py-2 text-sm font-medium text-neutral-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              {/* <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2c3 3 3 17 0 20" />
              </svg> */}
              Language: {lang.toUpperCase()}
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${langExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: langExpanded ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 bg-gray-50">
                <div className="space-y-1">
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      lang === "en" ? "bg-gmcc-blue-light text-gmcc-navy font-medium" : "hover:bg-white text-neutral-700"
                    }`}
                  >
                    <span>English</span>
                    {lang === "en" && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleLanguageChange("es")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      lang === "es" ? "bg-gmcc-blue-light text-gmcc-navy font-medium" : "hover:bg-white text-neutral-700"
                    }`}
                  >
                    <span>Español</span>
                    {lang === "es" && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Utility links (filtered) */}
          {showUtility && (
            <div className="border-b border-gray-100 bg-white">
              <nav aria-label="Utility" className="py-2">
                <ul className="px-6">
                  {utilityItems
                    .filter((u) => {
                      const label = u.label.toLowerCase();
                      return label !== "search" && label !== "accessibility" && label !== "language";
                    })
                    .map((u) => (
                      <li key={u.id}>
                        <Link
                          href={resolveTranslatedHref(u.href)}
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
          <nav>
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
                          href={resolveTranslatedHref(item.href)}
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
                                    href={resolveTranslatedHref(child.href)}
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
                      href={resolveTranslatedHref(item.href)}
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
      </div>
    </>
  );
}

// Mobile Text Size Slider
function MobileTextSizeSlider({
  value,
  onChange,
}: {
  value: TextSize;
  onChange: (value: TextSize) => void;
}) {
  const options: Array<{ value: TextSize; label: string }> = [
    { value: "normal", label: "Default" },
    { value: "large", label: "Larger" },
    { value: "xlarge", label: "Largest" },
  ];

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const index = Math.round(percent * (options.length - 1));
      return options[index].value;
    },
    [options, value]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      const newValue = getValueFromPosition(clientX);
      if (newValue !== value) onChange(newValue);
    },
    [getValueFromPosition, onChange, value]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  const currentIndex = options.findIndex((o) => o.value === value);
  const percent = (currentIndex / (options.length - 1)) * 100;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-600">Text size</span>
        <span className="text-xs font-medium text-gmcc-navy">
          {options.find((o) => o.value === value)?.label}
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative pt-1 pb-5 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-2 bg-neutral-200 rounded-full" />
        <div
          className={`absolute top-1 left-0 h-2 bg-gmcc-navy rounded-full ${isDragging ? "" : "transition-all duration-150"}`}
          style={{ width: `${percent}%` }}
        />
        <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none">
          {options.map((opt, idx) => {
            const isActive = value === opt.value;
            const isPast = currentIndex >= idx;
            return (
              <div key={opt.value} className="relative flex flex-col items-center">
                <div
                  className={[
                    "w-4 h-4 rounded-full border-2",
                    isDragging ? "" : "transition-all duration-150",
                    isActive
                      ? "bg-gmcc-navy border-gmcc-navy scale-110"
                      : isPast
                        ? "bg-gmcc-navy border-gmcc-navy"
                        : "bg-white border-neutral-300",
                  ].join(" ")}
                />
                <span className={`absolute top-5 text-[10px] font-medium ${isActive ? "text-gmcc-navy" : "text-neutral-400"}`}>
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Mobile Toggle
function MobileToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-gmcc-navy" : "bg-neutral-300"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
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
          href={resolveTranslatedHref(item.href)}
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
                  href={resolveTranslatedHref(leaf.href)}
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
