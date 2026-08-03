import React from "react";
import { motion } from "motion/react";
import {
  Edit, X, Building2, CreditCard, User, Phone,
  MapPin, Hash, IndianRupee, Check,
  TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";
import {
  useFirms, Firm, FinancialEntry,
} from "../contexts/FirmsContext";
import { T, F, EASE } from "./theme";
import { fmtAmt, initials, cardColor } from "./utils";
import {
  FinSummaryStrip, FinSection, MiscSection
} from "./FirmFinanceSections";

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ height: 1, width: 24, background: T.borderDef }} />
      {children}
      <div style={{ flex: 1, height: 1, background: T.borderDef }} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required, textarea, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; textarea?: boolean; icon?: React.ReactNode;
}) {
  const [focused, setFocused] = React.useState(false);
  const base: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
    background: focused ? "#FFF" : T.warmIvory,
    border: `1.5px solid ${focused ? T.royalBurgundy : T.borderDef}`,
    borderRadius: 10, padding: icon ? "10px 12px 10px 36px" : "10px 12px",
    outline: "none", transition: "border-color 0.18s, background 0.18s", resize: "none",
  };
  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.taupe, display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: T.royalBurgundy }}> *</span>}
      </label>
      {icon && (
        <div style={{ position: "absolute", left: 11, bottom: textarea ? "auto" : 0, top: textarea ? 30 : 0, height: textarea ? "auto" : "100%", display: "flex", alignItems: textarea ? "flex-start" : "center", paddingTop: textarea ? 11 : 0 }}>
          <span style={{ color: T.taupe, display: "flex" }}>{icon}</span>
        </div>
      )}
      {textarea ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base as React.CSSProperties}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      )}
    </div>
  );
}

type FormState = Omit<Firm, "id" | "createdAt">;

