import React, { useEffect, useState } from "react";
import { AlignJustify, BadgeCheck, CircleAlert, Download, Eye, LayoutGrid, LayoutList, MapPin, Receipt, Search, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { DownloadGate } from "../../../../app/components/DownloadAccess";
import { useFinishing } from "../../../../app/components/FinishingContext";
import { INVOICES } from "../../data/invoices";
import { EASE, F, T, useBulkOrders, BulkOrder, useFirms, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
import { Invoice } from "../../types";
import { AnimCount, FadeUp } from "../common/motion";
import { ActionModal, DropBtn } from "../common/primitives";
import { CustomerCard } from "./CustomerCard";
import { INV_STATUS_CFG, InvBadge } from "./InvBadge";
import { PaymentRemindersModal } from "./PaymentRemindersModal";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { ViewInvoiceModal } from "./ViewInvoiceModal";

export function WholesaleCollectionsSection() {
  const { dispatches } = useFinishing();
  const { bulkOrders } = useBulkOrders();
  const { firms, addIncomeEntry } = useFirms();
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
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

  // Synchronize dispatches
  useEffect(() => {
    setInvoices(prev => {
      const updated = [...prev];
      dispatches.forEach(d => {
        if (d.type === "wholesale" && d.invoiceNumber) {
          const exists = updated.some(i => i.id === d.invoiceNumber);
          if (!exists) {
            updated.push({
              id: d.invoiceNumber,
              customer: d.customerName || "Wholesale Customer",
              city: "Surat",
              invoiceDate: d.invoiceDate || new Date().toLocaleDateString("en-IN"),
              dueDate: d.paymentDueDate || new Date().toLocaleDateString("en-IN"),
              total: d.grandTotal || d.totalAmount || 0,
              paid: 0,
              status: "Pending",
              payments: []
            });
          }
        }
      });
      return updated;
    });
  }, [dispatches]);

  // Match invoice ID (INV-2026-XXX) to bulk order ref (ORD-2026-XXX) by trailing number
  const matchBulkOrder = (invId: string): BulkOrder | undefined => {
    const suffix = invId.split("-").pop();
    return bulkOrders.find(o => o.ref.split("-").pop() === suffix);
  };

  const handleSavePayment = (amount: number, firmId: string, utr: string, date: string, method: string) => {
    if (!recordPayment) return;
    const firm = firms.find(f => f.id === firmId);
    const firmName = firm ? firm.firmName : "Surat Zari Works";

    setInvoices(prev => prev.map(i => {
      if (i.id === recordPayment.id) {
        const newPaid = Math.min(i.total, i.paid + amount);
        const newPayments = [
          ...(i.payments || []),
          { amount, date, utr, method, firmName }
        ];
        return {
          ...i,
          paid: newPaid,
          status: newPaid >= i.total ? "Paid" : "Partial",
          payments: newPayments
        };
      }
      return i;
    }));
    addIncomeEntry(firmId, { description: `Wholesale payment — ${recordPayment.customer} (${recordPayment.id})`, amount, date, category: "Wholesale Sale" });
    toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded for ${recordPayment.customer}`);
    setRecordPayment(null);
  };

  const overdueInvs = invoices.filter(i => i.status === "Overdue");
  const overdueTotal = overdueInvs.reduce((s, i) => s + (i.total - i.paid), 0);

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === "All States" || inv.city === filterState; // close enough
    const matchDate = matchesDateFilter(inv.invoiceDate, dateFilter);
    return matchSearch && matchState && matchDate;
  });

  const viewOptions = [
    { key: "card",  Icon: LayoutGrid,   label: "Card View"  },
    { key: "list",  Icon: LayoutList,   label: "List View"  },
    { key: "table", Icon: AlignJustify, label: "Table View" },
  ] as const;

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.7px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "14px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

  return (
    <div id="pay-wholesale" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ──────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Wholesale Customer Collections
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Track all outstanding and collected payments from wholesale customers.
            </p>
          </div>
          <DownloadGate>
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => setDownloadModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
              <Download size={15} />Download Collections Report
            </motion.button>
          </DownloadGate>
        </div>

        {/* ── 4 stat cards ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Receipt size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Invoiced This Month",
              value: "₹52,80,000",
              sub: "Across all wholesale customers",
              hi: false, crimson: false,
            },
            {
              icon: <CircleAlert size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Total Outstanding",
              value: "₹18,40,000",
              sub: "Yet to be collected",
              hi: false, crimson: true,
            },
            {
              icon: <TrendingUp size={22} color={T.green} />,
              iconBg: "rgba(30,102,64,0.08)",
              label: "Collected This Week",
              value: "₹6,20,000",
              sub: "Payments received this week",
              hi: false, crimson: false, green: true,
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Total Collected This Month",
              value: "₹32,60,000",
              sub: "Payments received this month",
              hi: true, crimson: false,
            },
          ].map((s: any, i) => (
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

        {/* ── Day 45 alert rule info ───────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(200,155,71,0.07)", border: "1px solid rgba(200,155,71,0.25)", borderLeft: `4px solid ${T.antiqueGold}`, borderRadius: 10, padding: "12px 20px", marginBottom: 14 }}>
          <CircleAlert size={16} style={{ color: T.antiqueGold, flexShrink: 0 }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018", lineHeight: 1.55 }}>
            <strong>Payment alert rule:</strong> Days 1–44 = Awaiting Payment (within terms). Day 45+ = ⚠ Follow Up Now. Day 60+ = 🔴 Overdue — Immediate Action Needed.
          </span>
        </div>

        {/* ── Overdue alert banner ─────────────────────────────── */}
        {overdueInvs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.22)", borderLeft: `4px solid ${T.crimson}`, borderRadius: 10, padding: "14px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CircleAlert size={18} style={{ color: T.crimson, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.crimson }}>
                {overdueInvs.length} invoices are overdue (60+ days) — Total overdue amount:{" "}
                <span style={{ fontFamily: F.mono }}>₹{overdueTotal.toLocaleString("en-IN")}</span>
              </span>
            </div>
            <button onClick={() => setRemindersModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: T.crimson, border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer", flexShrink: 0 }}>
              Send Reminders
            </button>
          </div>
        )}

        {/* ── Filter + view toggle ─────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
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
          <DropBtn value={filterState} options={["All States", "Varanasi", "Surat", "Mumbai", "Hyderabad", "Chennai", "Bengaluru"]} onChange={setFilterState} />
          <DropBtn value={filterCust} options={["All Customers", "Lakshmi Silks", "Padmavathi Textiles", "Vijaya Silk House", "Narayana Silk Emporium", "Meenakshi Silks"]} onChange={setFilterCust} />
          <DropBtn value={filterType} options={["All Invoice Types", "Wholesale", "Retail", "Export"]} onChange={setFilterType} />
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice or customer..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

        {/* ── Card grid ────────────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32, alignItems: "stretch" }}>
            {filtered.map((inv, i) => {
              const matchingOrder = matchBulkOrder(inv.id);
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                  <CustomerCard inv={inv} onViewInvoice={() => setViewInvoice(inv)} onRecordPayment={() => setRecordPayment(inv)} bulkOrderRef={matchingOrder?.ref} bulkOrderData={matchingOrder} />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── List view ────────────────────────────────────────── */}
        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32, boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
            {filtered.map((inv, i) => {
              const rem = inv.total - inv.paid;
              return (
                <div
                  key={inv.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                    background: i % 2 === 0 ? "#FFFDF9" : T.silkCream,
                    borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderDef}` : "none",
                    borderLeft: `4px solid ${INV_STATUS_CFG[inv.status].color}`,
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <div style={{ flex: "0 0 130px" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{inv.id}</span>
                  </div>
                  <div style={{ flex: "0 0 230px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{inv.customer}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                      <MapPin size={12} />{inv.city}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice Total</div>
                    <div style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown, fontWeight: 700 }}>₹{inv.total.toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Remaining Due</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13.5, color: rem === 0 ? T.green : T.crimson, fontWeight: 700 }}>
                      {rem === 0 ? "Paid ✓" : `₹${rem.toLocaleString("en-IN")}`}
                    </div>
                  </div>
                  <div style={{ flex: "0 0 130px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 500 }}>{inv.dueDate}</div>
                  </div>
                  <div style={{ flex: "0 0 150px" }}>
                    <InvBadge status={inv.status} />
                  </div>
                  <button
                    onClick={() => setViewInvoice(inv)}
                    style={{
                      padding: "7px 14px", border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8,
                      background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                      color: T.royalBurgundy, cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.04)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(110,15,45,0.12)"; }}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Table view ───────────────────────────────────────── */}
        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={TH}>Invoice ID</th>
                    <th style={TH}>Customer</th>
                    <th style={TH}>City</th>
                    <th style={TH}>Invoice Date</th>
                    <th style={TH}>Due Date</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Total Amount</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Paid Amount</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Remaining Due</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Status</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => {
                    const rem = inv.total - inv.paid;
                    return (
                      <tr key={inv.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${INV_STATUS_CFG[inv.status].color}` }}>
                        <td style={TD}>
                          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{inv.id}</span>
                        </td>
                        <td style={TD}>
                          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{inv.customer}</span>
                        </td>
                        <td style={TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.taupe, fontSize: 13 }}>
                            <MapPin size={12} />{inv.city}
                          </div>
                        </td>
                        <td style={TD}>{inv.invoiceDate}</td>
                        <td style={{ ...TD, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 400 }}>
                          {inv.dueDate}
                          {inv.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 11, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 5 }}>{inv.daysOverdue}d late</span>}
                        </td>
                        <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>₹{inv.total.toLocaleString("en-IN")}</td>
                        <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 600, fontSize: 13, color: T.green }}>₹{inv.paid.toLocaleString("en-IN")}</td>
                        <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: rem === 0 ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                          {rem === 0 ? "Paid ✓" : `₹${rem.toLocaleString("en-IN")}`}
                        </td>
                        <td style={{ ...TD, textAlign: "center" as const }}><InvBadge status={inv.status} /></td>
                        <td style={{ ...TD, textAlign: "center" as const }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button
                              onClick={() => setViewInvoice(inv)}
                              style={{
                                padding: "6px 12px", border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8,
                                background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                                color: T.royalBurgundy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.04)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(110,15,45,0.12)"; }}
                            >
                              <Eye size={12} /> View
                            </button>
                            {inv.status !== "Paid" && (
                              <button
                                onClick={() => setRecordPayment(inv)}
                                style={{
                                  padding: "6px 14px", background: T.royalBurgundy, color: "#FFFDF9",
                                  border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                                  cursor: "pointer", transition: "all 0.2s ease"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = T.deepWine; }}
                                onMouseLeave={e => { e.currentTarget.style.background = T.royalBurgundy; }}
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
                    <td colSpan={5} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, fontSize: 13 }}>
                      Totals — {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>
                      ₹{filtered.reduce((s, inv) => s + inv.total, 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: T.green }}>
                      ₹{filtered.reduce((s, inv) => s + inv.paid, 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.crimson }}>
                      ₹{filtered.reduce((s, inv) => s + (inv.total - inv.paid), 0).toLocaleString("en-IN")}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

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
