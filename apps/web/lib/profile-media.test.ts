import { describe, expect, test, vi } from "vitest";
import sharp from "sharp";

vi.mock("server-only", () => ({}));

import {
  MAX_PROFILE_IMAGE_INPUT_BYTES,
  optimizeProfileImageBytes,
  validateProfileImage
} from "./profile-media";

describe("profile media optimization", () => {
  test("accepts phone-camera originals before server-side optimization", () => {
    const file = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      "clinic-avatar.jpg",
      { type: "image/jpeg" }
    );

    expect(validateProfileImage(file)).toBeNull();
  });

  test("rejects originals above the transport ceiling", () => {
    const file = new File(
      [new Uint8Array(MAX_PROFILE_IMAGE_INPUT_BYTES + 1)],
      "too-large.jpg",
      { type: "image/jpeg" }
    );

    expect(validateProfileImage(file)).toContain("20MB");
  });

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
