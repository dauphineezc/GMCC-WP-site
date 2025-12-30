// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/nav/navbar";
import Footer from "@/components/footer/footer";
import { getPrimaryNav } from "@/lib/nav/getPrimaryNav";
import { getFooterNav } from "@/lib/nav/getFooterNav";

export const metadata: Metadata = {
  title: "Greater Midland",
  description: "Greater Midland Community Center",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nav, footerNav] = await Promise.all([
    getPrimaryNav(),
    getFooterNav(),
  ]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <Navbar items={nav} />
        <main className="flex-1">{children}</main>
        <Footer items={footerNav} />
      </body>
    </html>
  );
}