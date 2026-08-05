/**
 * MultiSelect — design-system/03-PRIMITIVES.md Part H.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Checkbox items; selections render as removable chips in the trigger,
 * collapsing to "n selected" past 3 (per spec).
 */
import * as React from "react";
import { cn } from "../utils";
import { useFieldContext } from "./Field";
import { Icon } from "./Icon";
import { Chip } from "./Chip";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  invalid: invalidProp,
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();
  const field = useFieldContext();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const describedBy = field ? (invalid ? field.errorId : field.hintId) : undefined;
  const selected = options.filter((o) => value.includes(o.value));

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(optValue: string) {
    onValueChange(
      value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue]
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={field?.inputId}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={field?.required || undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full min-h-10 items-center justify-between gap-2 rounded-[var(--radius-md)] border transition-colors",
          "duration-[var(--duration-fast)] ease-[var(--ease-standard)] px-3 py-1.5",
          "bg-[var(--surface-raised)]",
          invalid ? "border-[var(--border-danger)]" : "border-[var(--border-default)]",
          "hover:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {selected.length === 0 ? (
          <span className="text-[14px]" style={{ color: "var(--text-placeholder)" }}>{placeholder}</span>
        ) : selected.length > 3 ? (
          <span className="text-[14px]" style={{ color: "var(--text-primary)" }}>{selected.length} selected</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((o) => (
              <Chip key={o.value} label={o.label} />
            ))}
          </div>
        )}
        <Icon name="expandDown" size="sm" className={cn("shrink-0 transition-transform duration-[var(--duration-fast)]", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-[var(--z-dropdown)] max-h-[320px] overflow-y-auto",
            "rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-overlay)]",
            "shadow-[var(--shadow-lg)] p-1"
          )}
        >
          {options.map((option) => {
            const isChecked = value.includes(option.value);
            return (
              <div
                key={option.value}
                role="option"
                tabIndex={option.disabled ? -1 : 0}
                aria-selected={isChecked}
                aria-disabled={option.disabled || undefined}
                onClick={() => !option.disabled && toggle(option.value)}
                onKeyDown={(e) => {
                  if (!option.disabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    toggle(option.value);
                  }
                }}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-[14px] cursor-pointer select-none outline-none",
                  "text-[var(--text-primary)] hover:bg-[var(--bk-neutral-50)] focus-visible:bg-[var(--bk-neutral-50)]",
                  option.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-[var(--radius-xs)] border-2",
                    isChecked
                      ? "bg-[var(--surface-brand)] border-[var(--surface-brand)]"
                      : "border-[var(--border-strong)] bg-[var(--surface-raised)]"
                  )}
                >
                  {isChecked && <Icon name="check" size="xs" className="text-white" />}
                </span>
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
