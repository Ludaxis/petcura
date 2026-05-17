"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent
} from "react";
import { cn } from "@petcura/ui";

type OtpCellsInputProps = {
  /** 0..6 digit code. */
  value: string;
  onChange: (next: string) => void;
  /** Fires once when 6 digits are present (manual or autofill). */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  /** Visual error state — flashes cells red without shake. */
  errored?: boolean;
  /** Visual success state — sage outline pulse. */
  succeeded?: boolean;
  /** Localized per-cell aria label template, e.g. "Digit {n} of 6". */
  cellLabelTemplate: string;
  /** Optional helper text id for aria-describedby on the group. */
  helperTextId?: string;
  /** Optional ID for the visible label that names the group. */
  labelledBy?: string;
};

const CELL_COUNT = 6;

function formatCellLabel(template: string, n: number) {
  return template.replace(/\{n\}/g, String(n));
}

export function OtpCellsInput({
  value,
  onChange,
  onComplete,
  disabled,
  errored,
  succeeded,
  cellLabelTemplate,
  helperTextId,
  labelledBy
}: OtpCellsInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const groupId = useId();
  const completedRef = useRef(false);

  // Fire onComplete exactly once when value reaches 6 digits.
  useEffect(() => {
    if (value.length === CELL_COUNT) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.(value);
      }
    } else {
      completedRef.current = false;
    }
  }, [value, onComplete]);

  const cells = Array.from({ length: CELL_COUNT }, (_, i) => value[i] ?? "");

  const setCellRef = useCallback((index: number) => {
    return (el: HTMLInputElement | null) => {
      inputsRef.current[index] = el;
    };
  }, []);

  const focusCell = useCallback((index: number) => {
    const target = inputsRef.current[Math.min(Math.max(index, 0), CELL_COUNT - 1)];
    if (target) {
      target.focus();
      target.select?.();
    }
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, index: number) => {
      const raw = e.target.value.replace(/[^0-9]/g, "");
      if (raw.length === 0) {
        // user deleted; clear this cell
        const next = value.slice(0, index) + value.slice(index + 1);
        onChange(next.slice(0, CELL_COUNT));
        return;
      }
      if (raw.length > 1) {
        // autofill / paste-into-cell: fan across cells from this position
        const remaining = raw.slice(0, CELL_COUNT - index);
        const next = (value.slice(0, index) + remaining).slice(0, CELL_COUNT);
        onChange(next);
        focusCell(next.length >= CELL_COUNT ? CELL_COUNT - 1 : next.length);
        return;
      }
      const next = (
        value.slice(0, index) +
        raw +
        value.slice(index + 1)
      ).slice(0, CELL_COUNT);
      onChange(next);
      if (index < CELL_COUNT - 1) focusCell(index + 1);
    },
    [focusCell, onChange, value]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace") {
        if (!cells[index]) {
          e.preventDefault();
          const next = value.slice(0, Math.max(index - 1, 0));
          onChange(next);
          focusCell(index - 1);
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusCell(index - 1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        focusCell(index + 1);
      }
    },
    [cells, focusCell, onChange, value]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text") ?? "";
      const digits = text.replace(/[^0-9]/g, "").slice(0, CELL_COUNT);
      if (!digits) return;
      e.preventDefault();
      onChange(digits);
      focusCell(digits.length >= CELL_COUNT ? CELL_COUNT - 1 : digits.length);
    },
    [focusCell, onChange]
  );

  const state = errored ? "error" : succeeded ? "success" : undefined;

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={helperTextId}
      className="flex gap-1.5"
    >
      {cells.map((cell, i) => (
        <input
          key={i}
          ref={setCellRef(i)}
          id={`${groupId}-cell-${i}`}
          aria-label={formatCellLabel(cellLabelTemplate, i + 1)}
          value={cell}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          data-state={state}
          className={cn(
            "pc-otp-cell h-14 w-12 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] text-center text-2xl font-semibold leading-none text-[var(--ink)] sm:w-14",
            "focus-visible:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
            "disabled:opacity-50"
          )}
          style={{ caretColor: cell ? "transparent" : undefined }}
        />
      ))}
    </div>
  );
}

export const OTP_CELL_COUNT = CELL_COUNT;
