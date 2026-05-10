import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  FileDown,
  MessageCircleReply,
  NotebookPen,
  UserRound
} from "lucide-react";
import { Badge, Button, Panel } from "@petcura/ui";
import {
  createTranslator,
  getChannelLabel,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  getSenderLabel,
  getUrgencyLabel,
  withLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import { requireStaffContext } from "@/lib/auth/staff";
import { getRequestDetail } from "@/lib/requests";

type RequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

export default async function RequestDetailPage({
  params,
  searchParams
}: RequestDetailPageProps) {
  const { id } = await params;
  const locale = await getRequestLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(
    locale,
    `/requests/${encodeURIComponent(id)}`
  );
  const request = await getRequestDetail(
    staffContext.supabase,
    staffContext.clinic.id,
    id
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  if (!request) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost">
          <Link href={withLocale("/inbox", locale)}>
            <ArrowLeft aria-hidden="true" size={16} />
            {t("nav.inbox")}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher
            currentPath={`/requests/${id}`}
            label={t("language.label")}
            locale={locale}
          />
          <Button variant="secondary">
            <NotebookPen aria-hidden="true" size={16} />
            {t("request.note")}
          </Button>
          <Button variant="secondary">
            <CalendarClock aria-hidden="true" size={16} />
            {t("request.reminder")}
          </Button>
          <Button>
            <MessageCircleReply aria-hidden="true" size={16} />
            {t("request.reply")}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="grid gap-4">
          <Panel className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary)]">
                <UserRound aria-hidden="true" size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{request.petName}</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {request.species} · {request.ownerName}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 text-sm">
              <div className="flex justify-between gap-3 border-t border-[var(--line)] pt-3">
                <span className="text-[var(--muted)]">
                  {t("request.status")}
                </span>
                <span className="font-medium">
                  {getRequestStatusLabel(request.status, locale)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-[var(--line)] pt-3">
                <span className="text-[var(--muted)]">
                  {t("request.urgency")}
                </span>
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
              </div>
              <div className="flex justify-between gap-3 border-t border-[var(--line)] pt-3">
                <span className="text-[var(--muted)]">
                  {t("request.category")}
                </span>
                <span className="font-medium">
                  {getRequestCategoryLabel(request.category, locale)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-[var(--line)] pt-3">
                <span className="text-[var(--muted)]">
                  {t("request.channel")}
                </span>
                <span className="font-medium">
                  {getChannelLabel(request.channel, locale)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-[var(--line)] pt-3">
                <span className="text-[var(--muted)]">
                  {t("request.owner")}
                </span>
                <span className="text-right font-medium">
                  {request.ownerPhone}
                </span>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{t("request.aiSummary")}</h2>
              <Badge tone="neutral">{t("request.draft")}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {request.summary || t("request.noSummary")}
            </p>
            <div className="mt-4 rounded-[var(--radius)] bg-[var(--surface-soft)] p-3 text-xs leading-5 text-[var(--muted)]">
              {t("request.aiNotice")}
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="font-semibold">{t("request.events")}</h2>
            <div className="mt-4 grid gap-2">
              {request.events.map((event) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-white p-3 text-sm"
                  key={event.id}
                >
                  <span className="font-medium">{event.eventType}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {dateFormatter.format(new Date(event.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">
                {t("request.conversation")}
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {t("request.timeline")}
              </h2>
            </div>
            <Button variant="secondary">
              <FileDown aria-hidden="true" size={16} />
              {t("request.export")}
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {request.messages.map((message) => (
              <div
                className="rounded-[var(--radius)] border border-[var(--line)] bg-white p-4"
                key={message.id}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {getSenderLabel(message.senderType, locale)}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {dateFormatter.format(new Date(message.createdAt))}
                  </span>
                </div>
                <p className="text-sm leading-6 text-[var(--foreground)]">
                  {message.body}
                </p>
              </div>
            ))}
          </div>

          {request.notes.length > 0 ? (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <h3 className="font-semibold">{t("request.internalNotes")}</h3>
              <div className="mt-3 grid gap-2">
                {request.notes.map((note) => (
                  <div
                    className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]"
                    key={note.id}
                  >
                    {note.body}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </section>
    </main>
  );
}
