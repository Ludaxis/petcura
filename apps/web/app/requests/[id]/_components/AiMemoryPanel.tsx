"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain, Check, RefreshCw, Sparkles, X } from "lucide-react";
import { Button, Spinner, cn } from "@petcura/ui";

export type AiMemoryFormAction = (
  formData: FormData
) => unknown | Promise<unknown>;

export type AiMemoryHiddenFields = Record<
  string,
  string | number | boolean | null
>;

export type AiMemoryPill = {
  id: string;
  label: string;
  tone?: "neutral" | "teal" | "amber" | "red";
};

export type AiMemoryContextItem = {
  id: string;
  title: string;
  body?: string | null;
  pills?: AiMemoryPill[];
  meta?: string[];
};

export type AiMemoryCandidate = {
  id: string;
  title: string;
  body: string;
  reason?: string | null;
  status?: "pending" | "approved" | "dismissed";
  statusLabel?: string | null;
  pills?: AiMemoryPill[];
  meta?: string[];
  hiddenFields?: AiMemoryHiddenFields;
};

export type AiMemoryDraftControl = {
  action?: AiMemoryFormAction;
  mode?: "generate" | "regenerate";
  disabled?: boolean;
  statusLabel?: string | null;
  disabledReason?: string | null;
  hiddenFields?: AiMemoryHiddenFields;
};

export type AiMemoryPanelLabels = {
  region: string;
  title: string;
  draftControls: string;
  generate: string;
  regenerate: string;
  generating: string;
  contextHeading: string;
  contextEmpty: string;
  candidatesHeading: string;
  candidatesEmpty: string;
  candidateReason: string;
  editCandidate: string;
  approveCandidate: string;
  dismissCandidate: string;
  approveCandidateAria: string;
  dismissCandidateAria: string;
  draftQueued?: string;
  candidateUpdated?: string;
};

export type AiMemoryPanelProps = {
  requestId: string;
  locale: string;
  hasDraft: boolean;
  labels: AiMemoryPanelLabels;
  contextItems?: AiMemoryContextItem[];
  memoryCandidates?: AiMemoryCandidate[];
  draftControl?: AiMemoryDraftControl;
  candidateAction?: AiMemoryFormAction;
  candidateActionHiddenFields?: AiMemoryHiddenFields;
  onAnnounce?: (message: string) => void;
};

const pillTones: Record<NonNullable<AiMemoryPill["tone"]>, string> = {
  neutral: "bg-[var(--soft)] text-[var(--muted)]",
  teal: "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]"
};

function titleTemplate(template: string, title: string) {
  return template.replace("{title}", title);
}

function hiddenInputs(fields: AiMemoryHiddenFields | undefined, prefix: string) {
  if (!fields) return null;

  return Object.entries(fields)
    .filter(([, value]) => value !== null)
    .map(([name, value]) => (
      <input
        key={`${prefix}-${name}`}
        type="hidden"
        name={name}
        value={String(value)}
      />
    ));
}

function MemoryPills({ pills }: { pills: AiMemoryPill[] | undefined }) {
  if (!pills || pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill) => (
        <span
          key={pill.id}
          className={cn(
            "inline-flex min-h-5 items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.04em]",
            pillTones[pill.tone ?? "neutral"]
          )}
        >
          {pill.label}
        </span>
      ))}
    </div>
  );
}

