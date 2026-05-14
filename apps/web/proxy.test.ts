import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("proxy", () => {
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

  it("keeps the main app root on the marketing shell", () => {
    const response = proxy(new NextRequest("https://app.petcura.app/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