export function FirmFormModal({ initial, onSave, onClose, title }: { initial: FormState; onSave: (data: FormState) => void; onClose: () => void; title: string }) {
  const [form, setForm] = React.useState<FormState>(initial);
  const [saved, setSaved] = React.useState(false);
  function set(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: key === "purchaseAmount" ? (val === "" ? undefined : Number(val)) : val }));
  }
  function handleSave() {
    if (!form.firmName.trim()) return;
    onSave(form); setSaved(true); setTimeout(onClose, 600);
  }
  return (
    <motion.div key="firm-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(44,9,22,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.28, ease: EASE }}
        style={{ background: "#FFF", borderRadius: 22, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,9,22,0.28)", border: `1px solid ${T.borderDef}` }}>
        <div style={{ background: T.darkBurgundy, borderRadius: "22px 22px 0 0", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(200,155,71,0.7)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>FIRMS MANAGEMENT</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(255,255,255,0.75)" />
          </button>
        </div>
        <div style={{ padding: "28px 28px 32px" }}>
          <SLabel>Basic Information</SLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Firm Name" value={form.firmName} onChange={v => set("firmName", v)} placeholder="e.g. Surat Zari Works" required icon={<Building2 size={14} />} />
            </div>
            <Field label="GST Number" value={form.gstNumber ?? ""} onChange={v => set("gstNumber", v)} placeholder="29ABCDE1234F1Z5" icon={<Hash size={14} />} />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Field label="Total Purchase Amount (₹)" value={form.purchaseAmount?.toString() ?? ""} onChange={v => set("purchaseAmount", v)} type="number" placeholder="e.g. 1500000" icon={<IndianRupee size={14} />} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Address" value={form.address ?? ""} onChange={v => set("address", v)} placeholder="Street, City, State, PIN" textarea icon={<MapPin size={14} />} />
            </div>
          </div>
          <SLabel>Bank Details</SLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Bank Name" value={form.bankName ?? ""} onChange={v => set("bankName", v)} placeholder="e.g. State Bank of India" icon={<CreditCard size={14} />} />
            </div>
            <Field label="Account Number" value={form.accountNumber ?? ""} onChange={v => set("accountNumber", v)} placeholder="e.g. 001234567890" />
            <Field label="IFSC Code" value={form.ifscCode ?? ""} onChange={v => set("ifscCode", v)} placeholder="e.g. SBIN0001234" />
          </div>
          <SLabel>Contact Person</SLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
            <Field label="Contact Person Name" value={form.contactPersonName ?? ""} onChange={v => set("contactPersonName", v)} placeholder="Full name" icon={<User size={14} />} />
            <Field label="Phone Number" value={form.contactPersonPhone ?? ""} onChange={v => set("contactPersonPhone", v)} placeholder="9876543210" type="tel" icon={<Phone size={14} />} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${T.borderDef}`, background: T.warmIvory, fontFamily: F.ui, fontSize: 14, fontWeight: 500, color: T.taupe, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!form.firmName.trim()} style={{ flex: 2, height: 44, borderRadius: 10, border: "none", background: form.firmName.trim() ? (saved ? T.green : T.royalBurgundy) : "rgba(110,15,45,0.25)", fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: "#FFF", cursor: form.firmName.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
              {saved ? <><Check size={16} /> Saved!</> : title}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FirmDetailModal({ firm, onClose, onEdit }: { firm: Firm; onClose: () => void; onEdit: () => void }) {
  const { getFirmFinancials, addIncomeEntry, addExpenseEntry, addMiscEntry, bulkAddIncome, bulkAddExpenses } = useFirms();
  const color = cardColor(firm.id);
  const fin = getFirmFinancials(firm.id);
  const [tab, setTab] = React.useState<"info" | "finance">("finance");
  function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
    if (!value) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${T.borderDef}`, gap: 16 }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, flexShrink: 0 }}>{label}</span>
        <span style={{ fontFamily: mono ? F.mono : F.ui, fontSize: 13, color: T.luxuryBrown, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(44,9,22,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.28, ease: EASE }}
        style={{ background: "#FFF", borderRadius: 22, width: "100%", maxWidth: 860, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(44,9,22,0.28)", border: `1px solid ${T.borderDef}` }}>
        <div style={{ background: color, borderRadius: "22px 22px 0 0", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>{initials(firm.firmName)}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF", lineHeight: 1.2 }}>{firm.firmName}</div>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.60)", letterSpacing: "1px", marginTop: 3 }}>{firm.id} · Added {firm.createdAt}</div>
          </div>
          <button onClick={() => { onClose(); onEdit(); }}
            style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
            <Edit size={14} /> Edit
          </button>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(255,255,255,0.80)" />
          </button>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0, background: "#FFF" }}>
          {[{ key: "finance", label: "Financial Tracking" }, { key: "info", label: "Firm Info" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as "info" | "finance")}
              style={{ flex: 1, height: 46, border: "none", background: "transparent", fontFamily: F.ui, fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe, cursor: "pointer", borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", transition: "all 0.18s" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 28px" }}>
          {tab === "info" && (
            <div>
              {firm.purchaseAmount && (
                <div style={{ background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Total Purchase Amount</span>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: T.antiqueGold }}>{fmtAmt(firm.purchaseAmount)}</span>
                </div>
              )}
              <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>Firm Details</div>
              <Row label="GST Number" value={firm.gstNumber} mono />
              <Row label="Address" value={firm.address} />
              {(firm.bankName || firm.accountNumber || firm.ifscCode) && (
                <>
                  <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 4, marginTop: 18 }}>Bank Details</div>
                  <Row label="Bank Name" value={firm.bankName} />
                  <Row label="Account Number" value={firm.accountNumber} mono />
                  <Row label="IFSC Code" value={firm.ifscCode} mono />
                </>
              )}
              {(firm.contactPersonName || firm.contactPersonPhone) && (
                <>
                  <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 4, marginTop: 18 }}>Contact Person</div>
                  <Row label="Name" value={firm.contactPersonName} />
                  <Row label="Phone" value={firm.contactPersonPhone} mono />
                </>
              )}
            </div>
          )}
          {tab === "finance" && (
            <div>
              <div style={{ background: "linear-gradient(135deg, rgba(30,102,64,0.07), rgba(200,155,71,0.07))", border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "13px 16px", marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <AlertTriangle size={15} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.6 }}>
                  <strong style={{ color: T.antiqueGold }}>How entries work:</strong>{" "}
                  <span style={{ color: T.green, fontWeight: 600 }}>Income</span> — add wholesale/retail receipts manually or import via Excel.{" "}
                  <span style={{ color: T.crimson, fontWeight: 600 }}>Expenses</span> — add weaver payments, material purchases and overheads manually or import via Excel.{" "}
                  <span style={{ color: T.antiqueGold, fontWeight: 600 }}>Miscellaneous</span> — bonus, advance, or one-off items.
                </div>
              </div>
              <FinSummaryStrip income={fin.income} expenses={fin.expenses} misc={fin.misc} />
              <FinSection title="Income" type="income" icon={<TrendingUp size={16} color={T.green} />} entries={fin.income} color={T.green} bg={T.greenBg}
                onAdd={e => addIncomeEntry(firm.id, e as Omit<FinancialEntry, "id">)}
                onBulkImport={rows => bulkAddIncome(firm.id, rows)} />
              <FinSection title="Expenses" type="expense" icon={<TrendingDown size={16} color={T.crimson} />} entries={fin.expenses} color={T.crimson} bg={T.crimsonBg}
                onAdd={e => addExpenseEntry(firm.id, e as Omit<FinancialEntry, "id">)}
                onBulkImport={rows => bulkAddExpenses(firm.id, rows)} />
              <MiscSection entries={fin.misc} onAdd={e => addMiscEntry(firm.id, e)} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
