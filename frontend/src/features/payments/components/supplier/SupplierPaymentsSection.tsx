import React, { useMemo, useState } from "react";
import { AlignJustify, BadgeCheck, CircleAlert, Clock, LayoutGrid, Receipt, Store, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { useSuppliers } from "@/features/suppliers";
import { Supplier, Purchase } from "@/features/suppliers";
import { F, T, EASE } from "../../theme";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { FadeUp } from "../common/motion";
import { DropBtn, SectionCard } from "../common/primitives";
import { SupplierPayNowModal } from "./SupplierPayNowModal";
import { SupplierPaymentDetailModal } from "./SupplierPaymentDetailModal";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";

type SupplierStatusKey = "Paid" | "Pending" | "Overdue";

interface SupplierRow {
  supplier: Supplier;
  totalPurchased: number;
  totalPaid: number;
  outstanding: number;
  lastPurchaseDate: string;
  status: SupplierStatusKey;
}

const STATUS_CFG: Record<SupplierStatusKey, { color: string; bg: string }> = {
  Paid:     { color: T.green,        bg: "rgba(30,102,64,0.10)" },
  Pending:  { color: T.antiqueGold,  bg: "rgba(200,155,71,0.14)" },
  Overdue:  { color: T.crimson,      bg: "rgba(192,57,43,0.10)" },
};

function SupplierStatusBadge({ status }: { status: SupplierStatusKey }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "4px 10px", borderRadius: 20 }}>
      {status}
    </span>
  );
}

const TopDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginBottom: 12 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ display: "flex", gap: 3, paddingRight: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
  </div>
);

const BottomDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginTop: 16 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ display: "flex", gap: 3, paddingRight: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
  </div>
);

