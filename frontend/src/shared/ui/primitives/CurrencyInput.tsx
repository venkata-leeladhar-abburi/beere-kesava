/**
 * CurrencyInput — design-system/03-PRIMITIVES.md Part G.4.
 * ₹ addon, inputMode="decimal", tabular figures, Indian grouping on blur.
 *
 * NOTE: this is a display/entry control only — it works in rupees (a plain
 * number), not the branded Paise integer type from Phase 6
 * (design-system/06-DOMAIN.md), which doesn't exist yet. Once
 * lib/domain/money.ts lands, the value it emits should be converted at the
 * call site with `rupees()` before being stored, so money is never held as
 * a float rupee anywhere past the form boundary.
 */
import * as React from "react";
import { cn } from "../utils";
import { Input, type InputProps } from "./Input";

export interface CurrencyInputProps extends Omit<InputProps, "type" | "onChange" | "addonLeft"> {
  value?: number | "";
  onValueChange?: (value: number | "") => void;
}

function formatGrouped(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { value, onValueChange, className, onBlur, ...props },
  ref
) {
  const [display, setDisplay] = React.useState(value === "" || value === undefined ? "" : String(value));

  React.useEffect(() => {
    if (value !== undefined && value !== "") setDisplay(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setDisplay(raw);
    onValueChange?.(raw === "" ? "" : Number(raw));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (display !== "") {
      const num = Number(display);
      if (!Number.isNaN(num)) setDisplay(formatGrouped(num));
    }
    onBlur?.(e);
  };

  const handleFocus = () => {
    // Drop grouping separators while editing so the caret math stays simple.
    setDisplay((d) => d.replace(/,/g, ""));
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      addonLeft="₹"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={cn("text-right tabular-nums", className)}
      {...props}
    />
  );
});
