import { useState } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence } from "motion/react";

import { useBatches } from "../../../production/contexts/BatchContext";
import { useDesignLibrary } from "../../../design-library/contexts/DesignLibraryContext";
import { SareeTypeCard, getSareeTypeByCode } from "../../../pricing/components/RatesPricingPage";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { F, T } from "../../theme";
import { WeaverRecord } from "../../types";
import { calcCharges } from "../../utils/charges";
import { Pip, StatusBadge } from "../common/primitives";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Modal } from "../../../../shared/ui/overlay";
import type { WeaverEarningsBreakdown } from "../../../../shared/api/payments";

// ── Weaver Payment Detail Modal ───────────────────────────────────────────────
export function WeaverPaymentDetailModal({ weaver, onClose }: { weaver: WeaverRecord | null; onClose: () => void }) {
  const { getPaymentsForWeaver, getEarningsForWeaver } = useWeaverPayments();
  const { batches } = useBatches();
  useDesignLibrary();

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

  const chargeColumns: ColumnDef<WeaverEarningsBreakdown>[] = [
    {
      id: "sareeTypeCode", header: "Saree Type Code", accessor: r => r.sareeTypeCode,
      cell: (_v, r) => (
        <span
          onClick={() => setOpenSareeTypeCode(r.sareeTypeCode)}
          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
          style={{ fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer" }}
        >
          {r.sareeTypeCode}
        </span>
      ),
    },
    { id: "sareeTypeName", header: "Saree Type Name", accessor: r => r.sareeTypeName },
    { id: "completedCount", header: "Count", accessor: r => r.completedCount, type: "number" },
    {
      id: "ratePerSaree", header: "Rate", accessor: r => r.ratePerSaree,
      cell: (_v, r) => <span style={{ fontFamily: F.mono }}>₹{r.ratePerSaree}</span>,
    },
    {
      id: "amount", header: "Subtotal", accessor: r => r.amount,
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 600 }}>₹{r.amount.toLocaleString("en-IN")}</span>,
    },
  ];

  return (
    <>
    <Modal open onOpenChange={o => !o && onClose()} size="lg">
        {/* Header */}
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <Pip initials={weaver.initials} bg={weaver.bg} size={46} />
          <div style={{ flex: 1 }}>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{weaver.name}</div>
            </Dialog.Title>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight, marginTop: 2 }}>{weaver.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.70)", marginTop: 2 }}>📍 {weaver.village}</div>
          </div>
          <StatusBadge status={weaver.status} />
          <Dialog.Close asChild>
            <span style={{ display: "inline-block", background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", borderRadius: 8 }}>
              <IconButton
                icon={X}
                label="Close"
                variant="ghost"
                size="md"
              />
            </span>
          </Dialog.Close>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 26, overflowY: "auto" }}>

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
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.royalBurgundy }}>₹{totalCharges.toLocaleString("en-IN")}</span>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {payments.map((p, i) => (
                  <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>Amount Paid</div>
                      <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}>₹{p.amountPaid.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>UTR Number</div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{p.utrNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>Firm</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.firmName}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>Payment Date</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.paymentDate}</div>
                    </div>
                  </div>
                ))}
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
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>

                      {row?.sareeTypeCode && (
                        <span onClick={() => setOpenSareeTypeCode(row.sareeTypeCode!)}
                          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                          style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, cursor: "pointer" }}>{row.sareeTypeCode}</span>
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
        </div>

        {/* Footer */}
        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="primary" size="md" onClick={onClose}>Close</Button>
        </div>
    </Modal>

      <AnimatePresence>
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </>
  );
}
