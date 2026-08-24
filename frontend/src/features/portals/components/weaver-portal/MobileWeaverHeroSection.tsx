import React from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { T, F, G } from "@/features/dashboards";
import { IcoFabricRoll, IcoQualityCheck, IcoInvoice, IcoResourceMgmt, IcoWarehouse } from "@/features/dashboards";
import { useWeaverDashboardMetrics } from "./desktop/useWeaverDashboardMetrics";
import { BG_IMAGE } from "./WeaverBatchNotifData";
import { LuxuryStatsCard, type StatItem } from "@/shared/ui/LuxuryStatsCard";

const ICONS = [
  <IcoResourceMgmt key="resource-mgmt" sz={22} col={T.warmCream} />,
  <IcoFabricRoll   key="fabric-roll"   sz={22} col={T.warmCream} />,
  <IcoQualityCheck key="quality-check" sz={22} col={T.warmCream} />,
  <IcoWarehouse    key="warehouse"     sz={22} col={T.warmCream} />,
  <IcoInvoice      key="invoice"       sz={22} col={T.warmCream} />,
];

export function MobileWeaverHeroSection({
  weaverName,
  onExploreBatches,
  onGoToPayments,
}: {
  weaverName: string;
  onExploreBatches: () => void;
  onGoToPayments: () => void;
}) {
  const { metrics, isError } = useWeaverDashboardMetrics();

  const statItems: StatItem[] = metrics.map((m, i) => ({
    label: m.label.toUpperCase(),
    value: isError ? "Error" : m.val,
    sub: isError ? "Failed to load" : m.sub,
    icon: ICONS[i],
    highlight: m.hi,
    goldVal: m.hi,
    onClick: i === 4 || m.label.toLowerCase().includes("charge") || m.label.toLowerCase().includes("payment") ? onGoToPayments : undefined,
  }));

  return (
    <div>
      {/* ── HERO HEADER SECTION ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#0D0207", paddingTop: 32, paddingBottom: 76 }}>
        {/* Background image overlay */}
        <motion.img
          src={BG_IMAGE}
          alt="Beere Kesava & Brothers Silks Weaving"
          initial={{ scale: 1.12, opacity: 0 }}
          animate={{ scale: 1.0, opacity: 0.3 }}
          transition={{ duration: 8, ease: "linear", opacity: { duration: 1.2 } }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", pointerEvents: "none" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,2,7,0.7) 0%, #0D0207 100%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 5, padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 11, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Since 1999 · Weaver Portal
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 32, color: T.warmCream, lineHeight: 1.12 }}>
              Welcome back,
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontStyle: "italic", fontSize: 36, color: T.antiqueGold, lineHeight: 1.12 }}>
              {weaverName}
            </div>
          </div>

          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.90)", lineHeight: 1.75, margin: 0, maxWidth: "440px" }}>
            Your batches, materials, and earnings — all in one place, updated in real time as your work moves through the workshop.
          </p>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
            <button
              onClick={onExploreBatches}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "11px 22px", borderRadius: 16, border: "none", cursor: "pointer", background: G.button, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.warmCream, boxShadow: "0 8px 32px rgba(110,15,45,0.40)" }}
            >
              View My Batches
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={T.warmCream} />
              </div>
            </button>
            <button
              onClick={onGoToPayments}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 16, cursor: "pointer", backgroundColor: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.30)", fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: "rgba(245,232,208,0.92)" }}
            >
              My Payments
            </button>
          </div>
        </div>
      </section>

      {/* ── FLOATING METRICS STRIP (LUXURY STATS CARD OVERLAPPING HERO) ── */}
      <div style={{ padding: "0 16px", marginTop: -56, position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={statItems} />
      </div>
    </div>
  );
}
