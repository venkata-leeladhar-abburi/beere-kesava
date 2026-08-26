import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2 as CheckCircle } from "lucide-react";
import { X } from "lucide-react";
import { StockSaree, STATUS_CFG } from "./StockCard";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";
import { EntityCode } from "@/shared/ui/domain";

const T = {
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
export function ViewStockDialog({ saree, onClose }: { saree: StockSaree; onClose: () => void }) {
  const cfg = STATUS_CFG[saree.status];
  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,253,249,0.55)", letterSpacing: "1px", marginBottom: 4 }}>SAREE DETAILS</div>
            <Dialog.Title style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9", margin: 0 }}>{saree.id}</Dialog.Title>
            <Dialog.Description className="sr-only">Stock details for saree {saree.id}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <IconButton
              icon={X}
              label="Close"
              onClick={onClose}
              size="sm"
              className="border border-white/22 bg-white/12 text-white hover:bg-white/20"
            />
          </Dialog.Close>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 11, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={20} color={cfg.color} />
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
              {saree.assignedAt && <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 2 }}>Since: {saree.assignedAt}</div>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12, marginBottom: 18 }}>
            {[
              { label: "Saree ID",   val: saree.id,       entityType: "saree" as const },
              { label: "Design",     val: saree.design },
              { label: "Saree Type", val: saree.sareeType },
              { label: "Weight",     val: saree.weight },
              { label: "QC Date",    val: saree.qcDate },
              saree.source === "external"
                ? { label: "Invoice No.", val: saree.invoiceNumber || "—" }
                : { label: "Loom No.",    val: `Loom ${saree.loom}` },
            ].map(r => (
              <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{r.label}</div>
                {"entityType" in r && r.entityType ? (
                  <EntityCode type={r.entityType} value={r.val} />
                ) : (
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, fontVariantNumeric: "tabular-nums" }}>{r.val}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(110,15,45,0.05)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Source</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
              {saree.source === "factory"  ? `Own Factory · Loom ${saree.loom}`
             : saree.source === "external" ? `External Purchase · ${saree.supplier} (${saree.supplierLocation}) · ${saree.purchaseId}`
             :                               `${saree.weaver} (${saree.weaverCode}) · Loom ${saree.loom}`}
            </div>
          </div>
          {saree.customer && (
            <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                {saree.status === "sold" ? "Sold To" : "Assigned Wholesale Order"}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{saree.customer}</div>
              {saree.saleRef && <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, marginTop: 3 }}>{saree.saleRef}</div>}
            </div>
          )}
          <Button
            onClick={onClose}
            variant="primary"
            size="lg"
            fullWidth
            className="bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:opacity-95 border-none shadow-none"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
