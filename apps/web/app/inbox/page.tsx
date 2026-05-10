import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Inbox, Languages, LogOut } from "lucide-react";
import { Badge, Button, Panel } from "@petcura/ui";
import {
  createTranslator,
  getInboxViewForRequest,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  getUrgencyLabel,
  inboxViewColumns,
  withLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import { requireStaffContext } from "@/lib/auth/staff";
import { listInboxRequests } from "@/lib/requests";
import { signOutStaff } from "./actions";

type InboxPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const locale = await getRequestLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/inbox");
  const requests = await listInboxRequests(
    staffContext.supabase,
    staffContext.clinic.id
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href={withLocale("/", locale)}>
              <ArrowLeft aria-hidden="true" size={16} />
              {t("nav.back")}
            </Link>
          </Button>
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">
              {t("inbox.kicker")}
            </p>
            <h1 className="text-2xl font-semibold">{t("inbox.title")}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher
            currentPath="/inbox"
            label={t("language.label")}
            locale={locale}
          />
          <Badge tone="teal">{staffContext.clinic.name}</Badge>
          <Badge tone="neutral">{t("inbox.liveBadge")}</Badge>
          <form action={signOutStaff}>
            <input name="lang" type="hidden" value={locale} />
            <Button variant="secondary" type="submit">
              <LogOut aria-hidden="true" size={16} />
              {t("auth.logout")}
            </Button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-5">
        {inboxViewColumns.map((column) => {
          const columnRequests = requests.filter(
            (request) => getInboxViewForRequest(request) === column.value
          );

          return (
            <Panel className="min-h-80 p-3" key={column.value}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Inbox aria-hidden="true" size={16} />
                  <h2 className="text-sm font-semibold">
                    {getRequestStatusLabel(column.labelKey, locale)}
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                  {columnRequests.length}
                </span>
              </div>

              <div className="grid gap-2">
                {columnRequests.length === 0 ? (
                  <p className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]">
                    {t("inbox.empty")}
                  </p>
                ) : null}
                {columnRequests.map((request) => (
                  <Link
                    className="group rounded-[var(--radius)] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--primary)]"
                    href={withLocale(`/requests/${request.id}`, locale)}
                    key={request.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{request.petName}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {request.ownerName}
                        </p>
                      </div>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="text-[var(--muted)] transition group-hover:text-[var(--primary)]"
                        size={16}
                      />
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                      {request.summary}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {dateFormatter.format(new Date(request.updatedAt))}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        tone={
                          request.urgency === "high"
                            ? "red"
                            : request.urgency === "medium"
                              ? "amber"
                              : "neutral"
                        }
                      >
                        {getUrgencyLabel(request.urgency, locale)}
                      </Badge>
                      <Badge tone="neutral">
                        {getRequestCategoryLabel(request.category, locale)}
                      </Badge>
                      {request.ownerLanguage !== locale ? (
                        <Badge tone="teal">
                          <Languages aria-hidden="true" size={12} />
                          {t("inbox.translation")}
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          );
        })}
      </section>
    </main>
  );
}
