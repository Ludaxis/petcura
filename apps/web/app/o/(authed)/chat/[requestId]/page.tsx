import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Checks } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import {
  getOwnerRequest,
  listMessagesForOwnerRequest
} from "@/lib/owner/data";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { formatRelative } from "@/lib/owner/format";
import { OwnerComposer } from "../../_components/OwnerComposer";
import { OwnerRequestRealtime } from "../../_components/OwnerRequestRealtime";
import { submitOwnerMessage } from "../../actions";

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function ChatThreadPage({ params }: Props) {
  const { requestId } = await params;
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, `/o/chat/${requestId}`);
  const t = createOwnerTranslator(locale);
  const req = await getOwnerRequest(context, requestId);
  if (!req) notFound();
  const messages = await listMessagesForOwnerRequest(context, requestId);

  async function sendMessage(text: string) {
    "use server";
    await submitOwnerMessage(requestId, text);
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:min-h-0">
      <OwnerRequestRealtime requestId={requestId} />
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href="/o/chat"
          aria-label={t("tab.chat")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)]",
            "hover:bg-[var(--soft)] hover:text-[var(--ink)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          )}
        >
          <ArrowLeft size={18} weight="bold" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--ink)]">{context.clinic.name}</p>
          {req.petName ? <p className="truncate text-xs text-[var(--muted)]">{req.petName}</p> : null}
        </div>
      </header>

      <ol className="flex flex-col gap-2 px-4 py-5 sm:px-6 lg:px-10">
        {messages.length === 0 ? (
          <li className="rounded-[var(--radius-xl)] border border-dashed border-[var(--line-2)] p-6 text-center">
            <p className="font-semibold text-[var(--ink)]">{t("chat.empty.title")}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("chat.empty.body")}</p>
          </li>
        ) : (
          messages.map((m) => {
            const isOwner = m.sender === "owner";
            const isSystem = m.sender === "system";
            return (
              <li
                key={m.id}
                className={cn(
                  "flex w-full",
                  isOwner ? "justify-end" : "justify-start",
                  isSystem && "justify-center"
                )}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm leading-6",
                    isOwner && "bg-[var(--primary)] text-[var(--paper)] rounded-br-sm",
                    !isOwner && !isSystem &&
                      "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] rounded-bl-sm",
                    isSystem &&
                      "bg-[var(--soft)] text-[var(--muted)] text-xs uppercase tracking-[0.06em]"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[10.5px]",
                      isOwner ? "text-[var(--paper)]/80" : "text-[var(--muted-2)]"
                    )}
                  >
                    <span>{formatRelative(m.createdAt, locale)}</span>
                    {isOwner && m.delivery === "delivered" ? (
                      <Check size={12} weight="bold" aria-label={t("chat.status.delivered")} />
                    ) : null}
                    {isOwner && m.delivery === "read" ? (
                      <Checks size={12} weight="bold" aria-label={t("chat.status.read")} />
                    ) : null}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ol>

      <div className="mt-auto px-4 sm:px-6 lg:px-10">
        <OwnerComposer
          placeholder={t("chat.composer.placeholder")}
          sendLabel={t("chat.composer.send")}
          attachLabel={t("chat.composer.attach")}
          onSubmitText={sendMessage}
        />
      </div>
    </div>
  );
}
