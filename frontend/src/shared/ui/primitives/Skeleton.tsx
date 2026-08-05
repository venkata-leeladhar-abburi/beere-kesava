/**
 * Skeleton / Spinner / Progress — design-system/03-PRIMITIVES.md Part P.
 * Skeleton is the DEFAULT loading state for page/section loads; Spinner is
 * reserved for inline/button-scoped async. A skeleton that doesn't match
 * the real layout causes a jarring reflow — worse than a spinner — so
 * TableSkeleton/CardSkeleton/MetricSkeleton (Phase 4) exist so features
 * can't get the shape wrong.
 */
import * as React from "react";
import { cn } from "../utils";

export type SkeletonProps = React.ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bk-neutral-100)] rounded-[var(--radius-sm)]",
        "motion-safe:animate-pulse",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export interface SpinnerProps extends React.ComponentProps<"svg"> {
  size?: "sm" | "md" | "lg" | "xl";
}

const SPINNER_PX = { sm: 14, md: 16, lg: 20, xl: 32 } as const;

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  const px = SPINNER_PX[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin", className)}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export interface ProgressProps extends React.ComponentProps<"div"> {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  intent?: "brand" | "success" | "warning" | "danger";
  label?: React.ReactNode;
  indeterminate?: boolean;
}

const PROGRESS_HEIGHT = { sm: 4, md: 6, lg: 8 } as const;
const INTENT_COLOR: Record<NonNullable<ProgressProps["intent"]>, string> = {
  brand: "var(--surface-brand)",
  success: "var(--text-success)",
  warning: "var(--text-warning)",
  danger: "var(--text-danger)",
};

export function Progress({ value, size = "md", intent = "brand", label, indeterminate, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = PROGRESS_HEIGHT[size];

  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="bk-label-md" style={{ color: "var(--text-secondary)" }}>{label}</span>
          <span className="bk-label-md tabular-nums" style={{ color: "var(--text-primary)" }}>{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full rounded-[var(--radius-full)] overflow-hidden bg-[var(--bk-neutral-200)]"
        style={{ height }}
      >
        <div
          className={cn(
            "h-full rounded-[var(--radius-full)] transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-standard)]",
            indeterminate && "motion-safe:animate-pulse"
          )}
          style={{ width: indeterminate ? "40%" : `${clamped}%`, background: INTENT_COLOR[intent] }}
        />
      </div>
    </div>
  );
}
