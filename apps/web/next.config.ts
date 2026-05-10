import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@petcura/ai",
    "@petcura/shared",
    "@petcura/ui",
    "@petcura/validation"
  ]
};

export default nextConfig;
