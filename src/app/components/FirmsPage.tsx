import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
const imgFirmsHero = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import {
  Plus, Edit, Eye, X, Building2, CreditCard, User, Phone,
  MapPin, Hash, IndianRupee, Search, Check,
  TrendingUp, TrendingDown, Minus, Upload, ChevronDown, ChevronUp,
  PlusCircle, FileSpreadsheet, ArrowRight, AlertTriangle,
} from "lucide-react";
import {
  useFirms, Firm,
  FinancialEntry, MiscEntry,
  IncomeCategory, ExpenseCategory, MiscType,
} from "./FirmsContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
  bgGold:        "rgba(200,155,71,0.08)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const INCOME_CATS: IncomeCategory[]   = ["Wholesale Sale", "Retail Sale", "Other"];
const EXPENSE_CATS: ExpenseCategory[] = ["Weaver Payments", "Material Purchase", "Shop Maintenance", "Factory Maintenance", "Salaries", "Other"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtAmt(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtFull(n: number) { return "₹" + n.toLocaleString("en-IN"); }
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function cardColor(id: string) {
  return ["#6E0F2D","#1E6640","#C89B47","#4A061B","#1565C0"][parseInt(id.replace("FIRM-",""), 10) % 5];
}
function today() { return new Date().toISOString().slice(0, 10); }

// ─── Shared input helpers ─────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: F.ui, fontSize: 13,
  color: T.luxuryBrown, background: T.warmIvory,
  border: `1.5px solid ${T.borderDef}`, borderRadius: 9,
  padding: "9px 12px", outline: "none",
};
function Inp({ value, onChange, placeholder, type = "text", mono }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  const [f, sf] = useState(false);
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inp, fontFamily: mono ? F.mono : F.ui, borderColor: f ? T.royalBurgundy : T.borderDef, background: f ? "#FFF" : T.warmIvory }}
      onFocus={() => sf(true)} onBlur={() => sf(false)} />
  );
}
function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  const [f, sf] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inp, appearance: "none", cursor: "pointer", paddingRight: 28, borderColor: f ? T.royalBurgundy : T.borderDef }}
        onFocus={() => sf(true)} onBlur={() => sf(false)}>{children}</select>
      <ChevronDown size={13} color={T.taupe} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}
function FLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{children}{req && <span style={{ color: T.crimson }}> *</span>}</div>;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ height: 1, width: 24, background: T.borderDef }} />
      {children}
      <div style={{ flex: 1, height: 1, background: T.borderDef }} />
    </div>
  );
}

// ─── Field (form modal) ───────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", required, textarea, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; textarea?: boolean; icon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
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

