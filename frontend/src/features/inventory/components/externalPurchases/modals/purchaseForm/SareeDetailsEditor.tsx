import React from "react";
import { Plus } from "lucide-react";
import { formatINR, purchaseTotals } from "../../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../../theme";
import { SareeRow } from "../../types";
import { SareeRowCard } from "./SareeRowCard";

/** "Saree Details" section of the Add/Edit Purchase form — per-saree line entry. */
export function SareeDetailsEditor({
  sareeDetails,
  supplier,
  invoiceNumber,
  addSareeRow,
  updateSareeRow,
  removeSareeRow,
}: {
  sareeDetails: SareeRow[];
  supplier: string;
  invoiceNumber: string;
  addSareeRow: () => void;
  updateSareeRow: (uid: string, patch: Partial<SareeRow>) => void;
  removeSareeRow: (uid: string) => void;
}) {
  const totals = purchaseTotals(sareeDetails);
  const pieceCount = totals.pieces;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>
          Saree Details ({sareeDetails.length} line{sareeDetails.length !== 1 ? "s" : ""} · {pieceCount} pc)
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

      {/* Overall stats for every saree in this purchase */}
      {sareeDetails.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Total Buying", value: totals.buying, color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
            { label: "Total Selling", value: totals.selling, color: T.royalBurgundy, bg: "rgba(110,15,45,0.05)", border: T.borderDef },
            { label: "Total Profit", value: totals.profit, color: T.green, bg: T.greenBg, border: "rgba(30,102,64,0.20)" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color }}>{formatINR(value)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sareeDetails.map((s, idx) => (
          <SareeRowCard
            key={s._uid}
            s={s}
            idx={idx}
            supplier={supplier}
            invoiceNumber={invoiceNumber}
            updateSareeRow={updateSareeRow}
            removeSareeRow={removeSareeRow}
          />
        ))}
      </div>

      {sareeDetails.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown }}>
            Total — {pieceCount} piece{pieceCount !== 1 ? "s" : ""}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
            buying {formatINR(totals.buying)} · selling{" "}
            <strong style={{ color: T.royalBurgundy }}>{formatINR(totals.selling)}</strong> · profit{" "}
            <strong style={{ color: T.green }}>{formatINR(totals.profit)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
