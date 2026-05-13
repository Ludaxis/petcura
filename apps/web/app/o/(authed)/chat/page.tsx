import Link from "next/link";
import { ArrowRight, ChatCircle } from "@phosphor-icons/react/dist/ssr";
import { cn, StatusPill } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import { listOwnerRequests } from "@/lib/owner/data";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { formatRelative } from "@/lib/owner/format";

const statusMap = {
  new: "new",
  waiting_staff: "waiting-staff",
  waiting_owner: "waiting-owner",
  resolved: "resolved"
} as const;

export default async function ChatListPage() {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, "/o/chat");
  const t = createOwnerTranslator(locale);
  const requests = (await listOwnerRequests(context))
    .slice()
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {t("chat.list.title")}
        </h1>
        <Link
          href="/o/chat/new"
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--paper)]",
            "hover:bg-[var(--primary-strong)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          )}
        >
          <ChatCircle size={14} weight="fill" aria-hidden />
          {t("chat.list.startNew")}
        </Link>
      </header>

      {requests.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--line-2)] p-8 text-center">
          <p className="text-sm text-[var(--muted)]">{t("chat.list.empty")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/o/chat/${r.id}`}
                className={cn(
                  "flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-4",
                  "transition-colors hover:border-[var(--line-2)] hover:bg-[var(--soft)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <ChatCircle size={20} weight="duotone" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {r.petName}
                    </p>
                    <StatusPill status={statusMap[r.status]} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
                    {r.lastMessagePreview}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-[var(--muted)]">
                    {formatRelative(r.lastMessageAt, locale)}
                  </span>
                  {r.unreadByOwner > 0 ? (
                    <span
                      aria-label={`${r.unreadByOwner} unread`}
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-semibold text-[var(--paper)]"
                    >
                      {r.unreadByOwner}
                    </span>
                  ) : (
                    <ArrowRight size={14} weight="regular" aria-hidden className="text-[var(--muted-2)]" />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
