"use client";
/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode
} from "react";
import { Camera, Save } from "lucide-react";
import { Button, Spinner, cn } from "@petcura/ui";

const CLIENT_PROFILE_IMAGE_TARGET_BYTES = 4.5 * 1024 * 1024;
const CLIENT_PROFILE_IMAGE_SAFE_BYTES = 20 * 1024 * 1024;
const CLIENT_PROFILE_IMAGE_MAX_SIDE = 1920;
const CLIENT_PROFILE_IMAGE_QUALITY = 0.92;
const CLIENT_OPTIMIZABLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const profileInputClass = cn(
  "h-10 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]",
  "placeholder:text-[var(--muted-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
);

export const profileTextareaClass = cn(
  "min-h-[92px] w-full resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]",
  "placeholder:text-[var(--muted-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
);

function initialsFromName(value: string) {
  const parts = value.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2);
  const initials = parts
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("en-US") ?? "")
    .join("");
  return initials || "?";
}

function optimizedImageName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "").trim() || "profile-photo";
  return `${base}.jpg`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not optimize image"));
        }
      },
      type,
      quality
    );
  });
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

async function decodeImageForCanvas(file: File) {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close()
    };
  }

  const image = await loadImageElement(file);
  return {
    source: image,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    cleanup: () => {}
  };
}

async function optimizeProfileImageForTransport(file: File) {
  if (
    file.size <= CLIENT_PROFILE_IMAGE_TARGET_BYTES ||
    !CLIENT_OPTIMIZABLE_TYPES.has(file.type)
  ) {
    return file;
  }

  const decoded = await decodeImageForCanvas(file);
  try {
    const longestSide = Math.max(decoded.width, decoded.height);
    const scale =
      longestSide > CLIENT_PROFILE_IMAGE_MAX_SIDE
        ? CLIENT_PROFILE_IMAGE_MAX_SIDE / longestSide
        : 1;
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true
    });
    if (!context) return file;

    context.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--paper")
        .trim() || "Canvas";
    context.fillRect(0, 0, width, height);
    context.drawImage(decoded.source, 0, 0, width, height);
    const blob = await canvasToBlob(
      canvas,
      "image/jpeg",
      CLIENT_PROFILE_IMAGE_QUALITY
    );

    if (blob.size >= file.size && file.size <= CLIENT_PROFILE_IMAGE_SAFE_BYTES) {
      return file;
    }

    return new File([blob], optimizedImageName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now()
    });
  } finally {
    decoded.cleanup();
  }
}

async function prepareProfileFormData(formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { formData, error: null as string | null };
  }

  try {
    const optimized = await optimizeProfileImageForTransport(file);
    if (optimized.size > CLIENT_PROFILE_IMAGE_SAFE_BYTES) {
      return {
        formData,
        error: "Choose an image under 20MB, or use a JPG, PNG, or WEBP photo that PetCura can optimize."
      };
    }

    if (optimized !== file) {
      formData.set("photo", optimized);
    }

    return { formData, error: null as string | null };
  } catch {
    if (file.size > CLIENT_PROFILE_IMAGE_SAFE_BYTES) {
      return {
        formData,
        error: "This image is too large to upload. Try a JPG, PNG, or WEBP photo under 20MB."
      };
    }

    return { formData, error: null as string | null };
  }
}

type ProfileAvatarProps = {
  name: string;
  imageUrl?: string | null | undefined;
  className?: string;
  /**
   * When true, dim the avatar and overlay a small Spinner. Used during a
   * pending save so staff see the photo "committing" rather than just
   * staring at a still image.
   */
  pending?: boolean;
  /**
   * When true, draw a soft sage ring around the avatar — "you picked a new
   * photo, click Save to commit". Cleared when the form resolves.
   */
  unsaved?: boolean;
};

export function ProfileAvatar({
  name,
  imageUrl,
  className,
  pending = false,
  unsaved = false
}: ProfileAvatarProps) {
  return (
    <span
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)] transition-shadow",
        unsaved &&
          "shadow-[0_0_0_2px_var(--primary-soft),0_0_0_3px_var(--primary)]",
        className
      )}
      aria-busy={pending || undefined}
    >
      {imageUrl ? (
        <img
          alt=""
          className={cn(
            "h-full w-full object-cover transition-opacity",
            pending && "opacity-50"
          )}
          src={imageUrl}
        />
      ) : (
        <span
          className={cn(
            "text-[15px] font-semibold",
            pending && "opacity-50"
          )}
        >
          {initialsFromName(name)}
        </span>
      )}
      {pending ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={20} tone="primary" />
        </span>
      ) : null}
    </span>
  );
}

