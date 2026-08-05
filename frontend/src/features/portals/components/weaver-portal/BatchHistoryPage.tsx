
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, ClipboardList, CheckSquare, Palette, ArrowUpRight,
  Wallet, Shield, Send, ChevronRight, X, ChevronLeft,
  Package, Check, Eye, LogOut, Search, RotateCcw,
  AlertCircle, Clock, Flower2, Layers, Info, Pencil,
  Scissors, LayoutGrid, CreditCard, ClipboardCheck,
  TrendingUp, ArrowRight, Sparkles, UserRound,
  CheckCircle2, History, ListChecks,
  AlertTriangle, Inbox, Zap,
} from "lucide-react";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, CURRENT_WEAVER_ID, CURRENT_MONTH_LABEL, GROSS_CHARGES, TOTAL_DEDUCTIONS, NET_AMOUNT, PAST_MONTHS, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BATCH_LIST, BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG
} from './theme';
import { Button, Input } from '../../../../shared/ui/primitives';


export function BatchHistoryPage({ onBack, defaultFilter = "all" }: { onBack: () => void; defaultFilter?: "all" | "active" | "completed" }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">(defaultFilter);

  const filtered = BATCH_LIST.filter(b => {
    const matchSearch = !search || b.id.toLowerCase().includes(search.toLowerCase()) || b.name.toLowerCase().includes(search.toLowerCase()) || b.design.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = BATCH_LIST.filter(b => b.status === "active").length;
  const completedCount = BATCH_LIST.filter(b => b.status === "completed").length;
  const totalSarees = BATCH_LIST.reduce((s, b) => s + b.done, 0);

  const T2 = {
    silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
    antiqueGold: "#C89B47", goldLight: "#E7C983", luxuryBrown: "#3B2314",
    taupe: "#69635E", warmCream: "#F5E8D0", green: "#1E6640",
    borderDef: "rgba(110,15,45,0.10)",
  };

  return (
    <div style={{ minHeight: "calc(100dvh - 64px)", background: T2.silkCream, fontFamily: F.u }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", padding: "56px 48px 0", position: "relative" as const, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.025) 60px, rgba(200,155,71,0.025) 61px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <Button onClick={onBack} variant="ghost" className="flex items-center gap-2 h-auto bg-white/10 border border-white/[0.18] rounded-full px-[18px] py-2 text-[13px] text-white/80 mb-7 font-medium hover:bg-white/10">
            <ChevronLeft size={15} color="rgba(255,255,255,0.80)" /> Back to My Batches
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 20, height: 1, background: T2.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.m, fontWeight: 600, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" as const }}>Ravi Kumar · WVR-014 · Weaver History</span>
          </div>
          <h1 style={{ fontFamily: F.d, fontWeight: 400, fontSize: "clamp(32px, 3vw, 52px)", color: T2.warmCream, margin: "0 0 12px", lineHeight: 1.1 }}>
            {defaultFilter === "completed" ? "Completed Batches" : "Batch History"}{" "}
            <span style={{ fontStyle: "italic", color: T2.antiqueGold }}>{defaultFilter === "completed" ? "& Payment Records" : "& All Work"}</span>
          </h1>
          <p style={{ fontFamily: F.u, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "0 0 24px", maxWidth: 540, lineHeight: 1.7 }}>
            {defaultFilter === "completed"
              ? "A full record of all the batches you have completed — sarees produced, quality results, and amounts earned."
              : "See all your batches — active and completed. A full history of all your weaving work with Beere Kesava."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            {[
              { label: `${BATCH_LIST.length} Total Batches`, color: T2.antiqueGold, bg: "rgba(200,155,71,0.15)", border: "rgba(200,155,71,0.30)" },
              { label: `${activeCount} Currently Active`, color: T2.warmCream, bg: "rgba(30,102,64,0.18)", border: "rgba(30,102,64,0.35)" },
              { label: `${completedCount} Completed`, color: T2.warmCream, bg: "rgba(29,78,216,0.15)", border: "rgba(29,78,216,0.30)" },
            ].map(p => (
              <span key={p.label} style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: p.color, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 999, padding: "6px 16px" }}>{p.label}</span>
            ))}
          </div>
          {/* Metrics bar */}
          <div style={{ display: "flex", gap: 0, marginTop: 40, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total Batches",    val: `${BATCH_LIST.length}`, sub: "All time",             Icon: Layers,       hi: false },
              { label: "Sarees Produced",  val: `${totalSarees}`,       sub: "Across all batches",   Icon: CheckCircle2, hi: true  },
              { label: "Active Now",       val: `${activeCount}`,       sub: "Currently weaving",    Icon: Clock,        hi: false },
              { label: "Completed",        val: `${completedCount}`,    sub: "Fully finished",       Icon: ListChecks,   hi: false },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "20px 22px", borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={19} color={m.hi ? T2.antiqueGold : "rgba(245,232,208,0.70)"} />
                </div>
                <div>
                  <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 12, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: m.hi ? "rgba(200,155,71,0.85)" : "rgba(245,232,208,0.55)", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 30, color: m.hi ? T2.goldLight : T2.warmCream, lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(245,232,208,0.60)", marginTop: 3 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div style={{ background: T2.warmIvory, borderBottom: `1px solid ${T2.borderDef}`, padding: "0 48px", position: "sticky" as const, top: 64, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60 }}>
          {([
            { key: "all",       label: "All Batches", count: BATCH_LIST.length },
            { key: "active",    label: "Active",      count: activeCount },
            { key: "completed", label: "Completed",   count: completedCount },
          ] as const).map(f => (
            <Button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              variant="ghost"
              className={
                "h-full px-[18px] border-none bg-transparent rounded-none flex items-center gap-1.5 border-b-2 " +
                (statusFilter === f.key ? "border-b-[#6E0F2D] hover:bg-transparent" : "border-b-transparent hover:bg-transparent")
              }
            >
              <span style={{ fontFamily: F.u, fontWeight: statusFilter === f.key ? 600 : 400, fontSize: 13, color: statusFilter === f.key ? T2.royalBurgundy : T2.taupe }}>{f.label}</span>
              <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: statusFilter === f.key ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: statusFilter === f.key ? T2.royalBurgundy : T2.taupe }}>{f.count}</span>
            </Button>
          ))}
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search batch ID or design…"
            iconLeft={Search}
            size="sm"
            containerClassName="ml-auto rounded-xl h-[38px] w-[240px] bg-[#F7F2EA] border-[rgba(110,15,45,0.10)]"
          />
          <span style={{ fontFamily: F.m, fontSize: 12, color: T2.taupe }}>{filtered.length} batch{filtered.length !== 1 ? "es" : ""}</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "40px 48px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center" as const, padding: "80px 40px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T2.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Layers size={28} color={T2.taupe} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 20, color: T2.luxuryBrown, marginBottom: 8 }}>No batches found</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T2.taupe }}>Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
            {filtered.map((b, i) => (
              <FadeUpBatch key={b.id} delay={i * 0.04}>
                <BatchCard b={b} />
              </FadeUpBatch>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DESKTOP HERO COMPONENT ────────────────────────────────────────────────
