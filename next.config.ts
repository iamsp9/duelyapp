import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default withPWA({
  dest: "public",
  register: true,
  // Move Workbox-specific options like skipWaiting inside workboxOptions
  workboxOptions: {
    skipWaiting: true,
  },
  // disable: process.env.NODE_ENV === "development",
})(nextConfig);