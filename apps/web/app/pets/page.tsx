import { AlertTriangle, ClipboardList, PawPrint, Scale, User } from "lucide-react";
import { Badge } from "@petcura/ui";
import { createTranslator } from "@petcura/shared";
import { AppShell } from "@/app/_components/AppShell";
import { requireStaffContext } from "@/lib/auth/staff";
import { listClinicPets } from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function PetsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/pets");
  const rows = await listClinicPets(staffContext.supabase, staffContext.clinic.id);

  return (
    <AppShell
      locale={locale}
      currentPath="/pets"
      pageTitle={t("nav.headerTitle.pets")}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <PawPrint aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {t("pets.title")}
                </h1>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("pets.description")}
              </p>
            </div>
            <Badge tone="teal">{rows.length}</Badge>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          {rows.length === 0 ? (
            <div className="mx-auto flex max-w-6xl items-center rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)] shadow-sm">
              {t("pets.empty")}
            </div>
          ) : (
            <ol className="mx-auto grid max-w-6xl gap-2">
              {rows.map((pet) => (
                <li
                  className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm"
                  key={pet.id}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(24rem,1fr)] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-[15px] font-semibold text-[var(--ink)]">
                          {pet.name}
                        </h2>
                        <Badge tone="neutral">{pet.species}</Badge>
                        {pet.breed ? (
                          <Badge tone="neutral">{pet.breed}</Badge>
                        ) : null}
                      </div>
                      <dl className="mt-2 grid gap-1.5 text-[12.5px] text-[var(--muted)] sm:grid-cols-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <User aria-hidden="true" size={13} />
                          <dt className="sr-only">{t("pets.owner")}</dt>
                          <dd className="truncate">
                            {pet.ownerName} · {pet.ownerPhone}
                          </dd>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <Scale aria-hidden="true" size={13} />
                          <dt className="sr-only">{t("pets.weight")}</dt>
                          <dd className="truncate">
                            {pet.weightKg ? `${pet.weightKg} kg` : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <dl className="grid gap-2 text-[12.5px] text-[var(--ink-2)] sm:grid-cols-3">
                      <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          {t("pets.requests")}
                        </dt>
                        <dd className="mt-1 flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                          <ClipboardList aria-hidden="true" size={13} />
                          {pet.requestCount}
                        </dd>
                      </div>
                      <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          {t("pets.allergies")}
                        </dt>
                        <dd className="mt-1 line-clamp-2 text-[var(--ink)]">
                          {pet.allergies || "—"}
                        </dd>
                      </div>
                      <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
                        <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          <AlertTriangle aria-hidden="true" size={12} />
                          {t("pets.notes")}
                        </dt>
                        <dd className="mt-1 line-clamp-2 text-[var(--ink)]">
                          {pet.medicalNotes || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </AppShell>
  );
}
