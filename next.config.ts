import type { NextConfig } from "next";
import { WP_CACHE_TAGS } from "./src/lib/revalidate";

/** Layout-affecting tags present on every HTML response for edge purgeTags. */
const BASE_EDGE_TAGS = [
  WP_CACHE_TAGS.nav,
  WP_CACHE_TAGS.announcements,
  WP_CACHE_TAGS.all,
] as const;

function cacheTag(...sectionTags: string[]): { key: string; value: string } {
  const value = [...new Set([...sectionTags, ...BASE_EDGE_TAGS])].join(",");
  return { key: "Cache-Tag", value };
}

/**
 * One complete Cache-Tag per route family. When several rules set the same header,
 * Next uses the last match, so the catch-all must stay first.
 * Cloudflare strips Cache-Tag before the browser — verify via purge behavior.
 */
const cacheTagHeaders = [
  {
    source: "/((?!_next/|api/).*)",
    headers: [cacheTag(WP_CACHE_TAGS.pages)],
  },
  {
    source: "/",
    headers: [
      cacheTag(
        WP_CACHE_TAGS.pages,
        WP_CACHE_TAGS.events,
        WP_CACHE_TAGS.news,
        WP_CACHE_TAGS.programs,
        WP_CACHE_TAGS.centers,
      ),
    ],
  },
  {
    source: "/programs",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/programs/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/camps",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/camps/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/personal-training",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/personal-training/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/private-lessons",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/private-lessons/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.programs)],
  },
  {
    source: "/centers",
    headers: [cacheTag(WP_CACHE_TAGS.centers)],
  },
  {
    source: "/centers/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.centers, WP_CACHE_TAGS.events)],
  },
  {
    source: "/amenities/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.amenities, WP_CACHE_TAGS.centers)],
  },
  {
    source: "/accessibility",
    headers: [cacheTag(WP_CACHE_TAGS.amenities)],
  },
  {
    source: "/accessibility/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.amenities)],
  },
  {
    source: "/events",
    headers: [cacheTag(WP_CACHE_TAGS.events)],
  },
  {
    source: "/events/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.events)],
  },
  {
    source: "/visit",
    headers: [cacheTag(WP_CACHE_TAGS.events, WP_CACHE_TAGS.pages)],
  },
  {
    source: "/visit/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.events, WP_CACHE_TAGS.pages)],
  },
  {
    source: "/news",
    headers: [cacheTag(WP_CACHE_TAGS.news)],
  },
  {
    source: "/news/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.news)],
  },
  {
    source: "/membership",
    headers: [cacheTag(WP_CACHE_TAGS.membership, WP_CACHE_TAGS.amenities)],
  },
  {
    source: "/membership/:path*",
    headers: [cacheTag(WP_CACHE_TAGS.membership, WP_CACHE_TAGS.amenities)],
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gmccsandbo1dev.wpenginepowered.com",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "gmccstage.wpenginepowered.com",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
        port: "",
        pathname: "/video/**",
      },
    ],
  },
  async headers() {
    return cacheTagHeaders;
  },
};

export default nextConfig;
