"use client";

import { useTransition } from "react";
import type {
  ChecklistItemProps,
  ChecklistItemStatus
} from "./ChecklistItem";
import { ChecklistItem } from "./ChecklistItem";
import { markChecklistStepDone, skipChecklistStep } from "../actions";
import type { ClinicOwnerStep } from "@/lib/auth/onboarding-progress";
import type { SupportedLocale } from "@petcura/shared";

export type ChecklistEntry = {
  step: ClinicOwnerStep;
  index: number;
  title: string;
  subtext: string;
  primaryHref: string;
  primaryLabel: string;
};

type SetupChecklistProps = {
  items: ChecklistEntry[];
  statusByStep: Record<ClinicOwnerStep, ChecklistItemStatus>;
  locale: SupportedLocale;
  labels: {
    doLater: string;
    skip: string;
    markDone: string;
    edit: string;
    statusTodo: string;
    statusDone: string;
    statusSkipped: string;
  };
};

export function SetupChecklist({
  items,
  statusByStep,
  locale,
  labels
}: SetupChecklistProps) {
  const [, startTransition] = useTransition();

  function buildFormData(step: ClinicOwnerStep) {
    const fd = new FormData();
    fd.set("step", step);
    fd.set("lang", locale);
    return fd;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const status = statusByStep[item.step] ?? "todo";
        const props: ChecklistItemProps = {
          step: item.step,
          index: item.index,
          status,
          title: item.title,
          subtext: item.subtext,
          primaryHref: item.primaryHref,
          primaryLabel: item.primaryLabel,
          secondaryLabel: labels.doLater,
          doneLabel: labels.statusDone,
          editLabel: labels.edit,
          markDoneLabel: labels.markDone,
          statusTodoLabel: labels.statusTodo,
          statusDoneLabel: labels.statusDone,
          statusSkippedLabel: labels.statusSkipped,
          onSecondary: () =>
            startTransition(() => {
              void skipChecklistStep(buildFormData(item.step));
            }),
          onMarkDone: () =>
            startTransition(() => {
              void markChecklistStepDone(buildFormData(item.step));
            })
        };
        return <ChecklistItem key={item.step} {...props} />;
      })}
    </ul>
  );
}
