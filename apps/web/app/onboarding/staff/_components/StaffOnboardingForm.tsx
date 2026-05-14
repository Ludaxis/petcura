"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button, cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { completeStaffOnboarding } from "../actions";

type StaffOnboardingFormProps = {
  locale: SupportedLocale;
  initialName: string;
  roleLabel: string;
  adminName: string;
  copy: {
    stepN: (n: number) => string;
    headingWelcome: string;
    bodyWelcome: string;
    nameLabel: string;
    roleLabelLabel: string;
    roleWrong: string;
    continue: string;
    headingNotifs: string;
    pushLabel: string;
    pushOff: string;
    pushUrgent: string;
    pushAll: string;
    emailLabel: string;
    emailOff: string;
    emailDaily: string;
    emailWeekly: string;
    back: string;
    finish: string;
  };
};

type Step = 1 | 2;
type Push = "off" | "urgent" | "all";
type Email = "off" | "daily" | "weekly";

export function StaffOnboardingForm({
  locale,
  initialName,
  roleLabel,
  adminName,
  copy
}: StaffOnboardingFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(initialName);
  const [push, setPush] = useState<Push>("urgent");
  const [emailPref, setEmailPref] = useState<Email>("daily");
  const [pending, setPending] = useState(false);

  function onContinue(e: FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function onFinish(e: FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("name", name);
    fd.set("push", push);
    fd.set("email", emailPref);
    setPending(true);
    await completeStaffOnboarding(fd);
    // On success, the server action redirects; no further client state.
    setPending(false);
  }

  if (step === 1) {
    return (
      <form onSubmit={onContinue} className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          {copy.stepN(1)}
        </p>
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-[var(--ink)]">
            {copy.headingWelcome}
          </h1>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {copy.bodyWelcome}
          </p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">
            {copy.nameLabel}
          </span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cn(
              "h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-base",
              "focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            )}
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">
            {copy.roleLabelLabel}
          </span>
          <div className="flex items-center justify-between gap-3">
            <span
              role="img"
              aria-label={`${copy.roleLabelLabel}: ${roleLabel}`}
              className="inline-flex items-center rounded-full bg-[var(--soft)] px-3 py-1 text-sm font-medium text-[var(--ink)]"
            >
              {roleLabel}
            </span>
            <a
              href={`mailto:?subject=PetCura%20role%20update&body=Please%20update%20my%20PetCura%20role.`}
              className="text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              {copy.roleWrong.replace("{adminName}", adminName || "your admin")}
            </a>
          </div>
        </div>
        <Button type="submit" className="h-11 w-full">
          {copy.continue}
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onFinish} className="flex flex-col gap-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {copy.stepN(2)}
      </p>
      <h1 className="text-2xl font-semibold leading-tight text-[var(--ink)]">
        {copy.headingNotifs}
      </h1>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-[var(--ink)]">
          {copy.pushLabel}
        </legend>
        {(
          [
            ["off", copy.pushOff],
            ["urgent", copy.pushUrgent],
            ["all", copy.pushAll]
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-sm"
          >
            <input
              type="radio"
              name="push"
              value={value}
              checked={push === value}
              onChange={() => setPush(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-[var(--ink)]">
          {copy.emailLabel}
        </legend>
        {(
          [
            ["off", copy.emailOff],
            ["daily", copy.emailDaily],
            ["weekly", copy.emailWeekly]
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-sm"
          >
            <input
              type="radio"
              name="email"
              value={value}
              checked={emailPref === value}
              onChange={() => setEmailPref(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep(1)}
          disabled={pending}
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          {copy.back}
        </Button>
        <Button type="submit" disabled={pending}>
          {copy.finish}
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
