import React, { useState } from "react";
import {
  ChevronDown, Camera, UploadCloud, CheckCircle2, AlertTriangle, TrendingUp,
  Printer, Search,
} from "lucide-react";
import { C, F, card, inputStyle, btnPrimary, btnGhost } from "./tokens";
import { usePO, PurchaseOrder, POItem } from "../POContext";

type GRNStep = "form" | "success" | "print";

const STEPS = ["Select PO", "Batch ID", "Quantities"];

const MAT_TAG: Record<string, { col: string; bg: string }> = {
  Warp:   { col: "#7A5010", bg: "rgba(196,146,58,0.14)" },
  Resham: { col: "#7A5E1C", bg: "rgba(200,155,71,0.13)" },
  Jari:   { col: C.burg,    bg: "rgba(107,26,42,0.08)" },
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function generateGrnId(seq: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = MONTHS[now.getMonth()];
  return `GRN-${y}-${m}-${String(seq).padStart(3, "0")}`;
}

interface ReceiptRecord {
  grnId: string;
  poRef: string;
  vendor: string;
  firmName: string;
  dateReceived: string;
  materialsSummary: string;
  receivedBy: string;
  status: "Match" | "Short" | "Excess";
}

export const INITIAL_HISTORY: ReceiptRecord[] = [
  { grnId: "GRN-2026-MAY-014", poRef: "PO-2026-020", vendor: "Surat Zari Works",         firmName: "Beere Kesava Silks (Head Firm)", dateReceived: "20 May 2026", materialsSummary: "Jari - Polyester 2G Gold (6 Buns)", receivedBy: "Worker Staff (RS)", status: "Match" },
  { grnId: "GRN-2026-MAY-011", poRef: "PO-2026-021", vendor: "Kanchipuram Silks",        firmName: "Beere Kesava Silks (Head Firm)", dateReceived: "17 May 2026", materialsSummary: "Resham - Red (30 kg), Resham - Gold (24 kg)", receivedBy: "Worker Staff (RS)", status: "Short" },
  { grnId: "GRN-2026-MAY-006", poRef: "PO-2026-022", vendor: "Sri Venkateswara Textiles", firmName: "Beere Kesava Silks (Head Firm)", dateReceived: "12 May 2026", materialsSummary: "Warp - Cotton (52 kg)", receivedBy: "Worker Staff (MK)", status: "Excess" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "12px 20px 8px", gap: 0 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: i < current ? C.green : i === current ? C.burg : "rgba(139,26,46,0.12)",
              marginBottom: 4,
            }}>
              {i < current
                ? <CheckCircle2 size={13} color="#FFF" />
                : <span style={{ fontFamily: F.m, fontSize: 10, color: i === current ? "#FFF" : C.muted, fontWeight: 700 }}>{i + 1}</span>
              }
            </div>
            <span style={{ fontFamily: F.u, fontSize: 9, color: i <= current ? C.burg : C.muted, fontWeight: i === current ? 600 : 400, textAlign: "center", lineHeight: 1.2 }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ height: 2, flex: 0.5, background: i < current ? C.green : C.bdr, marginBottom: 16, borderRadius: 1 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function SectionLabel({ step, title }: { step: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 20px 10px" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: F.m, fontSize: 10, fontWeight: 700, color: "#FFF" }}>{step}</span>
      </div>
      <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.burg }}>{title}</span>
    </div>
  );
}

function MatChip({ type }: { type: string }) {
  const cfg = MAT_TAG[type] ?? { col: C.text, bg: C.inp };
  return (
    <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 700, color: cfg.col, background: cfg.bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" as const }}>
      {type}
    </span>
  );
}

function materialsSummaryFor(materials: POItem[], receivedQty: Record<number, string>): string {
  return materials.map((m, i) => `${m.materialType} ${receivedQty[i] || m.quantity}${m.unit}`).join(", ");
}

