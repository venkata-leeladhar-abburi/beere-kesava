/**
 * Select — design-system/03-PRIMITIVES.md Part H.
 * ═══════════════════════════════════════════════════════════════════════════
 * Replaces the 85 raw <select> elements across features/ — unstyleable, no
 * search, inconsistent across OSes. Built on @radix-ui/react-select.
 *
 * Hick's Law rule (H.3): ≤10 options → Select. >10 options → Combobox.
 * ≤2 options → RadioGroup or Switch, never a select.
 */
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../utils";
import { useFieldContext } from "./Field";
import { Icon } from "./Icon";

const SIZE_CLASS = {
  sm: "h-8 text-[13px] px-2.5",
  md: "h-10 text-[14px] px-3",
  lg: "h-12 text-[16px] px-4",
} as const;

export interface SelectProps
  extends Omit<React.ComponentProps<typeof SelectPrimitive.Root>, "children"> {
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Select({ size = "md", placeholder, invalid: invalidProp, className, children, ...props }: SelectProps) {
  const field = useFieldContext();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const describedBy = field ? (invalid ? field.errorId : field.hintId) : undefined;

  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        id={field?.inputId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={field?.required || undefined}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border transition-colors",
          "duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "bg-[var(--surface-raised)] text-[var(--text-primary)]",
          "data-[placeholder]:text-[var(--text-placeholder)]",
          invalid ? "border-[var(--border-danger)]" : "border-[var(--border-default)]",
          "hover:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          SIZE_CLASS[size],
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <Icon name="expandDown" size="sm" className="shrink-0 transition-transform duration-[var(--duration-fast)] data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-[var(--z-dropdown)] min-w-[var(--radix-select-trigger-width)] max-h-[320px] overflow-y-auto",
            "rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-overlay)]",
            "shadow-[var(--shadow-lg)] p-1"
          )}
        >
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export type SelectItemProps = React.ComponentProps<typeof SelectPrimitive.Item>;

export const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  function SelectItem({ className, children, ...props }, ref) {
    return (
      <SelectPrimitive.Item
        ref={ref}
        className={cn(
          "relative flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 pr-8 text-[14px] cursor-pointer select-none outline-none",
          "text-[var(--text-primary)]",
          "data-[highlighted]:bg-[var(--bk-neutral-50)]",
          "data-[state=checked]:bg-[var(--surface-brand-subtle)]",
          "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
          className
        )}
        {...props}
      >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
          <Icon name="check" size="sm" />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  }
);

export const SelectGroup = SelectPrimitive.Group;

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("bk-overline px-3 py-1.5", className)}
      style={{ color: "var(--text-tertiary)" }}
      {...props}
    />
  );
}

export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("h-px my-1 bg-[var(--border-subtle)]", className)} {...props} />;
}
