import React from "react";
import { motion } from "motion/react";
import { T, F, G, NUM, EASE } from "../../../../dashboards/components/beere-dashboard/theme";
import { AnimatedNumber, IcoFabricRoll, IcoQualityCheck, IcoInvoice, IcoResourceMgmt, IcoWarehouse } from "../../../../dashboards/components/beere-dashboard/ui";
import { useWeaverDashboardMetrics } from "./useWeaverDashboardMetrics";

const ICONS = [
  <IcoResourceMgmt sz={22} col={T.warmCream} />,
  <IcoFabricRoll   sz={22} col={T.warmCream} />,
  <IcoQualityCheck sz={22} col={T.warmCream} />,
  <IcoWarehouse    sz={22} col={T.warmCream} />,
  <IcoInvoice      sz={22} col={T.warmCream} />,
];

/** Same floating card-strip treatment as the admin dashboard's MetricsBar, over this weaver's own real numbers. */
export function WeaverMetricsBar() {
  const { metrics, isError } = useWeaverDashboardMetrics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -48, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 24, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 128 }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.08, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "24px 20px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < metrics.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ICONS[i]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 36, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1.0, marginBottom: 6, ...NUM }}>
                {isError ? <span style={{ fontSize: 18, opacity: 0.85, color: "#e57373" }}>Error</span> : <AnimatedNumber raw={m.val} />}
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: isError ? "#e57373" : m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                {isError ? "Failed to load" : m.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
