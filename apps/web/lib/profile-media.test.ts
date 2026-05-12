import { describe, expect, test, vi } from "vitest";
import sharp from "sharp";

vi.mock("server-only", () => ({}));

import { optimizeProfileImageBytes } from "./profile-media";

describe("profile media optimization", () => {
  test("losslessly optimizes PNG uploads when the result is smaller", async () => {
    const input = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: { r: 32, g: 96, b: 80, alpha: 1 }
      }
    })
      .png({ compressionLevel: 0 })
      .toBuffer();

    const optimized = await optimizeProfileImageBytes(input, "image/png");

    expect(optimized).not.toBeNull();
    expect(optimized?.contentType).toBe("image/png");
    expect(optimized?.extension).toBe("png");
    expect(optimized!.body.byteLength).toBeLessThan(input.byteLength);
  });

  test("keeps JPEG output high quality and browser-compatible", async () => {
    const input = await sharp({
      create: {
        width: 96,
        height: 96,
        channels: 3,
        background: { r: 210, g: 186, b: 130 }
      }
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const optimized = await optimizeProfileImageBytes(input, "image/jpeg");

    expect(optimized).not.toBeNull();
    expect(optimized?.contentType).toBe("image/jpeg");
    expect(optimized?.extension).toBe("jpg");
  });

  test("falls back cleanly for non-image bytes", async () => {
    const optimized = await optimizeProfileImageBytes(
      Buffer.from("not an image"),
      "image/png"
    );

    expect(optimized).toBeNull();
  });
});
