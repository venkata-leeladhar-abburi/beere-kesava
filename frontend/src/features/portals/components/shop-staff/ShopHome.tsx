import { useCanSeePrices, HeroHeader, StatsStrip, TabId } from "./theme";
import { ShoppingBag, Check, Send, AlertTriangle } from "lucide-react";


import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown
} from 'lucide-react';

import { C, F, TEAL, Card, Btn, Chip, SectionTitle } from './theme';
function ShopHome({ onNavigate }: { onNavigate: (tab: TabId | "return") => void }) {
  const canSeePrices = useCanSeePrices();
  const [alerted, setAlerted] = useState(false);
  const [showLowStockDialog, setShowLowStockDialog] = useState(false);
  const [lowStockMsg, setLowStockMsg] = useState("");
  const [lowStockPriority, setLowStockPriority] = useState<"urgent" | "normal">("urgent");
  const [lowStockSending, setLowStockSending] = useState(false);

  const recentSales = [
    { id: "PADMA-L1-004", customer: "Smt. Annapurna", design: "BKB-045", amt: "₹8,500", time: "11:42 AM", color: "#E8D5B0", ext: false },
    { id: "RAVI-L2-008", customer: "Sri Ramesh K.", design: "BKB-031", amt: "₹12,000", time: "10:30 AM", color: "#8B2020", ext: false },
    { id: "BKB-L3-002", customer: "Smt. Lakshmi", design: "BKB-022", amt: "₹5,500", time: "9:45 AM", color: "#F5F5DC", ext: false },
    { id: "EXT-RAVI-001", customer: "Smt. Padmavathi", design: "External", amt: "₹6,200", time: "9:20 AM", color: "#C9A86C", ext: true },
    { id: "PADMA-L1-003", customer: "Smt. Saraswathi", design: "BKB-045", amt: "₹8,500", time: "Yesterday 4:30 PM", color: "#E8D5B0", ext: false },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · SHOP OVERVIEW" title="Shop Home" sub="& Today's Overview"
        desc="Today's sales, current inventory, and quick actions for the shop counter." />
      <StatsStrip items={[
        { label: "TODAY'S SALES", val: "12 sarees", sub: "↑ 3 more than yesterday" },
        ...(canSeePrices ? [{ label: "TODAY'S REVENUE", val: "₹1,04,000", sub: "From 12 sales" }] : []),
        { label: "SHOP INVENTORY", val: "84 sarees", sub: "Currently in stock", highlight: true },
        { label: "RETURNS TODAY", val: "1 return", sub: "Processed and recorded" },
      ]} />

      {/* Quick New Sale */}
      <div style={{ margin: "20px 20px 14px" }}>
        <div style={{
          background: "linear-gradient(160deg, rgba(196,146,58,0.10) 0%, rgba(107,26,42,0.05) 100%)",
          border: `2px solid ${C.burg}`, borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 18px rgba(107,26,42,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(196,146,58,0.35)" }}>
              <ShoppingBag size={30} color={C.text} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.text, lineHeight: 1.2 }}>New Retail Sale</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>Record a sale at the counter</div>
            </div>
          </div>
          <button onClick={() => onNavigate("sale")} style={{ width: "100%", height: 56, borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 18px rgba(107,26,42,0.30)" }}>
            <ArrowUpRight size={20} /> Start New Sale
          </button>
        </div>
      </div>

      {/* Process Return quick link */}
      <div style={{ margin: "0 20px 8px", display: "flex", gap: 12 }}>
        <button onClick={() => onNavigate("return")} style={{ flex: 1, height: 52, border: `1px solid ${C.bdr}`, background: C.white, borderRadius: 14, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 1px 6px rgba(44,24,16,0.05)" }}>
          <RotateCcw size={17} color={C.crim} /> Process Return
        </button>
        <button onClick={() => onNavigate("inventory")} style={{ flex: 1, height: 52, border: `1px solid ${C.bdr}`, background: C.white, borderRadius: 14, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 1px 6px rgba(44,24,16,0.05)" }}>
          <Package size={17} color={C.burg} /> View Inventory
        </button>
      </div>

      {/* Recent Sales */}
      <SectionTitle title="Recent Sales — Today" link="View All →" onLink={() => onNavigate("reports")} />
      <Card style={{ margin: "0 20px", padding: 0, overflow: "hidden" }}>
        {recentSales.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "16px", borderBottom: i < recentSales.length - 1 ? `1px solid rgba(139,26,46,0.08)` : "none" }}>
            <div style={{ width: 6, height: 40, borderRadius: 3, background: s.color, marginRight: 14, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{s.id}</span>
                {s.ext && <Chip label="📦 External" color={C.gold} bg="rgba(196,146,58,0.12)" />}
              </div>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginTop: 3 }}>{s.customer}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 1 }}>{s.design}</div>
            </div>
            <div style={{ textAlign: "right" as const, flexShrink: 0, marginLeft: 8 }}>
              {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
              <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 3 }}>{s.time}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Returns Today */}
      <SectionTitle title="Returns Today" />
      <div style={{ margin: "0 20px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.crim}`, borderRadius: 14, padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" as const }}>
          <Chip label="↩ Return" color={C.crim} bg="rgba(192,57,43,0.10)" />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>RAVI-L2-007</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 2, lineHeight: 1.4 }}>Wrong Design · Smt. Meenakshi{canSeePrices ? " · ₹12,000" : ""}</div>
          </div>
          <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>9:10 AM</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      <SectionTitle title="Stock Alert" />
      <div style={{ margin: "0 20px 16px", background: "rgba(192,57,43,0.06)", borderRadius: 16, borderLeft: `4px solid ${C.crim}`, padding: "18px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 15, color: C.text, marginBottom: 14, lineHeight: 1.5 }}>
          ⚠ Shop stock is running low — only <strong>84 sarees</strong> remaining.
        </div>
        {alerted ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.green }}>
            <Check size={18} />
            <span style={{ fontFamily: F.u, fontSize: 14, lineHeight: 1.4 }}>Admin and Superadmin have been notified about low stock.</span>
          </div>
        ) : (
          <Btn label="Report Low Stock to Admin" icon={<Send size={16} />} onClick={() => setShowLowStockDialog(true)} style={{ width: "100%", height: 54, background: C.burg, fontSize: 15 }} />
        )}
      </div>

      {/* Low Stock Dialog — bottom sheet */}
      <AnimatePresence>
        {showLowStockDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", flexDirection: "column" as const, justifyContent: "flex-end" }}
            onClick={() => setShowLowStockDialog(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#FFF", borderRadius: "22px 22px 0 0", padding: "28px 20px 36px", boxShadow: "0 -8px 40px rgba(44,24,16,0.18)" }}>
              {/* Handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(139,112,96,0.25)", margin: "0 auto 22px" }} />
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={24} color={C.crim} />
                </div>
                <div>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text }}>Report Low Stock</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>Notify Admin & Superadmin</div>
                </div>
                <button onClick={() => setShowLowStockDialog(false)} style={{ marginLeft: "auto", background: "rgba(139,112,96,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={18} color={C.muted} />
                </button>
              </div>
              {/* Stock info */}
              <div style={{ background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Current stock</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.crim }}>84</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Minimum threshold</span>
                  <span style={{ fontFamily: F.m, fontSize: 14, color: C.muted }}>100 sarees</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(192,57,43,0.12)", marginTop: 12, overflow: "hidden" }}>
                  <div style={{ width: "84%", height: "100%", background: C.crim, borderRadius: 3 }} />
                </div>
              </div>
              {/* Priority */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Priority</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["urgent", "normal"] as const).map(p => (
                    <button key={p} onClick={() => setLowStockPriority(p)} style={{ flex: 1, height: 44, borderRadius: 10, border: `2px solid ${lowStockPriority === p ? (p === "urgent" ? C.crim : C.burg) : C.bdr}`, background: lowStockPriority === p ? (p === "urgent" ? "rgba(192,57,43,0.08)" : "rgba(107,26,42,0.06)") : "transparent", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: lowStockPriority === p ? (p === "urgent" ? C.crim : C.burg) : C.muted, cursor: "pointer" }}>
                      {p === "urgent" ? "🔴 Urgent" : "🟡 Normal"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Optional message */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 8 }}>Additional note <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></div>
                <textarea value={lowStockMsg} onChange={e => setLowStockMsg(e.target.value)} placeholder="E.g. We need silk sarees urgently for upcoming festival orders..." rows={3}
                  style={{ width: "100%", minHeight: 90, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "12px 14px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" as const }} />
              </div>
              {/* Confirm */}
              <button onClick={() => {
                setLowStockSending(true);
                setTimeout(() => { setLowStockSending(false); setShowLowStockDialog(false); setAlerted(true); }, 1200);
              }} style={{ width: "100%", height: 54, background: C.crim, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {lowStockSending ? "Sending…" : <><Send size={18} /> Send Report to Admin</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PAGE 02 — NEW RETAIL SALE ───────────────────────────────────────────────
export { ShopHome };
