import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, MapPin, Phone, Package,
  CheckCircle2, FileText, ClipboardCheck,
  Send, ArrowRight, Truck,
} from "lucide-react";
import type { BulkOrder } from "../contexts/BulkOrderContext";
import { useBulkOrders } from "../contexts/BulkOrderContext";
import { useFinishing, DispatchRecord, Quotation } from "../../finishing/contexts/FinishingContext";
import { useBatches } from "../../production/contexts/BatchContext";
import { INVOICES } from "../../payments/data/invoices";
import { resolveBulkOrderRef, resolveOrderMoney } from "../utils/BulkOrderLinking";
import { DispatchDetailPanel } from "./DispatchDetailPanel";
import { BulkOrderSareesTab, LinkedSaree } from "./BulkOrderSareesTab";
import { BulkOrderOverviewTab, BulkOrderPaymentsTab } from "./BulkOrderOverviewPaymentsTabs";

const T = {
  silkCream: "#F7F2EA", royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B", darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314",
  taupe: "#8B7060", green: "#1E6640", greenBg: "rgba(30,102,64,0.09)",
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
  const { bulkOrders, tallyOrder } = useBulkOrders();
  const live = bulkOrders.find(o => o.ref === order.ref) ?? order;
  const { readySarees, returns, dispatches, quotations } = useFinishing();
  const { batches } = useBatches();

  const [tab, setTab] = useState<"overview" | "sarees" | "payments" | "quotations">(initialTab);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [dispatchFilter, setDispatchFilter] = useState("All");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [sareeTypeFilter, setSareeTypeFilter] = useState("All");
  const [dispatchPanel, setDispatchPanel] = useState<DispatchRecord | null>(null);
  const [tallyPrompt, setTallyPrompt] = useState(false);

  const cfg = ORDER_STATUS_CFG[live.status];
  const pct = live.total > 0 ? Math.round((live.done / live.total) * 100) : 0;

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
      const bId = batches.find(b => b.rows.some(row => row.sareeId === s.id))?.batchId;
      byId.set(s.id, {
        id: s.id, designCode: s.designCode, sareeType: s.sareeType, sareeTypeCode: s.sareeTypeCode,
        weaverName: s.weaverName, batchId: bId, status: "QC Passed", date: s.qcPassDate,
        quotationRef: quotationRefBySaree.get(s.id),
      });
    });

    returns.forEach(r => {
      const boRef = resolveBulkOrderRef(undefined, r.designCode, r.sareeType, bulkOrders);
      const isQuotationLinked = r.quotationRef && linkedQuotations.some(q => q.quotationNumber === r.quotationRef);
      if (boRef !== live.ref && !isQuotationLinked && !quotationRefBySaree.has(r.sareeId)) return;
      const bId = batches.find(b => b.rows.some(row => row.sareeId === r.sareeId))?.batchId;
      byId.set(r.sareeId, {
        id: r.sareeId, designCode: r.designCode, sareeType: r.sareeType, sareeTypeCode: r.sareeTypeCode,
        weaverName: r.weaverName, batchId: bId,
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

  const money = resolveOrderMoney(live, INVOICES);
  const { amountDue, amountPaid, balance, payments } = money;
  const matchedInvoice = money.invoiceId ? { id: money.invoiceId } : null;

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const card: React.CSSProperties = { background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" };
  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "sarees" as const, label: `Sarees (${linkedSarees.length})` },
    { key: "payments" as const, label: "Payments" },
    { key: "quotations" as const, label: `Quotations (${linkedQuotations.length})` },
  ];

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ padding: "40px 56px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ background: "transparent", border: `1px solid ${T.borderDef}`, padding: "10px 20px", borderRadius: 8, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <ArrowLeft size={14} /> Back to Bulk Orders
          </motion.button>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, padding: "5px 13px", borderRadius: 20 }}>{cfg.label}</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>{live.ref}</span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 24 }}>
          <div style={{ minWidth: 260 }}>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>{live.customer}</h2>
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
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>PROGRESS</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.goldLight }}>{live.done}/{live.total} <span style={{ fontSize: 16 }}>({pct}%)</span></div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>DELIVERY DEADLINE</div>
              <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700 }}>{live.due}</div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>OUTSTANDING</div>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: balance > 0 ? "#F87171" : T.goldLight }}>{balance > 0 ? inr(balance) : "₹0"}</div>
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
            <button onClick={() => setTallyPrompt(true)}
              style={{ padding: "10px 20px", background: T.royalBurgundy, color: "#FFF", border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} /> Mark as Tallied
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${T.borderDef}`, marginBottom: 28 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "14px 22px", fontFamily: F.ui, fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", marginBottom: -2, cursor: "pointer", transition: "all 0.2s" }}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {tab === "overview" && (
              <BulkOrderOverviewTab
                live={live}
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
                                <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, textTransform: "capitalize" as const, background: qCfg.bg, color: qCfg.color, padding: "3px 9px", borderRadius: 20 }}>{q.status.replace(/-/g, " ")}</span>
                              </div>
                              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{q.quotationDate} · {q.sarees.length} saree{q.sarees.length === 1 ? "" : "s"} · {q.firmName || "—"}</div>
                            </div>
                            <div style={{ textAlign: "right" as const }}>
                              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{inr(q.grandTotal)}</div>
                              {q.applyGst && <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>incl. {q.gstPct}% GST</div>}
                            </div>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: qDispatch ? 14 : 0 }}>
                            {q.sarees.map(s => (
                              <span key={s.sareeId} style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 8px", borderRadius: 6 }}>{s.sareeId}</span>
                            ))}
                          </div>

                          {qDispatch ? (
                            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Truck size={16} color={T.greenMid} />
                                <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>
                                  Dispatched {qDispatch.dispatchDate} · LR <strong>{qDispatch.lrNumber || "—"}</strong> · {qDispatch.transportCompany || "—"}
                                </span>
                              </div>
                              <button onClick={() => setDispatchPanel(qDispatch)}
                                style={{ background: T.greenBg, border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.greenMid, cursor: "pointer" }}>
                                View Full Dispatch Details
                              </button>
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

      <AnimatePresence>
        {tallyPrompt && (
          <div style={{ position: "fixed", inset: 0, zIndex: 950, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(30,10,20,0.55)", backdropFilter: "blur(4px)" }} onClick={() => setTallyPrompt(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 420, maxWidth: "92vw", background: "#FFF", borderRadius: 18, padding: 26, boxShadow: "0 30px 80px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <ClipboardCheck size={20} color={T.royalBurgundy} />
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>Tally this order</div>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
