"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button, cn } from "@petcura/ui";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import type { SupportedLocale } from "@petcura/shared";
import { requestOwnerOtp, verifyOwnerOtp } from "../actions";

type Props = { locale: SupportedLocale };

type Step = "phone" | "otp";
type ActionError =
  | "invalid_phone"
  | "invalid_code"
  | "not_found"
  | "otp_unavailable"
  | "login_error";

const phoneRegex = /^\+?[0-9 ()-]{6,}$/;

function getErrorMessage(
  t: ReturnType<typeof createOwnerTranslator>,
  error: ActionError
) {
  if (error === "invalid_phone") return t("login.error.invalidPhone");
  if (error === "invalid_code") return t("login.error.invalidCode");
  if (error === "not_found") return t("login.error.notFound");
  if (error === "otp_unavailable") return t("login.error.otpUnavailable");
  return t("login.error.loginError");
}

export function OtpForm({ locale }: Props) {
  const t = createOwnerTranslator(locale);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmitPhone(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phoneRegex.test(phone)) {
      setError(t("login.error.invalidPhone"));
      return;
    }
    setPending(true);
    const result = await requestOwnerOtp(phone);
    setPending(false);
    if (!result.ok) {
      setError(getErrorMessage(t, result.error));
      return;
    }
    setStep("otp");
  }

  async function onSubmitOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError(t("login.error.invalidCode"));
      return;
    }
    setPending(true);
    const result = await verifyOwnerOtp(phone, code);
    setPending(false);
    if (!result.ok) {
      setError(getErrorMessage(t, result.error));
    }
  }

  async function onResend() {
    setError(null);
    setPending(true);
    const result = await requestOwnerOtp(phone);
    setPending(false);
    if (!result.ok) {
      setError(getErrorMessage(t, result.error));
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={onSubmitOtp} className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError(null);
          }}
          className={cn(
            "inline-flex items-center gap-1 self-start text-sm text-[var(--muted)]",
            "hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          )}
        >
          <ArrowLeft size={14} weight="bold" aria-hidden />
          {t("login.otp.back")}
        </button>
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">{t("login.otp.title")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("login.otp.subtitle", { phone })}</p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="sr-only">{t("login.otp.title")}</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="000000"
            className={cn(
              "h-14 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 text-center font-mono text-2xl tracking-[0.4em] text-[var(--ink)]",
              "focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            )}
          />
        </label>
        {error ? <p role="alert" className="text-sm text-[var(--red)]">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {t("login.otp.verify")}
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Button>
        <button
          type="button"
          onClick={onResend}
          disabled={pending}
          className={cn(
            "self-center text-sm text-[var(--muted)] underline-offset-4",
            "hover:text-[var(--ink)] hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          )}
        >
          {t("login.otp.resend")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitPhone} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--ink)]">{t("login.title")}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("login.subtitle")}</p>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--ink)]">{t("login.phone.label")}</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("login.phone.placeholder")}
          className={cn(
            "h-12 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 text-base text-[var(--ink)]",
            "focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          )}
        />
      </label>
      {error ? <p role="alert" className="text-sm text-[var(--red)]">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {t("login.phone.continue")}
        <ArrowRight size={16} weight="bold" aria-hidden />
      </Button>
      <p className="text-center text-xs text-[var(--muted)]">{t("login.help")}</p>
    </form>
  );
}
