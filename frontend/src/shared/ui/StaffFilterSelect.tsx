import { Select, SelectItem } from "./primitives";

// Admin/superadmin-only "filter by staff" dropdown, styled to sit next to
// DateFilterBar. Built on the shared Select primitive so it matches every
// other filter pill in the app instead of a plain native <select>.
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
    <Select size="sm" value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
      <SelectItem value="all">All {label}</SelectItem>
      {names.map((n) => (
        <SelectItem key={n} value={n}>
          {n}
        </SelectItem>
      ))}
    </Select>
  );
}
