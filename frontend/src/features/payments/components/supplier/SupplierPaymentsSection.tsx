import React, { useMemo, useState } from "react";
import { AlignJustify, BadgeCheck, CircleAlert, Clock, LayoutGrid, Receipt, Store, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { useSuppliers } from "@/features/suppliers";
import { Supplier, Purchase } from "@/features/suppliers";
import { F, T } from "../../theme";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { FadeUp } from "../common/motion";
import { DropBtn, SectionCard } from "../common/primitives";
import { SupplierPayNowModal } from "./SupplierPayNowModal";
import { SupplierPaymentDetailModal } from "./SupplierPaymentDetailModal";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";

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
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
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
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 items-stretch">
            {filtered.map((r, i) => {
              const isPaidRow = r.outstanding === 0 && r.totalPurchased > 0;
              return (
              <motion.div
                key={r.supplier.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{
                  background: "#FFFDF9",
                  border: `1.5px solid ${T.antiqueGold}`,
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  width: "100%",
                  color: T.luxuryBrown,
                }}
              >
                {/* Top accent bar */}
                <div style={{ height: 4, background: T.royalBurgundy, width: "100%", opacity: 0.8, flexShrink: 0 }} />

                <div style={{ padding: "16px 20px 0" }}>
                  <TopDivider />
                </div>

                <div style={{ padding: "20px 22px 18px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  {/* Top Header: Store Arch Icon + Supplier Name + Status Pill */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, minWidth: 0 }}>
                      {/* Scalloped Arch Badge */}
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: "14px 14px 12px 12px",
                        background: "rgba(110, 15, 45, 0.06)",
                        border: "1px solid rgba(110, 15, 45, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Store size={20} color={T.royalBurgundy} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2 }} className="truncate">
                          {r.supplier.name}
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>
                          {r.supplier.code ? `Code: ${r.supplier.code}` : `Last: ${r.lastPurchaseDate || "—"}`}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span style={{
                      fontFamily: F.ui,
                      fontSize: 12,
                      fontWeight: 600,
                      color: r.status === "Paid" ? "#1E6640" : r.status === "Overdue" ? "#C0392B" : "#A06800",
                      background: r.status === "Paid" ? "rgba(30,102,64,0.08)" : r.status === "Overdue" ? "rgba(192,57,43,0.08)" : "#FFF9EE",
                      border: `1px solid ${r.status === "Paid" ? "rgba(30,102,64,0.3)" : r.status === "Overdue" ? "rgba(192,57,43,0.3)" : "#E6C687"}`,
                      padding: "4px 14px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      {r.status}
                    </span>
                  </div>

                  {/* Diamond Line Separator */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0 14px" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(200, 155, 71, 0.25)" }} />
                    <div style={{ width: 6, height: 6, background: "rgba(200, 155, 71, 0.45)", transform: "rotate(45deg)", margin: "0 8px", flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 1, background: "rgba(200, 155, 71, 0.25)" }} />
                  </div>

                  {/* Row 1: Purchased & Paid Stats */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    {/* Purchased */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: "#886A58" }}>
                        <span style={{ color: "#C89B47", fontSize: 10 }}>●</span> Purchased
                      </div>
                      <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, marginTop: 4 }}>
                        <Money value={rupees(r.totalPurchased)} />
                      </div>
                    </div>

                    {/* Vertical divider */}
                    <div className="hidden sm:block" style={{ width: 1, height: 36, background: "rgba(200, 155, 71, 0.22)", margin: "0 16px", flexShrink: 0 }} />

                    {/* Paid */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: "#886A58" }}>
                        <span style={{ color: "#C89B47", fontSize: 10 }}>●</span> Paid
                      </div>
                      <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, marginTop: 4 }}>
                        <Money value={rupees(r.totalPaid)} />
                      </div>
                    </div>
                  </div>

                  {/* Line between Purchased/Paid and Balance Due */}
                  <div style={{ height: 1, background: "rgba(200, 155, 71, 0.2)", margin: "14px 0" }} />

                  {/* Row 2: Balance Due */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: "#886A58" }}>
                      <span style={{ color: "#C89B47", fontSize: 10 }}>●</span> Balance Due
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: isPaidRow ? T.green : r.status === "Overdue" ? T.crimson : T.royalBurgundy, marginTop: 4 }}>
                      {isPaidRow ? "Paid ✓" : <Money value={rupees(r.outstanding)} />}
                    </div>
                  </div>

                  {/* Bottom Shield / Action Banner */}
                  <div style={{ padding: "0 20px" }}>
                    <BottomDivider />
                  </div>
                  
                  <div style={{
                    marginTop: 18,
                    background: "linear-gradient(180deg, #FAF4EB 0%, #FFF8F0 100%)",
                    border: "1px solid rgba(220, 190, 140, 0.4)",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(200, 155, 71, 0.3)" }} />
                      <div style={{ padding: "0 10px", color: "#C89B47", display: "flex", alignItems: "center" }}>
                        <BadgeCheck size={18} color="#C89B47" />
                      </div>
                      <div style={{ flex: 1, height: 1, background: "rgba(200, 155, 71, 0.3)" }} />
                    </div>

                    {r.outstanding === 0 ? (
                      <div style={{ fontFamily: F.display, fontSize: 13, fontWeight: 600, color: "#886A58", textAlign: "center" }}>
                        No Dues
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, width: "100%", marginTop: 2 }}>
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => setDetailForId(r.supplier.id)}
                          className="flex-1 min-w-[100px] justify-center rounded-[8px] border border-[rgba(110,15,45,0.15)] text-[#6E0F2D] text-[12px] font-bold py-1.5"
                        >
                          Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setPayForId(r.supplier.id)}
                          className="flex-1 min-w-[100px] justify-center rounded-[8px] bg-[#6E0F2D] hover:bg-[#4A0A1D] text-[#FFFDF9] text-[12px] font-bold py-1.5"
                        >
                          Pay Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
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
