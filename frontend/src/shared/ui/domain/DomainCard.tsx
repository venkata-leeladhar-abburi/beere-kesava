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
        "flex w-full flex-col text-left transition-shadow relative overflow-hidden",
        clickable && "cursor-pointer",
        className
      )}
      style={{ 
        background: "#FFFDF9",
        borderRadius: 12,
        border: "1.5px solid #C89B47",
        boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
        color: "#4A2B1D",
        containerType: "inline-size" 
      } as React.CSSProperties}
    >
      {/* Accent top */}
      <div style={{ height: 4, background: "#6E0F2D", width: "100%", opacity: 0.8, flexShrink: 0 }} />

      <div style={{ padding: "20px 22px 18px", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Avatar name={avatarName} src={avatarSrc} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-bold text-[20px] text-[#4A2B1D] leading-snug tracking-tight">{title}</span>
            <div className="shrink-0">{status}</div>
          </div>
          {code && <div className="mt-1 text-[13px] text-[#6E0F2D] font-mono tracking-wide">{code}</div>}
          {meta && <div className="mt-2 text-[13px] text-[#8A7968] font-medium tracking-wide uppercase">{meta}</div>}
        </div>
      </div>

      {(stats && stats.length > 0 || progress != null) && (
        <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-3" style={{ background: "rgba(110,15,45,0.03)", padding: 12, borderRadius: 10, border: "1px solid rgba(200,155,71,0.2)" }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-[12px] font-medium text-[#8A7968] uppercase tracking-wider mb-1">{s.label}</div>
                  <div className="text-[15px] font-bold text-[#6E0F2D]">{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {progress != null && (
            <div>
              <Progress value={progress} label={progressLabel} size="sm" />
            </div>
          )}
        </div>
      )}

      {actions && (
        <div style={{ padding: "18px 22px 22px", display: "flex", gap: 12, borderTop: "1px solid rgba(200,155,71,0.2)" }}>
          {actions}
        </div>
      )}
    </Root>
  );
}
