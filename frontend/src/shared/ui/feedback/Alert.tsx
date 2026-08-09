/**
 * Alert — design-system/05-OVERLAYS.md Part M.
 * ═══════════════════════════════════════════════════════════════════════════
 * Section-level, in-page message — distinct from Toast (ambient, auto-dismiss)
 * and Field error (Phase 3, field-level, never dismissible). Optionally
 * dismissible, optionally carries one action.
 */
import * as React from "react";
import { cn } from "../utils";
import { Icon } from "../primitives/Icon";
import { IconButton } from "../primitives/IconButton";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONE_ICON: Record<AlertTone, "info" | "success" | "warning" | "error"> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
};

const TONE_ROLE: Record<AlertTone, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

const TONE_BORDER: Record<AlertTone, string> = {
  info: "var(--bk-blue-200)",
  success: "var(--bk-green-200)",
  warning: "var(--bk-amber-200)",
  danger: "var(--bk-red-200)",
};

const TONE_BG: Record<AlertTone, string> = {
  info: "var(--surface-info-subtle)",
  success: "var(--surface-success-subtle)",
  warning: "var(--surface-warning-subtle)",
  danger: "var(--surface-danger-subtle)",
};

const TONE_TEXT: Record<AlertTone, string> = {
  info: "var(--text-info)",
  success: "var(--text-success)",
  warning: "var(--text-warning)",
  danger: "var(--text-danger)",
};

export interface AlertProps extends Omit<React.ComponentProps<"div">, "title"> {
  tone?: AlertTone;
  title: React.ReactNode;
  /** Body copy below the title. */
  children?: React.ReactNode;
  /** A single action rendered after the body — usually a `Button variant="tertiary" size="sm"`. */
  action?: React.ReactNode;
  /** Shows a close button; fires on click. Omit for a non-dismissible Alert. */
  onDismiss?: () => void;
}

export function Alert({ tone = "info", title, children, action, onDismiss, className, ...props }: AlertProps) {
  return (
    <div
      role={TONE_ROLE[tone]}
      className={cn("flex items-start gap-3 rounded-[var(--radius-md)] border p-4", className)}
      style={{
        background: TONE_BG[tone],
        borderColor: TONE_BORDER[tone],
        borderInlineStart: `3px solid var(--border-${tone})`,
      }}
      {...props}
    >
      <span className="mt-0.5 shrink-0" style={{ color: TONE_TEXT[tone] }}>
        <Icon name={TONE_ICON[tone]} size="sm" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="bk-label-lg" style={{ color: TONE_TEXT[tone] }}>{title}</p>
        {children && <p className="bk-body-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{children}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <IconButton icon="close" label="Dismiss" size="sm" variant="ghost" onClick={onDismiss} className="shrink-0 -m-1" />
      )}
    </div>
  );
}
