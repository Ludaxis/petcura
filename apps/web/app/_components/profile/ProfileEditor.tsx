/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import type { ReactNode } from "react";
import { Camera, Save } from "lucide-react";
import { Button, cn } from "@petcura/ui";

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

export function ProfileAvatar({
  name,
  imageUrl,
  className
}: {
  name: string;
  imageUrl?: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]",
        className
      )}
    >
      {imageUrl ? (
        <img
          alt=""
          className="h-full w-full object-cover"
          src={imageUrl}
        />
      ) : (
        <span className="text-[15px] font-semibold">{initialsFromName(name)}</span>
      )}
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
}: {
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
}) {
  return (
    <form
      action={action}
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm",
        className
      )}
    >
      {hiddenFields}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProfileAvatar imageUrl={imageUrl} name={name} />
          <div className="min-w-0">
            <h2 className="break-words text-[16px] font-semibold text-[var(--ink)]">
              {title}
            </h2>
            {description ? (
              <div className="mt-1 text-[12.5px] leading-5 text-[var(--muted)]">
                {description}
              </div>
            ) : null}
          </div>
        </div>

        {!disabled ? (
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-[12.5px] font-medium text-[var(--ink)] transition hover:bg-[var(--soft)]">
            <Camera aria-hidden="true" size={14} />
            {imageLabel}
            <input
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              name="photo"
              type="file"
            />
          </label>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>

      {!disabled ? (
        <div className="mt-4 flex justify-end">
          <Button type="submit" variant="secondary">
            <Save aria-hidden="true" size={15} />
            {submitLabel}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
