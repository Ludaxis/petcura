"use client";

import { useActionState, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles
} from "lucide-react";
import { Badge, Button } from "@petcura/ui";
import {
  createTranslator,
  getRequestCategoryLabel,
  getUrgencyLabel,
  type RequestCategory,
  type RequestUrgency,
  type SupportedLocale
} from "@petcura/shared";
import { submitOwnerIntake, type IntakeFormState } from "./actions";

type IntakeFormProps = {
  categories: Array<{
    value: string;
    label: string;
  }>;
  clinicSlug?: string;
  locale: SupportedLocale;
};

type AiIntake = {
  categorySuggestion: RequestCategory;
  serviceIntent: string;
  routingSuggestion: string;
  urgencySuggestion?: RequestUrgency;
  emergencySignal: boolean;
  riskFlags: string[];
  missingFields: string[];
  clarifyingQuestions: string[];
  handoffSummary: string;
  confidence: number;
  safetyNotes: string[];
};

type EmergencyBanner = {
  title: string;
  body: string;
  phone: string | null;
  url: string | null;
  isAfterHours: boolean;
};

type WebIntakeSuccess = {
  ok: true;
  requestId: string;
  messageId: string | null;
  sessionToken: string;
  aiIntake: AiIntake;
  aiOutputId: string | null;
  emergencyBanner: EmergencyBanner | null;
  clinicOpenState: {
    status: "open" | "closed" | "unknown";
  };
  fallbackReason: string | null;
};

