/**
 * DateRangePicker — design-system/05-OVERLAYS.md Part K.5.
 * ═══════════════════════════════════════════════════════════════════════════
 * Two months side by side on desktop (one on mobile), a preset rail
 * including "This financial year" / "Last financial year" (1 Apr – 31 Mar —
 * essential for Indian GST returns, P&L, statements), and an explicit
 * Apply/Cancel step — no live filtering on every hover.
 */
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfQuarter, endOfQuarter, differenceInCalendarDays } from "date-fns";
import { cn } from "../utils";
import { Input } from "../primitives/Input";
import { Button } from "../primitives/Button";
import { Calendar } from "./Calendar";
import { formatRange, getFinancialYear } from "./format";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function buildPresets(): { label: string; range: DateRange }[] {
  const today = startOfDay(new Date());
  const fy = getFinancialYear(today);
  const lastFy = getFinancialYear(subMonths(fy.start, 1));
  return [
    { label: "Today", range: { from: today, to: today } },
    { label: "Yesterday", range: { from: subDays(today, 1), to: subDays(today, 1) } },
    { label: "Last 7 days", range: { from: subDays(today, 6), to: today } },
    { label: "Last 30 days", range: { from: subDays(today, 29), to: today } },
    { label: "This month", range: { from: startOfMonth(today), to: endOfMonth(today) } },
    { label: "Last month", range: { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) } },
    { label: "This quarter", range: { from: startOfQuarter(today), to: endOfQuarter(today) } },
    { label: fy.label + " (this FY)", range: { from: fy.start, to: fy.end } },
    { label: lastFy.label + " (last FY)", range: { from: lastFy.start, to: lastFy.end } },
  ];
}

function isSameRange(a: DateRange, b: { from: Date; to: Date }) {
  return !!a.from && !!a.to && startOfDay(a.from).getTime() === b.from.getTime() && startOfDay(a.to).getTime() === b.to.getTime();
}

export function DateRangePicker({ value, onChange, minDate, maxDate, placeholder = "Select date range", disabled, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange>(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const presets = React.useMemo(buildPresets, []);
  const dayCount = draft.from && draft.to ? differenceInCalendarDays(draft.to, draft.from) + 1 : 0;

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Input
          readOnly
          disabled={disabled}
          iconLeft="calendar"
          value={value.from ? formatRange(value.from, value.to) : ""}
          placeholder={placeholder}
          className={cn("cursor-pointer", className)}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className={cn(
            "rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)] overflow-hidden",
            "bg-[var(--surface-overlay)] border-[var(--border-default)]",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-98",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out"
          )}
          style={{ zIndex: "var(--z-popover)" }}
        >
          <div className="flex">
            <div className="flex w-[176px] shrink-0 flex-col gap-0.5 border-r p-2" style={{ borderColor: "var(--border-default)" }}>
              {presets.map(p => {
                const active = isSameRange(draft, { from: startOfDay(p.range.from!), to: endOfDay(p.range.to!) }) || isSameRange(draft, p.range as { from: Date; to: Date });
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDraft(p.range)}
                    className={cn(
                      "rounded-[var(--radius-md)] px-3 py-2 text-left text-[13px] transition-colors",
                      active ? "bg-[var(--surface-brand-subtle)] text-[var(--text-brand)]" : "text-[var(--text-primary)] hover:bg-[var(--bk-neutral-50)]"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
              <div className="rounded-[var(--radius-md)] px-3 py-2 text-left text-[13px] text-[var(--text-tertiary)]">Custom…</div>
            </div>

            <div className="flex flex-col">
              <Calendar
                mode="range"
                selected={{ from: draft.from ?? undefined, to: draft.to ?? undefined }}
                onSelectRange={range => {
                  let { from, to } = range ?? {};
                  if (from && to && from > to) [from, to] = [to, from];
                  setDraft({ from: from ?? null, to: to ?? null });
                }}
                minDate={minDate}
                maxDate={maxDate}
                numberOfMonths={2}
                showFooter={false}
              />
              <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--border-default)" }}>
                <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                  {draft.from && draft.to ? `${formatRange(draft.from, draft.to)} (${dayCount} day${dayCount === 1 ? "" : "s"})` : "Select a start and end date"}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={apply} disabled={!draft.from || !draft.to}>Apply</Button>
                </div>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
