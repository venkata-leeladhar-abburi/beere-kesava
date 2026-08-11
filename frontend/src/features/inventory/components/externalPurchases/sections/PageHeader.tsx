import React from "react";
import { Download, Plus } from "lucide-react";
import { T, F } from "../theme";
import { Button } from "../../../../../shared/ui/primitives";

/** Hero banner + Export/Add action buttons for the External Purchases page. */
export function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", zIndex: 2, padding: "48px 56px 110px 48px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
            Since 1999 · External Purchases
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>External Purchases</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Branch Inventory Oversight</span>
          </div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 18, color: "rgba(255,253,249,0.70)", lineHeight: 1.6, maxWidth: 600, margin: "0 0 20px" }}>
            Track every saree purchased from external suppliers — with GST, invoice details, and an auto-generated printable barcode for each saree. Visible across all branches.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, zIndex: 10, alignSelf: "flex-start", marginTop: 8 }}>
          <Button variant="secondary" size="sm" iconLeft={Download} className="bg-transparent text-white border border-white/25 hover:bg-white/10 shadow-none">
            Export
          </Button>
          <Button onClick={onAdd} size="sm" iconLeft={Plus} className="bg-[var(--bk-gold-500)] text-[#3B2314] font-semibold hover:bg-[var(--bk-gold-500)]/90 border-none shadow-none">
            Add External Purchase
          </Button>
        </div>
      </div>
    </header>
  );
}
