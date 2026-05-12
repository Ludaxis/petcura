"use client";

import { useFormStatus } from "react-dom";
import { type FormHTMLAttributes, type ReactNode } from "react";

/**
 * Server-action `<form>` wrapper that mirrors the form's `useFormStatus`
 * pending state onto `aria-busy`. Drop in around any form whose submit is
 * a server action — screen readers then announce the work in flight, and
 * the inert ring/disabled state on PendingSubmitButton stays in sync with
 * the form-level busy indication. Use over plain `<form>` whenever a save
 * round-trip is user-perceptible.
 *
 * The two-component split (BusyForm child + PendingForm wrapper) exists
 * because `useFormStatus` only reads its enclosing form — we render the
 * sentinel inside the form to read the status, then forward it to the
 * outer aria-busy via a one-element render.
 */
function PendingFormSentinel({
  render
}: {
  render: (pending: boolean) => ReactNode;
}) {
  const { pending } = useFormStatus();
  return <>{render(pending)}</>;
}

export type PendingFormProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "children"
> & {
  children: ReactNode;
};

export function PendingForm({ children, ...formProps }: PendingFormProps) {
  // We render the form once. A hidden sentinel reads useFormStatus and
  // applies the matching aria-busy on a child wrapper. We can't reach the
  // outer form element from inside it (no DOM walking) so we put the
  // aria-busy on a wrapping div around `children` — accessible roles look
  // at the nearest aria-busy ancestor, which is what SRs announce.
  return (
    <form {...formProps}>
      <PendingFormSentinel
        render={(pending) => (
          <div
            // The wrapper carries the busy signal so AT users hear the work
            // in flight without us having to plumb pending into every child.
            aria-busy={pending || undefined}
            className="contents"
          >
            {children}
          </div>
        )}
      />
    </form>
  );
}
