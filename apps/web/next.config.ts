import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  isProduction ? null : "'unsafe-eval'",
  "https://va.vercel-scripts.com"
]
  .filter(Boolean)
  .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  "media-src 'self' blob: https://*.supabase.co",
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-analytics.com",
    "https://vitals.vercel-insights.com"
  ].join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "upgrade-insecure-requests"
].join("; ");

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none"
  },
  {
    key: "Origin-Agent-Cluster",
    value: "?1"
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
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
