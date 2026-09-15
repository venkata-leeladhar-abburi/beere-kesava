import { CheckboxField, Field } from "../../../shared/ui/primitives";

/** Portals that can be granted on top of a person's primary role. Weaver needs
 *  its own linked Weaver record and Superadmin is never a side-grant. */
export const ADDITIONAL_PORTAL_ROLES = ["Admin", "Worker Staff", "Shop Staff", "Accountant"] as const;

export function AdditionalPortalsField({ primaryRole, value, onChange }: {
  /** Frontend role label of the primary role — excluded from the options. */
  primaryRole: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const options = ADDITIONAL_PORTAL_ROLES.filter(r => r !== primaryRole);
  const toggle = (r: string, on: boolean) =>
    onChange(on ? [...new Set([...value, r])] : value.filter(v => v !== r));

  return (
    <Field label="Additional Portals" hint="Optional — the person picks a portal at login and can switch between them.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 4 }}>
        {options.map(r => (
          <CheckboxField
            key={r}
            label={r}
            checked={value.includes(r)}
            onCheckedChange={c => toggle(r, c === true)}
          />
        ))}
      </div>
    </Field>
  );
}
