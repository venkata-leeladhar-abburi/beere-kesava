import React, { useMemo, useState } from "react";
import { AlignJustify, ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Download, Eye, History, LayoutGrid, LayoutList, Receipt, TrendingUp, X } from "lucide-react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { ViewSelector } from "@/shared/ui/ViewSelector";
import { EASE, F, T } from "../../theme";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { PayHistRecord } from "../../types";
import { FadeUp } from "../common/motion";
import { SectionCard } from "../common/primitives";
import { HIST_TYPE_CFG, HistoryCard, getHistTypeIcon } from "./HistoryCard";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { vendorsApi } from "../../../../shared/api/vendors";
import { suppliersApi } from "../../../../shared/api/suppliers";
import { weaversApi } from "../../../../shared/api/weavers";
import { vendorPaymentsApi, weaverPaymentsApi, supplierPaymentsApi, type BackendActorSummary } from "../../../../shared/api/payments";
import { invoicesApi } from "../../../../shared/api/invoices";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, exportTable, type ColumnDef } from "../../../../shared/ui/data";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill, EntityCode } from "@/shared/ui/domain";
import type { PaymentStatus } from "@/lib/domain/status";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";

function formatHistDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Real accountant/staff attribution when the record has it; "—" for record
// types (e.g. invoice collections) that don't carry an actor yet, rather
// than falsely attributing every entry to "Admin".
function formatRecordedBy(actor?: BackendActorSummary | null): string {
  return actor ? `${actor.firstName} ${actor.lastName}`.trim() : "—";
}

// PayHistRecord.status ("Paid"/"Partial"/"Pending", payments/types.ts) is a
// genuine PAYMENT_STATUS lifecycle value, but the field itself stays as-is
// because HistoryCard.tsx (out of scope here) keys its own HIST_STATUS_CFG
// off those exact literals — this only translates to the canonical taxonomy
// key at this component's own render boundary.
function payHistStatusKey(status: PayHistRecord["status"]): PaymentStatus {
  return status === "Paid" ? "paid" : status === "Partial" ? "partial" : "unpaid";
}

