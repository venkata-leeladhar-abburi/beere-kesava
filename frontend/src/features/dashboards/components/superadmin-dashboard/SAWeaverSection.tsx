import React from "react";
import { motion } from "motion/react";
import { Rows3 as Rows } from "lucide-react";
import { ChevronRight, Edit3, Layers3, Eye, Activity, MapPin, Phone, AlertTriangle } from "lucide-react";
import { T, F } from "./theme";
import { SectionHeader } from "./atoms";
import { useDashboardWeavers } from "../beere-dashboard/hooks/useDashboardWeavers";
import { Button } from "../../../../shared/ui/primitives";

interface SAWeaverSectionProps {
  onNavigate: (tab: string, ctx?: unknown) => void;
}

export function SAWeaverSection({ onNavigate }: SAWeaverSectionProps) {
  const { data: weavers = [], isLoading } = useDashboardWeavers();

  if (isLoading) {
    return (
      <section className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 48, paddingBottom: 40, background: T.silkCream }}>
        <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 xl:gap-6">
          {["sa-w-sk1", "sa-w-sk2", "sa-w-sk3", "sa-w-sk4"].map((skKey) => (
            <div key={skKey} style={{ height: 360, borderRadius: 24, background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.10)` }} />
          ))}
        </div>
      </section>
    );
  }

  if (weavers.length === 0) {
    return (
      <section className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 48, paddingBottom: 40, background: T.silkCream }}>
        <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
        <div style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, padding: "40px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
          No weavers in database yet. Click "View All Weavers" to register a weaver.
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 48, paddingBottom: 40, background: T.silkCream }}>
      <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 xl:gap-6">
        {weavers.map((w, i) => (
          <motion.div
            key={w.id}
            onClick={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
            initial={{ opacity: 0, y: 44, scale: 0.90, filter: "blur(7px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.012, boxShadow: "0px 32px 80px rgba(74,6,27,0.18)" }}
            transition={{ type: "spring", stiffness: 240, damping: 22, delay: i * 0.12, opacity: { duration: 0.45 }, filter: { duration: 0.5 } }}
            style={{ flex: 1, background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <div style={{ height: 170, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
              {w.img ? (
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  src={w.img}
                  alt={w.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.bg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                </div>
              )}

              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                {w.id}
              </div>

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
                  {w.status === "active" ? "Currently Weaving" : "Idle"}
                </span>
              </div>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 8 }}>
                <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25 }}>
                  {w.name}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.village || "—"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.mobile}</span>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>
                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Rows size={14} color={T.royalBurgundy} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                  </div>
                </div>

                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>✓</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Status</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>
                      {w.status === "active" ? "Active" : "Idle"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                    variant="tertiary"
                    fullWidth
                    className="!gap-1.5 !bg-[rgba(110,15,45,0.04)] !text-[#6E0F2D] !border-[1.5px] !border-[rgba(110,15,45,0.15)] !rounded-xl !py-2.5 !px-1 !text-xs !font-bold hover:!bg-[rgba(110,15,45,0.08)] hover:!text-[#6E0F2D]"
                  >
                    <Eye size={14} /> Details
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "edit" }); }}
                    variant="tertiary"
                    fullWidth
                    className="!gap-1.5 !bg-transparent !text-[#6E0F2D] !border !border-[#6E0F2D] !rounded-xl !py-2.5 !px-1 !text-xs !font-semibold hover:!bg-[rgba(110,15,45,0.05)] hover:!text-[#6E0F2D]"
                  >
                    <Edit3 size={13} /> Edit
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                    variant="tertiary"
                    fullWidth
                    className="!gap-1.5 !bg-[rgba(110,15,45,0.04)] !text-[#6E0F2D] !border-[1.5px] !border-[rgba(110,15,45,0.15)] !rounded-xl !py-2.5 !px-1 !text-xs !font-bold hover:!bg-[rgba(110,15,45,0.08)] hover:!text-[#6E0F2D]"
                  >
                    <Layers3 size={14} /> Batches
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <motion.div
            onClick={() => onNavigate("AllWeavers")}
            whileHover={{ scale: 1.12, boxShadow: "0px 10px 30px rgba(74,6,27,0.16)" }}
            whileTap={{ scale: 0.93 }}
            style={{ width: 44, height: 44, borderRadius: "50%", background: T.warmIvory, border: `1.5px solid ${T.borderGold}`, boxShadow: "0px 6px 20px rgba(74,6,27,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronRight size={18} color={T.royalBurgundy} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
