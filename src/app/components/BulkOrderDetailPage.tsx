import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, MapPin, Phone, Package, IndianRupee, AlertTriangle,
  CheckCircle2, Search, Truck, FileText, X, ClipboardCheck,
  Send,
} from "lucide-react";
import type { BulkOrder } from "./BulkOrderContext";
import { useBulkOrders } from "./BulkOrderContext";
import { useFinishing, DispatchRecord, Quotation } from "./FinishingContext";
import { useBatches } from "./BatchContext";
import { useFirms } from "./FirmsContext";
import { INVOICES } from "./PaymentsPage";
import { resolveBulkOrderRef, resolveOrderMoney } from "./BulkOrderLinking";

const T = {
  silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B", darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314", warmCream: "#F5E8D0",
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

/** A saree linked to this bulk order, enriched with batch / dispatch / quotation info. */
interface LinkedSaree {
  id: string;
  designCode: string;
  sareeType: string;
  sareeTypeCode?: string;
  weaverName: string;
  batchId?: string;
  status: "QC Passed" | "Finishing complete" | "Dispatched" | "Damaged — Review Needed";
  date: string;
  quotationRef?: string;
  dispatch?: DispatchRecord;
}

function StatusPill({ status }: { status: LinkedSaree["status"] }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    "QC Passed": { bg: "rgba(200,155,71,0.14)", color: "#8B6018" },
    "Finishing complete": { bg: T.greenBg, color: T.greenMid },
    "Dispatched": { bg: "rgba(110,15,45,0.08)", color: T.royalBurgundy },
    "Damaged — Review Needed": { bg: T.crimsonBg, color: T.crimson },
  };
  const c = cfg[status] ?? cfg["QC Passed"];
  return <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, background: c.bg, color: c.color, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" as const }}>{status}</span>;
}

const QUOTE_STATUS_CFG: Record<Quotation["status"], { bg: string; color: string }> = {
  raised: { bg: "rgba(200,155,71,0.14)", color: "#8B6018" },
  "in-finishing": { bg: "rgba(110,15,45,0.08)", color: T.royalBurgundy },
  "partially-received": { bg: "rgba(200,155,71,0.14)", color: "#8B6018" },
  received: { bg: T.greenBg, color: T.greenMid },
  dispatched: { bg: T.greenBg, color: T.greenMid },
};

