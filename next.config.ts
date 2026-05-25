import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Ideal for Beta soft-launches.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;