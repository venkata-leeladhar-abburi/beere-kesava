/**
 * Select — design-system/03-PRIMITIVES.md Part H.
 * ═══════════════════════════════════════════════════════════════════════════
 * Built with clean native select for 100% reliable touch & mobile picker
 * support without body-scroll locking or window scroll jump bugs.
 */
import * as React from "react";
import { cn } from "../utils";
import { useFieldContext } from "./Field";
import { Icon } from "./Icon";

const SIZE_CLASS = {
  sm: "h-8 text-[13px] px-2.5",
  md: "h-10 text-[14px] px-3",
  lg: "h-12 text-[16px] px-4",
} as const;

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "onChange"> {
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  containerClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

export function Select({
  size = "md",
  placeholder,
  invalid: invalidProp,
  className,
  containerClassName,
  children,
  value,
  onValueChange,
  defaultValue,
  disabled,
  onChange,
  ...props
}: SelectProps) {
  const field = useFieldContext();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const describedBy = field ? (invalid ? field.errorId : field.hintId) : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  return (
    <div className={cn("relative inline-flex items-center", containerClassName || "w-full")}>
      <select
        id={field?.inputId}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={field?.required || undefined}
        className={cn(
          "w-full appearance-none flex items-center justify-between gap-2 rounded-[var(--radius-md)] border transition-colors pr-8 cursor-pointer truncate",
          "duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "bg-[var(--surface-raised)] text-[var(--text-primary)] font-medium",
          invalid ? "border-[var(--border-danger)]" : "border-[var(--border-default)]",
          "hover:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          SIZE_CLASS[size],
          className
        )}
        {...props}
      >
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
        {children}
      </select>
      <div className="pointer-events-none absolute right-2.5 flex items-center justify-center">
        <Icon name="expandDown" size="sm" className="text-[var(--text-tertiary)]" />
      </div>
    </div>
  );
}

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string;
  children: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  function SelectItem({ className, children, value, disabled, ...props }, ref) {
    return (
      <option
        ref={ref}
        value={value}
        disabled={disabled}
        className={cn("bg-white text-[var(--text-primary)] py-1 px-2", className)}
        {...props}
      >
        {children}
      </option>
    );
  }
);

export function SelectGroup({ children, label, className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <optgroup label={label || ""} className={cn("font-semibold text-[var(--text-secondary)]", className)}>
      {children}
    </optgroup>
  );
}

export function SelectLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <optgroup label={typeof children === "string" ? children : ""} className={cn("font-semibold text-[var(--text-secondary)]", className)} />
  );
}

export function SelectSeparator() {
  return null;
}
