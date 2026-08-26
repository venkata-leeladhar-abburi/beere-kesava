import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { MapPin, Phone, Package,
  CheckCircle2, FileText, ClipboardCheck,
  Send, ArrowRight, Truck, Scale, AlertTriangle, Trash2,
  ChevronLeft, Boxes, Layers, CreditCard } from "lucide-react";
import type { BulkOrder } from "../contexts/BulkOrderContext";
import { useBulkOrders } from "../contexts/BulkOrderContext";
import { useFinishing, DispatchRecord, Quotation } from "@/features/finishing";
import { useBatches } from "@/features/production";
import { SareeWeightTallyList, type TallyRowItem, type TallyCorrection } from "@/features/production";
import { useRatesPricing } from "@/features/pricing";
import { useAuth } from "../../../contexts/AuthContext";
import { autoMaterialSplit } from "@/features/portals";
import { trimNum } from "@/features/pricing";
import { INVOICES } from "@/features/payments";
import { resolveBulkOrderRef, resolveOrderMoney } from "../utils/BulkOrderLinking";
import { DispatchDetailPanel } from "./DispatchDetailPanel";
import { BulkOrderSareesTab, LinkedSaree } from "./BulkOrderSareesTab";
import { BulkOrderOverviewTab } from "./BulkOrderOverviewPaymentsTabs";
import { Button } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";
import { Breadcrumbs } from "../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { SectionCard } from "@/shared/ui/SectionCard";

const T = {
  silkCream: "#F7F2EA", royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B", darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314",
  taupe: "#69635E", green: "#1E6640", greenBg: "rgba(30,102,64,0.09)",
  greenMid: "#2D9158", crimson: "#C0392B", crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)", borderGold: "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const ORDER_STATUS_CFG: Record<BulkOrder["status"], { color: string; bg: string; label: string }> = {
  "on-track": { color: T.green, bg: T.greenBg, label: "On Track" },
  "at-risk": { color: "#8B6018", bg: "rgba(200,155,71,0.14)", label: "At Risk" },
  "overdue": { color: T.crimson, bg: T.crimsonBg, label: "Overdue" },
};

const QUOTE_STATUS_CFG: Record<Quotation["status"], { bg: string; color: string }> = {
  raised: { bg: "rgba(200,155,71,0.14)", color: "#8B6018" },
  "in-finishing": { bg: "rgba(110,15,45,0.08)", color: T.royalBurgundy },
  "partially-received": { bg: "rgba(200,155,71,0.14)", color: "#8B6018" },
  received: { bg: T.greenBg, color: T.greenMid },
  dispatched: { bg: T.greenBg, color: T.greenMid },
};

