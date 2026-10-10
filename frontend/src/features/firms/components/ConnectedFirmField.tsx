import { Field, Select, SelectItem } from "../../../shared/ui/primitives";
import { useFirms } from "../contexts/FirmsContext";

/** Select value for "no firm" — Radix Select can't use an empty string. */
const NO_FIRM = "__none__";

/**
 * The optional "Connected Firm" picker on a supplier, vendor or wholesale
 * customer profile.
 *
 * It is only a default. Nobody is tied to a firm by their profile: each
 * external purchase, purchase order and invoice names its own firm, and this
 * just pre-selects that picker so the usual firm doesn't have to be chosen
 * every time.
 */
export function ConnectedFirmField({
  value,
  onChange,
  hint,
  id = "connected-firm",
}: {
  /** Firm.id, or "" when none is set. */
  value: string;
  onChange: (firmId: string) => void;
  hint: string;
  id?: string;
}) {
  const { firms } = useFirms();
  // A profile pointing at a firm that has since been removed still shows it
  // until changed, rather than silently reading "not connected".
  const firmMissing = !!value && !firms.some((f) => f.id === value);

  return (
    <Field label="Connected Firm (optional)" hint={hint}>
      <Select
        id={id}
        // Full width and left-aligned: firm names are long, and the default
        // right alignment pushed the list off the left edge.
        className="w-full"
        align="start"
        value={value || NO_FIRM}
        onValueChange={(v) => onChange(v === NO_FIRM ? "" : v)}
      >
        <SelectItem value={NO_FIRM}>Not connected</SelectItem>
        {firms.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.firmName}
          </SelectItem>
        ))}
        {firmMissing && <SelectItem value={value}>{value}</SelectItem>}
      </Select>
    </Field>
  );
}
