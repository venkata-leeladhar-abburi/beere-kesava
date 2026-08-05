/**
 * IconButton — design-system/03-PRIMITIVES.md Part F.
 * ═══════════════════════════════════════════════════════════════════════════
 * The single biggest accessibility win available in this codebase: most of
 * the 1,000 hand-rolled buttons are icon-only, and across all of features/
 * there are only 27 aria-label attributes total.
 *
 * `label` is a REQUIRED prop — TypeScript refuses to compile an icon button
 * with no accessible name. This turns a whole class of WCAG 4.1.2 failures
 * into build errors instead of runtime accessibility bugs.
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";
import { Icon } from "./Icon";
import { Icons, type IconName, type LucideIcon } from "./icons";

const iconButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center shrink-0",
    "transition-[background-color,border-color,color,box-shadow]",
    "duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-[var(--surface-brand)] text-[var(--text-on-brand)] hover:bg-[var(--surface-brand-hover)] active:bg-[var(--surface-brand-active)]",
        secondary: "bg-[var(--surface-raised)] text-[var(--text-brand)] border border-[var(--border-default)] hover:bg-[var(--surface-brand-subtle)] hover:border-[var(--border-brand)]",
        tertiary: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bk-neutral-50)] hover:text-[var(--text-primary)]",
        ghost: "bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--bk-neutral-50)] hover:text-[var(--text-primary)] active:bg-[var(--bk-neutral-100)]",
        danger: "bg-[var(--bk-red-700)] text-white hover:bg-[var(--bk-red-800)] active:bg-[var(--bk-red-900)]",
      },
      size: {
        sm: "size-8 [&_svg]:size-3.5",
        md: "size-10 [&_svg]:size-4",
        lg: "size-12 [&_svg]:size-5",
      },
      shape: {
        square: "",
        circle: "rounded-[var(--radius-full)]",
      },
    },
    compoundVariants: [
      { shape: "square", size: "sm", class: "rounded-[var(--radius-sm)]" },
      { shape: "square", size: "md", class: "rounded-[var(--radius-md)]" },
      { shape: "square", size: "lg", class: "rounded-[var(--radius-md)]" },
    ],
    defaultVariants: { variant: "ghost", size: "md", shape: "square" },
  }
);

/** Every size gets at least a 44px hit area via an invisible inset span. */
const HIT_AREA_INSET: Record<string, string> = {
  sm: "-6px",
  md: "-2px",
  lg: "0",
};

export interface IconButtonProps
  extends Omit<React.ComponentProps<"button">, "style">,
    VariantProps<typeof iconButtonVariants> {
  icon: IconName | LucideIcon;
  /** REQUIRED. Becomes aria-label. There is no way to render an unlabelled IconButton. */
  label: string;
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant, size = "md", shape, loading = false, disabled, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      data-slot="icon-button"
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(iconButtonVariants({ variant, size, shape, className }))}
      {...props}
    >
      <span aria-hidden="true" className="absolute pointer-events-none" style={{ inset: HIT_AREA_INSET[size ?? "md"] }} />
      {loading ? (
        <Icon icon={Icons.spinner} size={size === "lg" ? "lg" : "sm"} className="animate-spin" decorative />
      ) : typeof icon === "string" ? (
        <Icon name={icon} size={size === "lg" ? "lg" : "sm"} />
      ) : (
        <Icon icon={icon} size={size === "lg" ? "lg" : "sm"} />
      )}
    </button>
  );
});
