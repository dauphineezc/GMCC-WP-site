// components/footer/footer.tsx
"use client";

import Link from "next/link";
import type { FooterNavItem } from "@/lib/nav/getFooterNav";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/constants";
import { WAVE_SVG_BLEED_CLASS, WaveEdgeBar } from "@/components/waveSeam";

type FooterProps = {
  items: FooterNavItem[];
};

/**
 * Footer wave is painted as navy on a white underlay (not a white cutout over navy).
 * That avoids the mobile hairline where navy used to peek above the SVG anti-alias edge.
 */
export default function Footer({ items }: FooterProps) {
  return (
    <footer className="relative text-white">
      <div className="relative z-[1] -mb-[4px] w-full bg-white leading-none">
        <svg
          viewBox="0 0 1440 120"
          className={`${WAVE_SVG_BLEED_CLASS} h-10 text-gmcc-navy md:h-16`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="
              M0,110
              C300,-50  500,120  800,100
              S1000,0 1440,0
              L1440,120 L0,120 Z
            "
            fill="currentColor"
          />
        </svg>
        <WaveEdgeBar side="bottom" className="bg-gmcc-navy" />
      </div>

      <div className="relative -mt-[4px] bg-gmcc-navy pt-8 md:pt-12">
        <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
          <nav aria-label="Footer" className="mb-6 md:mb-8">
            <ul className="flex flex-wrap justify-center gap-x-6 md:gap-x-10 gap-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="eyebrow text-white/90 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:hidden border-t border-white/20 my-6" />

          <div
            className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-y-3 md:gap-x-6 md:gap-y-2 small tracking-wide text-white/80"
            translate="no"
          >
            <span className="font-medium">GREATER MIDLAND</span>
            <span className="text-center">2205 S Jefferson Ave, Midland MI, 48640</span>
            <div className="flex gap-4 md:gap-6">
              <a href="tel:+19899234622" className="hover:text-white transition-colors">
                (989) 923-4622
              </a>
              <a href={CONTACT_EMAIL_HREF} className="hover:text-white transition-colors">
                {CONTACT_EMAIL.toUpperCase()}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
