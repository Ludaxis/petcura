import type { ReactNode } from "react";

/**
 * Marketing route-group layout — passes through. The root layout already
 * owns <html>, fonts, and theme bootstrap; this segment exists only to
 * scope future marketing-only providers (motion config, analytics
 * variants, A/B framework) without polluting the clinic + owner apps.
 */
export default function MarketingLayout({
  children
}: {
  children: ReactNode;
}) {
  return children;
}
