/**
 * NumberInput — design-system/03-PRIMITIVES.md Part G.4.
 * inputMode="numeric", tabular figures, optional stepper via up/down arrows.
 *
 * Displays Indian-grouped digits live while typing (2,000 · 1,50,000 —
 * design-system/06-DOMAIN.md Part F.3's "Indian grouping everywhere" rule,
 * extended from display-only numbers to entry fields: amounts and weights
 * read the same grouped way whether you're looking at them or typing them).
 * `value`/`onValueChange` stay plain numbers — grouping is purely a display
 * concern, never touching what the caller stores or sends to the API.
 */
import * as React from "react";
import { cn } from "../utils";
import { Input, type InputProps } from "./Input";

export interface NumberInputProps extends Omit<InputProps, "type" | "onChange"> {
  value?: number | "";
  onValueChange?: (value: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
}

/** Groups an unsigned digit string Indian-style: 1234567 -> "12,34,567". */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/** Raw typed text -> { formatted display string, numeric value }. Strips
 *  everything but digits and (when `allowDecimal`) a single decimal point. */
function reformat(raw: string, allowDecimal: boolean): { formatted: string; numeric: number | "" } {
  let cleaned = raw.replace(/[^\d.]/g, "");
  if (!allowDecimal) cleaned = cleaned.replace(/\./g, "");
  else {
    // keep only the first "." — a second one is a stray keystroke, not a new value
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
    }
  }

  if (cleaned === "" || cleaned === ".") {
    return { formatted: cleaned, numeric: "" };
  }

  const [intPart, decPart] = cleaned.split(".");
  const groupedInt = groupIndian(intPart.replace(/^0+(?=\d)/, "") || "0");
  const formatted = decPart !== undefined ? `${groupedInt}.${decPart}` : groupedInt;
  const numeric = Number(cleaned);
  return { formatted, numeric: Number.isNaN(numeric) ? "" : numeric };
}

function formatForDisplay(value: number | "" | undefined, allowDecimal: boolean): string {
  if (value === "" || value === undefined || Number.isNaN(value)) return "";
  if (!allowDecimal) return groupIndian(String(Math.trunc(value)));
  const [intPart, decPart] = String(value).split(".");
  const groupedInt = groupIndian(intPart.replace("-", ""));
  return decPart !== undefined ? `${groupedInt}.${decPart}` : groupedInt;
}

/** Is `c` a digit or the decimal point — the characters formatting never
 *  reorders relative to each other (only commas move around them), so
 *  counting these is what keeps the cursor anchored through a reformat. A
 *  digit-only count would place the cursor before a just-typed "." instead
 *  of after it. */
function isAnchorChar(c: string): boolean {
  return (c >= "0" && c <= "9") || c === ".";
}

/** Count of anchor characters before `index` in `str`. */
function anchorsBefore(str: string, index: number): number {
  let n = 0;
  for (let i = 0; i < index && i < str.length; i++) {
    if (isAnchorChar(str[i])) n++;
  }
  return n;
}

/** Index right after the Nth anchor character in `str` (or end of string, or 0 for N<=0). */
function positionAfterAnchors(str: string, n: number): number {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (isAnchorChar(str[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return str.length;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, onValueChange, min, max, step = 1, className, onKeyDown, ...props },
  forwardedRef
) {
  const innerRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);

  const allowDecimal = !Number.isInteger(step);
  const [display, setDisplay] = React.useState(() => formatForDisplay(value, allowDecimal));
  // Anchor-character cursor position to restore once `display`'s DOM update
  // commits — set in the same event as `setDisplay`, consumed by the layout
  // effect below. Tied to React's own commit rather than an independent
  // rAF/timeout, so it can't race other tests' fake timers or a slow paint.
  const pendingCursorDigits = React.useRef<number | null>(null);

  // Resync from an externally-driven `value` (programmatic reset, another
  // field feeding this one) — skipped while it already matches what's
  // currently typed, so a mid-decimal edit like "12." isn't stomped back to
  // "12" on every keystroke.
  React.useEffect(() => {
    const { numeric } = reformat(display, allowDecimal);
    if (numeric !== value) {
      setDisplay(formatForDisplay(value, allowDecimal));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useLayoutEffect(() => {
    if (pendingCursorDigits.current === null) return;
    const el = innerRef.current;
    if (el) {
      const pos = positionAfterAnchors(display, pendingCursorDigits.current);
      el.setSelectionRange(pos, pos);
    }
    pendingCursorDigits.current = null;
  }, [display]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cursor = e.target.selectionStart ?? raw.length;
    pendingCursorDigits.current = anchorsBefore(raw, cursor);

    const { formatted, numeric } = reformat(raw, allowDecimal);
    setDisplay(formatted);
    onValueChange?.(numeric);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onValueChange && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const current = typeof value === "number" ? value : 0;
      const delta = e.key === "ArrowUp" ? step : -step;
      let next = current + delta;
      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);
      onValueChange(next);
    }
    onKeyDown?.(e);
  };

  return (
    <Input
      ref={innerRef}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn("text-right tabular-nums", className)}
      {...props}
    />
  );
});
