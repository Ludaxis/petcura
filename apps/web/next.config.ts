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
      // Profile/customer/pet photo uploads may arrive as large phone-camera
      // originals. Client-side compression handles the common path, and the
      // server optimizer validates the final stored image at 5 MB.
      bodySizeLimit: "25mb"
    },
    // Enables React's View Transitions API integration so client-side
    // navigations (Link clicks, router.push) wrap the route swap in a
    // document.startViewTransition. Elements with matching
    // `view-transition-name` then cross-fade or morph between routes.
    // Disabled automatically under prefers-reduced-motion (see globals.css).
    viewTransition: true,
    // Tree-shake lucide-react barrel imports — without this, a
    // `import { Search } from "lucide-react"` can pull the whole icon
    // module index into a route's first-load JS.
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
