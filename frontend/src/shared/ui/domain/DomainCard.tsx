/**
 * <DomainCard> — design-system/06-DOMAIN.md Part G.1/G.4.
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared anatomy every per-entity card (WeaverCard, CustomerCard, …) is
 * built on, so identity/status/code always render identically regardless
 * of which entity they describe:
 *
 *   ┌─────────────────────────────────────────┐
 *   │  [Avatar]  Name              ● Status    │  avatar · name · StatusPill
 *   │            EntityCode                    │
 *   │            meta, body-sm --text-secondary│
 *   ├─────────────────────────────────────────┤
 *   │  Sarees 12  Looms 3  Progress 68% …      │  StatTile grid
 *   ├─────────────────────────────────────────┤
 *   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░  68%                 │  Progress
 *   ├─────────────────────────────────────────┤
 *   │  [View profile]                    [⋯]   │  actions
 *   └─────────────────────────────────────────┘
 *
 * Four density variants (Part G.4): `card` (grid views), `row` (72px list
 * rows), `compact` (48px pickers/dropdowns), `inline` (24px — what
 * `ColumnDef` type `avatar` renders inside a table cell).
 */
import * as React from "react";
import { cn } from "../utils";
import { Avatar } from "../primitives/Avatar";
import { Progress } from "../primitives/Skeleton";

export type DomainCardDensity = "card" | "row" | "compact" | "inline";

export interface DomainCardStat {
  label: string;
  value: React.ReactNode;
}

export interface DomainCardProps {
  avatarName: string;
  avatarSrc?: string;
  title: string;
  /** Usually an `<EntityCode>`. */
  code?: React.ReactNode;
  /** Usually a `<StatusPill>`, or two side by side (Part G.2's "person +
   *  payment" combinations). */
  status?: React.ReactNode;
  meta?: string;
  stats?: DomainCardStat[];
  progress?: number;
  progressLabel?: string;
  actions?: React.ReactNode;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function DomainCard({
  avatarName,
  avatarSrc,
  title,
  code,
  status,
  meta,
  stats,
  progress,
  progressLabel,
  actions,
  density = "card",
  onClick,
  className,
}: DomainCardProps) {
  const clickable = !!onClick;
  const Root = clickable ? "button" : "div";

  if (density === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 min-w-0", className)}>
        <Avatar name={avatarName} src={avatarSrc} size="xs" />
        <span className="truncate text-[13px] text-[var(--text-primary)]">{title}</span>
        {code}
      </span>
    );
  }

  if (density === "compact") {
    return (
      <Root
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 px-2 text-left",
          "hover:bg-[var(--surface-sunken)] rounded-[var(--radius-sm)]",
          clickable && "cursor-pointer",
          className
        )}
        style={{ height: 48 }}
      >
        <Avatar name={avatarName} src={avatarSrc} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[var(--text-primary)]">{title}</span>
          {code && <span className="block truncate">{code}</span>}
        </span>
        {status}
      </Root>
    );
  }

  if (density === "row") {
    return (
      <Root
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 px-4",
          "border-b border-[var(--border-subtle)] hover:bg-[var(--surface-sunken)]",
          clickable && "cursor-pointer text-left",
          className
        )}
        style={{ height: 72 }}
      >
        <Avatar name={avatarName} src={avatarSrc} size="md" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{title}</span>
            {code}
          </span>
          {meta && <span className="block truncate text-[13px] text-[var(--text-secondary)]">{meta}</span>}
        </span>
        {stats && stats.length > 0 && (
          <span className="hidden shrink-0 items-center gap-4 sm:flex">
            {stats.slice(0, 3).map((s) => (
              <span key={s.label} className="text-right">
                <span className="block text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{s.value}</span>
                <span className="block text-[11px] text-[var(--text-tertiary)]">{s.label}</span>
              </span>
            ))}
          </span>
        )}
        {status && <span className="shrink-0">{status}</span>}
        {actions && <span className="shrink-0">{actions}</span>}
      </Root>
    );
  }

  // density === "card"
  return (
    <Root
      onClick={onClick}
      className={cn(
        "flex w-full flex-col rounded-[var(--radius-lg)] bg-[var(--surface-raised)] text-left",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow",
        clickable && "cursor-pointer",
        className
      )}
      style={{ padding: "var(--pad-card)", containerType: "inline-size" } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <Avatar name={avatarName} src={avatarSrc} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-base text-[var(--text-primary)] leading-snug">{title}</span>
            <div className="shrink-0">{status}</div>
          </div>
          {code && <div className="mt-0.5">{code}</div>}
          {meta && <div className="mt-0.5 truncate text-[13px] text-[var(--text-secondary)]">{meta}</div>}
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border-subtle)] pt-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[14px] font-semibold tabular-nums text-[var(--text-primary)]">{s.value}</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {progress != null && (
        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
          <Progress value={progress} label={progressLabel} size="sm" />
        </div>
      )}

      {actions && (
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
          {actions}
        </div>
      )}
    </Root>
  );
}
