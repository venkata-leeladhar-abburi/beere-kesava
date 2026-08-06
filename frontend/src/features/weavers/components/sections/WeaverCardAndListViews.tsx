import { useState } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Eye, MapPin, Phone, Edit3, Layers3, Activity, AlertTriangle } from "lucide-react";
import { Clock, Rows, Eye as PhEye, MapPin as PhMapPin } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { STATUS_CFG } from "../types";
import { WEAVERS } from "../data";
import { FadeUp, qcColor } from "../common/primitives";
import { weaversApi, BackendWeaverStats } from "../../../../shared/api/weavers";

export function useRealWeavers(extraWeavers: typeof WEAVERS = []) {
  const { data: weaversRes } = useQuery({
    queryKey: ["weavers-card-roster"],
    queryFn: () => weaversApi.list(),
  });
  const roster = weaversRes?.items ?? [];
  const { data: statsList } = useQuery({
    queryKey: ["weavers-card-stats", roster.map(w => w.id)],
    queryFn: () => Promise.all(roster.map(w => weaversApi.getStats(w.id))),
    enabled: roster.length > 0,
  });
  const statsById = new Map((statsList ?? []).map(s => [s.weaverId, s]));

  const realWeavers = roster.map(w => {
    const s: BackendWeaverStats | undefined = statsById.get(w.id);
    const status = (s && s.activeBatchRowsCount > 0 ? "active" : "idle") as "active" | "idle" | "qc";
    return {
      id: w.id,
      name: w.name,
      initials: w.initials || `${w.firstName.charAt(0)}${w.lastName.charAt(0)}`,
      bg: T.royalBurgundy,
      village: w.village || "—",
      cluster: w.cluster || "—",
      mobile: w.phone || "—",
      looms: w.looms,
      status,
      batch: s && s.activeBatchRowsCount > 0 ? `${s.activeBatchRowsCount} active` : "",
      design: "—",
      photo: w.photoUrl || null,
      thisMonth: s?.totalSareesWoven ?? 0,
      passRate: s?.qcPassRate ?? 0,
      totalEver: s?.totalSareesWoven ?? 0,
      totalPaid: "—",
      lastActive: "—",
    };
  });



  return [...realWeavers, ...extraWeavers];
}

export function WeaverCardGrid({ onSelect, onEdit, onBatches, extraWeavers = [] }: { onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  const [showAll, setShowAll] = useState(true);
  const allWeavers = useRealWeavers(extraWeavers);
  const visible = showAll ? allWeavers : allWeavers.slice(0, 4);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, alignItems: "stretch" }}>
        {visible.map((w, i) => {
          const cfg = STATUS_CFG[w.status];
          return (
            <FadeUp key={w.id} delay={i * 0.05} style={{ height: "100%" }}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 30px 70px rgba(74,6,27,0.12)" }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}
              >
                {/* Header Banner - Full Image Height 170px */}
                <div style={{ height: 170, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
                  {w.photo ? (
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                      src={w.photo}
                      alt={w.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.bg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                    </div>
                  )}

                  {/* Dark gradient overlay for modern look */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

                  {/* Floating ID badge in top left */}
                  <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                    {w.id}
                  </div>

                  {/* Floating gentle status pill overlay at the bottom left of the image banner */}
                  <div style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px"
                  }}>
                    {w.status === "active" ? (
                      <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                    ) : w.status === "qc" ? (
                      <Clock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontFamily: F.ui,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.5px",
                      textShadow: "0 1px 4px rgba(0,0,0,0.6)"
                    }}>
                      {w.status === "active" ? "Currently Weaving" : w.status === "qc" ? "Pending QC" : "Idle"}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Name and Batch beside it */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 8 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25 }}>
                      {w.name}
                    </div>
                    {w.batch && (
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase" }}>
                        {w.batch}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                      <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <span>{w.village}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                      <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <span>{w.mobile}</span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

                  {/* Looms stat */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Rows size={14} color={T.royalBurgundy} weight="fill" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                    <motion.button
                      onClick={() => onSelect(w)}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      <Eye size={14} /> Details
                    </motion.button>
                    <motion.button
                      onClick={() => onEdit(w)}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.05)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      <Edit3 size={13} /> Edit
                    </motion.button>
                    <motion.button
                      onClick={() => onBatches(w)}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      <Layers3 size={14} /> Batches
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          );
        })}
      </div>
      {!showAll && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <motion.button onClick={() => setShowAll(true)} whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" }} whileTap={{ scale: 0.98 }}
            style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, background: "#FFFFFF", border: `1.5px solid rgba(110,15,45,0.20)`, borderRadius: 14, padding: "15px 44px", cursor: "pointer", boxShadow: "0 4px 12px rgba(74,6,27,0.07)" }}>
            Load More Weavers
          </motion.button>
        </div>
      )}
    </div>
  );
}
export function WeaverListView({ onSelect, extraWeavers = [] }: { onSelect: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  const [showAll, setShowAll] = useState(false);
  const allWeavers = useRealWeavers(extraWeavers);
  const visible = showAll ? allWeavers : allWeavers.slice(0, 5);

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.5fr 1.2fr 110px 90px 70px 100px", padding: "14px 26px", background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
        {["Weaver", "Village / Area", "Status", "This Month", "Pass Rate", "Looms", "Action"].map(h => (
          <div key={h} style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 500 }}>{h}</div>
        ))}
      </div>
      {visible.map((w, i) => {
        const cfg = STATUS_CFG[w.status];
        return (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.38, delay: i * 0.05 }}
            style={{ display: "grid", gridTemplateColumns: "2.2fr 1.5fr 1.2fr 110px 90px 70px 100px", alignItems: "center", padding: "18px 26px", background: i % 2 === 1 ? "rgba(247,242,234,0.55)" : "#FFFFFF", borderBottom: `1px solid rgba(110,15,45,0.06)`, minHeight: 88 }}
          >
            {/* Weaver identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${T.antiqueGold}`, flexShrink: 0 }}>
                {w.photo
                  ? <img src={w.photo} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: w.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9" }}>{w.initials}</span>
                  </div>
                }
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown, marginBottom: 4 }}>{w.name}</div>
                <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{w.id}</div>
              </div>
            </div>
            {/* Village */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <PhMapPin size={15} color={T.taupe} weight="fill" />
              <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{w.village}</span>
            </div>
            {/* Status */}
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>
                {w.status === "active" ? "● Weaving" : w.status === "qc" ? "● QC Check" : "○ Idle"}
              </span>
            </div>
            {/* This month */}
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.antiqueGold }}>{w.thisMonth} <span style={{ fontSize: 13, fontFamily: F.ui, color: T.taupe }}>sarees</span></div>
            {/* Pass rate */}
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: qcColor(w.passRate) }}>{w.passRate}%</div>
            {/* Looms */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Rows size={16} color={T.taupe} weight="regular" />
              <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>{w.looms}</span>
            </div>
            {/* Action */}
            <div>
              <motion.button
                onClick={() => onSelect(w)}
                whileHover={{ scale: 1.04, background: "rgba(110,15,45,0.10)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "10px 16px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                <PhEye size={18} weight="regular" /> View
              </motion.button>
            </div>
          </motion.div>
        );
      })}
      {!showAll && (
        <div style={{ padding: "22px 26px", textAlign: "center", borderTop: `1px solid ${T.borderDef}` }}>
          <motion.button onClick={() => setShowAll(true)} whileHover={{ scale: 1.02 }} style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.35)" }}>Load More Weavers</motion.button>
        </div>
      )}
    </div>
  );
}
