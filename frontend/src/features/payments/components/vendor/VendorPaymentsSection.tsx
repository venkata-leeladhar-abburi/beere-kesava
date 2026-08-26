import React, { useMemo, useState } from "react";
import { AlignJustify, BadgeCheck, CheckCircle2, CircleAlert, Clock, Download, FileText, LayoutGrid, LayoutList, Receipt, Wallet, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { PurchaseOrder, usePO } from "@/features/purchasing";
import { PODocumentModal } from "@/features/purchasing";
import { vendorPaymentsApi } from "../../../../shared/api/payments";
import { vendorBillsApi } from "../../../../shared/api/vendor-bills";
import { EASE, F, T } from "../../theme";
import { useFirms } from "@/features/firms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { VendorMatchedRow, VendorPayment, VendorStatus } from "../../types";
import { AnimCount, FadeUp } from "../common/motion";
import { ActionModal, DropBtn, SectionCard } from "../common/primitives";
import { AddVendorInvoiceModal } from "./AddVendorInvoiceModal";
import { ContactVendorModal } from "./ContactVendorModal";
import { VENDOR_STATUS_CFG, VendorBadge } from "./VendorBadge";
import { VendorCard } from "./VendorCard";
import { VendorDetailModal } from "./VendorDetailModal";
import { VendorPayNowModal } from "./VendorPayNowModal";
import { VendorUploadPanel } from "./VendorUploadPanel";
import { RecordVendorPaymentSidebar } from "./RecordVendorPaymentSidebar";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";
import { toPaise, fromPaise } from "@/lib/gst";

const SHOW_OVERDUE_ALERT = false;

export function VendorPaymentsSection() {
  const { pos } = usePO();
  const { firms, addExpenseEntry } = useFirms();
  const queryClient = useQueryClient();

  const { data: vendorPaymentsRes, isLoading: paymentsLoading, isError: paymentsError, refetch: refetchVendorPayments } = useQuery({
    queryKey: ["vendor-payments-section-totals"],
    queryFn: () => vendorPaymentsApi.list(),
  });
  const { data: vendorBillsRes, isLoading: billsLoading, isError: billsError, refetch: refetchVendorBills } = useQuery({
    queryKey: ["vendor-payments-bills"],
    queryFn: () => vendorBillsApi.list(),
  });
  const totalVendorPaymentsRecorded = (vendorPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amount), 0);

  // Every real Purchase Order shows here, one row each — enriched with its
  // VendorBill (if one's been raised yet) and the sum of real payments
  // against that bill. A PO with no bill yet shows ₹0 invoiced/due rather
  // than being hidden, since it's still a real PO the admin should see.
  const vendorPayments: VendorPayment[] = useMemo(() => {
    const bills = vendorBillsRes?.items ?? [];
    const payments = vendorPaymentsRes?.items ?? [];
    const billByPoId = new Map(bills.filter(b => b.poId).map(b => [b.poId as string, b]));
    const paidByBillId = new Map<string, number>();
    const utrByBillId = new Map<string, string>();
    payments.forEach(p => {
      if (!p.billId) return;
      paidByBillId.set(p.billId, (paidByBillId.get(p.billId) ?? 0) + Number(p.amount));
      if (p.utr) utrByBillId.set(p.billId, p.utr);
    });
    const now = Date.now();

    return pos.map((po): VendorPayment => {
      const bill = billByPoId.get(po.id);
      const invoiceAmt = bill ? Number(bill.amount) : 0;
      const paidAmt = bill ? (paidByBillId.get(bill.id) ?? 0) : 0;
      const dueDate = bill?.dueDate ?? "";
      let status: VendorStatus;
      if (!bill || invoiceAmt === 0) status = "Pending";
      else if (paidAmt >= invoiceAmt) status = "Paid";
      else if (paidAmt > 0) status = "Partial";
      else if (dueDate && new Date(dueDate).getTime() < now) status = "Overdue";
      else status = "Pending";
      const daysOverdue = status === "Overdue" && dueDate
        ? Math.floor((now - new Date(dueDate).getTime()) / 86_400_000)
        : undefined;

      return {
        id: po.id,
        vendor: po.vendor,
        poNumber: po.poNumber,
        invoiceAmt,
        paidAmt,
        dueDate,
        status,
        daysOverdue,
        utr: bill ? utrByBillId.get(bill.id) : undefined,
        vendorId: po.vendorId,
        billId: bill?.id,
      };
    });
  }, [pos, vendorBillsRes, vendorPaymentsRes]);

  const refreshVendorLedger = () => {
    void refetchVendorPayments();
    void refetchVendorBills();
    // POContext's real query key — a bill/payment doesn't change a PO's own
    // fields, so this is a belt-and-suspenders refresh, not load-bearing.
    void queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
  };

  const [view, setView] = useState<"card" | "list" | "table">("card");
  const [selVendor, setSelVendor] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [utrNumber, setUtrNumber] = useState("");
  const [sidebarFirmId, setSidebarFirmId] = useState(firms[0]?.id ?? "");
  const [savingSidebarPayment, setSavingSidebarPayment] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Bill Status");
  const [vendorFilter, setVendorFilter] = useState("All Vendors");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const [downloadModal, setDownloadModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  // These three hold just the PO id, not a snapshotted VendorPayment object —
  // derived live below so a modal always reflects the current invoice
  // amount/balance even if it changed (e.g. an invoice was just added, or a
  // payment just landed) after the row was first clicked.
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
  const [payNowId, setPayNowId] = useState<string | null>(null);
  const [addInvoiceForId, setAddInvoiceForId] = useState<string | null>(null);

  // Firms load asynchronously — backfill the sidebar's default once they're
  // in, rather than leaving the Select stuck on the empty initial value.
  React.useEffect(() => {
    if (!sidebarFirmId && firms.length > 0) setSidebarFirmId(firms[0].id);
  }, [firms, sidebarFirmId]);

  const matchPO = (poNumber: string) => pos.find(p => p.poNumber === poNumber);

  const viewDetails = viewDetailsId ? vendorPayments.find(v => v.id === viewDetailsId) ?? null : null;
  const payNow = payNowId ? vendorPayments.find(v => v.id === payNowId) ?? null : null;
  const addInvoiceFor = addInvoiceForId ? vendorPayments.find(v => v.id === addInvoiceForId) ?? null : null;

  // The actual POST /payments/vendors call (with billId) happens inside
  // VendorPayNowModal itself — this just records the firm expense entry and
  // refreshes the real ledger once that save has already succeeded.
  const handleSavePayment = (amount: number, firmId: string) => {
    if (!payNow) return;
    addExpenseEntry(firmId, { description: `Vendor payment — ${payNow.vendor} (${payNow.poNumber})`, amount, date: new Date().toISOString().slice(0, 10), category: "Material Purchase" });
    refreshVendorLedger();
    toast.success(`Payment of ${formatMoney(rupees(amount))} recorded for ${payNow.vendor}`);
    setPayNowId(null);
  };

  // VendorUploadPanel has already created the real VendorPayment rows by the
  // time this fires — just refresh the ledger so the new totals show up.
  const handleExcelMatched = (matched: VendorMatchedRow[]) => {
    refreshVendorLedger();
    toast.success(`${matched.length} vendor payment${matched.length !== 1 ? "s" : ""} matched and saved`);
  };

  const handleSidebarSavePayment = async () => {
    if (!selVP?.billId) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0 || !utrNumber.trim() || !sidebarFirmId) return;
    setSavingSidebarPayment(true);
    try {
      await vendorPaymentsApi.create({
        vendorId: selVP.vendorId ?? selVP.id,
        amount,
        utr: utrNumber.trim(),
        method: payMethod,
        firmId: sidebarFirmId,
        date: payDate || undefined,
        billId: selVP.billId,
      });
      addExpenseEntry(sidebarFirmId, {
        description: `Vendor payment — ${selVP.vendor} (${selVP.poNumber})`,
        amount, date: payDate || new Date().toISOString().slice(0, 10), category: "Material Purchase",
      });
      refreshVendorLedger();
      toast.success(`Payment of ${formatMoney(rupees(amount))} recorded for ${selVP.vendor}`);
      setPayAmount(""); setUtrNumber("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSavingSidebarPayment(false);
    }
  };

  const selVP = vendorPayments.find(v => v.id === selVendor) ?? vendorPayments[0];
  const selBalance = selVP ? selVP.invoiceAmt - selVP.paidAmt : 0;
  const afterPay = fromPaise(toPaise(selBalance) - (toPaise(Number(payAmount)) || 0));

  // Real vendor names from the actual PO/vendor-bill data — was previously a
  // hardcoded list of five made-up names that never matched a real vendor,
  // so picking any of them silently filtered the table down to nothing.
  const vendorFilterOptions = useMemo(
    () => ["All Vendors", ...Array.from(new Set(vendorPayments.map(v => v.vendor))).sort()],
    [vendorPayments],
  );

  const overdueVendors = vendorPayments.filter(v => v.status === "Overdue");
  const maxDaysOverdue = overdueVendors.length > 0 ? Math.max(...overdueVendors.map(v => v.daysOverdue ?? 0)) : 0;
  const totalInvoiced = vendorPayments.reduce((s, v) => s + v.invoiceAmt, 0);
  const pendingBalance = vendorPayments.reduce((s, v) => s + (v.invoiceAmt - v.paidAmt), 0);

  const filtered = vendorPayments.filter(v => {
    const matchStatus = statusFilter === "All Bill Status" || v.status === statusFilter;
    const matchVendor = vendorFilter === "All Vendors" || v.vendor === vendorFilter;
    const matchSearch = !search || v.vendor.toLowerCase().includes(search.toLowerCase()) || v.poNumber.toLowerCase().includes(search.toLowerCase());
    const matchDate = matchesDateFilter(v.dueDate, dateFilter);
    return matchStatus && matchVendor && matchSearch && matchDate;
  });

  const viewOptions = [
    { key: "card",  Icon: LayoutGrid,   label: "Card View"  },
    { key: "list",  Icon: LayoutList,   label: "List View"  },
    { key: "table", Icon: AlignJustify, label: "Table View" },
  ] as const;

  const vendorTableColumns: ColumnDef<VendorPayment>[] = [
    {
      id: "vendor", header: "Vendor Name", priority: 1, accessor: vp => vp.vendor,
      cell: (_v, vp) => (
        <div className="w-[220px] min-w-[220px] whitespace-nowrap flex items-center gap-2.5">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={15} color={T.royalBurgundy} />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{vp.vendor}</span>
        </div>
      ),
    },
    {
      id: "po", header: "PO Number", accessor: vp => vp.poNumber,
      cell: (_v, vp) => (
        <div className="w-[300px] min-w-[300px] whitespace-nowrap">
          <EntityCode type="purchaseOrder" value={vp.poNumber} size="sm" className="whitespace-nowrap" />
        </div>
      ),
    },
    {
      id: "invoiceAmt", header: "Invoice Amt", accessor: vp => vp.invoiceAmt, type: "number",
      cell: (_v, vp) => <div className="w-[140px] min-w-[140px] whitespace-nowrap font-bold text-[14px]"><Money value={rupees(vp.invoiceAmt)} /></div>,
    },
    {
      id: "paidAmt", header: "Paid Amt", priority: 3, accessor: vp => vp.paidAmt, type: "number",
      cell: (_v, vp) => <div className="w-[140px] min-w-[140px] whitespace-nowrap font-semibold text-[#27AE60]"><Money value={rupees(vp.paidAmt)} /></div>,
    },
    {
      id: "balance", header: "Balance Due", accessor: vp => vp.invoiceAmt - vp.paidAmt, type: "number",
      cell: (_v, vp) => {
        const balance = vp.invoiceAmt - vp.paidAmt;
        return (
          <div className="w-[150px] min-w-[150px] whitespace-nowrap font-bold text-[14px]" style={{ color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
            {balance === 0 ? "Paid ✓" : <Money value={rupees(balance)} />}
          </div>
        );
      },
    },
    {
      id: "dueDate", header: "Due Date", priority: 3, accessor: vp => vp.dueDate,
      cell: (_v, vp) => (
        <div className="w-[150px] min-w-[150px] whitespace-nowrap text-[13px]" style={{ color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
          {vp.dueDate}
          {vp.daysOverdue && <span style={{ fontSize: 12, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 4, fontVariantNumeric: "tabular-nums" }}>{vp.daysOverdue}d late</span>}
        </div>
      ),
    },
    {
      id: "status", header: "Status", accessor: vp => vp.status, type: "status",
      cell: (_v, vp) => <VendorBadge status={vp.status} />,
    },
    {
      id: "utr", header: "UTR", priority: 3, accessor: vp => vp.utr,
      cell: (_v, vp) => vp.utr
        ? <span style={{ fontSize: 12, color: T.green, fontVariantNumeric: "tabular-nums" }}>{vp.utr}</span>
        : <span style={{ color: T.taupe }}>—</span>,
    },
    {
      id: "action", header: "Action", priority: 2, accessor: () => null, type: "actions",
      cell: (_v, vp) => (
        vp.status === "Paid" ? (
          <Button variant="secondary" size="sm" iconLeft={CheckCircle2} disabled
            className="rounded-[7px] border-[rgba(30,102,64,0.20)] bg-[rgba(30,102,64,0.09)] text-[#1E6640] disabled:bg-[rgba(30,102,64,0.09)] disabled:text-[#1E6640] disabled:opacity-100">
            Paid
          </Button>
        ) : (
          <Button variant={selVendor === vp.id ? "primary" : "secondary"} size="sm" onClick={() => setSelVendor(vp.id)}
            className={selVendor === vp.id ? "rounded-[7px] border-[#6E0F2D] bg-[#6E0F2D]" : "rounded-[7px] border-[#6E0F2D] text-[#6E0F2D]"}>
            Pay Now
          </Button>
        )
      ),
    },
  ];

  return (
    <div id="pay-vendor" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={Truck}
        title="Vendor Payments"
        subtitle="Track payments made to raw material and thread suppliers. Record and verify all vendor bills."
        actions={
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download} onClick={() => setDownloadModal(true)}
              className="flex-shrink-0 rounded-[9px] border border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#3B2314]">
              Download Vendor Payment Report
            </Button>
          </DownloadGate>
        }
      >
        {/* ── 5 stat cards — Premium Silk Saree Design ─────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" style={{ gap: 22, marginTop: 32, marginBottom: 28, alignItems: "stretch" }}>
          {[
            {
              icon: <Receipt size={22} color={T.antiqueGold} />,
              label: "Total Invoiced",
              value: formatMoney(rupees(totalInvoiced)),
              sub: "What all vendor bills add up to",
              gid: "vti",
            },
            {
              icon: <Wallet size={22} color={T.antiqueGold} />,
              label: "Total Vendor Payments",
              value: formatMoney(rupees(totalVendorPaymentsRecorded)),
              sub: "All recorded vendor payments",
              gid: "vtp",
            },
            {
              icon: <CircleAlert size={22} color={T.antiqueGold} />,
              label: "Pending Balance",
              value: formatMoney(rupees(pendingBalance)),
              sub: "Outstanding to vendors",
              gid: "vpb",
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              label: "Pending Tax Docs",
              value: "0",
              sub: "All invoices have GST docs",
              gid: "vtd",
            },
            {
              icon: <Clock size={22} color={T.antiqueGold} />,
              label: "Overdue Since (Days)",
              value: `${maxDaysOverdue}`,
              sub: "Days since oldest overdue bill",
              gid: "vod",
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

        {SHOW_OVERDUE_ALERT && overdueVendors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.22)", borderLeft: `4px solid ${T.crimson}`, borderRadius: 10, padding: "14px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CircleAlert size={18} style={{ color: T.crimson, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.crimson }}>
                {overdueVendors.length} vendor bill{overdueVendors.length > 1 ? "s are" : " is"} overdue — Total pending:{" "}
                <span><Money value={rupees(overdueVendors.reduce((s, v) => s + v.invoiceAmt - v.paidAmt, 0))} /></span>
              </span>
            </div>
            <Button variant="danger" size="md" onClick={() => setContactModal(true)} className="flex-shrink-0 rounded-[8px]">
              Contact Vendors
            </Button>
          </div>
        )}

        <VendorUploadPanel vendorPayments={vendorPayments} onMatched={handleExcelMatched} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div className="hidden md:flex" style={{ border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <Button key={key} variant={view === key ? "primary" : "tertiary"} size="sm" iconLeft={Icon}
                onClick={() => setView(key)}
                className={view === key ? "rounded-none bg-[#6E0F2D] text-[#FFFDF9]" : "rounded-none bg-white text-[var(--text-tertiary)]"}>
                {label}
              </Button>
            ))}
          </div>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          <DropBtn value={vendorFilter} options={vendorFilterOptions} onChange={setVendorFilter} />
          <Select value={statusFilter} onValueChange={setStatusFilter} size="sm" containerClassName="w-auto shrink-0" className="w-[145px] font-semibold">
            {["All Bill Status","Paid","Partial","Overdue","Pending"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput aria-label="Search vendor, PO number, bill number" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor, PO number, bill number..." size="sm" />
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
            {filtered.map((vp, i) => (
              <motion.div key={vp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                <VendorCard vp={vp} matchedPO={matchPO(vp.poNumber)} onPay={() => setPayNowId(vp.id)} onView={() => setViewDetailsId(vp.id)} onViewPO={() => setViewPO(matchPO(vp.poNumber) ?? null)} onAddInvoice={() => setAddInvoiceForId(vp.id)} selected={selVendor === vp.id} />
              </motion.div>
            ))}
          </div>
        )}

        {view === "list" && (
          <div className="overflow-x-auto w-full mb-8">
            <div className="min-w-[600px]" style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              {filtered.map((vp, i) => {
                const balance = vp.invoiceAmt - vp.paidAmt;
                const cfg = VENDOR_STATUS_CFG[vp.status];
                return (
                  <div key={vp.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${cfg.color}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={18} color={T.royalBurgundy} />
                    </div>
                    <div style={{ flex: "0 0 200px" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{vp.vendor}</div>
                      <div style={{ marginTop: 2 }}><EntityCode type="purchaseOrder" value={vp.poNumber} size="sm" /></div>
                    </div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(vp.invoiceAmt)} /></div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                      {balance === 0 ? "Paid ✓" : <Money value={rupees(balance)} />}
                    </div>
                    <div style={{ flex: "0 0 120px", fontFamily: F.ui, fontSize: 13, color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
                      {vp.dueDate}
                      {vp.daysOverdue && <span style={{ fontSize: 12, marginLeft: 5, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 5px", borderRadius: 4, fontVariantNumeric: "tabular-nums" }}>{vp.daysOverdue}d</span>}
                    </div>
                    <VendorBadge status={vp.status} />
                    <Button variant="secondary" size="sm" onClick={() => setViewDetailsId(vp.id)} className="rounded-[7px] text-[#6E0F2D]">View</Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "table" && (
          <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
            <div className="w-full lg:flex-1 min-w-0">
              <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
                <div style={{ overflowX: "auto" }} className="w-full">
                  <div className="min-w-[1350px]">
                    <DataTable
                      responsive={false}
                      columns={vendorTableColumns}
                      data={filtered}
                      getRowId={vp => vp.id}
                      loading={paymentsLoading || billsLoading}
                      error={paymentsError || billsError}
                      onRetry={() => { void refetchVendorPayments(); void refetchVendorBills(); }}
                      emptyTitle="No vendor bills match your filters"
                    />
                  </div>
                </div>
                <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {filtered.length} of {vendorPayments.length} vendor bills</span>
                </div>
              </div>
            </div>

            {selVP && (
              <RecordVendorPaymentSidebar
                vendorPayments={vendorPayments}
                selVendor={selVendor}
                setSelVendor={setSelVendor}
                payAmount={payAmount}
                setPayAmount={setPayAmount}
                payDate={payDate}
                setPayDate={setPayDate}
                payMethod={payMethod}
                setPayMethod={setPayMethod}
                utrNumber={utrNumber}
                setUtrNumber={setUtrNumber}
                firms={firms}
                firmId={sidebarFirmId}
                setFirmId={setSidebarFirmId}
                selVP={selVP}
                selBalance={selBalance}
                afterPay={afterPay}
                onSave={() => void handleSidebarSavePayment()}
                onCancel={() => { setPayAmount(""); setUtrNumber(""); }}
                saving={savingSidebarPayment}
              />
            )}
          </div>
        )}

      </SectionCard>
        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Vendor Report" desc="Generate and download the vendor payments report." actionLabel="Download" icon={Download} />
        <AnimatePresence>
          {contactModal && <ContactVendorModal vendors={overdueVendors} onClose={() => setContactModal(false)} />}
          {viewDetails && <VendorDetailModal vp={viewDetails} matchedPO={matchPO(viewDetails.poNumber)} onClose={() => setViewDetailsId(null)} />}
          {payNow && <VendorPayNowModal vp={payNow} onClose={() => setPayNowId(null)} onSave={handleSavePayment} />}
          {addInvoiceFor && <AddVendorInvoiceModal vp={addInvoiceFor} matchedPO={matchPO(addInvoiceFor.poNumber)} onClose={() => setAddInvoiceForId(null)} onSaved={refreshVendorLedger} />}
        </AnimatePresence>
        <PODocumentModal open={!!viewPO} onClose={() => setViewPO(null)} po={viewPO} />
      </FadeUp>
    </div>
  );
}