export function BulkOrderDetailPage({ order, onBack, initialTab = "overview" }: {
  order: BulkOrder; onBack: () => void; initialTab?: "overview" | "sarees" | "payments" | "quotations";
}) {
  const { bulkOrders, tallyOrder, deleteBulkOrder } = useBulkOrders();
  const live = bulkOrders.find(o => o.ref === order.ref) ?? order;
  const { readySarees, returns, dispatches, quotations } = useFinishing();
  const { batches, tallyRow } = useBatches();
  const { user } = useAuth();
  const [tallyBusyKey, setTallyBusyKey] = useState<string | null>(null);

  const [tab, setTab] = useState<"overview" | "sarees" | "payments" | "quotations">(initialTab);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [dispatchFilter, setDispatchFilter] = useState("All");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [sareeTypeFilter, setSareeTypeFilter] = useState("All");
  const [dispatchPanel, setDispatchPanel] = useState<DispatchRecord | null>(null);
  const [tallyPrompt, setTallyPrompt] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cfg = ORDER_STATUS_CFG[live.status];

  // Quotations raised against this order
  const linkedQuotations = useMemo(
    () => quotations.filter(q => q.bulkOrderRef === live.ref),
    [quotations, live.ref]
  );

  const findDispatchFor = useCallback((sareeId: string) => dispatches.find(d => d.sareeIds.includes(sareeId)), [dispatches]);

  // Every saree tied to this order
  const linkedSarees = useMemo<LinkedSaree[]>(() => {
    const byId = new Map<string, LinkedSaree>();
    const quotationRefBySaree = new Map<string, string>();
    linkedQuotations.forEach(q => q.sarees.forEach(s => quotationRefBySaree.set(s.sareeId, q.quotationNumber)));

    readySarees.forEach(s => {
      const boRef = resolveBulkOrderRef(s.bulkOrderRef, s.designCode, s.sareeType, bulkOrders);
      if (boRef !== live.ref && !quotationRefBySaree.has(s.id)) return;
      const bRow = batches.flatMap(b => b.rows.map(row => ({ b, row }))).find(({ row }) => row.sareeId === s.id);
      byId.set(s.id, {
        id: s.id, designCode: s.designCode, sareeType: s.sareeType, sareeTypeCode: s.sareeTypeCode,
        weaverName: s.weaverName, batchId: bRow?.b.batchId, serial: bRow?.row.serial, status: "QC Passed", date: s.qcPassDate,
        quotationRef: quotationRefBySaree.get(s.id),
      });
    });

    returns.forEach(r => {
      const boRef = resolveBulkOrderRef(undefined, r.designCode, r.sareeType, bulkOrders);
      const isQuotationLinked = r.quotationRef && linkedQuotations.some(q => q.quotationNumber === r.quotationRef);
      if (boRef !== live.ref && !isQuotationLinked && !quotationRefBySaree.has(r.sareeId)) return;
      const bRow = batches.flatMap(b => b.rows.map(row => ({ b, row }))).find(({ row }) => row.sareeId === r.sareeId);
      byId.set(r.sareeId, {
        id: r.sareeId, designCode: r.designCode, sareeType: r.sareeType, sareeTypeCode: r.sareeTypeCode,
        weaverName: r.weaverName, batchId: bRow?.b.batchId, serial: bRow?.row.serial,
        status: r.inventoryStatus === "Ready for Dispatch" ? "Finishing complete" : (r.inventoryStatus.includes("Damaged") ? "Damaged — Review Needed" : r.inventoryStatus) as LinkedSaree["status"],
        date: r.receivedDate,
        quotationRef: r.quotationRef ?? quotationRefBySaree.get(r.sareeId),
        dispatch: findDispatchFor(r.sareeId),
      });
    });

    linkedQuotations.forEach(q => q.sarees.forEach(s => {
      if (byId.has(s.sareeId)) return;
      byId.set(s.sareeId, {
        id: s.sareeId, designCode: s.designCode, sareeType: s.sareeType, sareeTypeCode: s.sareeTypeCode,
        weaverName: s.weaverName, status: "QC Passed", date: q.quotationDate, quotationRef: q.quotationNumber,
      });
    }));

    return [...byId.values()];
  }, [readySarees, returns, bulkOrders, live.ref, batches, linkedQuotations, findDispatchFor]);

  const batchOptions = useMemo(() => ["All", ...Array.from(new Set(linkedSarees.map(s => s.batchId).filter(Boolean) as string[]))], [linkedSarees]);
  const weaverOptions = useMemo(() => ["All", ...Array.from(new Set(linkedSarees.map(s => s.weaverName).filter(Boolean)))].sort(), [linkedSarees]);
  const sareeTypeOptions = useMemo(() => ["All", ...Array.from(new Set(linkedSarees.map(s => s.sareeType).filter(Boolean)))].sort(), [linkedSarees]);

  const filteredSarees = linkedSarees.filter(s => {
    const q = search.toLowerCase();
    const mSearch = !q || s.id.toLowerCase().includes(q) || s.designCode.toLowerCase().includes(q) || s.weaverName.toLowerCase().includes(q);
    const mStatus = statusFilter === "All" || s.status === statusFilter;
    const mBatch = batchFilter === "All" || s.batchId === batchFilter;
    const mDispatch = dispatchFilter === "All" || (dispatchFilter === "Dispatched" ? !!s.dispatch : !s.dispatch);
    const mWeaver = weaverFilter === "All" || s.weaverName === weaverFilter;
    const mSareeType = sareeTypeFilter === "All" || s.sareeType === sareeTypeFilter;
    return mSearch && mStatus && mBatch && mDispatch && mWeaver && mSareeType;
  });

  const dispatchedCount = linkedSarees.filter(s => s.dispatch).length;
  const damagedCount = linkedSarees.filter(s => s.status === "Damaged — Review Needed").length;
  // "Completed" — every saree actually linked to this order has at least
  // passed QC (that's the earliest stage linkedSarees tracks), so its count
  // is the real produced total. live.done is a separate, manually-set DB
  // column nothing keeps in sync with production, so it drifts to 0 and
  // never reflects a saree that's actually been produced for the order.
  const producedCount = linkedSarees.length;
  const pct = live.total > 0 ? Math.round((producedCount / live.total) * 100) : 0;

  // ── Weight & material tally ──────────────────────────────────────────────
  // Every saree carries the weight AND the actual warp/resham/jari split
  // Worker Staff entered at receipt (BatchSareeRow.received{Weight,WarpG,
  // ReshamG,JariReels}) — not a re-derived estimate. Cross-checking the sum
  // of those, per saree, against what the order's saree type calls for
  // surfaces shortfalls (skimmed material, under-weight sarees) the
  // per-saree list alone doesn't make obvious.
  const { getSareeTypeByCode } = useRatesPricing();
  const sareeReceiptById = useMemo(() => {
    const m = new Map<string, { weight: number; warpG?: number; reshamG?: number; jariReels?: number }>();
    batches.forEach(b => b.rows.forEach(r => {
      if (r.sareeId && r.receivedWeight) {
        m.set(r.sareeId, {
          weight: Number(r.receivedWeight) || 0,
          warpG: r.receivedWarpG ? Number(r.receivedWarpG) : undefined,
          reshamG: r.receivedReshamG ? Number(r.receivedReshamG) : undefined,
          jariReels: r.receivedJariReels ? Number(r.receivedJariReels) : undefined,
        });
      }
    }));
    return m;
  }, [batches]);

  // Per-saree tally rows — real backend rows (weight/warp/resham/jari as
  // Worker Staff entered them, plus this saree's own tally state), scoped to
  // only the sarees actually linked to this order (not the whole batch).
  const rowBySareeId = useMemo(
    () => new Map(batches.flatMap(b => b.rows.filter(r => r.sareeId).map(r => [r.sareeId as string, r] as const))),
    [batches],
  );

  const tallyItems: TallyRowItem[] = useMemo(
    () => linkedSarees
      .filter(s => s.batchId && s.serial !== undefined)
      .map(s => {
        const row = rowBySareeId.get(s.id);
        return {
          sareeId: s.id,
          serial: s.serial as number,
          batchId: s.batchId as string,
          weaverName: s.weaverName,
          sareeTypeCode: s.sareeTypeCode ?? null,
          receivedPhotoUrl: row?.receivedPhotoUrl ?? null,
          actualWeight: row?.receivedWeight ? Number(row.receivedWeight) : null,
          actualWarpG: row?.receivedWarpG ? Number(row.receivedWarpG) : null,
          actualReshamG: row?.receivedReshamG ? Number(row.receivedReshamG) : null,
          actualJariReels: row?.receivedJariReels ? Number(row.receivedJariReels) : null,
          tallied: row?.tallied ?? false,
          talliedBy: row?.talliedBy ?? null,
          talliedAt: row?.talliedAt ?? null,
        };
      }),
    [linkedSarees, rowBySareeId],
  );

  const handleToggleSareeTally = async (item: TallyRowItem, tallied: boolean) => {
    const key = `${item.batchId}-${item.serial}`;
    setTallyBusyKey(key);
    try {
      await tallyRow(item.batchId, item.serial, tallied, user?.name);
    } finally {
      setTallyBusyKey(null);
    }
  };

  // Admin corrects the weight/material figures Worker Staff entered at
  // receipt, then the row is marked tallied in the same action.
  const handleSaveSareeCorrection = async (item: TallyRowItem, correction: TallyCorrection) => {
    const key = `${item.batchId}-${item.serial}`;
    setTallyBusyKey(key);
    try {
      await tallyRow(item.batchId, item.serial, true, user?.name, correction);
    } finally {
      setTallyBusyKey(null);
    }
  };

  const weightTally = useMemo(() => {
    let actualWeight = 0, warpG = 0, reshamG = 0, jariReels = 0, weighedCount = 0;
    linkedSarees.forEach(s => {
      const receipt = sareeReceiptById.get(s.id);
      if (!receipt) return;
      weighedCount += 1;
      actualWeight += receipt.weight;
      // Actual entry wins wherever Worker Staff recorded one; only a saree
      // received before this was tracked (or where the entry was somehow
      // blank) falls back to the standard-rate estimate for its weight.
      if (receipt.warpG !== undefined || receipt.reshamG !== undefined || receipt.jariReels !== undefined) {
        warpG += receipt.warpG ?? 0;
        reshamG += receipt.reshamG ?? 0;
        jariReels += receipt.jariReels ?? 0;
      } else {
        const split = autoMaterialSplit(s.sareeTypeCode, String(receipt.weight), getSareeTypeByCode);
        if (split) {
          warpG += Number(split.warp) || 0;
          reshamG += Number(split.resham) || 0;
          jariReels += Number(split.jari) || 0;
        }
      }
    });

    // Expected side: the order's own saree type standard, scaled to every
    // saree it calls for (live.total) — a bulk order is placed for a single
    // saree type, so one rate card covers the whole thing.
    const orderTypeCode = live.sareeType?.split(" · ").pop()?.trim();
    const rate = orderTypeCode ? getSareeTypeByCode(orderTypeCode) : undefined;
    const std = rate ? Number(rate.stdWeight) || 0 : 0;
    const expectedWeight = std * live.total;
    const expectedWarpG = rate ? (Number(rate.warpWeight) || 0) * live.total : 0;
    const expectedReshamG = rate ? (Number(rate.reshamWeight) || 0) * live.total : 0;
    const expectedJariReels = rate ? (Number(rate.jariWeight) || 0) * live.total : 0;

    return {
      weighedCount, actualWeight, warpG, reshamG, jariReels,
      rate, expectedWeight, expectedWarpG, expectedReshamG, expectedJariReels,
    };
  }, [linkedSarees, sareeReceiptById, getSareeTypeByCode, live.sareeType, live.total]);

  const money = resolveOrderMoney(live, INVOICES);
  const { amountDue, amountPaid, balance } = money;
  const matchedInvoice = money.invoiceId ? { id: money.invoiceId } : null;

  const inr = (n: number) => formatMoney(rupees(n));

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: <Boxes size={18} /> },
    { key: "sarees" as const, label: `Sarees (${linkedSarees.length})`, icon: <Package size={18} /> },
    { key: "payments" as const, label: "Payments", icon: <CreditCard size={18} /> },
    { key: "quotations" as const, label: `Quotations (${linkedQuotations.length})`, icon: <FileText size={18} /> },
  ];

  return (
    <div className="px-3 sm:px-7 xl:px-14 py-4 sm:py-8" style={{ background: T.silkCream, minHeight: "100dvh" }}>
      <div className="hidden sm:block mb-4">
        <Breadcrumbs
          items={[
            { key: "production", label: "Production", onClick: onBack },
            { key: "bulk-orders", label: "Bulk Orders", onClick: onBack },
            { key: "order", label: live.ref },
          ]}
        />
      </div>

      {/* Header row with Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-[var(--border-default)] shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft size={16} /> Back to Bulk Orders
          </Button>

          <Button
            onClick={() => setDeletePrompt(true)}
            variant="secondary"
            className="sm:hidden h-9 px-3 rounded-full border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="hidden xs:flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider whitespace-nowrap">
            <Package size={14} className="text-[#6E0F2D]" />
            <span>Bulk Order</span>
          </div>

          <span className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full flex items-center justify-center font-bold text-xs uppercase tracking-wider whitespace-nowrap shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>

          <EntityCode type="order" value={live.ref} size="md" className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#FFFDF9] border border-[#E8DCC4] text-[#3B2314] font-mono font-bold text-xs flex items-center whitespace-nowrap shrink-0" />

          <Button
            onClick={() => setDeletePrompt(true)}
            variant="secondary"
            className="hidden sm:flex h-9 sm:h-10 px-3.5 sm:px-4 rounded-full border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Trash2 size={14} /> Delete Order
          </Button>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="mb-6">
        <div className="relative bg-[#0D0207] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,155,71,0.25)]">
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${BG_IMAGE})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.24, pointerEvents: "none"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(74,6,27,0.92) 0%, rgba(13,2,7,0.95) 100%)", pointerEvents: "none" }} />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap min-w-0 flex-1">
              <div className="relative shrink-0">
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, fontWeight: 700, border: "2px solid rgba(200,155,71,0.45)" }}>
                  {live.customer.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                    BULK ORDER DETAILS
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                  {live.customer}
                </h1>
                <div className="mt-2 flex flex-col gap-1 text-xs sm:text-sm text-white/70">
                  {live.address && (
                    <div className="flex items-start gap-1.5 line-clamp-2 max-w-2xl">
                      <MapPin size={14} color={T.antiqueGold} className="shrink-0 mt-0.5" />
                      <span>{live.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 flex-wrap mt-0.5">
                    {live.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} color={T.antiqueGold} />
                        {live.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Package size={14} color={T.antiqueGold} />
                      {live.sareeType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Luxury Metrics Stats Cards Row */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0 w-full xl:w-auto">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 min-w-[150px] flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.20)] flex items-center justify-center shrink-0">
                  <Boxes size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Progress</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{producedCount}/{live.total} <span className="text-white/60 text-xs font-normal">({pct}%)</span></div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 min-w-[150px] flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.20)] flex items-center justify-center shrink-0">
                  <Truck size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Deadline</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{live.due}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 min-w-[150px] flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.20)] flex items-center justify-center shrink-0">
                  <CreditCard size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Outstanding</div>
                  <div className={`text-sm sm:text-base font-bold mt-0.5 whitespace-nowrap ${balance > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {balance > 0 ? inr(balance) : <Money value={rupees(0)} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weight & Material Tally inside SectionCard */}
      <div className="mb-6">
        <SectionCard
          icon={Scale}
          title="Weight & Material Tally"
          subtitle={
            weightTally.rate
              ? `${weightTally.weighedCount} of ${live.total} sarees weighed so far, against the ${weightTally.rate.code} standard (${weightTally.rate.stdWeight}g/saree).`
              : `${weightTally.weighedCount} of ${live.total} sarees weighed so far — no rate card found for "${live.sareeType}", so expected figures can't be computed.`
          }
          actions={
            !live.tallied && (
              <Button onClick={() => setTallyPrompt(true)} variant="primary" size="sm" iconLeft={CheckCircle2} className="bg-[#C89B47] hover:bg-[#E7C983] text-[#3B2314] font-bold">
                Mark as Tallied
              </Button>
            )
          }
        >
          {/* Tally status alert banner */}
          <div className={`mb-5 p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 ${live.tallied ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            <ClipboardCheck size={20} className={live.tallied ? "text-emerald-600" : "text-amber-700"} />
            <div>
              <div className="text-xs sm:text-sm font-bold">
                {live.tallied ? "Sarees Tallied" : "Sarees Not Yet Tallied"}
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                {live.tallied
                  ? `Verified against physical count by ${live.talliedBy} on ${live.talliedDate}`
                  : "Count the physical sarees for this order against the list below, then mark it tallied."}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {[
              { label: "Total Weight", actual: weightTally.actualWeight, expected: weightTally.expectedWeight, unit: "g" },
              { label: "Warp", actual: weightTally.warpG, expected: weightTally.expectedWarpG, unit: "g" },
              { label: "Resham", actual: weightTally.reshamG, expected: weightTally.expectedReshamG, unit: "g" },
              { label: "Jari", actual: weightTally.jariReels, expected: weightTally.expectedJariReels, unit: "reels" },
            ].map(m => {
              const complete = weightTally.weighedCount >= live.total && live.total > 0;
              const short = complete && m.expected > 0 && m.actual < m.expected * 0.95;
              return (
                <div key={m.label} style={{ background: short ? "rgba(192,57,43,0.05)" : T.silkCream, border: `1px solid ${short ? "rgba(192,57,43,0.20)" : T.borderDef}`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: short ? T.crimson : T.luxuryBrown, display: "flex", alignItems: "baseline", gap: 4 }}>
                    {trimNum(m.actual, m.unit === "reels" ? 2 : 0)}
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400, color: T.taupe }}>{m.unit}</span>
                  </div>
                  {weightTally.rate && (
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      of {trimNum(m.expected, m.unit === "reels" ? 2 : 0)}{m.unit} expected
                      {short && <AlertTriangle size={12} color={T.crimson} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Per-Saree Tally ({tallyItems.filter(i => i.tallied).length} / {tallyItems.length} tallied)
          </div>
          <SareeWeightTallyList
            items={tallyItems}
            getSareeTypeByCode={getSareeTypeByCode}
            onToggleTally={handleToggleSareeTally}
            onSaveCorrection={handleSaveSareeCorrection}
            busyKey={tallyBusyKey}
          />
        </SectionCard>
      </div>

      {/* Sub-tab strip */}
      <div className="w-full overflow-x-auto section-nav-scroll pb-1 mb-6 border-b-2 border-[var(--border-default)]">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map(t => {
            const isActive = tab === t.key;
            return (
              <Button
                key={t.key}
                variant="tertiary"
                onClick={() => setTab(t.key)}
                className={
                  "rounded-none px-4 sm:px-6 py-3 mb-[-6px] shrink-0 text-sm sm:text-base cursor-pointer flex items-center gap-2.5 transition-all " +
                  (isActive
                    ? "border-b-[3px] border-[#6E0F2D] text-[#6E0F2D] font-bold"
                    : "border-b-[3px] border-transparent text-[#9C8672] hover:text-[#6E0F2D] font-medium")
                }
              >
                {t.icon}
                <span>{t.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {tab === "overview" && (
            <SectionCard
              icon={Boxes}
              title="Bulk Order Overview & Status"
              subtitle={`Production metrics, dispatches summary, and invoice balance for ${live.ref}`}
            >
              <BulkOrderOverviewTab
                live={live}
                producedCount={producedCount}
                dispatchedCount={dispatchedCount}
                damagedCount={damagedCount}
                matchedInvoice={matchedInvoice}
                amountDue={amountDue}
                amountPaid={amountPaid}
                inr={inr}
              />
            </SectionCard>
          )}

          {tab === "sarees" && (
            <SectionCard
              icon={Layers}
              title="Sarees Production & Dispatches"
              subtitle={`Track every saree tied to order ${live.ref} across looms, QC, and dispatches`}
            >
              <BulkOrderSareesTab
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                batchFilter={batchFilter}
                setBatchFilter={setBatchFilter}
                dispatchFilter={dispatchFilter}
                setDispatchFilter={setDispatchFilter}
                weaverFilter={weaverFilter}
                setWeaverFilter={setWeaverFilter}
                sareeTypeFilter={sareeTypeFilter}
                setSareeTypeFilter={setSareeTypeFilter}
                batchOptions={batchOptions}
                weaverOptions={weaverOptions}
                sareeTypeOptions={sareeTypeOptions}
                filteredSarees={filteredSarees}
                setDispatchPanel={setDispatchPanel}
              />
            </SectionCard>
          )}

          {tab === "quotations" && (
            <SectionCard
              icon={FileText}
              title="Quotations & Cost Estimates"
              subtitle={`Linked quotations raised against bulk order ${live.ref}`}
            >
              {linkedQuotations.length === 0 ? (
                <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  No quotations linked to this bulk order yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {linkedQuotations.map(q => {
                    const qCfg = QUOTE_STATUS_CFG[q.status];
                    const qDispatch = dispatches.find(d => d.quotationRef === q.quotationNumber);
                    return (
                      <div key={q.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "18px 20px", background: T.silkCream }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{q.quotationNumber}</span>
                              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize", background: qCfg.bg, color: qCfg.color, padding: "3px 9px", borderRadius: 20 }}>{q.status.replace(/-/g, " ")}</span>
                            </div>
                            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{q.quotationDate} · {q.sarees.length} saree{q.sarees.length === 1 ? "" : "s"} · {q.firmName || "—"}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{inr(q.grandTotal)}</div>
                            {q.applyGst && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>incl. {q.gstPct}% GST</div>}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: qDispatch ? 14 : 0 }}>
                          {q.sarees.map(s => (
                            <span key={s.sareeId} style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 8px", borderRadius: 6 }}>{s.sareeId}</span>
                          ))}
                        </div>

                        {qDispatch ? (
                          <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Truck size={16} color={T.greenMid} />
                              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
                                Dispatched {qDispatch.dispatchDate} · LR <strong>{qDispatch.lrNumber || "—"}</strong> · {qDispatch.transportCompany || "—"}
                              </span>
                            </div>
                            <span style={{ display: "inline-block", background: T.greenBg, color: T.greenMid, borderRadius: 8 }}>
                              <Button onClick={() => setDispatchPanel(qDispatch)} variant="tertiary" size="sm">
                                View Full Dispatch Details
                              </Button>
                            </span>
                          </div>
                        ) : (
                          <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, fontFamily: F.ui, fontSize: 12, color: T.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                            <Send size={13} /> Not dispatched yet — send from Inventory once the sarees are received from finishing.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {dispatchPanel && <DispatchDetailPanel dispatch={dispatchPanel} onClose={() => setDispatchPanel(null)} />}
      </AnimatePresence>

      {tallyPrompt && (
        <Modal open onOpenChange={o => !o && setTallyPrompt(false)} size="xs">
          <div style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <ClipboardCheck size={20} color={T.royalBurgundy} />
              <Dialog.Title asChild>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>Tally this order</div>
              </Dialog.Title>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6, margin: "0 0 16px" }}>
              Confirms the physical saree count for {live.ref} matches the {linkedSarees.length} saree{linkedSarees.length === 1 ? "" : "s"} listed against it.
            </p>
            <div style={{ position: "relative", width: "100%", height: 50, background: "rgba(110,15,45,0.06)", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20 }}>
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe }}>
                Swipe to confirm tally
              </span>
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 318 }}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  if (info.offset.x > 250) {
                    tallyOrder(live.ref, "Admin");
                    setTallyPrompt(false);
                  }
                }}
                style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 50, background: T.royalBurgundy, borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab"
                }}
                whileTap={{ cursor: "grabbing" }}
              >
                <ArrowRight size={20} color="#FFF" />
              </motion.div>
            </div>
          </div>
        </Modal>
      )}

      {deletePrompt && (
        <Modal open onOpenChange={o => !o && setDeletePrompt(false)} size="xs">
          <div style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <AlertTriangle size={20} color={T.crimson} />
              <Dialog.Title asChild>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>Delete this order?</div>
              </Dialog.Title>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6, margin: "0 0 20px" }}>
              This permanently removes {live.ref} ({live.customer}). Batches, quotations, and dispatches already linked to it are kept, just unlinked from this order — this can&apos;t be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button onClick={() => setDeletePrompt(false)} variant="secondary" size="md" disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteBulkOrder(live.ref);
                    setDeletePrompt(false);
                    onBack();
                  } finally {
                    setDeleting(false);
                  }
                }}
                variant="danger"
                size="md"
                iconLeft={Trash2}
                loading={deleting}
              >
                Delete Order
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
