import React, { useContext } from "react";
import { motion, useInView } from "motion/react";
import { BarChart2, ClipboardList, Layers, Tag, Sparkles, ArrowRight } from "lucide-react";
import { useMaterialIssue } from "../../contexts/MaterialIssueContext";
import { T, F, EASE, G_GOLD, MobileCtx } from "../theme";
import { MAT_CARDS_TEMPLATE } from "../materialConfig";
import { SectionHeader, FadeUp } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";

import { useQuery } from "@tanstack/react-query";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";

export function StockOverview({ onSeeFullReports }: { onSeeFullReports: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  const { data: stockRes, isLoading: stockLoading, isError: stockError } = useQuery({
    queryKey: ["raw-material-stock-list"],
    queryFn: () => rawMaterialsApi.listStock(),
  });
  const stockItems = stockRes?.items ?? [];

  const warpStock = stockItems.filter(i => i.materialType === "WARP").reduce((s, i) => s + Number(i.currentStock), 0);
  const reshamStock = stockItems.filter(i => i.materialType === "RESHAM").reduce((s, i) => s + Number(i.currentStock), 0);

  // Jari is always shown in Reels — never grams/kg, regardless of what unit
  // any individual stock row happens to be in (1 Bun = 4 Reels).
  const jariStock = stockItems
    .filter(i => i.materialType === "JARI")
    .reduce((s, i) => {
      const qty = Number(i.currentStock);
      const unit = (i.unit || "").trim().toUpperCase();
      return s + (unit.startsWith("BUN") ? qty * 4 : qty);
    }, 0);

  const warpUnit = stockItems.find(i => i.materialType === "WARP")?.unit ?? "kg";
  const reshamUnit = stockItems.find(i => i.materialType === "RESHAM")?.unit ?? "kg";
  const jariUnit = "Reels";

  const cards = MAT_CARDS_TEMPLATE.map(card => {
    if (card.name.toLowerCase().includes("warp")) {
      return { 
        ...card, 
        stock: `${warpStock} ${warpUnit}`,
        note: warpStock > 0 ? "Active usage" : "Requires restocking",
        badge: warpStock > 0 ? "In Stock" : "Out of Stock",
        green: warpStock > 0,
        pct: warpStock > 0 ? 100 : 0
      };
    }
    if (card.name.toLowerCase().includes("resham")) {
      return { 
        ...card, 
        stock: `${reshamStock} ${reshamUnit}`,
        note: reshamStock > 0 ? "Available for design" : "Requires restocking",
        badge: reshamStock > 0 ? "In Stock" : "Out of Stock",
        green: reshamStock > 0,
        pct: reshamStock > 0 ? 100 : 0
      };
    }
    if (card.name.toLowerCase().includes("jari")) {
      return { 
        ...card, 
        stock: `${jariStock} ${jariUnit}`,
        note: jariStock > 0 ? "Available" : "Requires restocking",
        badge: jariStock > 0 ? "In Stock" : "Out of Stock",
        green: jariStock > 0,
        pct: jariStock > 0 ? 100 : 0
      };
    }
    return card;
  });

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
      {stockError && (
        <div style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 10, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", fontFamily: F.ui, fontSize: 13, color: "#C0392B", fontWeight: 700 }}>
          Failed to load stock data.
        </div>
      )}
      {stockLoading && (
        <div style={{ padding: "12px 0", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading stock…</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 18 : 28 }}>
        {cards.map((card, i) => (
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
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: card.stockColor, lineHeight: 1, margin: "18px 0 8px" }}>{card.stock}</div>
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
  const { issueRecords, isError: issueError } = useMaterialIssue();

  const now = new Date();
  const thisMonthRecords = issueRecords.filter(r => {
    const d = new Date(r.issuedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  let warpKg = 0, reshamKg = 0, jariReels = 0, jariBuns = 0;
  thisMonthRecords.forEach(r => r.materials.forEach(m => {
    const qty = Number(m.quantity || 0);
    const unit = (m.unit || "").toLowerCase();
    if (m.materialType === "Warp") {
      warpKg += unit.includes("g") && !unit.includes("kg") ? qty / 1000 : qty;
    } else if (m.materialType === "Resham") {
      reshamKg += unit.includes("g") && !unit.includes("kg") ? qty / 1000 : qty;
    } else if (m.materialType === "Jari") {
      if (unit.startsWith("bun")) {
        jariBuns += qty;
        jariReels += qty * 4;
      } else {
        jariReels += qty;
        jariBuns += qty / 4;
      }
    }
  }));

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
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: issueError ? "#C0392B" : G_GOLD }} />
        {issueError && (
          <div style={{ position: "absolute", top: 10, right: 14, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#C0392B" }}>
            Failed to load issued materials.
          </div>
        )}

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
            fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, marginTop: 4,
          }}>
            {thisMonthRecords.length} {thisMonthRecords.length === 1 ? "Issuance" : "Issuances"}
          </div>
        </div>

        <div style={{ flex: "1 1 55%", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Warp Disbursed", val: `${warpKg.toFixed(warpKg % 1 === 0 ? 0 : 1)} kg`, sub: "For vertical threads", color: T.royalBurgundy, bg: "rgba(110,15,45,0.04)", border: "rgba(110,15,45,0.12)", icon: <Layers size={16} color={T.royalBurgundy} /> },
            { label: "Resham Disbursed", val: `${reshamKg.toFixed(reshamKg % 1 === 0 ? 0 : 1)} kg`, sub: "For body & borders", color: T.antiqueGold, bg: "rgba(200,155,71,0.06)", border: "rgba(200,155,71,0.18)", icon: <Tag size={16} color="#7A5E1C" /> },
            { label: "Jari Disbursed", val: `${Math.round(jariReels)} Reels`, sub: `${Math.round(jariBuns)} Buns`, color: T.luxuryBrown, bg: "rgba(59,35,20,0.04)", border: "rgba(59,35,20,0.12)", icon: <Sparkles size={16} color={T.luxuryBrown} /> },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {s.icon}
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, color: s.color, marginTop: 4 }}>
                {s.val}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: "1 1 15%", display: "flex", justifyContent: isMobile ? "stretch" : "flex-end" }}>
          <Button
            onClick={() => onNavigate?.("IssueMaterial")}
            variant="secondary"
            size="md"
            iconRight={ArrowRight}
            fullWidth={isMobile}
          >
            View Full History
          </Button>
        </div>
      </div>
    </section>
  );
}
