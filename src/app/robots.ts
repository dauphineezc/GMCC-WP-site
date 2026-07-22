import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/sitemap/siteUrl";

/**
 * Minimal robots.txt — allows crawling of public pages and points to sitemap.xml.
 * Intentionally does not list Disallow rules for internal paths; doing so would
 * advertise routes that exist but are not meant for discovery.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${getSiteBaseUrl()}/sitemap.xml`,
  };
}
