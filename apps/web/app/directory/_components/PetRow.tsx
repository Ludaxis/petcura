"use client";

import Link from "next/link";
import {
  ChevronRight,
  ClipboardList,
  PawPrint,
  Scale,
  User
} from "lucide-react";
import { Badge, Button, cn } from "@petcura/ui";
import { createTranslator, type SupportedLocale } from "@petcura/shared";
import type { PetListItem } from "@/lib/clinic/directory";
import {
  ProfileAvatar,
  ProfileEditorCard,
  ProfileField,
  profileInputClass,
  profileTextareaClass
} from "@/app/_components/profile/ProfileEditor";
import { updatePetProfile } from "@/app/pets/actions";
import { InlineEditRow } from "./InlineEditRow";

type PetRowProps = {
  pet: PetListItem;
  locale: SupportedLocale;
  selected: boolean;
  density: "comfortable" | "compact";
  href: string;
  latestRequestLabel: string | null;
  index: number;
  canEdit: boolean;
};

function ageFromBirth(birthDate: string | null) {
  if (!birthDate) return null;
  const then = new Date(birthDate);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - then.getFullYear();
  const months = now.getMonth() - then.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < then.getDate())) years -= 1;
  if (years >= 1) return `${years}y`;
  // For pets under a year, show months
  const totalMonths =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth());
  return `${Math.max(0, totalMonths)}mo`;
}

