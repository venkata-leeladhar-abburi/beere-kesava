import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, TrendingUp, TrendingDown, PlusCircle, FileSpreadsheet, ChevronDown, ChevronUp, Minus,
} from "lucide-react";
import {
  FinancialEntry, MiscEntry, IncomeCategory, ExpenseCategory, MiscType,
} from "../contexts/FirmsContext";
import { T, F, EASE, INCOME_CATS, EXPENSE_CATS } from "./theme";
import { fmtFull, today } from "./utils";
import { Button, Input, Select, SelectItem } from "../../../shared/ui/primitives";

function Inp({ value, onChange, placeholder, type = "text", mono }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <Input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={mono ? "font-mono" : undefined} />
  );
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <Select value={value} onValueChange={onChange}>
      {children}
    </Select>
  );
}

function FLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{children}{req && <span style={{ color: T.crimson }}> *</span>}</div>;
}

export function FinSummaryStrip({ income, expenses, misc }: { income: FinancialEntry[]; expenses: FinancialEntry[]; misc: MiscEntry[] }) {
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
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 18, color: s.color }}>{fmtFull(s.val)}</div>
        </div>
      ))}
    </div>
  );
}

export function AddEntryForm({ type, onSave, onCancel }: {
  type: "income" | "expense" | "misc";
  onSave: (data: Omit<FinancialEntry, "id"> | Omit<MiscEntry, "id">) => void;
  onCancel: () => void;
}) {
  const [desc, setDesc]         = React.useState("");
  const [amount, setAmount]     = React.useState("");
  const [date, setDate]         = React.useState(today());
  const [cat, setCat]           = React.useState<string>(type === "income" ? "Wholesale Sale" : type === "expense" ? "Weaver Payments" : "income");
  const [notes, setNotes]       = React.useState("");
  const [otherLabel, setOtherLabel] = React.useState("");
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
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="font-mono" />
        </div>
        <div><FLabel req>{type === "misc" ? "Type" : "Category"}</FLabel>
          <Sel value={cat} onChange={v => { setCat(v); setOtherLabel(""); }}>
            {cats.map(c => <SelectItem key={c} value={c}>{c === "income" ? "Income" : c === "expense" ? "Expense" : c}</SelectItem>)}
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
        <Button onClick={handleSave} disabled={!canSave()} variant="primary" size="sm" iconLeft={Check}>
          Save Entry
        </Button>
        <Button onClick={onCancel} variant="tertiary" size="sm">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

export function ExcelUploadBtn({ onImport, type }: { onImport: (rows: Omit<FinancialEntry, "id">[]) => void; type: "income" | "expense" }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const defaultCat = type === "income" ? "Wholesale Sale" : "Weaver Payments";
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const XLSX = await import("xlsx");
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
      } catch { alert("Could not read Excel file. Please check format."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }
  return (
    <>
      <Input type="file" accept=".xlsx,.xls,.csv" ref={ref} onChange={handleFile} containerClassName="hidden" />
      <Button onClick={() => ref.current?.click()} variant="tertiary" size="sm" iconLeft={FileSpreadsheet}>
        Import Excel
      </Button>
    </>
  );
}

export function EntryRow({ entry, type }: { entry: FinancialEntry | MiscEntry; type?: "income" | "expense" }) {
  const isMisc   = "type" in entry;
  const isIncome = isMisc ? (entry as MiscEntry).type === "income" : (type === "income");
  const cat      = "category" in entry ? entry.category : (entry as MiscEntry).type === "income" ? "Income" : "Expense";
  const catChipBg = isIncome ? T.greenBg : cat === "Factory Maintenance" || cat === "Shop Maintenance" ? "rgba(200,155,71,0.10)" : cat === "Salaries" ? "rgba(74,107,138,0.10)" : T.crimsonBg;
  const catChipColor = isIncome ? T.green : cat === "Factory Maintenance" || cat === "Shop Maintenance" ? "#8B6018" : cat === "Salaries" ? "#2E5A8A" : T.crimson;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 160px 30px", gap: 0, padding: "10px 14px", alignItems: "center", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFDF9" }}>
      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, paddingRight: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description}</div>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: isIncome ? T.green : T.crimson }}>
        {isIncome ? "+" : "−"}₹{entry.amount.toLocaleString("en-IN")}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{entry.date}</div>
      <div>
        <span style={{ display: "inline-block", background: catChipBg, border: `1px solid ${catChipColor}22`, borderRadius: 999, padding: "3px 9px", fontFamily: F.ui, fontSize: 12, color: catChipColor, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 150, textOverflow: "ellipsis" }}>
          {cat}
        </span>
      </div>
      <div />
    </div>
  );
}

