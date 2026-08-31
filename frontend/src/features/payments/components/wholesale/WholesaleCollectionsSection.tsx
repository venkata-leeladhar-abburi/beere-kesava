import React, { useEffect, useState } from "react";
import { AlignJustify, BadgeCheck, CircleAlert, Download, LayoutGrid, LayoutList, Receipt, TrendingUp, Building2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { ViewSelector } from "@/shared/ui/ViewSelector";
import { useFinishing } from "@/features/finishing";
import { invoicesApi, BackendInvoice } from "../../../../shared/api/invoices";
import { EASE, F, T } from "../../theme";
import { useBulkOrders } from "@/features/bulk-orders";
import { BulkOrder } from "@/features/production";
import { useFirms } from "@/features/firms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { Invoice } from "../../types";
import { AnimCount, FadeUp } from "../common/motion";
import { ActionModal, DropBtn, SectionCard } from "../common/primitives";
import { CustomerCard } from "./CustomerCard";
import { PaymentRemindersModal } from "./PaymentRemindersModal";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { ViewInvoiceModal } from "./ViewInvoiceModal";
import { WholesaleTableView } from "./WholesaleTableView";
import { Button, SearchInput } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { patchListItems } from "../../../../lib/cacheUpdates";

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
    code: inv.code ?? inv.id,
    customer: inv.customer?.name ?? "Unknown Customer",
    city: inv.customer?.city ?? "—",
    customerPhone: inv.customer?.phone ?? undefined,
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
      recordedBy: p.recordedBy ?? null,
    })),
  };
}

