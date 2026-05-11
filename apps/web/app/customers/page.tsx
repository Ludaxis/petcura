import { Languages, Mail, MessageSquareText, PawPrint, Phone, Users } from "lucide-react";
import { Badge } from "@petcura/ui";
import { createTranslator } from "@petcura/shared";
import { AppShell } from "@/app/_components/AppShell";
import { requireStaffContext } from "@/lib/auth/staff";
import { listClinicCustomers } from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/customers");
  const rows = await listClinicCustomers(
    staffContext.supabase,
    staffContext.clinic.id
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <AppShell
      locale={locale}
      currentPath="/customers"
      pageTitle={t("nav.headerTitle.customers")}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <Users aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {t("customers.title")}
                </h1>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("customers.description")}
              </p>
            </div>
            <Badge tone="teal">{rows.length}</Badge>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          {rows.length === 0 ? (
            <div className="mx-auto flex max-w-6xl items-center rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)] shadow-sm">
              {t("customers.empty")}
            </div>
          ) : (
            <ol className="mx-auto grid max-w-6xl gap-2">
              {rows.map((owner) => (
                <li
                  className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm"
                  key={owner.id}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.9fr)] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-[15px] font-semibold text-[var(--ink)]">
                          {owner.name}
                        </h2>
                        <Badge tone="neutral">
                          {owner.preferredLanguage.toUpperCase()}
                        </Badge>
                      </div>
                      <dl className="mt-2 grid gap-1.5 text-[12.5px] text-[var(--muted)] sm:grid-cols-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Phone aria-hidden="true" size={13} />
                          <dt className="sr-only">{t("customers.phone")}</dt>
                          <dd className="truncate">{owner.phone}</dd>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <Mail aria-hidden="true" size={13} />
                          <dt className="sr-only">{t("customers.email")}</dt>
                          <dd className="truncate">{owner.email ?? "—"}</dd>
                        </div>
                      </dl>
                      {owner.notes ? (
                        <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-[var(--ink-2)]">
                          {owner.notes}
                        </p>
                      ) : null}
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-[12.5px] text-[var(--ink-2)] sm:grid-cols-4 lg:grid-cols-2">
                      <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
                        <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          <PawPrint aria-hidden="true" size={12} />
                          {t("customers.pets")}
                        </dt>
                        <dd className="mt-1 font-semibold text-[var(--ink)]">
                          {owner.petCount}
                        </dd>
                      </div>
                      <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
                        <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          <MessageSquareText aria-hidden="true" size={12} />
                          {t("customers.requests")}
                        </dt>
                        <dd className="mt-1 font-semibold text-[var(--ink)]">
                          {owner.requestCount}
                        </dd>
                      </div>
                      <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
                        <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          <Languages aria-hidden="true" size={12} />
                          {t("customers.language")}
                        </dt>
                        <dd className="mt-1 font-semibold text-[var(--ink)]">
                          {owner.preferredLanguage.toUpperCase()}
                        </dd>
                      </div>
                      <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          {t("customers.latestRequest")}
                        </dt>
                        <dd className="mt-1 truncate font-semibold text-[var(--ink)]">
                          {owner.latestRequestAt
                            ? dateFormatter.format(new Date(owner.latestRequestAt))
                            : "—"}
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
