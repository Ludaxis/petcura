import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import { listOwnerPets, listOwnerServices } from "@/lib/owner/data";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { ServiceCard } from "../_components/ServiceCard";

const groupOrder: ReadonlyArray<
  "checkup" | "vaccination" | "consultation" | "refill" | "surgery" | "grooming" | "other"
> = ["checkup", "vaccination", "consultation", "refill", "surgery", "grooming", "other"];

export default async function ServicesPage() {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, "/o/services");
  const t = createOwnerTranslator(locale);
  const pets = await listOwnerPets(context);
  const services = await listOwnerServices(context, locale, pets);

  if (services.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {t("services.title")}
        </h1>
        <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--line-2)] p-8 text-center">
          <p className="text-base font-semibold text-[var(--ink)]">{t("services.empty.title")}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("services.empty.body")}</p>
        </div>
      </div>
    );
  }

  const grouped = groupOrder
    .map((cat) => ({ category: cat, items: services.filter((s) => s.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
        {t("services.title")}
      </h1>
      {grouped.map((g) => (
        <section key={g.category} aria-labelledby={`svc-${g.category}`} className="flex flex-col gap-3">
          <h2
            id={`svc-${g.category}`}
            className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
          >
            {g.category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((s) => (
              <ServiceCard key={s.slug} service={s} locale={locale} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
