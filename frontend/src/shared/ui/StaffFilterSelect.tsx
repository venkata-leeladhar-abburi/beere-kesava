import * as React from "react";
import { ChevronDown } from "lucide-react";

// Admin/superadmin-only "filter by staff" dropdown, styled to sit next to
// DateFilterBar. Plain native <select> — no dedicated select primitive
// exists yet in shared/ui, so this mirrors DateFilterBar's own button
// styling instead of inventing a new component.
export function StaffFilterSelect({
  names,
  value,
  onChange,
  label = "Staff",
}: {
  names: string[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  if (names.length === 0) return null;
  return (
    <div className="relative inline-flex items-center shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-[10px] border pl-3 pr-8 text-[13px]"
        style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)", color: "var(--text-primary)" }}
      >
        <option value="">All {label}</option>
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <ChevronDown size={14} style={{ color: "var(--text-tertiary)", position: "absolute", right: 10, pointerEvents: "none" }} />
    </div>
  );
}
