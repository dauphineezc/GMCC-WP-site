// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/nav/navbar";
import Footer from "@/components/footer/footer";
import { getPrimaryNav } from "@/lib/nav/getPrimaryNav";
import { getFooterNav } from "@/lib/nav/getFooterNav";
import { getUtilityNav } from "@/lib/nav/getUtilityMenu";
import { NavItem } from "@/lib/nav/tree";
import { bodyFont, headingFont, scriptFont, secondaryFont } from "./fonts";
import GoogleTranslateInit from "@/components/GoogleTranslateInit";
import { AnnouncementBarClient } from "@/components/announcementBarClient";
import { getGlobalAnnouncement } from "@/lib/wordpress/announcements";
import { getSiteBaseUrl } from "@/lib/sitemap/siteUrl";

const GTM_ID = "GTM-5HCKM7TK";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  title: "Greater Midland",
  description: "Greater Midland Community Center",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nav, utilityNav, footerNav, globalAnnouncement] = await Promise.all([
    getPrimaryNav(),
    getUtilityNav(),
    getFooterNav(),
    getGlobalAnnouncement(),
  ]);
  
  const utilityItems = utilityNav as NavItem[];
  

  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${secondaryFont.variable} ${bodyFont.variable} ${scriptFont.variable}`}
    >
      <body className="min-h-screen bg-white text-neutral-900 flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Script id="google-tag-manager" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>
        {/* Suspense is required because GoogleTranslateInit uses usePathname,
            which opts the component into dynamic rendering context */}
        <Suspense fallback={null}>
          <GoogleTranslateInit />
        </Suspense>
        {/* Do not set overflow-x here: paired with default overflow-y it becomes a scrollport and breaks position:sticky in <main>. */}
        <div className="flex flex-col flex-1">
          <Navbar
            items={nav}
            utilityItems={utilityItems}
            banner={
              globalAnnouncement ? (
                <AnnouncementBarClient announcement={globalAnnouncement} />
              ) : null
            }
          />
          <main className="flex-1 min-w-0">{children}</main>
          <Footer items={footerNav} />
        </div>
      </body>
    </html>
  );
}
