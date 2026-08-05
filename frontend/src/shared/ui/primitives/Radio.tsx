/**
 * Radio — design-system/03-PRIMITIVES.md Part I.
 * 2-5 mutually exclusive, all-visible options. >5 options → Select instead.
 */
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../utils";

export const RadioGroup = RadioGroupPrimitive.Root;

export type RadioProps = React.ComponentProps<typeof RadioGroupPrimitive.Item>;

export const Radio = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioProps>(
  function Radio({ className, ...props }, ref) {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          "relative peer size-[18px] shrink-0 rounded-full border-2",
          "border-[var(--border-strong)] bg-[var(--surface-raised)]",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "data-[state=checked]:border-[var(--border-brand)]",
          "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        <span aria-hidden="true" className="absolute pointer-events-none" style={{ inset: -13 }} />
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center w-full h-full">
          <span className="size-2 rounded-full" style={{ background: "var(--surface-brand)" }} />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  }
);

export interface RadioFieldProps extends RadioProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const RadioField = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioFieldProps>(
  function RadioField({ label, description, id, className, ...props }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className={cn("flex items-start gap-2.5", className)}>
        <Radio ref={ref} id={inputId} {...props} />
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
