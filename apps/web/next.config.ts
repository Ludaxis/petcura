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
    // Tree-shake barrel imports so we don't pull whole index modules into
    // a route's first-load JS.
    // - `lucide-react`: `import { Search } from "lucide-react"` would
    //   otherwise drag the icon barrel along.
    // - `motion`: marketing-only Framer Motion v12. The package re-exports
    //   `motion/react`, `motion/dom`, etc. through a barrel; this keeps the
    //   landing dynamic chunk lean.
    //
    // NOT included: `gsap`. GSAP is consumed via deep imports
    // (`import { gsap } from "gsap"; import { ScrollTrigger } from
    // "gsap/ScrollTrigger"`) and registered with side effects via
    // `gsap.registerPlugin(ScrollTrigger)`. The optimizer's named-import
    // rewrite targets ESM barrel re-exports; it doesn't shrink GSAP's
    // plugin-registration pattern. The marketing entry already gates the
    // bundle via a dynamic import below the fold.
    optimizePackageImports: ["lucide-react", "motion"]
  }
};

export default nextConfig;
