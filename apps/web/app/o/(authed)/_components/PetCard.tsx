import Link from "next/link";
import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import type { Pet } from "@/lib/owner/types";
import { cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { petAgeLabel } from "@/lib/owner/format";

type Props = {
  pet: Pet;
  locale: SupportedLocale;
  status?: { tone: "ok" | "warn" | "alert"; label: string } | null;
};

const speciesKey = (s: Pet["species"]) =>
  `pet.species.${s}` as
    | "pet.species.dog"
    | "pet.species.cat"
    | "pet.species.rabbit"
    | "pet.species.bird"
    | "pet.species.reptile"
    | "pet.species.other";

const statusTone: Record<"ok" | "warn" | "alert", string> = {
  ok: "bg-[var(--green-soft)] text-[var(--primary-strong)]",
  warn: "bg-[var(--amber-soft)] text-[var(--amber)]",
  alert: "bg-[var(--red-soft)] text-[var(--red)]"
};

export function PetCard({ pet, locale, status }: Props) {
  const t = createOwnerTranslator(locale);
  const age = petAgeLabel(pet.birthDate, locale);

  return (
    <Link
      href={`/o/pets/${pet.id}`}
      className={cn(
        "group block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)]",
        "transition-all hover:border-[var(--line-2)] hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
      )}
    >
      <div className="relative aspect-[5/3] w-full bg-[var(--primary-soft)]">
        {pet.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pet.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--primary-strong)]">
            <PawPrint size={56} weight="duotone" aria-hidden />
          </div>
        )}
        {status ? (
          <span
            className={cn(
              "absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
              statusTone[status.tone]
            )}
          >
            {status.label}
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold leading-tight text-[var(--ink)]">
            {pet.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
            {t(speciesKey(pet.species))}
            {age ? ` · ${age}` : ""}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </p>
        </div>
        {pet.weightKg ? (
          <span className="shrink-0 text-right text-xs text-[var(--muted)]">
            <span className="block font-mono text-base font-semibold text-[var(--ink)]">
              {pet.weightKg.toFixed(1)}
            </span>
            kg
          </span>
        ) : null}
      </div>
    </Link>
  );
}
