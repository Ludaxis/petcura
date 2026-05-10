import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Inbox, Languages } from "lucide-react";
import { Badge, Button, Panel } from "@petcura/ui";
import {
  createTranslator,
  demoRequests,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  getUrgencyLabel,
  normalizeLocale,
  requestStatusColumns,
  withLocale
} from "@petcura/shared";
import { LanguageSwitcher } from "@/components/language-switcher";

type InboxPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = createTranslator(locale);

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
          <Badge tone="neutral">{t("inbox.demoBadge")}</Badge>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-5">
        {requestStatusColumns.map((column) => {
          const columnRequests = demoRequests.filter(
            (request) => request.status === column.value
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
                      {request.translationAvailable ? (
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
