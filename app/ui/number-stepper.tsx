"use client";

import { cn } from "@/lib/ui/cn";

export interface NumberStepperProps {
  /** Current value as a string, mirroring a plain <input type="number"> value. */
  value: string;
  /** Fired on every value change: typing or a stepper button click. */
  onChange: (value: string) => void;
  /**
   * Fired after a value is "settled": on blur (typing done) and immediately
   * after a stepper button click (there is no separate blur signal there).
   * Optional — omit for inputs that only commit on external submit action.
   */
  onCommit?: (value: string) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Number input with custom stepper buttons, replacing the browser's default
 * spinner arrows. Same visual language as the priority reorder buttons
 * (sb-btn sb-btn--ghost). Purely presentational — callers own validation.
 */
export function NumberStepper({
  value,
  onChange,
  onCommit,
  min,
  step = 1,
  disabled = false,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: NumberStepperProps) {
  function stepBy(delta: number) {
    const current = Number(value) || 0;
    let next = current + delta;
    if (min !== undefined && next < min) {
      next = min;
    }
    const nextValue = String(next);
    onChange(nextValue);
    onCommit?.(nextValue);
  }

  return (
    <div className="sb-stepper">
      <button
        type="button"
        disabled={disabled}
        onClick={() => stepBy(-step)}
        aria-label="Diminuisci"
        className="sb-btn sb-btn--ghost sb-stepper__btn disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onCommit?.(value)}
        className={cn("sb-input sb-digit sb-stepper__input", className)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => stepBy(step)}
        aria-label="Aumenta"
        className="sb-btn sb-btn--ghost sb-stepper__btn disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
