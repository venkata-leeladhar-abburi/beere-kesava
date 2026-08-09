/**
 * Calendar — design-system/05-OVERLAYS.md Part K.2/K.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Built on `react-day-picker` (already a dependency; the old
 * `shared/ui/_legacy/calendar.tsx` shadcn wrapper was unused and is
 * superseded by this one). Week starts Monday (Indian business convention).
 * Clicking the "June 2026 ▾" caption swaps the grid for an in-place
 * month/year picker — no nested popover, per spec.
 */
import * as React from "react";
import { DayPicker, useNavigation, type DateRange } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../utils";
import { Button } from "../primitives/Button";
import { MonthPicker } from "./MonthPicker";
import { YearPicker } from "./YearPicker";

export type { DateRange };

export interface CalendarProps {
  mode?: "single" | "range";
  selected?: Date | DateRange | undefined;
  onSelect?: (value: Date | undefined) => void;
  onSelectRange?: (value: DateRange | undefined) => void;
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  /** Dates that should render the small "has data" dot (e.g. days with dispatches). */
  hasDataDates?: Date[];
  showFooter?: boolean;
  onToday?: () => void;
  onClear?: () => void;
  className?: string;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function Caption({ displayMonth, onOpenSelect }: { displayMonth: Date; onOpenSelect: () => void }) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  return (
    <div className="flex h-11 items-center justify-between px-1">
      <button
        type="button"
        aria-label="Previous month"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bk-neutral-50)] disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={onOpenSelect}
        className="flex items-center gap-1 rounded-[var(--radius-md)] px-2 py-1 bk-label-lg hover:bg-[var(--bk-neutral-50)]"
        style={{ color: "var(--text-primary)" }}
      >
        {format(displayMonth, "MMMM yyyy")}
        <ChevronDown size={14} />
      </button>
      <button
        type="button"
        aria-label="Next month"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bk-neutral-50)] disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function DayContent({ date, hasDataDates }: { date: Date; hasDataDates?: Date[] }) {
  const hasData = hasDataDates?.some(d => isSameDay(d, date));
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <span>{date.getDate()}</span>
      {hasData && <span className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full" style={{ background: "var(--chart-1)" }} />}
    </div>
  );
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  onSelectRange,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  minDate,
  maxDate,
  numberOfMonths = 1,
  hasDataDates,
  showFooter = true,
  onToday,
  onClear,
  className,
}: CalendarProps) {
  const initial = defaultMonth ?? monthProp ?? (mode === "single" ? (selected as Date) : (selected as DateRange | undefined)?.from) ?? new Date();
  const [internalMonth, setInternalMonth] = React.useState<Date>(initial);
  const [view, setView] = React.useState<"days" | "select">("days");
  const [pickerYear, setPickerYear] = React.useState<number>(internalMonth.getFullYear());

  const displayMonth = monthProp ?? internalMonth;

  function setMonth(next: Date) {
    setInternalMonth(next);
    onMonthChange?.(next);
  }

  return (
    <div className={cn("select-none", className)} style={{ width: numberOfMonths > 1 ? undefined : 296 }}>
      {view === "select" ? (
        <div>
          <div className="flex h-11 items-center justify-center bk-label-lg" style={{ color: "var(--text-primary)" }}>
            Select month &amp; year
          </div>
          <div className="grid grid-cols-[1fr_84px] divide-x" style={{ borderColor: "var(--border-default)" }}>
            <MonthPicker
              year={pickerYear}
              selectedMonth={displayMonth.getMonth()}
              selectedYear={displayMonth.getFullYear()}
              minDate={minDate}
              maxDate={maxDate}
              onSelect={monthIdx => {
                setMonth(new Date(pickerYear, monthIdx, 1));
                setView("days");
              }}
            />
            <YearPicker
              selectedYear={pickerYear}
              minDate={minDate}
              maxDate={maxDate}
              onSelect={year => setPickerYear(year)}
            />
          </div>
        </div>
      ) : (
        <DayPicker
          mode={mode as "single"}
          selected={selected as Date}
          onSelect={(value: Date | undefined) => onSelect?.(value)}
          month={displayMonth}
          onMonthChange={setMonth}
          numberOfMonths={numberOfMonths}
          weekStartsOn={1}
          fromDate={minDate}
          toDate={maxDate}
          showOutsideDays
          modifiers={{ weekend: date => date.getDay() === 0 || date.getDay() === 6 }}
          modifiersClassNames={{ weekend: "!text-[var(--text-secondary)]" }}
          components={{
            Caption: ({ displayMonth: dm }) => (
              <Caption
                displayMonth={dm}
                onOpenSelect={() => {
                  setPickerYear(dm.getFullYear());
                  setView("select");
                }}
              />
            ),
            DayContent: ({ date }) => <DayContent date={date} hasDataDates={hasDataDates} />,
          }}
          classNames={{
            months: "flex flex-col",
            month: "space-y-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: cn("h-9 w-[36px] font-normal text-[11px] uppercase tracking-wide flex items-center justify-center", "text-[var(--text-tertiary)]"),
            row: "flex w-full mt-0.5",
            cell: "h-11 w-11 flex items-center justify-center p-0 relative",
            day: cn(
              "h-9 w-9 rounded-[var(--radius-md)] text-[13px] tabular-nums transition-colors",
              "text-[var(--text-primary)] hover:bg-[var(--bk-neutral-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            ),
            day_today: "ring-2 ring-inset ring-[var(--border-brand)]",
            day_selected: "!bg-[var(--surface-brand)] !text-[var(--text-on-brand)] hover:!bg-[var(--surface-brand)]",
            day_outside: "!text-[var(--text-disabled)]",
            day_disabled: "!text-[var(--text-disabled)] line-through pointer-events-none",
            day_range_start: "!rounded-r-none",
            day_range_end: "!rounded-l-none",
            day_range_middle: "!rounded-none !bg-[var(--surface-brand-subtle)] !text-[var(--text-primary)]",
            day_hidden: "invisible",
          }}
        />
      )}

      {showFooter && view === "days" && (
        <div className="flex items-center justify-between border-t px-2 py-2" style={{ borderColor: "var(--border-default)" }}>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              const today = new Date();
              setMonth(today);
              onToday?.();
              onSelect?.(today);
            }}
          >
            Today
          </Button>
          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
