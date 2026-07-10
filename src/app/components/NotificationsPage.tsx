import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, AlertTriangle, CheckCircle2, Info,
  Package, Users, ShoppingCart, TrendingUp, FileText,
  ArrowRight, Check, X,
  Inbox, AlertCircle, Zap, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Design tokens (mirrors BeereDashboard) ────────────────────────────────
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
const NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

// ─── Data ──────────────────────────────────────────────────────────────────
type Priority = "critical" | "warning" | "info" | "success";
type Category = "stock" | "production" | "payment" | "quality" | "dispatch" | "customer";

interface Notif {
  id: number;
  priority: Priority;
  category: Category;
  title: string;
  body: string;
  time: string;
  date: string;
  read: boolean;
  action?: string;
}

const DATA: Notif[] = [
  { id: 1,  priority: "critical", category: "stock",      title: "Low Stock Alert — Shop Inventory",       body: "Shop Staff reported only 12 sarees remaining in the retail shop. This is below the minimum threshold of 25. Immediate restocking from finishing unit is required to avoid stock-out.",            time: "Just now",    date: "Today",     read: false, action: "Review Stock" },
  { id: 2,  priority: "success",  category: "production", title: "Batch 089 Completed — Ravi Kumar",       body: "Ravi Kumar has successfully completed 3 sarees in Batch 089. Quality control inspection is now pending. All weave specifications meet the required standard for this design.",                time: "2h ago",      date: "Today",     read: false, action: "View Batch" },
  { id: 3,  priority: "warning",  category: "stock",      title: "Jari Stock Below Minimum Threshold",     body: "Current Jari inventory stands at 8 kg against the minimum threshold of 15 kg. Recommended reorder quantity is 20 kg. Please raise a purchase order with an approved vendor immediately.",       time: "4h ago",      date: "Today",     read: false, action: "Order Now" },
  { id: 4,  priority: "info",     category: "production", title: "Warp Issued to Weaver — Padma Veni",     body: "Worker staff issued 4 kg warp yarn to Padma Veni for Batch 091. The transaction has been recorded and the raw material inventory has been updated accordingly in the system.",                  time: "9:30 AM",     date: "Today",     read: true  },
  { id: 5,  priority: "success",  category: "quality",    title: "QC Cleared — 12 Sarees, Batch 086",     body: "Quality check has passed for all 12 sarees in Batch 086. Items are now ready for finishing operations and subsequent dispatch to wholesale or shop channels.",                                   time: "8:15 AM",     date: "Today",     read: true  },
  { id: 6,  priority: "success",  category: "customer",   title: "Order Confirmed — Lakshmi Silks",        body: "Lakshmi Silks has confirmed a wholesale order for 40 sarees from the Kanjivaram Zari Silk series. Expected delivery is within 14 working days. Dispatch coordination is required.",            time: "3:45 PM",     date: "Yesterday", read: true  },
  { id: 7,  priority: "critical", category: "payment",    title: "2 Invoices Overdue — ₹2.4L Pending",     body: "Invoice #INV-2024-089 (₹1.2L) and #INV-2024-091 (₹1.2L) are both overdue by more than 7 days. Immediate follow-up is required with the respective customers to clear outstanding dues.",     time: "10:00 AM",    date: "Yesterday", read: false, action: "View Invoices" },
  { id: 8,  priority: "info",     category: "dispatch",   title: "Dispatch Completed — Wholesale Order",   body: "24 sarees have been dispatched to Maheshwari Textiles Pvt. Ltd. Tracking ID: BKS-DSP-2024-112. The customer has been notified via SMS with delivery tracking details.",                        time: "2:00 PM",     date: "Yesterday", read: true  },
  { id: 9,  priority: "warning",  category: "quality",    title: "QC Rejection — 2 Sarees, Batch 084",    body: "2 sarees from Batch 084 failed quality check inspection. Issues identified: irregular zari pattern on saree #3 and minor weave defects on saree #7. Both sent back to weaver for rework.",    time: "11:30 AM",    date: "Yesterday", read: true  },
  { id: 10, priority: "info",     category: "production", title: "New Batch 092 Initiated",                body: "Batch 092 has been started with Suresh Murti. Design: Kanjivaram Heavy Zari. Expected completion: 12 working days. 6 sarees allocated to this batch.",                                        time: "4:00 PM",     date: "2 days ago", read: true },
  { id: 11, priority: "success",  category: "payment",    title: "Payment Received — ₹85,000",             body: "Full payment of ₹85,000 received from Meenakshi Textiles for Invoice #INV-2024-087. The account has been updated and the outstanding balance is now cleared.",                                  time: "1:15 PM",     date: "2 days ago", read: true },
  { id: 12, priority: "info",     category: "stock",      title: "Warp Stock Replenished — 50 kg",         body: "50 kg of warp yarn received from Coimbatore Yarns Pvt. Ltd. against PO #PO-2024-044. Material is stored in Rack B-12. Inventory has been updated in the system.",                            time: "10:45 AM",    date: "2 days ago", read: true },
  { id: 13, priority: "warning",  category: "production", title: "Weaver Absence — Anand Kumar",           body: "Anand Kumar has been absent for 2 consecutive working days. Batch 090 may face significant delays. Consider reassigning work or granting a formal extension for this batch.",                  time: "9:00 AM",     date: "3 days ago", read: true },
  { id: 14, priority: "success",  category: "dispatch",   title: "Shop Restocking — 18 Sarees Dispatched", body: "18 sarees have been dispatched from the finishing unit to the Beere Kesava retail shop. The consignment includes a mix of Kanjivaram and plain silk varieties.",                               time: "3:30 PM",     date: "3 days ago", read: true },
  { id: 15, priority: "info",     category: "customer",   title: "New Customer — Anitha Reddy",            body: "New retail customer Anitha Reddy has been registered. Contact: +91 98450 11223. First purchase: ₹18,500 for 2 Kanjivaram sarees. Customer profile created in the system.",                   time: "12:00 PM",    date: "3 days ago", read: true },
];

