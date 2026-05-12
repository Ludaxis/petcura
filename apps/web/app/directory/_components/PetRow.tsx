import Link from "next/link";
import {
  ChevronRight,
  ClipboardList,
  PawPrint,
  Scale,
  User
} from "lucide-react";
import { Badge, cn } from "@petcura/ui";
import { createTranslator, type SupportedLocale } from "@petcura/shared";
import type { PetListItem } from "@/lib/clinic/directory";
import { ProfileAvatar } from "@/app/_components/profile/ProfileEditor";

type PetRowProps = {
  pet: PetListItem;
  locale: SupportedLocale;
  selected: boolean;
  density: "comfortable" | "compact";
  href: string;
  formatRelative: (iso: string) => string;
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
  formatRelative,
  index
}: PetRowProps) {
  const t = createTranslator(locale);
  const isCompact = density === "compact";
  const age = ageFromBirth(pet.birthDate);

  return (
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
        "pc-row-in group relative grid items-center gap-3 border-b border-[var(--line)] px-4 transition-colors",
        "hover:bg-[var(--soft)] focus-within:bg-[var(--soft)]",
        "data-[selected=true]:bg-[var(--primary-soft)]",
        isCompact ? "py-2 sm:py-2.5" : "py-3 sm:py-3.5",
        "grid-cols-[40px_minmax(160px,1.2fr)_minmax(0,1.4fr)_auto_18px]",
        "max-md:grid-cols-[36px_minmax(0,1fr)_auto]"
      )}
    >
      <Link
        href={href}
        aria-label={`${pet.name}, ${pet.species}, owner ${pet.ownerName}`}
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
          <span className="truncate text-[13.5px] font-semibold text-[var(--ink)]">
            {pet.name}
          </span>
          <Badge tone="neutral">{pet.species}</Badge>
          {pet.breed ? (
            <span className="hidden truncate text-[11.5px] text-[var(--muted-2)] sm:inline">
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
            <span className="truncate">{pet.ownerName}</span>
            {pet.ownerPhone ? (
              <>
                <span aria-hidden="true" className="text-[var(--muted-2)]">
                  ·
                </span>
                <span className="truncate font-mono">{pet.ownerPhone}</span>
              </>
            ) : null}
          </span>
        ) : null}
      </span>

      <span className="pointer-events-none relative z-[1] hidden min-w-0 flex-col gap-0.5 text-[12.5px] text-[var(--muted)] md:flex">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {age ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.04em]">
              {t("directory.pet.ageLabel")} · {age}
            </span>
          ) : null}
          {pet.weightKg !== null ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.04em]">
              <Scale aria-hidden="true" size={10} />
              {pet.weightKg} kg
            </span>
          ) : null}
          {pet.sex ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.04em]">
              {pet.sex}
            </span>
          ) : null}
        </span>
        {pet.latestRequestAt ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
            {t("directory.owner.latestLabel")} · {formatRelative(pet.latestRequestAt)}
          </span>
        ) : null}
      </span>

      <span className="pointer-events-none relative z-[1] hidden whitespace-nowrap items-center gap-2 md:inline-flex">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.04em]",
            pet.openRequestCount > 0
              ? "bg-[var(--amber-soft)] text-[var(--amber)]"
              : "bg-[var(--surface-soft)] text-[var(--muted)]"
          )}
          aria-label={`${pet.openRequestCount} ${t("directory.pet.openLabel")}`}
        >
          <ClipboardList aria-hidden="true" size={10} />
          {pet.openRequestCount}/{pet.requestCount}
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
          <span className="truncate">{pet.ownerName}</span>
        </span>
      </span>
    </div>
  );
}
