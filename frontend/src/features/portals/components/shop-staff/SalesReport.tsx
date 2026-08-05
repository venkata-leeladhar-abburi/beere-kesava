import { XAxis, YAxis, Tooltip, Cell } from "recharts";
import { SectionNavigator, PAGE_SECTIONS } from "../../../../shared/ui/SectionNavigator";
const SHOP_MOBILE_HEADER_H = 60;
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { SectionTitle } from "./theme";
import { FileText, Check } from "lucide-react";


import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown
} from 'lucide-react';

import { C, F, TEAL, Card, Btn, Chip, useCanSeePrices } from './theme';
function SalesReport() {
  const canSeePrices = useCanSeePrices();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "3months">("today");
  const periods = [{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "3months", label: "Last 3 Months" }] as const;

  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [exportDone, setExportDone] = useState(false);

  const dailySales = [
    { time: "11:42 AM", id: "PADMA-L1-004", design: "BKB-045", customer: "Smt. Annapurna", pay: "UPI", amt: "₹8,500", src: "factory" },
    { time: "10:30 AM", id: "RAVI-L2-008", design: "BKB-031", customer: "Sri Ramesh K.", pay: "Card", amt: "₹12,000", src: "factory" },
    { time: "9:45 AM", id: "BKB-L3-002", design: "BKB-022", customer: "Smt. Lakshmi", pay: "Cash", amt: "₹5,500", src: "factory" },
    { time: "9:20 AM", id: "EXT-RAVI-001", design: "External", customer: "Smt. Padmavathi", pay: "UPI", amt: "₹6,200", src: "external" },
    { time: "9:05 AM", id: "PADMA-L1-003", design: "BKB-045", customer: "Smt. Saraswathi", pay: "Cash", amt: "₹8,500", src: "factory" },
  ];

  const totalToday = dailySales.reduce((sum, s) => sum + Number(s.amt.replace(/[₹,]/g, "")), 0);
  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const designData = [
    { design: "BKB-045", count: 84 }, { design: "BKB-031", count: 62 },
    { design: "BKB-022", count: 48 }, { design: "BKB-038", count: 32 }, { design: "Others", count: 22 },
  ];

  const topCustomers = [
    { name: "Smt. Annapurna Devi", purchases: 8, amt: "₹68,000" },
    { name: "Smt. Lakshmi Bai", purchases: 5, amt: "₹42,000" },
    { name: "Smt. Saraswathi", purchases: 4, amt: "₹34,000" },
    { name: "Sri Ramesh K.", purchases: 2, amt: "₹24,500" },
    { name: "Smt. Padmavathi", purchases: 1, amt: "₹12,500" },
  ];

  const returns = [
    { date: "10 Jun", id: "RAVI-L2-007", customer: "Smt. Meenakshi", reason: "Wrong Design", amt: "₹12,000" },
    { date: "05 Jun", id: "PADMA-L1-001", customer: "Smt. Kalpana", reason: "Defective", amt: "₹8,500" },
    { date: "02 Jun", id: "BKB-L3-001", customer: "Sri Venkat", reason: "Changed Mind", amt: "₹5,500" },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · SALES REPORT</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Sales Report</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold, marginBottom: 10 }}>Daily and monthly overview</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.60)", lineHeight: 1.5 }}>This report is also visible to Admin and Superadmin.</div>
      </div>

      <SectionNavigator
        sections={PAGE_SECTIONS.ShopSalesReport}
        stickyTop={SHOP_MOBILE_HEADER_H}
        activeColor={C.burg}
        mutedColor={C.muted}
        borderColor={C.bdr}
        fontFamily={F.u}
        padding="8px 16px"
        layoutId="shop-report-section-pill"
      />

      {/* Stats — stacked cards, no wrapping/truncation */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <div style={{ flex: "1 1 100%", background: C.dark, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "rgba(255,255,255,0.60)", marginBottom: 6 }}>Sarees Sold Today</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: "#FFF", lineHeight: 1 }}>{dailySales.length}</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>13 Jun 2026</div>
        </div>
        {canSeePrices && (
          <>
            <div style={{ flex: "1 1 calc(50% - 5px)", background: C.gold, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: "rgba(26,10,15,0.65)", marginBottom: 6 }}>Revenue Today</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1.2 }}>{fmtINR(totalToday)}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>{dailySales.length} transactions</div>
            </div>
            <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.burg, marginBottom: 6 }}>This Month Revenue</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.burg, lineHeight: 1.2 }}>₹18,40,000</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>June 2026</div>
            </div>
          </>
        )}
        <div style={{ flex: "1 1 100%", background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.crim, marginBottom: 6 }}>Returns This Month</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.crim, lineHeight: 1.1 }}>3 returns</div>
          </div>
          {canSeePrices && <div style={{ fontFamily: F.u, fontSize: 13, color: C.crim, opacity: 0.85 }}>₹26,000</div>}
        </div>
      </div>

      {/* Period toggle */}
      <div style={{ padding: "16px 20px 4px", display: "flex", gap: 8 }}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{ flex: 1, padding: "10px 0", borderRadius: 999, border: `1px solid ${period === p.id ? C.burg : C.bdr}`, background: period === p.id ? C.burg : C.white, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: period === p.id ? "#FFF" : C.muted, cursor: "pointer", whiteSpace: "nowrap" as const }}>{p.label}</button>
        ))}
      </div>

      {/* Daily Sales Table */}
      <div id="shoprep-today-sales" style={{ display: "flex", alignItems: "center", margin: "20px 20px 12px", gap: 10 }}>
        <div style={{ width: 4, height: 20, background: C.burg, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, flex: 1 }}>Today's Sales — 13 Jun 2026</span>
        <button onClick={() => { setExportDone(false); setShowExport(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", boxShadow: "0 2px 10px rgba(107,26,42,0.28)", flexShrink: 0 }}>
          <FileText size={14} color="#FFF" /> Export
        </button>
      </div>
      <Card style={{ margin: "0 20px", overflow: "hidden", padding: 0 }}>
        {dailySales.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "16px", borderBottom: i < dailySales.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, marginBottom: 4 }}>
                <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{s.id}</span>
                <Chip label={s.src === "factory" ? "Factory" : "External"} color={s.src === "factory" ? C.green : C.gold} bg={s.src === "factory" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)"} />
              </div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{s.customer}</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 3 }}>{s.time} · {s.pay}</div>
            </div>
            {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0, textAlign: "right" as const }}>{s.amt}</div>}
          </div>
        ))}
        {/* Total row */}
        {canSeePrices && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: C.cream }}>
            <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Total (Today)</span>
            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{fmtINR(totalToday)}</span>
          </div>
        )}
      </Card>

      {/* Monthly Totals */}
      <SectionTitle id="shoprep-monthly-totals" title="This Month — Jun 2026" />
      <div style={{ margin: "0 20px", display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
        {[
          { label: "Total Sales", val: "248 sarees" },
          ...(canSeePrices ? [
            { label: "Revenue", val: "₹18,40,000" },
            { label: "Avg per sale", val: "₹7,419" },
          ] : []),
          { label: "Returns", val: "3 sarees" },
          ...(canSeePrices ? [{ label: "Net Revenue", val: "₹18,18,000" }] : []),
          { label: "Most sold", val: "BKB-045" },
        ].map((s, i) => (
          <Card key={i} style={{ flex: "1 1 calc(50% - 5px)", padding: "14px 16px" }}>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: i < 3 ? C.text : C.crim }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* Top Customers */}
      <SectionTitle id="shoprep-top-customers" title="Top 5 Customers This Month" />
      <Card style={{ margin: "0 20px", padding: 0, overflow: "hidden" }}>
        {topCustomers.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: i < topCustomers.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ fontFamily: F.d, fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? 26 : 21, color: i === 0 ? C.gold : C.text, width: 30, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{c.name}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>{c.purchases} purchases</div>
            </div>
            {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: C.gold, flexShrink: 0 }}>{c.amt}</div>}
          </div>
        ))}
      </Card>

      {/* Design Sales Bar Chart */}
      <SectionTitle id="shoprep-by-design" title="Sales by Design" />
      <Card style={{ margin: "0 20px", padding: "18px 12px" }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={designData} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontFamily: F.m, fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="design" tick={{ fontFamily: F.m, fontSize: 12, fill: C.burg }} axisLine={false} tickLine={false} width={68} />
            <Tooltip
              contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 8 }}
              formatter={(v: number) => [`${v} sarees`, "Sold"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {designData.map((entry, i) => <Cell key={`cell-${entry.design}`} fill={i === 0 ? C.burg : i === 1 ? C.gold : C.muted} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Returns Summary */}
      <SectionTitle id="shoprep-returns" title="Returns This Month" />
      {returns.map((r, i) => (
        <div key={i} style={{ margin: "0 20px 10px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.crim}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 8 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
              <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.date}</span>
              <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{r.id}</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 3 }}>{r.customer} · {r.reason}</div>
          </div>
          {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 14, color: C.crim }}>{r.amt}</div>}
        </div>
      ))}

      {/* ══════ MODAL: EXPORT REPORT ══════ */}
      <AnimatePresence>
        {showExport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => { setShowExport(false); setExportDone(false); }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#FFF", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(44,24,16,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, flexShrink: 0, background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)` }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.30)" }} />
              </div>
              <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "16px 20px 24px", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(196,146,58,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={24} color={C.gold} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Export Report</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Today's Sales</div>
                </div>
                <button onClick={() => { setShowExport(false); setExportDone(false); }} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <X size={18} color="rgba(255,255,255,0.70)" />
                </button>
              </div>
              <div style={{ padding: "22px 20px 28px", overflowY: "auto" as const }}>
                {exportDone ? (
                  <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <Check size={32} color={C.green} />
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 8 }}>Export Ready!</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 22 }}>
                      Your <strong style={{ color: C.text }}>Today's Sales</strong> report has been exported as <strong style={{ color: C.text }}>{exportFormat.toUpperCase()}</strong>. Check your downloads folder.
                    </div>
                    <button onClick={() => { setShowExport(false); setExportDone(false); }} style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Done</button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>Export format</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {([
                          { key: "pdf" as const, label: "PDF", icon: "📄", desc: "Print-ready" },
                          { key: "csv" as const, label: "CSV", icon: "📊", desc: "Spreadsheet" },
                          { key: "excel" as const, label: "Excel", icon: "📗", desc: "Advanced" },
                        ]).map(f => (
                          <button key={f.key} onClick={() => setExportFormat(f.key)} style={{ flex: 1, padding: "14px 8px", borderRadius: 14, border: `2px solid ${exportFormat === f.key ? C.burg : C.bdr}`, background: exportFormat === f.key ? "rgba(107,26,42,0.06)" : "#FFF", cursor: "pointer", textAlign: "center" as const }}>
                            <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
                            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: exportFormat === f.key ? C.burg : C.text, marginBottom: 2 }}>{f.label}</div>
                            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{f.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "#F8F4F0", borderRadius: 14, padding: "14px 16px", marginBottom: 22 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Includes</div>
                      {["Sale ID, customer name, design code", "Payment method and amount", "Timestamp and date", "Running totals and subtotals"].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                          <Check size={14} color={C.green} />
                          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                      <button onClick={() => setExportDone(true)} style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                        <FileText size={17} /> Export as {exportFormat.toUpperCase()}
                      </button>
                      <button onClick={() => { setShowExport(false); setExportDone(false); }} style={{ width: "100%", height: 50, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SHELL WRAPPER ────────────────────────────────────────────────────────────
interface ShopStaffPortalProps { onBack?: () => void }

type ShopCustomer = { name: string; phone: string; purchases: number; total: string; last: string; regular: boolean; initials: string };

export { SalesReport };
