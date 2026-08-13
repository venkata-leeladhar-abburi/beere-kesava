import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, ArrowDownToLine, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { C, F } from "./tokens";
import { PageHero, StatsStrip, SectionCard, SectionHeading, GUTTER_X, GUTTER_X_TABLET, type WorkerStat } from "./primitives";
import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { EASE } from "./finishing/shared";
import { SectionA } from "./finishing/SectionA";
import { SectionBFiltered } from "./finishing/SectionBFiltered";
import { SectionC } from "./finishing/SectionC";
import { QuotationsSection } from "./finishing/QuotationsSection";
import { Button } from "../../../../shared/ui/primitives";

// ── Main export ───────────────────────────────────────────────────────────────

export function WorkerFinishing({ isDesktop, isTablet }: { isDesktop?: boolean; isTablet?: boolean }) {
  const { readySarees, assignments, returns } = useFinishing();
  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);
  const isMobile = !isDesktop && !isTablet;
  const [activeAction, setActiveAction] = useState<"assign" | "receive" | null>(null);

  const stats: WorkerStat[] = [
    { label: "Ready to assign", value: readySarees.length, sub: "QC-passed, awaiting finishing", icon: Sparkles, highlight: readySarees.length > 0 },
    { label: "With staff", value: awaiting.length, sub: "Out for finishing work", icon: Clock },
    { label: "Returned", value: returns.length, sub: "Finished and back in stock", icon: CheckCircle2 },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>

      {/* Hero + metric strip — same anatomy as the admin page headers */}
      {isDesktop && (
        <PageHero
          eyebrow="Worker Staff · Finishing Floor"
          title="Finishing"
          titleAccent="& Handover"
          description="Assign sarees to finishing staff, track what is out on the floor, and receive them back once the work is done."
          minHeight={300}
        />
      )}

      <div style={{ padding: isDesktop ? `0 0 40px` : isTablet ? `24px ${GUTTER_X_TABLET}px 32px` : "16px 14px 24px" }}>
        {isDesktop ? (
          <StatsStrip stats={stats} />
        ) : (
          <div style={{ marginBottom: 24 }}>
            <SectionHeading title="Finishing" subtitle="Assign sarees to finishing staff and receive them back after finishing." />
            <StatsStrip stats={stats} overlap={false} gutter={0} />
          </div>
        )}
      </div>

      <div style={{ padding: isDesktop ? `0 ${GUTTER_X}px 40px` : isTablet ? `0 ${GUTTER_X_TABLET}px 32px` : "0 14px 24px" }}>

      {/* Quotations flowing in from Inventory */}
      <div style={{ marginBottom: 24 }}>
        <QuotationsSection isMobile={isMobile} />
      </div>

      {/* Two primary action buttons */}
      <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        <Button
          variant="tertiary"
          onClick={() => setActiveAction(activeAction === "assign" ? null : "assign")}
          className={`h-auto flex-col whitespace-normal rounded-[20px] px-4 py-6 transition-all ${activeAction === "assign"
            ? "border-none bg-gradient-to-br from-[#4A061B] to-[#6E0F2D] shadow-[0_8px_28px_rgba(110,15,45,0.32)]"
            : "border border-[rgba(110,15,45,0.10)] bg-white shadow-[0_6px_32px_rgba(74,6,27,0.08)]"}`}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: activeAction === "assign" ? "rgba(255,255,255,0.15)" : "rgba(110,15,45,0.09)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Package size={20} color={activeAction === "assign" ? "#FFF" : C.burg} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: activeAction === "assign" ? "#FFF" : C.wine, marginBottom: 4 }}>Assign Sarees</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: activeAction === "assign" ? "rgba(255,255,255,0.65)" : C.muted, lineHeight: 1.4 }}>
            {readySarees.length} ready · assign to finishing staff
          </div>
        </Button>

        <Button
          variant="tertiary"
          onClick={() => setActiveAction(activeAction === "receive" ? null : "receive")}
          className={`h-auto flex-col whitespace-normal rounded-[20px] px-4 py-6 transition-all ${activeAction === "receive"
            ? "border-none bg-gradient-to-br from-[#15603D] to-[#1F774E] shadow-[0_8px_28px_rgba(31,119,78,0.28)]"
            : "border border-[rgba(110,15,45,0.10)] bg-white shadow-[0_6px_32px_rgba(74,6,27,0.08)]"}`}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: activeAction === "receive" ? "rgba(255,255,255,0.15)" : "rgba(30,102,64,0.09)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <ArrowDownToLine size={20} color={activeAction === "receive" ? "#FFF" : C.green} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: activeAction === "receive" ? "#FFF" : C.wine, marginBottom: 4 }}>Receive Back</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: activeAction === "receive" ? "rgba(255,255,255,0.65)" : C.muted, lineHeight: 1.4 }}>
            {awaiting.length} awaiting · mark as received
          </div>
        </Button>
      </div>

      {/* Expanded action panels */}
      <AnimatePresence>
        {activeAction === "assign" && (
          <motion.div key="assign-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }}>
            <div style={{ marginBottom: 24 }}>
              <SectionCard
                icon={Package}
                title="Assign Sarees for Finishing"
                subtitle="Pick QC-passed sarees and hand them to a finishing staff member."
                actions={
                  <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
                    {readySarees.length} ready
                  </span>
                }
              >
                <SectionA isMobile={isMobile} />
              </SectionCard>
            </div>
          </motion.div>
        )}
        {activeAction === "receive" && (
          <motion.div key="receive-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }}>
            <div style={{ marginBottom: 24 }}>
              <SectionCard
                icon={ArrowDownToLine}
                title="Receive Sarees Back"
                subtitle="Mark finished sarees as returned and record their condition."
                actions={
                  <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
                    {awaiting.length} awaiting
                  </span>
                }
              >
                <SectionBFiltered isMobile={isMobile} />
              </SectionCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* History always visible */}
        <SectionC isMobile={isMobile} />
      </div>
    </div>
  );
}
