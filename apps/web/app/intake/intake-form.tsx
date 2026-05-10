"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Badge, Button } from "@petcura/ui";
import { createTranslator, type SupportedLocale } from "@petcura/shared";
import {
  submitOwnerIntake,
  type IntakeFormState
} from "./actions";

type IntakeFormProps = {
  categories: Array<{
    value: string;
    label: string;
  }>;
  locale: SupportedLocale;
};

const initialIntakeFormState: IntakeFormState = {
  ok: false
};

function FieldError({
  errors
}: {
  errors: IntakeFormState["fieldErrors"] | undefined;
}) {
  const firstError = Object.values(errors ?? {})[0]?.[0];

  if (!firstError) {
    return null;
  }

  return <p className="text-xs text-[var(--red)]">{firstError}</p>;
}

export function IntakeForm({ categories, locale }: IntakeFormProps) {
  const t = createTranslator(locale);
  const [state, formAction, isPending] = useActionState(
    submitOwnerIntake,
    initialIntakeFormState
  );

  if (state.ok) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 text-[var(--primary)]"
            size={20}
          />
          <div>
            <h2 className="font-semibold">{t("intake.successTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {t("intake.successBody")}
            </p>
            {state.caseId ? (
              <div className="mt-3">
                <Badge tone="teal">
                  {t("intake.caseId")}: {state.caseId.slice(0, 8)}
                </Badge>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input name="preferredLanguage" type="hidden" value={locale} />

      {state.message && state.message !== "validation_error" ? (
        <div className="rounded-[var(--radius)] border border-[var(--red-soft)] bg-[var(--red-soft)] p-3 text-sm leading-6 text-[var(--red)]">
          {t("intake.error")}
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="owner-name">
          {t("intake.ownerName")}
        </label>
        <input
          className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
          id="owner-name"
          name="ownerName"
          placeholder="Marta Tamm"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="phone">
          {t("intake.phone")}
        </label>
        <input
          className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
          id="phone"
          name="phone"
          placeholder="+372 ..."
          type="tel"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="pet-name">
            {t("intake.petName")}
          </label>
          <input
            className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
            id="pet-name"
            name="petName"
            placeholder="Luna"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="pet-species">
            {t("intake.petSpecies")}
          </label>
          <input
            className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
            id="pet-species"
            name="petSpecies"
            placeholder={t("intake.petSpeciesPlaceholder")}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="category">
          {t("intake.category")}
        </label>
        <select
          className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
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
          className="min-h-36 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-white px-3 py-3"
          id="message"
          name="message"
          placeholder={t("intake.messagePlaceholder")}
        />
      </div>

      <FieldError errors={state.fieldErrors} />

      <div className="flex justify-end border-t border-[var(--line)] pt-4">
        <Button disabled={isPending} type="submit">
          <Send aria-hidden="true" size={16} />
          {isPending ? t("intake.submitting") : t("intake.submit")}
        </Button>
      </div>
    </form>
  );
}
