
import { useState, useMemo } from "react";
import { useBatches } from "@/features/production";
import { isBatchDoneForWeaver } from "./batchCompletion";
import { useCurrentWeaver } from "./useCurrentWeaver";
import {
  ChevronLeft,
  Search,
  Layers,
  AlertTriangle } from "lucide-react";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, MobileBatchCard, CompletedBatchCard, FadeUpBatch, MyBatchEntry
} from './theme';
import { Button, Input } from '../../../../shared/ui/primitives';
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { BG_IMAGE } from "./WeaverBatchNotifData";
import { LuxuryStatsCard, type StatItem } from "@/shared/ui/LuxuryStatsCard";
import { IcoResourceMgmt, IcoFabricRoll, IcoQualityCheck, IcoInvoice } from "@/features/dashboards";

export function BatchHistoryPage({ onBack, defaultFilter = "all" }: { onBack: () => void; defaultFilter?: "all" | "active" | "completed" }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">(defaultFilter);
  const { batches, isLoading: batchesLoading, isError: batchesError, error: batchesErrorObj, refetch: refetchBatches } = useBatches();
  const { weaverId, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();

  // A batch only becomes visible to its assigned weaver once it's finalized
  // (status leaves "draft") — matches the same rule in MyBatchesPage.tsx.
  const myWeaverBatches: (MyBatchEntry & { derivedStatus: "active" | "completed" })[] = batches
    .filter(b => b.status !== "draft")
    .map(b => ({ ...b, myRows: b.rows.filter(r => r.weaverId === weaverId) }))
    .filter(b => b.myRows.length > 0)
    // Shared with MyBatchesPage/DesktopWeaverPortal so all three views shelf a
    // batch the same way — see isBatchDoneForWeaver.
    .map(b => ({ ...b, derivedStatus: isBatchDoneForWeaver(b) ? "completed" as const : "active" as const }));

  const filtered = myWeaverBatches.filter(b => {
    const matchSearch = !search || b.batchId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.derivedStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = myWeaverBatches.filter(b => b.derivedStatus === "active").length;
  const completedCount = myWeaverBatches.filter(b => b.derivedStatus === "completed").length;
  const totalSarees = myWeaverBatches.reduce((s, b) => s + b.myRows.length, 0);

  const T2 = {
    silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
    antiqueGold: "#C89B47", goldLight: "#E7C983", luxuryBrown: "#3B2314",
    taupe: "#69635E", warmCream: "#F5E8D0", green: "#1E6640",
    borderDef: "rgba(110,15,45,0.10)",
  };

  const statIcons = useMemo(() => [
    <IcoResourceMgmt key="r" sz={22} col="#F5E8D0" />,
    <IcoFabricRoll key="f" sz={22} col="#F5E8D0" />,
    <IcoQualityCheck key="q" sz={22} col="#F5E8D0" />,
    <IcoInvoice key="i" sz={22} col="#F5E8D0" />,
  ], []);

  const statItems: StatItem[] = useMemo(() => [
    {
      label: "TOTAL BATCHES",
      value: `${myWeaverBatches.length}`,
      sub: "All time records",
      icon: statIcons[0],
    },
    {
      label: "SAREES PRODUCED",
      value: `${totalSarees}`,
      sub: "Across all batches",
      icon: statIcons[1],
      highlight: true,
      goldVal: true,
    },
    {
      label: "ACTIVE NOW",
      value: `${activeCount}`,
      sub: "Currently weaving",
      icon: statIcons[2],
    },
    {
      label: "COMPLETED",
      value: `${completedCount}`,
      sub: "Fully finished",
      icon: statIcons[3],
    },
  ], [myWeaverBatches.length, totalSarees, activeCount, completedCount, statIcons]);

  if (weaverLoading || batchesLoading) {
    return (
      <div style={{ minHeight: "calc(100dvh - 64px)", background: T2.silkCream, padding: 24 }}>
        <LoadingState variant="skeleton" rows={5} />
      </div>
    );
  }

  if (batchesError) {
    return (
      <div style={{ minHeight: "calc(100dvh - 64px)", background: T2.silkCream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ErrorState error={batchesErrorObj} onRetry={refetchBatches} />
      </div>
    );
  }

  if (weaverError || !weaverId) {
    return (
      <div style={{ minHeight: "calc(100dvh - 64px)", background: T2.silkCream, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 8, padding: 40 }}>
        <AlertTriangle size={28} color={T2.taupe} />
        <span style={{ fontFamily: F.u, fontSize: 14, color: T2.luxuryBrown, fontWeight: 600 }}>Couldn't find your weaver profile</span>
        <span style={{ fontFamily: F.u, fontSize: 13, color: T2.taupe }}>Your login isn't linked to a weaver record yet. Contact your supervisor.</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100dvh - 64px)", background: T2.silkCream, fontFamily: F.u }}>
      {/* ── HERO BANNER MATCHING WEAVER PORTAL HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#0D0207", padding: "28px 16px 76px" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.22, pointerEvents: "none"
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,2,7,0.7) 0%, #0D0207 100%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: 12 }}>
          <Button onClick={onBack} variant="ghost" className="flex items-center gap-2 h-auto bg-white/10 border border-white/[0.18] rounded-[14px] px-[18px] py-2 text-[13px] text-white/80 mb-1 w-fit font-medium hover:bg-white/10">
            <ChevronLeft size={15} color="rgba(255,255,255,0.80)" /> Back to My Batches
          </Button>

          <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase" }}>
            SINCE 1999 · WEAVER PORTAL · HISTORY
          </div>

          <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 28, color: "#FFFDF9", lineHeight: 1.15 }}>
            {defaultFilter === "completed" ? "Completed Batches" : "Batch History"}{" "}
            <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: 22, color: C.gold }}>
              {defaultFilter === "completed" ? "& Payment Records" : "& All Work"}
            </span>
          </div>

          <div style={{ fontFamily: F.u, fontSize: 13.5, color: "rgba(255,253,249,0.75)", lineHeight: 1.6 }}>
            {defaultFilter === "completed"
              ? "A full record of all the batches you have completed — sarees produced, quality results, and amounts earned."
              : "See all your batches — active and completed. A full history of all your weaving work with Beere Kesava."}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { text: `${myWeaverBatches.length} Total Batches`, color: C.gold },
              { text: `${activeCount} Currently Active` },
              { text: `${completedCount} Completed` },
            ].map(p => (
              <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 14px" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLOATING LUXURY STATS CARD ── */}
      <div style={{ padding: "0 16px", marginTop: -56, position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={statItems} />
      </div>

      {/* Filter bar */}
      <div className="px-4 md:px-7 xl:px-12 py-3" style={{ background: T2.warmIvory, borderBottom: `1px solid ${T2.borderDef}`, boxShadow: "0 4px 24px rgba(74,6,27,0.05)", marginTop: 24 }}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {([
              { key: "all",       label: "All Batches", count: myWeaverBatches.length },
              { key: "active",    label: "Active",      count: activeCount },
              { key: "completed", label: "Completed",   count: completedCount },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: statusFilter === f.key ? "1.5px solid #6E0F2D" : `1px solid ${T2.borderDef}`,
                  background: statusFilter === f.key ? "rgba(110,15,45,0.08)" : "transparent",
                  color: statusFilter === f.key ? T2.royalBurgundy : T2.taupe,
                  fontFamily: F.u,
                  fontWeight: statusFilter === f.key ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontFamily: F.m,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: statusFilter === f.key ? "#6E0F2D" : "rgba(139,112,96,0.12)",
                  color: statusFilter === f.key ? "#FFFFFF" : T2.taupe
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar + Batch Count */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search batch ID or design…"
              iconLeft={Search}
              size="sm"
              containerClassName="rounded-xl h-[38px] w-full sm:w-[240px] bg-[#F7F2EA] border-[rgba(110,15,45,0.10)]"
            />
            <span style={{ fontFamily: F.m, fontSize: 12, color: T2.taupe, whiteSpace: "nowrap" }}>
              {filtered.length} batch{filtered.length !== 1 ? "es" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 32, paddingBottom: 80 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center" as const, padding: "60px 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(110,15,45,0.06)", border: `1px solid ${T2.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Layers size={26} color={T2.taupe} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 20, color: T2.luxuryBrown, marginBottom: 6 }}>No batches found</div>
            <div style={{ fontFamily: F.u, fontSize: 13.5, color: T2.taupe }}>Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 20 }}>
            {filtered.map((b, i) => (
              <FadeUpBatch key={b.batchId} delay={i * 0.04}>
                {b.derivedStatus === "completed"
                  ? <CompletedBatchCard b={b} />
                  : <MobileBatchCard b={b} idx={i} />}
              </FadeUpBatch>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DESKTOP HERO COMPONENT ────────────────────────────────────────────────
