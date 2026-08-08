import React, { useState } from "react";
import { AlignJustify, BadgeCheck, CheckCircle2, CircleAlert, Clock, Download, FileText, LayoutGrid, LayoutList, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { PurchaseOrder, usePO } from "../../../purchasing/contexts/POContext";
import { PODocumentModal } from "../../../purchasing/components/PODocumentModal";
import { VENDOR_PAYMENTS } from "../../data/vendors";
import { vendorPaymentsApi } from "../../../../shared/api/payments";
import { EASE, F, T, useFirms, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
import { VendorMatchedRow, VendorPayment } from "../../types";
import { AnimCount, FadeUp } from "../common/motion";
import { ActionModal, DropBtn } from "../common/primitives";
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

const SHOW_OVERDUE_ALERT = false;

export function VendorPaymentsSection() {
  const { pos } = usePO();
  const { firms, addExpenseEntry } = useFirms();
  // Real total across GET /payments/vendors — VENDOR_PAYMENTS (the PO/
  // invoice ledger below) has no backend source (see data/vendors.ts), so
  // only this aggregate stat card is wired to live data for now.
  const { data: vendorPaymentsRes } = useQuery({
    queryKey: ["vendor-payments-section-totals"],
    queryFn: () => vendorPaymentsApi.list(),
  });
  const totalVendorPaymentsRecorded = (vendorPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amount), 0);

  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>(VENDOR_PAYMENTS);
  const [view, setView] = useState<"card" | "list" | "table">("card");
  const [selVendor, setSelVendor] = useState("VP-004");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("2026-05-30");
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [utrNumber, setUtrNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Bill Status");
  const [vendorFilter, setVendorFilter] = useState("All Vendors");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const [downloadModal, setDownloadModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [viewDetails, setViewDetails] = useState<VendorPayment | null>(null);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [payNow, setPayNow] = useState<VendorPayment | null>(null);
  const [addInvoiceFor, setAddInvoiceFor] = useState<VendorPayment | null>(null);

  const matchPO = (poNumber: string) => pos.find(p => p.poNumber === poNumber);

  const handleSavePayment = (amount: number, firmId: string, utr: string) => {
    if (!payNow) return;
    setVendorPayments(prev => prev.map(v => v.id === payNow.id
      ? { ...v, paidAmt: Math.min(v.invoiceAmt, v.paidAmt + amount), status: (v.paidAmt + amount) >= v.invoiceAmt ? "Paid" : "Partial", utr }
      : v));
    addExpenseEntry(firmId, { description: `Vendor payment — ${payNow.vendor} (${payNow.poNumber})`, amount, date: new Date().toISOString().slice(0, 10), category: "Material Purchase" });
    toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded for ${payNow.vendor}`);
    setPayNow(null);
  };

  const handleExcelMatched = (matched: VendorMatchedRow[]) => {
    setVendorPayments(prev => prev.map(v => {
      const m = matched.find(x => x.vendorPayment.id === v.id);
      if (!m) return v;
      const newPaid = Math.min(v.invoiceAmt, v.paidAmt + m.amountPaid);
      return { ...v, paidAmt: newPaid, utr: m.utrNumber, status: newPaid >= v.invoiceAmt ? "Paid" : "Partial" };
    }));
    toast.success(`${matched.length} vendor payment${matched.length !== 1 ? "s" : ""} matched and updated`);
  };

  const selVP = vendorPayments.find(v => v.id === selVendor) ?? vendorPayments[0];
  const selBalance = selVP ? selVP.invoiceAmt - selVP.paidAmt : 0;
  const afterPay = selBalance - (parseFloat(payAmount) || 0);

  const overdueVendors = vendorPayments.filter(v => v.status === "Overdue");
  const maxDaysOverdue = overdueVendors.length > 0 ? Math.max(...overdueVendors.map(v => v.daysOverdue ?? 0)) : 0;
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
      id: "vendor", header: "Vendor Name", accessor: vp => vp.vendor,
      cell: (_v, vp) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={15} color={T.royalBurgundy} />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{vp.vendor}</span>
        </div>
      ),
    },
    {
      id: "po", header: "PO Number", accessor: vp => vp.poNumber,
      cell: (_v, vp) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{vp.poNumber}</span>,
    },
    {
      id: "invoiceAmt", header: "Invoice Amt", accessor: vp => vp.invoiceAmt, type: "number",
      cell: (_v, vp) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</span>,
    },
    {
      id: "paidAmt", header: "Paid Amt", accessor: vp => vp.paidAmt, type: "number",
      cell: (_v, vp) => <span style={{ fontFamily: F.mono, color: T.green, fontWeight: 600 }}>₹{vp.paidAmt.toLocaleString("en-IN")}</span>,
    },
    {
      id: "balance", header: "Balance Due", accessor: vp => vp.invoiceAmt - vp.paidAmt, type: "number",
      cell: (_v, vp) => {
        const balance = vp.invoiceAmt - vp.paidAmt;
        return (
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
            {balance === 0 ? "Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
          </span>
        );
      },
    },
    {
      id: "dueDate", header: "Due Date", accessor: vp => vp.dueDate,
      cell: (_v, vp) => (
        <span style={{ color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
          {vp.dueDate}
          {vp.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 12, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 4 }}>{vp.daysOverdue}d late</span>}
        </span>
      ),
    },
    {
      id: "status", header: "Status", accessor: vp => vp.status, type: "status",
      cell: (_v, vp) => <VendorBadge status={vp.status} />,
    },
    {
      id: "utr", header: "UTR", accessor: vp => vp.utr,
      cell: (_v, vp) => vp.utr
        ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.green }}>{vp.utr}</span>
        : <span style={{ color: T.taupe }}>—</span>,
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
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
    <div id="pay-vendor" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>
                Vendor Payments
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 0 16px" }}>
              Track payments made to raw material and thread suppliers. Record and verify all vendor bills.
            </p>
          </div>
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download} onClick={() => setDownloadModal(true)}
              className="flex-shrink-0 rounded-[9px] border border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#3B2314]">
              Download Vendor Payment Report
            </Button>
          </DownloadGate>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Vendor Payments",
              value: `₹${totalVendorPaymentsRecorded.toLocaleString("en-IN")}`,
              sub: "All recorded vendor payments",
              hi: false, crimson: false, green: false,
            },
            {
              icon: <CircleAlert size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Pending Balance",
              value: `₹${pendingBalance.toLocaleString("en-IN")}`,
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
          ].map((s, i) => (
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

        {SHOW_OVERDUE_ALERT && overdueVendors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.22)", borderLeft: `4px solid ${T.crimson}`, borderRadius: 10, padding: "14px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CircleAlert size={18} style={{ color: T.crimson, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.crimson }}>
                {overdueVendors.length} vendor bill{overdueVendors.length > 1 ? "s are" : " is"} overdue — Total pending:{" "}
                <span style={{ fontFamily: F.mono }}>₹{overdueVendors.reduce((s, v) => s + v.invoiceAmt - v.paidAmt, 0).toLocaleString("en-IN")}</span>
              </span>
            </div>
            <Button variant="danger" size="md" onClick={() => setContactModal(true)} className="flex-shrink-0 rounded-[8px]">
              Contact Vendors
            </Button>
          </div>
        )}

        <VendorUploadPanel vendorPayments={vendorPayments} onMatched={handleExcelMatched} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <Button key={key} variant={view === key ? "primary" : "tertiary"} size="sm" iconLeft={Icon}
                onClick={() => setView(key as any)}
                className={view === key ? "rounded-none bg-[#6E0F2D] text-[#FFFDF9]" : "rounded-none bg-white text-[var(--text-tertiary)]"}>
                {label}
              </Button>
            ))}
          </div>
          <DropBtn value={vendorFilter} options={["All Vendors", "Sri Lakshmi Raw Silks", "Banarasi Thread House", "Nanak Silk Traders", "Vijaylakshmi Silks", "Ratan Zari Works"]} onChange={setVendorFilter} />
          <Select value={statusFilter} onValueChange={setStatusFilter} size="sm">
            {["All Bill Status","Paid","Partial","Overdue","Pending"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor, PO number, bill number..." size="sm" />
          </div>
        </div>

        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32, alignItems: "stretch" }}>
            {filtered.map((vp, i) => (
              <motion.div key={vp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                <VendorCard vp={vp} matchedPO={matchPO(vp.poNumber)} onPay={() => setPayNow(vp)} onView={() => setViewDetails(vp)} onViewPO={() => setViewPO(matchPO(vp.poNumber) ?? null)} onAddInvoice={() => setAddInvoiceFor(vp)} selected={selVendor === vp.id} />
              </motion.div>
            ))}
          </div>
        )}

        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32 }}>
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
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, marginTop: 2 }}>{vp.poNumber}</div>
                  </div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                    {balance === 0 ? "Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ flex: "0 0 120px", fontFamily: F.ui, fontSize: 13, color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
                    {vp.dueDate}
                    {vp.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 12, marginLeft: 5, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 5px", borderRadius: 4 }}>{vp.daysOverdue}d</span>}
                  </div>
                  <VendorBadge status={vp.status} />
                  <Button variant="secondary" size="sm" onClick={() => setViewDetails(vp)} className="rounded-[7px] text-[#6E0F2D]">View</Button>
                </div>
              );
            })}
          </div>
        )}

        {view === "table" && (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
                <div style={{ overflowX: "auto" }}>
                  <DataTable
                    columns={vendorTableColumns}
                    data={filtered}
                    getRowId={vp => vp.id}
                    emptyTitle="No vendor bills match your filters"
                  />
                </div>
                <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {filtered.length} of {vendorPayments.length} vendor bills</span>
                </div>
              </div>
            </div>

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
              selVP={selVP}
              selBalance={selBalance}
              afterPay={afterPay}
            />
          </div>
        )}

        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Vendor Report" desc="Generate and download the vendor payments report." actionLabel="Download" icon={Download} />
        <AnimatePresence>
          {contactModal && <ContactVendorModal vendors={overdueVendors} onClose={() => setContactModal(false)} />}
          {viewDetails && <VendorDetailModal vp={viewDetails} matchedPO={matchPO(viewDetails.poNumber)} onClose={() => setViewDetails(null)} />}
          {payNow && <VendorPayNowModal vp={payNow} onClose={() => setPayNow(null)} onSave={handleSavePayment} />}
          {addInvoiceFor && <AddVendorInvoiceModal vp={addInvoiceFor} onClose={() => setAddInvoiceFor(null)} />}
        </AnimatePresence>
        <PODocumentModal open={!!viewPO} onClose={() => setViewPO(null)} po={viewPO} />
      </FadeUp>
    </div>
  );
}
