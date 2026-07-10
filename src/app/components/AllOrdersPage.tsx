import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { BULK_ORDERS, BulkOrder, BulkOrderCard, OrderDialogContent, ProductionDialog } from "./ProductionPage";

const T = { silkCream: "#F7F2EA", royalBurgundy: "#6E0F2D", deepWine: "#4A061B", luxuryBrown: "#3B2314", taupe: "#8B7060", borderDef: "rgba(110,15,45,0.10)" };
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

export function AllOrdersPage({ onBack }: { onBack?: () => void }) {
  const [dialog, setDialog] = useState<{ mode: "view" | "slip"; order: BulkOrder } | null>(null);
  return (
    <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, padding: "34px 48px", color: "#FFFDF9" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", marginBottom: 22 }}><ArrowLeft size={16} /> Back to Production</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}><ShoppingBag size={30} /><div><h1 style={{ margin: 0, fontFamily: F.display, fontSize: 38 }}>All Bulk Orders</h1><p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.68)" }}>Complete wholesale production order queue.</p></div></div>
      </div>
      <div style={{ padding: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
        {BULK_ORDERS.map((o, i) => <motion.div key={o.ref} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}><BulkOrderCard o={o} onView={(order) => setDialog({ mode: "view", order })} onSlip={(order) => setDialog({ mode: "slip", order })} /></motion.div>)}
      </div>
      {dialog && <ProductionDialog open={!!dialog} title={dialog.mode === "view" ? "View order" : "Colour slip"} onClose={() => setDialog(null)}><OrderDialogContent order={dialog.order} mode={dialog.mode} /></ProductionDialog>}
    </div>
  );
}
