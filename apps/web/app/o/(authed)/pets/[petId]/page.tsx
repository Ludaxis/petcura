import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PawPrint } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import {
  listOwnerPets,
  listOwnerVaccinations,
  listOwnerWeightEntries
} from "@/lib/owner/data";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { formatDate, petAgeLabel } from "@/lib/owner/format";
import { VaccinationTimeline } from "../../_components/VaccinationTimeline";
import { PetTabs } from "../../_components/PetTabs";

type Props = {
  params: Promise<{ petId: string }>;
};

const speciesKey = (s: string) =>
  `pet.species.${s}` as
    | "pet.species.dog"
    | "pet.species.cat"
    | "pet.species.rabbit"
    | "pet.species.bird"
    | "pet.species.reptile"
    | "pet.species.other";

export default async function PetDetailPage({ params }: Props) {
  const { petId } = await params;
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, `/o/pets/${petId}`);
  const t = createOwnerTranslator(locale);
  const [pets, allVaccinations, allWeights] = await Promise.all([
    listOwnerPets(context),
    listOwnerVaccinations(context),
    listOwnerWeightEntries(context)
  ]);
  const pet = pets.find((item) => item.id === petId);
  if (!pet) notFound();

  const vaccinations = allVaccinations
    .filter((v) => v.petId === petId)
    .sort((a, b) => b.administeredAt.localeCompare(a.administeredAt));
  const weights = allWeights
    .filter((w) => w.petId === petId)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  const age = petAgeLabel(pet.birthDate, locale);

  const tabs = [
    {
      id: "timeline",
      label: t("pet.tab.timeline"),
      content:
        weights.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("pet.timeline.empty")}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {weights.slice().reverse().map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{t("pet.weight")}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDate(w.measuredAt, locale)}</p>
                </div>
                <p className="font-mono text-base font-semibold text-[var(--ink)]">
                  {w.weightKg.toFixed(1)} kg
                </p>
              </li>
            ))}
          </ol>
        )
    },
    {
      id: "vaccines",
      label: t("pet.tab.vaccines"),
      content: <VaccinationTimeline vaccinations={vaccinations} locale={locale} />
    },
    {
      id: "notes",
      label: t("pet.tab.notes"),
      content: (
        <div className="flex flex-col gap-3">
          <p className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--ink)] whitespace-pre-wrap">
            {pet.ownerNotes ?? (
              <span className="text-[var(--muted)]">{t("pet.notes.placeholder")}</span>
            )}
          </p>
        </div>
      )
    },
    {
      id: "photos",
      label: t("pet.tab.photos"),
      content: (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-[var(--radius)] border border-dashed border-[var(--line-2)] bg-[var(--soft)]"
              aria-hidden
            />
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-[var(--line)] px-4 pb-5 pt-4 sm:px-6 lg:px-10 lg:pt-8">
        <Link
          href="/o"
          className={cn(
            "mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)]",
            "hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          )}
        >
          <ArrowLeft size={14} weight="bold" aria-hidden />
          {t("tab.home")}
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]">
            {pet.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pet.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <PawPrint size={30} weight="duotone" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--ink)]">
              {pet.name}
            </h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {t(speciesKey(pet.species))}
              {age ? ` · ${age}` : ""}
              {pet.breed ? ` · ${pet.breed}` : ""}
              {pet.weightKg ? ` · ${pet.weightKg.toFixed(1)} kg` : ""}
            </p>
          </div>
        </div>
      </header>
      <div className="px-4 pb-12 pt-2 sm:px-6 lg:px-10">
        <PetTabs tabs={tabs} ariaLabel={pet.name} />
      </div>
    </div>
  );
}
