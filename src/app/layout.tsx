// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/nav/navbar";
import Footer from "@/components/footer/footer";
import LanguageRedirect from "@/components/languageRedirect";
import { getPrimaryNav } from "@/lib/nav/getPrimaryNav";
import { getFooterNav } from "@/lib/nav/getFooterNav";
import { getUtilityNav } from "@/lib/nav/getUtilityMenu";
import { NavItem } from "@/lib/nav/tree";

export const metadata: Metadata = {
  title: "Greater Midland",
  description: "Greater Midland Community Center",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nav, utilityNav, footerNav] = await Promise.all([
    getPrimaryNav(),
    getUtilityNav(),
    getFooterNav(),
  ]);
  
  const utilityItems = utilityNav as NavItem[];
  

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <LanguageRedirect />
        <Navbar items={nav} utilityItems={utilityItems} />
        <main className="flex-1">{children}</main>
        <Footer items={footerNav} />
      </body>
    </html>
  );
}
