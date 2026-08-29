import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin, Phone, FileText, MessageSquare, Landmark, StickyNote,
  AlertTriangle, Package, Trash2, ChevronLeft, UserRound, Boxes, ShoppingBag, CreditCard, UserCheck, Edit3 } from "lucide-react";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { SectionCard } from "@/shared/ui/SectionCard";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "./theme";
import { Vendor, VendorBill, VendorPaymentTxn } from "./types";
import { PAY_MODE_FILL } from "./data";
import { StarRating } from "./SharedBits";
import { StatusPill as DomainStatusPill, EntityCode } from "../../../../shared/ui/domain";
import type { StatusValueOf } from "../../../../lib/domain/status";
import { PurchaseOrderHistoryTable, type PurchaseOrderHistoryRow } from "./PurchaseOrderHistoryTable";
import { VendorEditFormTab } from "./VendorEditFormTab";
import { purchaseOrdersApi } from "../../../../shared/api/purchase-orders";
import { Button } from "../../../../shared/ui/primitives";
import { vendorBillsApi, VendorBillStatus } from "../../../../shared/api/vendor-bills";
import { vendorPaymentsApi } from "../../../../shared/api/payments";
import { useMoneyVisible } from "../../../../shared/ui/MoneyValue";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { formatRecordedBy } from "@/lib/domain/actor";
import { recordView, useConfirm } from "../../../../shared/ui/overlay";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";

const BILL_STATUS_LABEL: Record<VendorBillStatus, VendorBill["status"]> = {
  PAID: "Paid", PARTIAL: "Partial", PENDING: "Pending", OVERDUE: "Overdue",
};

