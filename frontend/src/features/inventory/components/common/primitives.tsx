// ── Shared primitives ──────────────────────────────────────────────────────
// Thin wrappers over shared/ui/primitives (BK Loom design system) — kept as
// the same exported API this feature already calls, so every existing call
// site picks up the design-system components (tokens, a11y, focus states)
// without a call-site-by-call-site rewrite. See design-system/03-PRIMITIVES.md
// Part S, Step 3 — this is the "migrate one feature end-to-end" proof.
import React from "react";
import { motion } from "motion/react";
import { T, F, EASE } from "../theme";
import {
  Field as DsField,
  Input,
  Select,
  SelectItem,
  StatusPill,
  type StatusTone,
} from "../../../../shared/ui/primitives";
import { CheckCircle2, type LucideIcon } from "lucide-react";

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Production, Materials, Payments, Weavers, Customers, Vendors, Suppliers,
// and Users pages.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto flex-nowrap min-w-0 pt-0.5">{actions}</div>}
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4">
        {children}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_TONE: Record<string, StatusTone> = {
  "Ready for Dispatch": "success",
  "Dispatched": "neutral",
  "Damaged — Review Needed": "danger",
  "QC Passed": "warning",
};

export function StatusBadge({ status }: { status: string }) {
  return <StatusPill tone={STATUS_TONE[status] ?? "neutral"} label={status} />;
}

// ── Input helpers ─────────────────────────────────────────────────────────────
export function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <DsField label={label} required={req}>
      {children}
    </DsField>
  );
}

export function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={mono ? "font-code" : undefined}
    />
  );
}

export function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

export function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  // Radix SelectItem forbids value="" (reserved for "no selection"), but the
  // native select markup this replaces commonly used an empty-value option
  // as a placeholder row — route that one to the Select's placeholder instead.
  let placeholder: React.ReactNode;
  const items = React.Children.toArray(children).filter((child) => {
    if (!React.isValidElement<{ value: string; children?: React.ReactNode }>(child)) return false;
    if (child.props.value === "") {
      placeholder = child.props.children;
      return false;
    }
    return true;
  }) as React.ReactElement<{ value: string; children?: React.ReactNode }>[];

  return (
    <Select value={value} onValueChange={onChange} placeholder={typeof placeholder === "string" ? placeholder : undefined}>
      {items.map((child) => (
        <SelectItem key={child.props.value} value={child.props.value}>{child.props.children}</SelectItem>
      ))}
    </Select>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: T.deepWine, color: "#FFF", padding: "14px 22px", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, zIndex: 600, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 9 }}>
      <CheckCircle2 size={16} color={T.antiqueGold} /> {msg}
    </motion.div>
  );
}
