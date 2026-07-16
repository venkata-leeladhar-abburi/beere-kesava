import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, AlertTriangle, CheckCircle2, Info,
  Package, Users, ShoppingCart, TrendingUp, FileText,
  ArrowRight, Check, X,
  Inbox, AlertCircle, Zap
} from "lucide-react";
const imgNotifHero = "https://images.unsplash.com/photo-1633613286991-611fe299c4be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  warmCream:     "#F5E8D0",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Types & Data ──────────────────────────────────────────────────────────
type Priority = "critical" | "warning" | "info" | "success";

interface UnifiedNotif {
  id: string;
  priority: Priority;
  category: "weaver" | "production" | "material" | "payment" | "dispatch";
  title: string;
  body: string;
  time: string;
  read: boolean;
  action?: string;
}

const INITIAL_NOTIFS: UnifiedNotif[] = [
  // Weavers & Looms
  { id: "w-1", priority: "info",     category: "weaver", title: "Warp Request Raised — Ravi Kumar", body: "Ravi Kumar (WV-001) raised a warp request for BATCH-086 — 3 kg yarn needed.", time: "10 min ago", read: false },
  { id: "w-2", priority: "success",  category: "weaver", title: "Warp Request Approved — Padma Veni", body: "Padma Veni's (WV-002) warp request for BATCH-086 was approved by Admin.", time: "1h ago", read: false },
  { id: "w-3", priority: "warning",  category: "weaver", title: "Warp Request Rejected — Suresh Murti", body: "Suresh Murti's warp request was rejected — insufficient warp yarn stock in primary rack.", time: "3h ago", read: false },
  { id: "w-4", priority: "info",     category: "weaver", title: "Batch Assigned to Weaver — Padma Veni", body: "BATCH-086 assigned to Padma Veni — Design BKB-051, 6 sarees expected.", time: "Yesterday", read: true },
  { id: "w-5", priority: "success",  category: "weaver", title: "Weaver Confirmed Material Receipt", body: "Ravi Kumar confirmed receipt of Warp and Resham for BATCH-089.", time: "Yesterday", read: true },
  { id: "w-6", priority: "success",  category: "weaver", title: "Payment Credited to Weaver — ₹6,300", body: "₹6,300 credited to Ravi Kumar (WV-001) for completion of Batch 088 — UTR202604301122.", time: "2 days ago", read: true },
  { id: "w-7", priority: "warning",  category: "weaver", title: "Weaver Absence — Anand Kumar", body: "Anand Kumar has been absent for 2 consecutive working days. Batch 090 may face significant delays. Consider reassigning work.", time: "3 days ago", read: true },

  // Production & Batches
  { id: "p-1", priority: "info",     category: "production", title: "New Batch 092 Initiated — Suresh Murti", body: "Batch 092 has been started with Suresh Murti. Design: Kanjivaram Heavy Zari. Expected completion: 12 working days. 6 sarees allocated.", time: "Just now", read: false },
  { id: "p-2", priority: "success",  category: "production", title: "Batch 089 Completed — Ravi Kumar", body: "Ravi Kumar has successfully completed 3 sarees in Batch 089. Quality control inspection is now pending.", time: "2h ago", read: false },
  { id: "p-3", priority: "success",  category: "production", title: "QC Cleared — 12 Sarees, Batch 086", body: "Quality check has passed for all 12 sarees in Batch 086. Items are now ready for finishing operations.", time: "8:15 AM", read: true },
  { id: "p-4", priority: "warning",  category: "production", title: "QC Rejection — 2 Sarees, Batch 084", body: "2 sarees from Batch 084 failed quality check inspection. Issues: irregular zari pattern on saree #3 and minor defects on saree #7.", time: "11:30 AM", read: true },
  { id: "p-5", priority: "info",     category: "production", title: "Batch 090 Created — Anand K.", body: "BATCH-090 created for Anand K. — Design BKB-047, 6 sarees.", time: "Yesterday", read: true },

  // Raw Materials & Stock
  { id: "m-1", priority: "critical", category: "material", title: "Jari Stock Below Minimum Threshold", body: "Current Jari inventory stands at 8 kg against the minimum threshold of 15 kg. Recommended reorder quantity is 20 kg.", time: "4h ago", read: false, action: "Order Now" },
  { id: "m-2", priority: "info",     category: "material", title: "Warp Issued to Weaver — Padma Veni", body: "Worker staff issued 4 kg warp yarn to Padma Veni for Batch 091. Raw material inventory has been updated.", time: "9:30 AM", read: true },
  { id: "m-3", priority: "info",     category: "material", title: "PO Created — Surat Zari Works", body: "PO-2026-023 created for Surat Zari Works — 5 Buns Polyester 2G Gold.", time: "Yesterday", read: true },
  { id: "m-4", priority: "success",  category: "material", title: "PO Approved by Superadmin", body: "PO-2026-021 approved by Superadmin — awaiting vendor delivery.", time: "Yesterday", read: true },
  { id: "m-5", priority: "success",  category: "material", title: "Warp Stock Replenished — 50 kg", body: "50 kg of warp yarn received from Coimbatore Yarns Pvt. Ltd. against PO #PO-2024-044. Inventory has been updated.", time: "2 days ago", read: true },

  // Payments & Invoices
  { id: "pay-1", priority: "critical", category: "payment", title: "2 Invoices Overdue — ₹2.4L Pending", body: "Invoice #INV-2024-089 (₹1.2L) and #INV-2024-091 (₹1.2L) are overdue by more than 7 days. Follow-up is required.", time: "10:00 AM", read: false, action: "View Invoices" },
  { id: "pay-2", priority: "success",  category: "payment", title: "Payment Received — ₹85,000", body: "Full payment of ₹85,000 received from Meenakshi Textiles for Invoice #INV-2024-087. The outstanding balance is cleared.", time: "1:15 PM", read: true },
  { id: "pay-3", priority: "warning",  category: "payment", title: "Payment Discrepancy Alert", body: "1 bank credit of ₹12,500 could not be matched to any weaver or wholesale account — review manually.", time: "Yesterday", read: true },
  { id: "pay-4", priority: "info",     category: "payment", title: "Excel Payment File Uploaded", body: "Payment sheet for May 2026 uploaded — 84 weaver payment records processed successfully.", time: "2 days ago", read: true },

  // Shop & Dispatch
  { id: "d-1", priority: "critical", category: "dispatch", title: "Low Stock Alert — Shop Inventory", body: "Shop Staff reported only 12 sarees remaining in the retail shop showroom. Restocking is required immediately.", time: "Just now", read: false, action: "Review Stock" },
  { id: "d-2", priority: "success",  category: "dispatch", title: "Order Confirmed — Lakshmi Silks", body: "Lakshmi Silks has confirmed a wholesale order for 40 sarees from the Kanjivaram series.", time: "3:45 PM", read: true },
  { id: "d-3", priority: "info",     category: "dispatch", title: "Dispatch Completed — Wholesale Order", body: "24 sarees have been dispatched to Maheshwari Textiles Pvt. Ltd. Tracking ID: BKS-DSP-2024-112.", time: "Yesterday", read: true },
  { id: "d-4", priority: "success",  category: "dispatch", title: "Shop Restocking — 18 Sarees Dispatched", body: "18 sarees have been dispatched from the finishing unit to the Beere Kesava retail shop.", time: "Yesterday", read: true },
];

