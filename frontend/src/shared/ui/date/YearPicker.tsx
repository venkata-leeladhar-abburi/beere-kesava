/**
 * YearPicker — design-system/05-OVERLAYS.md Part K.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Scrollable year list, centred on the current/selected year, bounded by
 * `minDate`/`maxDate`. Exported standalone for DateFilterBar's `year` mode.
 */
import * as React from "react";
import { cn } from "../utils";

export interface YearPickerProps {
  selectedYear?: number;
  minDate?: Date;
  maxDate?: Date;
  /** How many years to show either side of the selected year when unbounded. Default 12. */
  span?: number;
  onSelect: (year: number) => void;
  className?: string;
}

export function YearPicker({ selectedYear, minDate, maxDate, span = 12, onSelect, className }: YearPickerProps) {
  const centerYear = selectedYear ?? new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : centerYear - span;
  const maxYear = maxDate ? maxDate.getFullYear() : centerYear + span;

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = minYear; y <= maxYear; y++) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const listRef = React.useRef<HTMLDivElement>(null);
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div ref={listRef} className={cn("flex flex-col gap-0.5 overflow-y-auto p-2 max-h-[280px]", className)} role="listbox" aria-label="Select year">
      {years.map(year => {
        const selected = year === selectedYear;
        return (
          <button
            key={year}
            ref={selected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(year)}
            className={cn(
              "h-9 shrink-0 rounded-[var(--radius-md)] px-3 text-left text-[13px] tabular-nums transition-colors",
              selected
                ? "bg-[var(--surface-brand)] text-[var(--text-on-brand)]"
                : "text-[var(--text-primary)] hover:bg-[var(--bk-neutral-50)]"
            )}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}
