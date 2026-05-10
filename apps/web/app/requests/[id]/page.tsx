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
  demoRequests,
  getChannelLabel,
  getRequestCategoryLabel,
  getSenderLabel,
  getUrgencyLabel,
  normalizeLocale,
  withLocale
} from "@petcura/shared";
import { LanguageSwitcher } from "@/components/language-switcher";

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
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const request = demoRequests.find((item) => item.id === id);

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
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{t("request.aiSummary")}</h2>
              <Badge tone="neutral">{t("request.draft")}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {request.summary}
            </p>
            <div className="mt-4 rounded-[var(--radius)] bg-[var(--surface-soft)] p-3 text-xs leading-5 text-[var(--muted)]">
              {t("request.aiNotice")}
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
                    {getSenderLabel(message.sender, locale)}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {message.time}
                  </span>
                </div>
                <p className="text-sm leading-6 text-[var(--foreground)]">
                  {message.body}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}