type WebIntakeFailure = {
  ok: false;
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const initialIntakeFormState: IntakeFormState = {
  ok: false
};

function FieldError({
  errors
}: {
  errors: Record<string, string[] | undefined> | undefined;
}) {
  const firstError = Object.values(errors ?? {})[0]?.[0];

  if (!firstError) {
    return null;
  }

  return (
    <p role="alert" className="text-xs text-[var(--red)]">
      {firstError}
    </p>
  );
}

export function IntakeForm({ categories, clinicSlug, locale }: IntakeFormProps) {
  const t = createTranslator(locale);
  const formRef = useRef<HTMLFormElement>(null);
  const startKeyRef = useRef<string>("");
  const [state, formAction, isPending] = useActionState(
    submitOwnerIntake,
    initialIntakeFormState
  );
  const [aiState, setAiState] = useState<WebIntakeSuccess | null>(null);
  const [apiError, setApiError] = useState<WebIntakeFailure | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);

  if (state.ok) {
    return (
      <SuccessState
        body={t("intake.successBody")}
        caseLabel={t("intake.caseId")}
        caseId={state.caseId}
        title={t("intake.successTitle")}
      />
    );
  }

  async function handleAiStart() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;

    setIsOrganizing(true);
    setApiError(null);

    try {
      const formData = new FormData(form);
      if (!startKeyRef.current) {
        startKeyRef.current = makeIdempotencyKey("start");
      }

      const response = await fetch("/api/intake/web/start", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          clinicSlug: formData.get("clinicSlug"),
          ownerName: formData.get("ownerName"),
          phone: formData.get("phone"),
          petName: formData.get("petName"),
          petSpecies: formData.get("petSpecies"),
          category: formData.get("category"),
          message: formData.get("message"),
          preferredLanguage: formData.get("preferredLanguage"),
          consent: formData.get("consent") === "on",
          idempotencyKey: startKeyRef.current
        })
      });
      const json = (await response.json()) as
        | WebIntakeSuccess
        | WebIntakeFailure;

      if (!response.ok || !json.ok) {
        setApiError(json.ok ? null : json);
        return;
      }

      setAiState(json);
    } catch {
      setApiError({
        ok: false,
        code: "network_error",
        message: "network_error"
      });
    } finally {
      setIsOrganizing(false);
    }
  }

  async function handleFollowUp() {
    if (!aiState || followUp.trim().length === 0) return;

    setIsSendingFollowUp(true);
    setApiError(null);

    try {
      const response = await fetch("/api/intake/web/message", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sessionToken: aiState.sessionToken,
          requestId: aiState.requestId,
          message: followUp,
          preferredLanguage: locale,
          idempotencyKey: makeIdempotencyKey("message")
        })
      });
      const json = (await response.json()) as
        | WebIntakeSuccess
        | WebIntakeFailure;

      if (!response.ok || !json.ok) {
        setApiError(json.ok ? null : json);
        return;
      }

      setAiState(json);
      setFollowUp("");
    } catch {
      setApiError({
        ok: false,
        code: "network_error",
        message: "network_error"
      });
    } finally {
      setIsSendingFollowUp(false);
    }
  }

  if (aiState) {
    return (
      <div className="grid gap-4" role="status" aria-live="polite">
        {aiState.emergencyBanner ? (
          <EmergencyNotice
            banner={aiState.emergencyBanner}
            linkLabel={t("intake.emergencyInfoLink")}
          />
        ) : null}

        <SuccessState
          body={t("intake.aiSubmittedBody")}
          caseLabel={t("intake.caseId")}
          caseId={aiState.requestId}
          title={t("intake.aiSubmittedTitle")}
        />

        <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                {t("intake.aiReviewTitle")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {t("intake.aiReviewBody")}
              </p>
            </div>
            <Badge tone={aiState.aiIntake.emergencySignal ? "red" : "teal"}>
              {Math.round(aiState.aiIntake.confidence * 100)}%
            </Badge>
          </div>

          <p className="break-words text-sm leading-6 text-[var(--ink-2)]">
            {aiState.aiIntake.handoffSummary}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="teal">
              {t("intake.route")}:{" "}
              {formatToken(aiState.aiIntake.routingSuggestion)}
            </Badge>
            <Badge tone="neutral">
              {t("intake.serviceIntent")}:{" "}
              {formatToken(aiState.aiIntake.serviceIntent)}
            </Badge>
            <Badge tone="neutral">
              {t("intake.categorySuggestion")}:{" "}
              {getRequestCategoryLabel(
                aiState.aiIntake.categorySuggestion,
                locale
              )}
            </Badge>
            {aiState.aiIntake.urgencySuggestion ? (
              <Badge
                tone={
                  aiState.aiIntake.urgencySuggestion === "high"
                    ? "red"
                    : aiState.aiIntake.urgencySuggestion === "medium"
                      ? "amber"
                      : "neutral"
                }
              >
                {t("intake.urgencySuggestion")}:{" "}
                {getUrgencyLabel(aiState.aiIntake.urgencySuggestion, locale)}
              </Badge>
            ) : null}
          </div>

          {aiState.aiIntake.riskFlags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {aiState.aiIntake.riskFlags.map((flag) => (
                <span
                  key={flag}
                  className="rounded-full bg-[var(--red-soft)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--red)]"
                >
                  {flag}
                </span>
              ))}
            </div>
          ) : null}

          {aiState.aiIntake.clarifyingQuestions.length > 0 ? (
            <div className="mt-4 grid gap-2">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                {t("intake.clarifyingQuestions")}
              </p>
              <ul className="grid gap-1.5 text-sm leading-6 text-[var(--ink-2)]">
                {aiState.aiIntake.clarifyingQuestions.map((question) => (
                  <li key={question}>• {question}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {aiState.fallbackReason ? (
            <p className="mt-3 rounded-[var(--radius)] bg-[var(--amber-soft)] px-3 py-2 text-xs leading-5 text-[var(--amber)]">
              {t("intake.aiFallback")}
            </p>
          ) : null}
        </section>

        <section className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="follow-up">
            {t("intake.followUpLabel")}
          </label>
          <textarea
            className="min-h-24 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-3"
            id="follow-up"
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
            placeholder={t("intake.followUpPlaceholder")}
          />
          <div className="flex justify-end">
            <Button
              disabled={isSendingFollowUp || followUp.trim().length === 0}
              type="button"
              variant="secondary"
              onClick={handleFollowUp}
            >
              {isSendingFollowUp ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={16} />
              ) : (
                <MessageSquarePlus aria-hidden="true" size={16} />
              )}
              {isSendingFollowUp
                ? t("intake.followUpSending")
                : t("intake.followUpSend")}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <input name="preferredLanguage" type="hidden" value={locale} />
      <input name="clinicSlug" type="hidden" value={clinicSlug ?? ""} />

      {apiError || (state.message && state.message !== "validation_error") ? (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-[var(--red-soft)] bg-[var(--red-soft)] p-3 text-sm leading-6 text-[var(--red)]"
        >
          {t("intake.error")}
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="owner-name">
          {t("intake.ownerName")}
        </label>
        <input
          className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3"
          id="owner-name"
          name="ownerName"
          placeholder="Marta Tamm"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="phone">
          {t("intake.phone")}
        </label>
        <input
          className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3"
          id="phone"
          name="phone"
          placeholder="+372 ..."
          required
          type="tel"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="pet-name">
            {t("intake.petName")}
          </label>
          <input
            className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3"
            id="pet-name"
            name="petName"
            placeholder="Luna"
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="pet-species">
            {t("intake.petSpecies")}
          </label>
          <input
            className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3"
            id="pet-species"
            name="petSpecies"
            placeholder={t("intake.petSpeciesPlaceholder")}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="category">
          {t("intake.category")}
        </label>
        <select
          className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3"
          defaultValue="medical_question"
          id="category"
          name="category"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="message">
          {t("intake.message")}
        </label>
        <textarea
          className="min-h-36 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-3"
          id="message"
          name="message"
          placeholder={t("intake.messagePlaceholder")}
          required
          minLength={10}
        />
      </div>

      <label className="flex items-start gap-2 rounded-[var(--radius)] bg-[var(--surface-soft)] p-3 text-xs leading-5 text-[var(--muted)]">
        <input
          className="mt-1"
          name="consent"
          required
          type="checkbox"
        />
        <span>{t("intake.consent")}</span>
      </label>

      <FieldError errors={apiError?.fieldErrors ?? state.fieldErrors} />

      <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
        <Button disabled={isPending || isOrganizing} type="submit" variant="secondary">
          <Send aria-hidden="true" size={16} />
          {isPending ? t("intake.submitting") : t("intake.manualSubmit")}
        </Button>
        <Button
          disabled={isPending || isOrganizing}
          type="button"
          onClick={handleAiStart}
        >
          {isOrganizing ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={16} />
          ) : (
            <Sparkles aria-hidden="true" size={16} />
          )}
          {isOrganizing ? t("intake.aiOrganizing") : t("intake.aiOrganize")}
        </Button>
      </div>
    </form>
  );
}

function SuccessState({
  title,
  body,
  caseLabel,
  caseId
}: {
  title: string;
  body: string;
  caseLabel: string;
  caseId?: string | null | undefined;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-4"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 text-[var(--primary)]"
          size={20}
        />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{body}</p>
          {caseId ? (
            <div className="mt-3">
              <Badge tone="teal">
                {caseLabel}: {caseId.slice(0, 8)}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmergencyNotice({
  banner,
  linkLabel
}: {
  banner: EmergencyBanner;
  linkLabel: string;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--red-soft)] bg-[var(--red-soft)] p-4 text-[var(--red)]">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
        <div>
          <h2 className="font-semibold">{banner.title}</h2>
          <p className="mt-1 text-sm leading-6">{banner.body}</p>
          {banner.phone || banner.url ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {banner.phone ? (
                <a
                  className="inline-flex h-9 items-center rounded-[var(--radius)] bg-[var(--paper)] px-3 text-sm font-semibold text-[var(--red)]"
                  href={`tel:${banner.phone}`}
                >
                  {banner.phone}
                </a>
              ) : null}
              {banner.url ? (
                <a
                  className="inline-flex h-9 items-center rounded-[var(--radius)] bg-[var(--paper)] px-3 text-sm font-semibold text-[var(--red)]"
                  href={banner.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {linkLabel}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function makeIdempotencyKey(prefix: string) {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function formatToken(value: string) {
  return value.replaceAll("_", " ");
}