export function WholesaleCollectionsSection() {
  const { dispatches } = useFinishing();
  const { bulkOrders } = useBulkOrders();
  const { addIncomeEntry } = useFirms();
  const queryClient = useQueryClient();

  // Scoped to wholesale customers only — invoicesApi.list() returns every
  // invoice regardless of the customer's type, and retail invoices (raised
  // manually from RetailCollectionsSection) shouldn't mix into this section.
  const { data: invoices = [], isLoading: invoicesLoading, isError: invoicesError } = useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: async () =>
      (await invoicesApi.list()).items
        .filter(inv => inv.customer?.type === "WHOLESALE")
        .map(backendInvoiceToFrontend),
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
      // Refetch-only on purpose. A cached invoice row carries the customer's
      // city, which neither this response nor the dispatch that triggered the
      // creation knows — seeding would print "—" in that column and then
      // silently correct itself. This also runs from the effect below rather
      // than a user action, so nobody is waiting on the round trip.
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
    onSuccess: (updated) => {
      // Only the three fields a payment actually moves. A full remap through
      // backendInvoiceToFrontend would be wrong here: that mapper falls back to
      // "Unknown Customer"/"—" when `customer` is absent, and this endpoint
      // returns the invoice without its customer relation — so the row would
      // briefly relabel itself before the refetch put the name back.
      patchListItems<Invoice>(queryClient, INVOICES_QUERY_KEY, i => i.id === updated.id, {
        paid: Number(updated.paid),
        status: backendStatusToFrontend(updated.status),
        payments: updated.payments.map(pmt => ({
          amount: Number(pmt.amount),
          date: new Date(pmt.date).toLocaleDateString("en-IN"),
          utr: pmt.utr ?? "",
          method: pmt.method ?? "",
          recordedBy: pmt.recordedBy ?? null,
        })),
      });
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
      addIncomeEntry(firmId, { description: `Wholesale payment — ${recordPayment.customer} (${recordPayment.code ?? recordPayment.id})`, amount, date, category: "Wholesale Sale" });
    }
    toast.success(`Payment of ${formatMoney(rupees(amount))} recorded for ${recordPayment.customer}`);
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
  const formatRupees = (n: number) => formatMoney(rupees(n));

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === "All States" || inv.city === filterState;
    const matchDate = matchesDateFilter(inv.invoiceDate, dateFilter);
    return matchSearch && matchState && matchDate;
  });

  const pag = usePagination(filtered, 8);

  const viewOptions = [
    { key: "card",  Icon: LayoutGrid,   label: "Card View"  },
    { key: "list",  Icon: LayoutList,   label: "List View"  },
    { key: "table", Icon: AlignJustify, label: "Table View" },
  ] as const;

  return (
    <div id="pay-wholesale" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={Building2}
        title="Wholesale Customer Collections"
        subtitle="Track all outstanding and collected payments from wholesale customers."
        actions={
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download} onClick={() => setDownloadModal(true)}
              className="flex-shrink-0 rounded-[9px] border border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#3B2314]">
              Download Collections Report
            </Button>
          </DownloadGate>
        }
      >
        {invoicesLoading ? (
          <div style={{ marginTop: 24, marginBottom: 22, padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            Loading wholesale collections…
          </div>
        ) : invoicesError ? (
          <div style={{ marginTop: 24, marginBottom: 22, padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>
            Failed to load wholesale collections. Please retry.
          </div>
        ) : (
        <>
        {/* ── 4 stat cards — Premium Silk Saree Design ─────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 22, marginTop: 32, marginBottom: 28, alignItems: "stretch" }}>
          {[
            {
              icon: <Receipt size={22} color={T.antiqueGold} />,
              label: "Total Invoiced",
              value: formatRupees(totalInvoiced),
              sub: "Across all wholesale customers",
              gid: "ti",
            },
            {
              icon: <CircleAlert size={22} color={T.antiqueGold} />,
              label: "Total Outstanding",
              value: formatRupees(totalOutstanding),
              sub: "Yet to be collected",
              gid: "to",
            },
            {
              icon: <TrendingUp size={22} color={T.antiqueGold} />,
              label: "Overdue",
              value: formatRupees(overdueTotal),
              sub: `${overdueInvs.length} invoice${overdueInvs.length !== 1 ? "s" : ""} overdue`,
              gid: "ov",
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              label: "Total Collected",
              value: formatRupees(totalCollected),
              sub: "Payments received this month",
              gid: "tc",
            },
          ].map((s: { icon: React.ReactNode; label: string; value: string; sub: string; gid: string }) => (
            <div key={s.label} style={{ position: "relative", borderRadius: 14, border: `1px solid ${T.borderDef}`, background: "#FFFDF9", boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 6px 30px rgba(0,0,0,0.04)", overflow: "visible", display: "flex", flexDirection: "column" as const, alignItems: "center", minHeight: 236 }}>

              {/* ── Header — royal burgundy gradient ── */}
              <svg
                viewBox="0 0 300 90"
                preserveAspectRatio="none"
                style={{ width: "100%", height: 44, display: "block", borderRadius: "12px 12px 0 0", flexShrink: 0 }}
              >
                <defs>
                  <linearGradient id={`bk-head-${s.gid}`} x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#7A1232" />
                    <stop offset="40%" stopColor={T.royalBurgundy} />
                    <stop offset="100%" stopColor={T.deepWine} />
                  </linearGradient>
                  <linearGradient id={`bk-shim-${s.gid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(200,155,71,0)" />
                    <stop offset="50%" stopColor="rgba(200,155,71,0.08)" />
                    <stop offset="100%" stopColor="rgba(200,155,71,0)" />
                  </linearGradient>
                </defs>
                {/* Band shape: full top, deep elegant curve embracing the center badge */}
                <path
                  d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z"
                  fill={`url(#bk-head-${s.gid})`}
                />
                {/* Subtle silk shimmer */}
                <path
                  d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z"
                  fill={`url(#bk-shim-${s.gid})`}
                  opacity="0.4"
                />
                {/* Accent line along curved edge */}
                <path
                  d="M0,32 C70,36 110,85 150,88 C190,85 230,36 300,32"
                  fill="none"
                  stroke="rgba(200,155,71,0.30)"
                  strokeWidth="0.7"
                />
                {/* Tiny gold ornament at centre of curve */}
                <g transform="translate(150,86)" opacity="0.45">
                  <path d="M-6,0 C-8,-3 -11,-2 -10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M6,0 C8,-3 11,-2 10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament (a peacock-feather flourish), not a chart data mark */}
                  <rect x="-2" y="-2" width="4" height="4" rx="0.3" fill={T.antiqueGold} transform="rotate(45)" />
                </g>
              </svg>

              {/* ── Circular icon badge ── */}
              <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(155deg, #7A1232 0%, #6E0F2D 40%, #4A061B 100%)", border: `2.5px solid rgba(200,155,71,0.45)`, boxShadow: "0 4px 14px rgba(74,6,27,0.25), 0 0 0 3px rgba(255,253,249,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon}
                </div>
              </div>

              {/* ── Card body content ── */}
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, padding: "34px 20px 0", width: "100%" }}>
                {/* Label */}
                <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, letterSpacing: 1, textTransform: "uppercase" as const, textAlign: "center" as const, lineHeight: 1.45 }}>{s.label}</div>

                {/* Value */}
                <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginTop: 14, textAlign: "center" as const }}>
                  <AnimCount raw={s.value} />
                </div>

                {/* ── Thin divider with diamond ── */}
                <div style={{ width: "45%", display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0 12px" }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                  <div style={{ width: 5, height: 5, background: "rgba(110,15,45,0.22)", transform: "rotate(45deg)", flexShrink: 0, margin: "0 4px" }} />
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                </div>

                {/* Sub text */}
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, textAlign: "center" as const, lineHeight: 1.4 }}>{s.sub}</div>
              </div>

              {/* ── Footer strip — royal burgundy ── */}
              <div style={{ width: "100%", marginTop: "auto", position: "relative", overflow: "hidden", borderRadius: "0 0 12px 12px", height: 30, flexShrink: 0 }}>
                <svg
                  viewBox="0 0 300 40"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%", display: "block", position: "absolute", top: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id={`bk-foot-${s.gid}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.royalBurgundy} />
                      <stop offset="50%" stopColor="#5A0A22" />
                      <stop offset="100%" stopColor={T.deepWine} />
                    </linearGradient>
                  </defs>
                  {/* Footer band with smooth wave top edge */}
                  <path
                    d="M0,28 C60,28 100,10 150,8 C200,10 240,28 300,28 L300,40 L0,40 Z"
                    fill={`url(#bk-foot-${s.gid})`}
                  />
                </svg>
                {/* Elegant gold fleur-de-lis motif at centre */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyItems: "center", justifyContent: "center", paddingBottom: 0 }}>
                  <img
                    src="/assets/gold-fleur-footer.png"
                    alt="Ornament"
                    style={{ height: 26, maxWidth: "100%", objectFit: "contain", opacity: 0.9, transform: "translateY(1px)" }}
                  />
                </div>
              </div>
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
                <Money value={rupees(overdueTotal)} />
              </span>
            </div>
            <Button variant="danger" size="md" onClick={() => setRemindersModal(true)} className="flex-shrink-0 rounded-[8px]">
              Send Reminders
            </Button>
          </div>
        )}

        {/* Mobile Flipkart-style Filter Bar */}
        <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
          <MobileFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search invoice or customer..."
            filterGroups={[
              {
                id: "time",
                label: "Time Period",
                value: dateFilter.mode,
                defaultValue: "all",
                options: [
                  { value: "all", label: "All Time" },
                  { value: "day", label: "Specific Date" },
                  { value: "range", label: "Date Range" },
                  { value: "month", label: "Monthly" },
                  { value: "year", label: "Yearly" },
                ],
                onChange: (m: string) => {
                  const mode = m as DateFilterState["mode"];
                  if (mode === "day") setDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                  else if (mode === "month") setDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                  else if (mode === "year") setDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                  else setDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
                },
              },
              {
                id: "state",
                label: "Location",
                value: filterState,
                defaultValue: "All States",
                options: ["All States", "Varanasi", "Surat", "Mumbai", "Hyderabad", "Chennai", "Bengaluru"].map(s => ({ value: s, label: s })),
                onChange: setFilterState,
              },
              {
                id: "customer",
                label: "Customer",
                value: filterCust,
                defaultValue: "All Customers",
                options: ["All Customers", "Lakshmi Silks", "Padmavathi Textiles", "Vijaya Silk House", "Narayana Silk Emporium", "Meenakshi Silks"].map(c => ({ value: c, label: c })),
                onChange: setFilterCust,
              },
              {
                id: "type",
                label: "Invoice Type",
                value: filterType,
                defaultValue: "All Invoice Types",
                options: ["All Invoice Types", "Wholesale", "Retail", "Export"].map(t => ({ value: t, label: t })),
                onChange: setFilterType,
              },
            ]}
            onResetAll={() => {
              setSearch("");
              setFilterState("All States");
              setFilterCust("All Customers");
              setFilterType("All Invoice Types");
              setDateFilter(DEFAULT_DATE_FILTER);
            }}
          />
        </div>

        {/* Desktop Filter Bar & Controls */}
        <div className="hidden md:flex items-center gap-2.5 mb-5 flex-wrap">
          <ViewSelector options={viewOptions} activeView={view} onViewChange={setView} />
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          <DropBtn value={filterState} options={["All States", "Varanasi", "Surat", "Mumbai", "Hyderabad", "Chennai", "Bengaluru"]} onChange={setFilterState} />
          <DropBtn value={filterCust} options={["All Customers", "Lakshmi Silks", "Padmavathi Textiles", "Vijaya Silk House", "Narayana Silk Emporium", "Meenakshi Silks"]} onChange={setFilterCust} />
          <DropBtn value={filterType} options={["All Invoice Types", "Wholesale", "Retail", "Export"]} onChange={setFilterType} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput aria-label="Search invoice or customer" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice or customer..." size="sm" />
          </div>
        </div>

        {view === "card" && (
          <div data-pagination-target>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6 items-stretch">
              {pag.pageItems.map((inv, i) => {
                const matchingOrder = matchBulkOrder(inv.id);
                return (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                    <CustomerCard inv={inv} onViewInvoice={() => setViewInvoice(inv)} onRecordPayment={() => setRecordPayment(inv)} bulkOrderRef={matchingOrder?.ref} bulkOrderData={matchingOrder} />
                  </motion.div>
                );
              })}
            </div>
            <div className="mb-8">
              <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="invoices" />
            </div>
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
        </>
        )}

      </SectionCard>
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
