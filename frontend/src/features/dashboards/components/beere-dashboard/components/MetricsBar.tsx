import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { T, F, G, NUM, EASE } from '../theme';
import { IcoResourceMgmt, IcoFabricRoll, IcoInvoice, IcoQualityCheck, IcoTruck } from '../ui';
import { AnimatedNumber } from '../ui';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

/** Icon set in the same order as the metrics array from useDashboardMetrics */
const ICONS = [
  <IcoResourceMgmt sz={22} col={T.warmCream} />,
  <IcoFabricRoll   sz={22} col={T.warmCream} />,
  <IcoInvoice      sz={22} col={T.warmCream} />,
  <IcoQualityCheck sz={22} col={T.warmCream} />,
  <IcoTruck        sz={22} col={T.warmCream} />,
];

export function MetricsBar() {
  const { metrics, isLoading, isError } = useDashboardMetrics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -56, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {ICONS[i]}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 48, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                {isError ? (
                  <span style={{ fontSize: 22, opacity: 0.85, color: "#e57373" }}>Error</span>
                ) : isLoading ? (
                  <span style={{ fontSize: 28, opacity: 0.45 }}>—</span>
                ) : (
                  <AnimatedNumber raw={m.val} />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: isError ? "#e57373" : m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {isError ? "Failed to load" : m.sub}
                </span>
                {m.hi && (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(200,155,71,0.10)" }}
                  >
                    <ChevronRight size={10} color={T.goldLight} />
                  </motion.div>
                )}
              </div>
            </div>
            {m.hi && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
