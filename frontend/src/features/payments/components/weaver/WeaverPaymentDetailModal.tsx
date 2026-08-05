import React, { useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useBatches } from "../../../production/contexts/BatchContext";
import { useDesignLibrary } from "../../../design-library/contexts/DesignLibraryContext";
import { SareeTypeCard, getSareeTypeByCode } from "../../../pricing/components/RatesPricingPage";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { RATE_ROWS } from "../../data/weavers";
import { EASE, F, T } from "../../theme";
import { WeaverRecord } from "../../types";
import { calcCharges } from "../../utils/charges";
import { Pip, StatusBadge } from "../common/primitives";

// ── Weaver Payment Detail Modal ───────────────────────────────────────────────
export function WeaverPaymentDetailModal({ weaver, onClose }: { weaver: WeaverRecord | null; onClose: () => void }) {
  const { getPaymentsForWeaver } = useWeaverPayments();
  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();

  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);

  if (!weaver) return null;

  const chargeRows = [
    { key: "sb", count: weaver.sb }, { key: "hz", count: weaver.hz }, { key: "ps", count: weaver.ps },
    { key: "bs", count: weaver.bs }, { key: "st", count: weaver.st },
  ].map(r => ({ ...r, rate: RATE_ROWS.find(rr => rr.code.slice(0, 2).toLowerCase() === r.key)! }))
    .filter(r => r.count > 0);
  const totalCharges = calcCharges(weaver);

  const payments = getPaymentsForWeaver(weaver.id);

  const myBatches = batches.filter(b => (b.status === "active" || b.status === "draft") && b.rows.some(r => r.weaverId === weaver.id));


  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", padding: "10px 12px", textAlign: "left", background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "10px 12px", borderBottom: `1px solid ${T.borderDef}` };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 680, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <Pip initials={weaver.initials} bg={weaver.bg} size={46} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{weaver.name}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight, marginTop: 2 }}>{weaver.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.70)", marginTop: 2 }}>📍 {weaver.village}</div>
          </div>
          <StatusBadge status={weaver.status} />
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 26 }}>

          {/* Section 1 — Making Charges Breakdown */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 10 }}>Making Charges Breakdown</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Saree Type Code", "Saree Type Name", "Count", "Rate", "Subtotal"].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chargeRows.map(r => (
                    <tr key={r.key}>
                      <td style={TD}>
                        <span onClick={() => setOpenSareeTypeCode(r.rate.code)}
                          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                          style={{ fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer" }}>{r.rate.code}</span>
                      </td>
                      <td style={TD}>{r.rate.name}</td>
                      <td style={TD}>{r.count}</td>
                      <td style={{ ...TD, fontFamily: F.mono }}>₹{r.rate.rate}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontWeight: 600 }}>₹{(r.count * r.rate.rate).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr style={{ background: T.warmCream }}>
                    <td colSpan={4} style={{ ...TD, fontWeight: 700, borderBottom: "none" }}>Total Making Charges</td>
                    <td style={{ ...TD, fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, borderBottom: "none" }}>₹{totalCharges.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
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
        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>

      <AnimatePresence>

        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
  );
}
