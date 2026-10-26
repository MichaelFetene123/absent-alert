import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: false,
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