export function FinSection({ title, icon, entries, color, bg, onAdd, onBulkImport, type }: {
  title: string; icon: React.ReactNode;
  entries: FinancialEntry[]; color: string; bg: string;
  onAdd: (e: Omit<FinancialEntry, "id">) => void;
  onBulkImport?: (rows: Omit<FinancialEntry, "id">[]) => void;
  type: "income" | "expense";
}) {
  const [open, setOpen]       = React.useState(true);
  const [adding, setAdding]   = React.useState(false);
  const [importMsg, setImportMsg] = React.useState("");
  const total = entries.reduce((s, e) => s + e.amount, 0);
  function handleImport(rows: Omit<FinancialEntry, "id">[]) {
    if (onBulkImport) { onBulkImport(rows); setImportMsg(`${rows.length} row${rows.length > 1 ? "s" : ""} imported`); setTimeout(() => setImportMsg(""), 3000); }
  }
  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: bg, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setOpen(o => !o)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setOpen(o => !o))?.(); } }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, flex: 1 }}>{title}</span>
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color }}>{fmtFull(total)}</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginLeft: 4 }}>({entries.length} entries)</span>
        {open ? <ChevronUp size={15} color={T.taupe} /> : <ChevronDown size={15} color={T.taupe} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 8, alignItems: "center", background: "#FFF" }}>
              <div style={{ ["--fin-color" as string]: color } as React.CSSProperties}>
                <Button onClick={() => setAdding(a => !a)} variant="secondary" size="sm" iconLeft={PlusCircle}
                  className="border-[1.5px] border-[var(--fin-color)] bg-[var(--fin-color)]/[0.07] text-[var(--fin-color)] hover:bg-[var(--fin-color)]/[0.14]">
                  Add Entry
                </Button>
              </div>
              {onBulkImport && <ExcelUploadBtn onImport={handleImport} type={type} />}
              {importMsg && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> {importMsg}</span>}
            </div>
            <AnimatePresence>
              {adding && (
                <div style={{ padding: "12px 14px 0", background: "#FFF" }}>
                  <AddEntryForm type={type} onSave={d => { onAdd(d as Omit<FinancialEntry, "id">); setAdding(false); }} onCancel={() => setAdding(false)} />
                </div>
              )}
            </AnimatePresence>
            {entries.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 160px 30px", gap: 0, padding: "8px 14px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
                {["Description", "Amount", "Date", "Category", ""].map((h, i) => (
                  <div key={i} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
            )}
            {entries.length === 0 && !adding ? (
              <div style={{ padding: "24px 18px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe, background: "#FFF" }}>
                No {title.toLowerCase()} recorded yet. Add entries manually or import from Excel.
              </div>
            ) : (
              <div style={{ background: "#FFF" }}>
                {entries.map(e => <EntryRow key={e.id} entry={e} type={type} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MiscSection({ entries, onAdd }: { entries: MiscEntry[]; onAdd: (e: Omit<MiscEntry, "id">) => void }) {
  const [open, setOpen]     = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const totalInc = entries.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const totalExp = entries.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: T.bgGold, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setOpen(o => !o)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setOpen(o => !o))?.(); } }}>
        <Minus size={16} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, flex: 1 }}>Extra / Miscellaneous Payments</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green }}>{fmtFull(totalInc)} in</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 4px" }}>·</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>{fmtFull(totalExp)} out</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginLeft: 4 }}>({entries.length})</span>
        {open ? <ChevronUp size={15} color={T.taupe} /> : <ChevronDown size={15} color={T.taupe} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 8, background: "#FFF" }}>
              <Button onClick={() => setAdding(a => !a)} variant="secondary" size="sm" iconLeft={PlusCircle}
                className="border-[1.5px] border-[#C89B47] bg-[#C89B47]/10 text-[#C89B47] hover:bg-[#C89B47]/20">
                Add Misc Entry
              </Button>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, alignSelf: "center" }}>Manual entry only — specify income or expense per row</span>
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
                  <div key={i} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
            )}
            {entries.length === 0 && !adding ? (
              <div style={{ padding: "24px 18px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe, background: "#FFF" }}>No miscellaneous entries yet.</div>
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
