"use client";

import Link from "next/link";
import {
  ChevronRight,
  Languages,
  MessageSquareText,
  PawPrint
} from "lucide-react";
import { Badge, Button, cn } from "@petcura/ui";
import {
  createTranslator,
  localeOptions,
  type SupportedLocale
} from "@petcura/shared";
import type { CustomerListItem } from "@/lib/clinic/directory";
import {
  ProfileAvatar,
  ProfileEditorCard,
  ProfileField,
  profileInputClass,
  profileTextareaClass
} from "@/app/_components/profile/ProfileEditor";
import { updateCustomerProfile } from "@/app/customers/actions";
import { InlineEditRow } from "./InlineEditRow";

type OwnerRowProps = {
  owner: CustomerListItem;
  locale: SupportedLocale;
  selected: boolean;
  density: "comfortable" | "compact";
  href: string;
  latestRequestLabel: string | null;
  index: number;
  canEdit: boolean;
};

function whatsappHref(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function OwnerRow({
  owner,
  locale,
  selected,
  density,
  href,
  latestRequestLabel,
  index,
  canEdit
}: OwnerRowProps) {
  const t = createTranslator(locale);
  const isCompact = density === "compact";
  const wa = whatsappHref(owner.phone);
  const petsSummary = owner.petNames.slice(0, 3).join(", ");
  const overflowPets =
    owner.petNames.length > 3 ? ` +${owner.petNames.length - 3}` : "";

  const rowSummary = (
    <div
      data-directory-row
      data-row-id={owner.id}
      data-row-index={index}
      data-selected={selected ? "true" : undefined}
      style={
        {
          viewTransitionName: `pc-owner-${owner.id}`,
          // Drives the per-row stagger in `.pc-row-in`; capped at 20 in
          // CSS so the cascade doesn't crawl past ~600ms on long lists.
          ["--pc-row-i" as string]: String(index)
        } as React.CSSProperties
      }
      className={cn(
        "pc-row-in group relative grid items-center gap-3 px-4 transition-colors",
        "hover:bg-[var(--soft)] focus-within:bg-[var(--soft)]",
        "data-[selected=true]:bg-[var(--primary-soft)]",
        isCompact ? "py-2 sm:py-2.5" : "py-3 sm:py-3.5",
        // Reserve room on the right for the Edit trigger overlay (about
        // 88px on desktop, 36px on mobile) plus the chevron column.
        "grid-cols-[40px_minmax(160px,1.2fr)_minmax(0,1.4fr)_auto_auto_88px]",
        "max-md:grid-cols-[36px_minmax(0,1fr)_36px]"
      )}
    >
      {/* Cover-all link below interactive controls. Empty anchor with full
          row aria-label so screen readers announce identity, not the URL. */}
      <Link
        href={href}
        aria-label={`${owner.name}, ${owner.phone}${
          owner.petCount > 0
            ? `, ${owner.petCount} ${t("directory.owner.petsLabel").toLowerCase()}`
            : ""
        }`}
        tabIndex={0}
        className="absolute inset-0 z-0 rounded-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)]"
      />

      <ProfileAvatar
        name={owner.name}
        imageUrl={owner.photoUrl}
        className={cn(
          "pointer-events-none relative z-[1] rounded-full",
          isCompact ? "h-9 w-9" : "h-10 w-10"
        )}
      />

      <span className="pointer-events-none relative z-[1] min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span
            title={owner.name}
            className="truncate text-[13.5px] font-semibold text-[var(--ink)]"
          >
            {owner.name}
          </span>
          <Badge tone="neutral">
            <Languages aria-hidden="true" size={10} />
            {owner.preferredLanguage.toUpperCase()}
          </Badge>
        </span>
        {!isCompact ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--muted)]">
            <span className="truncate font-mono">{owner.phone}</span>
            {owner.email ? (
              <>
                <span aria-hidden="true" className="text-[var(--muted-2)]">
                  ·
                </span>
                <span title={owner.email} className="truncate">
                  {owner.email}
                </span>
              </>
            ) : null}
          </span>
        ) : null}
      </span>

      <span className="pointer-events-none relative z-[1] hidden min-w-0 flex-col gap-0.5 text-[12.5px] text-[var(--muted)] md:flex">
        {petsSummary ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <PawPrint
              aria-hidden="true"
              size={11}
              className="text-[var(--muted-2)]"
            />
            <span title={`${petsSummary}${overflowPets}`} className="truncate">
              {petsSummary}
              <span className="text-[var(--muted-2)]">{overflowPets}</span>
            </span>
          </span>
        ) : (
          <span className="text-[var(--muted-2)]">—</span>
        )}
        {latestRequestLabel ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
            {t("directory.owner.latestLabel")} · {latestRequestLabel}
          </span>
        ) : null}
      </span>

      <span className="pointer-events-none relative z-[1] hidden whitespace-nowrap items-center gap-2 md:inline-flex">
        <span
          className="inline-flex items-center gap-1 rounded-[5px] bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted)]"
          aria-label={`${owner.petCount} ${t("directory.owner.petsLabel")}`}
        >
          <PawPrint aria-hidden="true" size={10} /> {owner.petCount}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.04em]",
            owner.openRequestCount > 0
              ? "bg-[var(--amber-soft)] text-[var(--amber)]"
              : "bg-[var(--surface-soft)] text-[var(--muted)]"
          )}
          aria-label={`${owner.openRequestCount} ${t("directory.owner.openLabel")}`}
        >
          <MessageSquareText aria-hidden="true" size={10} />
          {owner.openRequestCount}/{owner.requestCount}
        </span>
      </span>

      {/* Quick actions — relative + z-10 so they sit above the cover Link.
          Quick action stays mounted; Edit button is rendered as an absolute
          overlay by InlineEditRow so it can survive across both columns. */}
      <span className="relative z-10 hidden items-center gap-1 invisible transition-opacity group-hover:visible group-focus-within:visible md:inline-flex">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            aria-label={t("directory.action.message")}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--primary-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <MessageSquareText aria-hidden="true" size={13} />
          </a>
        ) : null}
      </span>

      <ChevronRight
        size={16}
        aria-hidden="true"
        className="pointer-events-none relative z-[1] justify-self-end text-[var(--muted-2)] transition-colors group-hover:text-[var(--primary)]"
      />

      <span className="pointer-events-none relative z-[1] col-span-2 mt-1 flex min-w-0 flex-col gap-0.5 md:hidden">
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--muted)]">
          <span title={owner.phone} className="truncate font-mono">
            {owner.phone}
          </span>
          {petsSummary ? (
            <>
              <span aria-hidden="true">·</span>
              <span
                title={`${petsSummary}${overflowPets}`}
                className="truncate"
              >
                {petsSummary}
                {overflowPets}
              </span>
            </>
          ) : null}
        </span>
      </span>
    </div>
  );

  if (!canEdit) {
    // Read-only viewers get the row without the Edit affordance or the
    // outer panel chrome — the border-b rendered by the parent list keeps
    // the visual rhythm consistent.
    return (
      <div className="border-b border-[var(--line)]">{rowSummary}</div>
    );
  }

  return (
    <InlineEditRow
      editLabel={`${t("directory.action.edit")} ${owner.name}`}
      editText={t("directory.action.edit")}
      regionLabel={`${t("directory.action.edit")} ${owner.name}`}
      row={rowSummary}
      form={({ requestClose }) => (
        <div className="grid gap-3">
          <ProfileEditorCard
            action={updateCustomerProfile}
            // Suppress the editor's own card chrome — we're already inside
            // the row's panel, which has its own border + tint. Avoids the
            // "card-inside-card" look the design system warns about.
            className="!border-0 !bg-transparent !p-0 !shadow-none"
            description={
              <span>
                {owner.phone}
                {owner.email ? ` · ${owner.email}` : ""}
              </span>
            }
            hiddenFields={
              <>
                <input name="lang" type="hidden" value={locale} />
                <input name="ownerId" type="hidden" value={owner.id} />
              </>
            }
            imageLabel={t("profile.photo")}
            imageUrl={owner.photoUrl}
            name={owner.name}
            submitLabel={t("profile.save")}
            title={owner.name}
          >
            <ProfileField
              htmlFor={`owner-name-${owner.id}`}
              label={t("profile.fullName")}
            >
              <input
                className={profileInputClass}
                defaultValue={owner.name}
                id={`owner-name-${owner.id}`}
                name="name"
                required
              />
            </ProfileField>
            <ProfileField
              htmlFor={`owner-phone-${owner.id}`}
              label={t("profile.phone")}
            >
              <input
                className={profileInputClass}
                defaultValue={owner.phone}
                id={`owner-phone-${owner.id}`}
                name="phone"
                required
                type="tel"
              />
            </ProfileField>
            <ProfileField
              htmlFor={`owner-email-${owner.id}`}
              label={t("settings.email")}
            >
              <input
                className={profileInputClass}
                defaultValue={owner.email ?? ""}
                id={`owner-email-${owner.id}`}
                name="email"
                type="email"
              />
            </ProfileField>
            <ProfileField
              htmlFor={`owner-language-${owner.id}`}
              label={t("profile.language")}
            >
              <select
                className={profileInputClass}
                defaultValue={owner.preferredLanguage}
                id={`owner-language-${owner.id}`}
                name="preferredLanguage"
              >
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ProfileField>
            <ProfileField
              htmlFor={`owner-notes-${owner.id}`}
              label={t("directory.detail.notes")}
              wide
            >
              <textarea
                className={profileTextareaClass}
                defaultValue={owner.notes ?? ""}
                id={`owner-notes-${owner.id}`}
                name="notes"
              />
            </ProfileField>
          </ProfileEditorCard>
          {/* Cancel sits outside the form so it never submits. The Save
              button is rendered by ProfileEditorCard above. */}
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={requestClose}
              className="min-w-[96px]"
            >
              {t("inbox.bulk.cancel")}
            </Button>
          </div>
        </div>
      )}
    />
  );
}
