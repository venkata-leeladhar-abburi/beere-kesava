/**
 * Banner — design-system/05-OVERLAYS.md Part M.
 * ═══════════════════════════════════════════════════════════════════════════
 * App-wide, top-of-shell message (e.g. "You are in Superadmin mode") — the
 * same tone system as Alert, edge-to-edge instead of a rounded in-page card.
 * Sometimes dismissible; never for validation (that's Field, Phase 3) and
 * never ambient/auto-dismissing (that's Toast).
 */
import * as React from "react";
import { cn } from "../utils";
import { Icon } from "../primitives/Icon";
import { IconButton } from "../primitives/IconButton";

export type BannerTone = "info" | "success" | "warning" | "danger";

const TONE_ICON: Record<BannerTone, "info" | "success" | "warning" | "error"> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
};

const TONE_ROLE: Record<BannerTone, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

const TONE_BG: Record<BannerTone, string> = {
  info: "var(--surface-info-subtle)",
  success: "var(--surface-success-subtle)",
  warning: "var(--surface-warning-subtle)",
  danger: "var(--surface-danger-subtle)",
};

const TONE_TEXT: Record<BannerTone, string> = {
  info: "var(--text-info)",
  success: "var(--text-success)",
  warning: "var(--text-warning)",
  danger: "var(--text-danger)",
};

export interface BannerProps extends Omit<React.ComponentProps<"div">, "title"> {
  tone?: BannerTone;
  children: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

export function Banner({ tone = "info", children, action, onDismiss, className, ...props }: BannerProps) {
  return (
    <div
      role={TONE_ROLE[tone]}
      className={cn("flex items-center justify-center gap-3 px-6 py-3", className)}
      style={{ background: TONE_BG[tone], borderBottom: `3px solid var(--border-${tone})` }}
      {...props}
    >
      <span className="shrink-0" style={{ color: TONE_TEXT[tone] }}>
        <Icon name={TONE_ICON[tone]} size="sm" />
      </span>
      <p className="bk-label-lg text-center" style={{ color: TONE_TEXT[tone] }}>{children}</p>
      {action}
      {onDismiss && (
        <IconButton icon="close" label="Dismiss" size="sm" variant="ghost" onClick={onDismiss} className="shrink-0" />
      )}
    </div>
  );
}
