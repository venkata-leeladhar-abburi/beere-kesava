/**
 * Switch — design-system/03-PRIMITIVES.md Part I.
 * For a setting that applies IMMEDIATELY, no Save button. If it needs a
 * Save button, it's a Checkbox, not a Switch — see Part I.1.
 *
 * Thumb animates via `transform: translateX()` only, never `left` — Phase 1
 * motion rule (design-system/01-FOUNDATIONS.md Part H).
 */
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../utils";

export type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>;

export const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  function Switch({ className, ...props }, ref) {
    return (
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "bg-[var(--bk-neutral-300)] data-[state=checked]:bg-[var(--surface-brand)]",
          "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-white shadow-[var(--shadow-sm)]",
            "transition-transform duration-[var(--duration-normal)] ease-[var(--ease-emphasized)]",
            "translate-x-0 data-[state=checked]:translate-x-4"
          )}
        />
      </SwitchPrimitive.Root>
    );
  }
);

export interface SwitchFieldProps extends SwitchProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const SwitchField = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchFieldProps>(
  function SwitchField({ label, description, id, className, ...props }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className={cn("flex items-start justify-between gap-3", className)}>
        <label htmlFor={inputId} className="flex flex-col gap-0.5 cursor-pointer select-none">
          <span className="bk-label-lg" style={{ color: "var(--text-primary)" }}>{label}</span>
          {description && (
            <span className="bk-caption" style={{ color: "var(--text-tertiary)" }}>{description}</span>
          )}
        </label>
        <Switch ref={ref} id={inputId} {...props} />
      </div>
    );
  }
);