export function SupplierPaymentsSection() {
  const { suppliers, purchases, payments, addPayment, statsFor, isLoading, isError, refetch } = useSuppliers();

  const [view, setView] = useState<"card" | "table">("card");
  const [statusFilter, setStatusFilter] = useState("All Bill Status");
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [payForId, setPayForId] = useState<string | null>(null);
  const [detailForId, setDetailForId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rows: SupplierRow[] = useMemo(() => {
    return suppliers.map((s): SupplierRow => {
      const stats = statsFor(s.id);
      let status: SupplierStatusKey;
      if (stats.outstanding <= 0 && stats.totalPurchased > 0) status = "Paid";
      else if (s.status === "overdue") status = "Overdue";
      else status = "Pending";
      return {
        supplier: s,
        totalPurchased: stats.totalPurchased,
        totalPaid: stats.totalPaid,
        outstanding: stats.outstanding,
        lastPurchaseDate: stats.lastPurchaseDate,
        status,
      };
    });
  }, [suppliers, statsFor]);

  const totalSupplierPaymentsRecorded = payments.reduce((s, p) => s + p.amount, 0);
  const totalInvoiced = rows.reduce((s, r) => s + r.totalPurchased, 0);
  const pendingBalance = rows.reduce((s, r) => s + r.outstanding, 0);
  const overdueRows = rows.filter(r => r.status === "Overdue");

  const filtered = rows.filter(r => {
    const matchStatus = statusFilter === "All Bill Status" || r.status === statusFilter;
    const matchSupplier = supplierFilter === "All Suppliers" || r.supplier.name === supplierFilter;
    const matchSearch = !search || r.supplier.name.toLowerCase().includes(search.toLowerCase());
    const matchDate = !r.lastPurchaseDate || r.lastPurchaseDate === "—" || matchesDateFilter(r.lastPurchaseDate, dateFilter);
    return matchStatus && matchSupplier && matchSearch && matchDate;
  });

  const pag = usePagination(filtered, 8);

  const payFor = payForId ? rows.find(r => r.supplier.id === payForId) ?? null : null;
  const openPurchasesForPayFor: Purchase[] = payFor
    ? purchases.filter(p => p.supplierId === payFor.supplier.id && p.status !== "Paid")
    : [];

  const detailFor = detailForId ? rows.find(r => r.supplier.id === detailForId) ?? null : null;
  const purchasesForDetail: Purchase[] = detailFor
    ? purchases.filter(p => p.supplierId === detailFor.supplier.id || p.supplier === detailFor.supplier.name)
    : [];
  const paymentsForDetail = detailFor
    ? payments.filter(p => p.supplierId === detailFor.supplier.id)
    : [];

  const handleSave = (payload: { amount: number; date: string; mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque"; reference: string; purchaseId?: string }) => {
    if (!payFor) return;
    setSaving(true);
    addPayment({
      supplierId: payFor.supplier.id,
      date: payload.date,
      amount: payload.amount,
      mode: payload.mode,
      reference: payload.reference,
      purchaseId: payload.purchaseId,
    });
    toast.success(`Payment of ${formatMoney(rupees(payload.amount))} recorded for ${payFor.supplier.name}`);
    setSaving(false);
    setPayForId(null);
  };

  const supplierTableColumns: ColumnDef<SupplierRow>[] = [
    {
      id: "supplier", header: "Supplier Name", accessor: r => r.supplier.name,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Store size={15} color={T.royalBurgundy} />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.supplier.name}</span>
        </div>
      ),
    },
    {
      id: "totalPurchased", header: "Total Purchased", accessor: r => r.totalPurchased, type: "number",
      cell: (_v, r) => <span style={{ fontWeight: 700, fontSize: 14 }}><Money value={rupees(r.totalPurchased)} /></span>,
    },
    {
      id: "totalPaid", header: "Paid Amt", accessor: r => r.totalPaid, type: "number",
      cell: (_v, r) => <span style={{ color: T.green, fontWeight: 600 }}><Money value={rupees(r.totalPaid)} /></span>,
    },
    {
      id: "outstanding", header: "Balance Due", accessor: r => r.outstanding, type: "number",
      cell: (_v, r) => (
        <span style={{ fontWeight: 700, fontSize: 14, color: r.outstanding === 0 ? T.green : r.status === "Overdue" ? T.crimson : T.antiqueGold }}>
          {r.outstanding === 0 && r.totalPurchased > 0 ? "Paid ✓" : <Money value={rupees(r.outstanding)} />}
        </span>
      ),
    },
    {
      id: "lastPurchaseDate", header: "Last Purchase", accessor: r => r.lastPurchaseDate,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.lastPurchaseDate}</span>,
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => <SupplierStatusBadge status={r.status} />,
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="tertiary" size="sm" onClick={() => setDetailForId(r.supplier.id)}
            className="rounded-[7px] text-[var(--text-tertiary)]">
            View Details
          </Button>
          {r.outstanding === 0 ? (
            <Button variant="secondary" size="sm" disabled
              className="rounded-[7px] border-[rgba(30,102,64,0.20)] bg-[rgba(30,102,64,0.09)] text-[#1E6640] disabled:bg-[rgba(30,102,64,0.09)] disabled:text-[#1E6640] disabled:opacity-100">
              {r.totalPurchased > 0 ? "Paid" : "No Dues"}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setPayForId(r.supplier.id)}
              className="rounded-[7px] border-[#6E0F2D] text-[#6E0F2D]">
              Pay Now
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div id="pay-supplier" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={Store}
        title="Supplier Payments"
        subtitle="Track payments made to saree suppliers. Record and monitor all supplier purchase settlements."
      >
        {/* ── 5 stat cards — Premium Silk Saree Design ─────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" style={{ gap: 22, marginTop: 32, marginBottom: 28, alignItems: "stretch" }}>
          {[
            {
              icon: <Receipt size={22} color={T.antiqueGold} />,
              label: "Total Invoiced",
              value: formatMoney(rupees(totalInvoiced)),
              sub: "What all supplier purchases add up to",
              gid: "sti",
            },
            {
              icon: <Wallet size={22} color={T.antiqueGold} />,
              label: "Total Supplier Payments",
              value: formatMoney(rupees(totalSupplierPaymentsRecorded)),
              sub: "All recorded supplier payments",
              gid: "stp",
            },
            {
              icon: <CircleAlert size={22} color={T.antiqueGold} />,
              label: "Pending Balance",
              value: formatMoney(rupees(pendingBalance)),
              sub: "Outstanding to suppliers",
              gid: "spb",
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              label: "Suppliers Settled",
              value: `${rows.filter(r => r.outstanding === 0 && r.totalPurchased > 0).length}`,
              sub: "Fully paid suppliers",
              gid: "sss",
            },
            {
              icon: <Clock size={22} color={T.antiqueGold} />,
              label: "Overdue Suppliers",
              value: `${overdueRows.length}`,
              sub: "Suppliers flagged overdue",
              gid: "sos",
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

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div className="hidden md:flex" style={{ border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {([{ key: "card", Icon: LayoutGrid, label: "Card View" }, { key: "table", Icon: AlignJustify, label: "Table View" }] as const).map(({ key, Icon, label }) => (
              <Button key={key} variant={view === key ? "primary" : "tertiary"} size="sm" iconLeft={Icon}
                onClick={() => setView(key)}
                className={view === key ? "rounded-none bg-[#6E0F2D] text-[#FFFDF9]" : "rounded-none bg-white text-[var(--text-tertiary)]"}>
                {label}
              </Button>
            ))}
          </div>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          <DropBtn value={supplierFilter} options={["All Suppliers", ...suppliers.map(s => s.name)]} onChange={setSupplierFilter} />
          <Select value={statusFilter} onValueChange={setStatusFilter} size="sm" containerClassName="w-auto shrink-0" className="w-[145px] font-semibold">
            {["All Bill Status", "Paid", "Pending", "Overdue"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput aria-label="Search supplier" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supplier..." size="sm" />
          </div>
        </div>

        <div className="flex md:hidden items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
            <Button
              onClick={() => setView("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                view === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <LayoutGrid size={14} /> Card View
            </Button>
            <Button
              onClick={() => setView("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                view === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <AlignJustify size={14} /> Table View
            </Button>
          </div>
        </div>

        {view === "card" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6 items-stretch">
              {pag.pageItems.map((r, i) => {
                const isPaid = r.status === "Paid";
                const isOverdue = r.status === "Overdue";
                const statusColor = isPaid ? T.green : isOverdue ? T.crimson : T.antiqueGold;
                const statusBg = isPaid ? "rgba(46,125,50,0.08)" : isOverdue ? "rgba(192,57,43,0.08)" : "rgba(200,155,71,0.12)";
                const borderAccent = isPaid ? T.green : isOverdue ? T.crimson : T.royalBurgundy;

                return (
                  <motion.div
                    key={r.supplier.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <div style={{
                      position: "relative",
                      borderRadius: 16,
                      border: `1.5px solid ${T.antiqueGold}`,
                      borderTop: `4px solid ${T.royalBurgundy}`,
                      background: "#FFFFFF",
                      boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      gap: 12,
                      transition: "all 0.2s ease",
                    }}>
                      {/* Top luxury ornamental line divider */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "0 0 2px" }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.7 }} />
                        <div style={{ flex: 1, height: 1, borderTop: `1px dashed ${T.antiqueGold}`, opacity: 0.4 }} />
                        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                          <div style={{ width: 3.5, height: 3.5, background: T.antiqueGold, transform: "rotate(45deg)" }} />
                          <div style={{ width: 5.5, height: 5.5, background: T.antiqueGold, transform: "rotate(45deg)" }} />
                          <div style={{ width: 3.5, height: 3.5, background: T.antiqueGold, transform: "rotate(45deg)" }} />
                        </div>
                        <div style={{ flex: 1, height: 1, borderTop: `1px dashed ${T.antiqueGold}`, opacity: 0.4 }} />
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.7 }} />
                      </div>

                      {/* Header badges: ID & Last activity date */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: F.m,
                          fontSize: 11,
                          fontWeight: 700,
                          color: T.royalBurgundy,
                          background: "rgba(110,15,45,0.07)",
                          border: "1px solid rgba(110,15,45,0.12)",
                          borderRadius: 8,
                          padding: "3px 9px",
                          letterSpacing: "0.4px",
                        }}>
                          SUP-{r.supplier.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span style={{
                          fontFamily: F.m,
                          fontSize: 11,
                          color: T.taupe,
                          background: "rgba(200,155,71,0.08)",
                          border: "1px solid rgba(200,155,71,0.18)",
                          borderRadius: 8,
                          padding: "3px 9px",
                        }}>
                          {r.lastPurchaseDate && r.lastPurchaseDate !== "—" ? r.lastPurchaseDate : "Active"}
                        </span>
                      </div>

                      {/* Supplier Title & Subtitle */}
                      <div>
                        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.25 }}>
                          {r.supplier.name}
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                          <span>📍 {r.supplier.city || "Dharmavaram"}</span>
                          <span>·</span>
                          <span>{r.supplier.specialty || "General Supplier"}</span>
                        </div>
                      </div>

                      {/* Inner Summary Box */}
                      <div style={{
                        background: "rgba(110,15,45,0.03)",
                        border: `1px solid rgba(110,15,45,0.08)`,
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}>
                        <div style={{ fontFamily: F.m, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.5px" }}>
                          PURCHASE & SETTLEMENT
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Total Purchases</span>
                          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
                            <Money value={rupees(r.totalPurchased)} />
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Paid Amount</span>
                          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.green }}>
                            <Money value={rupees(r.totalPaid)} />
                          </span>
                        </div>
                      </div>

                      {/* Balance Row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 2px 4px" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>Balance Due</span>
                        <span style={{
                          fontFamily: F.ui,
                          fontSize: 15,
                          fontWeight: 700,
                          color: r.outstanding === 0 ? T.green : isOverdue ? T.crimson : T.antiqueGold,
                        }}>
                          {r.outstanding === 0 && r.totalPurchased > 0 ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.green, fontWeight: 700 }}>
                              Fully Paid ✓
                            </span>
                          ) : (
                            <Money value={rupees(r.outstanding)} />
                          )}
                        </span>
                      </div>

                      {/* Bottom luxury ornamental line divider */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "2px 0" }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.7 }} />
                        <div style={{ flex: 1, height: 1, borderTop: `1px dashed ${T.antiqueGold}`, opacity: 0.4 }} />
                        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                          <div style={{ width: 3.5, height: 3.5, background: T.antiqueGold, transform: "rotate(45deg)" }} />
                          <div style={{ width: 5.5, height: 5.5, background: T.antiqueGold, transform: "rotate(45deg)" }} />
                          <div style={{ width: 3.5, height: 3.5, background: T.antiqueGold, transform: "rotate(45deg)" }} />
                        </div>
                        <div style={{ flex: 1, height: 1, borderTop: `1px dashed ${T.antiqueGold}`, opacity: 0.4 }} />
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.7 }} />
                      </div>

                      {/* STATUS & ACTIONS Header + Badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                        <span style={{ fontFamily: F.m, fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px" }}>
                          STATUS & ACTIONS
                        </span>
                        <span style={{
                          fontFamily: F.ui,
                          fontSize: 12,
                          fontWeight: 700,
                          background: statusBg,
                          color: statusColor,
                          border: `1px solid ${statusColor}40`,
                          borderRadius: 999,
                          padding: "3px 11px",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}>
                          {isPaid ? "✓ Paid" : r.status}
                        </span>
                      </div>

                      {/* Action Buttons Grid */}
                      <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 4 }}>
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => setDetailForId(r.supplier.id)}
                          className="flex-1 justify-center rounded-xl border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] hover:bg-[rgba(110,15,45,0.04)] text-[13px] font-bold py-2"
                        >
                          Details
                        </Button>
                        {isPaid ? (
                          <div className="flex-1 flex items-center justify-center rounded-xl bg-[rgba(46,125,50,0.08)] border border-[rgba(46,125,50,0.2)] text-[12px] font-bold color-[#2E7D32] py-2 text-[#2E7D32]">
                            No Dues
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setPayForId(r.supplier.id)}
                            className="flex-1 justify-center rounded-xl bg-[#6E0F2D] hover:bg-[#4A0A1D] text-[#FFFDF9] text-[13px] font-bold py-2"
                          >
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mb-8">
              <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="suppliers" />
            </div>
          </div>
        )}

        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
            <div style={{ overflowX: "auto" }} className="w-full">
              <div className="min-w-[1100px]">
                <DataTable
                  responsive={false}
                  columns={supplierTableColumns}
                  data={filtered}
                  getRowId={r => r.supplier.id}
                  loading={isLoading}
                  error={isError}
                  onRetry={refetch}
                  emptyTitle="No suppliers match your filters"
                  pagination
                />
              </div>
            </div>
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {filtered.length} of {rows.length} suppliers</span>
            </div>
          </div>
        )}
      </SectionCard>

      <AnimatePresence>
        {payFor && (
          <SupplierPayNowModal
            supplier={payFor.supplier}
            outstanding={payFor.outstanding}
            openPurchases={openPurchasesForPayFor}
            saving={saving}
            onClose={() => setPayForId(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailFor && (
          <SupplierPaymentDetailModal
            supplier={detailFor.supplier}
            purchases={purchasesForDetail}
            payments={paymentsForDetail}
            onClose={() => setDetailForId(null)}
          />
        )}
      </AnimatePresence>
      </FadeUp>
    </div>
  );
}
