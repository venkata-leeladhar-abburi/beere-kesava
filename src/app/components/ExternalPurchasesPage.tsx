import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  X,
  Plus,
  Printer,
  Tag,
  Save,
} from "lucide-react";
import { SariTagPrintModal } from "./SariTagPrintModal";
import { SareeTypeCard, SareeTypeRecord, INITIAL_RATES, getSareeTypeByCode } from "./RatesPricingPage";

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const T = {
  silkCream: "#F7F2EA",
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47",
  goldLight: "#E7C983",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  taupe: "#8B7060",
  green: "#1E6640",
  greenBg: "rgba(30,102,64,0.09)",
  crimson: "#C0392B",
  crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};

const SAREE_TYPES = ["Plain Silk", "Kanjivaram", "Banarasi", "Mysore Silk", "Patola"];
const CONDITIONS = ["Perfect", "Minor Defect", "Damaged"] as const;
type Condition = (typeof CONDITIONS)[number];

interface SareeTag {
  id: string;
  weight: string;
  date: string;
  sareeType: string;
  sareeTypeCode: string;
  condition: Condition;
  notes: string;
}

interface Purchase {
  id: string;
  supplier: string;
  location: string;
  date: string;
  sareeType: string;
  sareeCount: number;
  gstNumber: string;
  invoiceNumber: string;
  billAmount: string;
  deduction: number;
  status: string;
  addedBy: string;
  notes: string;
  sarees: SareeTag[];
}

function weightFor(i: number) {
  const w = 680 + ((i * 37) % 220);
  return `${w}g`;
}