export function PetRow({
  pet,
  locale,
  selected,
  density,
  href,
  latestRequestLabel,
  index,
  canEdit
}: PetRowProps) {
  const t = createTranslator(locale);
  const isCompact = density === "compact";
  const age = ageFromBirth(pet.birthDate);

  const rowSummary = (
    <div
      data-directory-row
      data-row-id={pet.id}
      data-row-index={index}
      data-selected={selected ? "true" : undefined}
      style={
        {
          viewTransitionName: `pc-pet-${pet.id}`,
          // Drives the per-row stagger in `.pc-row-in`; capped at 20 in
          // CSS so long lists settle within ~600ms.
          ["--pc-row-i" as string]: String(index)
        } as React.CSSProperties
      }
      className={cn(
        "pc-row-in group relative grid items-center gap-3 px-4 transition-colors",
        "hover:bg-[var(--soft)] focus-within:bg-[var(--soft)]",
        "data-[selected=true]:bg-[var(--primary-soft)]",
        isCompact ? "py-2 sm:py-2.5" : "py-3 sm:py-3.5",
        // Mirror OwnerRow's right-edge reservation for the Edit overlay.
        "grid-cols-[40px_minmax(160px,1.2fr)_minmax(0,1.4fr)_auto_88px]",
        "max-md:grid-cols-[36px_minmax(0,1fr)_36px]"
      )}
    >
      <Link
        href={href}
        aria-label={`${pet.name}, ${pet.species}, ${t("directory.pet.ownerPrefix")} ${pet.ownerName}`}
        tabIndex={0}
        className="absolute inset-0 z-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)]"
      />

      <ProfileAvatar
        name={pet.name}
        imageUrl={pet.photoUrl}
        className={cn(
          "pointer-events-none relative z-[1] rounded-full",
          isCompact ? "h-9 w-9" : "h-10 w-10"
        )}
      />

      <span className="pointer-events-none relative z-[1] min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span
            title={pet.name}
            className="truncate text-[13.5px] font-semibold text-[var(--ink)]"
          >
            {pet.name}
          </span>
          <Badge tone="neutral">{pet.species}</Badge>
          {pet.breed ? (
            <span
              title={pet.breed}
              className="hidden truncate text-[11.5px] text-[var(--muted)] sm:inline"
            >
              {pet.breed}
            </span>
          ) : null}
        </span>
        {!isCompact ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--muted)]">
            <User
              aria-hidden="true"
              size={11}
              className="text-[var(--muted-2)]"
            />
            <span title={pet.ownerName} className="truncate">
              {pet.ownerName}
            </span>
            {pet.ownerPhone ? (
              <>
                <span aria-hidden="true" className="text-[var(--muted-2)]">
                  ·
                </span>
                <span title={pet.ownerPhone} className="truncate font-mono">
                  {pet.ownerPhone}
                </span>
              </>
            ) : null}
          </span>
        ) : null}
      </span>

      <span className="pointer-events-none relative z-[1] hidden min-w-0 flex-col gap-0.5 text-[12.5px] text-[var(--muted)] md:flex">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {age ? (
            <span className="inline-flex items-center gap-1 text-[11.5px]">
              <span className="text-[var(--muted)]">
                {t("directory.pet.ageLabel")}
              </span>
              <span className="font-medium text-[var(--ink-2)]">{age}</span>
            </span>
          ) : null}
          {pet.weightKg !== null ? (
            <span className="inline-flex items-center gap-1 text-[11.5px]">
              <Scale
                aria-hidden="true"
                size={11}
                className="text-[var(--muted)]"
              />
              <span className="font-medium text-[var(--ink-2)]">
                {pet.weightKg} kg
              </span>
            </span>
          ) : null}
          {pet.sex ? (
            <span className="text-[11.5px] font-medium text-[var(--ink-2)]">
              {pet.sex}
            </span>
          ) : null}
        </span>
        {latestRequestLabel ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted)]">
            {t("directory.owner.latestLabel")} · {latestRequestLabel}
          </span>
        ) : null}
      </span>

      <span className="pointer-events-none relative z-[1] hidden whitespace-nowrap items-center gap-2 md:inline-flex">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.04em]",
            pet.openRequestCount > 0
              ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
              : "bg-[var(--surface-soft)] text-[var(--muted)]"
          )}
          aria-label={t("directory.openTotal")
            .replace("{open}", String(pet.openRequestCount))
            .replace("{total}", String(pet.requestCount))}
          title={t("directory.openTotal")
            .replace("{open}", String(pet.openRequestCount))
            .replace("{total}", String(pet.requestCount))}
        >
          <ClipboardList aria-hidden="true" size={10} />
          {pet.openRequestCount} · {pet.requestCount}
        </span>
      </span>

      <ChevronRight
        size={16}
        aria-hidden="true"
        className="pointer-events-none relative z-[1] justify-self-end text-[var(--muted-2)] transition-colors group-hover:text-[var(--primary)]"
      />

      <span className="pointer-events-none relative z-[1] col-span-2 mt-1 flex min-w-0 flex-col gap-0.5 md:hidden">
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--muted)]">
          <User aria-hidden="true" size={11} className="text-[var(--muted-2)]" />
          <span title={pet.ownerName} className="truncate">
            {pet.ownerName}
          </span>
        </span>
      </span>
    </div>
  );

  if (!canEdit) {
    return (
      <div className="border-b border-[var(--line)]">{rowSummary}</div>
    );
  }

  return (
    <InlineEditRow
      editLabel={`${t("directory.action.edit")} ${pet.name}`}
      editText={t("directory.action.edit")}
      regionLabel={`${t("directory.action.edit")} ${pet.name}`}
      row={rowSummary}
      form={({ requestClose }) => (
        <div className="grid gap-3">
          <ProfileEditorCard
            action={updatePetProfile}
            className="!border-0 !bg-transparent !p-0 !shadow-none"
            description={
              <span>
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ""}
                {` · ${pet.ownerName}`}
              </span>
            }
            hiddenFields={
              <>
                <input name="lang" type="hidden" value={locale} />
                <input name="petId" type="hidden" value={pet.id} />
              </>
            }
            imageLabel={t("profile.photo")}
            imageUrl={pet.photoUrl}
            name={pet.name}
            submitLabel={t("profile.save")}
            title={pet.name}
          >
            <ProfileField
              htmlFor={`pet-name-${pet.id}`}
              label={t("profile.fullName")}
            >
              <input
                className={profileInputClass}
                defaultValue={pet.name}
                id={`pet-name-${pet.id}`}
                name="name"
                required
              />
            </ProfileField>
            <ProfileField
              htmlFor={`pet-species-${pet.id}`}
              label={t("directory.filter.species")}
            >
              <input
                className={profileInputClass}
                defaultValue={pet.species}
                id={`pet-species-${pet.id}`}
                name="species"
                required
              />
            </ProfileField>
            <ProfileField htmlFor={`pet-breed-${pet.id}`} label={t("profile.breed")}>
              <input
                className={profileInputClass}
                defaultValue={pet.breed ?? ""}
                id={`pet-breed-${pet.id}`}
                name="breed"
              />
            </ProfileField>
            <ProfileField htmlFor={`pet-sex-${pet.id}`} label={t("profile.sex")}>
              <input
                className={profileInputClass}
                defaultValue={pet.sex ?? ""}
                id={`pet-sex-${pet.id}`}
                name="sex"
              />
            </ProfileField>
            <ProfileField
              htmlFor={`pet-birth-date-${pet.id}`}
              label={t("directory.pet.ageLabel")}
            >
              <input
                className={profileInputClass}
                defaultValue={pet.birthDate ?? ""}
                id={`pet-birth-date-${pet.id}`}
                name="birthDate"
                type="date"
              />
            </ProfileField>
            <ProfileField
              htmlFor={`pet-weight-${pet.id}`}
              label={t("directory.pet.weightLabel")}
            >
              <input
                className={profileInputClass}
                defaultValue={pet.weightKg ?? ""}
                id={`pet-weight-${pet.id}`}
                name="weightKg"
                step="0.1"
                type="number"
              />
            </ProfileField>
            <ProfileField
              htmlFor={`pet-allergies-${pet.id}`}
              label={t("directory.detail.medical")}
              wide
            >
              <textarea
                className={profileTextareaClass}
                defaultValue={pet.allergies ?? ""}
                id={`pet-allergies-${pet.id}`}
                name="allergies"
              />
            </ProfileField>
            <ProfileField
              htmlFor={`pet-medical-notes-${pet.id}`}
              label={t("directory.detail.notes")}
              wide
            >
              <textarea
                className={profileTextareaClass}
                defaultValue={pet.medicalNotes ?? ""}
                id={`pet-medical-notes-${pet.id}`}
                name="medicalNotes"
              />
            </ProfileField>
          </ProfileEditorCard>
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