const PRIORITY: Record<Priority, { color: string; bg: string; border: string; Icon: React.ElementType; label: string }> = {
  critical: { color: "#B91C1C", bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.20)", Icon: AlertTriangle,  label: "Critical" },
  warning:  { color: "#B45309", bg: "rgba(180,83,9,0.08)",  border: "rgba(180,83,9,0.20)",  Icon: AlertCircle,    label: "Warning" },
  info:     { color: "#1D4ED8", bg: "rgba(29,78,216,0.07)", border: "rgba(29,78,216,0.18)", Icon: Info,           label: "Info" },
  success:  { color: T.green,   bg: "rgba(30,102,64,0.07)", border: "rgba(30,102,64,0.18)", Icon: CheckCircle2,   label: "Success" },
};

type Filter = "all" | Priority;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",      label: "All Priorities" },
  { key: "critical", label: "Critical Only" },
  { key: "warning",  label: "Warning Only" },
  { key: "success",  label: "Success Only" },
  { key: "info",     label: "Info Only" },
];

// ─── Sub-components ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export function NotificationsPage() {
  const [notifications, setNotifications] = useState<UnifiedNotif[]>(INITIAL_NOTIFS);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filter, setFilter]                 = useState<Filter>("all");
  const [selected, setSelected]             = useState<UnifiedNotif | null>(null);

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (selected && selected.id === id) {
      setSelected(prev => prev ? { ...prev, read: true } : null);
    }
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 1. Filter by Active Category first
  const categoryFiltered = activeCategory === "all" ? notifications : notifications.filter(n => n.category === activeCategory);
  
  // 2. Filter by Active Priority second
  const filtered = filter === "all" ? categoryFiltered : categoryFiltered.filter(n => n.priority === filter);
  
  const unread   = notifications.filter(n => !n.read).length;

  const countByPriority = (p: Priority) => notifications.filter(n => n.priority === p).length;

  const CATEGORIES = [
    { key: "all",        label: "All Notifications",     color: T.royalBurgundy, Icon: Bell },
    { key: "weaver",     label: "Weavers & Looms",       color: T.royalBurgundy, Icon: Users },
    { key: "production", label: "Production & Batches",  color: T.green,         Icon: TrendingUp },
    { key: "material",   label: "Raw Materials & Stock", color: "#7B3F00",       Icon: Package },
    { key: "payment",    label: "Payments & Invoices",   color: "#1D4ED8",       Icon: FileText },
    { key: "dispatch",   label: "Shop & Dispatch",       color: T.antiqueGold,   Icon: ShoppingCart },
  ];

  // ── Date grouping logic ──
  const getDateGroup = (time: string): string => {
    if (time.includes("now") || time.includes("min ago") || time.includes("h ago") || time.includes("AM") || time.includes("PM")) {
      return "Today";
    }
    if (time.includes("Yesterday")) {
      return "Yesterday";
    }
    return "Older Alerts";
  };

  const grouped: Record<string, UnifiedNotif[]> = {};
  filtered.forEach(n => {
    const grp = getDateGroup(n.time);
    if (!grouped[grp]) grouped[grp] = [];
    grouped[grp].push(n);
  });

  return (
    <div style={{ minHeight: "calc(100vh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: "#2C0913", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · NOTIFICATIONS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
              Notifications
            </h1>
            {unread > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: T.antiqueGold, color: T.deepWine, fontFamily: F.mono, fontWeight: 700, fontSize: 14, borderRadius: 999, padding: "4px 14px" }}>
                {unread} new
              </span>
            )}
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 560, lineHeight: 1.6 }}>
            Live operational alerts, stock updates, payment reminders, and production activity.
          </p>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, border: "1px solid rgba(200,155,71,0.30)", background: "rgba(200,155,71,0.09)", color: T.antiqueGold, fontFamily: F.ui, fontWeight: 600, fontSize: 13, cursor: "pointer", letterSpacing: "0.1px" }}
            >
              <Check size={15} /> Mark all read
            </button>
          )}
        </div>
        {/* Right image with gradient */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(to right, #2C0913 0%, rgba(44,9,19,0.65) 38%, rgba(44,9,19,0.10) 100%)" }} />
          <img src={imgNotifHero} alt="Notifications" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.70) saturate(0.80)" }} />
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { label: "TOTAL",    val: notifications.length,                           Icon: Bell,          hi: false, col: undefined },
            { label: "UNREAD",   val: unread,                                         Icon: Inbox,         hi: unread > 0, col: undefined },
            { label: "CRITICAL", val: countByPriority("critical"),                    Icon: AlertTriangle, hi: false, col: "#FCA5A5" },
            { label: "TODAY",    val: notifications.filter(n => n.time.includes("now") || n.time.includes("ago") || n.time.includes("AM") || n.time.includes("PM")).length, Icon: Zap, hi: false, col: undefined },
            { label: "RESOLVED", val: notifications.filter(n => n.read).length,       Icon: CheckCircle2,  hi: false, col: "#6EE7B7" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.hi ? T.goldLight : (m.col || "#FFFDF9"), lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
              </div>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CATEGORIES TAB BUTTONS BAR ── */}
      <div style={{ padding: "0 56px", marginTop: 36 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => {
            const active = activeCategory === c.key;
            const count = c.key === "all" ? notifications.length : notifications.filter(n => n.category === c.key).length;
            const unreadCount = c.key === "all" ? notifications.filter(n => !n.read).length : notifications.filter(n => n.category === c.key && !n.read).length;

            return (
              <motion.button
                key={c.key}
                onClick={() => { setActiveCategory(c.key); setSelected(null); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  borderRadius: 14,
                  border: active ? `1.5px solid ${T.royalBurgundy}` : `1.5px solid ${T.borderDef}`,
                  background: active ? T.royalBurgundy : T.warmIvory,
                  color: active ? "#FFF" : T.luxuryBrown,
                  fontFamily: F.ui,
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: "pointer",
                  boxShadow: active ? "0 6px 20px rgba(110,15,45,0.14)" : "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "background 0.2s, border-color 0.2s, color 0.2s"
                }}
              >
                <c.Icon size={15} color={active ? "#FFF" : c.color} />
                <span>{c.label}</span>
                <span style={{
                  fontFamily: F.mono,
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: active ? "rgba(255,255,255,0.20)" : "rgba(110,15,45,0.07)",
                  color: active ? "#FFF" : T.royalBurgundy
                }}>
                  {count}
                </span>
                {unreadCount > 0 && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? T.goldLight : T.royalBurgundy }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── PRIORITY FILTER BAR ── */}
      <div style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, padding: "0 56px", position: "sticky", top: 90, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)", marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, height: 58 }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const count = f.key === "all" ? categoryFiltered.length : categoryFiltered.filter(n => n.priority === f.key).length;
            const cfg = f.key !== "all" ? PRIORITY[f.key] : null;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  height: "100%", padding: "0 22px", border: "none", background: "rgba(0,0,0,0)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, position: "relative",
                  borderBottom: active ? `2px solid ${T.royalBurgundy}` : "2px solid transparent",
                }}>
                {cfg && <cfg.Icon size={14} color={active ? T.royalBurgundy : cfg.color} />}
                <span style={{ fontFamily: F.ui, fontWeight: active ? 600 : 400, fontSize: 13.5, color: active ? T.royalBurgundy : T.taupe, whiteSpace: "nowrap" }}>
                  {f.label}
                </span>
                <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: active ? `rgba(110,15,45,0.08)` : "rgba(139,112,96,0.08)", color: active ? T.royalBurgundy : T.taupe }}>
                  {count}
                </span>
              </button>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "80px 56px 80px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* Left — list grouped by date */}
        <div style={{ flex: selected ? "0 0 520px" : 1, minWidth: 0 }}>
          {["Today", "Yesterday", "Older Alerts"].map(dateGroup => {
            const items = grouped[dateGroup] || [];
            if (items.length === 0) return null;

            return (
              <div key={dateGroup} style={{ marginBottom: 40 }}>
                {/* Date group header */}
                <FadeUp>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold, flexShrink: 0 }} />
                    <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.2px" }}>{dateGroup}</span>
                    <div style={{ flex: 1, height: 1, background: T.borderDef, marginLeft: 4 }} />
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  </div>
                </FadeUp>

                {/* Notification cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {items.map((n, i) => {
                    const cfg = PRIORITY[n.priority];
                    const isRead = n.read;
                    const isSelected = selected?.id === n.id;
                    const PriorityIcon = cfg.Icon;
                    const catCfg = CATEGORIES.find(c => c.key === n.category)!;
                    const CatIcon = catCfg.Icon;

                    return (
                      <FadeUp key={n.id} delay={i * 0.05}>
                        <motion.div
                          onClick={() => { setSelected(isSelected ? null : n); markRead(n.id); }}
                          whileHover={{ y: -3, boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.14)" : "0 8px 32px rgba(110,15,45,0.10)" }}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}
                          style={{
                            background: isSelected ? "#FFFDF9" : T.warmIvory,
                            borderRadius: 20,
                            border: isSelected ? `1.5px solid ${T.royalBurgundy}` : `1.5px solid ${isRead ? T.borderDef : cfg.border}`,
                            boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.12)" : "0 2px 14px rgba(110,15,45,0.05)",
                            cursor: "pointer",
                            overflow: "hidden",
                            position: "relative",
                          }}>
                          {/* Priority top bar */}
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`, opacity: isRead ? 0.4 : 1 }} />

                          <div style={{ padding: "22px 24px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                              {/* Icon block */}
                              <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <PriorityIcon size={22} color={cfg.color} />
                              </div>

                              {/* Main content */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                                  {/* Unread dot */}
                                  {!isRead && (
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                                  )}
                                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: T.luxuryBrown, lineHeight: 1.3, flex: 1, opacity: isRead ? 0.8 : 1 }}>
                                    {n.title}
                                  </span>
                                  {/* Priority badge */}
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>
                                    <PriorityIcon size={10} /> {cfg.label}
                                  </span>
                                </div>

                                <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13.5, color: T.taupe, lineHeight: 1.75, margin: "0 0 14px", display: selected ? "block" : "-webkit-box" as any, WebkitLineClamp: selected ? undefined : 2, WebkitBoxOrient: "vertical" as any, overflow: selected ? "visible" : "hidden" }}>
                                  {n.body}
                                </p>

                                {/* Footer row */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                  {/* Category tag */}
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.mono, fontSize: 10, fontWeight: 500, color: catCfg.color, background: `${catCfg.color}14`, border: `1px solid ${catCfg.color}2A`, borderRadius: 999, padding: "3px 10px" }}>
                                    <CatIcon size={10} /> {catCfg.label}
                                  </span>

                                  <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{n.time}</span>

                                  {/* Action button */}
                                  {n.action && (
                                    <motion.button
                                      onClick={e => { e.stopPropagation(); markRead(n.id); }}
                                      whileHover={{ scale: 1.05, backgroundColor: T.royalBurgundy, color: "#FFFDF9" }}
                                      whileTap={{ scale: 0.97 }}
                                      style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 10, border: `1.5px solid ${T.royalBurgundy}`, background: "rgba(0,0,0,0)", color: T.royalBurgundy, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                      {n.action} <ArrowRight size={12} />
                                    </motion.button>
                                  )}
                                </div>
                              </div>

                              {/* Read/unread toggle */}
                              <motion.button
                                onClick={e => { e.stopPropagation(); toggleRead(n.id); }}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.93 }}
                                title={isRead ? "Mark unread" : "Mark read"}
                                style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${isRead ? T.borderDef : cfg.color}`, background: isRead ? "rgba(0,0,0,0)" : cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
                                <Check size={13} color={isRead ? T.taupe : cfg.color} />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      </FadeUp>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Inbox size={28} color={T.taupe} />
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, marginBottom: 8 }}>No notifications</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No notifications match the current filter.</div>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 32, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              style={{ flex: "0 0 380px", position: "sticky", top: 148 }}>
              {(() => {
                const cfg = PRIORITY[selected.priority];
                const PriorityIcon = cfg.Icon;
                const catCfg = CATEGORIES.find(c => c.key === selected.category)!;
                const CatIcon = catCfg.Icon;
                return (
                  <div style={{ background: T.warmIvory, borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 16px 56px rgba(110,15,45,0.10)", overflow: "hidden" }}>
                    {/* Detail top bar */}
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}55)` }} />

                    {/* Detail header */}
                    <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: "4px 12px" }}>
                        <PriorityIcon size={12} /> {cfg.label}
                      </span>
                      <motion.button onClick={() => setSelected(null)} whileHover={{ scale: 1.1, backgroundColor: "rgba(110,15,45,0.06)" }} whileTap={{ scale: 0.93 }}
                        style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${T.borderDef}`, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={14} color={T.taupe} />
                      </motion.button>
                    </div>

                    {/* Detail body */}
                    <div style={{ padding: "24px 24px 28px" }}>
                      {/* Icon + category */}
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, background: catCfg.color + "14", border: `1px solid ${catCfg.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CatIcon size={24} color={catCfg.color} />
                        </div>
                        <div>
                          <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: "2px", color: catCfg.color, textTransform: "uppercase", marginBottom: 4 }}>{catCfg.label}</div>
                          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{selected.time}</div>
                        </div>
                      </div>

                      {/* Title */}
                      <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, lineHeight: 1.35, marginBottom: 16, letterSpacing: "-0.2px" }}>
                        {selected.title}
                      </div>

                      {/* Body */}
                      <div style={{ background: T.silkCream, borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "18px 20px", marginBottom: 20 }}>
                        <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.85, margin: 0 }}>
                          {selected.body}
                        </p>
                      </div>

                      {/* Meta grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                        {[
                          { label: "Priority",  value: cfg.label,     color: cfg.color },
                          { label: "Category",  value: catCfg.label,  color: catCfg.color },
                          { label: "Received",  value: selected.time, color: T.luxuryBrown },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: T.taupe, marginBottom: 5 }}>{label}</div>
                            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      {selected.action && (
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.28)" }}
                          whileTap={{ scale: 0.98 }}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: G.button, color: "#FFFDF9", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(110,15,45,0.22)", marginBottom: 10 }}>
                          {selected.action} <ArrowRight size={15} />
                        </motion.button>
                      )}
                      <motion.button onClick={() => { markRead(selected.id); setSelected(null); }}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(110,15,45,0.06)" }}
                        whileTap={{ scale: 0.98 }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 14, border: `1px solid ${T.borderDef}`, background: "rgba(0,0,0,0)", color: T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        <Check size={14} /> Mark as read
                      </motion.button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
