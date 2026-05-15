import type { MetadataRoute } from "next";

const publicRoutes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1
  },
  {
    path: "/trust",
    changeFrequency: "monthly",
    priority: 0.8
  },
  {
    path: "/owners",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/privacy",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/cookies",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/subprocessors",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/demo",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/sandbox",
    changeFrequency: "monthly",
    priority: 0.5
  }
] as const;

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

export default function sitemap(): MetadataRoute.Sitemap {
  const siteOrigin = getSiteOrigin();
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteOrigin}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
