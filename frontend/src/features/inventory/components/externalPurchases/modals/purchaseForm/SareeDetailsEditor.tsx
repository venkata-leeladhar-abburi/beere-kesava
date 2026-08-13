import React from "react";
import { Plus } from "lucide-react";
import { purchaseTotals } from "../../../../../suppliers/contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { T, F } from "../../theme";
import { Button } from "../../../../../../shared/ui/primitives";
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
        <Button variant="primary" size="sm" iconLeft={Plus} onClick={addSareeRow}>
          Add Saree
        </Button>
      </div>

      {sareeDetails.length === 0 && (
        <div
          style={{
            background: T.silkCream,
            borderRadius: 10,
            padding: "14px",
            textAlign: "center",
            fontFamily: F.ui,
            fontSize: 12,
            color: T.taupe,
          }}
        >
          No sarees added yet. Click "Add Saree" to enter details for each saree in this purchase.
        </div>
      )}

      {/* Overall stats for every saree in this purchase */}
      {sareeDetails.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 8, marginBottom: 12 }}>
          {[
            { label: "Total Buying", value: totals.buying, color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
            { label: "Total Selling", value: totals.selling, color: T.royalBurgundy, bg: "rgba(110,15,45,0.05)", border: T.borderDef },
            { label: "Total Profit", value: totals.profit, color: T.green, bg: T.greenBg, border: "rgba(30,102,64,0.20)" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color }}>{formatMoney(rupees(value))}</div>
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
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>
            Total — {pieceCount} piece{pieceCount !== 1 ? "s" : ""}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
            buying {formatMoney(rupees(totals.buying))} · selling{" "}
            <strong style={{ color: T.royalBurgundy }}>{formatMoney(rupees(totals.selling))}</strong> · profit{" "}
            <strong style={{ color: T.green }}>{formatMoney(rupees(totals.profit))}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
