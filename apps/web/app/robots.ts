import type { MetadataRoute } from "next";

function getSiteOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configuredUrl) {
    return "https://petcura.app";
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return "https://petcura.app";
  }
}

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/demo",
          "/sandbox",
          "/trust",
          "/privacy",
          "/cookies",
          "/owners",
          "/subprocessors"
        ],
        disallow: [
          "/admin",
          "/api",
          "/customers",
          "/directory",
          "/inbox",
          "/intake",
          "/login",
          "/o",
          "/onboarding",
          "/pets",
          "/profile",
          "/reminders",
          "/reports",
          "/requests",
          "/settings"
        ]
      }
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin
  };
}