const PRIORITY: Record<Priority, { color: string; bg: string; border: string; Icon: React.ElementType; label: string; darkColor: string }> = {
  critical: { color: "#B91C1C", bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.20)", Icon: AlertTriangle,  label: "Critical", darkColor: "#FCA5A5" },
  warning:  { color: "#B45309", bg: "rgba(180,83,9,0.08)",  border: "rgba(180,83,9,0.20)",  Icon: AlertCircle,    label: "Warning",  darkColor: "#FCD34D" },
  info:     { color: "#1D4ED8", bg: "rgba(29,78,216,0.07)", border: "rgba(29,78,216,0.18)", Icon: Info,           label: "Info",     darkColor: "#93C5FD" },
  success:  { color: T.green,   bg: "rgba(30,102,64,0.07)", border: "rgba(30,102,64,0.18)", Icon: CheckCircle2,   label: "Success",  darkColor: "#6EE7B7" },
};

const CATEGORY: Record<Category, { Icon: React.ElementType; label: string; color: string }> = {
  stock:      { Icon: Package,     label: "Stock",      color: "#7B3F00" },
  production: { Icon: TrendingUp,  label: "Production", color: T.royalBurgundy },
  payment:    { Icon: FileText,    label: "Payment",    color: "#1D4ED8" },
  quality:    { Icon: CheckCircle2,label: "Quality",    color: T.green },
  dispatch:   { Icon: ShoppingCart,label: "Dispatch",   color: "#4A4A4A" },
  customer:   { Icon: Users,       label: "Customer",   color: T.antiqueGold },
};

type Filter = "all" | Priority;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning",  label: "Warning" },
  { key: "success",  label: "Success" },
  { key: "info",     label: "Info" },
];

// ─── Categorised notification sections (below main list) ───────────────────
interface CatNotif {
  id: string;
  title: string;
  body: string;
  time: string;
  priority: Priority;
}

