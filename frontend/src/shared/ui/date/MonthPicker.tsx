/**
 * MonthPicker — design-system/05-OVERLAYS.md Part K.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Standalone month grid for a given year. Used by Calendar's inline
 * month/year nav, and exported for DateFilterBar's `month` mode.
 */
import * as React from "react";
import { cn } from "../utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface MonthPickerProps {
  year: number;
  /** 0-11, the currently selected month (only meaningful when its year matches `year`). */
  selectedMonth?: number;
  selectedYear?: number;
  minDate?: Date;
  maxDate?: Date;
  onSelect: (monthIndex: number) => void;
  className?: string;
}

export function MonthPicker({ year, selectedMonth, selectedYear, minDate, maxDate, onSelect, className }: MonthPickerProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-1 p-2", className)} role="grid" aria-label={`Months in ${year}`}>
      {MONTHS.map((label, idx) => {
        const monthStart = new Date(year, idx, 1);
        const monthEnd = new Date(year, idx + 1, 0);
        const disabled = (minDate && monthEnd < minDate) || (maxDate && monthStart > maxDate);
        const selected = selectedYear === year && selectedMonth === idx;
        return (
          <button
            key={label}
            type="button"
            role="gridcell"
            disabled={!!disabled}
            aria-selected={selected}
            onClick={() => onSelect(idx)}
            className={cn(
              "h-9 rounded-[var(--radius-md)] text-[13px] tabular-nums transition-colors",
              selected
                ? "bg-[var(--surface-brand)] text-[var(--text-on-brand)]"
                : "text-[var(--text-primary)] hover:bg-[var(--bk-neutral-50)]",
              disabled && "text-[var(--text-disabled)] pointer-events-none"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