function MemoryMeta({ meta }: { meta: string[] | undefined }) {
  if (!meta || meta.length === 0) return null;

  return (
    <ul className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
      {meta.map((item, index) => (
        <li key={`${item}-${index}`} className="min-w-0 truncate">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AiMemoryPanel({
  requestId,
  locale,
  hasDraft,
  labels,
  contextItems,
  memoryCandidates,
  draftControl,
  candidateAction,
  candidateActionHiddenFields,
  onAnnounce
}: AiMemoryPanelProps) {
  const contextId = useId();
  const candidatesId = useId();
  const [activeCandidateAction, setActiveCandidateAction] = useState<
    string | null
  >(null);
  const router = useRouter();
  const [draftPending, startDraftTransition] = useTransition();
  const [candidatePending, startCandidateTransition] = useTransition();

  const context = contextItems ?? [];
  const candidates = memoryCandidates ?? [];
  const showContext = contextItems !== undefined;
  const showCandidates = memoryCandidates !== undefined;
  const shouldRender = Boolean(draftControl) || showContext || showCandidates;

  if (!shouldRender) return null;

  const draftMode = draftControl?.mode ?? (hasDraft ? "regenerate" : "generate");
  const draftLabel =
    draftMode === "regenerate" ? labels.regenerate : labels.generate;
  const draftDisabled =
    draftPending || Boolean(draftControl?.disabled) || !draftControl?.action;
  const sectionBusy = draftPending || candidatePending;

  const submitDraftAction = (formData: FormData) => {
    if (!draftControl?.action) return;
    startDraftTransition(async () => {
      await draftControl.action?.(formData);
      router.refresh();
      if (labels.draftQueued) onAnnounce?.(labels.draftQueued);
    });
  };

  const submitCandidateAction = (formData: FormData) => {
    if (!candidateAction) return;
    const candidateId = formData.get("candidateId");
    const intent = formData.get("intent");
    const activeKey =
      typeof candidateId === "string" && typeof intent === "string"
        ? `${candidateId}:${intent}`
        : null;
    setActiveCandidateAction(activeKey);
    startCandidateTransition(async () => {
      try {
        await candidateAction(formData);
        router.refresh();
        if (labels.candidateUpdated) onAnnounce?.(labels.candidateUpdated);
      } finally {
        setActiveCandidateAction(null);
      }
    });
  };

  return (
    <section
      role="region"
      aria-label={labels.region}
      aria-busy={sectionBusy}
      data-ai-memory-panel
      data-locale={locale}
      className="mx-4 mt-3 shrink-0 rounded-[var(--radius-pill)] border border-[var(--line)] bg-[var(--paper)] px-3.5 py-3 sm:mx-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Brain
              aria-hidden="true"
              size={14}
              className="text-[var(--primary)]"
            />
            <h2
              className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]"
            >
              {labels.title}
            </h2>
          </div>
          {draftControl?.statusLabel ? (
            <p className="mt-1 text-[11.5px] leading-5 text-[var(--muted)]">
              {draftControl.statusLabel}
            </p>
          ) : null}
        </div>

        {draftControl ? (
          <form
            action={submitDraftAction}
            aria-label={labels.draftControls}
            className="flex min-w-0 flex-wrap items-center justify-end gap-2"
            data-ai-draft-generation
          >
            <input name="requestId" type="hidden" value={requestId} />
            <input name="mode" type="hidden" value={draftMode} />
            {hiddenInputs(draftControl.hiddenFields, "draft-control")}
            <Button
              type="submit"
              size="sm"
              variant={draftMode === "regenerate" ? "secondary" : "primary"}
              disabled={draftDisabled}
              aria-disabled={draftDisabled}
              data-ai-draft-generate={draftMode}
            >
              {draftPending ? (
                <Spinner size={12} label={labels.generating} tone="current" />
              ) : draftMode === "regenerate" ? (
                <RefreshCw aria-hidden="true" size={12} />
              ) : (
                <Sparkles aria-hidden="true" size={12} />
              )}
              {draftPending ? labels.generating : draftLabel}
            </Button>
            {draftControl.disabledReason ? (
              <p className="basis-full text-right text-[11.5px] leading-5 text-[var(--muted)]">
                {draftControl.disabledReason}
              </p>
            ) : null}
          </form>
        ) : null}
      </header>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {showContext ? (
          <section
            aria-labelledby={contextId}
            data-ai-memory-context
            className="min-w-0"
          >
            <h3
              id={contextId}
              className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-2)]"
            >
              {labels.contextHeading}
            </h3>
            {context.length > 0 ? (
              <ul className="mt-2 flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
                {context.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--soft)] p-2"
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-words text-[12.5px] font-semibold leading-5 text-[var(--ink)]">
                        {item.title}
                      </p>
                      <MemoryPills pills={item.pills} />
                    </div>
                    {item.body ? (
                      <p className="mt-1 break-words text-[12px] leading-5 text-[var(--ink-2)]">
                        {item.body}
                      </p>
                    ) : null}
                    <MemoryMeta meta={item.meta} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--muted)]">
                {labels.contextEmpty}
              </p>
            )}
          </section>
        ) : null}

        {showCandidates ? (
          <section
            aria-labelledby={candidatesId}
            data-ai-memory-candidates
            className="min-w-0"
          >
            <h3
              id={candidatesId}
              className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-2)]"
            >
              {labels.candidatesHeading}
            </h3>
            {candidates.length > 0 ? (
              <ul className="mt-2 flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
                {candidates.map((candidate) => {
                  const canAct =
                    candidateAction &&
                    (!candidate.status || candidate.status === "pending");
                  const dismissKey = `${candidate.id}:dismiss`;
                  const approveKey = `${candidate.id}:approve`;
                  return (
                    <li
                      key={candidate.id}
                      className="rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--soft)] p-2"
                    >
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="break-words text-[12.5px] font-semibold leading-5 text-[var(--ink)]">
                            {candidate.title}
                          </p>
                          {candidate.statusLabel ? (
                            <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
                              {candidate.statusLabel}
                            </p>
                          ) : null}
                        </div>
                        <MemoryPills pills={candidate.pills} />
                      </div>
                      <p className="mt-1 break-words text-[12px] leading-5 text-[var(--ink-2)]">
                        {candidate.body}
                      </p>
                      {candidate.reason ? (
                        <p className="mt-1 break-words text-[11.5px] leading-5 text-[var(--muted)]">
                          <span className="font-medium text-[var(--ink-2)]">
                            {labels.candidateReason}
                          </span>{" "}
                          {candidate.reason}
                        </p>
                      ) : null}
                      <MemoryMeta meta={candidate.meta} />
                      {canAct ? (
                        <form
                          action={submitCandidateAction}
                          className="mt-2 flex flex-wrap justify-end gap-1.5"
                          data-ai-memory-candidate-action={candidate.id}
                        >
                          <input
                            name="requestId"
                            type="hidden"
                            value={requestId}
                          />
                          <input
                            name="candidateId"
                            type="hidden"
                            value={candidate.id}
                          />
                          {hiddenInputs(
                            candidateActionHiddenFields,
                            `candidate-panel-${candidate.id}`
                          )}
                          {hiddenInputs(
                            candidate.hiddenFields,
                            `candidate-${candidate.id}`
                          )}
                          <label className="sr-only" htmlFor={`memory-edit-${candidate.id}`}>
                            {labels.editCandidate}
                          </label>
                          <textarea
                            id={`memory-edit-${candidate.id}`}
                            name="contentText"
                            defaultValue={candidate.body}
                            rows={2}
                            maxLength={700}
                            className="basis-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-2 text-[12px] leading-5 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            name="intent"
                            value="dismiss"
                            disabled={candidatePending}
                            aria-label={titleTemplate(
                              labels.dismissCandidateAria,
                              candidate.title
                            )}
                          >
                            {activeCandidateAction === dismissKey ? (
                              <Spinner
                                size={12}
                                label={labels.dismissCandidate}
                                tone="current"
                              />
                            ) : (
                              <X aria-hidden="true" size={12} />
                            )}
                            {labels.dismissCandidate}
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            name="intent"
                            value="approve"
                            disabled={candidatePending}
                            aria-label={titleTemplate(
                              labels.approveCandidateAria,
                              candidate.title
                            )}
                          >
                            {activeCandidateAction === approveKey ? (
                              <Spinner
                                size={12}
                                label={labels.approveCandidate}
                                tone="current"
                              />
                            ) : (
                              <Check aria-hidden="true" size={12} />
                            )}
                            {labels.approveCandidate}
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--muted)]">
                {labels.candidatesEmpty}
              </p>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