function renderMaterialsSummary(summary: string) {
  if (!summary) return null;
  const parts = summary.split(", ");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {parts.map((p, idx) => {
        const matchDesc = p.match(/^([^-]+)\s*-\s*([^(]+)\s*\(([^)]+)\)$/);
        if (matchDesc) {
          const type = matchDesc[1].trim();
          const desc = matchDesc[2].trim();
          const qty = matchDesc[3].trim();
          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ 
                fontFamily: F.u, fontSize: 9.5, fontWeight: 700,
                color: type === "Warp" ? "#7A5010" : type === "Resham" ? "#7A5E1C" : C.burg, 
                background: type === "Warp" ? "rgba(196,146,58,0.14)" : type === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(107,26,42,0.08)",
                padding: "2px 6px", borderRadius: 4 
              }}>{type}</span>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{desc}</span>
              <span style={{ fontFamily: F.m, fontSize: 11.5, fontWeight: 700, color: C.burg }}>{qty}</span>
            </div>
          );
        }
        return (
          <div key={idx} style={{ fontFamily: F.u, fontSize: 12.5, color: C.text }}>
            {p}
          </div>
        );
      })}
    </div>
  );
}

export function WorkerGRN({ 
  mode = "all", 
  history: externalHistory, 
  setHistory: setExternalHistory 
}: { 
  mode?: "form" | "history" | "all"; 
  history?: ReceiptRecord[]; 
  setHistory?: React.Dispatch<React.SetStateAction<ReceiptRecord[]>>;
} = {}) {
  const { pos } = usePO();
  const approvedPOs = pos.filter(p => p.status === "approved");

  const [step, setStep] = useState<GRNStep>("form");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showPODrop, setShowPODrop] = useState(false);
  const [localHistory, setLocalHistory] = useState<ReceiptRecord[]>(INITIAL_HISTORY);

  const receiptHistory = externalHistory ?? localHistory;
  const setReceiptHistory = setExternalHistory ?? setLocalHistory;

  const [grnBatchId, setGrnBatchId] = useState(() => generateGrnId(receiptHistory.length + 1));
  const [receivedQty, setReceivedQty] = useState<Record<number, string>>({});
  const [receivedUnit, setReceivedUnit] = useState<Record<number, "kg" | "g" | "Reels" | "Buns">>({});
  const [confirmedReceived, setConfirmedReceived] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const PAGE_SIZE = 10;

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowPODrop(false);
    setReceivedQty({});
    setConfirmedReceived(false);

    // Initialize units
    const initialUnits: Record<number, "kg" | "g" | "Reels" | "Buns"> = {};
    po.materials.forEach((m, idx) => {
      if (m.materialType === "Jari") {
        initialUnits[idx] = (m.unit === "Reels" || m.unit === "Buns") ? m.unit : "Buns";
      } else {
        initialUnits[idx] = "kg";
      }
    });
    setReceivedUnit(initialUnits);
    setGrnBatchId(generateGrnId(receiptHistory.length + 1));
  };

  const getQtyInOrderedUnit = (idx: number, m: POItem) => {
    const qtyStr = receivedQty[idx] || "";
    if (!qtyStr) return 0;
    const qtyVal = parseFloat(qtyStr) || 0;
    const unitSel = receivedUnit[idx];

    if (m.materialType === "Jari") {
      if (m.unit === "Buns") {
        return unitSel === "Buns" ? qtyVal : qtyVal / 4;
      } else { // Reels
        return unitSel === "Reels" ? qtyVal : qtyVal * 4;
      }
    } else {
      if (m.unit.toLowerCase() === "kg") {
        return unitSel === "kg" ? qtyVal : qtyVal / 1000;
      } else { // g
        return unitSel === "g" ? qtyVal : qtyVal * 1000;
      }
    }
  };

  const getHasQty = (idx: number, m: POItem) => {
    return !!receivedQty[idx];
  };

  const comparisons = selectedPO ? selectedPO.materials.map((m, i) => {
    const qtyStr = receivedQty[i] || "";
    if (!qtyStr) return null;
    const rq = getQtyInOrderedUnit(i, m);
    const diff = rq - m.quantity;
    return { diff, unit: m.unit };
  }) : [];

  const allFilled = selectedPO ? selectedPO.materials.every((m, i) => getHasQty(i, m)) : false;

  const overallStatus: "Match" | "Short" | "Excess" = (() => {
    const diffs = comparisons.filter(Boolean) as { diff: number }[];
    if (diffs.some(d => d.diff < 0)) return "Short";
    if (diffs.some(d => d.diff > 0)) return "Excess";
    return "Match";
  })();

  const currentFormStep = !selectedPO ? 0 : !grnBatchId ? 1 : 2;

  const getMaterialsSummary = () => {
    if (!selectedPO) return "";
    return selectedPO.materials.map((m, i) => {
      const qty = receivedQty[i] || "0";
      const unit = receivedUnit[i] || m.unit;
      const desc = m.subtype || m.description || "General";
      return `${m.materialType} - ${desc} (${qty} ${unit})`;
    }).join(", ");
  };

  const handleConfirm = () => {
    if (!selectedPO) return;
    const record: ReceiptRecord = {
      grnId: grnBatchId,
      poRef: selectedPO.poNumber,
      vendor: selectedPO.vendor,
      firmName: selectedPO.firmName ?? "—",
      dateReceived: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      materialsSummary: getMaterialsSummary(),
      receivedBy: "Worker Staff",
      status: overallStatus,
    };
    setReceiptHistory(prev => [record, ...prev]);
    setStep("success");
  };

  const resetForm = () => {
    setStep("form");
    setSelectedPO(null);
    setReceivedQty({});
    setConfirmedReceived(false);
    setGrnBatchId(generateGrnId(receiptHistory.length + 1));
  };

  const filteredHistory = receiptHistory
    .slice(0, 20)
    .filter(r => {
      if (!historySearch) return true;
      const q = historySearch.toLowerCase();
      return r.grnId.toLowerCase().includes(q) || r.poRef.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q);
    });
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const pagedHistory = filteredHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const HIST_STATUS_CFG: Record<ReceiptRecord["status"], { color: string; bg: string }> = {
    Match:  { color: C.green, bg: "rgba(30,102,64,0.10)" },
    Short:  { color: C.gold,  bg: "rgba(196,146,58,0.14)" },
    Excess: { color: "#1565C0", bg: "rgba(21,101,192,0.10)" },
  };

  if (mode === "history") {
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={14} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }} placeholder="Search by GRN ID, PO number, or vendor..."
            style={{ ...inputStyle, height: 42, paddingLeft: 34, fontSize: 13.5 }} />
        </div>

        <div style={{ ...card, overflow: "hidden", border: `1.5px solid ${C.bdr}` }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ background: C.inp }}>
                  {["GRN Batch ID", "PO Reference", "Vendor", "Firm Name", "Date Received", "Materials", "Received By", "Status"].map(h => (
                    <th key={h} style={{ fontFamily: F.m, fontSize: 9.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left", padding: "12px 14px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedHistory.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No receipts found.</td></tr>
                ) : pagedHistory.map((r, i) => {
                  const sc = HIST_STATUS_CFG[r.status];
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${C.bdr}`, background: i % 2 === 0 ? "#fff" : "rgba(247,242,234,0.3)" }}>
                      <td style={{ padding: "12px 14px", fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.burg, whiteSpace: "nowrap" }}>{r.grnId}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.m, fontSize: 12, color: C.text }}>{r.poRef}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.u, fontSize: 13, color: C.text }}>{r.vendor}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.u, fontSize: 12.5, color: C.muted }}>{r.firmName}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.u, fontSize: 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.dateReceived}</td>
                      <td style={{ padding: "12px 14px" }}>{renderMaterialsSummary(r.materialsSummary)}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.u, fontSize: 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.receivedBy}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${C.bdr}` }}>
              <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted }}>Page {historyPage} of {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}
                  style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontSize: 12, color: C.text, cursor: historyPage === 1 ? "default" : "pointer", opacity: historyPage === 1 ? 0.5 : 1 }}>Prev</button>
                <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages}
                  style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontSize: 12, color: C.text, cursor: historyPage === totalPages ? "default" : "pointer", opacity: historyPage === totalPages ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 40 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle2 size={32} color={C.green} />
        </div>
        <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center" }}>GRN Created Successfully</div>
        <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 600, color: C.burg }}>{grnBatchId}</div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
          Barcodes are being generated — tap below to print labels
        </div>
        <button onClick={() => setStep("print")} style={{ ...btnPrimary, gap: 8 }}>
          <Printer size={16} /> Print Barcode Labels
        </button>
        <button onClick={resetForm} style={{ ...btnGhost, marginTop: 2 }}>
          Back to GRN
        </button>
      </div>
    );
  }

  if (step === "print") {
    const batches = (selectedPO?.materials ?? []).map((m, i) => {
      const qtyText = `${receivedQty[i] || 0} ${receivedUnit[i] || m.unit}`;
      return {
        id: `BATCH-${selectedPO?.id.split("-").pop()}-00${i + 1}`,
        type: m.materialType,
        qty: qtyText,
      };
    });
    return (
      <div style={{ paddingBottom: 24 }}>
        <div style={{ padding: "14px 20px 0", fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>Barcode Labels</div>
        <div style={{ padding: "4px 20px 12px", fontFamily: F.u, fontSize: 13, color: C.muted }}>Print labels for all batches in {grnBatchId}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 16px" }}>
          {batches.map((b, i) => (
            <div key={i} style={{ ...card, padding: 14 }}>
              <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg, marginBottom: 2 }}>{b.id}</div>
              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 10 }}>{b.type} · {b.qty}</div>
              <div style={{ background: "#000", height: 32, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: F.m, fontSize: 6, color: "#FFF", letterSpacing: 2 }}>||| | || ||| ||</span>
              </div>
              <button style={{ width: "100%", background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 7, padding: "5px 0", fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Printer size={11} /> Print
              </button>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 20px" }}>
          <button style={{ ...btnPrimary, gap: 8, marginBottom: 10 }}><Printer size={16} /> Print All Labels</button>
          <button onClick={resetForm} style={{ ...btnGhost }}>Done — Skip Printing</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <StepBar current={currentFormStep} />

      <div style={{ margin: "0 20px 4px", background: "rgba(107,26,42,0.04)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px" }}>
        <p style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.5, margin: 0 }}>
          Receive raw material from a vendor against a purchase order.
        </p>
      </div>

      {/* Step 1 — Select PO */}
      <SectionLabel step={1} title="Receiving Against Purchase Order" />
      <div style={{ margin: "0 20px" }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowPODrop(p => !p)} style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", height: "auto", minHeight: 48, padding: "10px 14px" }}>
            <div style={{ color: selectedPO ? C.text : C.muted, fontFamily: F.u, fontSize: 13.5, textAlign: "left", flex: 1 }}>
              {selectedPO ? (
                <div>
                  <div style={{ fontWeight: 700, color: C.burg, marginBottom: 2 }}>{selectedPO.id} — {selectedPO.vendor}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>
                    Firm: {selectedPO.firmName ?? "—"} · City: {selectedPO.vendorCity}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                    {selectedPO.materials.map((m, idx) => (
                      <span key={idx} style={{ 
                        fontFamily: F.u, 
                        fontSize: 9.5, 
                        fontWeight: 700, 
                        color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg, 
                        background: m.materialType === "Warp" ? "rgba(196,146,58,0.1)" : m.materialType === "Resham" ? "rgba(200,155,71,0.1)" : "rgba(107,26,42,0.05)",
                        padding: "2px 6px", 
                        borderRadius: 4 
                      }}>
                        {m.materialType}: {m.quantity} {m.unit}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                "Select an approved purchase order..."
              )}
            </div>
            <ChevronDown size={16} color={C.muted} style={{ flexShrink: 0, marginLeft: 8, transform: showPODrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showPODrop && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(107,26,42,0.12)", zIndex: 50, marginTop: 4, maxHeight: 280, overflowY: "auto" }}>
              {approvedPOs.length === 0 && (
                <div style={{ padding: "14px", fontFamily: F.u, fontSize: 12, color: C.muted, textAlign: "center" }}>No approved purchase orders available.</div>
              )}
              {approvedPOs.map(po => (
                <button key={po.id} onClick={() => handleSelectPO(po)} 
                  style={{ 
                    display: "block", 
                    width: "100%", 
                    padding: "14px 16px", 
                    textAlign: "left", 
                    background: "none", 
                    border: "none", 
                    borderBottom: `1px solid ${C.bdr}`, 
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(107,26,42,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{po.id}</span>
                    {po.urgency === "Urgent" && (
                      <span style={{ fontFamily: F.u, fontSize: 9, background: "rgba(183,28,28,0.08)", color: "#B71C1C", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                        URGENT
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    {po.vendor} <span style={{ fontWeight: 400, color: C.muted }}>· {po.vendorCity}</span>
                  </div>
                  {po.firmName && (
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 5 }}>
                      Firm: <span style={{ fontWeight: 500, color: C.text }}>{po.firmName}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                    {po.materials.map((m, idx) => (
                      <span key={idx} style={{ 
                        fontFamily: F.u, 
                        fontSize: 9.5, 
                        fontWeight: 700, 
                        color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg, 
                        background: m.materialType === "Warp" ? "rgba(196,146,58,0.1)" : m.materialType === "Resham" ? "rgba(200,155,71,0.1)" : "rgba(107,26,42,0.05)",
                        padding: "1px 6px", 
                        borderRadius: 4 
                      }}>
                        {m.materialType}: {m.quantity} {m.unit}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PO Reference Panel — read-only */}
        {selectedPO && (
          <div style={{ ...card, marginTop: 10, padding: 14 }}>
            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>PO Reference — What Was Ordered</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>PO Number</div>
                <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{selectedPO.poNumber}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Vendor</div>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text }}>{selectedPO.vendor} · {selectedPO.vendorCity}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Firm Name</div>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text }}>{selectedPO.firmName ?? "—"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedPO.materials.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: C.inp, borderRadius: 8, padding: "7px 10px" }}>
                  <MatChip type={m.materialType} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.text, flex: 1 }}>{m.description || m.subtype}</span>
                  <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.text }}>{m.quantity} {m.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — GRN Batch ID */}
      {selectedPO && (
        <>
          <SectionLabel step={2} title="GRN Batch ID" />
          <div style={{ margin: "0 20px" }}>
            <input value={grnBatchId} onChange={e => setGrnBatchId(e.target.value)}
              style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, fontWeight: 600, color: C.burg, height: 46 }} />
            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 4 }}>Auto-generated — you can edit this before confirming.</div>
          </div>

          {/* Step 3 — Received Quantities (cross-check) */}
          <SectionLabel step={3} title="What We Actually Received" />
          <div style={{ margin: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedPO.materials.map((m, i) => {
              const cmp = comparisons[i];
              const isKg = m.unit.toLowerCase() === "kg";
              const matColor = m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg;
              return (
                <div key={i} style={{ ...card, padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Ordered — read-only */}
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Ordered</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <MatChip type={m.materialType} />
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, marginBottom: 4 }}>{m.description || m.subtype}</div>
                      <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.text }}>
                        {m.quantity} {m.unit}
                        {isKg && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 400 }}> ({(m.quantity * 1000)} g)</span>}
                        {m.materialType === "Jari" && m.unit === "Buns" && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 400 }}> ({(m.quantity * 4)} Reels)</span>}
                      </div>
                    </div>
                    {/* Received — editable */}
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Received</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {/* Unit Selector Button Group */}
                        <div style={{ display: "flex", gap: 4 }}>
                          {m.materialType === "Jari" ? (
                            (["Reels", "Buns"] as const).map(u => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => setReceivedUnit(prev => ({ ...prev, [i]: u }))}
                                style={{
                                  flex: 1, padding: "5px 0", borderRadius: 6,
                                  border: `1px solid ${receivedUnit[i] === u ? C.burg : C.bdr}`,
                                  background: receivedUnit[i] === u ? C.burg : "#FFF",
                                  color: receivedUnit[i] === u ? "#FFF" : C.text,
                                  fontFamily: F.u, fontSize: 10.5, fontWeight: 600, cursor: "pointer"
                                }}
                              >
                                {u}
                              </button>
                            ))
                          ) : (
                            (["kg", "g"] as const).map(u => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => setReceivedUnit(prev => ({ ...prev, [i]: u }))}
                                style={{
                                  flex: 1, padding: "5px 0", borderRadius: 6,
                                  border: `1px solid ${receivedUnit[i] === u ? C.burg : C.bdr}`,
                                  background: receivedUnit[i] === u ? C.burg : "#FFF",
                                  color: receivedUnit[i] === u ? "#FFF" : C.text,
                                  fontFamily: F.u, fontSize: 10.5, fontWeight: 600, cursor: "pointer"
                                }}
                              >
                                {u}
                              </button>
                            ))
                          )}
                        </div>

                        {/* Input Field */}
                        <div style={{ position: "relative" }}>
                          <input
                            type="number"
                            value={receivedQty[i] ?? ""}
                            onChange={e => setReceivedQty(prev => ({ ...prev, [i]: e.target.value }))}
                            placeholder="0"
                            style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, paddingRight: 46, height: 40 }}
                          />
                          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 10.5, fontWeight: 700, color: matColor }}>
                            {receivedUnit[i] || (m.materialType === "Jari" ? "Buns" : "kg")}
                          </span>
                        </div>

                        {/* Auto conversion preview */}
                        {receivedQty[i] && (
                          <div style={{ fontFamily: F.u, fontSize: 10.5, color: matColor, fontWeight: 600 }}>
                            {m.materialType === "Jari" ? (
                              receivedUnit[i] === "Reels"
                                ? `= ${(parseFloat(receivedQty[i]) / 4).toFixed(2)} Buns`
                                : `= ${(parseFloat(receivedQty[i]) * 4).toFixed(0)} Reels`
                            ) : (
                              receivedUnit[i] === "kg"
                                ? `= ${(parseFloat(receivedQty[i]) * 1000).toFixed(0)} g`
                                : `= ${(parseFloat(receivedQty[i]) / 1000).toFixed(3)} kg`
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {cmp && (
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                      {cmp.diff === 0 ? (
                        <>
                          <CheckCircle2 size={13} color={C.green} />
                          <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.green }}>✓ Match</span>
                        </>
                      ) : cmp.diff < 0 ? (
                        <>
                          <AlertTriangle size={13} color={C.gold} />
                          <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.gold }}>⚠ Short by {Math.abs(cmp.diff).toFixed(3)} {cmp.unit}</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp size={13} color="#1565C0" />
                          <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#1565C0" }}>▲ Excess by {cmp.diff.toFixed(3)} {cmp.unit}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirm Block */}
          <div style={{ margin: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Checkbox confirmation */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={confirmedReceived}
                onChange={e => setConfirmedReceived(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: C.burg, cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
                I confirm that the materials have been verified and received perfectly.
              </span>
            </label>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={!allFilled || !confirmedReceived}
              style={{
                ...btnPrimary,
                height: 52,
                marginTop: 6,
                gap: 8,
                opacity: (allFilled && confirmedReceived) ? 1 : 0.5,
                cursor: (allFilled && confirmedReceived) ? "pointer" : "default"
              }}
            >
              <CheckCircle2 size={17} /> Confirm Receipt — Generate GRN
            </button>
          </div>
        </>
      )}

      {mode === "all" && (
        <>
          {/* Receipt History */}
          <SectionLabel step={0} title="Receipt History" />
          <div style={{ margin: "0 20px" }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <Search size={14} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }} placeholder="Search by GRN ID, PO number, or vendor..."
                style={{ ...inputStyle, height: 40, paddingLeft: 34, fontSize: 13 }} />
            </div>

            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: C.inp }}>
                      {["GRN Batch ID", "PO Reference", "Vendor", "Firm Name", "Date Received", "Materials", "Received By", "Status"].map(h => (
                        <th key={h} style={{ fontFamily: F.m, fontSize: 9.5, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, textAlign: "left", padding: "9px 12px", whiteSpace: "nowrap" as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: "20px", textAlign: "center", fontFamily: F.u, fontSize: 12.5, color: C.muted }}>No receipts found.</td></tr>
                    ) : pagedHistory.map((r, i) => {
                      const sc = HIST_STATUS_CFG[r.status];
                      return (
                        <tr key={i} style={{ borderTop: `1px solid ${C.bdr}` }}>
                          <td style={{ padding: "10px 12px", fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.burg, whiteSpace: "nowrap" as const }}>{r.grnId}</td>
                          <td style={{ padding: "10px 12px", fontFamily: F.m, fontSize: 12, color: C.text }}>{r.poRef}</td>
                          <td style={{ padding: "10px 12px", fontFamily: F.u, fontSize: 12.5, color: C.text }}>{r.vendor}</td>
                          <td style={{ padding: "10px 12px", fontFamily: F.u, fontSize: 12, color: C.muted }}>{r.firmName}</td>
                          <td style={{ padding: "10px 12px", fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" as const }}>{r.dateReceived}</td>
                          <td style={{ padding: "10px 12px" }}>{renderMaterialsSummary(r.materialsSummary)}</td>
                          <td style={{ padding: "10px 12px", fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" as const }}>{r.receivedBy}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" as const }}>{r.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: `1px solid ${C.bdr}` }}>
                  <span style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted }}>Page {historyPage} of {totalPages}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontSize: 11, color: C.text, cursor: historyPage === 1 ? "default" : "pointer", opacity: historyPage === 1 ? 0.5 : 1 }}>Prev</button>
                    <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontSize: 11, color: C.text, cursor: historyPage === totalPages ? "default" : "pointer", opacity: historyPage === totalPages ? 0.5 : 1 }}>Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
