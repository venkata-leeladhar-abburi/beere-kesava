/**
 * The one presentational shell every non-happy-path screen state renders
 * through: icon, title, optional description, optional action. TableStates
 * (data/TableStates.tsx) is built on the same shape and is being folded onto
 * this component so the two families never visually drift apart — a screen
 * that mixes a table region and a page-level state (e.g. a detail page with
 * a table of line items) should look like one design language, not two.
 *
 * design-system/10-UI-STATES.md.
 */
import type { ReactNode } from "react";
import { Icon } from "../primitives/Icon";
import { Button } from "../primitives/Button";
import type { IconName } from "../primitives/icons";

export interface StateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface StateViewProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: StateAction;
  secondaryAction?: StateAction;
  /** "status" for loading/empty (assistive tech should not interrupt),
   *  "alert" for anything the user needs to know went wrong. */
  role?: "status" | "alert";
  /** Denser padding for use inside a card/section rather than a full page. */
  compact?: boolean;
  children?: ReactNode;
}

export function StateView({
  icon = "info",
  title,
  description,
  action,
  secondaryAction,
  role = "status",
  compact = false,
  children,
}: StateViewProps) {
  return (
    <div
      role={role}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        padding: compact ? "var(--space-8) var(--space-4)" : "var(--space-16) var(--space-6)",
        textAlign: "center",
        color: "var(--text-tertiary)",
      }}
    >
      <Icon name={icon} size="xl" />
      <div className="bk-title-sm" style={{ color: "var(--text-primary)" }}>
        {title}
      </div>
      {description && (
        <div className="bk-body-md" style={{ color: "var(--text-secondary)", maxWidth: "40ch" }}>
          {description}
        </div>
      )}
      {children}
      {(action || secondaryAction) && (
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
          {secondaryAction && (
            <Button variant="secondary" size="lg" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button variant={action.variant ?? "primary"} size="lg" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
