import type { Metadata } from "next";
import { toAbsoluteUrl } from "@/lib/sitemap/siteUrl";

export const metadata: Metadata = {
  alternates: {
    canonical: toAbsoluteUrl("/_playground/program-builder"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProgramBuilderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
