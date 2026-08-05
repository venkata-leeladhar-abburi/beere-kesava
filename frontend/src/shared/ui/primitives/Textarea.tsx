import * as React from "react";
import { cn } from "../utils";
import { useFieldContext } from "./Field";

export interface TextareaProps extends Omit<React.ComponentProps<"textarea">, "style"> {
  invalid?: boolean;
  /** Shows a "n / max" counter bottom-right; turns warning at 90%, danger at 100%. */
  showCounter?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid: invalidProp, showCounter, className, id, disabled, maxLength, value, defaultValue, onChange, ...props },
  ref
) {
  const field = useFieldContext();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const resolvedId = id ?? field?.inputId;
  const describedBy = field ? (invalid ? field.errorId : field.hintId) : undefined;

  const [length, setLength] = React.useState(
    typeof value === "string" ? value.length : typeof defaultValue === "string" ? defaultValue.length : 0
  );

  const pct = maxLength ? (length / maxLength) * 100 : 0;
  const counterColor = pct >= 100 ? "var(--text-danger)" : pct >= 90 ? "var(--text-warning)" : "var(--text-tertiary)";

  return (
    <div className="relative">
      <textarea
        ref={ref}
        id={resolvedId}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={field?.required || undefined}
        className={cn(
          "w-full min-h-[88px] rounded-[var(--radius-md)] border resize-y",
          "bg-[var(--surface-raised)] text-[var(--text-primary)] text-[14px]",
          "px-3 py-2.5 outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "placeholder:text-[var(--text-placeholder)]",
          invalid ? "border-[var(--border-danger)]" : "border-[var(--border-default)] hover:border-[var(--border-strong)]",
          "focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--shadow-focus)]",
          disabled && "bg-[var(--surface-disabled)] text-[var(--text-disabled)] cursor-not-allowed",
          className
        )}
        {...props}
      />
      {showCounter && maxLength && (
        <span className="absolute bottom-2 right-3 bk-caption pointer-events-none" style={{ color: counterColor }}>
          {length} / {maxLength}
        </span>
      )}
    </div>
  );
});
