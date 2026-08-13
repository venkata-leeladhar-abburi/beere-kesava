import React, { useMemo, useState } from "react";
import { AlignJustify, ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Download, Eye, History, LayoutGrid, LayoutList, Receipt, TrendingUp, X } from "lucide-react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { EASE, F, T, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
import { Invoice, PayHistRecord } from "../../types";
import { FadeUp } from "../common/motion";
import { SectionCard } from "../common/primitives";
import { HIST_TYPE_CFG, HistoryCard, getHistTypeIcon } from "./HistoryCard";
import { vendorsApi } from "../../../../shared/api/vendors";
import { suppliersApi } from "../../../../shared/api/suppliers";
import { weaversApi } from "../../../../shared/api/weavers";
import { vendorPaymentsApi, weaverPaymentsApi, supplierPaymentsApi } from "../../../../shared/api/payments";
import { invoicesApi } from "../../../../shared/api/invoices";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill } from "@/shared/ui/domain";
import type { PaymentStatus } from "@/lib/domain/status";

function formatHistDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
  const PER_PAGE = 10;

  const { data: vendorsRes } = useQuery({ queryKey: ["history-vendors"], queryFn: () => vendorsApi.list() });
  const { data: suppliersRes } = useQuery({ queryKey: ["history-suppliers"], queryFn: () => suppliersApi.list() });
  const { data: weaversRes } = useQuery({ queryKey: ["history-weavers"], queryFn: () => weaversApi.list() });
  const { data: vendorPaymentsRes, isLoading: vendorPayLoading, isError: vendorPayError } = useQuery({
    queryKey: ["history-vendor-payments"],
    queryFn: () => vendorPaymentsApi.list(),
  });
  const { data: supplierPaymentsRes, isLoading: supplierPayLoading, isError: supplierPayError } = useQuery({
    queryKey: ["history-supplier-payments"],
    queryFn: () => supplierPaymentsApi.list(),
  });
  const { data: weaverPaymentsRes, isLoading: weaverPayLoading, isError: weaverPayError } = useQuery({
    queryKey: ["history-weaver-payments"],
    queryFn: () => weaverPaymentsApi.list(),
  });
  const { data: invoicesRes, isLoading: invoicesLoading, isError: invoicesError } = useQuery({
    queryKey: ["history-invoices"],
    queryFn: () => invoicesApi.list(),
  });

  const isLoading = vendorPayLoading || weaverPayLoading || supplierPayLoading || invoicesLoading;
  const isError = vendorPayError || weaverPayError || supplierPayError || invoicesError;

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
      recordedBy: "Admin",
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
      recordedBy: "Admin",
    }));

    const weaverRows: PayHistRecord[] = (weaverPaymentsRes?.items ?? []).map(p => ({
      id: `WP-${p.id}`,
      date: formatHistDate(p.paymentDate),
      type: "Weaver Payment",
      party: weaverNameById.get(p.weaverId) ?? p.weaverId,
      refNo: p.weaverId,
      description: "Making charges",
      amount: Number(p.amountPaid),
      status: "Paid",
      mode: "Bank Transfer",
      utr: p.utrNumber ?? undefined,
      recordedBy: "Admin",
    }));

    const customerRows: PayHistRecord[] = (invoicesRes?.items ?? []).flatMap(inv =>
      inv.payments.map(pay => ({
        id: `INV-${pay.id}`,
        date: formatHistDate(pay.date),
        type: "Customer Receipt" as const,
        party: inv.customer?.name ?? "Unknown Customer",
        refNo: inv.id,
        description: "Invoice collection",
        invoicePO: inv.id,
        amount: Number(pay.amount),
        status: inv.status === "PAID" ? ("Paid" as const) : inv.status === "PARTIAL" ? ("Partial" as const) : ("Pending" as const),
        mode: pay.method ?? "Bank Transfer",
        utr: pay.utr ?? undefined,
        recordedBy: "Admin",
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

  const totalIn  = filtered.filter(r => r.type === "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalOut = filtered.filter(r => r.type !== "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalAmt = filtered.reduce((s, r) => s + r.amount, 0);
  const netFlow  = totalIn - totalOut;

  const clearFilters = () => { setTypeFilter("All Payment Types"); setStatusFilter("All Statuses"); setSearch(""); setDateFilter(DEFAULT_DATE_FILTER); };

  const tableColumns: ColumnDef<PayHistRecord>[] = [
    { id: "date", header: "Date", accessor: r => r.date, cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{r.date}</span> },
    {
      id: "type", header: "Payment Type", accessor: r => r.type,
      cell: (_v, r) => {
        const typeCfg = HIST_TYPE_CFG[r.type];
        return <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color, whiteSpace: "nowrap" as const }}>{r.type}</span>;
      },
    },
    { id: "party", header: "Party Name", priority: 1, accessor: r => r.party, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.party}</span> },
    { id: "refNo", header: "Reference No", priority: 3, accessor: r => r.refNo, cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.refNo}</span> },
    {
      id: "description", header: "Description", priority: 3, accessor: r => r.description,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: 200 }}>{r.description}</span>,
    },
    {
      id: "invoicePO", header: "Invoice / PO No", priority: 3, accessor: r => r.invoicePO,
      cell: (_v, r) => r.invoicePO ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.invoicePO}</span> : <span style={{ color: T.borderDef }}>—</span>,
    },
    {
      id: "amount", header: "Amount (₹)", accessor: r => r.amount, align: "end",
      cell: (_v, r) => (
        <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: r.type === "Customer Receipt" ? T.green : T.crimson }}>
          {r.type !== "Customer Receipt" && "−"}<Money value={rupees(r.amount)} />
        </span>
      ),
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status", align: "center",
      cell: (_v, r) => <StatusPill taxonomy="payment" status={payHistStatusKey(r.status)} />,
    },
    { id: "mode", header: "Payment Mode", priority: 3, accessor: r => r.mode, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.mode}</span> },
    {
      id: "utr", header: "UTR / Ref No", priority: 3, accessor: r => r.utr,
      cell: (_v, r) => r.utr ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.green }}>{r.utr}</span> : <span style={{ fontFamily: F.ui, fontSize: 13, color: T.borderDef }}>—</span>,
    },
    { id: "recordedBy", header: "Recorded By", priority: 3, accessor: r => r.recordedBy, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.recordedBy}</span> },
    {
      id: "action", header: "Action", priority: 2, accessor: () => null, type: "actions", align: "center",
      cell: () => (
        <Button variant="secondary" size="sm" iconLeft={Eye} className="rounded-[8px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]">
          View
        </Button>
      ),
    },
  ];

  const viewOptions = [
    { key: "card"  as const, Icon: LayoutGrid,   label: "Card View"  },
    { key: "list"  as const, Icon: LayoutList,   label: "List View"  },
    { key: "table" as const, Icon: AlignJustify, label: "Table View" },
  ];

  const HIST_STATS = [
    { icon: <ArrowDownCircle size={22} color={T.green}         />, iconBg: T.greenBg,                 iconBorder: "rgba(30,102,64,0.18)",  label: "Total Collected",  value: formatMoney(rupees(totalIn)),           sub: "Customer receipts · period", color: T.green,         hi: false },
    { icon: <ArrowUpCircle   size={22} color={T.crimson}       />, iconBg: T.crimsonBg,               iconBorder: "rgba(192,57,43,0.18)",  label: "Total Paid Out",   value: formatMoney(rupees(totalOut)),          sub: "Vendor & weaver payments",   color: T.crimson,       hi: false },
    { icon: <TrendingUp      size={22} color={T.antiqueGold}   />, iconBg: "rgba(200,155,71,0.12)",   iconBorder: T.borderGold,            label: "Net Cash Flow",    value: formatMoney(rupees(Math.abs(netFlow))), sub: netFlow >= 0 ? "Positive flow" : "Net outflow", color: netFlow >= 0 ? T.green : T.crimson, hi: true },
  ];

  return (
    <div id="pay-history" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={History}
        title="Payment History"
        subtitle="Complete history of all payments made and received. Use filters to find specific transactions."
        actions={
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download}
              className="flex-shrink-0 rounded-[9px] border border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#3B2314]">
              Download All Transactions
            </Button>
          </DownloadGate>
        }
      >

        {/* ── 4 Summary stat cards ───────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 22, alignItems: "stretch" }}>
          {HIST_STATS.map(s => (
            <div key={s.label} style={{
              display: "flex", flexDirection: "column", gap: 10,
              background: s.hi ? `linear-gradient(145deg,${T.warmCream},#FDF6E4)` : T.warmIvory,
              borderRadius: 16,
              border: s.hi ? `1px solid ${T.borderGold}` : `1px solid ${T.borderDef}`,
              borderTop: s.hi ? `3px solid ${T.antiqueGold}` : `1px solid ${T.borderDef}`,
              boxShadow: s.hi ? "0 4px 20px rgba(200,155,71,0.12)" : "0 2px 12px rgba(74,6,27,0.06)",
              padding: "20px",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, border: `1px solid ${s.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, lineHeight: 1.4 }}>{s.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: "auto" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Filter bar ──────────────────────────────────────── */}
        <div style={{ background: T.warmIvory, borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>

            {/* View toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: T.warmCream, borderRadius: 9, padding: 3, border: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              {viewOptions.map(({ key, Icon: Ico, label }) => (
                <Button key={key} variant={view === key ? "primary" : "tertiary"} size="sm" iconLeft={Ico}
                  onClick={() => setView(key)}
                  className={view === key ? "rounded-[7px] bg-[#6E0F2D] text-[#FFFDF9]" : "rounded-[7px] bg-transparent text-[var(--text-tertiary)]"}>
                  {label}
                </Button>
              ))}
            </div>

            {/* Type dropdown */}
            <Select value={typeFilter} onValueChange={setTypeFilter} size="sm">
              {["All Payment Types","Vendor Payment","Weaver Payment","Supplier Payment","Customer Receipt"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </Select>

            {/* Status dropdown */}
            <Select value={statusFilter} onValueChange={setStatusFilter} size="sm">
              {["All Statuses","Paid","Partial","Pending"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </Select>

            {/* Search */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search party, ref no, description..." size="sm" />
            </div>

            {/* Clear */}
            <Button variant="secondary" size="sm" iconLeft={X} onClick={clearFilters}
              className="whitespace-nowrap rounded-[8px] bg-[var(--surface-canvas)] text-[var(--text-tertiary)]">
              Clear
            </Button>
          </div>

          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        {/* ── Loading / error states ──────────────────────────── */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            Loading payment history…
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
            Couldn't load vendor/weaver payment history. Please try refreshing the page.
          </div>
        ) : (
        <>
        {/* ── CARD VIEW ───────────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, alignItems: "stretch", marginBottom: 32 }}>
            {filtered.map((r, i) => (
              <motion.div key={r.id} style={{ display: "flex", flexDirection: "column" }}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}>
                <HistoryCard r={r} />
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center" as const }}>
                <Receipt size={40} color={T.borderDef} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No transactions match your filters.</div>
              </div>
            )}
          </div>
        )}

        {/* ── LIST VIEW ────────────────────────────────────────── */}
        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" as const }}>
                <Receipt size={40} color={T.borderDef} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No transactions match your filters.</div>
              </div>
            ) : filtered.map((r, i) => {
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
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{r.refNo}</div>
                    {r.invoicePO && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{r.invoicePO}</div>}
                  </div>

                  {/* Date */}
                  <div style={{ flex: "0 0 100px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{r.date}</div>

                  {/* Amount */}
                  <div style={{ flex: "0 0 120px", textAlign: "right" as const }}>
                    <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: isReceipt ? T.green : T.crimson }}>
                      {isReceipt ? "+" : "−"}<Money value={rupees(r.amount)} />
                    </div>
                    {r.utr && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.green, marginTop: 2 }}>{r.utr}</div>}
                  </div>

                  {/* Status badge */}
                  <StatusPill taxonomy="payment" status={payHistStatusKey(r.status)} className="shrink-0" />

                  {/* Mode + Recorded */}
                  <div style={{ flex: "0 0 100px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                    <div>{r.mode}</div>
                    <div style={{ marginTop: 2, fontSize: 12 }}>{r.recordedBy}</div>
                  </div>

                  {/* View button */}
                  <IconButton icon={Eye} label="View" variant="secondary" size="sm" className="flex-shrink-0 rounded-[8px] text-[#6E0F2D]" />
                </motion.div>
              );
            })}
            {/* Summary footer */}
            {filtered.length > 0 && (
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmCream }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{filtered.length} transaction{filtered.length > 1 ? "s" : ""}</span>
                <div style={{ display: "flex", gap: 24 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 13, color: T.green, fontWeight: 700 }}>+<Money value={rupees(totalIn)} /></span>
                  <span style={{ fontFamily: F.mono, fontSize: 13, color: T.crimson, fontWeight: 700 }}>−<Money value={rupees(totalOut)} /></span>
                  <span style={{ fontFamily: F.mono, fontSize: 13, color: netFlow >= 0 ? T.green : T.crimson, fontWeight: 700, borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 24 }}>Net: {netFlow >= 0 ? "+" : "−"}<Money value={rupees(Math.abs(netFlow))} /></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ──────────────────────────────────────── */}
        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <div style={{ overflowX: "auto", minWidth: 1200 }}>
              <DataTable responsive columns={tableColumns} data={filtered} getRowId={r => r.id} emptyTitle="No transactions match your filters" />
            </div>
            {filtered.length > 0 && (
              <div style={{ background: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9" }}>TOTALS FOR SELECTED PERIOD</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.50)" }}>{filtered.length} rows</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight }}>+<Money value={rupees(totalIn)} /></span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: "#F47B72"  }}>−<Money value={rupees(totalOut)} /></span>
                  <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.antiqueGold }}><Money value={rupees(totalAmt)} /></span>
                </div>
              </div>
            )}
            {/* Pagination */}
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmIvory }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                Showing {Math.min(PER_PAGE, filtered.length)} of {filtered.length} results
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Button variant="secondary" size="sm" iconLeft={ChevronLeft} className="rounded-[7px] text-[var(--text-tertiary)]">
                  Prev
                </Button>
                {[1,2,3].map(p => (
                  <Button key={p} variant={page === p ? "primary" : "secondary"} size="sm" onClick={() => setPage(p)}
                    className={page === p ? "size-[34px] rounded-[7px] bg-[#6E0F2D] p-0 text-[#FFFDF9]" : "size-[34px] rounded-[7px] p-0 text-[#3B2314]"}>
                    {p}
                  </Button>
                ))}
                <Button variant="secondary" size="sm" iconRight={ChevronRight} className="rounded-[7px] text-[var(--text-tertiary)]">
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </SectionCard>
      </FadeUp>
    </div>
  );
}
