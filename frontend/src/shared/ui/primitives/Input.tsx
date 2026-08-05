/**
 * Input — design-system/03-PRIMITIVES.md Part G.
 * ═══════════════════════════════════════════════════════════════════════════
 * Replaces the 270 raw <input> elements across features/. Reads Field's
 * context automatically (id, aria-describedby, aria-invalid) — a caller
 * wrapping this in <Field> gets a fully labelled, accessible control with
 * zero extra wiring.
 *
 * Placeholder is --text-placeholder (2.78:1) deliberately — it is NOT
 * content, which is exactly why it can never substitute for a real label.
 */
import * as React from "react";
import { cn } from "../utils";
import { useFieldContext } from "./Field";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import type { IconName, LucideIcon } from "./icons";

const SIZE_CLASS = {
  sm: "h-8 text-[13px] px-2.5",
  md: "h-10 text-[14px] px-3",
  lg: "h-12 text-[16px] px-4",
} as const;

export interface InputProps extends Omit<React.ComponentProps<"input">, "size" | "style"> {
  size?: "sm" | "md" | "lg";
  iconLeft?: IconName | LucideIcon;
  iconRight?: IconName | LucideIcon;
  addonLeft?: React.ReactNode;
  addonRight?: React.ReactNode;
  invalid?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  containerClassName?: string;
}

function renderIcon(icon: IconName | LucideIcon | undefined) {
  if (!icon) return null;
  return typeof icon === "string" ? <Icon name={icon} size="sm" /> : <Icon icon={icon} size="sm" />;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    iconLeft,
    iconRight,
    addonLeft,
    addonRight,
    invalid: invalidProp,
    clearable,
    onClear,
    className,
    containerClassName,
    id,
    disabled,
    readOnly,
    value,
    ...props
  },
  ref
) {
  const field = useFieldContext();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const resolvedId = id ?? field?.inputId;
  const describedBy = field ? (invalid ? field.errorId : field.hintId) : undefined;

  const hasValue = value !== undefined && value !== "" && value !== null;

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-[var(--radius-md)] border transition-colors",
        "duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
        "bg-[var(--surface-raised)]",
        invalid ? "border-[var(--border-danger)]" : "border-[var(--border-default)]",
        !disabled && !invalid && "hover:border-[var(--border-strong)]",
        "has-[input:focus-visible]:border-[var(--border-focus)] has-[input:focus-visible]:shadow-[var(--shadow-focus)]",
        disabled && "bg-[var(--surface-disabled)] cursor-not-allowed",
        readOnly && !disabled && "bg-[var(--surface-sunken)]",
        SIZE_CLASS[size],
        containerClassName
      )}
    >
      {addonLeft && <span className="shrink-0" style={{ color: "var(--text-tertiary)" }}>{addonLeft}</span>}
      {iconLeft && <span className="shrink-0" style={{ color: "var(--text-tertiary)" }}>{renderIcon(iconLeft)}</span>}
      <input
        ref={ref}
        id={resolvedId}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={field?.required || undefined}
        className={cn(
          "flex-1 min-w-0 bg-transparent outline-none border-none",
          "placeholder:text-[var(--text-placeholder)]",
          "disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed",
          "text-[var(--text-primary)]",
          className
        )}
        {...props}
      />
      {clearable && hasValue && !disabled && !readOnly && (
        <IconButton icon="close" label="Clear" size="sm" variant="ghost" onClick={onClear} className="shrink-0 -mr-1" />
      )}
      {iconRight && !clearable && <span className="shrink-0" style={{ color: "var(--text-tertiary)" }}>{renderIcon(iconRight)}</span>}
      {addonRight && <span className="shrink-0" style={{ color: "var(--text-tertiary)" }}>{addonRight}</span>}
    </div>
  );
});
