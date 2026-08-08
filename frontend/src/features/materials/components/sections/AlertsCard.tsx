import React, { useContext, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Plus, Package, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { T, F, EASE, MobileCtx } from "../theme";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { FadeUp, AnimatedBar } from "../common/primitives";
import { ThresholdsModal } from "../modals/ReportModals";
import { Button } from "../../../../shared/ui/primitives";

export function AlertsCard({ onCreatePO }: { onCreatePO?: () => void }) {
  const { px } = useContext(MobileCtx);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);

  const { data: stockRes } = useQuery({
    queryKey: ["raw-material-stock-list"],
    queryFn: () => rawMaterialsApi.listStock(),
  });

  const stockItems = stockRes?.items ?? [];

  const dynamicAlerts = stockItems
    .filter(item => Number(item.currentStock) < Number(item.reorderLevel))
    .map(item => {
      const current = Number(item.currentStock);
      const reorder = Number(item.reorderLevel);
      const pct = Math.min(100, Math.round((current / Math.max(1, reorder)) * 100));
      const displayName = [item.name, item.color, item.grade].filter(Boolean).join(" - ");
      return {
        id: item.id,
        type: item.materialType,
        displayName,
        current: `${current} ${item.unit}`,
        minLabel: `${reorder} ${item.unit}`,
        pct,
      };
    });

  return (
    <FadeUp id="mat-alerts" style={{ padding: `28px ${px}px 0` }}>
      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid rgba(110,15,45,0.08)", borderTop: `3px solid ${dynamicAlerts.length > 0 ? T.crimson : T.green}`, boxShadow: "0 4px 24px rgba(192,57,43,0.08)", padding: "26px 32px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {dynamicAlerts.length > 0 ? <AlertTriangle size={22} color={T.crimson} /> : <CheckCircle2 size={22} color={T.green} />}
            <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 18, color: T.luxuryBrown }}>Stock Alerts — Items That Need Attention</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Button onClick={onCreatePO} variant="primary" size="sm" iconLeft={Plus}>
              Create Purchase Order
            </Button>
            <Button onClick={() => setThresholdsOpen(true)} variant="link" size="sm">
              Set Alert Thresholds →
            </Button>
          </div>
        </div>
        <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, margin: "0 0 24px", lineHeight: 1.6 }}>
          {dynamicAlerts.length > 0
            ? "The following materials have gone below the minimum stock level set by the system admin. Please create a purchase order to restock."
            : "All raw materials are currently above reorder thresholds."}
        </p>

        {dynamicAlerts.length === 0 ? (
          <div style={{ background: "rgba(30,102,64,0.06)", border: "1px solid rgba(30,102,64,0.18)", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={18} color={T.green} />
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.green }}>
              Stock levels healthy across all raw materials. No immediate reorders required.
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {dynamicAlerts.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                style={{ background: "#FFFFFF", border: "1px solid rgba(192,57,43,0.14)", borderLeft: `3px solid ${T.crimson}`, borderRadius: 10, padding: "18px 20px", minWidth: 240, flex: "1 1 240px", maxWidth: 300, boxShadow: "0 2px 10px rgba(192,57,43,0.05)" }}
              >
                <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>{a.type}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.displayName}>{a.displayName}</div>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 30, color: T.crimson, lineHeight: 1, marginBottom: 6 }}>{a.current}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, marginBottom: 14 }}>
                  Minimum set: {a.minLabel}
                </div>
                <div style={{ marginBottom: 16 }}><AnimatedBar pct={a.pct} color={T.crimson} height={6} trackBg="rgba(192,57,43,0.10)" /></div>
                <Button onClick={onCreatePO} variant="primary" size="sm" iconLeft={Package} fullWidth>
                  Create Purchase Order
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <ThresholdsModal open={thresholdsOpen} onClose={() => setThresholdsOpen(false)} stockItems={stockItems} onSave={() => {}} />
    </FadeUp>
  );
}

