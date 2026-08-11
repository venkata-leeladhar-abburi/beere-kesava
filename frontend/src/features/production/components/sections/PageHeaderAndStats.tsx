import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Factory, CheckCircle2, AlertCircle } from "lucide-react";
import { imgSaree as imgSareeHero } from "../../../../shared/constants/weaverImages";
import { T, F } from "../theme";
import { useBatches } from "../../contexts/BatchContext";
import { qcApi } from "../../../../shared/api/qc";

function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function PageHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", zIndex: 2, padding: "48px 0 90px 48px", flex: "0 0 65%", maxWidth: "65%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999 · PRODUCTION MANAGEMENT</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Production</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Batch Overview</span>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 18, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 600, lineHeight: 1.6 }}>
          See all active batches, track saree production at every stage, manage quality check, assign finishing work, and monitor bulk order progress — all in one place.
        </p>
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
        <img src={imgSareeHero} alt="Banarasi silk saree" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}

export function StatsStrip() {
  const { batches } = useBatches();
  const { data: qcRecords = [] } = useQuery({
    queryKey: ["qc", "stats-strip"],
    queryFn: () => qcApi.list().then(r => r.items),
  });

  const now = new Date();
  const activeBatches = batches.filter(b => b.status === "active" || b.status === "draft");
  // "Sarees being produced" = every assigned saree, across every batch, that
  // hasn't finished the pipeline yet — not QC-passed and not finished
  // (finishing complete via either the Worker Staff receive-back flow or the
  // Raise Quotation receive flow). Covers the whole in-progress lifecycle,
  // not just rows Worker Staff has already received.
  const sareesInProduction = batches.reduce(
    (sum, b) => sum + b.rows.filter(r => r.sareeId && !r.qcPassed && !r.finished).length,
    0,
  );
  // "Completed this month" credits a saree either for passing QC this month
  // or for finishing this month (via the Worker Staff receive-back flow or
  // the Raise Quotation receive flow) — a saree whose QC pass fell in an
  // earlier month still counts once it's actually finished this month.
  // Deduplicated by saree ID so one saree can't be counted twice.
  const completedThisMonthIds = new Set<string>();
  qcRecords.forEach(r => {
    if (r.result === "PASSED" && isSameMonth(r.qcDate, now)) completedThisMonthIds.add(r.sareeId);
  });
  batches.forEach(b => {
    b.rows.forEach(r => {
      if (r.sareeId && r.finished && r.finishedAt && isSameMonth(r.finishedAt, now)) {
        completedThisMonthIds.add(r.sareeId);
      }
    });
  });
  const sareesCompletedThisMonth = completedThisMonthIds.size;
  // Only rows Worker Staff has actually received count as "waiting for QC" —
  // matches WorkerQC's own pending-queue definition (see WorkerQC.tsx).
  const sareesWaitingQc = batches.reduce(
    (sum, b) => sum + b.rows.filter(r => r.sareeId && r.receivedAt && !r.qcPassed && b.status !== "draft").length,
    0,
  );

  const STATS = [
    { label: "TOTAL BATCHES ACTIVE RIGHT NOW",   value: String(activeBatches.length),          sub: "Across all weavers currently",  highlight: false, crimson: false, goldVal: false },
    { label: "SAREES BEING PRODUCED",            value: String(sareesInProduction),            sub: "In progress across all batches", highlight: false, crimson: false, goldVal: false },
    { label: "SAREES COMPLETED THIS MONTH",      value: String(sareesCompletedThisMonth),       sub: "QC-passed so far this month",   highlight: true,  crimson: false, goldVal: true  },
    { label: "SAREES WAITING FOR QUALITY CHECK", value: String(sareesWaitingQc),                sub: sareesWaitingQc > 0 ? "⚠ Need quality check" : "All caught up", highlight: false, crimson: sareesWaitingQc > 0, goldVal: false },
  ];

  const ICONS = [
    <Layers size={22} color={T.warmCream} />,
    <Factory size={22} color={T.warmCream} />,
    <CheckCircle2 size={22} color={T.warmCream} />,
    <AlertCircle size={22} color={T.warmCream} />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{ padding: `0 48px`, marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {STATS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20, backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
            whileHover={{ backgroundColor: m.highlight ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.highlight ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.highlight ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.highlight ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {ICONS[i]}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.highlight ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 48, letterSpacing: "-0.01em", color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : T.warmIvory, lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                {m.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.highlight ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </span>
              </div>
            </div>
            {m.highlight && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
