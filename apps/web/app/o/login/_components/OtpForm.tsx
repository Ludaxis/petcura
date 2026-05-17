"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  GoogleLogo
} from "@phosphor-icons/react";
import { Button, cn } from "@petcura/ui";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import type { SupportedLocale } from "@petcura/shared";
import { requestOwnerOtp, startOwnerOAuth, verifyOwnerOtp } from "../actions";
import { OTP_CELL_COUNT, OtpCellsInput } from "./OtpCellsInput";

type Props = {
  initialError?: string | null;
  locale: SupportedLocale;
  nextPath: string;
  /** Optional phone prefill (e.g. from `/o/login?phone=…` after invite-expired). */
  initialPhone?: string | undefined;
};

type Step = "phone" | "otp";
type Channel = "whatsapp" | "sms";

type ActionError =
  | "invalid_phone"
  | "invalid_code"
  | "not_found"
  | "otp_unavailable"
  | "login_error";

const phoneRegex = /^\+?[0-9 ()-]{6,}$/;

// Initial cooldown 45s, then 60/90/120 — capped at 120 (Twilio Verify defaults).
const COOLDOWN_SCHEDULE = [45, 60, 90, 120];
const OTP_LABEL_ID = "otp-step-heading";
const OTP_HELPER_ID = "otp-step-helper";

function nextCooldown(attempt: number): number {
  return COOLDOWN_SCHEDULE[Math.min(attempt, COOLDOWN_SCHEDULE.length - 1)]!;
}

function formatCooldown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft - m * 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function eventEpochMs(e: { timeStamp: number }): number {
  return performance.timeOrigin + e.timeStamp;
}

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

function OAuthButton({
  children,
  icon,
  locale,
  nextPath,
  provider
}: {
  children: string;
  icon: React.ReactNode;
  locale: SupportedLocale;
  nextPath: string;
  provider: "google";
}) {
  return (
    <form action={startOwnerOAuth}>
      <input name="lang" type="hidden" value={locale} />
      <input name="next" type="hidden" value={nextPath} />
      <input name="provider" type="hidden" value={provider} />
      <Button className="w-full" type="submit" variant="secondary">
        {icon}
        {children}
      </Button>
    </form>
  );
}

