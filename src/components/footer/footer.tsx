// components/footer/footer.tsx
import Link from "next/link";
import Image from "next/image";
import type { FooterNavItem } from "@/lib/nav/getFooterNav";

type FooterProps = {
  items: FooterNavItem[];
};

export default function Footer({ items }: FooterProps) {
  return (
    <footer className="bg-[#01192E] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        {/* Logo */}
        <div className="flex justify-center mb-6 md:mb-8">
          <Link href="/">
            <Image
              src="/GMLogoRibbonOnlyTransparent.png"
              alt="Greater Midland"
              width={60}
              height={60}
              className="h-10 md:h-12 w-auto opacity-80"
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Footer" className="mb-6 md:mb-8">
          <ul className="flex flex-wrap justify-center gap-x-6 md:gap-x-10 gap-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="text-xs md:text-sm tracking-widest uppercase text-white/90 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Divider - visible on mobile */}
        <div className="md:hidden border-t border-white/20 my-6" />

        {/* Contact Info */}
        <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-y-3 md:gap-x-6 md:gap-y-2 text-xs md:text-sm tracking-wide text-white/80">
          <span className="font-medium">GREATER MIDLAND</span>
          <span className="text-center">2205 S Jefferson Ave, Midland MI, 48640</span>
          <div className="flex gap-4 md:gap-6">
            <a 
              href="tel:+19899234622" 
              className="hover:text-white transition-colors"
            >
              (989) 923-4622
            </a>
            <a 
              href="mailto:info@greatermidland.org" 
              className="hover:text-white transition-colors"
            >
              INFO@GREATERMIDLAND.ORG
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

