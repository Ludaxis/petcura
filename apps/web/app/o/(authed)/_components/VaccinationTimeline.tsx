import type { SupportedLocale } from "@petcura/shared";
import { cn } from "@petcura/ui";
import {
  aggregateVaccineUrgency,
  formatDate,
  vaccineUrgency
} from "@/lib/owner/format";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import type { Vaccination, VaccineUrgency } from "@/lib/owner/types";

type Props = {
  vaccinations: Vaccination[];
  locale: SupportedLocale;
};

const dotColor: Record<VaccineUrgency, string> = {
  ok: "bg-[var(--green)]",
  due_soon: "bg-[var(--amber)]",
  overdue: "bg-[var(--red)]",
  no_due: "bg-[var(--muted-2)]"
};

const bannerTone: Record<VaccineUrgency, string> = {
  ok: "bg-[var(--green-soft)] text-[var(--primary-strong)]",
  due_soon: "bg-[var(--amber-soft)] text-[var(--amber)]",
  overdue: "bg-[var(--red-soft)] text-[var(--red)]",
  no_due: "bg-[var(--soft)] text-[var(--muted)]"
};

export function VaccinationTimeline({ vaccinations, locale }: Props) {
  const t = createOwnerTranslator(locale);

  if (vaccinations.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--line-2)] p-6 text-center text-sm text-[var(--muted)]">
        {t("pet.vax.empty")}
      </div>
    );
  }

  const banner = aggregateVaccineUrgency(
    vaccinations.map((v) => vaccineUrgency(v.nextDueAt))
  );

  const bannerLabel =
    banner === "overdue"
      ? t("pet.vax.overdue")
      : banner === "due_soon"
        ? t("pet.vax.dueSoon")
        : t("pet.vax.upToDate");

  const grouped = vaccinations.reduce<Record<string, Vaccination[]>>(
    (acc, v) => {
      const year = v.administeredAt.slice(0, 4);
      (acc[year] ||= []).push(v);
      return acc;
    },
    {}
  );
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn("rounded-[var(--radius)] px-4 py-3 text-sm font-medium", bannerTone[banner])}
        role="status"
      >
        {bannerLabel}
      </div>
      <ol className="flex flex-col gap-5">
        {years.map((year) => (
          <li key={year} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">
              {year}
            </p>
            <ul className="flex flex-col gap-2">
              {(grouped[year] ?? [])
                .slice()
                .sort((a, b) => b.administeredAt.localeCompare(a.administeredAt))
                .map((v) => {
                  const u = vaccineUrgency(v.nextDueAt);
                  return (
                    <li
                      key={v.id}
                      className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3"
                    >
                      <span aria-hidden className={cn("mt-1.5 h-2.5 w-2.5 rounded-full", dotColor[u])} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">{v.vaccineName}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {formatDate(v.administeredAt, locale)}
                        </p>
                        {v.nextDueAt ? (
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {t("pet.vax.nextDue", { date: formatDate(v.nextDueAt, locale) })}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
