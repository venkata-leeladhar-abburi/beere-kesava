/**
 * ViewToggle — Table/Card view switch for sections that use DataTable's
 * `view` prop. Default to "table" wherever this is wired in; the toggle
 * lets the reader drop back to the card layout when they want it.
 */
import type { ReactNode } from "react";
import { cn } from "../utils";

export type DataView = "table" | "cards";

export interface ViewToggleProps {
  value: DataView;
  onChange: (view: DataView) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Switch view"
      className={cn("inline-flex items-center rounded-[var(--radius-md,8px)] border border-[var(--border-default)] bg-[var(--surface-raised)] p-0.5", className)}
    >
      <ViewToggleButton active={value === "table"} onClick={() => onChange("table")} label="Table view">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="1.5" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="9" y1="10" x2="9" y2="20" />
        </svg>
      </ViewToggleButton>
      <ViewToggleButton active={value === "cards"} onClick={() => onChange("cards")} label="Card view">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </ViewToggleButton>
    </div>
  );
}

function ViewToggleButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-[var(--radius-sm,6px)] transition-colors duration-[var(--duration-fast)]",
        active ? "bg-[var(--surface-sunken)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      )}
      style={{ width: 28, height: 28 }}
    >
      {children}
    </button>
  );
}