// ─── Finance summary strip ────────────────────────────────────────────────────
function FinSummaryStrip({ income, expenses, misc }: { income: FinancialEntry[]; expenses: FinancialEntry[]; misc: MiscEntry[] }) {
  const totalInc = income.reduce((s, e) => s + e.amount, 0)
    + misc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0)
    + misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  const net = totalInc - totalExp;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden", marginBottom: 22 }}>
      {[
        { label: "Total Income", val: totalInc, color: T.green,   bg: T.greenBg,   icon: <TrendingUp size={16} color={T.green} /> },
        { label: "Total Expenses", val: totalExp, color: T.crimson, bg: T.crimsonBg, icon: <TrendingDown size={16} color={T.crimson} /> },
        { label: "Net Balance", val: net, color: net >= 0 ? T.green : T.crimson, bg: net >= 0 ? T.greenBg : T.crimsonBg, icon: net >= 0 ? <TrendingUp size={16} color={net >= 0 ? T.green : T.crimson} /> : <TrendingDown size={16} color={T.crimson} /> },
      ].map((s, i) => (
        <div key={i} style={{ padding: "14px 18px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", background: s.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            {s.icon}
            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 18, color: s.color }}>{fmtFull(s.val)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Add entry inline form ────────────────────────────────────────────────────
function AddEntryForm({
  type, onSave, onCancel,
}: {
  type: "income" | "expense" | "misc";
  onSave: (data: Omit<FinancialEntry, "id"> | Omit<MiscEntry, "id">) => void;
  onCancel: () => void;
}) {
  const [desc, setDesc]         = useState("");
  const [amount, setAmount]     = useState("");
  const [date, setDate]         = useState(today());
  const [cat, setCat]           = useState<string>(type === "income" ? "Wholesale Sale" : type === "expense" ? "Weaver Payments" : "income");
  const [notes, setNotes]       = useState("");
  const [otherLabel, setOtherLabel] = useState("");

  const isOther = cat === "Other" && type !== "misc";

  function canSave() { return desc.trim() && parseFloat(amount) > 0 && date && (!isOther || otherLabel.trim()); }

  function handleSave() {
    if (!canSave()) return;
    const finalCat = isOther ? `Other — ${otherLabel.trim()}` : cat;
    if (type === "misc") {
      onSave({ description: desc.trim(), amount: parseFloat(amount), date, notes: notes.trim() || undefined, type: cat as MiscType });
    } else {
      onSave({ description: desc.trim(), amount: parseFloat(amount), date, category: finalCat as IncomeCategory | ExpenseCategory });
    }
  }

  const cats = type === "income" ? INCOME_CATS : type === "expense" ? EXPENSE_CATS : ["income", "expense"];

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: EASE }}
      style={{ background: "#FFF", border: `1.5px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isOther ? "1fr 130px 140px 160px 200px" : "1fr 130px 140px 160px", gap: 10, marginBottom: 10 }}>
        <div><FLabel req>Description</FLabel><Inp value={desc} onChange={setDesc} placeholder="Enter description…" /></div>
        <div><FLabel req>Amount (₹)</FLabel><Inp value={amount} onChange={setAmount} placeholder="0" type="number" mono /></div>
        <div><FLabel req>Date</FLabel>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ ...inp, fontFamily: F.mono }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
            onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = T.borderDef; }} />
        </div>
        <div><FLabel req>{type === "misc" ? "Type" : "Category"}</FLabel>
          <Sel value={cat} onChange={v => { setCat(v); setOtherLabel(""); }}>
            {cats.map(c => <option key={c} value={c}>{c === "income" ? "Income" : c === "expense" ? "Expense" : c}</option>)}
          </Sel>
        </div>
        {isOther && (
          <div><FLabel req>Specify "Other" Category</FLabel>
            <Inp value={otherLabel} onChange={setOtherLabel} placeholder="e.g. Commission, Advance, Rebate…" />
          </div>
        )}
      </div>
      {type === "misc" && (
        <div style={{ marginBottom: 10 }}>
          <FLabel>Notes (optional)</FLabel>
          <Inp value={notes} onChange={setNotes} placeholder="Any additional notes…" />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={!canSave()}
          style={{ height: 34, padding: "0 18px", borderRadius: 8, border: "none", background: canSave() ? T.royalBurgundy : "rgba(139,112,96,0.20)", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: canSave() ? "#FFF" : T.taupe, cursor: canSave() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={13} /> Save Entry
        </button>
        <button onClick={onCancel}
          style={{ height: 34, padding: "0 14px", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ─── Excel upload button ──────────────────────────────────────────────────────
function ExcelUploadBtn({ onImport, type }: { onImport: (rows: Omit<FinancialEntry, "id">[]) => void; type: "income" | "expense" }) {
  const ref = useRef<HTMLInputElement>(null);
  const defaultCat = type === "income" ? "Wholesale Sale" : "Weaver Payments";

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const entries: Omit<FinancialEntry, "id">[] = rows
          .filter(r => r["Description"] && r["Amount"])
          .map(r => ({
            description: String(r["Description"]),
            amount: parseFloat(String(r["Amount"]).replace(/[^0-9.]/g, "")) || 0,
            date: r["Date"] ? String(r["Date"]) : today(),
            category: (r["Category"] || defaultCat) as IncomeCategory | ExpenseCategory,
          }))
          .filter(e => e.amount > 0);
        if (entries.length > 0) onImport(entries);
      } catch {
        alert("Could not read Excel file. Please check format.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  return (
    <>
      <input type="file" accept=".xlsx,.xls,.csv" ref={ref} onChange={handleFile} style={{ display: "none" }} />
      <button onClick={() => ref.current?.click()}
        style={{ height: 34, padding: "0 14px", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: T.warmIvory, fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <FileSpreadsheet size={13} color={T.green} /> Import Excel
      </button>
    </>
  );
}

// ─── Financial entry list ─────────────────────────────────────────────────────
function EntryRow({ entry, type, onRemove }: { entry: FinancialEntry | MiscEntry; type?: "income" | "expense"; onRemove?: () => void }) {
  const isMisc   = "type" in entry;
  const isIncome = isMisc ? (entry as MiscEntry).type === "income" : (type === "income");
  const cat      = "category" in entry ? entry.category : (entry as MiscEntry).type === "income" ? "Income" : "Expense";

  // Color the category chip
  const catChipBg = isIncome ? T.greenBg : cat === "Factory Maintenance" || cat === "Shop Maintenance" ? "rgba(200,155,71,0.10)" : cat === "Salaries" ? "rgba(74,107,138,0.10)" : T.crimsonBg;
  const catChipColor = isIncome ? T.green : cat === "Factory Maintenance" || cat === "Shop Maintenance" ? "#8B6018" : cat === "Salaries" ? "#2E5A8A" : T.crimson;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 160px 30px", gap: 0, padding: "10px 14px", alignItems: "center", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFDF9" }}>
      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, paddingRight: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description}</div>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: isIncome ? T.green : T.crimson }}>
        {isIncome ? "+" : "−"}₹{entry.amount.toLocaleString("en-IN")}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{entry.date}</div>
      <div>
        <span style={{ display: "inline-block", background: catChipBg, border: `1px solid ${catChipColor}22`, borderRadius: 999, padding: "3px 9px", fontFamily: F.ui, fontSize: 11, color: catChipColor, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 150, textOverflow: "ellipsis" }}>
          {cat}
        </span>
      </div>
      <div>
        {onRemove && (
          <button onClick={onRemove} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.taupe }}>
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Financial sub-section ─────────────────────────────────────────────────────
function FinSection({
  title, icon, entries, color, bg, onAdd, onBulkImport, type, miscEntries,
}: {
  title: string; icon: React.ReactNode;
  entries: FinancialEntry[]; color: string; bg: string;
  onAdd: (e: Omit<FinancialEntry, "id">) => void;
  onBulkImport?: (rows: Omit<FinancialEntry, "id">[]) => void;
  type: "income" | "expense";
  miscEntries?: MiscEntry[];
}) {
  const [open, setOpen]         = useState(true);
  const [adding, setAdding]     = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const total = entries.reduce((s, e) => s + e.amount, 0);

  function handleImport(rows: Omit<FinancialEntry, "id">[]) {
    if (onBulkImport) { onBulkImport(rows); setImportMsg(`${rows.length} row${rows.length > 1 ? "s" : ""} imported`); setTimeout(() => setImportMsg(""), 3000); }
  }

  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      {/* Header */}
      <div style={{ background: bg, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, flex: 1 }}>{title}</span>
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15, color }}>{fmtFull(total)}</span>
        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginLeft: 4 }}>({entries.length} entries)</span>
        {open ? <ChevronUp size={15} color={T.taupe} /> : <ChevronDown size={15} color={T.taupe} />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} style={{ overflow: "hidden" }}>
            {/* Actions bar */}
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 8, alignItems: "center", background: "#FFF" }}>
              <button onClick={() => setAdding(a => !a)}
                style={{ height: 34, padding: "0 14px", borderRadius: 8, border: `1.5px solid ${color}`, background: `${color}12`, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <PlusCircle size={13} /> Add Entry
              </button>
              {onBulkImport && <ExcelUploadBtn onImport={handleImport} type={type} />}
              {importMsg && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> {importMsg}</span>}
            </div>

            {/* Add form */}
            <AnimatePresence>
              {adding && (
                <div style={{ padding: "12px 14px 0", background: "#FFF" }}>
                  <AddEntryForm type={type} onSave={d => { onAdd(d as Omit<FinancialEntry, "id">); setAdding(false); }} onCancel={() => setAdding(false)} />
                </div>
              )}
            </AnimatePresence>

            {/* Table header */}
            {entries.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 160px 30px", gap: 0, padding: "8px 14px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
                {["Description", "Amount", "Date", "Category", ""].map((h, i) => (
                  <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
            )}

            {entries.length === 0 && !adding ? (
              <div style={{ padding: "24px 18px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe, background: "#FFF" }}>
                No {title.toLowerCase()} recorded yet. Add entries manually or import from Excel.
              </div>
            ) : (
              <div style={{ background: "#FFF" }}>
                {entries.map((e, i) => <EntryRow key={e.id} entry={e} type={type} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Misc section ─────────────────────────────────────────────────────────────
function MiscSection({ entries, onAdd }: { entries: MiscEntry[]; onAdd: (e: Omit<MiscEntry, "id">) => void }) {
  const [open, setOpen]     = useState(true);
  const [adding, setAdding] = useState(false);

  const totalInc = entries.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const totalExp = entries.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);

  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: T.bgGold, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <Minus size={16} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, flex: 1 }}>Extra / Miscellaneous Payments</span>
        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.green }}>{fmtFull(totalInc)} in</span>
        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, margin: "0 4px" }}>·</span>
        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.crimson }}>{fmtFull(totalExp)} out</span>
        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginLeft: 4 }}>({entries.length})</span>
        {open ? <ChevronUp size={15} color={T.taupe} /> : <ChevronDown size={15} color={T.taupe} />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 8, background: "#FFF" }}>
              <button onClick={() => setAdding(a => !a)}
                style={{ height: 34, padding: "0 14px", borderRadius: 8, border: `1.5px solid ${T.antiqueGold}`, background: "rgba(200,155,71,0.10)", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.antiqueGold, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <PlusCircle size={13} /> Add Misc Entry
              </button>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, alignSelf: "center" }}>Manual entry only — specify income or expense per row</span>
            </div>

            <AnimatePresence>
              {adding && (
                <div style={{ padding: "12px 14px 0", background: "#FFF" }}>
                  <AddEntryForm type="misc" onSave={d => { onAdd(d as Omit<MiscEntry, "id">); setAdding(false); }} onCancel={() => setAdding(false)} />
                </div>
              )}
            </AnimatePresence>

            {entries.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 160px 30px", gap: 0, padding: "8px 14px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
                {["Description", "Amount", "Date", "Type", ""].map((h, i) => (
                  <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
            )}

            {entries.length === 0 && !adding ? (
              <div style={{ padding: "24px 18px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe, background: "#FFF" }}>
                No miscellaneous entries yet.
              </div>
            ) : (
              <div style={{ background: "#FFF" }}>
                {entries.map(e => <EntryRow key={e.id} entry={e} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



// ─── Business Overview section (redesigned premium table) ─────────────────────
function BusinessOverview({ onGoToFirm }: { onGoToFirm?: (firmId: string) => void }) {
  const { firms, getFirmFinancials } = useFirms();
  const [open, setOpen] = useState(true);

  const FIRM_COLORS = ["#6E0F2D","#1E6640","#C89B47","#4A061B","#1565C0"];

  const rows = useMemo(() => firms.map(firm => {
    const fin = getFirmFinancials(firm.id);
    const inc = fin.income.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
    const exp = fin.expenses.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
    const entryCount = fin.income.length + fin.expenses.length + fin.misc.length;
    return { firm, inc, exp, net: inc - exp, entryCount };
  }), [firms, getFirmFinancials]);

  const totInc = rows.reduce((s, r) => s + r.inc, 0);
  const totExp = rows.reduce((s, r) => s + r.exp, 0);
  const totNet = totInc - totExp;

  return (
    <div style={{ margin: "28px 56px 0", borderRadius: 22, overflow: "hidden", background: "#FFF", boxShadow: "0 4px 28px rgba(44,24,16,0.10)", border: `1px solid ${T.borderDef}` }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`, padding: "18px 28px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(200,155,71,0.18)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TrendingUp size={20} color={T.antiqueGold} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Business Overview</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Live P&amp;L across all {firms.length} firms · entries manually tracked</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Total Income",   val: totInc, color: "#4CAF82", bg: "rgba(76,175,130,0.15)" },
            { label: "Total Expenses", val: totExp, color: "#E57373", bg: "rgba(229,115,115,0.15)" },
            { label: "Net Balance",    val: totNet, color: totNet >= 0 ? "#4CAF82" : "#E57373", bg: totNet >= 0 ? "rgba(76,175,130,0.15)" : "rgba(229,115,115,0.15)" },
          ].map((c, i) => (
            <div key={i} style={{ textAlign: "right", background: c.bg, border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: "10px 16px" }}>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, color: c.color, letterSpacing: "-0.5px" }}>{fmtAmt(c.val)}</div>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2, letterSpacing: "0.3px" }}>{c.label}</div>
            </div>
          ))}
        </div>
        {open ? <ChevronUp size={18} color="rgba(255,255,255,0.60)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.60)" />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }} style={{ overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 130px 130px 150px 80px 36px", gap: 0, padding: "10px 28px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
              {["Firm", "Income", "Expenses", "Net Balance", "Entries", ""].map((h, i) => (
                <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: (i > 0 ? "right" : "left") as any }}>{h}</div>
              ))}
            </div>
            {rows.map((r, i) => {
              const color = FIRM_COLORS[parseInt(r.firm.id.replace("FIRM-",""), 10) % FIRM_COLORS.length];
              return (
                <motion.div
                  key={r.firm.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  style={{ display: "grid", gridTemplateColumns: "2fr 130px 130px 150px 80px 36px", gap: 0, padding: "0 28px", borderBottom: i < rows.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : "#FFFDF9", alignItems: "center", borderLeft: `4px solid ${color}` }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px ${color}40` }}>
                      <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{initials(r.firm.firmName)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{r.firm.firmName}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginTop: 2 }}>{r.firm.id}{r.firm.gstNumber ? ` · ${r.firm.gstNumber}` : ""}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>{fmtFull(r.inc)}</div>
                    {r.inc > 0 && <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, marginTop: 2 }}>↑ earned</div>}
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.crimson }}>{fmtFull(r.exp)}</div>
                    {r.exp > 0 && <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, marginTop: 2 }}>↓ spent</div>}
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <span style={{ display: "inline-block", fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: r.net >= 0 ? T.green : T.crimson, background: r.net >= 0 ? T.greenBg : T.crimsonBg, border: `1px solid ${r.net >= 0 ? "rgba(30,102,64,0.18)" : "rgba(192,57,43,0.18)"}`, borderRadius: 8, padding: "4px 10px" }}>
                      {r.net >= 0 ? "+" : ""}{fmtFull(r.net)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: "rgba(139,112,96,0.09)", border: `1px solid ${T.borderDef}`, borderRadius: 6, padding: "3px 8px" }}>
                      {r.entryCount} entries
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" as const }}>
                    <button onClick={() => onGoToFirm?.(r.firm.id)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ArrowRight size={13} color={T.taupe} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {/* Totals row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 130px 130px 150px 80px 36px", gap: 0, padding: "16px 28px", background: T.bgGold, borderTop: `1.5px solid ${T.borderGold}`, borderLeft: `4px solid ${T.antiqueGold}` }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>All Firms Total</div>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{rows.length} firms · manual entries</div>
              </div>
              <div style={{ textAlign: "right" as const, fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.green }}>{fmtFull(totInc)}</div>
              <div style={{ textAlign: "right" as const, fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.crimson }}>{fmtFull(totExp)}</div>
              <div style={{ textAlign: "right" as const }}>
                <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: totNet >= 0 ? T.green : T.crimson }}>
                  {totNet >= 0 ? "+" : ""}{fmtFull(totNet)}
                </span>
              </div>
              <div /><div />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Firm card ────────────────────────────────────────────────────────────────
function FirmCard({ firm, onEdit, onView }: { firm: Firm; onEdit: () => void; onView: () => void }) {
  const { getFirmFinancials } = useFirms();
  const [hov, setHov] = useState(false);
  const color = cardColor(firm.id);

  const fin = getFirmFinancials(firm.id);
  const inc = fin.income.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const exp = fin.expenses.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  const net = inc - exp;

  return (
    <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{ background: "#FFF", borderRadius: 18, border: `1.5px solid ${hov ? T.royalBurgundy : T.borderDef}`, boxShadow: hov ? "0 8px 32px rgba(110,15,45,0.12)" : "0 2px 12px rgba(44,24,16,0.06)", overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s", display: "flex", flexDirection: "column" }}>

      {/* Color band header */}
      <div style={{ background: color, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{initials(firm.firmName)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: "#FFF", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{firm.firmName}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: "1px", marginTop: 2 }}>{firm.id}</div>
        </div>
        {firm.purchaseAmount && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: "#FFF" }}>{fmtAmt(firm.purchaseAmount)}</div>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>Total Purchase</div>
          </div>
        )}
      </div>

      {/* Financial mini-strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${T.borderDef}` }}>
        {[
          { label: "Income",   val: inc, color: T.green   },
          { label: "Expenses", val: exp, color: T.crimson  },
          { label: "Net",      val: net, color: net >= 0 ? T.green : T.crimson },
        ].map((s, i) => (
          <div key={i} style={{ padding: "9px 14px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", textAlign: i === 2 ? "right" : "left" }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: s.color }}>{fmtFull(s.val)}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {firm.gstNumber && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Hash size={13} color={T.taupe} />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, letterSpacing: "0.5px" }}>{firm.gstNumber}</span>
          </div>
        )}
        {firm.address && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <MapPin size={13} color={T.taupe} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.5 }}>{firm.address}</span>
          </div>
        )}
        {(firm.bankName || firm.accountNumber) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={13} color={T.taupe} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
              {firm.bankName}{firm.bankName && firm.accountNumber ? " · " : ""}{firm.accountNumber ? `···${firm.accountNumber.slice(-4)}` : ""}
            </span>
          </div>
        )}
        {firm.ifscCode && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, background: "rgba(139,112,96,0.10)", border: "1px solid rgba(139,112,96,0.18)", borderRadius: 4, padding: "2px 8px" }}>IFSC</span>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{firm.ifscCode}</span>
          </div>
        )}
        {(firm.contactPersonName || firm.contactPersonPhone) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4, borderTop: `1px solid ${T.borderDef}`, marginTop: 4 }}>
            <User size={13} color={T.taupe} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{firm.contactPersonName}</span>
            {firm.contactPersonPhone && (<>
              <span style={{ color: T.borderDef, fontSize: 12 }}>·</span>
              <Phone size={11} color={T.taupe} />
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{firm.contactPersonPhone}</span>
            </>)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 8 }}>
        <button onClick={onView} style={{ flex: 1, height: 36, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: T.warmIvory, fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Eye size={14} /> View Details
        </button>
        <button onClick={onEdit} style={{ flex: 1, height: 36, borderRadius: 8, border: `1px solid ${T.royalBurgundy}`, background: "rgba(110,15,45,0.04)", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Edit size={14} /> Edit
        </button>
      </div>
    </motion.div>
  );
}

// ─── Firm Form Modal (add / edit) ─────────────────────────────────────────────
type FormState = Omit<Firm, "id" | "createdAt">;
const BLANK: FormState = { firmName: "", gstNumber: "", address: "", accountNumber: "", ifscCode: "", bankName: "", contactPersonName: "", contactPersonPhone: "", purchaseAmount: undefined };

function FirmFormModal({ initial, onSave, onClose, title }: { initial: FormState; onSave: (data: FormState) => void; onClose: () => void; title: string }) {
  const [form, setForm] = useState<FormState>(initial);
  const [saved, setSaved] = useState(false);

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

// ─── Firm Detail Modal (view + financials) ─────────────────────────────────────
function FirmDetailModal({ firm, onClose, onEdit }: { firm: Firm; onClose: () => void; onEdit: () => void }) {
  const { getFirmFinancials, addIncomeEntry, addExpenseEntry, addMiscEntry, bulkAddIncome, bulkAddExpenses } = useFirms();
  const color = cardColor(firm.id);
  const fin = getFirmFinancials(firm.id);
  const [tab, setTab] = useState<"info" | "finance">("finance");

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

        {/* Header */}
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

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0, background: "#FFF" }}>
          {[
            { key: "finance", label: "Financial Tracking" },
            { key: "info",    label: "Firm Info" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as "info" | "finance")}
              style={{ flex: 1, height: 46, border: "none", background: "transparent", fontFamily: F.ui, fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe, cursor: "pointer", borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", transition: "all 0.18s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
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
              {/* Auto-populate info banner */}
              <div style={{ background: "linear-gradient(135deg, rgba(30,102,64,0.07), rgba(200,155,71,0.07))", border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "13px 16px", marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <AlertTriangle size={15} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.6 }}>
                  <strong style={{ color: T.antiqueGold }}>How entries work:</strong>{" "}
                  <span style={{ color: T.green, fontWeight: 600 }}>Income</span> — add wholesale/retail receipts manually or import via Excel.{" "}
                  <span style={{ color: T.crimson, fontWeight: 600 }}>Expenses</span> — add weaver payments, material purchases (from approved POs) and overheads manually or import via Excel.{" "}
                  <span style={{ color: T.antiqueGold, fontWeight: 600 }}>Miscellaneous</span> — bonus, advance, or one-off items.{" "}
                  When selecting <em>"Other"</em>, a text field will appear to enter a custom category label.
                </div>
              </div>
              <FinSummaryStrip income={fin.income} expenses={fin.expenses} misc={fin.misc} />
              <FinSection
                title="Income" type="income" icon={<TrendingUp size={16} color={T.green} />} entries={fin.income} color={T.green} bg={T.greenBg}
                onAdd={e => addIncomeEntry(firm.id, e as Omit<FinancialEntry, "id">)}
                onBulkImport={rows => bulkAddIncome(firm.id, rows)}
              />
              <FinSection
                title="Expenses" type="expense" icon={<TrendingDown size={16} color={T.crimson} />} entries={fin.expenses} color={T.crimson} bg={T.crimsonBg}
                onAdd={e => addExpenseEntry(firm.id, e as Omit<FinancialEntry, "id">)}
                onBulkImport={rows => bulkAddExpenses(firm.id, rows)}
              />
              <MiscSection entries={fin.misc} onAdd={e => addMiscEntry(firm.id, e)} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function FirmsPage() {
  const { firms, addFirm, updateFirm, getFirmFinancials } = useFirms();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<
    | { type: "create" }
    | { type: "edit"; firm: Firm }
    | { type: "view"; firm: Firm }
    | null
  >(null);

  const filtered = firms.filter(f =>
    f.firmName.toLowerCase().includes(search.toLowerCase()) ||
    (f.gstNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (f.contactPersonName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPurchase = firms.reduce((s, f) => s + (f.purchaseAmount ?? 0), 0);

  function openFirmView(firmId: string) {
    const firm = firms.find(f => f.id === firmId);
    if (firm) setModal({ type: "view", firm });
  }

  return (
    <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · FIRMS &amp; VENDORS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Firms</h1>
            <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Vendor Management</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
            Manage all firms used for material purchases, weaver payments, and customer invoicing. Track income, expenses, and net balance per firm.
          </p>
        </div>
        {/* Right image with gradient */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
          <img src={imgFirmsHero} alt="Business firms" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.70) saturate(0.85)" }} />
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { label: "REGISTERED FIRMS",   val: String(firms.length),    sub: "Active vendor accounts",         hi: false, crimson: false, goldVal: false },
            { label: "TOTAL PURCHASES",    val: fmtAmt(totalPurchase),   sub: "Across all registered firms",    hi: true,  crimson: false, goldVal: true  },
            { label: "FIRMS WITH BALANCE", val: String(firms.filter(f => (f.purchaseAmount ?? 0) > 0).length), sub: "Active purchase records", hi: false, crimson: false, goldVal: false },
            { label: "AVG PURCHASE",       val: firms.length ? fmtAmt(totalPurchase / firms.length) : "₹0", sub: "Per registered firm", hi: false, crimson: false, goldVal: false },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                  {m.sub}
                </div>
              </div>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Business Overview */}
      <BusinessOverview onGoToFirm={openFirmView} />

      {/* Toolbar */}
      <div style={{ padding: "88px 56px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, position: "relative", maxWidth: 380 }}>
          <Search size={15} color={T.taupe} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by firm name, GST, or contact..."
            style={{ width: "100%", boxSizing: "border-box", height: 40, paddingLeft: 38, paddingRight: 12, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, background: "#FFF", fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, outline: "none" }} />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModal({ type: "create" })}
            style={{ height: 40, padding: "0 20px", borderRadius: 10, border: "none", background: T.royalBurgundy, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> Add New Firm
          </motion.button>
        </div>
      </div>

      {/* Firms grid */}
      <div style={{ padding: "24px 56px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: T.taupe }}>
            <Building2 size={40} color={T.borderDef} style={{ margin: "0 auto 16px" }} />
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.taupe }}>No firms found</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, marginTop: 6 }}>{search ? "Try a different search term" : "Add your first firm using the button above"}</div>
          </div>
        ) : (
          <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
            <AnimatePresence mode="popLayout">
              {filtered.map(firm => (
                <FirmCard key={firm.id} firm={firm}
                  onEdit={() => setModal({ type: "edit", firm })}
                  onView={() => setModal({ type: "view", firm })} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === "create" && (
          <FirmFormModal key="create-modal" title="Add New Firm" initial={BLANK}
            onSave={data => addFirm(data)} onClose={() => setModal(null)} />
        )}
        {modal?.type === "edit" && (
          <FirmFormModal key="edit-modal" title="Save Changes"
            initial={{ firmName: modal.firm.firmName, gstNumber: modal.firm.gstNumber ?? "", address: modal.firm.address ?? "", accountNumber: modal.firm.accountNumber ?? "", ifscCode: modal.firm.ifscCode ?? "", bankName: modal.firm.bankName ?? "", contactPersonName: modal.firm.contactPersonName ?? "", contactPersonPhone: modal.firm.contactPersonPhone ?? "", purchaseAmount: modal.firm.purchaseAmount }}
            onSave={data => updateFirm(modal.firm.id, data)} onClose={() => setModal(null)} />
        )}
        {modal?.type === "view" && (
          <FirmDetailModal key="view-modal" firm={modal.firm}
            onClose={() => setModal(null)}
            onEdit={() => setModal({ type: "edit", firm: modal.firm })} />
        )}
      </AnimatePresence>
    </div>
  );
}
