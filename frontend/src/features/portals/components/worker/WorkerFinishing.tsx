import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, ArrowDownToLine, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { C, F, card } from "./tokens";
import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { EASE, SectionHeader } from "./finishing/shared";
import { SectionA } from "./finishing/SectionA";
import { SectionBFiltered } from "./finishing/SectionBFiltered";
import { SectionC } from "./finishing/SectionC";
import { QuotationsSection } from "./finishing/QuotationsSection";

// ── Main export ───────────────────────────────────────────────────────────────

export function WorkerFinishing({ isDesktop, isTablet }: { isDesktop?: boolean; isTablet?: boolean }) {
  const { readySarees, assignments, returns } = useFinishing();
  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);
  const isMobile = !isDesktop && !isTablet;
  const [activeAction, setActiveAction] = useState<"assign" | "receive" | null>(null);

  return (
    <div style={{ padding: isDesktop ? "28px 40px" : isTablet ? "20px 24px" : "16px 14px 24px", background: "#FAFAF8", minHeight: "100%" }}>

      {/* Page heading for desktop */}
      {isDesktop && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 24, background: C.gold, borderRadius: 2 }} />
            <h2 style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.dark, margin: 0 }}>Finishing</h2>
          </div>
          <p style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "0 0 0 14px" }}>Assign sarees to finishing staff and receive them back after finishing.</p>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { val: readySarees.length, label: "Ready to Assign", icon: <Sparkles size={15} color={C.gold} />,        bg: "rgba(200,146,58,0.10)", col: C.gold   },
          { val: awaiting.length,    label: "With Staff",       icon: <Clock size={15} color="#B85C00" />,           bg: "rgba(248,140,0,0.09)", col: "#B85C00" },
          { val: returns.length,     label: "Returned",         icon: <CheckCircle2 size={15} color={C.green} />,    bg: "rgba(30,102,64,0.09)", col: C.green   },
        ].map((s, i) => (
          <div key={i} style={{ background: "#FFF", border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 14, padding: "12px 10px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 8px rgba(107,26,42,0.05)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 800, fontSize: 20, color: s.col, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quotations flowing in from Inventory */}
      <QuotationsSection isMobile={isMobile} />

      {/* Two primary action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setActiveAction(activeAction === "assign" ? null : "assign")}
          style={{
            padding: "16px 12px", borderRadius: 16, cursor: "pointer",
            background: activeAction === "assign"
              ? `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 100%)`
              : "#FFF",
            boxShadow: activeAction === "assign"
              ? "0 4px 20px rgba(107,26,42,0.30)"
              : "0 2px 12px rgba(107,26,42,0.08)",
            border: activeAction === "assign" ? "none" : `1.5px solid rgba(107,26,42,0.14)`,
            transition: "all 0.2s",
          } as React.CSSProperties}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: activeAction === "assign" ? "rgba(255,255,255,0.15)" : "rgba(107,26,42,0.09)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Package size={20} color={activeAction === "assign" ? "#FFF" : C.burg} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: activeAction === "assign" ? "#FFF" : C.text, marginBottom: 3 }}>Assign Sarees</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: activeAction === "assign" ? "rgba(255,255,255,0.65)" : C.muted, lineHeight: 1.4 }}>
            {readySarees.length} ready · assign to finishing staff
          </div>
        </button>

        <button
          onClick={() => setActiveAction(activeAction === "receive" ? null : "receive")}
          style={{
            padding: "16px 12px", borderRadius: 16, cursor: "pointer",
            background: activeAction === "receive"
              ? "linear-gradient(135deg, #1E5A3A 0%, #1E6640 100%)"
              : "#FFF",
            boxShadow: activeAction === "receive"
              ? "0 4px 20px rgba(30,102,64,0.28)"
              : "0 2px 12px rgba(107,26,42,0.08)",
            border: activeAction === "receive" ? "none" : `1.5px solid rgba(107,26,42,0.14)`,
            transition: "all 0.2s",
          } as React.CSSProperties}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: activeAction === "receive" ? "rgba(255,255,255,0.15)" : "rgba(30,102,64,0.09)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <ArrowDownToLine size={20} color={activeAction === "receive" ? "#FFF" : C.green} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: activeAction === "receive" ? "#FFF" : C.text, marginBottom: 3 }}>Receive Back</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: activeAction === "receive" ? "rgba(255,255,255,0.65)" : C.muted, lineHeight: 1.4 }}>
            {awaiting.length} awaiting · mark as received
          </div>
        </button>
      </div>

      {/* Expanded action panels */}
      <AnimatePresence>
        {activeAction === "assign" && (
          <motion.div key="assign-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }}>
            <div style={{ ...card, padding: 16, marginBottom: 16, overflow: "hidden" }}>
              <SectionHeader
                icon={<Package size={18} color={C.burg} />}
                title="Assign Sarees for Finishing"
                count={readySarees.length}
                accent="rgba(107,26,42,0.09)"
              />
              <SectionA isMobile={isMobile} />
            </div>
          </motion.div>
        )}
        {activeAction === "receive" && (
          <motion.div key="receive-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }}>
            <div style={{ ...card, padding: 16, marginBottom: 16, overflow: "hidden" }}>
              <SectionHeader
                icon={<ArrowDownToLine size={18} color="#1E6640" />}
                title="Receive Sarees Back"
                count={awaiting.length}
                accent="rgba(30,102,64,0.10)"
              />
              <SectionBFiltered isMobile={isMobile} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History always visible */}
      <SectionC isMobile={isMobile} />
    </div>
  );
}
