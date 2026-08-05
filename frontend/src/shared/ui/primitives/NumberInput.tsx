/**
 * NumberInput — design-system/03-PRIMITIVES.md Part G.4.
 * inputMode="numeric", tabular figures, optional stepper via ↑/↓.
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

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, onValueChange, min, max, step = 1, className, onKeyDown, ...props },
  ref
) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onValueChange?.(raw === "" ? "" : Number(raw));
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
      ref={ref}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn("text-right tabular-nums", className)}
      {...props}
    />
  );
});