export function OtpForm({
  initialError,
  locale,
  nextPath,
  initialPhone
}: Props) {
  const t = createOwnerTranslator(locale);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, setPending] = useState(false);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [otpCellState, setOtpCellState] = useState<
    "idle" | "error" | "success"
  >("idle");
  const [resendAttempt, setResendAttempt] = useState(0);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const otpLabelId = OTP_LABEL_ID;
  const otpHelperId = OTP_HELPER_ID;

  // Tick once per second for the cooldown countdown when active.
  useEffect(() => {
    if (cooldownEndsAt === null) return;
    const handle = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, [cooldownEndsAt]);

  const cooldownSecondsLeft = useMemo(() => {
    if (cooldownEndsAt === null) return 0;
    return Math.max(0, Math.ceil((cooldownEndsAt - nowTs) / 1000));
  }, [cooldownEndsAt, nowTs]);

  function startCooldown(attempt: number, startedAt: number) {
    const seconds = nextCooldown(attempt);
    setCooldownEndsAt(startedAt + seconds * 1000);
  }

  async function onSubmitPhone(e: FormEvent) {
    e.preventDefault();
    const submittedAt = eventEpochMs(e);
    setError(null);
    if (!phoneRegex.test(phone)) {
      setError(t("login.error.invalidPhone"));
      return;
    }
    setPending(true);
    try {
      const result = await requestOwnerOtp(phone);
      if (!result.ok) {
        setError(getErrorMessage(t, result.error));
        return;
      }
      setStep("otp");
      setResendAttempt(0);
      startCooldown(0, submittedAt);
    } catch {
      setError(t("login.error.loginError"));
    } finally {
      setPending(false);
    }
  }

  async function onSubmitOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== OTP_CELL_COUNT) {
      setError(t("login.error.invalidCode"));
      return;
    }
    setPending(true);
    try {
      const result = await verifyOwnerOtp(phone, code, nextPath);
      if (!result.ok) {
        setError(getErrorMessage(t, result.error));
        setOtpCellState("error");
        window.setTimeout(() => setOtpCellState("idle"), 400);
        return;
      }
      setOtpCellState("success");
      window.location.assign(result.redirectTo ?? nextPath);
    } catch {
      setError(t("login.error.loginError"));
    } finally {
      setPending(false);
    }
  }

  async function onResend(e: MouseEvent<HTMLButtonElement>) {
    const requestedAt = eventEpochMs(e);
    if (cooldownSecondsLeft > 0) return;
    setError(null);
    setPending(true);
    try {
      const result = await requestOwnerOtp(phone);
      if (!result.ok) {
        setError(getErrorMessage(t, result.error));
        return;
      }
      setResendAttempt((a) => {
        const next = a + 1;
        startCooldown(next, requestedAt);
        return next;
      });
    } catch {
      setError(t("login.error.loginError"));
    } finally {
      setPending(false);
    }
  }

  async function onSwitchChannel(e: MouseEvent<HTMLButtonElement>) {
    const requestedAt = eventEpochMs(e);
    if (cooldownSecondsLeft > 0) return;
    const newChannel: Channel =
      channel === "whatsapp" ? "sms" : "whatsapp";
    setChannel(newChannel);
    setError(null);
    setPending(true);
    try {
      const result = await requestOwnerOtp(phone);
      if (!result.ok) {
        setError(getErrorMessage(t, result.error));
        return;
      }
      setResendAttempt(0);
      startCooldown(0, requestedAt);
    } catch {
      setError(t("login.error.loginError"));
    } finally {
      setPending(false);
    }
  }

  if (step === "otp") {
    const otpSubtitle =
      channel === "whatsapp"
        ? t("login.otp.subtitleWhatsApp", { phone })
        : t("login.otp.subtitleSms", { phone });
    const alternateChannelLabel =
      channel === "whatsapp"
        ? t("login.otp.tryChannel.sms")
        : t("login.otp.tryChannel.whatsapp");
    return (
      <form onSubmit={onSubmitOtp} className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError(null);
            setCooldownEndsAt(null);
          }}
          className={cn(
            "inline-flex items-center gap-1 self-start text-sm text-[var(--muted)]",
            "hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          )}
        >
          <ArrowLeft size={14} weight="bold" aria-hidden />
          {t("login.otp.back")}
        </button>
        <div>
          <h1
            id={otpLabelId}
            className="text-2xl font-semibold text-[var(--ink)]"
          >
            {t("login.otp.title")}
          </h1>
          <p
            id={otpHelperId}
            className="mt-1 text-sm leading-6 text-[var(--muted)]"
          >
            {otpSubtitle}
          </p>
        </div>
        <OtpCellsInput
          value={code}
          onChange={setCode}
          disabled={pending}
          errored={otpCellState === "error"}
          succeeded={otpCellState === "success"}
          cellLabelTemplate={t("login.otp.cellLabel")}
          helperTextId={otpHelperId}
          labelledBy={otpLabelId}
        />
        {error ? (
          <p role="alert" aria-live="assertive" className="text-sm text-[var(--red)]">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending || code.length !== OTP_CELL_COUNT}
          aria-disabled={code.length !== OTP_CELL_COUNT ? "true" : undefined}
          className="h-11 w-full"
        >
          {t("login.otp.verify")}
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Button>
        <div className="flex flex-col items-center gap-1 text-sm">
          {cooldownSecondsLeft > 0 ? (
            <p className="text-[var(--muted)]" aria-live="polite">
              {t("login.otp.resendIn", {
                time: formatCooldown(cooldownSecondsLeft)
              })}
            </p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={pending}
              className={cn(
                "text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              )}
            >
              {t("login.otp.resendNow")}
            </button>
          )}
          <button
            type="button"
            onClick={onSwitchChannel}
            disabled={pending || cooldownSecondsLeft > 0}
            className={cn(
              "text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline disabled:opacity-50",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            )}
          >
            {alternateChannelLabel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmitPhone} className="flex flex-col gap-5">
        <div>
          <h1
            id="auth-heading"
            className="text-2xl font-semibold text-[var(--ink)]"
          >
            {t("login.title")}
          </h1>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {t("login.subtitle")}
          </p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">
            {t("login.phone.label")}
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("login.phone.placeholder")}
            className={cn(
              "h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-base text-[var(--ink)]",
              "focus-visible:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            )}
          />
        </label>
        {error ? (
          <p role="alert" aria-live="assertive" className="text-sm text-[var(--red)]">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          {t("login.phone.continue")}
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Button>
      </form>
      <div className="grid gap-3">
        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--line)]" />
          {t("login.oauth.separator")}
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <OAuthButton
          icon={<GoogleLogo size={17} weight="bold" aria-hidden />}
          locale={locale}
          nextPath={nextPath}
          provider="google"
        >
          {t("login.oauth.google")}
        </OAuthButton>
      </div>
      <p className="text-center text-xs text-[var(--muted)]">{t("login.help")}</p>
    </div>
  );
}
