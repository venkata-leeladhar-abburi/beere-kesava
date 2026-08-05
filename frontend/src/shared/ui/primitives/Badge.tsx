/**
 * Badge / Tag / StatusPill — design-system/03-PRIMITIVES.md Part L.
 * Four distinct components sharing one shell (Chip is in its own file — it
 * needs interactive/removable behaviour the other three don't).
 *
 *   Badge      static count or label ("12", "New")             not interactive
 *   Tag        classification ("Silk", "Pochampally")           not interactive
 *   StatusPill lifecycle state — dot + text, NEVER colour alone  not interactive
 */
import * as React from "react";
import { cn } from "../utils";

const SIZE_CLASS = {
  sm: "h-5 px-1.5 text-[11px] gap-1",
  md: "h-6 px-2 text-[12px] gap-1",
} as const;

export interface BadgeProps extends React.ComponentProps<"span"> {
  size?: "sm" | "md";
}

export function Badge({ size = "md", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium whitespace-nowrap",
        "bg-[var(--bk-neutral-100)] text-[var(--text-secondary)]",
        SIZE_CLASS[size],
        className
      )}
      {...props}
    />
  );
}

export interface TagProps extends React.ComponentProps<"span"> {
  size?: "sm" | "md";
}

export function Tag({ size = "md", className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium whitespace-nowrap",
        "bg-[var(--surface-sunken)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]",
        SIZE_CLASS[size],
        className
      )}
      {...props}
    />
  );
}

/** design-system/06-DOMAIN.md's 6-tone taxonomy will map onto these at the
 *  component boundary once Phase 6 lands; today this takes the tone directly. */
export type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-[var(--bk-neutral-50)] border-[var(--bk-neutral-200)] text-[var(--text-secondary)]",
  brand: "bg-[var(--surface-brand-subtle)] border-[var(--bk-burgundy-200)] text-[var(--text-brand)]",
  success: "bg-[var(--surface-success-subtle)] border-[var(--bk-green-200)] text-[var(--text-success)]",
  warning: "bg-[var(--surface-warning-subtle)] border-[var(--bk-amber-200)] text-[var(--text-warning)]",
  danger: "bg-[var(--surface-danger-subtle)] border-[var(--bk-red-200)] text-[var(--text-danger)]",
  info: "bg-[var(--surface-info-subtle)] border-[var(--bk-blue-200)] text-[var(--text-info)]",
};

const TONE_DOT_CLASS: Record<StatusTone, string> = {
  neutral: "bg-[var(--bk-neutral-400)]",
  brand: "bg-[var(--border-brand)]",
  success: "bg-[var(--border-success)]",
  warning: "bg-[var(--border-warning)]",
  danger: "bg-[var(--border-danger)]",
  info: "bg-[var(--border-info)]",
};

export interface StatusPillProps extends React.ComponentProps<"span"> {
  tone: StatusTone;
  label: string;
  size?: "sm" | "md";
}

/** Dot + text, always — never colour alone (WCAG 1.4.1). */
export function StatusPill({ tone, label, size = "md", className, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-full)] font-medium whitespace-nowrap border",
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full shrink-0", TONE_DOT_CLASS[tone])} />
      {label}
    </span>
  );
}
