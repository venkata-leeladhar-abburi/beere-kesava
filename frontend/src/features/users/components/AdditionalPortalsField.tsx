import { useId } from "react";
import { Checkbox } from "../../../shared/ui/primitives";
import { T, F, ROLE_TO_PORTAL } from "./theme";

/** Portals that can be granted on top of a person's primary role. Weaver is
 *  excluded because it needs its own linked Weaver record (created through the
 *  Weavers module, not here), and Superadmin is never a side-grant. */
export const ADDITIONAL_PORTAL_ROLES = ["Admin", "Worker Staff", "Shop Staff", "Accountant"] as const;

/**
 * Multi-select: a person can hold any number of these on top of their primary
 * role. Deliberately not a row of bare circles — those read as a radio group,
 * i.e. "pick one" — so each option is a full card that reports its own
 * selected state, under a heading that says how many are on.
 */
export function AdditionalPortalsField({ primaryRole, value, onChange }: {
  /** Frontend role label of the primary role — excluded from the options. */
  primaryRole: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const groupId = useId();
  const options = ADDITIONAL_PORTAL_ROLES.filter(r => r !== primaryRole);
  const selected = options.filter(r => value.includes(r));
  const toggle = (r: string) =>
    onChange(value.includes(r) ? value.filter(v => v !== r) : [...new Set([...value, r])]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="bk-label-lg flex items-baseline justify-between gap-2" style={{ color: "var(--text-primary)" }}>
        <span>Additional Portals</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: selected.length ? T.royalBurgundy : T.taupe }}>
          {selected.length ? `${selected.length} selected` : "Select all that apply"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, marginTop: 2 }}>
        {options.map(r => {
          const on = value.includes(r);
          // htmlFor/id rather than nesting: that's how the rest of the app
          // wires a Radix checkbox to a clickable label (see CheckboxField).
          const id = `${groupId}-${r.replace(/\s+/g, "-")}`;
          return (
            <label
              key={r}
              htmlFor={id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                padding: "11px 13px", borderRadius: 12,
                border: `1.5px solid ${on ? T.royalBurgundy : T.borderDef}`,
                background: on ? "rgba(110,15,45,0.05)" : "#FFF",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <Checkbox id={id} checked={on} onCheckedChange={() => toggle(r)} className="mt-[1px]" />
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, color: T.luxuryBrown }}>{r}</span>
                <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{ROLE_TO_PORTAL[r]}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2, lineHeight: 1.5 }}>
        {selected.length === 0
          ? `Optional. With none selected this person goes straight to the ${primaryRole} portal at login.`
          : `Asked which portal to open on every login, and can switch between ${[primaryRole, ...selected].join(", ")} from their profile menu.`}
      </div>
    </div>
  );
}
