import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Scale, ChevronLeft, UserRound, Layers, TrendingUp } from "lucide-react";
import { useBatches, type SareeRow } from "../contexts/BatchContext";
import { useRatesPricing } from "@/features/pricing";
import { T, F } from "./theme";
import { rowComplete, weaverBreakdown, bulkOrderBreakdown } from "./sections/batches/ContextBatchCard";
import { SareeWeightTallyList, type TallyRowItem, type TallyCorrection } from "./sections/batches/SareeWeightTallyList";
import { Button, SearchInput, Select, SelectItem } from "../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../shared/ui/state";
import { EntityCode } from "@/shared/ui/domain";
import { Breadcrumbs } from "../../../shared/ui/nav/Breadcrumbs";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { SectionCard } from "@/shared/ui/SectionCard";

/**
 * Batch Tally as its own full page (same pattern as BulkOrderDetailPage —
 * replaces the whole Production page rather than opening a modal), so the
 * per-saree weight/material tally has room to breathe and can be linked to
 * directly instead of being buried inside a dialog.
 */
export function BatchTallyPage({ batchId, onBack, onOpenCreation }: { batchId: string; onBack: () => void; onOpenCreation: () => void }) {
  const { batches, tallyRow, isLoading, isError, error, refetch } = useBatches();
  const b = batches.find(br => br.batchId === batchId);

  const { getSareeTypeByCode } = useRatesPricing();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [qcFilter, setQcFilter] = useState("All");

  const rootRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const toTop = () => {
      window.scrollTo(0, 0);
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      document.body.scrollTop = 0;
      for (let el = rootRef.current?.parentElement; el; el = el.parentElement) {
        if (el.scrollTop) el.scrollTop = 0;
      }
    };
    toTop();
    const raf = requestAnimationFrame(toTop);
    const timers = [setTimeout(toTop, 60), setTimeout(toTop, 250)];
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [batchId]);

  const weaverOptions = useMemo(() => b ? ["All", ...Array.from(new Set(b.rows.map(r => r.weaverName).filter(Boolean)))].sort() : ["All"], [b]);
  const orderOptions = useMemo(() => b ? ["All", "General Stock", ...Array.from(new Set(b.rows.map(r => r.bulkOrderLabel).filter(Boolean)))].sort() : ["All"], [b]);

  const filteredRows = (b?.rows ?? []).filter(r => {
    const q = search.toLowerCase();
    const mSearch = !q || r.sareeId?.toLowerCase().includes(q) || r.weaverName?.toLowerCase().includes(q);
    const mWeaver = weaverFilter === "All" || r.weaverName === weaverFilter;
    const orderLabel = r.bulkOrderLabel || "General Stock";
    const mOrder = orderFilter === "All" || orderLabel === orderFilter;
    const mQc = qcFilter === "All" || (qcFilter === "QC Passed" ? r.qcPassed : !r.qcPassed);
    return mSearch && mWeaver && mOrder && mQc;
  });

  const tallyItems: TallyRowItem[] = filteredRows
    .map((r: SareeRow) => ({
      sareeId: r.sareeId ?? null,
      serial: r.serial,
      batchId,
      weaverName: r.weaverName,
      weaverLoom: r.weaverLoom,
      bulkOrderLabel: r.bulkOrderLabel,
      qcPassed: !!r.qcPassed,
      sareeTypeCode: r.sareeTypeCode,
      receivedPhotoUrl: r.receivedPhotoUrl,
      actualWeight: r.receivedWeight ? Number(r.receivedWeight) : null,
      actualWarpG: r.receivedWarpG ? Number(r.receivedWarpG) : null,
      actualReshamG: r.receivedReshamG ? Number(r.receivedReshamG) : null,
      actualJariReels: r.receivedJariReels ? Number(r.receivedJariReels) : null,
      tallied: r.tallied,
      talliedBy: r.talliedByName,
      talliedAt: r.talliedAt,
    }));

  const handleToggleTally = async (item: TallyRowItem, tallied: boolean) => {
    const key = `${item.batchId}-${item.serial}`;
    setBusyKey(key);
    try {
      await tallyRow(item.batchId, item.serial, tallied);
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveCorrection = async (item: TallyRowItem, correction: TallyCorrection) => {
    const key = `${item.batchId}-${item.serial}`;
    setBusyKey(key);
    try {
      await tallyRow(item.batchId, item.serial, true, correction);
    } finally {
      setBusyKey(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "60vh", padding: 24 }}>
        <LoadingState variant="skeleton" rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!b) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: F.ui }}>
        <div style={{ fontSize: 14, color: T.taupe }}>Batch {batchId} not found.</div>
        <Button onClick={onBack} variant="secondary" iconLeft={ArrowLeft}>Back to Batches</Button>
      </div>
    );
  }

  const completeCount = b.rows.filter(rowComplete).length;
  const pct = b.totalCount > 0 ? Math.round((completeCount / b.totalCount) * 100) : 0;
  const weavers = weaverBreakdown(b.rows);
  const orders = bulkOrderBreakdown(b.rows);
  const firstRow = b.rows[0];

  return (
    <div ref={rootRef} className="px-3 sm:px-7 xl:px-14 py-4 sm:py-8 min-h-dvh">
      <div className="mb-3 sm:mb-4">
        <Breadcrumbs
          items={[
            { key: "production", label: "Production", onClick: onBack },
            { key: "batches", label: "Batches", onClick: onBack },
            { key: "batch", label: b.batchId },
          ]}
        />
      </div>

      {/* Header row with Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-[var(--border-default)] shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft size={16} /> Back to Batches
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <Button
            onClick={onOpenCreation}
            variant="primary"
            size="md"
            iconRight={ArrowRight}
            className="h-9 sm:h-10 px-4 rounded-full border-none shadow-[0_4px_16px_rgba(110,15,45,0.3)] bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#580C24] font-bold text-xs sm:text-sm cursor-pointer"
          >
            Open in Batch Creation
          </Button>

          <div className="hidden xs:flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider whitespace-nowrap">
            <UserRound size={14} className="text-[#6E0F2D]" />
            <span>Batch Profile</span>
          </div>

          <EntityCode type="batch" value={b.batchId} size="md" className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#FFFDF9] border border-[#E8DCC4] text-[#3B2314] font-mono font-bold text-xs flex items-center whitespace-nowrap shrink-0" />
        </div>
      </div>

      {/* Profile Hero Banner */}
      <div className="mb-6">
        <div className="relative bg-[#0D0207] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,155,71,0.3)]">
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${BG_IMAGE})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.35, pointerEvents: "none"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(74,6,27,0.88) 0%, rgba(13,2,7,0.94) 100%)", pointerEvents: "none" }} />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col lg:flex-row gap-5 lg:gap-7 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap w-full lg:w-auto">
              <div className="relative shrink-0">
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(200,155,71,0.45)", boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>
                  <Layers size={36} color={T.darkBurgundy} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-[#3B2314] px-2.5 py-0.5 rounded-md shadow-xs">
                    {b.batchId}
                  </span>
                  <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                    PRODUCTION BATCH
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#FFFDF9] font-bold font-serif leading-tight truncate tracking-tight">
                  {firstRow ? firstRow.sareeTypeName : "Batch"} Production
                </h1>
                <div className="mt-2.5 flex items-center gap-3 flex-wrap text-xs sm:text-sm text-white/80">
                  <span className="flex items-center gap-1.5"><Layers size={14} color={T.antiqueGold} /> Total Sarees: <strong>{b.totalCount}</strong></span>
                  <span className="flex items-center gap-1.5"><UserRound size={14} color={T.antiqueGold} /> Weavers: <strong>{weavers.length} Assigned</strong></span>
                </div>
              </div>
            </div>

            {/* Metrics Stats Cards */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.2)] flex items-center justify-center shrink-0">
                  <TrendingUp size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Progress</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{pct}% Complete</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Scale size={20} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Tallied</div>
                  <div className="text-sm sm:text-base font-bold text-[#7EE2A8] mt-0.5 whitespace-nowrap">{tallyItems.filter(i => i.tallied).length} / {tallyItems.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <SectionCard
          icon={TrendingUp}
          title="Production Progress"
          subtitle={`Live manufacturing progress for batch ${b.batchId}`}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Batch Progress</span>
            <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: pct === 100 ? T.green : T.antiqueGold }}>
              {completeCount} / {b.totalCount} ({pct}%) Complete
            </span>
          </div>
          <div style={{ height: 12, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg, ${T.green} 0%, #4ade80 100%)` : `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99 }} />
          </div>
        </SectionCard>

        <SectionCard
          icon={Layers}
          title="Batch Details & Weaver Assignments"
          subtitle={`Due date, weaver allocation, and linked bulk orders for ${b.batchId}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Due Date</div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{b.dueDate || "Not Set"}</div>
            </div>

            <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Assigned Weavers
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {weavers.map(w => (
                  <span key={w.name} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: w.name === "Unassigned" ? "rgba(139,112,96,0.06)" : "rgba(110,15,45,0.05)", color: w.name === "Unassigned" ? T.taupe : T.royalBurgundy, border: `1px solid ${w.name === "Unassigned" ? "rgba(139,112,96,0.15)" : T.borderDef}`, borderRadius: 8, padding: "5px 10px" }}>
                    {w.count} × {w.name}
                  </span>
                ))}
              </div>
            </div>

            {orders.length > 0 && (
              <>
                <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Linked Bulk Orders
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {orders.map(o => (
                      <span key={o.label} style={{ background: "rgba(30,102,64,0.08)", border: "1px solid rgba(30,102,64,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: T.green, fontWeight: 600 }}>
                        {o.label} ({o.count})
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </SectionCard>

        <SectionCard
          icon={Scale}
          title="Sarees & Weight Tally"
          subtitle={`Physical tally and material weight verification records for ${b.batchId}`}
        >
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>
            Weight is what Worker Staff entered at receipt, shown against the SareeTypeRate standard for that saree's type. Tally each saree once you've physically verified it.
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2.5 mb-4">
            <SearchInput aria-label="Search saree ID or weaver" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Saree ID, Weaver..." className="w-full md:w-[240px] shrink-0" />
            <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto shrink-0 w-full md:w-auto pb-1 md:pb-0">
              <Select value={weaverFilter} onValueChange={setWeaverFilter} size="sm" className="w-auto min-w-[130px] shrink-0">
                {weaverOptions.map(w => <SelectItem key={w as string} value={w as string}>{w === "All" ? "All Weavers" : w as string}</SelectItem>)}
              </Select>
              <Select value={orderFilter} onValueChange={setOrderFilter} size="sm" className="w-auto min-w-[130px] shrink-0">
                {orderOptions.map(o => <SelectItem key={o as string} value={o as string}>{o === "All" ? "All Orders" : o as string}</SelectItem>)}
              </Select>
              <Select value={qcFilter} onValueChange={setQcFilter} size="sm" className="w-auto min-w-[130px] shrink-0">
                {["All", "QC Passed", "In Progress"].map(q => <SelectItem key={q} value={q}>{q === "All" ? "All QC Status" : q}</SelectItem>)}
              </Select>
            </div>
          </div>

          <SareeWeightTallyList
            items={tallyItems}
            getSareeTypeByCode={getSareeTypeByCode}
            onToggleTally={handleToggleTally}
            onSaveCorrection={handleSaveCorrection}
            busyKey={busyKey}
          />
        </SectionCard>
      </div>
    </div>
  );
}
