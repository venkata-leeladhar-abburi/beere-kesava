/**
 * DatePicker — design-system/05-OVERLAYS.md Part K.4.
 * ═══════════════════════════════════════════════════════════════════════════
 * Replaces native `type="date"` (14 instances — renders completely
 * differently across Chrome/Safari/Firefox/iOS, unstyleable, no brand).
 *
 * Trigger is a Phase 3 Input with a Calendar icon. Typed entry is
 * supported — `12/6/26`, `12 Jun 2026`, `2026-06-12`, `today`, `tomorrow`,
 * `+7d` — because typing beats clicking through a calendar for a known
 * date. Invalid input shows a Field error, never silently reverts.
 */
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "../utils";
import { Input } from "../primitives/Input";
import { useFieldContext } from "../primitives/Field";
import { Calendar } from "./Calendar";
import { formatDate, parseTypedDate, DATE_FORMATS } from "./format";

export interface DatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  min?: Date;
  max?: Date;
  format?: keyof typeof DATE_FORMATS;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  hasDataDates?: Date[];
  /** Called with a human-readable message when typed input can't be parsed; clear it once valid. */
  onInvalid?: (message: string | null) => void;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  format = "cell",
  placeholder = "Select date",
  disabled,
  clearable = true,
  hasDataDates,
  onInvalid,
  className,
  id,
}: DatePickerProps) {
  const field = useFieldContext();
  const resolvedId = id ?? field?.inputId;

  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(() => formatDate(value, format));
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!dirty) setText(formatDate(value, format));
  }, [value, format, dirty]);

  function commitText(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      onInvalid?.(null);
      onChange(null);
      setDirty(false);
      return;
    }
    const parsed = parseTypedDate(trimmed);
    if (!parsed) {
      onInvalid?.(`Couldn't understand "${raw}" — try 12 Jun 2026, 12/6/26, or today.`);
      return;
    }
    if ((min && parsed < min) || (max && parsed > max)) {
      onInvalid?.("That date is outside the allowed range.");
      return;
    }
    onInvalid?.(null);
    onChange(parsed);
    setDirty(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        {/* A plain wrapping div — not just the bare <input> — is the anchor/click
            target here. The calendar icon Input renders is a sibling <span>, not
            part of the <input> itself, so relying on the input's onFocus alone
            (as this used to) misses clicks on the icon, and never reopens the
            calendar once the input is already focused but closed (e.g. after
            Escape) since a focus event only fires on a focus *transition*. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div style={{ position: "relative" }} onMouseDown={() => { if (!disabled) setOpen(true); }}>
          <Input
            id={resolvedId}
            iconLeft="calendar"
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            clearable={clearable}
            onClear={() => {
              setText("");
              onInvalid?.(null);
              onChange(null);
              setDirty(false);
            }}
            onChange={e => {
              setText(e.target.value);
              setDirty(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={e => commitText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                commitText((e.target as HTMLInputElement).value);
                setOpen(false);
              }
              if (e.key === "Escape") setOpen(false);
            }}
            className={className}
          />
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          onOpenAutoFocus={e => e.preventDefault()}
          className={cn(
            "rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)] p-2",
            "bg-[var(--surface-overlay)] border-[var(--border-default)]",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-98",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out"
          )}
          style={{ zIndex: "var(--z-popover)" }}
        >
          <Calendar
            mode="single"
            selected={value ?? undefined}
            minDate={min}
            maxDate={max}
            hasDataDates={hasDataDates}
            onSelect={date => {
              onInvalid?.(null);
              onChange(date ?? null);
              setDirty(false);
              setOpen(false);
            }}
            onClear={clearable ? () => { onChange(null); setDirty(false); setOpen(false); } : undefined}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
