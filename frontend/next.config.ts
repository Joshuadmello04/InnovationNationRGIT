import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // This enables experimental features (remove invalid properties if necessary)
  },
  // Configure how images are handled
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
