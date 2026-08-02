import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Printer } from "lucide-react";
import {
  Purchase, SareeTag,
  formatINR, lineProfit, purchaseTotals, expandSareePieces,
} from "../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../theme";

/** Full saree/barcode breakdown for one purchase — one row per physical piece. */
export function SareeListModal({
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
  // One row per physical saree — a line bought in bulk is tagged piece by piece.
  const pieces = expandSareePieces(purchase.sarees);
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
            width: "min(94vw, 1040px)",
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

          <div style={{ overflow: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.silkCream }}>
                  {["S.No", "Saree Code", "Line Serial", "Saree Type", "Colour", "Weight", "Buying Price", "Sell %", "Selling Price", "Profit", "Notes", "Barcode"].map((h) => (
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
                {pieces.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory, borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>
                      {s.id}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" as const }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{s.lineCode}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginLeft: 6 }}>
                        pc {s.pieceNo}/{s.lineQuantity}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {s.sareeType || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {s.color || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {s.weight}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {formatINR(s.price)}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>
                      {s.sellPercent}%
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>
                      {formatINR(s.finalAmount)}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.green, whiteSpace: "nowrap" as const }}>
                      {formatINR(lineProfit(s))}
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
                ))}
              </tbody>
              {(() => {
                const t = purchaseTotals(purchase.sarees);
                return (
                  <tfoot>
                    <tr style={{ background: T.silkCream, borderTop: `1px solid ${T.borderDef}` }}>
                      <td colSpan={6} style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>
                        Totals — {t.pieces} piece{t.pieces !== 1 ? "s" : ""}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>{formatINR(t.buying)}</td>
                      <td style={{ padding: "10px 14px" }} />
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>{formatINR(t.selling)}</td>
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green, whiteSpace: "nowrap" as const }}>{formatINR(t.profit)}</td>
                      <td colSpan={2} style={{ padding: "10px 14px" }} />
                    </tr>
                  </tfoot>
                );
              })()}
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
    </AnimatePresence>
  );
}
