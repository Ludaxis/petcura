"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, Send } from "lucide-react";
import { Button } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import type { MarketingLeadSource } from "@petcura/validation";
import { submitDemoLead, type DemoLeadFormState } from "./actions";
import { trackMarketingEvent } from "../_lib/marketing-analytics";

type DemoLeadFormProps = {
  copy: {
    clinicName: string;
    contactName: string;
    workEmail: string;
    country: string;
    pmsSystem: string;
    monthlyRequestVolume: string;
    volumePlaceholder: string;
    volumeUnder100: string;
    volume100300: string;
    volume300800: string;
    volume800Plus: string;
    volumeUnknown: string;
    message: string;
    messagePlaceholder: string;
    consent: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    fallbackTitle: string;
    fallbackBody: string;
    fallbackCta: string;
    requiredError: string;
  };
  locale: SupportedLocale;
  source: MarketingLeadSource;
};

const initialState: DemoLeadFormState = {
  ok: false
};

export function DemoLeadForm({ copy, locale, source }: DemoLeadFormProps) {
  const [state, action, pending] = useActionState(
    submitDemoLead,
    initialState
  );
  const [started, setStarted] = useState(false);
  const previousMessage = useRef<DemoLeadFormState["message"] | undefined>(
    undefined
  );

  useEffect(() => {
    if (!state.message || previousMessage.current === state.message) return;
    previousMessage.current = state.message;
    if (state.message === "submitted") {
      trackMarketingEvent("demo_form_submitted", {
        locale,
        route: "/demo",
        source,
        outcome: "success"
      });
      return;
    }
    if (state.message === "fallback") {
      trackMarketingEvent("demo_form_failed", {
        locale,
        route: "/demo",
        source,
        outcome: "fallback"
      });
      return;
    }
    if (state.message === "validation_error") {
      trackMarketingEvent("demo_form_failed", {
        locale,
        route: "/demo",
        source,
        outcome: "validation_error"
      });
      return;
    }
    if (state.message === "spam_blocked") {
      trackMarketingEvent("demo_form_failed", {
        locale,
        route: "/demo",
        source,
        outcome: "spam_blocked"
      });
    }
  }, [locale, source, state.message]);

  const volumeOptions = useMemo(
    () => [
      { value: "", label: copy.volumePlaceholder },
      { value: "under_100", label: copy.volumeUnder100 },
      { value: "100_300", label: copy.volume100300 },
      { value: "300_800", label: copy.volume300800 },
      { value: "800_plus", label: copy.volume800Plus },
      { value: "unknown", label: copy.volumeUnknown }
    ],
    [copy]
  );

  const handleStarted = () => {
    if (started) return;
    setStarted(true);
    trackMarketingEvent("demo_form_started", {
      locale,
      route: "/demo",
      source
    });
  };

  if (state.ok && !state.blocked) {
    return (
      <div
        aria-live="polite"
        className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_48px_-34px_rgba(41,38,27,0.38)]"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
            <CheckCircle2 aria-hidden="true" size={18} />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {state.stored === false ? copy.fallbackTitle : copy.successTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {state.stored === false ? copy.fallbackBody : copy.successBody}
            </p>
            {state.mailtoHref ? (
              <Button asChild className="mt-5">
                <a href={state.mailtoHref}>
                  <Mail aria-hidden="true" size={16} />
                  {copy.fallbackCta}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_18px_48px_-34px_rgba(41,38,27,0.38)] sm:p-6"
      noValidate
      onFocusCapture={handleStarted}
    >
      <input name="source" type="hidden" value={source} />
      <input name="locale" type="hidden" value={locale} />
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input
          autoComplete="off"
          id="website"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          error={state.fieldErrors?.clinicName?.[0]}
          label={copy.clinicName}
          name="clinicName"
          requiredError={copy.requiredError}
        />
        <Field
          error={state.fieldErrors?.contactName?.[0]}
          label={copy.contactName}
          name="contactName"
          requiredError={copy.requiredError}
        />
        <Field
          error={state.fieldErrors?.workEmail?.[0]}
          inputMode="email"
          label={copy.workEmail}
          name="workEmail"
          requiredError={copy.requiredError}
          type="email"
        />
        <Field
          error={state.fieldErrors?.country?.[0]}
          label={copy.country}
          name="country"
          requiredError={copy.requiredError}
        />
        <Field label={copy.pmsSystem} name="pmsSystem" required={false} />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--foreground)]">
          {copy.monthlyRequestVolume}
          <select
            className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal text-[var(--foreground)] outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-soft)]"
            name="monthlyRequestVolume"
          >
            {volumeOptions.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-[var(--foreground)]">
        {copy.message}
        <textarea
          className="min-h-28 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-normal leading-6 text-[var(--foreground)] outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-soft)]"
          maxLength={1000}
          name="message"
          placeholder={copy.messagePlaceholder}
        />
      </label>

      <label className="mt-5 flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--foreground)]">
        <input
          aria-describedby={
            state.fieldErrors?.consentGiven?.[0] ? "consent-error" : undefined
          }
          className="mt-1 h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)]"
          name="consentGiven"
          type="checkbox"
        />
        <span>{copy.consent}</span>
      </label>
      {state.fieldErrors?.consentGiven?.[0] ? (
        <p className="mt-2 text-xs font-medium text-[var(--red)]" id="consent-error">
          {copy.requiredError}
        </p>
      ) : null}

      <Button className="mt-5 w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? copy.submitting : copy.submit}
        {pending ? (
          <Send aria-hidden="true" size={16} />
        ) : (
          <ArrowRight aria-hidden="true" size={16} />
        )}
      </Button>
    </form>
  );
}

type FieldProps = {
  error?: string | undefined;
  inputMode?: "email" | undefined;
  label: string;
  name: string;
  required?: boolean;
  requiredError?: string | undefined;
  type?: string | undefined;
};

function Field({
  error,
  inputMode,
  label,
  name,
  required = true,
  requiredError,
  type = "text"
}: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--foreground)]">
      {label}
      <input
        aria-describedby={error ? errorId : undefined}
        className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal text-[var(--foreground)] outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-soft)]"
        inputMode={inputMode}
        name={name}
        required={required}
        type={type}
      />
      {error ? (
        <span className="text-xs font-medium text-[var(--red)]" id={errorId}>
          {requiredError ?? error}
        </span>
      ) : null}
    </label>
  );
}
