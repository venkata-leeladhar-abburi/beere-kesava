import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, TrendingUp, TrendingDown, PlusCircle, FileSpreadsheet, ChevronDown, ChevronUp, Minus,
  AlertTriangle, Pencil, Trash2,
} from "lucide-react";
import {
  FinancialEntry, MiscEntry, IncomeCategory, ExpenseCategory, MiscType,
} from "../contexts/FirmsContext";
import type { DuplicateMatch } from "./duplicateEntries";
import { T, F, EASE, INCOME_CATS, EXPENSE_CATS } from "./theme";
import { fmtFull, today } from "./utils";
import { Button, IconButton, Input, NumberInput, Select, SelectItem } from "../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../shared/ui/date";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toPaise, fromPaise } from "@/lib/gst";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";

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
    <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 0, border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden", marginBottom: 22 }}>
      {[
        { label: "Total Income", val: totalInc, color: T.green,   bg: T.greenBg,   icon: <TrendingUp size={16} color={T.green} /> },
        { label: "Total Expenses", val: totalExp, color: T.crimson, bg: T.crimsonBg, icon: <TrendingDown size={16} color={T.crimson} /> },
        { label: "Net Balance", val: net, color: net >= 0 ? T.green : T.crimson, bg: net >= 0 ? T.greenBg : T.crimsonBg, icon: net >= 0 ? <TrendingUp size={16} color={net >= 0 ? T.green : T.crimson} /> : <TrendingDown size={16} color={T.crimson} /> },
      ].map((s, i) => (
        <div key={s.label} style={{ padding: "14px 18px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", background: s.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            {s.icon}
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: s.color }}>{fmtFull(s.val)}</div>
        </div>
      ))}
    </div>
  );
}

