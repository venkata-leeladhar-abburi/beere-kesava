/**
 * Checkbox — design-system/03-PRIMITIVES.md Part I.
 * The whole label is clickable via Radix's htmlFor wiring — this is what
 * turns an 18px box into a real 44px target, and (when used through
 * <Field>/<CheckboxField>) is part of what fixes the unlabelled-input gap.
 */
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "../utils";
import { Icon } from "./Icon";

export type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root>;

export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "relative peer size-[18px] shrink-0 rounded-[var(--radius-xs)] border-2",
          "border-[var(--border-strong)] bg-[var(--surface-raised)]",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "data-[state=checked]:bg-[var(--surface-brand)] data-[state=checked]:border-[var(--border-brand)]",
          "data-[state=indeterminate]:bg-[var(--surface-brand)] data-[state=indeterminate]:border-[var(--border-brand)]",
          "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {/* 44px hit area */}
        <span aria-hidden="true" className="absolute pointer-events-none" style={{ inset: -13 }} />
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          {props.checked === "indeterminate" ? <Icon name="minus" size="xs" decorative /> : <Icon name="check" size="xs" decorative />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);

export interface CheckboxFieldProps extends CheckboxProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
}

/** Checkbox + clickable label, wired together — the common case. */
export const CheckboxField = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxFieldProps>(
  function CheckboxField({ label, description, id, className, ...props }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className={cn("flex items-start gap-2.5", className)}>
        <Checkbox ref={ref} id={inputId} {...props} />
        <label htmlFor={inputId} className="flex flex-col gap-0.5 cursor-pointer select-none">
          <span className="bk-label-lg" style={{ color: "var(--text-primary)" }}>{label}</span>
          {description && (
            <span className="bk-caption" style={{ color: "var(--text-tertiary)" }}>{description}</span>
          )}
        </label>
      </div>
    );
  }
);
