// Server component. Wraps NextStepCard + WhatHappensNextTile + heading.

import type { ReactNode } from "react";

type OwnerWelcomeStripProps = {
  heading: string;
  children: ReactNode;
};

export function OwnerWelcomeStrip({ heading, children }: OwnerWelcomeStripProps) {
  return (
    <section
      aria-labelledby="owner-welcome-heading"
      className="pc-auth-mount flex flex-col gap-4"
    >
      <h1
        id="owner-welcome-heading"
        className="text-2xl font-semibold leading-tight tracking-tight text-[var(--ink)] sm:text-3xl"
      >
        {heading}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
