"use client";

import { useCallback, useState } from "react";
import { Languages } from "lucide-react";
import { cn } from "@petcura/ui";
import {
  getSenderLabel,
  type SupportedLocale
} from "@petcura/shared";
import { logTranslationRevealed } from "../actions";

export type ThreadMessage = {
  id: string;
  senderType: "owner" | "staff" | "system" | "ai";
  body: string;
  bodyTranslated: string | null;
  sourceLocale: string | null;
  createdAt: string;
};

type ThreadProps = {
  requestId: string;
  messages: ThreadMessage[];
  locale: SupportedLocale;
  labels: {
    region: string;
    /** Template "Show in {locale}" — client substitutes {locale}. */
    showTranslation: string;
    hideTranslation: string;
    error: string;
    system: string;
  };
};

export function Thread({
  requestId,
  messages,
  locale,
  labels
}: ThreadProps) {
  const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  const formatTime = (iso: string) => timeFormatter.format(new Date(iso));
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [errorId, setErrorId] = useState<string | null>(null);

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
                aria-label={`${senderLabel} · ${formatTime(msg.createdAt)}${
                  msg.sourceLocale ? ` · ${msg.sourceLocale.toUpperCase()}` : ""
                }`}
                className={cn(
                  "max-w-[480px] rounded-[10px] border px-3 py-2 text-[13.5px] leading-[1.5] text-[var(--ink)]",
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
