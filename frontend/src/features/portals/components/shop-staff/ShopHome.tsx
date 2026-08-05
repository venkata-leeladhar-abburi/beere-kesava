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
import { Button, IconButton, Textarea } from "../../../../shared/ui/primitives";
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
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1.2 }}>New Retail Sale</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>Record a sale at the counter</div>
            </div>
          </div>
          <Button onClick={() => onNavigate("sale")} fullWidth className="h-14 rounded-full bg-[#6B1A2A] border-none font-bold text-base text-white gap-2 shadow-[0_6px_18px_rgba(107,26,42,0.30)]">
            <ArrowUpRight size={20} /> Start New Sale
          </Button>
        </div>
      </div>

      {/* Process Return quick link */}
      <div style={{ margin: "0 20px 8px", display: "flex", gap: 12 }}>
        <Button onClick={() => onNavigate("return")} className="flex-1 h-[52px] border border-[rgba(139,26,46,0.12)] bg-white rounded-2xl font-semibold text-sm text-[#1A0A0F] gap-2 shadow-[0_1px_6px_rgba(44,24,16,0.05)]">
          <RotateCcw size={17} color={C.crim} /> Process Return
        </Button>
        <Button onClick={() => onNavigate("inventory")} className="flex-1 h-[52px] border border-[rgba(139,26,46,0.12)] bg-white rounded-2xl font-semibold text-sm text-[#1A0A0F] gap-2 shadow-[0_1px_6px_rgba(44,24,16,0.05)]">
          <Package size={17} color={C.burg} /> View Inventory
        </Button>
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
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginTop: 3 }}>{s.customer}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 1 }}>{s.design}</div>
            </div>
            <div style={{ textAlign: "right" as const, flexShrink: 0, marginLeft: 8 }}>
              {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 3 }}>{s.time}</div>
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
          <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>9:10 AM</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      <SectionTitle title="Stock Alert" />
      <div style={{ margin: "0 20px 16px", background: "rgba(192,57,43,0.06)", borderRadius: 16, borderLeft: `4px solid ${C.crim}`, padding: "18px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 14, lineHeight: 1.5 }}>
          ⚠ Shop stock is running low — only <strong>84 sarees</strong> remaining.
        </div>
        {alerted ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.green }}>
            <Check size={18} />
            <span style={{ fontFamily: F.u, fontSize: 14, lineHeight: 1.4 }}>Admin and Superadmin have been notified about low stock.</span>
          </div>
        ) : (
          <Btn label="Report Low Stock to Admin" icon={<Send size={16} />} onClick={() => setShowLowStockDialog(true)} style={{ width: "100%", height: 54, background: C.burg, fontSize: 14 }} />
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
                <IconButton
                  icon={X}
                  label="Close"
                  onClick={() => setShowLowStockDialog(false)}
                  variant="ghost"
                  shape="circle"
                  className="ml-auto bg-[rgba(139,112,96,0.10)] text-[#69635E] w-9 h-9"
                />
              </div>
              {/* Stock info */}
              <div style={{ background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Current stock</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.crim }}>84</span>
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
                  {(["urgent", "normal"] as const).map(p => {
                    const isActive = lowStockPriority === p;
                    const activeColor = p === "urgent" ? "border-[#C0392B] bg-[rgba(192,57,43,0.08)] text-[#C0392B]" : "border-[#6B1A2A] bg-[rgba(107,26,42,0.06)] text-[#6B1A2A]";
                    return (
                      <Button
                        key={p}
                        onClick={() => setLowStockPriority(p)}
                        variant="ghost"
                        className={"flex-1 h-11 rounded-[10px] border-2 font-semibold text-sm " + (isActive ? activeColor : "border-[rgba(139,26,46,0.12)] bg-transparent text-[#69635E]")}
                      >
                        {p === "urgent" ? "🔴 Urgent" : "🟡 Normal"}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {/* Optional message */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 8 }}>Additional note <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></div>
                <Textarea value={lowStockMsg} onChange={e => setLowStockMsg(e.target.value)} placeholder="E.g. We need silk sarees urgently for upcoming festival orders..." rows={3}
                  className="rounded-xl min-h-[90px] resize-none" />
              </div>
              {/* Confirm */}
              <Button onClick={() => {
                setLowStockSending(true);
                setTimeout(() => { setLowStockSending(false); setShowLowStockDialog(false); setAlerted(true); }, 1200);
              }} fullWidth className="h-[54px] bg-[#C0392B] border-none rounded-full font-bold text-base text-white gap-2">
                {lowStockSending ? "Sending…" : <><Send size={18} /> Send Report to Admin</>}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PAGE 02 — NEW RETAIL SALE ───────────────────────────────────────────────
export { ShopHome };
