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
import { EASE, F, T, useFirms, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
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

  const { data: vendorPaymentsRes, refetch: refetchVendorPayments } = useQuery({
    queryKey: ["vendor-payments-section-totals"],
    queryFn: () => vendorPaymentsApi.list(),
  });
  const { data: vendorBillsRes, refetch: refetchVendorBills } = useQuery({
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
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Receipt size={22} color={T.luxuryBrown} />,
              iconBg: "rgba(59,35,20,0.08)",
              label: "Total Invoiced",
              value: formatMoney(rupees(totalInvoiced)),
              sub: "What all vendor bills add up to",
              hi: false, crimson: false, green: false,
            },
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Vendor Payments",
              value: formatMoney(rupees(totalVendorPaymentsRecorded)),
              sub: "All recorded vendor payments",
              hi: false, crimson: false, green: false,
            },
            {
              icon: <CircleAlert size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Pending Balance",
              value: formatMoney(rupees(pendingBalance)),
              sub: "Outstanding to vendors",
              hi: false, crimson: true, green: false,
            },
            {
              icon: <BadgeCheck size={22} color={T.green} />,
              iconBg: "rgba(30,102,64,0.08)",
              label: "Pending Tax Docs",
              value: "0",
              sub: "All invoices have GST docs",
              hi: false, crimson: false, green: true,
            },
            {
              icon: <Clock size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Overdue Since (Days)",
              value: `${maxDaysOverdue}`,
              sub: "Days since oldest overdue bill",
              hi: true, crimson: false, green: false,
            },
          ].map((s) => (
            <div key={s.label} style={{ background: s.hi ? "linear-gradient(135deg,rgba(200,155,71,0.14),rgba(200,155,71,0.04))" : "#FFFFFF", borderRadius: 14, border: `1px solid ${s.hi ? T.borderGold : T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
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
          <DropBtn value={vendorFilter} options={vendorFilterOptions} onChange={setVendorFilter} />
          <Select value={statusFilter} onValueChange={setStatusFilter} size="sm">
            {["All Bill Status","Paid","Partial","Overdue","Pending"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput aria-label="Search vendor, PO number, bill number" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor, PO number, bill number..." size="sm" />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
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
            <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", minWidth: 600 }}>
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
                  <div style={{ minWidth: 1350 }}>
                    <DataTable
                      responsive={false}
                      columns={vendorTableColumns}
                      data={filtered}
                      getRowId={vp => vp.id}
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
