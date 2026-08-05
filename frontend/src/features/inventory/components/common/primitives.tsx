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
import { CheckCircle2 } from "lucide-react";

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
  // Radix SelectItem forbids value="" (reserved for "no selection"), but this
  // codebase's native <select> markup commonly uses <option value=""> as a
  // placeholder row — route that one to the Select's placeholder instead.
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