export function PaymentHistorySection() {
  const [dateFilter,   setDateFilter]   = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [typeFilter,   setTypeFilter]   = useState("All Payment Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [search,       setSearch]       = useState("");
  const [view,         setView]         = useState<"card" | "list" | "table">("card");
  const [page,         setPage]         = useState(1);
  const [viewRecord,   setViewRecord]   = useState<PayHistRecord | null>(null);
  const PER_PAGE = 10;

  const { data: vendorsRes } = useQuery({ queryKey: ["history-vendors"], queryFn: () => vendorsApi.list() });
  const { data: suppliersRes } = useQuery({ queryKey: ["history-suppliers"], queryFn: () => suppliersApi.list() });
  const { data: weaversRes } = useQuery({ queryKey: ["history-weavers"], queryFn: () => weaversApi.list() });
  const { data: vendorPaymentsRes, isLoading: vendorPayLoading, isError: vendorPayError, refetch: refetchVendorPay } = useQuery({
    queryKey: ["history-vendor-payments"],
    queryFn: () => vendorPaymentsApi.list(),
  });
  const { data: supplierPaymentsRes, isLoading: supplierPayLoading, isError: supplierPayError, refetch: refetchSupplierPay } = useQuery({
    queryKey: ["history-supplier-payments"],
    queryFn: () => supplierPaymentsApi.list(),
  });
  const { data: weaverPaymentsRes, isLoading: weaverPayLoading, isError: weaverPayError, refetch: refetchWeaverPay } = useQuery({
    queryKey: ["history-weaver-payments"],
    queryFn: () => weaverPaymentsApi.list(),
  });
  const { data: invoicesRes, isLoading: invoicesLoading, isError: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ["history-invoices"],
    queryFn: () => invoicesApi.list(),
  });

  const isLoading = vendorPayLoading || weaverPayLoading || supplierPayLoading || invoicesLoading;
  const isError = vendorPayError || weaverPayError || supplierPayError || invoicesError;
  const refetchAll = () => {
    void refetchVendorPay();
    void refetchSupplierPay();
    void refetchWeaverPay();
    void refetchInvoices();
  };

  const PAY_HISTORY_LIVE: PayHistRecord[] = useMemo(() => {
    const vendorNameById = new Map((vendorsRes?.items ?? []).map(v => [v.id, v.name]));
    const supplierNameById = new Map((suppliersRes?.items ?? []).map(s => [s.id, s.name]));
    const weaverNameById = new Map((weaversRes?.items ?? []).map(w => [w.id, w.name]));

    const vendorRows: PayHistRecord[] = (vendorPaymentsRes?.items ?? []).map(p => ({
      id: `VP-${p.id}`,
      date: formatHistDate(p.date),
      type: "Vendor Payment",
      party: vendorNameById.get(p.vendorId) ?? p.vendorId,
      refNo: p.id,
      description: "Vendor payment",
      amount: Number(p.amount),
      status: "Paid",
      mode: p.method ?? "—",
      utr: p.utr ?? undefined,
      recordedBy: formatRecordedBy(p.recordedBy),
    }));

    const supplierRows: PayHistRecord[] = (supplierPaymentsRes?.items ?? []).map(p => ({
      id: `SUP-${p.id}`,
      date: formatHistDate(p.date),
      type: "Supplier Payment",
      party: supplierNameById.get(p.supplierId) ?? p.supplierId,
      refNo: p.id,
      description: "Supplier payment",
      amount: Number(p.amount),
      status: "Paid",
      mode: p.method ?? "—",
      utr: p.utr ?? undefined,
      recordedBy: formatRecordedBy(p.recordedBy),
    }));

    const weaverRows: PayHistRecord[] = (weaverPaymentsRes?.items ?? []).map(p => ({
      id: `WP-${p.id}`,
      date: formatHistDate(p.paymentDate),
      type: "Weaver Payment",
      party: weaverNameById.get(p.weaverId) ?? p.weaverId,
      refNo: p.id,
      description: "Making charges",
      amount: Number(p.amountPaid),
      status: "Paid",
      mode: "Bank Transfer",
      utr: p.utrNumber ?? undefined,
      recordedBy: formatRecordedBy(p.recordedBy),
      batchNo: p.batchNo ?? undefined,
      loomNumber: p.loomNumber ?? undefined,
      noOfSarees: p.noOfSarees ?? undefined,
      deduction: p.deduction ? Number(p.deduction) : undefined,
    }));

    const customerRows: PayHistRecord[] = (invoicesRes?.items ?? []).flatMap(inv =>
      inv.payments.map(pay => ({
        id: `INV-${pay.id}`,
        date: formatHistDate(pay.date),
        type: "Customer Receipt" as const,
        party: inv.customer?.name ?? "Unknown Customer",
        refNo: inv.code ?? inv.id,
        description: "Invoice collection",
        invoicePO: inv.code ?? inv.id,
        amount: Number(pay.amount),
        status: inv.status === "PAID" ? ("Paid" as const) : inv.status === "PARTIAL" ? ("Partial" as const) : ("Pending" as const),
        mode: pay.method ?? "Bank Transfer",
        utr: pay.utr ?? undefined,
        recordedBy: formatRecordedBy(pay.recordedBy),
      })),
    );

    return [...vendorRows, ...supplierRows, ...weaverRows, ...customerRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [vendorPaymentsRes, supplierPaymentsRes, weaverPaymentsRes, invoicesRes, vendorsRes, suppliersRes, weaversRes]);

  const filtered = PAY_HISTORY_LIVE.filter(r => {
    if (typeFilter   !== "All Payment Types" && r.type   !== typeFilter)   return false;
    if (statusFilter !== "All Statuses"      && r.status !== statusFilter) return false;
    if (!matchesDateFilter(r.date, dateFilter)) return false;
    if (search && !r.party.toLowerCase().includes(search.toLowerCase()) &&
        !r.refNo.toLowerCase().includes(search.toLowerCase()) &&
        !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pag = usePagination(filtered, 8);

  const totalIn  = filtered.filter(r => r.type === "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalOut = filtered.filter(r => r.type !== "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalAmt = filtered.reduce((s, r) => s + r.amount, 0);
  const netFlow  = totalIn - totalOut;

  const clearFilters = () => { setTypeFilter("All Payment Types"); setStatusFilter("All Statuses"); setSearch(""); setDateFilter(DEFAULT_DATE_FILTER); };

  const tableColumns: ColumnDef<PayHistRecord>[] = [
    { id: "date", header: "Date", accessor: r => r.date, cell: (_v, r) => <div className="w-[120px] min-w-[120px] whitespace-nowrap font-semibold text-[#3B2314] text-[13px]">{r.date}</div> },
    {
      id: "type", header: "Payment Type", accessor: r => r.type,
      cell: (_v, r) => {
        const typeCfg = HIST_TYPE_CFG[r.type];
        return (
          <div className="w-[160px] min-w-[160px] whitespace-nowrap">
            <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color }}>{r.type}</span>
          </div>
        );
      },
    },
    { id: "party", header: "Party Name", priority: 1, accessor: r => r.party, cell: (_v, r) => <div className="w-[200px] min-w-[200px] whitespace-nowrap font-semibold text-[#3B2314] text-[14px]">{r.party}</div> },
    {
      id: "refNo", header: "Reference No", priority: 3, accessor: r => r.refNo,
      cell: (_v, r) => (
        <div className="w-[280px] min-w-[280px] whitespace-nowrap">
          <EntityCode type="payment" value={r.refNo} size="sm" className="whitespace-nowrap" />
        </div>
      ),
    },
    {
      id: "description", header: "Description", priority: 3, accessor: r => r.description,
      cell: (_v, r) => <div className="w-[220px] min-w-[220px] whitespace-nowrap text-[#8C7A6B] text-[13px] truncate">{r.description}</div>,
    },
    {
      id: "invoicePO", header: "Invoice / PO No", priority: 3, accessor: r => r.invoicePO,
      cell: (_v, r) => <div className="w-[180px] min-w-[180px] whitespace-nowrap text-[12px] text-[#8C7A6B]">{r.invoicePO ? r.invoicePO : "—"}</div>,
    },
    {
      id: "amount", header: "Amount", accessor: r => r.amount, align: "end",
      cell: (_v, r) => (
        <div className="w-[130px] min-w-[130px] whitespace-nowrap text-right font-bold text-[14px]" style={{ color: r.type === "Customer Receipt" ? T.green : T.crimson }}>
          {r.type !== "Customer Receipt" && "−"}<Money value={rupees(r.amount)} />
        </div>
      ),
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status", align: "center",
      cell: (_v, r) => <div className="w-[120px] min-w-[120px] whitespace-nowrap flex justify-center"><StatusPill taxonomy="payment" status={payHistStatusKey(r.status)} /></div>,
    },
    { id: "mode", header: "Payment Mode", priority: 3, accessor: r => r.mode, cell: (_v, r) => <div className="w-[130px] min-w-[130px] whitespace-nowrap text-[#8C7A6B] text-[13px]">{r.mode}</div> },
    {
      id: "utr", header: "UTR / Ref No", priority: 3, accessor: r => r.utr,
      cell: (_v, r) => <div className="w-[160px] min-w-[160px] whitespace-nowrap text-[12px]">{r.utr ? <span style={{ color: T.green }}>{r.utr}</span> : <span style={{ color: T.borderDef }}>—</span>}</div>,
    },
    { id: "recordedBy", header: "Recorded By", priority: 3, accessor: r => r.recordedBy, cell: (_v, r) => <div className="w-[140px] min-w-[140px] whitespace-nowrap text-[#8C7A6B] text-[13px]">{r.recordedBy}</div> },
    {
      id: "action", header: "Action", priority: 2, accessor: () => null, type: "actions", align: "center",
      cell: (_v, r) => (
        <div className="w-[100px] min-w-[100px] flex justify-center">
          <Button variant="secondary" size="sm" iconLeft={Eye} onClick={() => setViewRecord(r)} className="rounded-[8px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]">
            View
          </Button>
        </div>
      ),
    },
  ];

  const viewOptions = [
    { key: "card"  as const, Icon: LayoutGrid,   label: "Card View"  },
    { key: "list"  as const, Icon: LayoutList,   label: "List View"  },
    { key: "table" as const, Icon: AlignJustify, label: "Table View" },
  ];

  const HIST_STATS = [
    { icon: <ArrowDownCircle size={22} color={T.antiqueGold} />, label: "Total Collected", value: formatMoney(rupees(totalIn)),           sub: "Customer receipts · period",                  gid: "htc" },
    { icon: <ArrowUpCircle   size={22} color={T.antiqueGold} />, label: "Total Paid Out",  value: formatMoney(rupees(totalOut)),          sub: "Vendor & weaver payments",                    gid: "hpo" },
    { icon: <TrendingUp      size={22} color={T.antiqueGold} />, label: "Net Cash Flow",   value: formatMoney(rupees(Math.abs(netFlow))), sub: netFlow >= 0 ? "Positive flow" : "Net outflow", gid: "hnf" },
  ];

  return (
    <div id="pay-history" className="px-4 md:px-7 xl:px-10 pb-10 md:pb-12" style={{ paddingTop: 36, paddingBottom: 48 }}>
      <FadeUp>
      <SectionCard
        icon={History}
        title="Payment History"
        subtitle="Complete history of all payments made and received. Use filters to find specific transactions."
        actions={
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download}
              onClick={() => exportTable({ columns: tableColumns, rows: filtered, filename: "payment-history" })}
              className="flex-shrink-0 rounded-[9px] border border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#3B2314]">
              Download All Transactions
            </Button>
          </DownloadGate>
        }
      >

        {/* ── 3 Summary stat cards — Premium Silk Saree Design ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}>
          {HIST_STATS.map(s => (
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
                <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginTop: 14, textAlign: "center" as const }}>{s.value}</div>

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

        {/* ── Filter bar ──────────────────────────────────────── */}
        <div style={{ background: T.warmIvory, borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>

            {/* View Selector */}
            <ViewSelector options={viewOptions} activeView={view} onViewChange={setView} />

            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

            {/* Type dropdown */}
            <Select value={typeFilter} onValueChange={setTypeFilter} size="sm" containerClassName="w-auto shrink-0" className="w-[165px] font-semibold">
              {["All Payment Types","Vendor Payment","Weaver Payment","Supplier Payment","Customer Receipt"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </Select>

            {/* Status dropdown */}
            <Select value={statusFilter} onValueChange={setStatusFilter} size="sm" containerClassName="w-auto shrink-0" className="w-[130px] font-semibold">
              {["All Statuses","Paid","Partial","Pending"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </Select>

            {/* Search */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchInput aria-label="Search party, ref no, description" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search party, ref no, description..." size="sm" />
            </div>

            {/* Clear */}
            <Button variant="secondary" size="sm" iconLeft={X} onClick={clearFilters}
              className="whitespace-nowrap rounded-[8px] bg-[var(--surface-canvas)] text-[var(--text-tertiary)]">
              Clear
            </Button>
          </div>
        </div>

        {/* ── Loading / error states ──────────────────────────── */}
        {isLoading ? (
          <LoadingState variant="skeleton" rows={4} />
        ) : isError ? (
          <ErrorState error={undefined} onRetry={refetchAll} />
        ) : (
        <>
        {/* ── CARD VIEW ───────────────────────────────────────── */}
        {view === "card" && (
          <div data-pagination-target className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6 items-stretch">
              {pag.pageItems.map((r, i) => (
                <motion.div key={r.id} style={{ display: "flex", flexDirection: "column" }}
                  initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}>
                  <HistoryCard r={r} onView={() => setViewRecord(r)} />
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center" as const }}>
                  <Receipt size={40} color={T.borderDef} style={{ marginBottom: 12 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No transactions match your filters.</div>
                </div>
              )}
            </div>
            {filtered.length > 0 && (
              <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="transactions" />
            )}
          </div>
        )}

        {/* ── LIST VIEW ────────────────────────────────────────── */}
        {view === "list" && (
          <div data-pagination-target style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" as const }}>
                <Receipt size={40} color={T.borderDef} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No transactions match your filters.</div>
              </div>
            ) : (
              <div>
                {pag.pageItems.map((r, i) => {
                  const typeCfg = HIST_TYPE_CFG[r.type];
                  const { Icon: HistIcon, color: iconColor, iconBg } = getHistTypeIcon(r.type);
                  const isReceipt = r.type === "Customer Receipt";
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}
                      style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                        background: i % 2 === 0 ? "#FFFDF9" : T.silkCream,
                        borderBottom: `1px solid ${T.borderDef}`,
                        borderLeft: `4px solid ${typeCfg.border}`,
                      }}
                    >
                      {/* Icon */}
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: iconBg, border: `1px solid ${typeCfg.border}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <HistIcon size={18} color={iconColor} />
                      </div>

                      {/* Party + Type */}
                      <div style={{ flex: "0 0 200px" }}>
                        <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.party}</div>
                        <span style={{ display: "inline-block", marginTop: 3, padding: "2px 8px", borderRadius: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color }}>{r.type}</span>
                      </div>

                      {/* Description */}
                      <div style={{ flex: 1, fontFamily: F.ui, fontSize: 13, color: T.taupe, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {r.description}
                      </div>

                      {/* Ref + PO */}
                      <div style={{ flex: "0 0 130px" }}>
                        <div><EntityCode type="payment" value={r.refNo} size="sm" /></div>
                        {r.invoicePO && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{r.invoicePO}</div>}
                      </div>

                      {/* Date */}
                      <div style={{ flex: "0 0 100px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{r.date}</div>

                      {/* Amount */}
                      <div style={{ flex: "0 0 120px", textAlign: "right" as const }}>
                        <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: isReceipt ? T.green : T.crimson }}>
                          {isReceipt ? "+" : "−"}<Money value={rupees(r.amount)} />
                        </div>
                        {r.utr && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 2 }}>{r.utr}</div>}
                      </div>

                      {/* Status badge */}
                      <StatusPill taxonomy="payment" status={payHistStatusKey(r.status)} className="shrink-0" />

                      {/* Mode + Recorded */}
                      <div style={{ flex: "0 0 100px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                        <div>{r.mode}</div>
                        <div style={{ marginTop: 2, fontSize: 12 }}>{r.recordedBy}</div>
                      </div>

                      {/* View button */}
                      <IconButton icon={Eye} label="View" variant="secondary" size="sm" onClick={() => setViewRecord(r)} className="flex-shrink-0 rounded-[8px] text-[#6E0F2D]" />
                    </motion.div>
                  );
                })}
                <div style={{ padding: "14px 20px" }}>
                  <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="transactions" />
                </div>
              </div>
            )}
            {/* Summary footer */}
            {filtered.length > 0 && (
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmCream }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{filtered.length} transaction{filtered.length > 1 ? "s" : ""}</span>
                <div style={{ display: "flex", gap: 24 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 700 }}>+<Money value={rupees(totalIn)} /></span>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 700 }}>−<Money value={rupees(totalOut)} /></span>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: netFlow >= 0 ? T.green : T.crimson, fontWeight: 700, borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 24 }}>Net: {netFlow >= 0 ? "+" : "−"}<Money value={rupees(Math.abs(netFlow))} /></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ──────────────────────────────────────── */}
        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <DataTable responsive={false} columns={tableColumns} data={filtered} getRowId={r => r.id} emptyTitle="No transactions match your filters" pagination />
            {filtered.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #3B0818 0%, #5D1027 60%, #2A040E 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                padding: "16px 22px",
                borderTop: `1px solid ${T.borderDef}`,
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 800, color: "#FFFFFF", letterSpacing: "1.2px", textTransform: "uppercase" }}>
                    Totals For Selected Period
                  </span>
                  <div>
                    <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFFFF", background: "rgba(255,255,255,0.18)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.3)" }}>
                      {filtered.length} {filtered.length === 1 ? "row" : "rows"}
                    </span>
                  </div>
                </div>

                {/* Numbers stacked under each other — pure white text */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" }}>Inflows:</span>
                    <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}>
                      +<Money value={rupees(totalIn)} className="!text-white" />
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" }}>Outflows:</span>
                    <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}>
                      −<Money value={rupees(totalOut)} className="!text-white" />
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: 6, marginTop: 2 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: "#FFFFFF", textTransform: "uppercase" }}>Total Volume:</span>
                    <span style={{ fontFamily: F.display, fontSize: 19, fontWeight: 900, color: "#FFFFFF" }}>
                      <Money value={rupees(totalAmt)} className="!text-white" />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </>
        )}
      </SectionCard>
      </FadeUp>
      {viewRecord && <TransactionDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />}
    </div>
  );
}
