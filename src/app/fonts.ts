import { Dancing_Script, Libre_Franklin, Poppins, Roboto } from "next/font/google";

export const headingFont = Libre_Franklin({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading-loaded",
  display: "swap",
});

export const secondaryFont = Poppins({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-secondary-loaded",
  display: "swap",
});

export const bodyFont = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body-loaded",
  display: "swap",
});

export const scriptFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-script-loaded",
  display: "swap",
});
