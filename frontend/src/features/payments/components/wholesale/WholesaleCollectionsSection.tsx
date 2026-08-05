import React, { useEffect, useState } from "react";
import { AlignJustify, BadgeCheck, CircleAlert, Download, LayoutGrid, LayoutList, Receipt, Search, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { invoicesApi, BackendInvoice } from "../../../../shared/api/invoices";
import { EASE, F, T, useBulkOrders, BulkOrder, useFirms, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
import { Invoice } from "../../types";
import { AnimCount, FadeUp } from "../common/motion";
import { ActionModal, DropBtn } from "../common/primitives";
import { CustomerCard } from "./CustomerCard";
import { PaymentRemindersModal } from "./PaymentRemindersModal";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { ViewInvoiceModal } from "./ViewInvoiceModal";
import { WholesaleTableView } from "./WholesaleTableView";

const INVOICES_QUERY_KEY = ["invoices"] as const;

function backendStatusToFrontend(status: BackendInvoice["status"]): Invoice["status"] {
  if (status === "PAID") return "Paid";
  if (status === "PARTIAL") return "Partial";
  if (status === "OVERDUE") return "Overdue";
  return "Pending";
}

function backendInvoiceToFrontend(inv: BackendInvoice): Invoice {
  return {
    id: inv.id,
    customer: inv.customer?.name ?? "Unknown Customer",
    city: inv.customer?.city ?? "—",
    invoiceDate: new Date(inv.invoiceDate).toLocaleDateString("en-IN"),
    dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "—",
    total: Number(inv.total),
    paid: Number(inv.paid),
    status: backendStatusToFrontend(inv.status),
    dispatchId: inv.dispatchId,
    payments: inv.payments.map(p => ({
      amount: Number(p.amount),
      date: new Date(p.date).toLocaleDateString("en-IN"),
      utr: p.utr ?? "",
      method: p.method ?? "",
    })),
  };
}

export function WholesaleCollectionsSection() {
  const { dispatches } = useFinishing();
  const { bulkOrders } = useBulkOrders();
  const { addIncomeEntry } = useFirms();
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: async () => (await invoicesApi.list()).items.map(backendInvoiceToFrontend),
  });
  const [view, setView] = useState<"card" | "list" | "table">("card");
  const [search, setSearch] = useState("");

  const [downloadModal, setDownloadModal] = useState(false);
  const [remindersModal, setRemindersModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordPayment, setRecordPayment] = useState<Invoice | null>(null);

  const [filterState, setFilterState] = useState("All States");
  const [filterCust, setFilterCust] = useState("All Customers");
  const [filterType, setFilterType] = useState("All Invoice Types");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const createInvoiceMutation = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (err) => {
      console.error("Failed to create invoice for dispatch:", err);
    },
  });

  // A wholesale dispatch with an invoiceNumber means an invoice should exist
  // for it. Invoice.dispatchId is a real FK back to DispatchRecord.id, so we
  // can reliably tell whether a given dispatch already has an invoice
  // instead of guessing from matching totals.
  useEffect(() => {
    dispatches.forEach(d => {
      if (d.type !== "wholesale" || !d.invoiceNumber || !d.customerId) return;
      const total = d.grandTotal || d.totalAmount || 0;
      const alreadyInvoiced = invoices.some(i => i.dispatchId === d.id);
      if (!alreadyInvoiced && !createInvoiceMutation.isPending) {
        createInvoiceMutation.mutate({
          customerId: d.customerId,
          dueDate: d.paymentDueDate,
          dispatchId: d.id,
          total,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the dispatch list itself changes
  }, [dispatches]);

  // Resolve the BulkOrder tied to an invoice via its dispatch's own
  // bulkOrderRef, rather than parsing numeric suffixes off id strings.
  const matchBulkOrder = (invId: string): BulkOrder | undefined => {
    const inv = invoices.find(i => i.id === invId);
    if (!inv?.dispatchId) return undefined;
    const dispatch = dispatches.find(d => d.id === inv.dispatchId);
    if (!dispatch?.bulkOrderRef) return undefined;
    return bulkOrders.find(o => o.ref === dispatch.bulkOrderRef);
  };

  const recordPaymentMutation = useMutation({
    mutationFn: (args: { id: string; amount: number; utr: string; method: string; firmId: string }) =>
      invoicesApi.recordPayment(args.id, { amount: args.amount, utr: args.utr || undefined, method: args.method || undefined, firmId: args.firmId || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (err) => {
      console.error("Failed to record invoice payment:", err);
      toast.error("Failed to record payment");
    },
  });

  const handleSavePayment = (amount: number, firmId: string, utr: string, date: string, method: string) => {
    if (!recordPayment) return;
    recordPaymentMutation.mutate({ id: recordPayment.id, amount, utr, method, firmId });
    if (firmId) {
      addIncomeEntry(firmId, { description: `Wholesale payment — ${recordPayment.customer} (${recordPayment.id})`, amount, date, category: "Wholesale Sale" });
    }
    toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded for ${recordPayment.customer}`);
    setRecordPayment(null);
  };

  const overdueInvs = invoices.filter(i => i.status === "Overdue");
  const overdueTotal = overdueInvs.reduce((s, i) => s + (i.total - i.paid), 0);

  // Real aggregates from the invoices actually fetched — the underlying
  // Invoice model has no separate "collected this week" concept, so these
  // are all-time totals rather than the fixed calendar windows the old
  // mock numbers implied.
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.total - i.paid), 0);
  const totalCollected = invoices.reduce((s, i) => s + i.paid, 0);
  const formatRupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === "All States" || inv.city === filterState;
    const matchDate = matchesDateFilter(inv.invoiceDate, dateFilter);
    return matchSearch && matchState && matchDate;
  });

  const viewOptions = [
    { key: "card",  Icon: LayoutGrid,   label: "Card View"  },
    { key: "list",  Icon: LayoutList,   label: "List View"  },
    { key: "table", Icon: AlignJustify, label: "Table View" },
  ] as const;

  return (
    <div id="pay-wholesale" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>
                Wholesale Customer Collections
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 0 16px" }}>
              Track all outstanding and collected payments from wholesale customers.
            </p>
          </div>
          <DownloadGate>
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => setDownloadModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
              <Download size={15} />Download Collections Report
            </motion.button>
          </DownloadGate>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Receipt size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Invoiced",
              value: formatRupees(totalInvoiced),
              sub: "Across all wholesale customers",
              hi: false, crimson: false,
            },
            {
              icon: <CircleAlert size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Total Outstanding",
              value: formatRupees(totalOutstanding),
              sub: "Yet to be collected",
              hi: false, crimson: true,
            },
            {
              icon: <TrendingUp size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Overdue",
              value: formatRupees(overdueTotal),
              sub: `${overdueInvs.length} invoice${overdueInvs.length !== 1 ? "s" : ""} overdue`,
              hi: false, crimson: true,
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Total Collected",
              value: formatRupees(totalCollected),
              sub: "Payments received this month",
              hi: true, crimson: false,
            },
          ].map((s: any, i) => (
            <div key={i} style={{ background: s.hi ? "linear-gradient(135deg,rgba(200,155,71,0.14),rgba(200,155,71,0.04))" : "#FFFFFF", borderRadius: 14, border: `1px solid ${s.hi ? T.borderGold : T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
              {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: s.hi ? T.antiqueGold : T.taupe, lineHeight: 1.35, paddingTop: 2 }}>{s.label}</div>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.hi ? T.antiqueGold : s.crimson ? T.crimson : s.green ? T.green : T.luxuryBrown, lineHeight: 1 }}>
                <AnimCount raw={s.value} />
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(200,155,71,0.07)", border: "1px solid rgba(200,155,71,0.25)", borderLeft: `4px solid ${T.antiqueGold}`, borderRadius: 10, padding: "12px 20px", marginBottom: 14 }}>
          <CircleAlert size={16} style={{ color: T.antiqueGold, flexShrink: 0 }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018", lineHeight: 1.55 }}>
            <strong>Payment alert rule:</strong> Days 1–44 = Awaiting Payment (within terms). Day 45+ = ⚠ Follow Up Now. Day 60+ = 🔴 Overdue — Immediate Action Needed.
          </span>
        </div>

        {overdueInvs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.22)", borderLeft: `4px solid ${T.crimson}`, borderRadius: 10, padding: "14px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CircleAlert size={18} style={{ color: T.crimson, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.crimson }}>
                {overdueInvs.length} invoices are overdue (60+ days) — Total overdue amount:{" "}
                <span style={{ fontFamily: F.mono }}>₹{overdueTotal.toLocaleString("en-IN")}</span>
              </span>
            </div>
            <button onClick={() => setRemindersModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: T.crimson, border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer", flexShrink: 0 }}>
              Send Reminders
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <motion.button key={key} onClick={() => setView(key as any)}
                animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}>
                <Icon size={13} />{label}
              </motion.button>
            ))}
          </div>
          <DropBtn value={filterState} options={["All States", "Varanasi", "Surat", "Mumbai", "Hyderabad", "Chennai", "Bengaluru"]} onChange={setFilterState} />
          <DropBtn value={filterCust} options={["All Customers", "Lakshmi Silks", "Padmavathi Textiles", "Vijaya Silk House", "Narayana Silk Emporium", "Meenakshi Silks"]} onChange={setFilterCust} />
          <DropBtn value={filterType} options={["All Invoice Types", "Wholesale", "Retail", "Export"]} onChange={setFilterType} />
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice or customer..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32, alignItems: "stretch" }}>
            {filtered.map((inv, i) => {
              const matchingOrder = matchBulkOrder(inv.id);
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                  <CustomerCard inv={inv} onViewInvoice={() => setViewInvoice(inv)} onRecordPayment={() => setRecordPayment(inv)} bulkOrderRef={matchingOrder?.ref} bulkOrderData={matchingOrder} />
                </motion.div>
              );
            })}
          </div>
        )}

        {(view === "list" || view === "table") && (
          <WholesaleTableView
            view={view}
            filtered={filtered}
            setViewInvoice={setViewInvoice}
            setRecordPayment={setRecordPayment}
          />
        )}

        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Collections Report" desc="Generate and download the wholesale customer collections report." actionLabel="Download" icon={Download} />
        <PaymentRemindersModal open={remindersModal} onClose={() => setRemindersModal(false)} overdueInvoices={overdueInvs} />
        <AnimatePresence>
          {viewInvoice && <ViewInvoiceModal inv={viewInvoice} bulkOrderData={matchBulkOrder(viewInvoice.id)} onClose={() => setViewInvoice(null)} />}
          {recordPayment && <RecordPaymentModal inv={recordPayment} onClose={() => setRecordPayment(null)} onSave={handleSavePayment} />}
        </AnimatePresence>
      </FadeUp>
    </div>
  );
}
