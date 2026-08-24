import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/sitemap/siteUrl";

/**
 * Minimal robots.txt - allows crawling of public pages and points to sitemap.xml.
 * Intentionally does not list Disallow rules for internal paths to avoid advertising routes that exist but are not meant for discovery.
 */
export default function robots(): MetadataRoute.Robots {
  // const isProduction =
  //   process.env.VERCEL_ENV === "production";

  // if (!isProduction) {
  //   return {
  //     rules: {
  //       userAgent: "*",
  //       disallow: "/",
  //     },
  //   };
  // }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${getSiteBaseUrl()}/sitemap.xml`,
  };
}