const CATEGORY_SECTIONS: { key: string; label: string; items: CatNotif[] }[] = [
  {
    key: "weaver",
    label: "Weaver Notifications",
    items: [
      { id: "w1", title: "Warp Request Raised",              body: "Ravi Kumar (WV-001) raised a warp request for BATCH-086 — 3 kg needed.",                       time: "10 min ago", priority: "info" },
      { id: "w2", title: "Warp Request Approved",            body: "Padma Veni's (WV-002) warp request for BATCH-086 was approved by Admin.",                       time: "1h ago",     priority: "success" },
      { id: "w3", title: "Warp Request Rejected",             body: "Suresh Murti's warp request was rejected — insufficient stock available.",                      time: "3h ago",     priority: "warning" },
      { id: "w4", title: "Batch Assigned to Weaver",          body: "BATCH-086 assigned to Padma Veni — Design BKB-051, 6 sarees expected.",                          time: "Yesterday",  priority: "info" },
      { id: "w5", title: "Weaver Confirmed Material Receipt", body: "Ravi Kumar confirmed receipt of Warp and Resham for BATCH-089.",                                 time: "Yesterday",  priority: "success" },
      { id: "w6", title: "Payment Credited to Weaver",        body: "₹6,300 credited to Ravi Kumar (WV-001) — UTR202604301122.",                                     time: "2 days ago", priority: "success" },
      { id: "w7", title: "Defect Notification Sent to Weaver",body: "Quality defect notice sent to Suresh Murti for 2 sarees in BATCH-081.",                          time: "3 days ago", priority: "warning" },
    ],
  },
  {
    key: "material",
    label: "Material Notifications",
    items: [
      { id: "m1", title: "Stock Alert — Below Threshold",     body: "Jari (Polyester 2G Gold) has fallen below the minimum threshold of 5 Buns.",                     time: "30 min ago", priority: "critical" },
      { id: "m2", title: "PO Created",                        body: "PO-2026-023 created for Surat Zari Works — 5 Buns Polyester 2G Gold.",                          time: "2h ago",     priority: "info" },
      { id: "m3", title: "PO Approved by Superadmin",         body: "PO-2026-021 approved by Superadmin — awaiting vendor delivery.",                                 time: "5h ago",     priority: "success" },
      { id: "m4", title: "PO Rejected",                        body: "PO-2026-019 was rejected by Superadmin — budget exceeded this cycle.",                          time: "Yesterday",  priority: "warning" },
      { id: "m5", title: "Materials Received (GRN Completed)", body: "GRN completed for PO-2026-018 — 50 kg Warp received from Sri Venkateswara Textiles.",             time: "2 days ago", priority: "success" },
    ],
  },
  {
    key: "production",
    label: "Production Notifications",
    items: [
      { id: "p1", title: "Batch Created",                     body: "BATCH-090 created for Anand K. — Design BKB-047, 6 sarees.",                                    time: "1h ago",     priority: "info" },
      { id: "p2", title: "Saree Passed QC",                    body: "Saree #4 from BATCH-086 passed quality check.",                                                 time: "4h ago",     priority: "success" },
      { id: "p3", title: "Saree Failed QC",                    body: "Saree #7 from BATCH-084 failed quality check — irregular zari pattern.",                        time: "6h ago",     priority: "warning" },
      { id: "p4", title: "Batch Completed",                    body: "BATCH-081 completed by Suresh Murti — 4 of 4 sarees woven.",                                    time: "Yesterday",  priority: "success" },
      { id: "p5", title: "Saree Entered Stock",                body: "3 sarees from BATCH-086 entered finished-goods stock.",                                        time: "2 days ago", priority: "info" },
    ],
  },
  {
    key: "batch",
    label: "Batch Notifications",
    items: [
      { id: "b1", title: "New Batch Created",                  body: "BATCH-091 created and queued for assignment.",                                                  time: "20 min ago", priority: "info" },
      { id: "b2", title: "Batch Assigned",                     body: "BATCH-091 assigned to Kamala B. (WV-031).",                                                     time: "1h ago",     priority: "info" },
      { id: "b3", title: "Batch Finalized",                    body: "BATCH-086 finalized — all sarees passed quality check.",                                        time: "Yesterday",  priority: "success" },
      { id: "b4", title: "Batch Due Date Approaching",         body: "BATCH-089 is due in 2 days — 5 of 8 sarees completed so far.",                                   time: "2 days ago", priority: "warning" },
    ],
  },
  {
    key: "payment",
    label: "Payment Notifications",
    items: [
      { id: "pay1", title: "Excel Payment File Uploaded",      body: "Payment sheet for May 2026 uploaded — 84 weaver records processed.",                            time: "3h ago",     priority: "info" },
      { id: "pay2", title: "Payment Matched to Weaver",         body: "Payment of ₹5,040 matched to Ravi Kumar (WV-001) — UTR202603281456.",                          time: "5h ago",     priority: "success" },
      { id: "pay3", title: "Payment Unmatched / Discrepancy",   body: "1 payment record could not be matched to any weaver — please review manually.",                 time: "Yesterday",  priority: "warning" },
      { id: "pay4", title: "Payment Due — Wholesale Customer",  body: "Lakshmi Silks payment of ₹1,20,000 due in 3 days for Invoice #INV-2024-091.",                   time: "2 days ago", priority: "critical" },
    ],
  },
  {
    key: "dispatch",
    label: "Dispatch & Inventory Notifications",
    items: [
      { id: "d1", title: "Saree Dispatched to Shop",           body: "18 sarees dispatched from finishing unit to the Beere Kesava retail shop.",                      time: "2h ago",     priority: "success" },
      { id: "d2", title: "Wholesale Dispatch Confirmed",        body: "24 sarees dispatched to Maheshwari Textiles Pvt. Ltd. — Tracking BKS-DSP-2024-112.",             time: "6h ago",     priority: "success" },
      { id: "d3", title: "Invoice Generated and Sent",          body: "Invoice #INV-2024-092 generated and emailed to Lakshmi Silks.",                                 time: "Yesterday",  priority: "info" },
      { id: "d4", title: "Inventory Item Marked Damaged",       body: "1 saree in shop inventory marked damaged during quality re-check.",                             time: "2 days ago", priority: "warning" },
    ],
  },
];

