import type { ReactNode } from "react";

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-strong)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </span>
  );
}