export function AddEntryForm({ type, onSave, onCancel, initial, saveLabel }: {
  type: "income" | "expense" | "misc";
  onSave: (data: Omit<FinancialEntry, "id"> | Omit<MiscEntry, "id">) => void;
  onCancel: () => void;
  /** Present when correcting an existing row rather than adding a new one. */
  initial?: FinancialEntry | MiscEntry;
  saveLabel?: string;
}) {
  const initialCat = initial
    ? ("type" in initial ? initial.type : initial.category)
    : type === "income" ? "Wholesale Sale" : type === "expense" ? "Weaver Payments" : "income";
  // A saved "Other — Commission" category has to be split back into the
  // dropdown value plus its free-text half, or editing such a row would
  // silently rewrite the category to a literal "Other — Commission" option
  // that doesn't exist in the list.
  const savedOther = typeof initialCat === "string" && initialCat.startsWith("Other — ");

  const [desc, setDesc]         = React.useState(initial?.description ?? "");
  const [amount, setAmount]     = React.useState(initial ? String(initial.amount) : "");
  // Normalised to YYYY-MM-DD: a stored entry's date arrives as a full ISO
  // timestamp, which the date input can't round-trip as-is.
  const [date, setDate]         = React.useState(initial?.date ? initial.date.slice(0, 10) : today());
  const [cat, setCat]           = React.useState<string>(savedOther ? "Other" : String(initialCat));
  const [notes, setNotes]       = React.useState(initial && "notes" in initial ? initial.notes ?? "" : "");
  const [otherLabel, setOtherLabel] = React.useState(savedOther ? String(initialCat).slice("Other — ".length) : "");
  const isOther = cat === "Other" && type !== "misc";
  function canSave() { return desc.trim() && toPaise(Number(amount) || 0) > 0 && date && (!isOther || otherLabel.trim()); }
  function handleSave() {
    if (!canSave()) return;
    const finalCat = isOther ? `Other — ${otherLabel.trim()}` : cat;
    const amountValue = fromPaise(toPaise(Number(amount) || 0));
    if (type === "misc") {
      onSave({ description: desc.trim(), amount: amountValue, date, notes: notes.trim() || undefined, type: cat as MiscType });
    } else {
      onSave({ description: desc.trim(), amount: amountValue, date, category: finalCat as IncomeCategory | ExpenseCategory });
    }
  }
  const cats = type === "income" ? INCOME_CATS : type === "expense" ? EXPENSE_CATS : ["income", "expense"];
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: EASE }}
      style={{ background: "#FFF", border: `1.5px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
      <div className={isOther ? "grid grid-cols-1 md:grid-cols-[1fr_130px_140px_160px_200px]" : "grid grid-cols-1 md:grid-cols-[1fr_130px_140px_160px]"} style={{ gap: 10, marginBottom: 10 }}>
        <div><FLabel req>Description</FLabel><Inp value={desc} onChange={setDesc} placeholder="Enter description…" /></div>
        <div><FLabel req>Amount (₹)</FLabel><NumberInput value={amount === "" ? "" : Number(amount)} onValueChange={v => setAmount(v === "" ? "" : String(v))} placeholder="0" className="font-mono" /></div>
        <div><FLabel req>Date</FLabel>
          <DatePicker value={date ? new Date(date) : null} onChange={d => setDate(d ? formatDate(d, "iso") : "")} />
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
          {saveLabel ?? "Save Entry"}
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
            amount: fromPaise(toPaise(Number(String(r["Amount"]).replace(/[^0-9.]/g, "")) || 0)),
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

/**
 * Migrated onto <DataTable> — design-system/04-DATA-DISPLAY.md Part S.
 * Was a hand-rolled grid-as-table (header divs + EntryRow grid divs) with no
 * <th>/<table> semantics; every cell keeps its original font/colour/format
 * via a `cell` override. Header row now uses DataTable's 12px Inter spec.
 */
function EntryTable({ entries, type, duplicates, onEdit, onDelete }: {
  entries: (FinancialEntry | MiscEntry)[];
  type?: "income" | "expense";
  /** entry id → the auto-tracked payment it appears to restate. */
  duplicates?: Map<string, DuplicateMatch>;
  onEdit?: (entry: FinancialEntry | MiscEntry) => void;
  onDelete?: (entry: FinancialEntry | MiscEntry) => void;
}) {
  function isIncomeOf(entry: FinancialEntry | MiscEntry): boolean {
    const isMisc = "type" in entry;
    return isMisc ? (entry as MiscEntry).type === "income" : (type === "income");
  }
  function catOf(entry: FinancialEntry | MiscEntry): string {
    return "category" in entry ? entry.category : (entry as MiscEntry).type === "income" ? "Income" : "Expense";
  }

  const columns: ColumnDef<FinancialEntry | MiscEntry>[] = [
    {
      id: "description", header: "Description", accessor: e => e.description, priority: 1,
      cell: (_v, e) => {
        const dup = duplicates?.get(e.id);
        return (
          <div>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, wordBreak: "break-word", lineHeight: 1.45, display: "block" }}>
              {e.description}
            </span>
            {dup && (
              <span
                title={`Matches the auto-tracked payment ${dup.payment.reference} to ${dup.payment.party} on ${dup.payment.date}. If this manual row was typed to record that same payment, delete it — otherwise both are counted.`}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.35)", borderRadius: 999, padding: "2px 9px", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#8B6018" }}
              >
                <AlertTriangle size={11} /> Possible duplicate of {dup.payment.reference}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "amount", header: "Amount", accessor: e => e.amount,
      cell: (_v, e) => {
        const isIncome = isIncomeOf(e);
        return (
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: isIncome ? T.green : T.crimson }}>
            {isIncome ? "+" : "−"}{formatMoney(rupees(e.amount))}
          </span>
        );
      },
    },
    {
      // The backend stores a full DateTime, so `e.date` arrives as an ISO
      // timestamp — rendering it raw printed "2026-08-11T00:00:00.000Z" in
      // the cell. Formatted here rather than at the edge because the raw
      // value is still what the edit form and date filters read.
      id: "date", header: "Date", accessor: e => e.date, priority: 3,
      cell: (_v, e) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
          {formatDate(new Date(e.date), "cell") || e.date}
        </span>
      ),
    },
    {
      id: "category", header: type ? "Category" : "Type", accessor: e => catOf(e),
      cell: (_v, e) => {
        const isIncome = isIncomeOf(e);
        const cat = catOf(e);
        const catChipBg = isIncome ? T.greenBg : cat === "Factory Maintenance" || cat === "Shop Maintenance" ? "rgba(200,155,71,0.10)" : cat === "Salaries" ? "rgba(74,107,138,0.10)" : T.crimsonBg;
        const catChipColor = isIncome ? T.green : cat === "Factory Maintenance" || cat === "Shop Maintenance" ? "#8B6018" : cat === "Salaries" ? "#2E5A8A" : T.crimson;
        return (
          <span style={{ display: "inline-block", background: catChipBg, border: `1px solid ${catChipColor}22`, borderRadius: 999, padding: "3px 9px", fontFamily: F.ui, fontSize: 12, color: catChipColor, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 180, textOverflow: "ellipsis" }}>
            {cat}
          </span>
        );
      },
    },
    ...(onEdit || onDelete ? [{
      id: "actions", header: "", type: "actions" as const, accessor: () => null,
      cell: (_v: unknown, e: FinancialEntry | MiscEntry) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {onEdit && (
            <IconButton icon={Pencil} label={`Edit "${e.description}"`} variant="ghost" size="sm" onClick={() => onEdit(e)} />
          )}
          {onDelete && (
            <IconButton
              icon={Trash2}
              label={`Delete "${e.description}"`}
              variant="ghost"
              size="sm"
              onClick={() => onDelete(e)}
              className="text-[var(--text-danger)] hover:bg-[rgba(192,57,43,0.10)]"
            />
          )}
        </div>
      ),
    } as ColumnDef<FinancialEntry | MiscEntry>] : []),
  ];

  return (
    <DataTable
      responsive
      columns={columns}
      data={entries}
      getRowId={e => e.id}
    />
  );
}

export function FinSection({ title, icon, entries, color, bg: _bg, onAdd, onBulkImport, type, duplicates, onUpdate, onDelete }: {
  title: string; icon: React.ReactNode;
  entries: FinancialEntry[]; color: string; bg: string;
  onAdd: (e: Omit<FinancialEntry, "id">) => void;
  onBulkImport?: (rows: Omit<FinancialEntry, "id">[]) => void;
  type: "income" | "expense";
  duplicates?: Map<string, DuplicateMatch>;
  onUpdate?: (entryId: string, e: Omit<FinancialEntry, "id">) => void;
  onDelete?: (entry: FinancialEntry) => void;
}) {
  const [open, setOpen]       = React.useState(true);
  const [adding, setAdding]   = React.useState(false);
  const [editing, setEditing] = React.useState<FinancialEntry | null>(null);
  const [importMsg, setImportMsg] = React.useState("");
  const dupCount = duplicates ? entries.filter(e => duplicates.has(e.id)).length : 0;
  const total = entries.reduce((s, e) => s + e.amount, 0);
  function handleImport(rows: Omit<FinancialEntry, "id">[]) {
    if (onBulkImport) { onBulkImport(rows); setImportMsg(`${rows.length} row${rows.length > 1 ? "s" : ""} imported`); setTimeout(() => setImportMsg(""), 3000); }
  }
  return (
    <div className="mb-6 rounded-2xl border border-[#E8DCC4] overflow-hidden bg-white shadow-sm">
      <div
        className="bg-[#6E0F2D] p-4 sm:px-6 sm:py-4.5 text-white flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
        role="button"
        // The section title is the accessible name; the rule can't see it
        // through the nested heading, and aria-expanded tells a screen reader
        // whether the panel below is currently open.
        aria-label={title}
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <span style={{ color: "#F5E8D0" }}>{icon}</span>
          </div>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FFFDF9] leading-snug">{title}</h3>
            <p className="text-xs text-white/70 mt-0.5">{type === "income" ? "Manual income entries" : "Manual expense entries"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <span className={`font-mono font-bold text-base ${type === "income" ? "text-emerald-300" : "text-rose-300"}`}>{fmtFull(total)}</span>
            <span className="text-xs text-white/70 ml-2">({entries.length} {entries.length === 1 ? "entry" : "entries"})</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 shrink-0">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#FFF" }}>
              <div style={{ ["--fin-color" as string]: color } as React.CSSProperties}>
                <Button onClick={() => setAdding(a => !a)} variant="secondary" size="sm" iconLeft={PlusCircle}
                  className="border-[1.5px] border-[var(--fin-color)] bg-[var(--fin-color)]/[0.07] text-[var(--fin-color)] hover:bg-[var(--fin-color)]/[0.14]">
                  Add Entry
                </Button>
              </div>
              {onBulkImport && <ExcelUploadBtn onImport={handleImport} type={type} />}
              {importMsg && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> {importMsg}</span>}
            </div>
            {dupCount > 0 && (
              <div style={{ margin: "12px 14px 14px", padding: "12px 16px", background: "rgba(200,155,71,0.10)", border: "1px solid rgba(200,155,71,0.32)", borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <AlertTriangle size={15} color="#8B6018" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "#7A5514", lineHeight: 1.6 }}>
                  <strong>{dupCount} manual {dupCount === 1 ? "entry" : "entries"} may double-count a payment.</strong>{" "}
                  These look like they were typed by hand to record a payment that is now tracked automatically under Recorded Payments —
                  so the amount is being counted twice. Check the flagged rows below and delete the manual copy if it&rsquo;s the same payment.
                </div>
              </div>
            )}
            <AnimatePresence>
              {adding && (
                <div style={{ padding: "12px 14px 0", background: "#FFF" }}>
                  <AddEntryForm type={type} onSave={d => { onAdd(d as Omit<FinancialEntry, "id">); setAdding(false); }} onCancel={() => setAdding(false)} />
                </div>
              )}
              {editing && (
                <div style={{ padding: "12px 14px 0", background: "#FFF" }}>
                  <AddEntryForm
                    type={type}
                    initial={editing}
                    saveLabel="Save Changes"
                    onSave={d => { onUpdate?.(editing.id, d as Omit<FinancialEntry, "id">); setEditing(null); }}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )}
            </AnimatePresence>
            {entries.length === 0 && !adding ? (
              <div style={{ padding: "24px 18px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe, background: "#FFF" }}>
                No {title.toLowerCase()} recorded yet. Add entries manually or import from Excel.
              </div>
            ) : entries.length > 0 && (
              <div style={{ background: "#FFF" }}>
                <EntryTable
                  entries={entries}
                  type={type}
                  duplicates={duplicates}
                  onEdit={onUpdate ? e => { setAdding(false); setEditing(e as FinancialEntry); } : undefined}
                  onDelete={onDelete ? e => onDelete(e as FinancialEntry) : undefined}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MiscSection({ entries, onAdd, onUpdate, onDelete }: {
  entries: MiscEntry[];
  onAdd: (e: Omit<MiscEntry, "id">) => void;
  onUpdate?: (entryId: string, e: Omit<MiscEntry, "id">) => void;
  onDelete?: (entry: MiscEntry) => void;
}) {
  const [open, setOpen]     = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<MiscEntry | null>(null);
  const totalInc = entries.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const totalExp = entries.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  return (
    <div className="mb-6 rounded-2xl border border-[#E8DCC4] overflow-hidden bg-white shadow-sm">
      <div
        className="bg-[#6E0F2D] p-4 sm:px-6 sm:py-4.5 text-white flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
        role="button"
        // The section title is the accessible name; the rule can't see it
        // through the nested heading, and aria-expanded tells a screen reader
        // whether the panel below is currently open.
        aria-label="Extra / Miscellaneous Payments"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Minus size={20} className="text-[#F5E8D0]" />
          </div>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FFFDF9] leading-snug">Extra / Miscellaneous Payments</h3>
            <p className="text-xs text-white/70 mt-0.5">Manual entries for auxiliary cash flows</p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-emerald-300">+{fmtFull(totalInc)}</span>
            <span className="text-xs text-white/40">·</span>
            <span className="font-mono font-bold text-sm text-rose-300">−{fmtFull(totalExp)}</span>
            <span className="text-xs text-white/70 ml-1">({entries.length})</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 shrink-0">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
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
              {editing && (
                <div style={{ padding: "12px 14px 0", background: "#FFF" }}>
                  <AddEntryForm
                    type="misc"
                    initial={editing}
                    saveLabel="Save Changes"
                    onSave={d => { onUpdate?.(editing.id, d as Omit<MiscEntry, "id">); setEditing(null); }}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )}
            </AnimatePresence>
            {entries.length === 0 && !adding ? (
              <div style={{ padding: "24px 18px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe, background: "#FFF" }}>No miscellaneous entries yet.</div>
            ) : entries.length > 0 && (
              <div style={{ background: "#FFF" }}>
                <EntryTable
                  entries={entries}
                  onEdit={onUpdate ? e => { setAdding(false); setEditing(e as MiscEntry); } : undefined}
                  onDelete={onDelete ? e => onDelete(e as MiscEntry) : undefined}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
