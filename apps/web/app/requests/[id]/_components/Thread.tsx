"use client";

import { useCallback, useState } from "react";
import { Languages } from "lucide-react";
import { cn } from "@petcura/ui";
import {
  getSenderLabel,
  type SupportedLocale
} from "@petcura/shared";
import type { MessageDeliveryStatus } from "@/lib/delivery";
import { logTranslationRevealed } from "../actions";

export type ThreadMessage = {
  id: string;
  senderType: "owner" | "staff" | "system" | "ai";
  body: string;
  bodyTranslated: string | null;
  sourceLocale: string | null;
  createdAt: string;
  deliveryStatus: MessageDeliveryStatus | null;
  deliveryProvider: string | null;
  deliveryUpdatedAt: string | null;
};

type ThreadProps = {
  requestId: string;
  messages: ThreadMessage[];
  locale: SupportedLocale;
  /**
   * Notifies the parent shell when an article bubble receives focus, so the
   * keyboard model's `T` shortcut can target the right bubble. The shell
   * tracks this via a ref so React state churn doesn't fight roving focus.
   */
  onBubbleFocus?: (messageId: string) => void;
  labels: {
    region: string;
    /** Template "Show in {locale}" — client substitutes {locale}. */
    showTranslation: string;
    hideTranslation: string;
    error: string;
    system: string;
    deliveryStatus: string;
    delivery: Record<MessageDeliveryStatus, string>;
  };
};

function deliveryTone(status: MessageDeliveryStatus) {
  if (status === "failed") {
    return "border-[var(--red-soft)] bg-[var(--red-soft)] text-[var(--red)]";
  }

  if (status === "read" || status === "acknowledged") {
    return "border-[var(--green-soft)] bg-[var(--green-soft)] text-[var(--green)]";
  }

  if (status === "delivered") {
    return "border-[var(--primary-soft)] bg-[var(--primary-soft)] text-[var(--primary-strong)]";
  }

  return "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]";
}

export function Thread({
  requestId,
  messages,
  locale,
  onBubbleFocus,
  labels
}: ThreadProps) {
  const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  const formatTime = (iso: string) => timeFormatter.format(new Date(iso));
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [errorId, setErrorId] = useState<string | null>(null);
  // Roving tabindex: only the focused (or first translatable owner) bubble is
  // tab-reachable. Defaults to the most recent translatable owner bubble, so
  // `T` from cold-start lands on the bubble Liis is most likely to want.
  const lastTranslatableOwner = [...messages]
    .reverse()
    .find((m) => m.senderType === "owner" && Boolean(m.bodyTranslated));
  const [focusedBubbleId, setFocusedBubbleId] = useState<string | null>(
    lastTranslatableOwner?.id ?? null
  );

  const toggleTranslation = useCallback(
    (msg: ThreadMessage) => {
      if (!msg.bodyTranslated) return;
      const next = !revealed[msg.id];
      setRevealed((prev) => ({ ...prev, [msg.id]: next }));
      // Only log on the reveal edge (false → true). Hiding doesn't need an
      // audit row per docs/contracts/translation.md.
      if (next) {
        void logTranslationRevealed({
          requestId,
          messageId: msg.id,
          targetLocale: locale
        }).then((result) => {
          if (!result.ok) setErrorId(msg.id);
          else setErrorId(null);
        });
      }
    },
    [locale, requestId, revealed]
  );

  return (
    <section
      role="region"
      aria-label={labels.region}
      data-thread
      className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
    >
      <ol className="flex flex-col gap-3" aria-live="polite">
        {messages.map((msg) => {
          const isStaff = msg.senderType === "staff";
          const isSystem = msg.senderType === "system" || msg.senderType === "ai";
          const isOwner = msg.senderType === "owner";
          const senderLabel = isSystem
            ? labels.system
            : getSenderLabel(msg.senderType, locale);
          const showTranslate = isOwner && Boolean(msg.bodyTranslated);
          const isRevealed = revealed[msg.id] === true;

          if (isSystem) {
            return (
              <li
                key={msg.id}
                className="flex justify-center"
                aria-label={`${senderLabel} ${formatTime(msg.createdAt)}`}
              >
                <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                  {msg.body}
                </p>
              </li>
            );
          }

          return (
            <li
              key={msg.id}
              data-message-id={msg.id}
              data-sender={msg.senderType}
              data-translatable={showTranslate ? "true" : undefined}
              className={cn(
                "flex max-w-[92%] gap-2",
                isStaff ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <article
                role="article"
                tabIndex={focusedBubbleId === msg.id ? 0 : -1}
                onFocus={() => {
                  setFocusedBubbleId(msg.id);
                  onBubbleFocus?.(msg.id);
                }}
                aria-label={`${senderLabel} · ${formatTime(msg.createdAt)}${
                  msg.sourceLocale ? ` · ${msg.sourceLocale.toUpperCase()}` : ""
                }`}
                className={cn(
                  "max-w-[480px] rounded-[10px] border px-3 py-2 text-[13.5px] leading-[1.5] text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                  isStaff
                    ? "border-transparent bg-[var(--primary-soft)]"
                    : "border-[var(--line-2)] bg-[var(--soft)]"
                )}
              >
                <p className="break-words whitespace-pre-wrap">
                  {isRevealed && msg.bodyTranslated
                    ? msg.bodyTranslated
                    : msg.body}
                </p>
                <div
                  className={cn(
                    "mt-1.5 flex items-center gap-2 font-mono text-[10.5px] text-[var(--muted-2)]",
                    isStaff && "justify-end"
                  )}
                >
                  <span>{formatTime(msg.createdAt)}</span>
                  {msg.sourceLocale ? (
                    <span aria-hidden="true">{msg.sourceLocale.toUpperCase()}</span>
                  ) : null}
                  {isStaff && msg.deliveryStatus ? (
                    <span
                      aria-label={`${labels.deliveryStatus}: ${
                        labels.delivery[msg.deliveryStatus]
                      }`}
                      className={cn(
                        "inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                        deliveryTone(msg.deliveryStatus)
                      )}
                      title={
                        msg.deliveryUpdatedAt
                          ? `${labels.deliveryStatus}: ${
                              labels.delivery[msg.deliveryStatus]
                            } · ${formatTime(msg.deliveryUpdatedAt)}`
                          : labels.delivery[msg.deliveryStatus]
                      }
                    >
                      {labels.delivery[msg.deliveryStatus]}
                    </span>
                  ) : null}
                </div>
                {showTranslate ? (
                  <div className="mt-1.5 border-t border-dashed border-[var(--line)] pt-1.5">
                    <button
                      type="button"
                      data-translate-toggle
                      aria-pressed={isRevealed}
                      aria-label={
                        isRevealed
                          ? labels.hideTranslation
                          : labels.showTranslation.replace(
                              "{locale}",
                              locale.toUpperCase()
                            )
                      }
                      onClick={() => toggleTranslation(msg)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[5px] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.04em] transition-colors",
                        isRevealed
                          ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                          : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
                      )}
                    >
                      <Languages aria-hidden="true" size={11} />
                      <span>
                        {(msg.sourceLocale ?? "??").toUpperCase()} →{" "}
                        {locale.toUpperCase()}
                      </span>
                    </button>
                    {errorId === msg.id ? (
                      <span
                        role="status"
                        className="ml-2 font-mono text-[10.5px] text-[var(--red)]"
                      >
                        {labels.error}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
