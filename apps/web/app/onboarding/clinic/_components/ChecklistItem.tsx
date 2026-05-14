"use client";

import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { Button, cn } from "@petcura/ui";
import type { ClinicOwnerStep } from "@/lib/auth/onboarding-progress";

export type ChecklistItemStatus = "todo" | "done" | "skipped";

export type ChecklistItemProps = {
  step: ClinicOwnerStep;
  index: number;
  status: ChecklistItemStatus;
  title: string;
  subtext: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryLabel: string;
  doneLabel: string;
  editLabel: string;
  markDoneLabel: string;
  statusTodoLabel: string;
  statusDoneLabel: string;
  statusSkippedLabel: string;
  /** Server action invoked to update step status. */
  onSecondary: () => void;
  onMarkDone: () => void;
};

export function ChecklistItem({
  step,
  index,
  status,
  title,
  subtext,
  primaryHref,
  primaryLabel,
  secondaryLabel,
  doneLabel,
  editLabel,
  markDoneLabel,
  statusTodoLabel,
  statusDoneLabel,
  statusSkippedLabel,
  onSecondary,
  onMarkDone
}: ChecklistItemProps) {
  void doneLabel;
  const isDone = status === "done";
  const isSkipped = status === "skipped";
  const statusLabel = isDone
    ? statusDoneLabel
    : isSkipped
    ? statusSkippedLabel
    : statusTodoLabel;

  return (
    <li
      data-step={step}
      style={{ ["--pc-stagger-index" as string]: index - 1 }}
      className={cn(
        "pc-checklist-item flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4",
        "sm:p-5",
        isDone && "bg-[var(--surface-soft)]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* numeric / check circle */}
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            isDone
              ? "bg-[var(--primary)] text-[var(--paper)]"
              : "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
          )}
        >
          {isDone ? (
            <svg
              className="pc-check-in-circle"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                className="pc-check-in-path"
                d="M5 12.5l4 4 10-10"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            index
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2
              className={cn(
                "text-base font-semibold leading-snug",
                isDone ? "text-[var(--muted)]" : "text-[var(--ink)]"
              )}
            >
              {title}
            </h2>
            <span
              role="img"
              aria-label={statusLabel}
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isDone && "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
                isSkipped && "bg-[var(--soft)] text-[var(--muted)]",
                !isDone && !isSkipped && "bg-[var(--soft)] text-[var(--muted)]"
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{subtext}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {isDone ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={primaryHref}>{editLabel}</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="primary" size="md">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight size={14} weight="bold" aria-hidden />
              </Link>
            </Button>
            {isSkipped ? (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onMarkDone}
              >
                <Check size={14} weight="bold" aria-hidden />
                {markDoneLabel}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onSecondary}
              >
                {secondaryLabel}
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
