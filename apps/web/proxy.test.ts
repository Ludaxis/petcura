import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "./next.config";
import robots from "./app/robots";
import sitemap from "./app/sitemap";
import { proxy } from "./proxy";
import { GET as securityTxtGET } from "./app/.well-known/security.txt/route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy", () => {
  it.each(["/wp-admin/install.php", "/wp-login.php", "/xmlrpc.php"])(
    "returns a no-store 404 for scanner path %s",
    (pathname) => {
      const response = proxy(
        new NextRequest(`https://app.petcura.app${pathname}?lang=et`)
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  );

  it("matches scanner paths case-insensitively before host redirects", () => {
    const response = proxy(new NextRequest("https://my.petcura.app/WP-LOGIN.PHP"));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects the owner subdomain root to the owner PWA", () => {
    const response = proxy(new NextRequest("https://my.petcura.app/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://my.petcura.app/o");
  });

  it("keeps app routes on the owner subdomain available", () => {
    const response = proxy(new NextRequest("https://my.petcura.app/o/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("canonicalizes owner app routes to the owner subdomain", () => {
    const response = proxy(
      new NextRequest(
        "https://app.petcura.app/o/auth/callback?code=abc&next=%2Fo&lang=en"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://my.petcura.app/o/auth/callback?code=abc&next=%2Fo&lang=en"
    );
  });

  it("does not treat clinic owner directory routes as owner app routes", () => {
    const response = proxy(new NextRequest("https://app.petcura.app/owners?lang=en"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("keeps the main app root on the marketing shell", () => {
    const response = proxy(new NextRequest("https://app.petcura.app/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("redirects staff auth from the marketing apex to the canonical app host", () => {
    const response = proxy(
      new NextRequest("https://petcura.app/login?lang=en&next=%2Finbox")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.petcura.app/login?lang=en&next=%2Finbox"
    );
  });

  it("redirects staff auth callbacks from the marketing apex to the canonical app host", () => {
    const response = proxy(
      new NextRequest(
        "https://petcura.app/auth/callback?code=abc&next=%2Finbox&lang=en"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.petcura.app/auth/callback?code=abc&next=%2Finbox&lang=en"
    );
  });

  it("continues to forward and persist explicit locales on normal routes", () => {
    const response = proxy(new NextRequest("https://app.petcura.app/inbox?lang=et"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-petcura-locale")).toBe("et");
    expect(response.cookies.get("petcura_locale")?.value).toBe("et");
  });
});

describe("security headers", () => {
  it("sets global security headers with app-compatible CSP allowances", async () => {
    const headerRoutes = await nextConfig.headers?.();
    const globalHeaders = headerRoutes?.find((route) => route.source === "/(.*)");
    const headers = new Map(
      globalHeaders?.headers.map((header) => [header.key, header.value])
    );
    const csp = headers.get("Content-Security-Policy");

    expect(headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("wss://*.supabase.co");
    expect(csp).toContain("https://va.vercel-scripts.com");
    expect(csp).toContain("https://fonts.googleapis.com");
    expect(csp).toContain("https://fonts.gstatic.com");
  });
});

describe("metadata routes", () => {
  it("publishes robots metadata for public marketing pages only", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a url");

    const metadata = robots();
    const [rule] = Array.isArray(metadata.rules) ? metadata.rules : [metadata.rules];

    expect(metadata.host).toBe("https://petcura.app");
    expect(metadata.sitemap).toBe("https://petcura.app/sitemap.xml");
    expect(rule.allow).toEqual([
      "/",
      "/demo",
      "/sandbox",
      "/trust",
      "/terms",
      "/dpa",
      "/privacy",
      "/cookies",
      "/owners",
      "/subprocessors"
    ]);
    expect(rule.disallow).toContain("/api");
    expect(rule.disallow).toContain("/o");
    expect(rule.disallow).toContain("/requests");
    expect(rule.disallow).toContain("/inbox");
  });

  it("publishes a sitemap for public marketing routes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a url");

    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual([
      "https://petcura.app/",
      "https://petcura.app/trust",
      "https://petcura.app/terms",
      "https://petcura.app/dpa",
      "https://petcura.app/owners",
      "https://petcura.app/privacy",
      "https://petcura.app/cookies",
      "https://petcura.app/subprocessors",
      "https://petcura.app/demo",
      "https://petcura.app/sandbox"
    ]);
  });

  it("serves conservative security.txt contact metadata", async () => {
    const response = securityTxtGET();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(body).toContain("Contact: mailto:security@petcura.app");
    expect(body).toContain("Expires: 2027-05-15T00:00:00.000Z");
    expect(body).toContain(
      "Canonical: https://petcura.app/.well-known/security.txt"
    );
  });
});