function parseCurrency(v: string): number {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatINR(n: number): string {
  return "₹" + Math.max(0, n).toLocaleString("en-IN");
}

function generateSarees(
  purchaseId: string,
  count: number,
  date: string,
  sareeType: string
): SareeTag[] {
  const defaultCode = INITIAL_RATES.find((r) => r.type === sareeType)?.code
    ?? INITIAL_RATES[0].code;
  return Array.from({ length: count }, (_, i) => ({
    id: `${purchaseId}-${String(i + 1).padStart(3, "0")}`,
    weight: weightFor(i),
    date,
    sareeType,
    sareeTypeCode: defaultCode,
    condition: "Perfect" as Condition,
    notes: "",
  }));
}

const INITIAL_RAW = [
  {
    id: "EXT-2026-0001",
    supplier: "Ravi Silks",
    location: "Dharmavaram, AP",
    date: "01 Jun 2026",
    sareeType: "Plain Silk",
    sareeCount: 4,
    gstNumber: "37ABCRS1234F1Z5",
    invoiceNumber: "INV-RS-2026-118",
    billAmount: "₹34,000",
    deduction: 800,
    status: "Paid",
    addedBy: "Admin (BK)",
    notes: "Fresh stock for summer season",
  },
  {
    id: "EXT-2026-0002",
    supplier: "Mysore Sarees",
    location: "Mysore, KA",
    date: "05 Jun 2026",
    sareeType: "Mysore Silk",
    sareeCount: 12,
    gstNumber: "29MYSRS5678K1Z2",
    invoiceNumber: "INV-MS-2026-552",
    billAmount: "₹74,400",
    deduction: 0,
    status: "Pending",
    addedBy: "Admin (RK)",
    notes: "Awaiting full payment",
  },
  {
    id: "EXT-2026-0003",
    supplier: "Chennai Silks",
    location: "Chennai, TN",
    date: "08 Jun 2026",
    sareeType: "Kanjivaram",
    sareeCount: 6,
    gstNumber: "33CHNSK9012L1Z8",
    invoiceNumber: "INV-CS-2026-073",
    billAmount: "₹66,000",
    deduction: 1200,
    status: "Partial",
    addedBy: "Admin (MK)",
    notes: "First instalment paid",
  },
  {
    id: "EXT-2026-0004",
    supplier: "Kanchipuram House",
    location: "Kanchipuram, TN",
    date: "10 Jun 2026",
    sareeType: "Kanjivaram",
    sareeCount: 8,
    gstNumber: "33KNCH3456M1Z1",
    invoiceNumber: "INV-KH-2026-209",
    billAmount: "₹88,000",
    deduction: 0,
    status: "Paid",
    addedBy: "Admin (BK)",
    notes: "",
  },
  {
    id: "EXT-2026-0005",
    supplier: "Venkateshwara Handlooms",
    location: "Ongole, AP",
    date: "11 Jun 2026",
    sareeType: "Plain Silk",
    sareeCount: 3,
    gstNumber: "37VENK7890N1Z6",
    invoiceNumber: "INV-VH-2026-014",
    billAmount: "₹22,500",
    deduction: 500,
    status: "Paid",
    addedBy: "Admin (RK)",
    notes: "Trial batch",
  },
  {
    id: "EXT-2026-0006",
    supplier: "Pochampally Coop",
    location: "Pochampally, TG",
    date: "11 Jun 2026",
    sareeType: "Patola",
    sareeCount: 15,
    gstNumber: "36POCH2345P1Z9",
    invoiceNumber: "INV-PC-2026-301",
    billAmount: "₹1,20,000",
    deduction: 0,
    status: "Pending",
    addedBy: "Superadmin",
    notes: "Inter-branch transfer",
  },
];

const INITIAL_PURCHASES: Purchase[] = INITIAL_RAW.map((p) => ({
  ...p,
  sarees: generateSarees(p.id, p.sareeCount, p.date, p.sareeType),
}));

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    Paid: { color: "#1E6640", bg: "rgba(30,102,64,0.09)" },
    Pending: { color: "rgba(230,126,34,1)", bg: "rgba(230,126,34,0.12)" },
    Partial: { color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
  };
  const s = styles[status] || { color: T.taupe, bg: T.cream };
  return (
    <span
      style={{
        fontFamily: F.ui,
        fontWeight: 600,
        fontSize: 11,
        color: s.color,
        background: s.bg,
        borderRadius: 999,
        padding: "3px 10px",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: `1px solid ${T.borderDef}`,
  background: "#FFF8F0",
  fontFamily: F.ui,
  fontSize: 13,
  padding: "0 12px",
  color: T.luxuryBrown,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontWeight: 600,
  fontSize: 12,
  color: T.luxuryBrown,
  display: "block",
  marginBottom: 6,
};

interface FormState {
  supplier: string;
  location: string;
  date: string;
  sareeType: string;
  sareeCount: string;
  gstNumber: string;
  invoiceNumber: string;
  billAmount: string;
  deduction: string;
  status: string;
  addedBy: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  supplier: "",
  location: "",
  date: "",
  sareeType: SAREE_TYPES[0],
  sareeCount: "1",
  gstNumber: "",
  invoiceNumber: "",
  billAmount: "",
  deduction: "0",
  status: "Pending",
  addedBy: "Admin",
  notes: "",
};

function PurchaseFormModal({
  mode,
  initial,
  initialSarees,
  previewId,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit";
  initial: FormState;
  initialSarees: SareeTag[];
  previewId: string;
  onClose: () => void;
  onSubmit: (data: FormState, sarees: SareeTag[]) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [sareeDetails, setSareeDetails] = useState<SareeTag[]>(initialSarees);
  const [viewSareeType, setViewSareeType] = useState<SareeTypeRecord | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addSareeRow = () => {
    const seq = sareeDetails.length + 1;
    setSareeDetails((prev) => [
      ...prev,
      {
        id: `${previewId}-${String(seq).padStart(3, "0")}`,
        weight: "",
        date: form.date || "—",
        sareeType: INITIAL_RATES[0].type,
        sareeTypeCode: INITIAL_RATES[0].code,
        condition: "Perfect",
        notes: "",
      },
    ]);
  };
  const removeSareeRow = (id: string) =>
    setSareeDetails((prev) => prev.filter((s) => s.id !== id));
  const updateSareeRow = (id: string, patch: Partial<SareeTag>) =>
    setSareeDetails((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        if (patch.sareeTypeCode) {
          const rec = INITIAL_RATES.find((r) => r.code === patch.sareeTypeCode);
          if (rec) next.sareeType = rec.type;
        }
        return next;
      })
    );

  const billNum = parseCurrency(form.billAmount);
  const deductionNum = parseCurrency(form.deduction) || 0;
  const netAmount = billNum - deductionNum;

  const valid =
    form.supplier.trim() !== "" &&
    form.location.trim() !== "" &&
    form.date.trim() !== "" &&
    sareeDetails.length > 0;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(27,12,8,0.55)",
            backdropFilter: "blur(4px)",
          }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(92vw, 620px)",
            maxHeight: "88vh",
            background: "#FFFFFF",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: T.darkBurgundy,
              padding: "18px 26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>
              {mode === "add" ? "Add External Purchase" : `Edit Purchase — ${initial.supplier}`}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "none",
                color: "#FFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Supplier Name</label>
                <input
                  style={inputStyle}
                  value={form.supplier}
                  onChange={(e) => set("supplier", e.target.value)}
                  placeholder="e.g. Ravi Silks"
                />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input
                  style={inputStyle}
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Dharmavaram, AP"
                />
              </div>
              <div>
                <label style={labelStyle}>Purchase Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Saree Type</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.sareeType}
                  onChange={(e) => set("sareeType", e.target.value)}
                >
                  {SAREE_TYPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Number of Sarees</label>
                <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: T.taupe, background: T.cream }}>
                  {sareeDetails.length} saree{sareeDetails.length !== 1 ? "s" : ""} added below
                </div>
              </div>
              <div>
                <label style={labelStyle}>Payment Status</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Partial</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>GST Number</label>
                <input
                  style={{ ...inputStyle, fontFamily: F.mono }}
                  value={form.gstNumber}
                  onChange={(e) => set("gstNumber", e.target.value.toUpperCase())}
                  placeholder="e.g. 37ABCRS1234F1Z5"
                />
              </div>
              <div>
                <label style={labelStyle}>Invoice Number</label>
                <input
                  style={{ ...inputStyle, fontFamily: F.mono }}
                  value={form.invoiceNumber}
                  onChange={(e) => set("invoiceNumber", e.target.value)}
                  placeholder="e.g. INV-2026-118"
                />
              </div>
              <div>
                <label style={labelStyle}>Bill Amount</label>
                <input
                  style={inputStyle}
                  value={form.billAmount}
                  onChange={(e) => set("billAmount", e.target.value)}
                  placeholder="e.g. ₹34,000"
                />
              </div>
              <div>
                <label style={labelStyle}>Deduction Amount (₹)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.deduction}
                  onChange={(e) => set("deduction", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={labelStyle}>Added By</label>
                <input
                  style={inputStyle}
                  value={form.addedBy}
                  onChange={(e) => set("addedBy", e.target.value)}
                />
              </div>
            </div>

            {/* Computed net amount */}
            <div
              style={{
                marginTop: 14,
                background: T.silkCream,
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
                Bill Amount − Deduction = Net Amount
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>
                {formatINR(netAmount)}
              </span>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }}
              />
            </div>

            {/* Saree Details — per-saree entry */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>
                  Saree Details ({sareeDetails.length})
                </span>
                <button
                  onClick={addSareeRow}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: T.royalBurgundy,
                    color: "#FFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontFamily: F.ui,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={12} />
                  Add Saree
                </button>
              </div>

              {sareeDetails.length === 0 && (
                <div
                  style={{
                    background: T.silkCream,
                    borderRadius: 10,
                    padding: "14px",
                    textAlign: "center",
                    fontFamily: F.ui,
                    fontSize: 12.5,
                    color: T.taupe,
                  }}
                >
                  No sarees added yet. Click "Add Saree" to enter details for each saree in this purchase.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sareeDetails.map((s) => {
                  const rec = getSareeTypeByCode(s.sareeTypeCode);
                  return (
                    <div
                      key={s.id}
                      style={{
                        border: `1px solid ${T.borderDef}`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        background: T.warmIvory,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy }}>
                          {s.id}
                        </span>
                        <button
                          onClick={() => removeSareeRow(s.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, display: "flex", alignItems: "center" }}
                          title="Remove saree"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>Saree Type Code</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <select
                              style={{ ...inputStyle, cursor: "pointer", height: 36, fontSize: 12 }}
                              value={s.sareeTypeCode}
                              onChange={(e) => updateSareeRow(s.id, { sareeTypeCode: e.target.value })}
                            >
                              {INITIAL_RATES.map((r) => (
                                <option key={r.code} value={r.code}>
                                  {r.type} ({r.code})
                                </option>
                              ))}
                            </select>
                            {rec && (
                              <button
                                onClick={() => setViewSareeType(rec)}
                                title="View saree type details"
                                style={{
                                  flexShrink: 0,
                                  height: 36,
                                  padding: "0 10px",
                                  background: "rgba(200,155,71,0.13)",
                                  border: `1px solid ${T.borderGold}`,
                                  borderRadius: 8,
                                  fontFamily: F.mono,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: T.luxuryBrown,
                                  cursor: "pointer",
                                }}
                              >
                                {rec.code}
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Weight (grams)</label>
                          <input
                            type="number"
                            style={{ ...inputStyle, height: 36, fontSize: 12 }}
                            value={s.weight.replace(/g$/, "")}
                            onChange={(e) => updateSareeRow(s.id, { weight: `${e.target.value}g` })}
                            placeholder="e.g. 820"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Condition</label>
                          <select
                            style={{ ...inputStyle, cursor: "pointer", height: 36, fontSize: 12 }}
                            value={s.condition}
                            onChange={(e) => updateSareeRow(s.id, { condition: e.target.value as Condition })}
                          >
                            {CONDITIONS.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Notes (optional)</label>
                        <textarea
                          value={s.notes}
                          onChange={(e) => updateSareeRow(s.id, { notes: e.target.value })}
                          rows={2}
                          style={{ ...inputStyle, height: "auto", padding: "8px 12px", fontSize: 12, resize: "vertical" as const }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "16px 26px",
              borderTop: `1px solid ${T.borderDef}`,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <button
              disabled={!valid}
              onClick={() => valid && onSubmit({ ...form, sareeCount: String(sareeDetails.length) }, sareeDetails)}
              style={{
                flex: 1,
                background: valid ? T.royalBurgundy : "rgba(110,15,45,0.30)",
                color: "white",
                border: "none",
                borderRadius: 999,
                padding: "11px 0",
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 14,
                cursor: valid ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Save size={15} />
              {mode === "add" ? "Add Purchase & Generate Barcodes" : "Save Changes"}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: "0 0 auto",
                background: "transparent",
                color: T.taupe,
                border: `1px solid ${T.borderDef}`,
                borderRadius: 999,
                padding: "11px 22px",
                fontFamily: F.ui,
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
      {viewSareeType && <SareeTypeCard sareeType={viewSareeType} onClose={() => setViewSareeType(null)} />}
    </AnimatePresence>
  );
}

const CONDITION_CFG: Record<Condition, { color: string; bg: string }> = {
  Perfect: { color: "#1E6640", bg: "rgba(30,102,64,0.10)" },
  "Minor Defect": { color: "#8B6018", bg: "rgba(200,155,71,0.14)" },
  Damaged: { color: "#C0392B", bg: "rgba(192,57,43,0.10)" },
};

function ConditionBadge({ condition }: { condition: Condition }) {
  const c = CONDITION_CFG[condition];
  return (
    <span
      style={{
        fontFamily: F.ui,
        fontWeight: 700,
        fontSize: 11,
        color: c.color,
        background: c.bg,
        borderRadius: 999,
        padding: "3px 10px",
        whiteSpace: "nowrap" as const,
      }}
    >
      {condition}
    </span>
  );
}

function SareeListModal({
  purchase,
  onClose,
  onPrint,
  onPrintAll,
}: {
  purchase: Purchase;
  onClose: () => void;
  onPrint: (saree: SareeTag) => void;
  onPrintAll: () => void;
}) {
  const [viewSareeType, setViewSareeType] = useState<SareeTypeRecord | null>(null);

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "absolute", inset: 0, background: "rgba(27,12,8,0.55)" }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(92vw, 860px)",
            maxHeight: "82vh",
            background: "#FFF",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: T.darkBurgundy,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: "#FFF" }}>
                {purchase.id} — Saree Details
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.8)" }}>
                {purchase.supplier}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "none",
                color: "#FFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.silkCream }}>
                  {["Saree ID", "Saree Type Code", "Weight", "Condition", "Notes", "Barcode"].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontFamily: F.mono,
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.taupe,
                        textTransform: "uppercase" as const,
                        letterSpacing: 0.5,
                        textAlign: "left" as const,
                        padding: "10px 14px",
                        whiteSpace: "nowrap" as const,
                        borderBottom: `1px solid ${T.borderDef}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchase.sarees.map((s, i) => {
                  const rec = getSareeTypeByCode(s.sareeTypeCode);
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory, borderBottom: `1px solid ${T.borderDef}` }}>
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>
                        {s.id}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {rec ? (
                          <button
                            onClick={() => setViewSareeType(rec)}
                            style={{
                              fontFamily: F.mono,
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.luxuryBrown,
                              background: "rgba(200,155,71,0.13)",
                              border: `1px solid ${T.borderGold}`,
                              borderRadius: 6,
                              padding: "3px 9px",
                              cursor: "pointer",
                            }}
                          >
                            {s.sareeTypeCode}
                          </button>
                        ) : (
                          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{s.sareeTypeCode || "—"}</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                        {s.weight}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <ConditionBadge condition={s.condition} />
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.taupe, maxWidth: 200 }}>
                        {s.notes || "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <button
                          onClick={() => onPrint(s)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: T.royalBurgundy,
                            color: "#FFF",
                            border: "none",
                            borderRadius: 7,
                            padding: "5px 11px",
                            fontFamily: F.ui,
                            fontWeight: 600,
                            fontSize: 11.5,
                            cursor: "pointer",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          <Printer size={11} />
                          Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "14px 24px",
              borderTop: `1px solid ${T.borderDef}`,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <button
              onClick={onPrintAll}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: T.royalBurgundy,
                color: "#FFF",
                border: "none",
                borderRadius: 999,
                padding: "10px 0",
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              <Printer size={14} />
              Print All Barcodes
            </button>
            <button
              onClick={onClose}
              style={{
                flex: "0 0 auto",
                background: "transparent",
                color: T.taupe,
                border: `1px solid ${T.borderDef}`,
                borderRadius: 999,
                padding: "10px 22px",
                fontFamily: F.ui,
                fontWeight: 500,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
      {viewSareeType && <SareeTypeCard sareeType={viewSareeType} onClose={() => setViewSareeType(null)} />}
    </AnimatePresence>
  );
}

export function ExternalPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
  const [detailRow, setDetailRow] = useState<Purchase | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const [formModal, setFormModal] = useState<{ mode: "add" | "edit"; editId?: string } | null>(null);
  const [sareeListPurchase, setSareeListPurchase] = useState<Purchase | null>(null);
  const [printSaree, setPrintSaree] = useState<SareeTag | null>(null);
  const [printSareeSupplier, setPrintSareeSupplier] = useState<string>("");

  const filtered = purchases.filter((p) => {
    const matchSearch =
      search === "" ||
      p.supplier.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.gstNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const nextId = () => {
    const n = purchases.length + 1;
    return `EXT-2026-${String(n).padStart(4, "0")}`;
  };

  const handleAddSubmit = (form: FormState, sarees: SareeTag[]) => {
    const id = nextId();
    const newPurchase: Purchase = {
      id,
      supplier: form.supplier,
      location: form.location,
      date: form.date || "—",
      sareeType: form.sareeType,
      sareeCount: sarees.length,
      gstNumber: form.gstNumber,
      invoiceNumber: form.invoiceNumber,
      billAmount: form.billAmount || "₹0",
      deduction: parseCurrency(form.deduction),
      status: form.status,
      addedBy: form.addedBy || "Admin",
      notes: form.notes,
      sarees,
    };
    setPurchases((prev) => [newPurchase, ...prev]);
    setFormModal(null);
  };

  const handleEditSubmit = (id: string, form: FormState, sarees: SareeTag[]) => {
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          supplier: form.supplier,
          location: form.location,
          date: form.date || p.date,
          sareeType: form.sareeType,
          sareeCount: sarees.length,
          gstNumber: form.gstNumber,
          invoiceNumber: form.invoiceNumber,
          billAmount: form.billAmount,
          deduction: parseCurrency(form.deduction),
          status: form.status,
          addedBy: form.addedBy,
          notes: form.notes,
          sarees,
        };
      })
    );
    setFormModal(null);
    setDetailRow((d) => (d && d.id === id ? purchases.find((p) => p.id === id) || d : d));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(`Delete purchase ${id}? This cannot be undone.`)) return;
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    setDetailRow((d) => (d && d.id === id ? null : d));
  };

  const editingPurchase = formModal?.mode === "edit" ? purchases.find((p) => p.id === formModal.editId) : null;
  const editingFormInitial: FormState | null = editingPurchase
    ? {
        supplier: editingPurchase.supplier,
        location: editingPurchase.location,
        date: editingPurchase.date,
        sareeType: editingPurchase.sareeType,
        sareeCount: String(editingPurchase.sareeCount),
        gstNumber: editingPurchase.gstNumber,
        invoiceNumber: editingPurchase.invoiceNumber,
        billAmount: editingPurchase.billAmount,
        deduction: String(editingPurchase.deduction ?? 0),
        status: editingPurchase.status,
        addedBy: editingPurchase.addedBy,
        notes: editingPurchase.notes,
      }
    : null;

  const totalSarees = purchases.reduce((s, p) => s + p.sareeCount, 0);

  return (
    <div
      style={{
        background: T.silkCream,
        minHeight: "100vh",
        paddingBottom: 80,
      }}
    >
      {/* PAGE HEADER */}
      <div
        style={{
          background: T.darkBurgundy,
          padding: "44px 56px 90px",
          position: "relative",
          overflow: "hidden",
          minHeight: 180,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 9,
              color: T.antiqueGold,
              opacity: 0.5,
              letterSpacing: 2,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            SINCE 1999 · EXTERNAL PURCHASES
          </div>
          <h1
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 42,
              color: "white",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            External Purchases
          </h1>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: 28,
              color: T.antiqueGold,
              marginTop: 2,
              marginBottom: 14,
            }}
          >
            &amp; Branch Inventory Oversight
          </div>
          <p
            style={{
              fontFamily: F.ui,
              fontSize: 14,
              color: "rgba(255,255,255,0.60)",
              maxWidth: 480,
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            Track every saree purchased from external suppliers — with GST,
            invoice details, and an auto-generated printable barcode for each
            saree. Visible across all branches.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            zIndex: 10,
            alignSelf: "center",
            flexShrink: 0,
          }}
        >
          <button
            style={{
              border: "1px solid rgba(255,255,255,0.25)",
              background: "transparent",
              color: "white",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={() => setFormModal({ mode: "add" })}
            style={{
              background: T.antiqueGold,
              color: "#3B2314",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <Plus size={13} />
            Add External Purchase
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: 40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "2px solid rgba(200,155,71,0.13)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: 100,
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "2px solid rgba(200,155,71,0.09)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          padding: "0 56px",
          marginTop: -40,
          zIndex: 20,
          position: "relative",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
            borderRadius: 24,
            minHeight: 120,
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {[
            {
              label: "TOTAL PURCHASES",
              value: String(purchases.length),
              sub: "All time across all entries",
              highlight: false,
              valueColor: "white",
            },
            {
              label: "TOTAL SAREES TAGGED",
              value: String(totalSarees),
              sub: "Barcodes generated",
              highlight: false,
              valueColor: T.antiqueGold,
            },
            {
              label: "PENDING PAYMENTS",
              value: String(purchases.filter((p) => p.status !== "Paid").length),
              sub: "Entries awaiting payment",
              highlight: true,
              valueColor: T.antiqueGold,
            },
            {
              label: "THIS MONTH",
              value: String(purchases.length),
              sub: "New entries this month",
              highlight: false,
              valueColor: "white",
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "28px 28px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                background: card.highlight ? "rgba(200,155,71,0.10)" : "transparent",
                borderRadius: i === 0 ? "24px 0 0 24px" : i === 3 ? "0 24px 24px 0" : undefined,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 9,
                  color: card.highlight ? T.antiqueGold : "rgba(255,255,255,0.45)",
                  letterSpacing: 2,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 28,
                  color: card.valueColor,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {card.value}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.40)" }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ padding: "48px 56px 0" }}>
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: `1px solid ${T.borderDef}`,
            boxShadow: "0 2px 12px rgba(44,24,16,0.05)",
            padding: "16px 20px",
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "2fr 1fr auto auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              color={T.taupe}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by supplier, ID, location, GST, invoice…"
              style={{
                width: "100%",
                height: 40,
                borderRadius: 10,
                border: `1px solid ${T.borderDef}`,
                background: "#FFF8F0",
                fontFamily: F.ui,
                fontSize: 13,
                paddingLeft: 36,
                paddingRight: 12,
                color: T.luxuryBrown,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              border: `1px solid ${T.borderDef}`,
              background: "#FFF8F0",
              fontFamily: F.ui,
              fontSize: 13,
              padding: "0 10px",
              color: T.luxuryBrown,
              cursor: "pointer",
            }}
          >
            <option>All Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Partial</option>
          </select>

          <button
            style={{
              height: 40,
              background: T.royalBurgundy,
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "0 18px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Apply
          </button>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("All Status");
            }}
            style={{
              height: 40,
              background: "transparent",
              color: T.taupe,
              border: "none",
              borderRadius: 10,
              padding: "0 14px",
              fontFamily: F.ui,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div style={{ padding: "0 56px" }}>
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: `1px solid ${T.borderDef}`,
            boxShadow: "0 2px 16px rgba(44,24,16,0.07)",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.silkCream }}>
                {[
                  "Serial Number",
                  "Supplier Name",
                  "Location",
                  "Purchase Date",
                  "Sarees",
                  "GST Number",
                  "Invoice Number",
                  "Bill Amount",
                  "Payment Status",
                  "Added By",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: F.mono,
                      fontSize: 9,
                      color: T.taupe,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setDetailRow(row)}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: `1px solid ${T.borderDef}`,
                    background: hoveredRow === row.id ? "#F0E8D0" : "white",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy }}>
                      {row.id}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                      {row.supplier}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.location}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.date}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSareeListPurchase(row)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: T.cream,
                        border: `1px solid ${T.borderGold}`,
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontFamily: F.ui,
                        fontWeight: 600,
                        fontSize: 12,
                        color: T.luxuryBrown,
                        cursor: "pointer",
                      }}
                      title="View / Print saree barcodes"
                    >
                      <Tag size={12} color={T.antiqueGold} />
                      {row.sareeCount}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.gstNumber || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.invoiceNumber || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontWeight: 600,
                        fontSize: 13,
                        color: T.antiqueGold,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.billAmount}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusPill status={row.status} />
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.addedBy}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailRow(row)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: T.royalBurgundy,
                        }}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setFormModal({ mode: "edit", editId: row.id })}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: T.taupe,
                        }}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: T.crimson,
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      padding: "40px 16px",
                      textAlign: "center",
                      fontFamily: F.ui,
                      fontSize: 13,
                      color: T.taupe,
                    }}
                  >
                    No purchases match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `1px solid ${T.borderDef}`,
              padding: "12px 20px",
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>
              Showing 1–{filtered.length} of {purchases.length} entries
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {["← Previous", "1", "Next →"].map((p, i) => (
                <button
                  key={i}
                  style={{
                    fontFamily: F.ui,
                    fontSize: 12,
                    color: p === "1" ? T.royalBurgundy : T.taupe,
                    background: p === "1" ? T.cream : "transparent",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontWeight: p === "1" ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {detailRow && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailRow(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 400 }}
            />
            <motion.div
              initial={{ x: 480 }}
              animate={{ x: 0 }}
              exit={{ x: 480 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: 480,
                background: "white",
                boxShadow: "-8px 0 40px rgba(44,24,16,0.18)",
                zIndex: 500,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "22px 28px",
                  borderBottom: `1px solid ${T.borderDef}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>
                  Purchase Details
                </span>
                <button
                  onClick={() => setDetailRow(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `1px solid ${T.borderDef}`,
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: T.taupe,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {[
                  { label: "Serial Number", value: detailRow.id, mono: true, gold: true },
                  { label: "Supplier Name", value: detailRow.supplier },
                  { label: "Location", value: detailRow.location },
                  { label: "Purchase Date", value: detailRow.date },
                  { label: "Saree Type", value: detailRow.sareeType },
                  { label: "Number of Sarees", value: String(detailRow.sareeCount) },
                  { label: "GST Number", value: detailRow.gstNumber || "—", mono: true },
                  { label: "Invoice Number", value: detailRow.invoiceNumber || "—", mono: true },
                  { label: "Bill Amount", value: detailRow.billAmount, gold: true },
                  { label: "Deduction Amount", value: formatINR(detailRow.deduction ?? 0) },
                  { label: "Net Amount", value: formatINR(parseCurrency(detailRow.billAmount) - (detailRow.deduction ?? 0)), gold: true },
                  { label: "Payment Status", value: detailRow.status, pill: true },
                  { label: "Added By", value: detailRow.addedBy },
                ].map((field) => (
                  <div key={field.label}>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontWeight: 600,
                        fontSize: 12,
                        color: T.luxuryBrown,
                        marginBottom: 4,
                      }}
                    >
                      {field.label}
                    </div>
                    {field.pill ? (
                      <StatusPill status={field.value} />
                    ) : (
                      <div
                        style={{
                          fontFamily: field.mono ? F.mono : F.ui,
                          fontSize: 14,
                          color: field.gold ? T.antiqueGold : field.mono ? T.royalBurgundy : T.taupe,
                          fontWeight: field.mono ? 700 : 400,
                        }}
                      >
                        {field.value}
                      </div>
                    )}
                  </div>
                ))}

                {detailRow.notes && (
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, marginBottom: 4 }}>
                      Notes
                    </div>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontSize: 14,
                        color: T.taupe,
                        background: T.silkCream,
                        borderRadius: 8,
                        padding: "10px 12px",
                        lineHeight: 1.6,
                      }}
                    >
                      {detailRow.notes}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, marginBottom: 8 }}>
                    Saree Barcodes ({detailRow.sarees.length})
                  </div>
                  <button
                    onClick={() => setSareeListPurchase(detailRow)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: T.cream,
                      border: `1px solid ${T.borderGold}`,
                      borderRadius: 10,
                      padding: "12px 0",
                      fontFamily: F.ui,
                      fontWeight: 600,
                      fontSize: 13,
                      color: T.luxuryBrown,
                      cursor: "pointer",
                    }}
                  >
                    <Tag size={14} color={T.antiqueGold} />
                    View &amp; Print Saree Tags
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: "18px 28px",
                  borderTop: `1px solid ${T.borderDef}`,
                  display: "flex",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setFormModal({ mode: "edit", editId: detailRow.id })}
                  style={{
                    flex: 1,
                    background: T.royalBurgundy,
                    color: "white",
                    border: "none",
                    borderRadius: 999,
                    padding: "11px 0",
                    fontFamily: F.ui,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Edit Entry
                </button>
                <button
                  onClick={() => setDetailRow(null)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: T.taupe,
                    border: `1px solid ${T.borderDef}`,
                    borderRadius: 999,
                    padding: "11px 0",
                    fontFamily: F.ui,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD / EDIT FORM MODAL */}
      {formModal && formModal.mode === "add" && (
        <PurchaseFormModal
          mode="add"
          initial={EMPTY_FORM}
          initialSarees={[]}
          previewId={nextId()}
          onClose={() => setFormModal(null)}
          onSubmit={handleAddSubmit}
        />
      )}
      {formModal && formModal.mode === "edit" && editingFormInitial && editingPurchase && (
        <PurchaseFormModal
          mode="edit"
          initial={editingFormInitial}
          initialSarees={editingPurchase.sarees}
          previewId={editingPurchase.id}
          onClose={() => setFormModal(null)}
          onSubmit={(data, sarees) => handleEditSubmit(formModal.editId!, data, sarees)}
        />
      )}

      {/* SAREE BARCODE LIST MODAL */}
      {sareeListPurchase && (
        <SareeListModal
          purchase={purchases.find((p) => p.id === sareeListPurchase.id) || sareeListPurchase}
          onClose={() => setSareeListPurchase(null)}
          onPrint={(saree) => {
            setPrintSareeSupplier(sareeListPurchase.supplier);
            setPrintSaree(saree);
            setSareeListPurchase(null);
          }}
          onPrintAll={() => window.print()}
        />
      )}

      {/* SAREE TAG PRINT MODAL */}
      {printSaree && (
        <SariTagPrintModal
          saree={{
            id: printSaree.id,
            weaver: null,
            design: printSaree.id,
            sareeType: printSaree.sareeType,
            sareeTypeCode: printSaree.sareeTypeCode,
            weight: printSaree.weight,
            qcDate: printSaree.date,
            source: "external",
            loom: 0,
            supplier: printSareeSupplier,
          }}
          onClose={() => setPrintSaree(null)}
        />
      )}
    </div>
  );
}
