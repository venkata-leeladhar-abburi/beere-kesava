import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft, MapPin, Phone, Package,
  CheckCircle2, FileText, ClipboardCheck,
  Send, ArrowRight, Truck, Scale, AlertTriangle, Trash2,
} from "lucide-react";
import type { BulkOrder } from "../contexts/BulkOrderContext";
import { useBulkOrders } from "../contexts/BulkOrderContext";
import { useFinishing, DispatchRecord, Quotation } from "../../finishing/contexts/FinishingContext";
import { useBatches } from "../../production/contexts/BatchContext";
import { SareeWeightTallyList, type TallyRowItem } from "../../production/components/sections/batches/SareeWeightTallyList";
import { useRatesPricing } from "../../pricing/contexts/RatesContext";
import { useAuth } from "../../../contexts/AuthContext";
import { autoMaterialSplit } from "../../portals/components/worker/weavers/MaterialSplitPanel";
import { trimNum } from "../../pricing/components/rates-pricing/jariUtils";
import { INVOICES } from "../../payments/data/invoices";
import { resolveBulkOrderRef, resolveOrderMoney } from "../utils/BulkOrderLinking";
import { DispatchDetailPanel } from "./DispatchDetailPanel";
import { BulkOrderSareesTab, LinkedSaree } from "./BulkOrderSareesTab";
import { BulkOrderOverviewTab, BulkOrderPaymentsTab } from "./BulkOrderOverviewPaymentsTabs";
import { Button } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";
import { Breadcrumbs } from "../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

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

  const findDispatchFor = (sareeId: string) => dispatches.find(d => d.sareeIds.includes(sareeId));

  // Every saree tied to this order
  const linkedSarees = useMemo<LinkedSaree[]>(() => {
    const byId = new Map<string, LinkedSaree>();
    const quotationRefBySaree = new Map<string, string>();
    linkedQuotations.forEach(q => q.sarees.forEach(s => quotationRefBySaree.set(s.sareeId, q.quotationNumber)));

    readySarees.forEach(s => {
      const boRef = resolveBulkOrderRef((s as any).bulkOrderRef, s.designCode, s.sareeType, bulkOrders);
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
  }, [readySarees, returns, bulkOrders, live.ref, batches, linkedQuotations, dispatches]);

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
          weight: parseFloat(r.receivedWeight),
          warpG: r.receivedWarpG ? parseFloat(r.receivedWarpG) : undefined,
          reshamG: r.receivedReshamG ? parseFloat(r.receivedReshamG) : undefined,
          jariReels: r.receivedJariReels ? parseFloat(r.receivedJariReels) : undefined,
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
          actualWeight: row?.receivedWeight ? parseFloat(row.receivedWeight) : null,
          actualWarpG: row?.receivedWarpG ? parseFloat(row.receivedWarpG) : null,
          actualReshamG: row?.receivedReshamG ? parseFloat(row.receivedReshamG) : null,
          actualJariReels: row?.receivedJariReels ? parseFloat(row.receivedJariReels) : null,
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
          warpG += parseFloat(split.warp) || 0;
          reshamG += parseFloat(split.resham) || 0;
          jariReels += parseFloat(split.jari) || 0;
        }
      }
    });

    // Expected side: the order's own saree type standard, scaled to every
    // saree it calls for (live.total) — a bulk order is placed for a single
    // saree type, so one rate card covers the whole thing.
    const orderTypeCode = live.sareeType?.split(" · ").pop()?.trim();
    const rate = orderTypeCode ? getSareeTypeByCode(orderTypeCode) : undefined;
    const std = rate ? parseFloat(rate.stdWeight) || 0 : 0;
    const expectedWeight = std * live.total;
    const expectedWarpG = rate ? (parseFloat(rate.warpWeight) || 0) * live.total : 0;
    const expectedReshamG = rate ? (parseFloat(rate.reshamWeight) || 0) * live.total : 0;
    const expectedJariReels = rate ? (parseFloat(rate.jariWeight) || 0) * live.total : 0;

    return {
      weighedCount, actualWeight, warpG, reshamG, jariReels,
      rate, expectedWeight, expectedWarpG, expectedReshamG, expectedJariReels,
    };
  }, [linkedSarees, sareeReceiptById, getSareeTypeByCode, live.sareeType, live.total]);

  const money = resolveOrderMoney(live, INVOICES);
  const { amountDue, amountPaid, balance, payments } = money;
  const matchedInvoice = money.invoiceId ? { id: money.invoiceId } : null;

  const inr = (n: number) => formatMoney(rupees(n));

  const card: React.CSSProperties = { background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" };
  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "sarees" as const, label: `Sarees (${linkedSarees.length})` },
    { key: "payments" as const, label: "Payments" },
    { key: "quotations" as const, label: `Quotations (${linkedQuotations.length})` },
  ];

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", paddingBottom: 100 }}>
      <div style={{ padding: "40px 56px 0" }}>
        <div style={{ marginBottom: 16 }}>
          <Breadcrumbs
            items={[
              { key: "production", label: "Production", onClick: onBack },
              { key: "bulk-orders", label: "Bulk Orders", onClick: onBack },
              { key: "order", label: live.ref },
            ]}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <Button onClick={onBack} variant="tertiary" size="md" iconLeft={ArrowLeft}>
            Back to Bulk Orders
          </Button>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color, padding: "5px 13px", borderRadius: 20 }}>{cfg.label}</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>{live.ref}</span>
            <Button onClick={() => setDeletePrompt(true)} variant="tertiary" size="md" iconLeft={Trash2}>
              Delete Order
            </Button>
          </div>
        </div>

        {/* Hero */}
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 24 }}>
          <div style={{ minWidth: 260 }}>
            <h2 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, margin: "0 0 8px" }}>{live.customer}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const, marginBottom: 10 }}>
              {live.address && <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} color={T.antiqueGold} />{live.address}</span>}
              {live.phone && <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><Phone size={13} color={T.antiqueGold} />{live.phone}</span>}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}>
              <Package size={13} color={T.antiqueGold} />{live.sareeType}
            </div>
          </div>
          <div style={{ display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" as const }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>PROGRESS</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.goldLight }}>{producedCount}/{live.total} <span style={{ fontSize: 16 }}>({pct}%)</span></div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>DELIVERY DEADLINE</div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700 }}>{live.due}</div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>OUTSTANDING</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: balance > 0 ? "#F87171" : T.goldLight }}>{balance > 0 ? inr(balance) : <Money value={rupees(0)} />}</div>
            </div>
          </div>
        </div>

        {/* Tally strip */}
        <div style={{ marginBottom: 24, background: live.tallied ? T.greenBg : "rgba(200,155,71,0.10)", border: `1px solid ${live.tallied ? "rgba(30,102,64,0.22)" : T.borderGold}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ClipboardCheck size={20} color={live.tallied ? T.green : "#8B6018"} />
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: live.tallied ? T.green : "#8B6018" }}>
                {live.tallied ? "Sarees Tallied" : "Sarees Not Yet Tallied"}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                {live.tallied
                  ? `Verified against the physical count by ${live.talliedBy} on ${live.talliedDate}`
                  : "Count the physical sarees for this order against the list below, then mark it tallied."}
              </div>
            </div>
          </div>
          {!live.tallied && (
            <Button onClick={() => setTallyPrompt(true)} variant="primary" size="md" iconLeft={CheckCircle2}>
              Mark as Tallied
            </Button>
          )}
        </div>

        {/* Weight & material tally */}
        <div style={{ marginBottom: 24, background: "#FFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 16, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Scale size={18} color={T.royalBurgundy} />
            <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Weight & Material Tally</span>
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 16 }}>
            {weightTally.rate
              ? `${weightTally.weighedCount} of ${live.total} sarees weighed so far, against the ${weightTally.rate.code} standard (${weightTally.rate.stdWeight}g/saree).`
              : `${weightTally.weighedCount} of ${live.total} sarees weighed so far — no rate card found for "${live.sareeType}", so expected figures can't be computed.`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[
              { label: "Total Weight", actual: weightTally.actualWeight, expected: weightTally.expectedWeight, unit: "g" },
              { label: "Warp", actual: weightTally.warpG, expected: weightTally.expectedWarpG, unit: "g" },
              { label: "Resham", actual: weightTally.reshamG, expected: weightTally.expectedReshamG, unit: "g" },
              { label: "Jari", actual: weightTally.jariReels, expected: weightTally.expectedJariReels, unit: "reels" },
            ].map(m => {
              // Only flag a shortfall once every saree has actually been
              // weighed — a partial tally is expected to read low and isn't a
              // discrepancy worth calling out yet.
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

          <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "18px 0 14px" }} />

          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>
            Per-Saree Tally ({tallyItems.filter(i => i.tallied).length} / {tallyItems.length} tallied)
          </div>
          <SareeWeightTallyList
            items={tallyItems}
            getSareeTypeByCode={getSareeTypeByCode}
            onToggleTally={handleToggleSareeTally}
            busyKey={tallyBusyKey}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${T.borderDef}`, marginBottom: 28 }}>
          {tabs.map(t => (
            <div key={t.key} style={{ padding: "14px 22px", fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe, borderRadius: 0, borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", marginBottom: -2 }}>
              <Button onClick={() => setTab(t.key)} variant="link" size="md">
                {t.label}
              </Button>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {tab === "overview" && (
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
            )}

            {tab === "sarees" && (
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
            )}

            {tab === "payments" && (
              <BulkOrderPaymentsTab
                amountDue={amountDue}
                amountPaid={amountPaid}
                balance={balance}
                payments={payments}
                matchedInvoice={matchedInvoice}
                inr={inr}
              />
            )}

            {tab === "quotations" && (
              <div>
                {linkedQuotations.length === 0 ? (
                  <div style={{ ...card, textAlign: "center" as const, padding: "48px 24px" }}>
                    <FileText size={36} color={T.taupe} style={{ marginBottom: 12 }} />
                    <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No quotations have been raised against this bulk order yet.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {linkedQuotations.map(q => {
                      const qCfg = QUOTE_STATUS_CFG[q.status];
                      const qDispatch = dispatches.find(d => d.quotationRef === q.quotationNumber);
                      return (
                        <div key={q.id} style={card}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" as const, gap: 10 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{q.quotationNumber}</span>
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const, background: qCfg.bg, color: qCfg.color, padding: "3px 9px", borderRadius: 20 }}>{q.status.replace(/-/g, " ")}</span>
                              </div>
                              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{q.quotationDate} · {q.sarees.length} saree{q.sarees.length === 1 ? "" : "s"} · {q.firmName || "—"}</div>
                            </div>
                            <div style={{ textAlign: "right" as const }}>
                              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{inr(q.grandTotal)}</div>
                              {q.applyGst && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>incl. {q.gstPct}% GST</div>}
                            </div>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: qDispatch ? 14 : 0 }}>
                            {q.sarees.map(s => (
                              <span key={s.sareeId} style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 8px", borderRadius: 6 }}>{s.sareeId}</span>
                            ))}
                          </div>

                          {qDispatch ? (
                            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10 }}>
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
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

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
