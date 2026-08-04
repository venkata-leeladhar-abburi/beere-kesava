import React, { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { C, F, card, inputStyle, btnPrimary } from "./tokens";
import { usePO, PurchaseOrder, POItem } from "../../../purchasing/contexts/POContext";
import { ReceiptHistoryTable, ReceiptRecord } from "./ReceiptHistoryTable";
import { GRNSuccessView, GRNPrintView } from "./GRNSuccessPrint";
import { GRNItemVerificationCard } from "./GRNItemVerificationCard";
import { GRNPODropdown } from "./GRNPODropdown";

type GRNStep = "form" | "success" | "print";

const STEPS = ["Select PO", "Batch ID", "Quantities"];
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function generateGrnId(seq: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = MONTHS[now.getMonth()];
  return `GRN-${y}-${m}-${String(seq).padStart(3, "0")}`;
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
                : <span style={{ fontFamily: F.m, fontSize: 12, color: i === current ? "#FFF" : C.muted, fontWeight: 700 }}>{i + 1}</span>
              }
            </div>
            <span style={{ fontFamily: F.u, fontSize: 12, color: i <= current ? C.burg : C.muted, fontWeight: i === current ? 600 : 400, textAlign: "center", lineHeight: 1.2 }}>{s}</span>
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
        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{step}</span>
      </div>
      <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.burg }}>{title}</span>
    </div>
  );
}

export function WorkerGRN({ 
  mode = "all", 
  history: externalHistory, 
  setHistory: setExternalHistory,
  initialPOId
}: { 
  mode?: "form" | "history" | "all"; 
  history?: ReceiptRecord[]; 
  setHistory?: React.Dispatch<React.SetStateAction<ReceiptRecord[]>>;
  initialPOId?: string | null;
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
  const [itemApproval, setItemApproval] = useState<Record<number, "approved" | "rejected">>({});
  const [itemRejectReason, setItemRejectReason] = useState<Record<number, string>>({});
  const [notifySuperadmin, setNotifySuperadmin] = useState<Record<number, boolean>>({});
  const [confirmedReceived, setConfirmedReceived] = useState(false);

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowPODrop(false);
    setReceivedQty({});
    setItemApproval({});
    setItemRejectReason({});
    setNotifySuperadmin({});
    setConfirmedReceived(false);

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

  React.useEffect(() => {
    if (initialPOId) {
      const po = approvedPOs.find(p => p.id === initialPOId || p.poNumber === initialPOId);
      if (po && po.id !== selectedPO?.id) {
        handleSelectPO(po);
      }
    }
  }, [initialPOId]);

  const getQtyInOrderedUnit = (idx: number, m: POItem) => {
    const qtyStr = receivedQty[idx] || "";
    if (!qtyStr) return 0;
    const qtyVal = parseFloat(qtyStr) || 0;
    const unitSel = receivedUnit[idx];

    if (m.materialType === "Jari") {
      if (m.unit === "Buns") {
        return unitSel === "Buns" ? qtyVal : qtyVal / 4;
      } else {
        return unitSel === "Reels" ? qtyVal : qtyVal * 4;
      }
    } else {
      if (m.unit.toLowerCase() === "kg") {
        return unitSel === "kg" ? qtyVal : qtyVal / 1000;
      } else {
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
  const allApproved = selectedPO ? selectedPO.materials.every((m, i) =>
    itemApproval[i] === "approved" || (itemApproval[i] === "rejected" && !!itemRejectReason[i]?.trim())
  ) : false;

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
      const rejection = itemApproval[i] === "rejected" ? ` [Not Approved: ${itemRejectReason[i]}]` : "";
      return `${m.materialType} - ${desc} (${qty} ${unit})${rejection}`;
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
    setItemApproval({});
    setItemRejectReason({});
    setConfirmedReceived(false);
    setGrnBatchId(generateGrnId(receiptHistory.length + 1));
  };

  if (mode === "history") {
    return <ReceiptHistoryTable receiptHistory={receiptHistory} />;
  }

  if (step === "success") {
    return <GRNSuccessView grnBatchId={grnBatchId} onPrint={() => setStep("print")} onReset={resetForm} />;
  }

  if (step === "print") {
    return <GRNPrintView selectedPO={selectedPO} receivedQty={receivedQty} receivedUnit={receivedUnit} grnBatchId={grnBatchId} onReset={resetForm} />;
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
      <GRNPODropdown
        selectedPO={selectedPO}
        approvedPOs={approvedPOs}
        showPODrop={showPODrop}
        setShowPODrop={setShowPODrop}
        handleSelectPO={handleSelectPO}
      />

      {/* Step 2 — GRN Batch ID */}
      {selectedPO && (
        <>
          <SectionLabel step={2} title="GRN Batch ID" />
          <div style={{ margin: "0 20px" }}>
            <input value={grnBatchId} onChange={e => setGrnBatchId(e.target.value)}
              style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, fontWeight: 600, color: C.burg, height: 46 }} />
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Auto-generated — you can edit this before confirming.</div>
          </div>

          {/* Step 3 — Received Quantities (cross-check) */}
          <SectionLabel step={3} title="What We Actually Received" />
          <div style={{ margin: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedPO.materials.map((m, i) => (
              <GRNItemVerificationCard
                key={i}
                material={m}
                index={i}
                comparison={comparisons[i]}
                receivedQty={receivedQty[i] ?? ""}
                setReceivedQty={setReceivedQty}
                receivedUnit={receivedUnit[i] || (m.materialType === "Jari" ? "Buns" : "kg")}
                setReceivedUnit={setReceivedUnit}
                notifySuperadmin={notifySuperadmin[i] || false}
                setNotifySuperadmin={setNotifySuperadmin}
                itemApproval={itemApproval[i]}
                setItemApproval={setItemApproval}
                itemRejectReason={itemRejectReason[i] ?? ""}
                setItemRejectReason={setItemRejectReason}
              />
            ))}
          </div>

          {/* Confirm Block */}
          <div style={{ margin: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={confirmedReceived}
                onChange={e => setConfirmedReceived(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: C.burg, cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
                I confirm that the materials have been verified and received perfectly.
              </span>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!allFilled || !allApproved || !confirmedReceived}
              style={{
                ...btnPrimary,
                height: 52,
                marginTop: 6,
                gap: 8,
                opacity: (allFilled && allApproved && confirmedReceived) ? 1 : 0.5,
                cursor: (allFilled && allApproved && confirmedReceived) ? "pointer" : "default"
              }}
            >
              <CheckCircle2 size={17} /> Confirm Receipt — Generate GRN
            </button>
          </div>
        </>
      )}

      {mode === "all" && (
        <>
          <SectionLabel step={0} title="Receipt History" />
          <div style={{ margin: "0 20px" }}>
            <ReceiptHistoryTable receiptHistory={receiptHistory} compact />
          </div>
        </>
      )}
    </div>
  );
}
