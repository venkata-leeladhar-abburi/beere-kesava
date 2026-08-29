import React, { useState } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { useBatches } from "@/features/production";
import { SareeTypeCard } from "@/features/pricing";
import { useRatesPricing } from "@/features/pricing";
import { useWeaverPayments } from "@/features/weavers";
import { F, T } from "../../theme";
import { WeaverRecord } from "../../types";
import { calcCharges } from "../../utils/charges";
import { Pip, StatusBadge } from "../common/primitives";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import type { WeaverEarningsBreakdown } from "../../../../shared/api/payments";
import type { WeaverPaymentRecord } from "../../../weavers/contexts/WeaverPaymentsContext";
import { rupees } from "@/lib/domain/money";
import { formatRecordedBy } from "@/lib/domain/actor";
import { EntityCode, Money } from "@/shared/ui/domain";

// ── Weaver Payment Detail Modal ───────────────────────────────────────────────
export function WeaverPaymentDetailModal({ weaver, onClose }: { weaver: WeaverRecord | null; onClose: () => void }) {
  const { getPaymentsForWeaver, getEarningsForWeaver } = useWeaverPayments();
  const { batches } = useBatches();
  const { getSareeTypeByCode } = useRatesPricing();

  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);

  if (!weaver) return null;

  // Real per-saree-type breakdown: QC-passed count x SareeTypeRate making
  // charge, computed server-side (GET /payments/weavers/earnings) — never a
  // hardcoded rate table.
  const earnings = getEarningsForWeaver(weaver.id);
  const chargeRows = earnings?.breakdown ?? [];
  const totalCharges = calcCharges(weaver);

  const payments = getPaymentsForWeaver(weaver.id);

  const myBatches = batches.filter(b => (b.status === "active" || b.status === "draft") && b.rows.some(r => r.weaverId === weaver.id));


  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  const paymentColumns: ColumnDef<WeaverPaymentRecord>[] = [
    {
      id: "amountPaid", header: "Amount Paid", accessor: r => r.amountPaid, type: "number",
      cell: (_v, r) => <span style={{ fontWeight: 700, color: T.green }}><Money value={rupees(r.amountPaid)} /></span>,
    },
    {
      id: "utrNumber", header: "UTR Number", accessor: r => r.utrNumber,
      cell: (_v, r) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.utrNumber || "—"}</span>,
    },
    { id: "firmName", header: "Firm", accessor: r => r.firmName },
    { id: "paymentDate", header: "Payment Date", accessor: r => r.paymentDate },
    { id: "batchNo", header: "Batch No.", accessor: r => r.batchNo, cell: (_v, r) => <>{r.batchNo || "—"}</> },
    { id: "loomNumber", header: "Loom No.", accessor: r => r.loomNumber, cell: (_v, r) => <>{r.loomNumber || "—"}</> },
    { id: "noOfSarees", header: "No. of Sarees", accessor: r => r.noOfSarees ?? "", type: "number", cell: (_v, r) => <>{r.noOfSarees ?? "—"}</> },
    {
      id: "deduction", header: "Deduction", accessor: r => r.deduction ?? "", type: "number",
      cell: (_v, r) => <span style={{ color: r.deduction ? T.crimson : T.luxuryBrown }}>{r.deduction ? <Money value={rupees(r.deduction)} /> : "—"}</span>,
    },
    {
      id: "recordedBy", header: "Recorded By", accessor: r => formatRecordedBy(r.recordedBy) ?? "",
      cell: (_v, r) => <>{formatRecordedBy(r.recordedBy)}</>,
    },
  ];

  const chargeColumns: ColumnDef<WeaverEarningsBreakdown>[] = [
    {
      id: "sareeTypeCode", header: "Saree Type Code", accessor: r => r.sareeTypeCode,
      cell: (_v, r) => (
        <button
          type="button"
          onClick={() => setOpenSareeTypeCode(r.sareeTypeCode)}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = "none"}
          style={{ fontWeight: 700, color: T.royalBurgundy, cursor: "pointer", background: "none", border: "none", padding: 0 }}
        >
          {r.sareeTypeCode}
        </button>
      ),
    },
    { id: "sareeTypeName", header: "Saree Type Name", accessor: r => r.sareeTypeName },
    { id: "completedCount", header: "Count", accessor: r => r.completedCount, type: "number" },
    {
      id: "ratePerSaree", header: "Rate", accessor: r => r.ratePerSaree,
      cell: (_v, r) => <Money value={rupees(r.ratePerSaree)} />,
    },
    {
      id: "amount", header: "Subtotal", accessor: r => r.amount,
      cell: (_v, r) => <span style={{ fontWeight: 600 }}><Money value={rupees(r.amount)} /></span>,
    },
  ];

  return (
    <Modal open={!!weaver} onOpenChange={o => !o && onClose()} size="lg">
      <>
        {/* Header — bespoke gradient, doesn't fit Modal.Header's plain title/subtitle API */}
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, borderRadius: "var(--radius-xl) var(--radius-xl) 0 0" }}>
          <Pip initials={weaver.initials} bg={weaver.bg} size={46} />
          <div style={{ flex: 1 }}>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{weaver.name}</div>
            </Dialog.Title>
            <Dialog.Description asChild><div style={{ marginTop: 2 }}><EntityCode type="weaver" value={weaver.code} size="sm" /></div></Dialog.Description>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.70)", marginTop: 2 }}>📍 {weaver.village}</div>
          </div>
          <div style={{ marginRight: 44, flexShrink: 0 }}>
            <StatusBadge status={weaver.status} />
          </div>
          <span style={{ position: "absolute", top: 16, right: 16, display: "inline-block", background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", borderRadius: 8 }}>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close"
                variant="ghost"
                size="md"
                onClick={onClose}
              />
            </Dialog.Close>
          </span>
        </div>

        {/* Body */}
        <Modal.Body className="px-7 pt-6 pb-7 flex flex-col gap-[26px]">

          {/* Section 1 — Making Charges Breakdown */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 10 }}>Making Charges Breakdown</div>
            {chargeRows.length === 0 && (
              <div style={{ background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>
                No QC-passed sarees on record for this weaver yet.
              </div>
            )}
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <DataTable columns={chargeColumns} data={chargeRows} getRowId={r => r.sareeTypeCode} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.warmCream, borderTop: `1px solid ${T.borderDef}` }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 700 }}>Total Making Charges</span>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.royalBurgundy }}><Money value={rupees(totalCharges)} /></span>
              </div>
            </div>
          </div>

          {/* Section 2 — Payment History */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 10 }}>Payment History</div>
            {payments.length === 0 ? (
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>
                No payments uploaded yet. Upload Excel on this page to see payment history.
              </div>
            ) : (
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflowX: "auto" }}>
                <DataTable
                  columns={paymentColumns}
                  data={payments}
                  getRowId={p => `${p.utrNumber || "no-utr"}-${p.paymentDate}-${p.firmName}`}
                  density="compact"
                />
              </div>
            )}
          </div>

          {/* Section 3 — Flow Context */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 10 }}>Flow Context</div>
            {myBatches.length === 0 ? (
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>
                No active batches currently.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {myBatches.map(b => {
                  const row = b.rows.find(r => r.weaverId === weaver.id);
                  return (
                    <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const }}>
                      <EntityCode type="batch" value={b.batchId} size="sm" />

                      {row?.sareeTypeCode && (
                        <button type="button" onClick={() => setOpenSareeTypeCode(row.sareeTypeCode!)}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = "none"}
                          style={{ fontSize: 12, color: T.royalBurgundy, cursor: "pointer", background: "none", border: "none", padding: 0 }}>{row.sareeTypeCode}</button>
                      )}
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: b.status === "active" ? T.green : T.antiqueGold, background: b.status === "active" ? "rgba(30,102,64,0.10)" : "rgba(200,155,71,0.13)", padding: "3px 10px", borderRadius: 20, marginLeft: "auto" }}>
                        {b.status === "active" ? "Active" : "Draft"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer>
        <Button variant="primary" size="md" onClick={onClose}>Close</Button>
      </Modal.Footer>
      </>

      {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
    </Modal>
  );
}
