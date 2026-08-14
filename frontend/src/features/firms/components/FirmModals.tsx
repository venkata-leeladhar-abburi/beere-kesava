import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Edit, X, Building2, CreditCard, User, Phone,
  MapPin, Hash, IndianRupee, Check,
  TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";
import {
  useFirms, Firm, FinancialEntry,
} from "../contexts/FirmsContext";
import { T, F } from "./theme";
import { fmtAmt, initials, cardColor } from "./utils";
import {
  FinSummaryStrip, FinSection, MiscSection
} from "./FirmFinanceSections";
import { Button, IconButton, Field as PField, Input, Textarea } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ height: 1, width: 24, background: T.borderDef }} />
      {children}
      <div style={{ flex: 1, height: 1, background: T.borderDef }} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required, textarea, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; textarea?: boolean; icon?: React.ComponentProps<typeof Input>["iconLeft"];
}) {
  return (
    <PField label={label} required={required}>
      {textarea ? (
        <Textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} iconLeft={icon} />
      )}
    </PField>
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
    <Modal open onOpenChange={o => !o && onClose()} size="md">
        <div style={{ background: T.darkBurgundy, borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(200,155,71,0.7)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>FIRMS MANAGEMENT</div>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{title}</div>
            </Dialog.Title>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="secondary" size="sm" />
          </Dialog.Close>
        </div>
        <div style={{ padding: "28px 28px 32px", overflowY: "auto" }}>
          <SLabel>Basic Information</SLabel>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Firm Name" value={form.firmName} onChange={v => set("firmName", v)} placeholder="e.g. Surat Zari Works" required icon={Building2} />
            </div>
            <Field label="GST Number" value={form.gstNumber ?? ""} onChange={v => set("gstNumber", v)} placeholder="29ABCDE1234F1Z5" icon={Hash} />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Field label="Total Purchase Amount (INR)" value={form.purchaseAmount?.toString() ?? ""} onChange={v => set("purchaseAmount", v)} type="number" placeholder="e.g. 1500000" icon={IndianRupee} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Address" value={form.address ?? ""} onChange={v => set("address", v)} placeholder="Street, City, State, PIN" textarea icon={MapPin} />
            </div>
          </div>
          <SLabel>Bank Details</SLabel>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Bank Name" value={form.bankName ?? ""} onChange={v => set("bankName", v)} placeholder="e.g. State Bank of India" icon={CreditCard} />
            </div>
            <Field label="Account Number" value={form.accountNumber ?? ""} onChange={v => set("accountNumber", v)} placeholder="e.g. 001234567890" />
            <Field label="IFSC Code" value={form.ifscCode ?? ""} onChange={v => set("ifscCode", v)} placeholder="e.g. SBIN0001234" />
          </div>
          <SLabel>Contact Person</SLabel>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14, marginBottom: 28 }}>
            <Field label="Contact Person Name" value={form.contactPersonName ?? ""} onChange={v => set("contactPersonName", v)} placeholder="Full name" icon={User} />
            <Field label="Phone Number" value={form.contactPersonPhone ?? ""} onChange={v => set("contactPersonPhone", v)} placeholder="9876543210" type="tel" icon={Phone} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="lg" className="flex-[2]" disabled={!form.firmName.trim()} iconLeft={saved ? Check : undefined} onClick={handleSave}>
              {saved ? "Saved!" : title}
            </Button>
          </div>
        </div>
    </Modal>
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
        <span style={{ fontFamily: mono ? "var(--font-mono)" : F.ui, fontSize: 13, color: T.luxuryBrown, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
      </div>
    );
  }
  return (
    <Modal open onOpenChange={o => !o && onClose()} size="lg">
        <div style={{ background: color, borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>{initials(firm.firmName)}</span>
          </div>
          <div style={{ flex: 1 }}>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF", lineHeight: 1.2 }}>{firm.firmName}</div>
            </Dialog.Title>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,0.60)", letterSpacing: "1px", marginTop: 3 }}>{firm.id} · Added {firm.createdAt}</div>
          </div>
          <Button variant="secondary" size="sm" iconLeft={Edit} className="text-white border-white/25 bg-white/10 hover:bg-white/20" onClick={() => { onClose(); onEdit(); }}>
            Edit
          </Button>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="secondary" size="sm" className="text-white border-white/20 bg-white/10 hover:bg-white/20" />
          </Dialog.Close>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0, background: "#FFF" }}>
          {[{ key: "finance", label: "Financial Tracking" }, { key: "info", label: "Firm Info" }].map(t => (
            <div key={t.key} style={{ flex: 1, borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent" }}>
              <Button variant="ghost" size="md" className="w-full h-[46px] rounded-none" onClick={() => setTab(t.key as "info" | "finance")}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe }}>
                  {t.label}
                </span>
              </Button>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 28px" }}>
          {tab === "info" && (
            <div>
              {firm.purchaseAmount && (
                <div style={{ background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Total Purchase Amount</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: T.antiqueGold }}>{fmtAmt(firm.purchaseAmount)}</span>
                </div>
              )}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>Firm Details</div>
              <Row label="GST Number" value={firm.gstNumber} mono />
              <Row label="Address" value={firm.address} />
              {(firm.bankName || firm.accountNumber || firm.ifscCode) && (
                <>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 4, marginTop: 18 }}>Bank Details</div>
                  <Row label="Bank Name" value={firm.bankName} />
                  <Row label="Account Number" value={firm.accountNumber} mono />
                  <Row label="IFSC Code" value={firm.ifscCode} mono />
                </>
              )}
              {(firm.contactPersonName || firm.contactPersonPhone) && (
                <>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 4, marginTop: 18 }}>Contact Person</div>
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
    </Modal>
  );
}
