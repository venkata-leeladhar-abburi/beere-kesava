import React, { useState } from "react";
import { AlignJustify, BadgeCheck, CheckCircle2, CircleAlert, Clock, Download, FileText, LayoutGrid, LayoutList, Search, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { PurchaseOrder, usePO } from "../../../purchasing/contexts/POContext";
import { PODocumentModal } from "../../../purchasing/components/PODocumentModal";
import { VENDOR_PAYMENTS } from "../../data/vendors";
import { EASE, F, T, useFirms, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
import { Invoice, VendorMatchedRow, VendorPayment } from "../../types";
import { AnimCount, FadeUp } from "../common/motion";
import { ActionModal, DropBtn } from "../common/primitives";
import { AddVendorInvoiceModal } from "./AddVendorInvoiceModal";
import { ContactVendorModal } from "./ContactVendorModal";
import { VENDOR_STATUS_CFG, VendorBadge } from "./VendorBadge";
import { VendorCard } from "./VendorCard";
import { VendorDetailModal } from "./VendorDetailModal";
import { VendorPayNowModal } from "./VendorPayNowModal";
import { VendorUploadPanel } from "./VendorUploadPanel";

/** Overdue-vendor banner is built but intentionally not shown yet. */
const SHOW_OVERDUE_ALERT = false;

export function VendorPaymentsSection() {
  const { pos } = usePO();
  const { firms, addExpenseEntry } = useFirms();
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

  const selVP = vendorPayments.find(v => v.id === selVendor) ?? vendorPayments[3];
  const selBalance = selVP.invoiceAmt - selVP.paidAmt;
  const afterPay = selBalance - (parseFloat(payAmount) || 0);

  const overdueVendors = vendorPayments.filter(v => v.status === "Overdue");
  const maxDaysOverdue = Math.max(...overdueVendors.map(v => v.daysOverdue ?? 0));
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

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.7px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "14px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const fieldStyle: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 8, outline: "none", boxSizing: "border-box" as const };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 };

  return (
    <div id="pay-vendor" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Vendor Payments
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Track payments made to raw material and thread suppliers. Record and verify all vendor bills.
            </p>
          </div>
          <DownloadGate>
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => setDownloadModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
              <Download size={15} />Download Vendor Payment Report
            </motion.button>
          </DownloadGate>
        </div>

        {/* ── 4 stat cards ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Vendor Payments",
              value: "₹8,60,000",
              sub: "Paid to vendors this month",
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

        {/* ── Overdue alert (Hidden) ───────────────────────────── */}
        {SHOW_OVERDUE_ALERT && overdueVendors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.22)", borderLeft: `4px solid ${T.crimson}`, borderRadius: 10, padding: "14px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CircleAlert size={18} style={{ color: T.crimson, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.crimson }}>
                {overdueVendors.length} vendor bill{overdueVendors.length > 1 ? "s are" : " is"} overdue — Total pending:{" "}
                <span style={{ fontFamily: F.mono }}>₹{overdueVendors.reduce((s, v) => s + v.invoiceAmt - v.paidAmt, 0).toLocaleString("en-IN")}</span>
              </span>
            </div>
            <button onClick={() => setContactModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: T.crimson, border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer", flexShrink: 0 }}>
              Contact Vendors
            </button>
          </div>
        )}

        {/* ── Upload Vendor Payment File panel ─────────────────── */}
        <VendorUploadPanel vendorPayments={vendorPayments} onMatched={handleExcelMatched} />

        {/* ── View toggle + Filter bar ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <motion.button key={key} onClick={() => setView(key as any)}
                animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}>
                <Icon size={13} />{label}
              </motion.button>
            ))}
          </div>
          <DropBtn value={vendorFilter} options={["All Vendors", "Sri Lakshmi Raw Silks", "Banarasi Thread House", "Nanak Silk Traders", "Vijaylakshmi Silks", "Ratan Zari Works"]} onChange={setVendorFilter} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
            {["All Bill Status","Paid","Partial","Overdue","Pending"].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor, PO number, bill number..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

        {/* ── Card View ────────────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32, alignItems: "stretch" }}>
            {filtered.map((vp, i) => (
              <motion.div key={vp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                <VendorCard vp={vp} matchedPO={matchPO(vp.poNumber)} onPay={() => setPayNow(vp)} onView={() => setViewDetails(vp)} onViewPO={() => setViewPO(matchPO(vp.poNumber) ?? null)} onAddInvoice={() => setAddInvoiceFor(vp)} selected={selVendor === vp.id} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── List View ────────────────────────────────────────── */}
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
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, marginTop: 2 }}>{vp.poNumber}</div>
                  </div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                    {balance === 0 ? "Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ flex: "0 0 120px", fontFamily: F.ui, fontSize: 13, color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
                    {vp.dueDate}
                    {vp.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 10, marginLeft: 5, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 5px", borderRadius: 4 }}>{vp.daysOverdue}d</span>}
                  </div>
                  <VendorBadge status={vp.status} />
                  <button onClick={() => setViewDetails(vp)} style={{ padding: "6px 14px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>View</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Table View + Record Payment sidebar ──────────────── */}
        {view === "table" && (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                    <thead>
                      <tr>
                        <th style={TH}>Vendor Name</th>
                        <th style={TH}>PO Number</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Invoice Amt</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Paid Amt</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Balance Due</th>
                        <th style={TH}>Due Date</th>
                        <th style={{ ...TH, textAlign: "center" as const }}>Status</th>
                        <th style={TH}>UTR</th>
                        <th style={{ ...TH, textAlign: "center" as const }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((vp, i) => {
                        const balance = vp.invoiceAmt - vp.paidAmt;
                        return (
                          <tr key={vp.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${VENDOR_STATUS_CFG[vp.status].color}` }}>
                            <td style={TD}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <FileText size={15} color={T.royalBurgundy} />
                                </div>
                                <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{vp.vendor}</span>
                              </div>
                            </td>
                            <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{vp.poNumber}</span></td>
                            <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</td>
                            <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, color: T.green, fontWeight: 600 }}>₹{vp.paidAmt.toLocaleString("en-IN")}</td>
                            <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                              {balance === 0 ? "Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
                            </td>
                            <td style={{ ...TD, color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
                              {vp.dueDate}
                              {vp.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 11, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 4 }}>{vp.daysOverdue}d late</span>}
                            </td>
                            <td style={{ ...TD, textAlign: "center" as const }}><VendorBadge status={vp.status} /></td>
                            <td style={TD}>
                              {vp.utr
                                ? <span style={{ fontFamily: F.mono, fontSize: 11, color: T.green }}>{vp.utr}</span>
                                : <span style={{ color: T.taupe }}>—</span>}
                            </td>
                            <td style={{ ...TD, textAlign: "center" as const }}>
                              {vp.status === "Paid" ? (
                                <button style={{ padding: "5px 12px", background: "rgba(30,102,64,0.09)", color: T.green, border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "default", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <CheckCircle2 size={11} />Paid
                                </button>
                              ) : (
                                <button onClick={() => setSelVendor(vp.id)}
                                  style={{ padding: "5px 12px", background: selVendor === vp.id ? T.royalBurgundy : "transparent", color: selVendor === vp.id ? "#FFFDF9" : T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                  Pay Now
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {filtered.length} of {vendorPayments.length} vendor bills</span>
                </div>
              </div>
            </div>

            {/* Record Vendor Payment sidebar */}
            <div style={{ flex: "0 0 272px", background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.07)" }}>
              <div style={{ background: T.darkBurgundy, padding: "16px 20px" }}>
                <div style={{ fontFamily: F.display, fontSize: 18, color: "#FFFDF9" }}>Record Vendor Payment</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.55)", marginTop: 3 }}>Mark payment made to a vendor</div>
              </div>
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Select Vendor</label>
                  <select value={selVendor} onChange={e => { setSelVendor(e.target.value); setPayAmount(""); }} style={{ ...fieldStyle }}>
                    {vendorPayments.filter(v => v.status !== "Paid").map(v => (
                      <option key={v.id} value={v.id}>{v.vendor}</option>
                    ))}
                  </select>
                </div>
                {/* Auto-filled info */}
                <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    { label: "PO Number",     val: selVP.poNumber,                         color: T.royalBurgundy },
                    { label: "Invoice Total",  val: `₹${selVP.invoiceAmt.toLocaleString("en-IN")}`, color: T.luxuryBrown },
                    { label: "Previous Paid",  val: `₹${selVP.paidAmt.toLocaleString("en-IN")}`,   color: T.green },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{row.label}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 12.5, color: row.color, fontWeight: 700 }}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: T.borderDef, margin: "2px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>Balance Due</span>
                    <span style={{ fontFamily: F.mono, fontSize: 15, color: T.crimson, fontWeight: 700 }}>₹{selBalance.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Payment Amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 14, color: T.taupe }}>₹</span>
                    <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount paid"
                      style={{ ...fieldStyle, paddingLeft: 26 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Payment Date</label>
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={{ ...fieldStyle }} />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ ...fieldStyle }}>
                    {["Bank Transfer","Cash","Cheque","NEFT/RTGS","UPI"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>UTR Number</label>
                  <input value={utrNumber} onChange={e => setUtrNumber(e.target.value)} placeholder="Bank transaction reference..."
                    style={{ ...fieldStyle }} />
                </div>
                {payAmount && (
                  <div style={{ background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>Balance After This Payment</div>
                    <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: afterPay <= 0 ? T.green : T.royalBurgundy }}>
                      {afterPay <= 0 ? "Fully Paid ✓" : `₹${afterPay.toLocaleString("en-IN")}`}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "9px 0", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} initial={{ backgroundColor: T.royalBurgundy }} animate={{ backgroundColor: T.royalBurgundy }}
                    style={{ flex: 2, padding: "9px 0", background: T.royalBurgundy, border: "none", borderRadius: 9, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                    Save Payment
                  </motion.button>
                </div>
              </div>
            </div>
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