// ── Dispatch detail slide-over — the exact transport/receipt fields captured
// in Inventory's dispatch flow, shown per saree or per quotation. ──────────────
function DispatchDetailPanel({ dispatch, onClose }: { dispatch: DispatchRecord; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Dispatch Type", dispatch.type === "wholesale" ? "Wholesale" : "To Shop"],
    ["Dispatch Date", dispatch.dispatchDate || "—"],
    ["LR Number", dispatch.lrNumber || "—"],
    ["Transport Company", dispatch.transportCompany || "—"],
    ["Vehicle Number", dispatch.vehicleNumber || "—"],
    ["Driver", dispatch.driverName || "—"],
    ["Invoice Number", dispatch.invoiceNumber || "—"],
    ["Invoice Date", dispatch.invoiceDate || "—"],
    ["Firm", dispatch.firmName || "—"],
    ["Customer", dispatch.customerName || "—"],
    ["Total Amount", dispatch.totalAmount ? `₹${dispatch.totalAmount.toLocaleString("en-IN")}` : "—"],
    ["Grand Total", dispatch.grandTotal ? `₹${dispatch.grandTotal.toLocaleString("en-IN")}` : "—"],
    ["Expected Delivery", dispatch.expectedDelivery || "—"],
    ["Payment Due Date", dispatch.paymentDueDate || "—"],
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,10,20,0.50)", backdropFilter: "blur(3px)" }} />
      <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.24 }}
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: 420, maxWidth: "92vw", height: "100%", background: "#FFF", boxShadow: "-16px 0 60px rgba(0,0,0,0.20)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Truck size={18} color={T.antiqueGold} />
            <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: "#FFF" }}>Dispatch Details</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.14)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#FFF" }}><X size={14} /></button>
        </div>
        {(dispatch.pendingTransport || dispatch.pendingReceipt) && (
          <div style={{ margin: "16px 20px 0", background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: "#8B6018", display: "flex", gap: 8 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> Some details are still pending completion from Dispatch History.
          </div>
        )}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, flexShrink: 0 }}>{k}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown, textAlign: "right" as const, wordBreak: "break-word" as const }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Sarees on this dispatch ({dispatch.sareeIds.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {dispatch.sareeIds.map(id => (
                <span key={id} style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 8px", borderRadius: 6 }}>{id}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function BulkOrderDetailPage({ order, onBack, initialTab = "overview" }: {
  order: BulkOrder; onBack: () => void; initialTab?: "overview" | "sarees" | "payments" | "quotations";
}) {
  const { bulkOrders, tallyOrder } = useBulkOrders();
  const live = bulkOrders.find(o => o.ref === order.ref) ?? order;
  const { readySarees, returns, dispatches, quotations } = useFinishing();
  const { batches } = useBatches();
  const { firms } = useFirms();

  const [tab, setTab] = useState<"overview" | "sarees" | "payments" | "quotations">(initialTab);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [dispatchFilter, setDispatchFilter] = useState("All");
  const [dispatchPanel, setDispatchPanel] = useState<DispatchRecord | null>(null);
  const [tallyPrompt, setTallyPrompt] = useState(false);
  const [tallyName, setTallyName] = useState("");

  const cfg = ORDER_STATUS_CFG[live.status];
  const pct = live.total > 0 ? Math.round((live.done / live.total) * 100) : 0;

  // Quotations raised against this order, whether or not they've reached finishing yet.
  const linkedQuotations = useMemo(
    () => quotations.filter(q => q.bulkOrderRef === live.ref),
    [quotations, live.ref]
  );

  const findDispatchFor = (sareeId: string) => dispatches.find(d => d.sareeIds.includes(sareeId));

  // Every saree tied to this order — from readySarees + returns matched by design/type
  // (same heuristic Inventory uses), plus anything explicitly on a linked quotation.
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

    // Quotation sarees still awaiting finishing won't appear in readySarees/returns
    // yet, but they're already committed to this order.
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

  const filteredSarees = linkedSarees.filter(s => {
    const q = search.toLowerCase();
    const mSearch = !q || s.id.toLowerCase().includes(q) || s.designCode.toLowerCase().includes(q) || s.weaverName.toLowerCase().includes(q);
    const mStatus = statusFilter === "All" || s.status === statusFilter;
    const mBatch = batchFilter === "All" || s.batchId === batchFilter;
    const mDispatch = dispatchFilter === "All" || (dispatchFilter === "Dispatched" ? !!s.dispatch : !s.dispatch);
    return mSearch && mStatus && mBatch && mDispatch;
  });

  const dispatchedCount = linkedSarees.filter(s => s.dispatch).length;
  const damagedCount = linkedSarees.filter(s => s.status === "Damaged — Review Needed").length;

  // Payments — resolved through the shared helper so the All Orders page and
  // this page always report the same figures for an order.
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
              <Package size={13} color={T.antiqueGold} />{live.sareeType} · {live.design}
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
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Total Sarees", value: String(live.total) },
                    { label: "Completed", value: String(live.done), color: T.green },
                    { label: "Dispatched", value: String(dispatchedCount), color: T.royalBurgundy },
                    { label: "Damaged / Review", value: String(damagedCount), color: damagedCount ? T.crimson : T.green },
                  ].map(s => (
                    <div key={s.label} style={card}>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: (s as any).color || T.luxuryBrown }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={card}>
                    <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 14 }}>ORDER DETAILS</div>
                    {[
                      ["Design Code", live.design],
                      ["Saree Type", live.sareeType],
                      ["Created", live.createdDate || "—"],
                      ["Delivery Deadline", live.due],
                      ["GST Number", live.gstCode || "—"],
                      ["Linked Batches", (live.linkedBatches ?? live.batches ?? []).join(", ") || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.borderDef}` }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{k}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={card}>
                    <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 14 }}>DISPATCH & PAYMENT STATUS</div>
                    {[
                      ["Dispatch Status", live.dispatchStatus ?? "pending"],
                      ["Dispatch Date", live.dispatchDate || "—"],
                      ["Invoice Number", live.invoiceId || matchedInvoice?.id || "—"],
                      ["Payment Status", live.paymentStatus ?? "pending"],
                      ["Estimated Value", amountDue ? inr(amountDue) : "—"],
                      ["Amount Paid", amountPaid ? inr(amountPaid) : "₹0"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.borderDef}`, textTransform: k.includes("Status") ? "capitalize" as const : "none" as const }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{k}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const, textTransform: "capitalize" as const }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {(live.notes || live.instructions) && (
                  <div style={{ ...card, marginBottom: 16 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 10 }}>NOTES / INSTRUCTIONS</div>
                    <p style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65, margin: 0 }}>{live.notes || live.instructions}</p>
                  </div>
                )}

                {(live.shortage ?? 0) > 0 && (
                  <div style={{ background: T.crimsonBg, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                    <AlertTriangle size={18} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.crimson }}>Shortage of {live.shortage} sarees against this order — check material issue or reassign weavers.</span>
                  </div>
                )}
              </div>
            )}

            {tab === "sarees" && (
              <div>
                <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
                  <div style={{ position: "relative" as const, flex: "1 1 240px" }}>
                    <Search size={15} style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saree ID, design, or weaver…"
                      style={{ width: "100%", padding: "9px 12px 9px 36px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "9px 12px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer" }}>
                    {["All", "QC Passed", "Finishing complete", "Dispatched", "Damaged — Review Needed"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ padding: "9px 12px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer" }}>
                    {batchOptions.map(b => <option key={b} value={b}>{b === "All" ? "All Batches" : b}</option>)}
                  </select>
                  <select value={dispatchFilter} onChange={e => setDispatchFilter(e.target.value)} style={{ padding: "9px 12px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer" }}>
                    {["All", "Dispatched", "Not Dispatched"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: T.silkCream }}>
                        {["Saree ID", "Design / Type", "Weaver", "Batch", "Status", "Quotation", "Dispatch"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left" as const, letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSarees.map((s, i) => (
                        <tr key={s.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{s.id}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{s.sareeTypeCode || s.designCode} · {s.sareeType}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{s.weaverName}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11.5, color: T.luxuryBrown }}>{s.batchId || "—"}</td>
                          <td style={{ padding: "13px 16px" }}><StatusPill status={s.status} /></td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11, color: s.quotationRef ? T.royalBurgundy : T.taupe }}>{s.quotationRef || "—"}</td>
                          <td style={{ padding: "13px 16px" }}>
                            {s.dispatch ? (
                              <button onClick={() => setDispatchPanel(s.dispatch!)}
                                style={{ display: "flex", alignItems: "center", gap: 6, background: T.greenBg, border: "none", borderRadius: 8, padding: "6px 11px", fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: T.greenMid, cursor: "pointer" }}>
                                <Truck size={12} /> {s.dispatch.lrNumber || "View"}
                              </button>
                            ) : (
                              <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>Not dispatched</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredSarees.length === 0 && (
                        <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No sarees match this filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "payments" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
                  {[
                    { label: "Order Value", value: inr(amountDue), color: T.luxuryBrown },
                    { label: "Amount Paid", value: inr(amountPaid), color: T.greenMid },
                    { label: "Outstanding Balance", value: inr(balance), color: balance > 0 ? T.crimson : T.green },
                  ].map(s => (
                    <div key={s.label} style={card}>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderDef}`, fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>
                    Payment History {matchedInvoice ? `· ${matchedInvoice.id}` : ""}
                  </div>
                  {payments.length === 0 ? (
                    <div style={{ padding: "36px 20px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No payments recorded against this order yet.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: T.silkCream }}>
                          {["Amount", "Date", "Method", "UTR / Reference", "Firm"].map(h => (
                            <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left" as const, letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => (
                          <tr key={i} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                            <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.greenMid }}>{inr(p.amount)}</td>
                            <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{p.date}</td>
                            <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{p.method}</td>
                            <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{p.utr}</td>
                            <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.firmName || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
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
              <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Tallied by</label>
              <input value={tallyName} onChange={e => setTallyName(e.target.value)} placeholder="Your name"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14, marginBottom: 20, boxSizing: "border-box" as const }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setTallyPrompt(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 10, color: T.taupe, fontFamily: F.ui, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => { tallyOrder(live.ref, tallyName.trim() || "Admin"); setTallyPrompt(false); setTallyName(""); }}
                  style={{ flex: 1, padding: "11px 0", background: T.royalBurgundy, color: "#FFF", border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}>
                  Confirm Tally
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
