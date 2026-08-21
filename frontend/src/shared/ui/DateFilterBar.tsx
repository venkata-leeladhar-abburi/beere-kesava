/**
 * DateFilterBar — design-system/05-OVERLAYS.md Part K.6.
 * ═══════════════════════════════════════════════════════════════════════════
 * Used across Weavers, Batches, Weaver Dispatcher, Goods Receipt, Material
 * Issuance, External Purchases, and Payments (Making Charges, Wholesale
 * Collections, Vendor Payments, Analytics, Payment History) so every history
 * table in the app filters dates the same way.
 *
 * The architecture (DateFilterState, matchesDateFilter, the five modes, and
 * every call site's props) is unchanged from the original — only the surface
 * was rebuilt: native `type="date"`/`type="month"`/`<select>` are replaced by
 * DatePicker/DateRangePicker/MonthPicker/YearPicker, and local hardcoded
 * colors/sizes are replaced by Phase 1 tokens.
 */
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";
import { cn } from "./utils";
import { DatePicker } from "./date/DatePicker";
import { DateRangePicker } from "./date/DateRangePicker";
import { MonthPicker } from "./date/MonthPicker";
import { YearPicker } from "./date/YearPicker";
import { formatDate } from "./date/format";

export type DateFilterMode = "all" | "day" | "range" | "month" | "year";
export interface DateFilterState { mode: DateFilterMode; day: string; from: string; to: string; month: string; year: string; }
export const DEFAULT_DATE_FILTER: DateFilterState = { mode: "all", day: "", from: "", to: "", month: "", year: "" };

export function matchesDateFilter(dateStr: string | undefined | null, filter: DateFilterState): boolean {
  if (filter.mode === "all" || !dateStr) return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  if (filter.mode === "day") {
    if (!filter.day) return true;
    const sel = new Date(filter.day);
    return d.getFullYear() === sel.getFullYear() && d.getMonth() === sel.getMonth() && d.getDate() === sel.getDate();
  }
  if (filter.mode === "range") {
    if (filter.from && d < new Date(filter.from)) return false;
    if (filter.to && d > new Date(`${filter.to}T23:59:59`)) return false;
    return true;
  }
  if (filter.mode === "month") {
    if (!filter.month) return true;
    const [y = "", m = ""] = filter.month.split("-");
    return d.getFullYear() === parseInt(y, 10) && d.getMonth() + 1 === parseInt(m, 10);
  }
  if (filter.mode === "year") {
    if (!filter.year) return true;
    return d.getFullYear() === parseInt(filter.year, 10);
  }
  return true;
}

function MonthField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [y = String(new Date().getFullYear()), m] = value.split("-");
  const [pickerYear, setPickerYear] = React.useState(parseInt(y, 10));
  const label = value ? formatDate(new Date(parseInt(y, 10), m ? parseInt(m, 10) - 1 : 0, 1), "month") : "Select month";

  return (
    <Popover.Root open={open} onOpenChange={o => { setOpen(o); if (o) setPickerYear(parseInt(y, 10)); }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-[13px]"
          style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)", color: "var(--text-primary)" }}
        >
          {label}
          <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)] p-2"
          style={{ zIndex: "var(--z-popover)", background: "var(--surface-overlay)", borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center justify-center gap-3 pb-1">
            <button type="button" onClick={() => setPickerYear(y2 => y2 - 1)} className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>‹</button>
            <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{pickerYear}</span>
            <button type="button" onClick={() => setPickerYear(y2 => y2 + 1)} className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>›</button>
          </div>
          <MonthPicker
            year={pickerYear}
            selectedMonth={m ? parseInt(m, 10) - 1 : undefined}
            selectedYear={parseInt(y, 10)}
            onSelect={monthIdx => {
              onChange(`${pickerYear}-${String(monthIdx + 1).padStart(2, "0")}`);
              setOpen(false);
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function YearField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const currentYear = new Date().getFullYear();
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-[13px] tabular-nums"
          style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)", color: "var(--text-primary)" }}
        >
          {value || "Select year"}
          <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)] p-2"
          style={{ zIndex: "var(--z-popover)", background: "var(--surface-overlay)", borderColor: "var(--border-default)" }}
        >
          <YearPicker
            selectedYear={value ? parseInt(value, 10) : currentYear}
            maxDate={new Date(currentYear, 11, 31)}
            span={5}
            onSelect={year => { onChange(String(year)); setOpen(false); }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function DateFilterBar({ filter, onChange }: { filter: DateFilterState; onChange: (f: DateFilterState) => void }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const modes: { key: DateFilterMode; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "day", label: "Specific Date" },
    { key: "range", label: "Date Range" },
    { key: "month", label: "Monthly" },
    { key: "year", label: "Yearly" },
  ];

  const selectMode = (key: DateFilterMode) => {
    if (key === "day") onChange({ ...DEFAULT_DATE_FILTER, mode: key, day: now.toISOString().slice(0, 10) });
    else if (key === "month") onChange({ ...DEFAULT_DATE_FILTER, mode: key, month: currentMonth });
    else if (key === "year") onChange({ ...DEFAULT_DATE_FILTER, mode: key, year: String(currentYear) });
    else onChange({ ...DEFAULT_DATE_FILTER, mode: key });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-4 max-w-full overflow-hidden">
      <div className="flex items-center gap-1 rounded-[var(--radius-md)] p-1 overflow-x-auto w-full sm:w-auto max-w-full scrollbar-none whitespace-nowrap" style={{ background: "var(--surface-sunken)", WebkitOverflowScrolling: "touch" }}>
        {modes.map(m => (
          <button
            key={m.key}
            onClick={() => selectMode(m.key)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-[12px] sm:text-[13px] font-semibold transition-colors",
              filter.mode === m.key ? "bg-[var(--surface-brand)] text-[var(--text-on-brand)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {filter.mode === "day" && (
        <DatePicker
          value={filter.day ? new Date(filter.day) : null}
          onChange={date => onChange({ ...filter, day: date ? formatDate(date, "iso") : "" })}
        />
      )}

      {filter.mode === "range" && (
        <DateRangePicker
          value={{ from: filter.from ? new Date(filter.from) : null, to: filter.to ? new Date(filter.to) : null }}
          onChange={range => onChange({
            ...filter,
            from: range.from ? formatDate(range.from, "iso") : "",
            to: range.to ? formatDate(range.to, "iso") : "",
          })}
        />
      )}

      {filter.mode === "month" && (
        <MonthField value={filter.month} onChange={month => onChange({ ...filter, month })} />
      )}

      {filter.mode === "year" && (
        <YearField value={filter.year} onChange={year => onChange({ ...filter, year })} />
      )}

      {filter.mode !== "all" && (
        <button
          onClick={() => onChange(DEFAULT_DATE_FILTER)}
          className="px-1 text-[13px] font-semibold underline"
          style={{ color: "var(--text-brand)" }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
