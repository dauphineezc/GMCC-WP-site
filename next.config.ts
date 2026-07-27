import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gmccsandbo1dev.wpenginepowered.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gmccstage.wpenginepowered.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
        port: '',
        pathname: '/video/**',
      },
    ],
  },
};

export default nextConfig;
