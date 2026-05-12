import "server-only";

import { extname } from "node:path";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

export const PROFILE_MEDIA_BUCKET = "profile-media";

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"]
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ProfileEntity = "staff" | "owners" | "pets";

export function initialsFromName(value: string) {
  const parts = value.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2);
  const initials = parts
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("en-US") ?? "")
    .join("");
  return initials || "?";
}

export function hasUsableProfileImage(file: File | null | undefined) {
  return Boolean(file && file.size > 0 && file.name);
}

export function validateProfileImage(file: File) {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Profile images must be 5MB or smaller.";
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Use a JPG, PNG, WEBP, or HEIC image.";
  }

  return null;
}

function extensionFor(file: File) {
  const fromMime = ALLOWED_IMAGE_TYPES.get(file.type);
  if (fromMime) return fromMime;

  const raw = extname(file.name).replace(".", "").toLowerCase();
  return raw || "jpg";
}

type PreparedProfileImage = {
  body: Buffer;
  contentType: string;
  extension: string;
};

export async function optimizeProfileImageBytes(
  input: Buffer,
  contentType: string
): Promise<PreparedProfileImage | null> {
  try {
    const image = sharp(input, { failOn: "none" }).rotate();

    if (contentType === "image/png") {
      return {
        body: await image
          .png({ adaptiveFiltering: true, compressionLevel: 9 })
          .toBuffer(),
        contentType: "image/png",
        extension: "png"
      };
    }

    if (contentType === "image/webp") {
      return {
        body: await image.webp({ effort: 6, lossless: true }).toBuffer(),
        contentType: "image/webp",
        extension: "webp"
      };
    }

    if (contentType === "image/jpeg" || contentType === "image/heic") {
      return {
        body: await image.jpeg({ mozjpeg: true, quality: 95 }).toBuffer(),
        contentType: "image/jpeg",
        extension: "jpg"
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function prepareProfileImageForUpload(file: File): Promise<PreparedProfileImage> {
  const original = Buffer.from(await file.arrayBuffer());
  const originalImage: PreparedProfileImage = {
    body: original,
    contentType: file.type,
    extension: extensionFor(file)
  };

  const optimized = await optimizeProfileImageBytes(original, file.type);

  // Preserve visual quality: we never resize or upscale, and we only keep
  // the optimized encoding when it is strictly smaller than the original.
  if (optimized && optimized.body.byteLength < original.byteLength) {
    return optimized;
  }

  return originalImage;
}

export async function uploadProfileImage({
  clinicId,
  entity,
  entityId,
  file
}: {
  clinicId: string;
  entity: ProfileEntity;
  entityId: string;
  file: File;
}) {
  const validationError = validateProfileImage(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const admin = createAdminClient();
  const prepared = await prepareProfileImageForUpload(file);
  const path = `${clinicId}/${entity}/${entityId}/avatar-${Date.now()}.${prepared.extension}`;
  const { error } = await admin.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(path, prepared.body, {
      contentType: prepared.contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Could not upload profile image: ${error.message}`);
  }

  return path;
}

export async function getSignedProfileImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(PROFILE_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}

export async function getSignedProfileImageUrls(paths: Array<string | null>) {
  const uniquePaths = [...new Set(paths.filter(Boolean) as string[])];
  const entries = await Promise.all(
    uniquePaths.map(async (path) => [path, await getSignedProfileImageUrl(path)] as const)
  );

  return new Map(entries.filter((entry): entry is [string, string] => Boolean(entry[1])));
}
