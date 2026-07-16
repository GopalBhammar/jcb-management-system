import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.CAPACITOR_BUILD === "true" ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