export function ProfileField({
  label,
  htmlFor,
  children,
  wide = false
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={cn("grid gap-1.5", wide && "sm:col-span-2")}
      htmlFor={htmlFor}
    >
      <span className="text-[12px] font-semibold text-[var(--ink)]">
        {label}
      </span>
      {children}
    </label>
  );
}

type ProfileEditorCardProps = {
  title: string;
  description?: ReactNode;
  name: string;
  imageUrl?: string | null | undefined;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  imageLabel: string;
  hiddenFields?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function ProfileEditorCard({
  title,
  description,
  name,
  imageUrl,
  action,
  submitLabel,
  imageLabel,
  hiddenFields,
  children,
  disabled = false,
  className
}: ProfileEditorCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // Revoke the object URL when it changes or the form unmounts so the
  // browser can release the blob. Without this, picking three photos in a
  // row leaks three blobs until tab close.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setPickedFileName(null);
      setClientError(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setPickedFileName(file.name);
    setClientError(null);
  };

  // Wrap the server action so React's useTransition pending fires across
  // both the upload and the post-redirect re-stream. The form's own
  // aria-busy + disabled state follows pending so SR users hear the work.
  const submitAction = (formData: FormData) => {
    startTransition(async () => {
      setClientError(null);
      const prepared = await prepareProfileFormData(formData);
      if (prepared.error) {
        setClientError(prepared.error);
        return;
      }

      await action(prepared.formData);
      // The action redirects on success; this resolves on the navigation
      // that follows. On error, the action redirects with ?action_error,
      // which the parent page maps into an aria-live announcement.
      setPreview(null);
      setPickedFileName(null);
    });
  };

  const effectiveImageUrl = preview ?? imageUrl ?? null;
  const isLocked = disabled || pending;

  return (
    <form
      ref={formRef}
      action={submitAction}
      aria-busy={pending || undefined}
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm transition-shadow",
        pending && "shadow-[0_0_0_1px_var(--primary-soft)]",
        className
      )}
    >
      {hiddenFields}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProfileAvatar
            imageUrl={effectiveImageUrl}
            name={name}
            pending={pending}
            unsaved={!!preview && !pending}
          />
          <div className="min-w-0">
            <h2 className="break-words text-[16px] font-semibold text-[var(--ink)]">
              {title}
            </h2>
            {description ? (
              <div className="mt-1 text-[12.5px] leading-5 text-[var(--muted)]">
                {description}
              </div>
            ) : null}
            {pickedFileName ? (
              <div
                className="mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-strong)]"
                title={pickedFileName}
              >
                <Camera aria-hidden="true" size={10} />
                <span className="truncate">{pickedFileName}</span>
              </div>
            ) : null}
            {clientError ? (
              <p className="mt-1.5 text-[12px] leading-5 text-[var(--red)]">
                {clientError}
              </p>
            ) : null}
          </div>
        </div>

        {!disabled ? (
          <label
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-[12.5px] font-medium text-[var(--ink)] transition hover:bg-[var(--soft)]",
              isLocked && "pointer-events-none opacity-60"
            )}
          >
            <Camera aria-hidden="true" size={14} />
            {imageLabel}
            <input
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              name="photo"
              type="file"
              disabled={isLocked}
              onChange={onPhotoChange}
            />
          </label>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 grid gap-3 transition-opacity sm:grid-cols-2",
          pending && "opacity-70 [&_input]:cursor-wait [&_textarea]:cursor-wait"
        )}
        // Inert during pending so users can't keep typing into stale fields
        // while the save round-trips. The disabled style above carries the
        // visual signal for browsers that don't honor inert.
        inert={pending}
      >
        {children}
      </div>

      {!disabled ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          {pending ? (
            <span
              aria-hidden="true"
              className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]"
            >
              {preview ? "Uploading…" : "Saving…"}
            </span>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            disabled={isLocked}
            aria-disabled={isLocked}
            /*
             * Pending: stays at full opacity with a sage outline pulse so
             * the user has a strong "in flight" signal independent of the
             * spinner. Same pattern as the request-detail Composer.
             */
            className={cn(
              "min-w-[120px]",
              pending &&
                "!opacity-100 ring-2 ring-offset-1 ring-[var(--primary-soft)] ring-offset-[var(--paper)] animate-pulse"
            )}
          >
            {pending ? (
              <Spinner size={16} label={submitLabel} />
            ) : (
              <Save aria-hidden="true" size={15} />
            )}
            <span>{pending ? `${submitLabel}…` : submitLabel}</span>
          </Button>
        </div>
      ) : null}
    </form>
  );
}