export function VendorProfile({ vendor, onBack, onUpdate, onDelete }: { vendor: Vendor; onBack: () => void; onUpdate?: (v: Vendor) => void; onDelete?: (v: Vendor) => void }) {
  const [tab, setTab] = useState<"overview" | "orders" | "payments" | "contact" | "edit">("overview");
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const confirm = useConfirm();

  // Command palette RECENT group (design-system/05-OVERLAYS.md Part H) —
  // record this profile as viewed once per mount.
  useEffect(() => {
    recordView({ key: `vendor:${vendor.id}`, label: vendor.name, path: "/admin/vendors", kind: "Vendor" });
  }, [vendor.id, vendor.name]);
  const tabs = [
    { key: "overview", label: "Overview", icon: <Boxes size={18} /> },
    { key: "orders", label: "Order History", icon: <ShoppingBag size={18} /> },
    { key: "payments", label: "Payment History", icon: <CreditCard size={18} /> },
    { key: "contact", label: "Contact Details", icon: <UserCheck size={18} /> },
    { key: "edit", label: "Edit Profile", icon: <Edit3 size={18} /> },
  ] as const;
  const [orderDateFilter, setOrderDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [payFilter, setPayFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const { data: poRes, isLoading: posLoading, isError: posError } = useQuery({
    queryKey: ["vendor-pos", vendor.id],
    queryFn: () => purchaseOrdersApi.list(),
  });
  const { data: billsRes, isLoading: billsLoading, isError: billsError } = useQuery({
    queryKey: ["vendor-bills", vendor.id],
    queryFn: () => vendorBillsApi.list(vendor.id),
  });
  const { data: paymentsRes, isLoading: paymentsLoading, isError: paymentsError } = useQuery({
    queryKey: ["vendor-payments", vendor.id],
    queryFn: () => vendorPaymentsApi.list(vendor.id),
  });
  const ledgerLoading = billsLoading || paymentsLoading;
  const ledgerError = billsError || paymentsError;

  // VendorBill.status normalized onto the shared payment taxonomy
  // (lib/domain/status.ts) per design-system/06-DOMAIN.md Part D.
  const BILL_STATUS_KEY: Record<VendorBill["status"], StatusValueOf<"payment">> = {
    Paid: "paid", Partial: "partial", Pending: "unpaid", Overdue: "overdue",
  };

  const ledger = React.useMemo(() => {
    const rawBills = billsRes?.items ?? [];
    const rawPayments = paymentsRes?.items ?? [];
    const today = new Date();

    const bills: VendorBill[] = rawBills.map(b => {
      const paid = rawPayments
        .filter(p => p.billId === b.id)
        .reduce((a, p) => a + Number(p.amount), 0);
      const amount = Number(b.amount);
      const balance = Math.max(0, amount - paid);
      const dueDateObj = b.dueDate ? new Date(b.dueDate) : null;
      const daysOverdue = b.status === "OVERDUE" && dueDateObj
        ? Math.max(0, Math.ceil((today.getTime() - dueDateObj.getTime()) / 86400000))
        : 0;
      return {
        id: b.id.slice(0, 8).toUpperCase(),
        invoiceNo: b.poId ? `PO ${b.poId.slice(0, 8).toUpperCase()}` : (b.description || "—"),
        date: b.createdAt ? b.createdAt.split("T")[0] : "",
        dueDate: b.dueDate ? b.dueDate.split("T")[0] : "—",
        amount, paid, balance,
        status: BILL_STATUS_LABEL[b.status],
        daysOverdue,
      };
    });

    const txns: VendorPaymentTxn[] = rawPayments.map(p => ({
      id: p.id.slice(0, 8).toUpperCase(),
      billId: p.billId ? p.billId.slice(0, 8).toUpperCase() : "General",
      date: p.date ? p.date.split("T")[0] : "",
      amount: Number(p.amount),
      mode: p.method || "—",
      reference: p.utr || "—",
      firm: p.firmId || "Beere Kesava Silks (Head Firm)",
      notes: "",
      recordedBy: p.recordedBy ?? null,
    }));

    const totalBilled = bills.reduce((a, b) => a + b.amount, 0);
    const totalPaid = txns.reduce((a, t) => a + t.amount, 0);
    const outstanding = Math.max(0, totalBilled - totalPaid);

    return { bills, txns, totalBilled, totalPaid, outstanding };
  }, [billsRes, paymentsRes]);

  const vendorPos = React.useMemo(
    () => (poRes?.items ?? []).filter(p => p.vendorId === vendor.id || p.vendor?.id === vendor.id),
    [poRes, vendor.id]
  );
  const orders: PurchaseOrderHistoryRow[] = React.useMemo(() => vendorPos.map(p => ({
    id: p.poNumber || `PO-${p.id.slice(0, 8).toUpperCase()}`,
    date: p.createdAt ? p.createdAt.split("T")[0] : "",
    materials: (p.items ?? []).map(item => ({
      type: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
      description: item.name,
      qty: `${item.quantity} ${item.unit}`,
      invoiceAmount: item.invoicedAmount ? formatMoney(rupees(Number(item.invoicedAmount))) : undefined,
    })),
    totalAmount: formatMoney(rupees(Number(p.totalValue || 0))),
    amount: Number(p.totalValue || 0),
    grnId: p.grnId || undefined,
    firmName: p.grnId ? "Beere Kesava Silks (Head Firm)" : undefined,
    receivedDate: undefined as string | undefined,
    status: (p.status === "RECEIVED" ? "Delivered" : p.status === "APPROVED" ? "Approved" : p.status === "REJECTED" ? "Cancelled" : "Pending") as "Delivered" | "Approved" | "Cancelled" | "Pending",
    receiveStatus: undefined as string | undefined,
  })), [vendorPos]);

  const lastOrderDate = orders.length ? orders[0].date : null;
  const overdueBills = ledger.bills.filter(b => b.status === "Overdue" || b.daysOverdue > 0);
  const moneyVisible = useMoneyVisible();
  const realTotalSpend = orders.reduce((a, o) => a + o.amount, 0);

  const filteredBills = ledger.bills.filter(b => matchesDateFilter(b.date, payFilter));
  const filteredTxns = ledger.txns.filter(t => matchesDateFilter(t.date, payFilter));
  const paidInRange = filteredTxns.reduce((a, t) => a + t.amount, 0);

  const modeSplit = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filteredTxns) {
      map.set(t.mode, (map.get(t.mode) ?? 0) + t.amount);
    }
    return Array.from(map.entries()).map(([mode, amount]) => ({ mode: mode as VendorPaymentTxn["mode"], amount }));
  }, [filteredTxns]);

  const inr = (n: number) => formatMoney(rupees(n));

  const billColumns: ColumnDef<VendorBill>[] = [
    { id: "id", header: "Bill ID", accessor: b => b.id, priority: 1, cell: (_v, b) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>{b.id}</span> },
    { id: "invoiceNo", header: "Ref / PO", accessor: b => b.invoiceNo, priority: 3, cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{b.invoiceNo}</span> },
    { id: "date", header: "Bill Date", accessor: b => b.date, priority: 3, cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.date}</span> },
    { id: "dueDate", header: "Due Date", accessor: b => b.dueDate, priority: 3, cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: b.daysOverdue > 0 ? T.crimson : T.taupe, fontWeight: b.daysOverdue > 0 ? 700 : 400 }}>{b.dueDate}{b.daysOverdue > 0 ? ` (${b.daysOverdue}d overdue)` : ""}</span> },
    { id: "amount", header: "Bill Amount", accessor: b => b.amount, align: "end", cell: (_v, b) => <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{inr(b.amount)}</span> },
    { id: "paid", header: "Paid", accessor: b => b.paid, align: "end", priority: 3, cell: (_v, b) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.greenMid }}>{inr(b.paid)}</span> },
    { id: "balance", header: "Balance Due", accessor: b => b.balance, align: "end", priority: 1, cell: (_v, b) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: b.balance > 0 ? T.crimson : T.taupe }}>{b.balance > 0 ? inr(b.balance) : "—"}</span> },
    { id: "status", header: "Status", accessor: b => b.status, type: "status", cell: (_v, b) => <DomainStatusPill taxonomy="payment" status={BILL_STATUS_KEY[b.status]} /> },
  ];

  const txnColumns: ColumnDef<VendorPaymentTxn>[] = [
    { id: "id", header: "Txn ID", accessor: p => p.id, priority: 1, cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>{p.id}</span> },
    { id: "billId", header: "Against Bill", accessor: p => p.billId, priority: 3, cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{p.billId}</span> },
    { id: "date", header: "Date", accessor: p => p.date, priority: 3, cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</span> },
    {
      id: "mode", header: "Mode", accessor: p => p.mode, priority: 3,
      cell: (_v, p) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "2px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: PAY_MODE_FILL[p.mode] ?? T.taupe }} />
          {p.mode}
        </span>
      ),
    },
    { id: "reference", header: "UTR / Reference", accessor: p => p.reference, priority: 3, cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{p.reference}</span> },
    { id: "firm", header: "Paying Firm", accessor: p => p.firm, priority: 3, cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.firm}</span> },
    { id: "recordedBy", header: "Recorded By", accessor: p => formatRecordedBy(p.recordedBy), priority: 3, cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{formatRecordedBy(p.recordedBy)}</span> },
    { id: "amount", header: "Amount", accessor: p => p.amount, align: "end", cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.greenMid }}>{inr(p.amount)}</span> },
  ];

  return (
    <div className="px-3 sm:px-7 xl:px-14 py-4 sm:py-8">
      <div className="mb-3 sm:mb-4">
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "vendors", label: "Vendors", onClick: onBack },
            { key: "vendor", label: vendor.name },
          ]}
        />
      </div>

      {/* Header row with Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-[var(--border-default)] shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-[10px] border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white active:bg-[#4A061B] active:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft size={16} /> Back to Vendors
          </Button>

          {onDelete && (
            <Button
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete vendor "${vendor.name}"?`,
                  description: "This can't be undone. Vendors with existing purchase orders, bills, or payments can't be deleted — deactivate them instead.",
                  confirmLabel: "Delete Vendor",
                  tone: "danger",
                });
                if (ok) onDelete(vendor);
              }}
              variant="secondary"
              className="sm:hidden h-9 px-3 rounded-[10px] border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white active:bg-red-700 active:text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="hidden xs:flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider whitespace-nowrap">
            <UserRound size={14} className="text-[#6E0F2D]" />
            <span>Vendor Profile</span>
          </div>

          <span className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] flex items-center justify-center font-bold text-xs uppercase tracking-wider whitespace-nowrap shrink-0 ${vendor.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {vendor.status}
          </span>

          <EntityCode type="vendor" value={vendor.code || vendor.id} size="md" className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] bg-[#FFFDF9] border border-[#E8DCC4] text-[#3B2314] font-mono font-bold text-xs flex items-center whitespace-nowrap shrink-0" />

          {onDelete && (
            <Button
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete vendor "${vendor.name}"?`,
                  description: "This can't be undone. Vendors with existing purchase orders, bills, or payments can't be deleted — deactivate them instead.",
                  confirmLabel: "Delete Vendor",
                  tone: "danger",
                });
                if (ok) onDelete(vendor);
              }}
              variant="secondary"
              className="hidden sm:flex h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white active:bg-red-700 active:text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 size={14} /> Delete Vendor
            </Button>
          )}
        </div>
      </div>

      {/* Profile Hero Banner */}
      <div className="mb-6">
        <div className="relative bg-[#0D0207] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,155,71,0.25)]">
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${BG_IMAGE})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.24, pointerEvents: "none"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(74,6,27,0.92) 0%, rgba(13,2,7,0.95) 100%)", pointerEvents: "none" }} />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col lg:flex-row gap-5 lg:gap-7 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap w-full lg:w-auto">
              <div className="relative shrink-0">
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, fontWeight: 700, border: "2px solid rgba(200,155,71,0.45)", boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>
                  {vendor.initials}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                    RAW MATERIAL VENDOR
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                  {vendor.name}
                </h1>
                <div className="mt-2 flex items-center gap-3 flex-wrap text-xs sm:text-sm text-white/70">
                  <span className="flex items-center gap-1.5"><MapPin size={14} color={T.antiqueGold} /> {vendor.city}, {vendor.state}</span>
                  <span className="flex items-center gap-1.5"><Package size={14} color={T.antiqueGold} /> {vendor.type}</span>
                  <StarRating rating={vendor.rating} />
                </div>
              </div>
            </div>

            {/* Metrics Stats Cards */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                  <CreditCard size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Spend</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{moneyVisible ? formatMoney(rupees(realTotalSpend)) : "—"}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Outstanding</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{!moneyVisible ? "—" : formatMoney(rupees(Number(vendor.outstanding) || 0))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto section-nav-scroll pb-1 mb-6 border-b-2 border-[var(--border-default)]">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map(t => {
            const isActive = tab === t.key;
            return (
              <Button
                key={t.key}
                onClick={() => setTab(t.key)}
                variant="tertiary"
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
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === "overview" && (
            <SectionCard
              icon={Boxes}
              title="Vendor Account Overview"
              subtitle={`Key metrics, recent purchase orders, and ratings for ${vendor.name}`}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16 }}>
                  {[
                    { label: "Active Orders", value: orders.filter(o => o.status === "Approved" || o.status === "Pending").length, sub: "In progress", color: T.royalBurgundy },
                    { label: "Total Orders", value: orders.length, sub: lastOrderDate ? `Last order ${lastOrderDate.split("T")[0]}` : "All time", color: T.luxuryBrown },
                    { label: "Pending Bills", value: inr(ledger.outstanding), sub: `${overdueBills.length} overdue`, color: ledger.outstanding > 0 ? T.crimson : T.green },
                    { label: "Rating", value: `${vendor.rating} ★`, sub: "Vendor score", color: T.antiqueGold },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: 20 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: s.color, margin: "6px 0 2px" }}>{s.value}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                  {posLoading ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading purchase orders…</div>
                  ) : posError ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load purchase orders. Please try again.</div>
                  ) : orders.length === 0 ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchase orders yet for this vendor.</div>
                  ) : (
                    <PurchaseOrderHistoryTable orders={orders.slice(0, 2)} />
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {tab === "orders" && (
            <SectionCard
              icon={ShoppingBag}
              title="Full Purchase Order History"
              subtitle={`Full history of all raw material purchase orders issued to ${vendor.name}`}
            >
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderDef}` }}>
                  <DateFilterBar filter={orderDateFilter} onChange={setOrderDateFilter} />
                </div>
                {posLoading ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading purchase orders…</div>
                ) : posError ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load purchase orders. Please try again.</div>
                ) : orders.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchase orders yet for this vendor.</div>
                ) : (
                  <PurchaseOrderHistoryTable orders={orders.filter(o => matchesDateFilter(o.date, orderDateFilter))} />
                )}
              </div>
            </SectionCard>
          )}

          {tab === "payments" && (
            <SectionCard
              icon={CreditCard}
              title="Vendor Ledger & Payments"
              subtitle={`Settlement progress, invoice-wise bills, and payment transactions for ${vendor.name}`}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16 }}>
                  {[
                    { label: "Paid in Range", value: inr(paidInRange), color: T.greenMid, sub: `${filteredTxns.length} transaction${filteredTxns.length === 1 ? "" : "s"}` },
                    { label: "Paid All Time", value: inr(ledger.totalPaid), color: T.luxuryBrown, sub: `of ${inr(ledger.totalBilled)} billed` },
                    { label: "Outstanding", value: inr(ledger.outstanding), color: ledger.outstanding > 0 ? T.crimson : T.green, sub: ledger.outstanding > 0 ? "Awaiting settlement" : "Fully settled" },
                    { label: "Overdue Bills", value: String(overdueBills.length), color: overdueBills.length ? T.crimson : T.green, sub: `Terms ${vendor.terms}` },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "18px 20px" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>Settlement Progress</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>
                      {ledger.totalBilled ? Math.round((ledger.totalPaid / ledger.totalBilled) * 100) : 0}% cleared
                    </div>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: T.silkCream, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
                    <div style={{ width: `${ledger.totalBilled ? (ledger.totalPaid / ledger.totalBilled) * 100 : 0}%`, height: "100%", background: `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 8 }}>
                    <span>Paid {inr(ledger.totalPaid)}</span>
                    <span>Billed {inr(ledger.totalBilled)}</span>
                  </div>
                  {modeSplit.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 16, borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, flexWrap: "wrap" as const }}>
                      {modeSplit.map(m => (
                        <div key={m.mode} style={{ display: "flex", alignItems: "center", gap: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 20, padding: "6px 14px" }}>
                          <div style={{ width: 9, height: 9, borderRadius: 3, background: PAY_MODE_FILL[m.mode] ?? T.taupe }} />
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{m.mode}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{inr(m.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "16px 22px 2px" }}>
                  <DateFilterBar filter={payFilter} onChange={setPayFilter} />
                </div>

                <div className="w-full max-w-full min-w-0 overflow-x-auto border border-[var(--border-default)] rounded-2xl bg-white shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-sm text-[#3B2314]">Invoice-wise Settlement</span>
                    <span className="text-xs text-[var(--text-tertiary)]">Terms: {vendor.terms}</span>
                  </div>
                  {ledgerLoading ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading bills…</div>
                  ) : ledgerError ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load bills. Please try again.</div>
                  ) : filteredBills.length === 0 ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No bills raised in this period.</div>
                  ) : (
                    <div className="min-w-[650px]">
                      <DataTable responsive={false} columns={billColumns} data={filteredBills} getRowId={b => b.id} emptyTitle="No bills raised in this period." pagination />
                    </div>
                  )}
                </div>

                <div className="w-full max-w-full min-w-0 overflow-x-auto border border-[var(--border-default)] rounded-2xl bg-white shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-sm text-[#3B2314]">Payments Made</span>
                    <span className="font-mono font-bold text-xs text-emerald-700">{inr(paidInRange)}</span>
                  </div>
                  {ledgerLoading ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading payments…</div>
                  ) : ledgerError ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load payments. Please try again.</div>
                  ) : filteredTxns.length === 0 ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments in this period.</div>
                  ) : (
                    <div className="min-w-[650px]">
                      <DataTable responsive={false} columns={txnColumns} data={filteredTxns} getRowId={p => p.id} emptyTitle="No payments in this period." pagination />
                    </div>
                  )}
                </div>

                {overdueBills.length > 0 && (
                  <div style={{ background: T.crimsonBg, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 14, padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <AlertTriangle size={16} color={T.crimson} />
                      <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.crimson }}>
                        {overdueBills.length} bill{overdueBills.length > 1 ? "s" : ""} past the agreed {vendor.terms} terms
                      </span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                      {overdueBills.map(b => `${b.id} — ${inr(b.balance)} (${b.daysOverdue}d)`).join(" · ")}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {tab === "contact" && (
            <SectionCard
              icon={UserCheck}
              title="Vendor Contact & Bank Details"
              subtitle={`Official address, GSTIN, phone, and banking records for ${vendor.name}`}
            >
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Left Column: Details Cards */}
                <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Core Contact Card */}
                  <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}>Owner / Contact</div>
                        <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, marginTop: 4 }}>{vendor.contactName || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><FileText size={14} /> GSTIN</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: T.royalBurgundy, marginTop: 4 }}>{vendor.gstCode || "Unregistered"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} /> Phone Number</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: T.luxuryBrown, marginTop: 4 }}>{vendor.phone || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><MessageSquare size={14} /> WhatsApp</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: T.luxuryBrown, marginTop: 4 }}>{vendor.whatsapp || "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Address Card */}
                  <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                      <MapPin size={18} color={T.antiqueGold} /> Billing Address
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 15, color: T.luxuryBrown, lineHeight: 1.6 }}>
                      {vendor.address ? (
                        <>
                          {vendor.address}
                          <br />
                          {vendor.city}{vendor.city && vendor.state ? ", " : ""}{vendor.state}
                        </>
                      ) : "No address provided."}
                    </div>
                  </div>

                  {/* Financials & Notes Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <Landmark size={18} color={T.taupe} /> Bank Details
                      </div>
                      {(vendor.bankName || vendor.accountNo || vendor.ifscCode) ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div>
                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Bank:</span>
                            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 500 }}>{vendor.bankName || "—"}</div>
                          </div>
                          <div>
                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Account:</span>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.luxuryBrown }}>{vendor.accountNo || "—"}</div>
                          </div>
                          <div>
                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>IFSC:</span>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.luxuryBrown }}>{vendor.ifscCode || "—"}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>No bank details on file.</div>
                      )}
                    </div>
                    <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <StickyNote size={18} color={T.taupe} /> Special Instructions
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.6 }}>
                        {vendor.notes || "No special notes or instructions for this vendor."}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Visiting Card */}
                <div style={{ flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 14 }}>Visiting Card</div>
                    {vendor.visitingCard ? (
                      <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer", transition: "transform 0.2s ease" }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        onClick={() => {
                          const el = document.createElement("a");
                          el.href = vendor.visitingCard!;
                          el.target = "_blank";
                          el.click();
                        }} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.open(vendor.visitingCard!, "_blank"); } }}>
                        <img src={vendor.visitingCard} alt="Visiting Card" style={{ width: "100%", height: 200, objectFit: "cover" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)", color: "#fff", fontFamily: F.ui, fontSize: 13, padding: "24px 16px 12px", textAlign: "center", fontWeight: 500 }}>
                          Click to Expand
                        </div>
                      </div>
                    ) : (
                      <div style={{ border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", background: T.silkCream }}>
                        No visiting card uploaded.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </SectionCard>
          )}

          {tab === "edit" && (
            <SectionCard
              icon={Edit3}
              title="Edit Vendor Profile"
              subtitle={`Update contact details, bank credentials, and status for ${vendor.name}`}
            >
              <VendorEditFormTab vendor={vendor} onUpdate={onUpdate} />
            </SectionCard>
          )}
        </motion.div>
      </AnimatePresence>
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
}
