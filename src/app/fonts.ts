import localFont from "next/font/local";

// Self-hosted (latin subset from Google Fonts) so builds never depend on fetching fonts.googleapis.com.

export const headingFont = localFont({
  src: [{ path: "./fonts/libre-franklin-500-700-latin.woff2", weight: "500 700", style: "normal" }],
  variable: "--font-heading-loaded",
  display: "swap",
});

export const secondaryFont = localFont({
  src: [
    { path: "./fonts/poppins-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600-latin.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-secondary-loaded",
  display: "swap",
});

export const bodyFont = localFont({
  src: [{ path: "./fonts/roboto-400-700-latin.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-body-loaded",
  display: "swap",
});

export const scriptFont = localFont({
  src: [{ path: "./fonts/dancing-script-700-latin.woff2", weight: "700", style: "normal" }],
  variable: "--font-script-loaded",
  display: "swap",
});
