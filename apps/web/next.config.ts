import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@petcura/ai",
    "@petcura/shared",
    "@petcura/ui",
    "@petcura/validation"
  ],
  experimental: {
    serverActions: {
      // Profile/customer/pet photo uploads are validated at 5 MB in
      // `profile-media.ts`. Multipart overhead can push the POST over that
      // raw file size, so keep the Server Action ceiling slightly higher.
      bodySizeLimit: "8mb"
    },
    // Enables React's View Transitions API integration so client-side
    // navigations (Link clicks, router.push) wrap the route swap in a
    // document.startViewTransition. Elements with matching
    // `view-transition-name` then cross-fade or morph between routes.
    // Disabled automatically under prefers-reduced-motion (see globals.css).
    viewTransition: true
  }
};

export default nextConfig;