function CategorySection({ label, items }: { label: string; items: CatNotif[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 32 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16 }}
      >
        <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold, flexShrink: 0 }} />
        <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown, letterSpacing: "-0.2px" }}>{label}</span>
        <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 999, padding: "3px 10px" }}>{items.length}</span>
        <div style={{ flex: 1, height: 1, background: T.borderDef }} />
        {open ? <ChevronUp size={18} color={T.taupe} /> : <ChevronDown size={18} color={T.taupe} />}
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((n, i) => {
            const cfg = PRIORITY[n.priority];
            const PriorityIcon = cfg.Icon;
            return (
              <FadeUp key={n.id} delay={i * 0.03}>
                <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${cfg.border}`, boxShadow: "0 2px 14px rgba(110,15,45,0.05)", overflow: "hidden" }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />
                  <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 18 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <PriorityIcon size={20} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.luxuryBrown, lineHeight: 1.3, flex: 1 }}>{n.title}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>
                          <PriorityIcon size={10} /> {cfg.label}
                        </span>
                      </div>
                      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13.5, color: T.taupe, lineHeight: 1.7, margin: "0 0 10px" }}>{n.body}</p>
                      <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{n.time}</span>
                    </div>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}>
      {children}
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export function NotificationsPage() {
  const [filter, setFilter]     = useState<Filter>("all");
  const [selected, setSelected] = useState<Notif | null>(null);
  const [readIds, setReadIds]   = useState<Set<number>>(new Set(DATA.filter(n => n.read).map(n => n.id)));

  const markRead    = (id: number) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(DATA.map(n => n.id)));

  const filtered = filter === "all" ? DATA : DATA.filter(n => n.priority === filter);
  const unread   = DATA.filter(n => !readIds.has(n.id)).length;

  const grouped: Record<string, Notif[]> = {};
  filtered.forEach(n => { if (!grouped[n.date]) grouped[n.date] = []; grouped[n.date].push(n); });

  const countByPriority = (p: Priority) => DATA.filter(n => n.priority === p).length;

  return (
    <div style={{ minHeight: "calc(100vh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section style={{ background: G.card, padding: "56px 56px 0", position: "relative", overflow: "hidden", minHeight: 220 }}>
        {/* Background texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.025) 60px, rgba(200,155,71,0.025) 61px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)`, pointerEvents: "none" }} />
        <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 20, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Admin · Notifications
            </span>
          </motion.div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(32px, 3.5vw, 52px)", color: T.warmCream, margin: 0, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                Notifications
                {unread > 0 && (
                  <span style={{ marginLeft: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", background: T.antiqueGold, color: T.deepWine, fontFamily: F.mono, fontWeight: 700, fontSize: 14, borderRadius: 999, padding: "4px 14px", verticalAlign: "middle", position: "relative", top: -4 }}>
                    {unread} new
                  </span>
                )}
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
                style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "10px 0 0", letterSpacing: "0.05px" }}>
                Live operational alerts, stock updates, payment reminders, and production activity.
              </motion.p>
            </div>

            {/* Mark all read */}
            {unread > 0 && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                onClick={markAllRead}
                whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.18)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, border: "1px solid rgba(200,155,71,0.30)", background: "rgba(200,155,71,0.09)", color: T.antiqueGold, fontFamily: F.ui, fontWeight: 600, fontSize: 13, cursor: "pointer", letterSpacing: "0.1px" }}>
                <Check size={15} /> Mark all read
              </motion.button>
            )}
          </div>

          {/* Metrics row */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
            style={{ display: "flex", gap: 0, marginTop: 40, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total",    val: DATA.length,                                        Icon: Bell,          hi: false },
              { label: "Unread",   val: unread,                                             Icon: Inbox,         hi: unread > 0 },
              { label: "Critical", val: countByPriority("critical"),                        Icon: AlertTriangle, hi: false, col: "#FCA5A5" },
              { label: "Today",    val: DATA.filter(n => n.date === "Today").length,        Icon: Zap,           hi: false },
              { label: "Resolved", val: readIds.size,                                       Icon: CheckCircle2,  hi: false, col: "#6EE7B7" },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "20px 22px", borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={18} color={m.hi ? T.antiqueGold : (m.col || "rgba(245,232,208,0.70)")} />
                </div>
                <div>
                  <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: m.hi ? "rgba(200,155,71,0.90)" : "rgba(245,232,208,0.55)", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 34, color: m.hi ? T.goldLight : (m.col || T.warmCream), lineHeight: 1, ...NUM }}>{m.val}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <div style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, padding: "0 56px", position: "sticky", top: 90, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, height: 58 }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const count = f.key === "all" ? DATA.length : DATA.filter(n => n.priority === f.key).length;
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
      <div style={{ padding: "40px 56px 80px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* Left — list */}
        <div style={{ flex: selected ? "0 0 520px" : 1, minWidth: 0 }}>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 40 }}>
              {/* Date group header */}
              <FadeUp>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.2px" }}>{date}</span>
                  <div style={{ flex: 1, height: 1, background: T.borderDef, marginLeft: 4 }} />
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>
              </FadeUp>

              {/* Notification cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {items.map((n, i) => {
                  const cfg = PRIORITY[n.priority];
                  const catCfg = CATEGORY[n.category];
                  const isRead = readIds.has(n.id);
                  const isSelected = selected?.id === n.id;
                  const PriorityIcon = cfg.Icon;
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
                          border: isSelected ? `1.5px solid ${T.royalBurgundy}` : `1px solid ${isRead ? T.borderDef : cfg.border}`,
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
                                <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 17, color: T.luxuryBrown, lineHeight: 1.3, flex: 1, opacity: isRead ? 0.8 : 1 }}>
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

                                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{n.date} · {n.time}</span>

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
                              onClick={e => { e.stopPropagation(); isRead ? setReadIds(prev => { const s = new Set(prev); s.delete(n.id); return s; }) : markRead(n.id); }}
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
          ))}

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
                const catCfg = CATEGORY[selected.category];
                const PriorityIcon = cfg.Icon;
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
                          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{selected.date} · {selected.time}</div>
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
                          { label: "Priority",  value: cfg.label,           color: cfg.color },
                          { label: "Category",  value: catCfg.label,        color: catCfg.color },
                          { label: "Date",      value: selected.date,       color: T.luxuryBrown },
                          { label: "Time",      value: selected.time,       color: T.luxuryBrown },
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
                      <motion.button onClick={() => markRead(selected.id)}
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

      {/* ── Categorised notification sections ── */}
      <div style={{ padding: "0 56px 80px" }}>
        {CATEGORY_SECTIONS.map(sec => (
          <CategorySection key={sec.key} label={sec.label} items={sec.items} />
        ))}
      </div>
    </div>
  );
}
