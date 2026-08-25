/**
 * Combobox — design-system/03-PRIMITIVES.md Part H.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Used when a choice has >10 options (Hick's Law rule, H.3) — adds a search
 * field, fuzzy filter via `cmdk`, and a "No results" state. For ≤10 options
 * use <Select> instead.
 */
import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "../utils";
import { useFieldContext } from "./Field";
import { Icon } from "./Icon";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const SIZE_CLASS = {
  sm: "h-8 text-[13px] px-2.5",
  md: "h-10 text-[14px] px-3",
  lg: "h-12 text-[16px] px-4",
} as const;

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results",
  size = "md",
  invalid: invalidProp,
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();
  const field = useFieldContext();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const describedBy = field ? (invalid ? field.errorId : field.hintId) : undefined;
  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

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
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border transition-colors",
          "duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "bg-[var(--surface-raised)]",
          selected ? "text-[var(--text-primary)]" : "text-[var(--text-placeholder)]",
          invalid ? "border-[var(--border-danger)]" : "border-[var(--border-default)]",
          "hover:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          SIZE_CLASS[size]
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <Icon name="expandDown" size="sm" className={cn("shrink-0 transition-transform duration-[var(--duration-fast)]", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={listId}
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-[var(--z-dropdown)]",
            "rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-overlay)]",
            "shadow-[var(--shadow-lg)] overflow-hidden"
          )}
        >
          <CommandPrimitive shouldFilter loop>
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3" style={{ color: "var(--text-tertiary)" }}>
              <Icon name="search" size="sm" />
              <CommandPrimitive.Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                className="h-10 flex-1 bg-transparent outline-none border-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]"
              />
            </div>
            <CommandPrimitive.List className="max-h-[320px] overflow-y-auto p-1">
              <CommandPrimitive.Empty className="py-6 text-center bk-caption" style={{ color: "var(--text-tertiary)" }}>
                {emptyMessage}
              </CommandPrimitive.Empty>
              {options.map((option) => (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex h-10 items-center gap-2 rounded-[10px] px-3 pr-8 text-[14px] cursor-pointer select-none outline-none focus-visible:!outline-none",
                    "text-[var(--text-primary)]",
                    "data-[selected=true]:bg-[rgba(110,15,45,0.06)]",
                    "data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed",
                    option.value === value && "bg-[rgba(110,15,45,0.08)] font-semibold text-[var(--text-brand)]"
                  )}
                >
                  {option.label}
                  {option.value === value && (
                    <Icon name="check" size="sm" className="absolute right-2" />
                  )}
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </div>
      )}
    </div>
  );
}
