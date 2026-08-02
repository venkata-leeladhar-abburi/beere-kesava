import React, { useContext } from "react";
import { motion, useInView } from "motion/react";
import { BarChart2, ClipboardList, Layers, Tag, Sparkles, ArrowRight } from "lucide-react";
import { useMaterialIssue } from "../../contexts/MaterialIssueContext";
import { T, F, EASE, G_GOLD, MobileCtx } from "../theme";
import { MAT_CARDS } from "../data";
import { SectionHeader, FadeUp } from "../common/primitives";

export function StockOverview({ onSeeFullReports }: { onSeeFullReports: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <section id="mat-stock-overview" style={{ padding: `40px ${px}px 0` }}>
      <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.6, ease: EASE }}>
        <SectionHeader
          title="Current Stock Overview"
          action="See Full Reports"
          actionIcon={<BarChart2 size={15} />}
          onAction={onSeeFullReports}
          actionVariant="solid"
        />
      </motion.div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 18 : 28 }}>
        {MAT_CARDS.map((card, i) => (
          <FadeUp key={card.name} delay={i * 0.1} style={{ height: "100%" }}>
            <motion.div
              initial={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              animate={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              whileHover={{ y: -6, boxShadow: "0px 28px 72px rgba(74,6,27,0.15)" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ background: T.warmIvory, borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ height: 180, flexShrink: 0, overflow: "hidden" }}>
                <motion.img src={card.img} alt={card.name} whileHover={{ scale: 1.06 }} transition={{ duration: 0.6, ease: EASE }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>{card.name}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 4 }}>{card.desc}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: card.stockColor, lineHeight: 1, margin: "18px 0 8px" }}>{card.stock}</div>
              </div>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

export function IssuedThisMonthCard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const { issueRecords } = useMaterialIssue();

  const now = new Date();
  const thisMonthRecords = issueRecords.filter(r => {
    const d = new Date(r.issuedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  let warpKg = 0, reshamKg = 0, jariBuns = 0;
  thisMonthRecords.forEach(r => r.materials.forEach(m => {
    if (m.materialType === "Warp") warpKg += m.quantity;
    else if (m.materialType === "Resham") reshamKg += m.quantity;
    else if (m.materialType === "Jari") jariBuns += m.unit === "Buns" ? m.quantity : m.quantity / 4;
  }));

  const jariReels = jariBuns * 4;

  return (
    <section id="mat-issued" style={{ padding: `24px ${px}px 0` }}>
      <div style={{
        background: `linear-gradient(135deg, ${T.warmIvory} 0%, #FFFFFF 100%)`,
        border: `1.5px solid ${T.borderDef}`,
        borderRadius: 20,
        padding: "24px 30px",
        boxShadow: "0 10px 30px rgba(74,6,27,0.04), 0 1px 3px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: G_GOLD }} />

        <div style={{ flex: "1 1 25%", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={18} color={T.royalBurgundy} />
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>
              Issued to Weavers
            </span>
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            Weaver material disbursements recorded for {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", width: "fit-content", gap: 6,
            background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, fontFamily: F.mono,
            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, marginTop: 4,
          }}>
            {thisMonthRecords.length} {thisMonthRecords.length === 1 ? "Issuance" : "Issuances"}
          </div>
        </div>

        <div style={{ flex: "1 1 55%", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Warp Disbursed", val: `${warpKg.toFixed(warpKg % 1 === 0 ? 0 : 1)} kg`, sub: "For vertical threads", color: T.royalBurgundy, bg: "rgba(110,15,45,0.04)", border: "rgba(110,15,45,0.12)", icon: <Layers size={16} color={T.royalBurgundy} /> },
            { label: "Resham Disbursed", val: `${reshamKg.toFixed(reshamKg % 1 === 0 ? 0 : 1)} kg`, sub: "For body & borders", color: T.antiqueGold, bg: "rgba(200,155,71,0.06)", border: "rgba(200,155,71,0.18)", icon: <Tag size={16} color="#7A5E1C" /> },
            { label: "Jari Disbursed", val: `${jariBuns.toFixed(jariBuns % 1 === 0 ? 0 : 1)} Buns`, sub: `${jariReels.toFixed(0)} Reels`, color: T.luxuryBrown, bg: "rgba(59,35,20,0.04)", border: "rgba(59,35,20,0.12)", icon: <Sparkles size={16} color={T.luxuryBrown} /> },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {s.icon}
                <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, color: s.color, marginTop: 4 }}>
                {s.val}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: "1 1 15%", display: "flex", justifyContent: isMobile ? "stretch" : "flex-end" }}>
          <motion.button
            onClick={() => onNavigate?.("IssueMaterial")}
            whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(110,15,45,0.15)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: isMobile ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 20px", borderRadius: 12, background: "rgba(110,15,45,0.06)", color: T.royalBurgundy,
              border: `1.5px solid rgba(110,15,45,0.16)`, fontFamily: F.ui, fontWeight: 700, fontSize: 13,
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
            }}
          >
            <span>View Full History</span>
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
