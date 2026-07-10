import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, Home, ShoppingBag, Package, Users, BarChart2, Camera, Check, X,
  Menu, LogOut, Search, Printer, MessageSquare, Star, AlertTriangle,
  RotateCcw, CreditCard, Wallet, Plus, ChevronLeft, ArrowUpRight,
  Send, IndianRupee, Flower2, Phone,
  TrendingUp, ArrowRight, Layers, FileText, ShoppingCart, ClipboardList,
  UserRound, Palette, Scale, ThumbsDown, UserPlus, Pencil, PhoneCall, MapPin,
  QrCode, Clock as ClockIcon, CheckCircle2, Building2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { getSareeTypeByCode } from "./RatesPricingPage";
import { SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE, SHOP_MOBILE_HEADER_H } from "./SectionNavigator";
import { useResponsive } from "./useResponsive";

// ─── Tokens ─────────────────────────────────────────────────────────────────
const C = {
  burg: "#6B1A2A", dark: "#3D0E1A", gold: "#C4923A", green: "#1E6640",
  crim: "#C0392B", text: "#1A0A0F", muted: "#8B7060",
  bdr: "rgba(139,26,46,0.12)", cream: "#F0E8D0", inp: "#FFF8E7", white: "#FFFFFF",
};
const F = { d: "'Plus Jakarta Sans', sans-serif", u: "'Inter', sans-serif", m: "'JetBrains Mono', monospace" };

// Shop Staff secondary accent — distinguishes this portal's active states from Admin's burgundy.
const TEAL = "#0F766E";

// ─── Desktop Hero Background Images ─────────────────────────────────────────
const SHOP_BG = "https://images.unsplash.com/photo-1569909115134-a0426936c879?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";
const SILK_BG = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";

// ─── Shop Desktop Hero ───────────────────────────────────────────────────────
interface ShopHeroStat { label: string; val: string; sub: string; highlight?: boolean; crimson?: boolean }
interface ShopHeroPill { text: string; color?: string }
interface ShopDesktopHeroProps {
  breadcrumb: string; titleMain: string; titleSub: string; description: string;
  pills?: ShopHeroPill[]; alertBadge?: string; stats?: ShopHeroStat[]; bgUrl?: string; bp?: "tablet" | "desktop";
}
function ShopDesktopHero({ breadcrumb, titleMain, titleSub, description, pills, alertBadge, stats, bgUrl, bp = "desktop" }: ShopDesktopHeroProps) {
  const isTablet = bp === "tablet";
  return (
    <div style={{ position: "relative", overflow: "hidden", background: C.dark }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${bgUrl || SHOP_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.20 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(61,14,26,0.96) 0%, rgba(61,14,26,0.78) 60%, rgba(61,14,26,0.52) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, padding: isTablet ? "28px 28px 0" : "40px 48px 0" }}>
        <div style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.40)", textTransform: "uppercase" as const, marginBottom: 20 }}>{breadcrumb}</div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: isTablet ? 40 : 62, color: "#FFF", lineHeight: 1 }}>
            {titleMain} <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: isTablet ? 26 : 38, color: C.gold }}>{titleSub}</span>
          </div>
          {alertBadge && (
            <div style={{ background: "rgba(196,146,58,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.gold }}>{alertBadge}</span>
            </div>
          )}
        </div>
        <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.62)", lineHeight: 1.65, maxWidth: 640, marginBottom: 22 }}>{description}</div>
        {pills && pills.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 32 }}>
            {pills.map((p, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 16px" }}>
                <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {stats && stats.length > 0 && (
        <div style={{
          position: "relative", zIndex: 1, display: "flex", flexWrap: isTablet ? "wrap" as const : "nowrap" as const,
          margin: isTablet ? "0 28px" : "0 48px", borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              width: isTablet ? "calc(50% - 1px)" : undefined, flex: isTablet ? undefined : 1,
              boxSizing: "border-box" as const,
              padding: isTablet ? "18px 20px" : "24px 28px",
              borderRight: isTablet ? (i % 2 === 0 ? "1px solid rgba(255,255,255,0.10)" : "none") : (i < stats.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none"),
              background: s.highlight ? "rgba(196,146,58,0.18)" : "transparent",
            }}>
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.38)", textTransform: "uppercase" as const, marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: isTablet ? 38 : 54, color: s.highlight ? C.gold : s.crimson ? "#FF8080" : "#FFF", lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1, height: 32 }} />
    </div>
  );
}

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

// ─── Shared UI ───────────────────────────────────────────────────────────────
function SectionTitle({ title, link, onLink, id }: { title: string; link?: string; onLink?: () => void; id?: string }) {
  return (
    <div id={id} style={{ display: "flex", alignItems: "center", margin: "20px 20px 12px", gap: 10 }}>
      <div style={{ width: 4, height: 20, background: C.burg, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, flex: 1 }}>{title}</span>
      {link && <button onClick={onLink} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 13, color: C.gold, cursor: "pointer", padding: 0 }}>{link}</button>}
    </div>
  );
}

function HeroHeader({ eyebrow, title, sub, desc }: { eyebrow: string; title: string; sub: string; desc?: string }) {
  return (
    <div style={{ background: C.dark, padding: "24px 20px 22px" }}>
      <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.50)", textTransform: "uppercase" as const, marginBottom: 6 }}>{eyebrow}</div>
      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 36, color: "#FFF", lineHeight: 1.1, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 22, color: C.gold, marginBottom: desc ? 8 : 0 }}>{sub}</div>
      {desc && <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.60)", lineHeight: 1.5 }}>{desc}</div>}
    </div>
  );
}

function StatsStrip({ items }: { items: { label: string; val: string; sub: string; highlight?: boolean; crimson?: boolean }[] }) {
  const { isMobile, isTablet } = useResponsive();
  const wrap2 = (isMobile || isTablet) && items.length === 4;
  return (
    <div style={{ background: C.dark, display: "flex", flexWrap: wrap2 ? "wrap" as const : "nowrap" as const, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {items.map((s, i) => (
        <div key={i} style={{
          flex: wrap2 ? undefined : 1, width: wrap2 ? "calc(50% - 1px)" : undefined, boxSizing: "border-box" as const,
          padding: "14px 10px", textAlign: "center" as const,
          borderRight: wrap2 ? (i % 2 === 0 ? "1px solid rgba(255,255,255,0.08)" : "none") : (i < items.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none"),
          borderTop: wrap2 && i >= 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
          background: s.highlight ? C.gold : "transparent",
        }}>
          <div style={{ fontFamily: F.m, fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase" as const, color: s.highlight ? C.text : "rgba(255,255,255,0.50)", marginBottom: 5 }}>{s.label}</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: s.highlight ? C.text : s.crimson ? "#FF6B6B" : "#FFF", lineHeight: 1 }}>{s.val}</div>
          <div style={{ fontFamily: F.u, fontSize: 11, color: s.highlight ? "rgba(26,10,15,0.55)" : "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)", ...style }}>
      {children}
    </div>
  );
}

function Btn({ label, icon, onClick, variant = "burg", style }: { label: string; icon?: React.ReactNode; onClick?: () => void; variant?: "burg" | "green" | "gold" | "ghost" | "crim"; style?: React.CSSProperties }) {
  const bg = { burg: C.burg, green: C.green, gold: C.gold, ghost: "transparent", crim: C.crim };
  const col = { burg: "#FFF", green: "#FFF", gold: C.text, ghost: C.burg, crim: "#FFF" };
  const brd = { burg: "none", green: "none", gold: "none", ghost: `1px solid ${C.burg}`, crim: "none" };
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      height: 52, borderRadius: 999, border: brd[variant], background: bg[variant],
      fontFamily: F.u, fontWeight: 600, fontSize: 14, color: col[variant], cursor: "pointer",
      ...style,
    }}>
      {icon}{label}
    </button>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ background: bg, color, borderRadius: 999, padding: "2px 10px", fontFamily: F.u, fontSize: 11, fontWeight: 500, display: "inline-block" }}>{label}</span>;
}

// ─── PAGE 01 — SHOP HOME ────────────────────────────────────────────────────
function ShopHome({ onNavigate }: { onNavigate: (tab: TabId | "return") => void }) {
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
        { label: "TODAY'S REVENUE", val: "₹1,04,000", sub: "From 12 sales" },
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
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>
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
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 2, lineHeight: 1.4 }}>Wrong Design · Smt. Meenakshi · ₹12,000</div>
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
function NewSaleFlow() {
  const { isMobile, isTablet } = useResponsive();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "success">(1);
  const [sareeFound, setSareeFound] = useState(false);
  const [manualId, setManualId] = useState("");
  const [payment, setPayment] = useState<"cash" | "upi" | "card" | "other" | null>(null);
  const [payRef, setPayRef] = useState("");
  const [phone, setPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; phone: string; purchases: number; total: string; lastPurchase: string; initials: string } | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const saree = { id: "PADMA-L1-004", design: "BKB-045", name: "Cream Zari Border Saree", type: "Self Brocade · SB-001", typeCode: "SB-001", weight: "842 grams", weaver: "Padma Veni" };

  // Original price is auto-filled from the saree type's retail rate (RatesPricingPage)
  const originalPrice = Number(getSareeTypeByCode(saree.typeCode)?.retail ?? 0);
  const [soldPrice, setSoldPrice] = useState(originalPrice);
  const priceDiscount = originalPrice - soldPrice;
  const fmtPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const prevCustomers = [
    { name: "Smt. Annapurna Devi", phone: "98765 43210", purchases: 18, total: "₹1,84,000", lastPurchase: "3 days ago", initials: "AD" },
    { name: "Smt. Meenakshi Rao", phone: "87654 32109", purchases: 7, total: "₹68,500", lastPurchase: "2 weeks ago", initials: "MR" },
    { name: "Smt. Lakshmi Prasad", phone: "76543 21098", purchases: 12, total: "₹1,12,000", lastPurchase: "1 month ago", initials: "LP" },
    { name: "Smt. Savitri Devi", phone: "65432 10987", purchases: 3, total: "₹24,000", lastPurchase: "3 months ago", initials: "SD" },
    { name: "Smt. Radha Krishnan", phone: "54321 09876", purchases: 22, total: "₹2,40,000", lastPurchase: "1 week ago", initials: "RK" },
  ];

  const filteredCustomers = custSearch.length >= 2
    ? prevCustomers.filter(c =>
        c.phone.replace(/\s/g, "").includes(custSearch.replace(/\s/g, "")) ||
        c.name.toLowerCase().includes(custSearch.toLowerCase())
      )
    : prevCustomers;

  const handleScan = () => setSareeFound(true);

  const handleSelectCustomer = (cust: typeof prevCustomers[0]) => {
    setSelectedCustomer(cust);
    setCustName(cust.name);
    setPhone(cust.phone);
    setCustSearch(cust.name);
    setShowCustomerList(false);
    setIsEditingCustomer(false);
    setIsNewCustomer(false);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditingCustomer(false);
    setIsNewCustomer(true);
    setShowCustomerList(false);
    setCustName(""); setPhone(""); setCustAddress(""); setCustSearch("");
  };

  const resetSale = () => {
    setStep(1); setSareeFound(false); setManualId(""); setPayment(null); setPayRef("");
    setPhone(""); setCustName(""); setCustAddress("");
    setCustSearch(""); setSelectedCustomer(null); setIsEditingCustomer(false);
    setIsNewCustomer(false); setShowCustomerList(false); setSoldPrice(originalPrice);
  };

  const canProceedStep1 = selectedCustomer !== null || (isNewCustomer && custName.trim() !== "");

  if (showBill) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <div style={{ background: C.burg, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowBill(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><ChevronLeft size={24} color="#FFF" /></button>
          <span style={{ fontFamily: F.d, fontWeight: 600, fontSize: 18, color: "#FFF" }}>Bill Preview</span>
        </div>
        <div style={{
          margin: isMobile ? "16px 20px" : "24px auto",
          width: isMobile ? undefined : isTablet ? "80vw" : 480,
          maxWidth: isMobile ? undefined : isTablet ? "80vw" : 480,
          background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)", overflow: "hidden",
        }}>
          <div style={{ background: C.burg, padding: "18px 20px", textAlign: "center" as const }}>
            <Flower2 size={24} color="rgba(255,255,255,0.7)" style={{ margin: "0 auto 6px" }} />
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Beere Kesava & Brothers Silks</div>
            <div style={{ fontFamily: F.m, fontSize: 11, color: C.gold, marginTop: 2 }}>Est. 1999</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>Main Street, Silk Market, Bangalore — 560001</div>
          </div>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>Bill No: BKB-2026-1842</span>
              <span style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>13 Jun 2026 · 11:42 AM</span>
            </div>
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginBottom: 12 }}>
              {[
                ["Saree ID", saree.id], ["Design Code", saree.design], ["Description", saree.name],
                ["Customer", custName || "Smt. Annapurna"], ["Phone", `+91 ${phone || "98765 43210"}`],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Total Amount:</span>
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.gold }}>{fmtPrice(soldPrice)}</span>
            </div>
            <div style={{ textAlign: "center" as const, marginBottom: 8 }}>
              <Chip label={`Payment: ${payment === "upi" ? "UPI" : payment === "card" ? "Card" : payment === "cash" ? "Cash" : "Other"}`} color={C.burg} bg="rgba(107,26,42,0.08)" />
            </div>
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 14, textAlign: "center" as const }}>
              <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 13, color: C.burg }}>Thank you for shopping with Beere Kesava & Brothers Silks</div>
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 2, color: C.gold, marginTop: 4, textTransform: "uppercase" as const }}>Tradition · Trust · Timeless Quality</div>
            </div>
          </div>
        </div>
        <div style={{
          padding: isMobile ? "0 20px" : "0 20px",
          margin: isMobile ? undefined : "0 auto", width: isMobile ? undefined : isTablet ? "80vw" : 480,
          display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 10,
        }}>
          <Btn label="Print Bill" icon={<Printer size={16} />} style={{ width: "100%", background: C.burg }} />
          <Btn label="Send to Customer on WhatsApp" icon={<MessageSquare size={16} />} style={{ width: "100%", background: C.green }} />
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · NEW SALE" title="New Retail" sub="Sale" />
        <div style={{ padding: "36px 20px 0", textAlign: "center" as const }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(30,102,64,0.10)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Check size={38} color={C.green} />
            </div>
          </motion.div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.text, marginBottom: 6 }}>Sale Confirmed!</div>
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 24 }}>Bill has been generated successfully.</div>
        </div>
        <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 15, color: C.burg, textAlign: "center" as const, marginBottom: 14 }}>Beere Kesava & Brothers Silks · Est. 1999</div>
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
              {[
                ["Saree ID", saree.id, true], ["Design", saree.name, false],
                ["Customer", custName || "Smt. Annapurna", false],
                ["Date & Time", "13 Jun 2026 · 11:42 AM", true],
                ["Payment", payment?.toUpperCase() ?? "UPI", true],
              ].map(([k, v, mono], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k as string}</span>
                  <span style={{ fontFamily: mono ? F.m : F.u, fontSize: 13, color: C.text }}>{v as string}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${C.bdr}`, paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Amount</span>
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>{fmtPrice(soldPrice)}</span>
              </div>
            </div>
          </div>
        </Card>
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 16 }}>
          <Btn label="Print Bill" icon={<Printer size={16} />} onClick={() => setShowBill(true)} style={{ width: "100%", background: C.burg }} />
          <Btn label="Send to Customer on WhatsApp" icon={<MessageSquare size={16} />} style={{ width: "100%", background: C.green }} />
        </div>

        <div style={{ padding: "0 20px" }}>
          <Btn label="Record Another Sale" icon={<Plus size={16} />} variant="ghost" onClick={resetSale} style={{ width: "100%", borderColor: C.burg }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · NEW SALE" title="New Retail" sub="Sale" desc="Record a sale at the shop counter" />

      {/* Step progress with labels */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["Customer", "Scan Saree", "Payment", "Confirm"] as const).map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.burg : "rgba(139,26,46,0.15)", marginBottom: 5 }} />
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? C.burg : C.muted, textAlign: "center" as const }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1 — Customer Details ── */}
      {step === 1 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Customer Details</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Search a previous customer or add a new one</div>
          </div>

          {/* Customer Search Input */}
          {!isNewCustomer && (
            <div style={{ margin: "0 20px 12px", position: "relative" as const }}>
              <div style={{ position: "relative" as const }}>
                <Search size={16} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const }} />
                <input
                  value={custSearch}
                  onChange={e => { setCustSearch(e.target.value); setShowCustomerList(true); if (selectedCustomer) setSelectedCustomer(null); }}
                  onFocus={() => setShowCustomerList(true)}
                  placeholder="Search by name or phone number..."
                  style={{
                    width: "100%", height: 52, background: C.inp,
                    border: `1.5px solid ${showCustomerList && !selectedCustomer ? C.burg : C.bdr}`,
                    borderRadius: showCustomerList && !selectedCustomer ? "12px 12px 0 0" : 12,
                    padding: "0 46px 0 42px",
                    fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const,
                  }}
                />
                <PhoneCall size={14} color={C.gold} style={{ position: "absolute" as const, right: 14, top: "50%", transform: "translateY(-50%)" }} />
              </div>

              {/* Customer dropdown */}
              {showCustomerList && !selectedCustomer && (
                <div style={{
                  background: C.white, border: `1.5px solid ${C.burg}`, borderTop: "none",
                  borderRadius: "0 0 14px 14px",
                  boxShadow: "0 8px 24px rgba(44,24,16,0.12)", overflow: "hidden",
                }}>
                  <div style={{ padding: "8px 14px", background: "rgba(107,26,42,0.03)", borderBottom: `1px solid ${C.bdr}` }}>
                    <span style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                      {custSearch.length >= 2 ? `${filteredCustomers.length} result${filteredCustomers.length !== 1 ? "s" : ""} for "${custSearch}"` : "Recent Customers"}
                    </span>
                  </div>
                  {filteredCustomers.length > 0 ? filteredCustomers.slice(0, 4).map((c, i) => (
                    <button key={i} onClick={() => handleSelectCustomer(c)} style={{
                      width: "100%", background: "none", border: "none",
                      borderBottom: i < Math.min(filteredCustomers.length, 4) - 1 ? `1px solid ${C.bdr}` : "none",
                      padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.burg}, ${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{c.initials}</span>
                      </div>
                      <div style={{ flex: 1, textAlign: "left" as const }}>
                        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{c.name}</div>
                        <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 1 }}>+91 {c.phone}</div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{c.purchases} purchases</div>
                        <div style={{ fontFamily: F.u, fontSize: 10, color: C.gold }}>{c.lastPurchase}</div>
                      </div>
                    </button>
                  )) : (
                    <div style={{ padding: "14px", textAlign: "center" as const }}>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No customer found for "{custSearch}"</div>
                    </div>
                  )}
                  {/* Add new customer option */}
                  <button onClick={handleAddNew} style={{
                    width: "100%", background: "rgba(107,26,42,0.04)", border: "none",
                    borderTop: `1px solid ${C.bdr}`, padding: "12px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(107,26,42,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserPlus size={14} color={C.burg} />
                    </div>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.burg }}>Add New Customer</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selected customer card */}
          {selectedCustomer && !isEditingCustomer && (
            <motion.div key="selected-cust" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card style={{ margin: "0 20px 14px", overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.green}, rgba(30,102,64,0.3))` }} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg, ${C.burg}, ${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF" }}>{selectedCustomer.initials}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>{selectedCustomer.name}</div>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>+91 {selectedCustomer.phone}</div>
                      </div>
                    </div>
                    <button onClick={() => setIsEditingCustomer(true)} style={{ background: "rgba(107,26,42,0.07)", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <Pencil size={12} color={C.burg} />
                      <span style={{ fontFamily: F.u, fontSize: 11, color: C.burg }}>Edit</span>
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { val: String(selectedCustomer.purchases), label: "Purchases", color: C.burg },
                      { val: selectedCustomer.total, label: "Lifetime", color: C.gold },
                      { val: selectedCustomer.lastPurchase, label: "Last Visit", color: C.green },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "rgba(107,26,42,0.04)", borderRadius: 10, padding: "8px 10px", textAlign: "center" as const }}>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: s.color, lineHeight: 1.3 }}>{s.val}</div>
                        <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 8, padding: "8px 12px" }}>
                    <Check size={13} color={C.green} />
                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.green }}>Existing customer — details filled automatically</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Edit existing or new customer form */}
          {(isEditingCustomer || isNewCustomer) && (
            <motion.div key="cust-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ margin: "0 20px" }}>
                {isNewCustomer && (
                  <div style={{ background: "rgba(196,146,58,0.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <UserPlus size={14} color={C.gold} />
                    <span style={{ fontFamily: F.u, fontSize: 12, color: "#8B6520" }}>New Customer — A profile will be created after this sale</span>
                  </div>
                )}
                {isEditingCustomer && (
                  <div style={{ background: "rgba(107,26,42,0.06)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Pencil size={14} color={C.burg} />
                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>Editing {selectedCustomer?.name}'s details</span>
                  </div>
                )}
                <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "1fr 1fr", gap: isMobile ? 0 : 16 }}>
                  {[
                    { label: "Full Name", val: custName, setter: setCustName, placeholder: "e.g. Smt. Annapurna Devi", type: "text", mono: false },
                    { label: "Phone Number", val: phone, setter: setPhone, placeholder: "10-digit mobile number", type: "tel", mono: true },
                  ].map((f, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "block", marginBottom: 8 }}>{f.label}</label>
                      <input value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} type={f.type}
                        style={{ width: "100%", height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: f.mono ? F.m : F.u, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <MapPin size={14} color={C.muted} /> Address <span style={{ color: C.muted, fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Door number, street, city..." rows={2}
                    style={{ width: "100%", background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "12px 16px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none" as const, boxSizing: "border-box" as const }}
                  />
                </div>
                {isEditingCustomer && (
                  <button onClick={() => setIsEditingCustomer(false)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", marginBottom: 14, padding: 0, textDecoration: "underline" }}>
                    ← Cancel — keep original details
                  </button>
                )}
                {isNewCustomer && (
                  <button onClick={() => { setIsNewCustomer(false); setCustSearch(""); }} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", marginBottom: 14, padding: 0, textDecoration: "underline" }}>
                    ← Search existing customers instead
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* If nothing selected and no form, show "add new" shortcut */}
          {!selectedCustomer && !isNewCustomer && !showCustomerList && (
            <div style={{ margin: "4px 20px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or</span>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
              </div>
              <button onClick={handleAddNew} style={{ width: "100%", height: 50, borderRadius: 12, border: `1.5px dashed rgba(107,26,42,0.30)`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <UserPlus size={16} color={C.burg} />
                <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.burg }}>Add New Customer</span>
              </button>
            </div>
          )}

          <div style={{ padding: "8px 20px 0", display: "flex", gap: 10 }}>
            <Btn
              label="Next — Scan Saree →"
              onClick={() => canProceedStep1 ? setStep(2) : undefined}
              style={{ flex: 1, background: canProceedStep1 ? C.burg : "#C0C0C0", cursor: canProceedStep1 ? "pointer" : "not-allowed" }}
            />
          </div>
        </div>
      )}

      {/* ── Step 2 — Scan Saree ── */}
      {step === 2 && (
        <div style={{ marginTop: 12 }}>
          {!sareeFound ? (
            <>
              {/* Premium camera scan zone */}
              <div
                onClick={handleScan}
                style={{
                  margin: "0 20px 18px",
                  background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 100%)`,
                  borderRadius: 20, padding: "32px 24px", cursor: "pointer",
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14,
                  position: "relative" as const, overflow: "hidden",
                  boxShadow: "0 12px 36px rgba(107,26,42,0.30)",
                }}
              >
                <div style={{ position: "absolute" as const, top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(196,146,58,0.14)" }} />
                <div style={{ position: "absolute" as const, bottom: -36, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{
                  width: 72, height: 72, borderRadius: 18, position: "relative" as const, zIndex: 1,
                  background: "rgba(255,255,255,0.13)", border: "1.5px solid rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
                }}>
                  <Camera size={34} color="#FFF" />
                </div>
                <div style={{ textAlign: "center" as const, position: "relative" as const, zIndex: 1 }}>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", marginBottom: 6 }}>Scan Saree Barcode</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>Point camera at the barcode tag on the saree label</div>
                </div>
                <div style={{
                  background: C.gold, borderRadius: 999, padding: "9px 24px",
                  minHeight: 56, minWidth: 200, boxSizing: "border-box" as const,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative" as const, zIndex: 1,
                  fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text,
                  boxShadow: "0 2px 8px rgba(196,146,58,0.40)",
                }}>
                  Tap to Open Camera
                </div>
              </div>

              {/* Or divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px 16px" }}>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
              </div>

              {/* Manual ID input */}
              <div style={{ margin: "0 20px 20px" }}>
                <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Saree ID</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="e.g. PADMA-L1-004"
                    style={{ flex: 1, height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none" }}
                  />
                  {manualId.length > 3 && (
                    <button onClick={() => setSareeFound(true)} style={{ height: 52, borderRadius: 12, background: C.burg, border: "none", padding: "0 20px", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Find</button>
                  )}
                </div>
              </div>
              <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }} />
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Found banner */}
              <div style={{ margin: "0 20px 14px", background: "rgba(30,102,64,0.08)", border: `1.5px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={17} color="#FFF" />
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green }}>Saree Found Successfully</div>
                  <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>ID: {saree.id}</div>
                </div>
              </div>

              {/* Saree details card */}
              <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
                <div style={{ padding: 18, display: isMobile ? "block" : "flex", gap: isMobile ? 0 : 24, alignItems: isMobile ? undefined : "flex-start" }}>
                  <div style={{ flex: isMobile ? undefined : 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 15, color: C.burg, marginBottom: 4 }}>{saree.id}</div>
                        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>{saree.name}</div>
                      </div>
                      <Chip label="Factory" color={C.green} bg="rgba(30,102,64,0.10)" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                      {[
                        ["Design Code", saree.design, true],
                        ["Type", saree.type, false],
                        ["Weight", saree.weight, true],
                        ["Weaver", saree.weaver, false],
                      ].map(([k, v, mono], i) => (
                        <div key={i}>
                          <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 3 }}>{k as string}</div>
                          <div style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: isMobile ? `1px solid ${C.bdr}` : "none", borderLeft: isMobile ? "none" : `1px solid ${C.bdr}`, paddingTop: isMobile ? 14 : 0, marginTop: isMobile ? 16 : 0, paddingLeft: isMobile ? 0 : 24, width: isMobile ? undefined : 220, flexShrink: 0 }}>
                    <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Selling Price (₹)</label>
                    <div style={{ position: "relative" as const }}>
                      <span style={{ position: "absolute" as const, left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold, pointerEvents: "none" as const }}>₹</span>
                      <input
                        type="number"
                        value={soldPrice}
                        onChange={e => setSoldPrice(e.target.value === "" ? 0 : Number(e.target.value))}
                        style={{ width: "100%", height: 56, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px 0 36px", fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                      />
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 6 }}>Default: {fmtPrice(originalPrice)}</div>
                  </div>
                </div>
              </Card>

              <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                <button onClick={() => setSareeFound(false)} style={{ height: 52, borderRadius: 12, border: `1px solid ${C.bdr}`, background: "transparent", padding: "0 18px", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer" }}>Rescan</button>
                <Btn label="Next — Payment →" onClick={() => setStep(3)} style={{ flex: 1, background: C.burg }} />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Step 3 — Payment Method ── */}
      {step === 3 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Payment Method</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>How is the customer paying?</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px 16px" }}>
            {[
              { id: "cash" as const, label: "Cash", sub: "Physical currency", icon: <IndianRupee size={22} /> },
              { id: "upi" as const, label: "UPI", sub: "GPay, PhonePe, etc.", icon: <Wallet size={22} /> },
              { id: "card" as const, label: "Card", sub: "Debit or Credit", icon: <CreditCard size={22} /> },
              { id: "other" as const, label: "Other", sub: "Cheque / Transfer", icon: <Plus size={22} /> },
            ].map(p => (
              <button key={p.id} onClick={() => setPayment(p.id)} style={{
                padding: "16px 14px", borderRadius: 14,
                border: `${payment === p.id ? 2 : 1}px solid ${payment === p.id ? C.burg : C.bdr}`,
                background: payment === p.id ? "rgba(107,26,42,0.06)" : C.white,
                cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 8,
                position: "relative" as const,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: payment === p.id ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.cloneElement(p.icon, { color: payment === p.id ? C.burg : C.muted })}
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: payment === p.id ? C.burg : C.text }}>{p.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 2 }}>{p.sub}</div>
                </div>
                {payment === p.id && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={10} color={C.text} /></div>}
              </button>
            ))}
          </div>
          {payment === "upi" && (
            <div style={{ margin: "0 20px 16px" }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>UPI Reference (Optional)</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ID"
                style={{ width: "100%", height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
            </div>
          )}
          {payment === "card" && (
            <div style={{ margin: "0 20px 16px" }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Last 4 Digits (Optional)</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} maxLength={4} placeholder="e.g. 4872"
                style={{ width: "100%", height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 18, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
            </div>
          )}
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={() => setStep(2)} style={{ flex: 1 }} />
            <Btn label="Next — Confirm →" onClick={() => payment && setStep(4)} style={{ flex: 2, background: payment ? C.burg : "#C0C0C0", cursor: payment ? "pointer" : "not-allowed" }} />
          </div>
        </div>
      )}

      {/* ── Step 4 — Confirm Sale ── */}
      {step === 4 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Review & Confirm Sale</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Please verify all details before confirming</div>
          </div>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
            <div style={{ padding: 18 }}>
              {[
                { label: "Saree ID", value: saree.id, mono: true },
                { label: "Design", value: saree.name, mono: false },
                { label: "Customer", value: custName || "Smt. Annapurna Devi", mono: false },
                { label: "Phone", value: `+91 ${phone || "98765 43210"}`, mono: true },
                { label: "Payment", value: payment?.toUpperCase() ?? "UPI", mono: true },
              ].map(({ label, value, mono }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: C.text, textAlign: "right" as const, maxWidth: "60%" }}>{value}</span>
                </div>
              ))}
              {soldPrice !== originalPrice && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Original Price</span>
                  <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted, textDecoration: "line-through" }}>{fmtPrice(originalPrice)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sold For</span>
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: C.burg }}>{fmtPrice(soldPrice)}</span>
              </div>
              {priceDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <Chip label={`Discount: ${fmtPrice(priceDiscount)}`} color="#8B6018" bg="rgba(196,146,58,0.15)" />
                </div>
              )}
            </div>
          </Card>
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            <Btn label="Confirm Sale — Generate Bill" onClick={() => setStep("success")} style={{ width: "100%", background: C.green, height: 56 }} />
            <Btn label="← Edit Details" variant="ghost" onClick={() => setStep(3)} style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE 03 — SHOP INVENTORY ────────────────────────────────────────────────
function ShopInventory() {
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Sarees");

  const inventory = [
    { id: "PADMA-L1-004", src: "factory", design: "BKB-045", name: "Cream Zari Border", color: "#E8D5B0", sareeColor: "Cream", type: "Self Brocade", price: "₹8,500", received: "Received 10 Jun", status: "available", supplier: null },
    { id: "RAVI-L2-008",  src: "factory", design: "BKB-031", name: "Maroon Heavy Zari", color: "#8B2020", sareeColor: "Maroon", type: "Heavy Brocade", price: "₹12,000", received: "Received 09 Jun", status: "available", supplier: null },
    { id: "BKB-L3-002",   src: "factory", design: "BKB-022", name: "Cream Plain Silk",  color: "#F5F5DC", sareeColor: "Cream", type: "Plain Weave", price: "₹5,500",  received: "Received 08 Jun", status: "available", supplier: null },
    { id: "EXT-RAVI-001", src: "external", design: "External", name: "Silk Checks",      color: "#C9A86C", sareeColor: "Gold",  type: "Checks",      price: "₹6,200",  received: "Purchased 05 Jun", status: "available", supplier: "Ravi Silks" },
    { id: "EXT-RAVI-002", src: "external", design: "External", name: "Floral Design",    color: "#D4A5C5", sareeColor: "Pink",  type: "Floral",      price: "₹7,800",  received: "Purchased 05 Jun", status: "available", supplier: "Ravi Silks" },
    { id: "PADMA-L1-003", src: "factory", design: "BKB-045", name: "Cream Zari Border", color: "#E8D5B0", sareeColor: "Cream", type: "Self Brocade", price: "₹8,500",  received: "Received 07 Jun", status: "reserved", supplier: null },
  ];

  const filters = ["All Sarees", "From Factory", "External Purchase", "Available", "Reserved"];
  const filtered = inventory.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.id.toLowerCase().includes(q) || s.design.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    const matchFilter = filter === "All Sarees" || (filter === "From Factory" && s.src === "factory") || (filter === "External Purchase" && s.src === "external") || (filter === "Available" && s.status === "available") || (filter === "Reserved" && s.status === "reserved");
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · SHOP INVENTORY</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 34, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Shop Inventory</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold }}>Current stock in the shop</div>
      </div>

      {/* Stats — stacked cards, no wrapping/truncation */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <div style={{ flex: "1 1 100%", background: C.dark, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "rgba(255,255,255,0.60)", marginBottom: 6 }}>Total Sarees in Shop</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: "#FFF", lineHeight: 1 }}>84 <span style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.60)" }}>sarees</span></div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "right" as const }}>Currently<br />stocked</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: C.gold, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: "rgba(26,10,15,0.65)", marginBottom: 6 }}>Available for Sale</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.text, lineHeight: 1.1 }}>76 sarees</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>Ready for customers</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(192,57,43,0.12)", border: `1px solid rgba(192,57,43,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.crim, marginBottom: 6 }}>Low Stock Threshold</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.crim, lineHeight: 1.1 }}>Below 15</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.crim, opacity: 0.8, marginTop: 4 }}>Alert active</div>
        </div>
      </div>

      {/* Search + Filter */}
      <Card style={{ margin: "16px 20px", padding: "16px" }}>
        <div style={{ position: "relative" as const, marginBottom: 14 }}>
          <Search size={18} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Saree ID, design, or color" style={{ width: "100%", height: 48, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px 0 42px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4, marginBottom: 12 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, border: `1px solid ${filter === f ? C.burg : C.bdr}`, background: filter === f ? C.burg : "transparent", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: filter === f ? "#FFF" : C.muted, cursor: "pointer", whiteSpace: "nowrap" as const }}>{f}</button>
          ))}
        </div>
        <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>Showing {filtered.length} sarees · {filtered.filter(s => s.status === "available").length} available · {filtered.filter(s => s.status === "reserved").length} reserved</div>
      </Card>

      {/* Inventory list */}
      {filtered.map((s, i) => (
        <div key={i} style={{ margin: "0 20px 12px", background: C.white, borderRadius: 16, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)", padding: 18, display: "flex", gap: 14 }}>
          <div style={{ width: 6, borderRadius: 3, background: s.color, flexShrink: 0, alignSelf: "stretch" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg, fontWeight: 600 }}>{s.id}</span>
              {s.src === "factory"
                ? <Chip label="🏭 Factory" color={C.green} bg="rgba(30,102,64,0.10)" />
                : <Chip label="📦 External" color={C.gold} bg="rgba(196,146,58,0.12)" />}
            </div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 3 }}>{s.name}</div>
            <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>{s.design !== "External" && `${s.design} · `}{s.sareeColor} · {s.type}</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 21, color: C.gold, marginBottom: 6 }}>Retail: {s.price}</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 6, lineHeight: 1.4 }}>{s.received} {s.src === "factory" ? "· From factory dispatch" : "· External purchase"}</div>
            {s.supplier && <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>Supplier: {s.supplier} · <span style={{ fontFamily: F.m, fontSize: 12, background: "rgba(196,146,58,0.12)", color: C.gold, borderRadius: 999, padding: "2px 9px" }}>{s.id}</span></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, flexWrap: "wrap" as const }}>
              <Chip label={s.status === "available" ? "✓ Available" : "Reserved for Customer"} color={s.status === "available" ? C.green : C.gold} bg={s.status === "available" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)"} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ height: 38, padding: "0 16px", borderRadius: 999, border: `1px solid ${C.bdr}`, background: "transparent", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.muted, cursor: "pointer" }}>View</button>
                <button style={{ height: 38, padding: "0 16px", borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer" }}>Sell</button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Low stock notice */}
      <div style={{ margin: "8px 20px", background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "18px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 15, color: C.text, marginBottom: 14, lineHeight: 1.5 }}>⚠ Only 84 sarees in stock. Stock is below the alert threshold.</div>
        <Btn label="Report to Admin" icon={<Send size={16} />} style={{ width: "100%", height: 54, background: C.burg, fontSize: 15 }} />
      </div>
    </div>
  );
}

// ─── PAGE 04 — PROCESS RETURN ────────────────────────────────────────────────
interface ReturnRecord {
  id: string;
  type: "retail" | "wholesale";
  date: string;
  customer?: string;
  originalSaleId?: string;
  reason?: string;
  amount?: string;
  newSareeId?: string;
  vendor?: string;
  design?: string;
  color?: string;
  weight?: string;
  price?: string;
  wsReason?: string;
}

type ReturnStep = "type" | 1 | 2 | 3 | "success";
type ReturnType = "retail" | "wholesale" | null;

function ProcessReturn({ onBack }: { onBack: () => void }) {
  const [returnType, setReturnType] = useState<ReturnType>(null);
  const [step, setStep] = useState<ReturnStep>("type");
  const [returnLog, setReturnLog] = useState<ReturnRecord[]>([
    { id: "RTN-2026-0039", type: "retail", date: "10 Jun 2026", customer: "Smt. Meenakshi", originalSaleId: "RAVI-L2-007", reason: "Wrong Design", amount: "₹12,000" },
    { id: "RTN-2026-0038", type: "retail", date: "05 Jun 2026", customer: "Smt. Kalpana", originalSaleId: "PADMA-L1-001", reason: "Defective", amount: "₹8,500" },
    { id: "RTN-WS-2026-021", type: "wholesale", date: "02 Jun 2026", vendor: "Ravi Silks", design: "BKB-031", color: "Maroon", weight: "920g", wsReason: "Quality Issue" },
  ]);

  // Retail state
  const [saleFound, setSaleFound] = useState(false);
  const [retailManualId, setRetailManualId] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");

  // Wholesale state
  const [wsVendor, setWsVendor] = useState("");
  const [wsDesign, setWsDesign] = useState("");
  const [wsColor, setWsColor] = useState("");
  const [wsType, setWsType] = useState("Self Brocade");
  const [wsWeight, setWsWeight] = useState("");
  const [wsPrice, setWsPrice] = useState("");
  const [wsReason, setWsReason] = useState<string | null>(null);
  const [wsNewId, setWsNewId] = useState("");
  const [wsBarcodeGenerated, setWsBarcodeGenerated] = useState(false);

  const returnReasons = [
    { id: "defective", label: "Defective", sub: "Damaged or faulty item", Icon: AlertTriangle, color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
    { id: "wrong", label: "Wrong Design", sub: "Doesn't match selection", Icon: Palette, color: "#7A4F2F", bg: "rgba(122,79,47,0.08)" },
    { id: "mind", label: "Changed Mind", sub: "Customer preference", Icon: ThumbsDown, color: C.burg, bg: "rgba(107,26,42,0.08)" },
    { id: "weight", label: "Size / Weight", sub: "Doesn't meet expectations", Icon: Scale, color: C.green, bg: "rgba(30,102,64,0.08)" },
    { id: "other", label: "Other Reason", sub: "Describe in notes", Icon: FileText, color: C.muted, bg: "rgba(139,112,96,0.08)" },
  ];

  const wsReasonOptions = ["Defective", "Quality Issue", "Overstock", "Wrong Design", "Damaged in Transit", "Other"];

  const resetReturn = () => {
    setReturnType(null); setStep("type");
    setSaleFound(false); setRetailManualId(""); setReason(null); setOtherReason("");
    setWsVendor(""); setWsDesign(""); setWsColor(""); setWsType("Self Brocade");
    setWsWeight(""); setWsPrice(""); setWsReason(null); setWsNewId(""); setWsBarcodeGenerated(false);
  };

  const canProceedWsStep1 = wsVendor.trim() !== "" && wsWeight.trim() !== "" && wsReason !== null;

  // ── Shared Header ──
  const Header = () => (
    <div style={{
      background: `linear-gradient(135deg, ${C.dark} 0%, #8B1A1A 100%)`,
      display: "flex", alignItems: "center", padding: "14px 16px", gap: 12,
    }}>
      <button
        onClick={step === "type" ? onBack : () => {
          if (step === 1) { setStep("type"); setReturnType(null); }
          else if (step === 2) setStep(1);
          else if (step === 3) setStep(2);
        }}
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <ChevronLeft size={20} color="#FFF" />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.50)", textTransform: "uppercase" as const, marginBottom: 2 }}>Since 1999</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Process Return</div>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RotateCcw size={18} color="rgba(255,255,255,0.70)" />
      </div>
    </div>
  );

  // ── Return History Section ──
  const ReturnHistory = () => (
    <div style={{ margin: "20px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 4, height: 20, background: C.crim, borderRadius: 2 }} />
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Return History</span>
      </div>
      {returnLog.map((r, i) => (
        <div key={i} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${r.type === "retail" ? C.crim : C.gold}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ background: r.type === "retail" ? "rgba(192,57,43,0.10)" : "rgba(196,146,58,0.15)", color: r.type === "retail" ? C.crim : "#8B6520", borderRadius: 999, padding: "2px 8px", fontFamily: F.m, fontSize: 10, fontWeight: 600 }}>{r.id}</span>
            <span style={{ background: r.type === "retail" ? "rgba(192,57,43,0.07)" : "rgba(196,146,58,0.10)", color: r.type === "retail" ? C.crim : C.gold, borderRadius: 999, padding: "2px 8px", fontFamily: F.u, fontSize: 10, fontWeight: 600 }}>{r.type === "retail" ? "Retail" : "Wholesale"}</span>
            <span style={{ marginLeft: "auto", fontFamily: F.m, fontSize: 10, color: C.muted }}>{r.date}</span>
          </div>
          {r.type === "retail" ? (
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.customer} · {r.originalSaleId} · {r.reason} · <span style={{ color: C.gold, fontWeight: 600 }}>{r.amount}</span></div>
          ) : (
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.vendor} · {r.design} · {r.color} · {r.weight} · {r.wsReason}</div>
          )}
        </div>
      ))}
    </div>
  );

  // ── TYPE SELECTION ──
  if (step === "type") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        <div style={{ margin: "20px 20px 8px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Select Return Type</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Choose the type of return to process</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "0 20px 8px" }}>
          {/* Retail Return card */}
          <button
            onClick={() => { setReturnType("retail"); setStep(1); }}
            style={{ padding: "20px 16px", borderRadius: 16, border: `1.5px solid ${C.bdr}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 12, boxShadow: "0 2px 12px rgba(44,24,16,0.06)", textAlign: "left" as const }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={24} color={C.crim} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Retail Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Customer returning a saree they purchased from our shop. Has original receipt or saree barcode.</div>
            </div>
          </button>
          {/* Wholesale Return card */}
          <button
            onClick={() => { setReturnType("wholesale"); setStep(1); }}
            style={{ padding: "20px 16px", borderRadius: 16, border: `1.5px solid ${C.bdr}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 12, boxShadow: "0 2px 12px rgba(44,24,16,0.06)", textAlign: "left" as const }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(196,146,58,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color={C.gold} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Wholesale Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Saree returned from wholesale buyer. No barcode — a new one will be generated and saree added to inventory.</div>
            </div>
          </button>
        </div>
        <ReturnHistory />
      </div>
    );
  }

  // ── RETAIL SUCCESS ──
  if (step === "success" && returnType === "retail") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        <div style={{ padding: "44px 20px", textAlign: "center" as const }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(192,57,43,0.10)", border: `2px solid ${C.crim}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <RotateCcw size={36} color={C.crim} />
            </div>
          </motion.div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 8 }}>Return Processed</div>
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 20 }}>
            PADMA-L1-004 has been returned successfully.<br />Shop inventory updated. Customer profile updated.
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 12, marginBottom: 14 }}>
            <FileText size={13} color={C.burg} /> RTN-2026-0041
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 8 }}>Customer: Smt. Meenakshi · PADMA-L1-004</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 16 }}>
            <Btn label="Process Another Return" icon={<RotateCcw size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.crim }} />
            <Btn label="Back to Home" icon={<ChevronLeft size={16} />} variant="ghost" onClick={onBack} style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  // ── WHOLESALE SUCCESS ──
  if (step === "success" && returnType === "wholesale") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        <div style={{ padding: "44px 20px 20px", textAlign: "center" as const }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(30,102,64,0.10)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Check size={38} color={C.green} />
            </div>
          </motion.div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 8 }}>Return Processed — Added to Inventory</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(196,146,58,0.12)", color: "#8B6520", borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 12, marginBottom: 20 }}>
            <QrCode size={13} color={C.gold} /> {wsNewId}
          </div>
        </div>
        <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
          <div style={{ padding: 18 }}>
            {/* Barcode visual */}
            <div style={{ background: "#111", borderRadius: 8, padding: "14px 10px", marginBottom: 16, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 40 }}>
                {[3,1,4,1,2,3,1,2,4,1,3,2,1,4,2,1,3,1,2,3].map((w, i) => (
                  <div key={i} style={{ width: w * 2, background: "#FFF", height: i % 3 === 0 ? 40 : i % 2 === 0 ? 34 : 38, borderRadius: 1 }} />
                ))}
              </div>
              <div style={{ fontFamily: F.m, fontSize: 10, color: "#AAA", letterSpacing: 2 }}>{wsNewId}</div>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const, marginBottom: 14 }}>This saree has been added to shop inventory</div>
            {[
              ["Vendor", wsVendor || "—"], ["Design Code", wsDesign || "—"],
              ["Color", wsColor || "—"], ["Weight", wsWeight ? `${wsWeight}g` : "—"],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: i < 3 ? `1px solid ${C.bdr}` : "none" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
          <Btn label="Print Barcode Label" icon={<Printer size={16} />} style={{ width: "100%", background: C.burg }} />
          <Btn label="Process Another Return" icon={<RotateCcw size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.green }} />
        </div>
      </div>
    );
  }

  // ── RETAIL STEPS ──
  if (returnType === "retail") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <Header />
        {/* Progress */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["Find Sale", "Return Reason", "Confirm"] as const).map((label, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.crim : "rgba(192,57,43,0.15)", marginBottom: 5 }} />
                <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? C.crim : C.muted, textAlign: "center" as const }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1 — Find Sale */}
        {step === 1 && (
          <div style={{ marginTop: 12 }}>
            {!saleFound ? (
              <>
                <div
                  onClick={() => setSaleFound(true)}
                  style={{
                    margin: "0 20px 18px",
                    background: `linear-gradient(135deg, ${C.dark} 0%, #8B1A1A 100%)`,
                    borderRadius: 20, padding: "32px 24px", cursor: "pointer",
                    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14,
                    position: "relative" as const, overflow: "hidden",
                    boxShadow: "0 12px 36px rgba(192,57,43,0.28)",
                  }}
                >
                  <div style={{ position: "absolute" as const, top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(192,57,43,0.22)" }} />
                  <div style={{ position: "absolute" as const, bottom: -36, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                  <div style={{ width: 72, height: 72, borderRadius: 18, position: "relative" as const, zIndex: 1, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.22)" }}>
                    <Camera size={34} color="#FFF" />
                  </div>
                  <div style={{ textAlign: "center" as const, position: "relative" as const, zIndex: 1 }}>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", marginBottom: 6 }}>Scan Saree Barcode</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>Scan the saree tag to locate the original sale record</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 999, padding: "9px 24px", position: "relative" as const, zIndex: 1, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF" }}>
                    Tap to Open Camera
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px 16px" }}>
                  <div style={{ flex: 1, height: 1, background: C.bdr }} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or enter manually</span>
                  <div style={{ flex: 1, height: 1, background: C.bdr }} />
                </div>
                <div style={{ margin: "0 20px" }}>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Saree ID</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input value={retailManualId} onChange={e => setRetailManualId(e.target.value)} placeholder="e.g. PADMA-L1-004"
                      style={{ flex: 1, height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none" }}
                    />
                    {retailManualId.length > 3 && (
                      <button onClick={() => setSaleFound(true)} style={{ height: 52, borderRadius: 12, background: C.crim, border: "none", padding: "0 20px", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Find</button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ margin: "0 20px 14px", background: "rgba(30,102,64,0.08)", border: `1.5px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={17} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green }}>Original Sale Found</div>
                    <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>Sale record located in system</div>
                  </div>
                </div>
                <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${C.crim}, rgba(192,57,43,0.3))` }} />
                  <div style={{ padding: 18 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 11, letterSpacing: 1, color: C.muted, marginBottom: 14, textTransform: "uppercase" as const }}>Original Sale Details</div>
                    {[
                      ["Saree ID", "PADMA-L1-004", true],
                      ["Design", "BKB-045 · Cream Zari Border Saree", false],
                      ["Sale Date", "05 Jun 2026", true],
                      ["Customer", "Smt. Meenakshi", false],
                      ["Amount Paid", "₹8,500", false],
                      ["Payment Method", "UPI", true],
                    ].map(([k, v, mono], i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                        <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k as string}</span>
                        <span style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: (k as string) === "Amount Paid" ? C.gold : C.text, textAlign: "right" as const }}>{v as string}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                  <button onClick={() => setSaleFound(false)} style={{ height: 52, borderRadius: 12, border: `1px solid ${C.bdr}`, background: "transparent", padding: "0 18px", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer" }}>Rescan</button>
                  <Btn label="Next — Return Reason →" onClick={() => setStep(2)} style={{ flex: 1, background: C.crim }} />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Step 2 — Return Reason */}
        {step === 2 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ margin: "0 20px 16px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Return Reason</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Why is the customer returning this saree?</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px 10px" }}>
              {returnReasons.slice(0, 4).map(r => (
                <button key={r.id} onClick={() => setReason(r.id)} style={{
                  padding: "16px 14px", borderRadius: 14,
                  border: `${reason === r.id ? 2 : 1}px solid ${reason === r.id ? r.color : C.bdr}`,
                  background: reason === r.id ? r.bg : C.white,
                  cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 8,
                  position: "relative" as const,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: reason === r.id ? r.bg : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: reason === r.id ? `1px solid ${r.color}40` : "none" }}>
                    <r.Icon size={20} color={reason === r.id ? r.color : C.muted} />
                  </div>
                  <div style={{ textAlign: "left" as const }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: reason === r.id ? r.color : C.text }}>{r.label}</div>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 2 }}>{r.sub}</div>
                  </div>
                  {reason === r.id && (
                    <div style={{ position: "absolute" as const, top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={10} color="#FFF" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {(() => {
              const r = returnReasons[4];
              return (
                <button onClick={() => setReason(r.id)} style={{
                  margin: "0 20px 16px", width: "calc(100% - 40px)", padding: "14px 18px", borderRadius: 14,
                  border: `${reason === r.id ? 2 : 1}px solid ${reason === r.id ? r.color : C.bdr}`,
                  background: reason === r.id ? r.bg : C.white,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12, position: "relative" as const,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: reason === r.id ? r.bg : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <r.Icon size={20} color={reason === r.id ? r.color : C.muted} />
                  </div>
                  <div style={{ textAlign: "left" as const }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: reason === r.id ? r.color : C.text }}>{r.label}</div>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{r.sub}</div>
                  </div>
                  {reason === r.id && (
                    <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={10} color="#FFF" />
                    </div>
                  )}
                </button>
              );
            })()}
            {reason === "other" && (
              <div style={{ margin: "0 20px 16px" }}>
                <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "block", marginBottom: 8 }}>Additional Notes</label>
                <textarea value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Describe the return reason in detail..." rows={3}
                  style={{ width: "100%", background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "12px 16px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none" as const, boxSizing: "border-box" as const }}
                />
              </div>
            )}
            <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
              <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }} />
              <Btn label="Next — Confirm →" onClick={() => reason && setStep(3)} style={{ flex: 2, background: reason ? C.crim : "#C0C0C0", cursor: reason ? "pointer" : "not-allowed" }} />
            </div>
          </div>
        )}

        {/* Step 3 — Confirm Return */}
        {step === 3 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ margin: "0 20px 16px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Confirm Return</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Please review before confirming</div>
            </div>
            <Card style={{ margin: "0 20px 14px", overflow: "hidden" }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${C.crim}, rgba(192,57,43,0.3))` }} />
              <div style={{ padding: 18 }}>
                {[
                  { label: "Saree", value: "PADMA-L1-004 · BKB-045" },
                  { label: "Customer", value: "Smt. Meenakshi" },
                  { label: "Original Sale", value: "05 Jun 2026" },
                  { label: "Return Reason", value: returnReasons.find(r => r.id === reason)?.label ?? "Other" },
                ].map(({ label, value }, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{label}</span>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text, textAlign: "right" as const, maxWidth: "60%" }}>{value}</span>
                  </div>
                ))}
                {otherReason && reason === "other" && (
                  <div style={{ background: "rgba(107,26,42,0.05)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 4 }}>Notes</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{otherReason}</div>
                  </div>
                )}
              </div>
            </Card>
            <div style={{ margin: "0 20px 16px", background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertTriangle size={15} color={C.crim} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: F.u, fontSize: 12, color: "#8B2020", lineHeight: 1.55 }}>
                Confirming will add PADMA-L1-004 back to shop inventory and update the customer's purchase record.
              </div>
            </div>
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
              <Btn label="Confirm Return" icon={<RotateCcw size={16} />} onClick={() => {
                setReturnLog(prev => [{ id: `RTN-2026-${String(Date.now()).slice(-4)}`, type: "retail", date: "13 Jun 2026", customer: "Smt. Meenakshi", originalSaleId: "PADMA-L1-004", reason: returnReasons.find(r => r.id === reason)?.label ?? reason ?? "Other", amount: "₹8,500" }, ...prev]);
                setStep("success");
              }} style={{ width: "100%", background: C.crim, height: 56 }} />
              <Btn label="← Edit Details" variant="ghost" onClick={() => setStep(2)} style={{ width: "100%" }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WHOLESALE STEPS ──
  return (
    <div style={{ paddingBottom: 32 }}>
      <Header />
      {/* Progress */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["Saree Details", "Generate Barcode"] as const).map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.gold : "rgba(196,146,58,0.20)", marginBottom: 5 }} />
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? "#8B6520" : C.muted, textAlign: "center" as const }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 — Saree Details */}
      {step === 1 && (
        <div style={{ marginTop: 12 }}>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 16 }}>Enter Saree Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Vendor / Source Name", val: wsVendor, setter: setWsVendor, placeholder: "e.g. Ravi Silks", type: "text" },
                  { label: "Design Code", val: wsDesign, setter: setWsDesign, placeholder: "e.g. BKB-045", type: "text" },
                  { label: "Saree Color", val: wsColor, setter: setWsColor, placeholder: "e.g. Maroon", type: "text" },
                ].map((f, i) => (
                  <div key={i} style={{ gridColumn: i === 0 ? "1 / -1" : undefined }}>
                    <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} type={f.type}
                      style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Saree Type</label>
                  <select value={wsType} onChange={e => setWsType(e.target.value)}
                    style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none" }}>
                    {["Self Brocade", "Heavy Zari", "Plain Silk", "Kanjivaram", "Cotton"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Weight (grams)</label>
                  <input value={wsWeight} onChange={e => setWsWeight(e.target.value)} placeholder="e.g. 840" type="number"
                    style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Original Purchase Price ₹</label>
                  <input value={wsPrice} onChange={e => setWsPrice(e.target.value)} placeholder="e.g. 6500" type="number"
                    style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
              </div>
            </div>
          </Card>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, marginBottom: 10 }}>Return Reason</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {wsReasonOptions.map(r => (
                <button key={r} onClick={() => setWsReason(r)} style={{
                  padding: "6px 14px", borderRadius: 999,
                  border: `${wsReason === r ? 2 : 1}px solid ${wsReason === r ? C.gold : C.bdr}`,
                  background: wsReason === r ? "rgba(196,146,58,0.12)" : "transparent",
                  fontFamily: F.u, fontSize: 12, fontWeight: wsReason === r ? 600 : 400,
                  color: wsReason === r ? "#8B6520" : C.muted, cursor: "pointer",
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ margin: "0 20px 16px", display: "flex", gap: 10 }}>
            <button onClick={() => {}} style={{ flex: 1, height: 46, border: `1.5px dashed ${C.bdr}`, borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <Camera size={16} color={C.muted} /> Add Photo
            </button>
            <button onClick={() => {}} style={{ flex: 1, height: 46, border: `1.5px dashed ${C.bdr}`, borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <Package size={16} color={C.muted} /> From Gallery
            </button>
          </div>
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={() => { setStep("type"); setReturnType(null); }} style={{ flex: 1 }} />
            <Btn label="Next — Barcode →" onClick={() => canProceedWsStep1 && setStep(2)} style={{ flex: 2, background: canProceedWsStep1 ? C.gold : "#C0C0C0", color: canProceedWsStep1 ? C.text : "#888", cursor: canProceedWsStep1 ? "pointer" : "not-allowed" }} />
          </div>
        </div>
      )}

      {/* Step 2 — Generate Barcode */}
      {step === 2 && (
        <div style={{ marginTop: 12 }}>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 14 }}>Review — Saree Details</div>
              {[
                ["Vendor", wsVendor || "—"], ["Design Code", wsDesign || "—"],
                ["Color", wsColor || "—"], ["Type", wsType],
                ["Weight", wsWeight ? `${wsWeight} grams` : "—"],
                ["Price", wsPrice ? `₹${wsPrice}` : "—"],
                ["Return Reason", wsReason || "—"],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: i < 6 ? `1px solid ${C.bdr}` : "none" }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {!wsBarcodeGenerated ? (
            <div style={{ margin: "0 20px 16px", textAlign: "center" as const }}>
              <button
                onClick={() => {
                  setWsNewId(`RTN-WS-2026-${String(Date.now()).slice(-3)}`);
                  setWsBarcodeGenerated(true);
                }}
                style={{ width: "100%", height: 58, borderRadius: 14, border: `2px solid ${C.gold}`, background: "rgba(196,146,58,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#8B6520" }}
              >
                <QrCode size={22} color={C.gold} /> Generate New Barcode
              </button>
            </div>
          ) : (
            <div style={{ margin: "0 20px 16px" }}>
              <div style={{ background: "#111", borderRadius: 14, padding: "20px 16px", textAlign: "center" as const, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 48, justifyContent: "center", marginBottom: 8 }}>
                  {[3,1,4,1,2,3,1,2,4,1,3,2,1,4,2,1,3,1,2,3,2,1,4].map((w, i) => (
                    <div key={i} style={{ width: w * 2, background: "#FFF", height: i % 3 === 0 ? 48 : i % 2 === 0 ? 38 : 44, borderRadius: 1 }} />
                  ))}
                </div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: "#AAA", letterSpacing: 2 }}>{wsNewId}</div>
              </div>
              <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <Check size={15} color={C.green} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.green }}>This saree will be added to shop inventory with ID {wsNewId}</span>
              </div>
            </div>
          )}

          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {wsBarcodeGenerated && (
              <Btn label="Confirm — Add to Inventory" icon={<Check size={16} />} onClick={() => {
                setReturnLog(prev => [{ id: wsNewId, type: "wholesale", date: "13 Jun 2026", vendor: wsVendor, design: wsDesign, color: wsColor, weight: wsWeight ? `${wsWeight}g` : "—", wsReason: wsReason ?? "—", newSareeId: wsNewId }, ...prev]);
                setStep("success");
              }} style={{ width: "100%", background: C.green, height: 56 }} />
            )}
            <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE 05 — CUSTOMER PROFILES ─────────────────────────────────────────────
function CustomerProfiles() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("All");
  const [selected, setSelected] = useState<number | null>(null);

  const customers = [
    { name: "Smt. Annapurna Devi",  phone: "×××× 7823", purchases: 18, total: "₹1,84,000", last: "3 days ago",  regular: true,  initials: "AD" },
    { name: "Smt. Lakshmi Bai",     phone: "×××× 3412", purchases: 12, total: "₹1,62,000", last: "1 week ago", regular: true,  initials: "LB" },
    { name: "Sri Ramesh K.",         phone: "×××× 4421", purchases: 4,  total: "₹48,000",   last: "2 weeks ago",regular: false, initials: "RK" },
    { name: "Smt. Padmavathi",       phone: "×××× 9981", purchases: 1,  total: "₹12,500",   last: "Today",      regular: false, initials: "PD" },
    { name: "Smt. Saraswathi",       phone: "×××× 6634", purchases: 7,  total: "₹84,000",   last: "5 days ago", regular: true,  initials: "SD" },
    { name: "Smt. Rajeshwari",       phone: "×××× 2218", purchases: 2,  total: "₹28,000",   last: "6 months ago",regular: false, initials: "RD" },
  ];

  const purchaseHistory = [
    { date: "10 Jun 2026", id: "PADMA-L1-004", design: "BKB-045 · Cream Zari Border", price: "₹8,500" },
    { date: "15 May 2026", id: "RAVI-L2-006",  design: "BKB-031 · Maroon Heavy",      price: "₹12,000" },
    { date: "20 Apr 2026", id: "BKB-L3-001",   design: "BKB-022 · Cream Plain",       price: "₹5,500" },
  ];

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const activeCustomer = selected !== null ? customers[selected] : null;

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · CUSTOMER PROFILES</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 34, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Customer Profiles</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold }}>All retail customers</div>
      </div>

      {/* Stats — stacked cards, no wrapping/truncation */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <div style={{ flex: "1 1 100%", background: C.dark, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "rgba(255,255,255,0.60)", marginBottom: 6 }}>Total Customers</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: "#FFF", lineHeight: 1 }}>1,284</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>All time</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: C.gold, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: "rgba(26,10,15,0.65)", marginBottom: 6 }}>New This Month</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 26, color: C.text, lineHeight: 1.1 }}>8</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>June 2026</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.burg, marginBottom: 6 }}>Top Spender</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 21, color: C.burg, lineHeight: 1.2 }}>₹1,84,000</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Smt. Annapurna</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ position: "relative" as const, marginBottom: 12 }}>
          <Search size={18} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone" style={{ width: "100%", height: 48, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px 0 42px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4 }}>
          {["All", "Highest Spend", "Most Frequent", "Recent Visit", "Has Returns"].map(s => (
            <button key={s} onClick={() => setSort(s)} style={{ flexShrink: 0, padding: "8px 15px", borderRadius: 999, border: `1px solid ${sort === s ? C.burg : C.bdr}`, background: sort === s ? C.burg : "transparent", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: sort === s ? "#FFF" : C.muted, cursor: "pointer", whiteSpace: "nowrap" as const }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 20px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((c, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#FFF" }}>{c.initials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.text }}>{c.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <Phone size={13} color={C.muted} />
                  <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{c.phone}</span>
                </div>
              </div>
              {c.regular && <Star size={20} fill={C.gold} color={C.gold} />}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 16 }}>
              <Chip label={`${c.purchases} purchases`} color={C.burg} bg="rgba(107,26,42,0.08)" />
              <Chip label={c.total} color={C.gold} bg="rgba(196,146,58,0.12)" />
              <Chip label={`Last: ${c.last}`} color={C.muted} bg="rgba(139,112,96,0.08)" />
            </div>
            <button onClick={() => setSelected(i)} style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer", boxShadow: "0 2px 10px rgba(107,26,42,0.28)" }}>
              <UserRound size={16} /> View Profile <ArrowRight size={14} />
            </button>
          </Card>
        ))}
      </div>

      {/* ══════ MODAL: CUSTOMER PROFILE ══════ */}
      <AnimatePresence>
        {activeCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#FFF", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(44,24,16,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, flexShrink: 0, background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)` }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.30)" }} />
              </div>
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "16px 20px 24px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.burg, border: "3px solid rgba(196,146,58,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(107,26,42,0.40)" }}>
                    <span style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: "#FFF" }}>{activeCustomer.initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", lineHeight: 1.2 }}>{activeCustomer.name}</div>
                      {activeCustomer.regular && <Star size={16} fill={C.gold} color={C.gold} />}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{activeCustomer.phone}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <X size={18} color="rgba(255,255,255,0.70)" />
                  </button>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: "22px 20px 24px", overflowY: "auto" as const }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                  {[
                    { label: "Purchases", val: `${activeCustomer.purchases}`, color: C.burg },
                    { label: "Total Spent", val: activeCustomer.total, color: C.gold },
                    { label: "Last Visit", val: activeCustomer.last, color: C.text },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#F8F4F0", borderRadius: 14, padding: "12px 10px", textAlign: "center" as const }}>
                      <div style={{ fontFamily: F.u, fontSize: 10.5, color: C.muted, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" as const, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: s.color, lineHeight: 1.25 }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {/* Recent purchases */}
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Purchase History
                </div>
                {purchaseHistory.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < purchaseHistory.length - 1 ? `1px solid rgba(107,26,42,0.08)` : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(107,26,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ShoppingBag size={17} color={C.burg} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.burg, marginBottom: 2 }}>{p.id}</div>
                      <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.text }}>{p.design}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.date}</div>
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0 }}>{p.price}</div>
                  </div>
                ))}
                {/* Frequency Analysis */}
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, margin: "20px 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Frequency Analysis
                </div>
                <div style={{ background: "#F8F4F0", borderRadius: 14, padding: "6px 16px", marginBottom: 24 }}>
                  {[
                    ["Visits per month", "1.5 average"],
                    ["Last visit", activeCustomer.last],
                    ["Preferred design", "BKB-045"],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
                      <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{k}</span>
                      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  <button style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                    <ShoppingBag size={17} /> Record New Sale
                  </button>
                  <button onClick={() => setSelected(null)} style={{ width: "100%", height: 50, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PAGE 06 — SALES REPORT ──────────────────────────────────────────────────
function SalesReport() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "3months">("today");
  const periods = [{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "3months", label: "Last 3 Months" }] as const;

  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [exportDone, setExportDone] = useState(false);

  const dailySales = [
    { time: "11:42 AM", id: "PADMA-L1-004", design: "BKB-045", customer: "Smt. Annapurna", pay: "UPI", amt: "₹8,500", src: "factory" },
    { time: "10:30 AM", id: "RAVI-L2-008",  design: "BKB-031", customer: "Sri Ramesh K.",  pay: "Card", amt: "₹12,000", src: "factory" },
    { time: "9:45 AM",  id: "BKB-L3-002",   design: "BKB-022", customer: "Smt. Lakshmi",   pay: "Cash", amt: "₹5,500",  src: "factory" },
    { time: "9:20 AM",  id: "EXT-RAVI-001", design: "External", customer: "Smt. Padmavathi",pay: "UPI", amt: "₹6,200",  src: "external" },
    { time: "9:05 AM",  id: "PADMA-L1-003", design: "BKB-045", customer: "Smt. Saraswathi",pay: "Cash", amt: "₹8,500",  src: "factory" },
  ];

  const totalToday = dailySales.reduce((sum, s) => sum + Number(s.amt.replace(/[₹,]/g, "")), 0);
  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const designData = [
    { design: "BKB-045", count: 84 }, { design: "BKB-031", count: 62 },
    { design: "BKB-022", count: 48 }, { design: "BKB-038", count: 32 }, { design: "Others", count: 22 },
  ];

  const topCustomers = [
    { name: "Smt. Annapurna Devi", purchases: 8, amt: "₹68,000" },
    { name: "Smt. Lakshmi Bai",    purchases: 5, amt: "₹42,000" },
    { name: "Smt. Saraswathi",     purchases: 4, amt: "₹34,000" },
    { name: "Sri Ramesh K.",        purchases: 2, amt: "₹24,500" },
    { name: "Smt. Padmavathi",     purchases: 1, amt: "₹12,500" },
  ];

  const returns = [
    { date: "10 Jun", id: "RAVI-L2-007", customer: "Smt. Meenakshi", reason: "Wrong Design", amt: "₹12,000" },
    { date: "05 Jun", id: "PADMA-L1-001",customer: "Smt. Kalpana",   reason: "Defective",    amt: "₹8,500" },
    { date: "02 Jun", id: "BKB-L3-001",  customer: "Sri Venkat",     reason: "Changed Mind", amt: "₹5,500" },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · SALES REPORT</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 34, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Sales Report</div>
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
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: "#FFF", lineHeight: 1 }}>{dailySales.length}</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>13 Jun 2026</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: C.gold, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: "rgba(26,10,15,0.65)", marginBottom: 6 }}>Revenue Today</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.text, lineHeight: 1.2 }}>{fmtINR(totalToday)}</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>{dailySales.length} transactions</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.burg, marginBottom: 6 }}>This Month Revenue</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.burg, lineHeight: 1.2 }}>₹18,40,000</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>June 2026</div>
        </div>
        <div style={{ flex: "1 1 100%", background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.crim, marginBottom: 6 }}>Returns This Month</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.crim, lineHeight: 1.1 }}>3 returns</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.crim, opacity: 0.85 }}>₹26,000</div>
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
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>{s.customer}</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 3 }}>{s.time} · {s.pay}</div>
            </div>
            <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0, textAlign: "right" as const }}>{s.amt}</div>
          </div>
        ))}
        {/* Total row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: C.cream }}>
          <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>Total (Today)</span>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{fmtINR(totalToday)}</span>
        </div>
      </Card>

      {/* Monthly Totals */}
      <SectionTitle id="shoprep-monthly-totals" title="This Month — Jun 2026" />
      <div style={{ margin: "0 20px", display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
        {[
          { label: "Total Sales", val: "248 sarees" },
          { label: "Revenue", val: "₹18,40,000" },
          { label: "Avg per sale", val: "₹7,419" },
          { label: "Returns", val: "3 sarees" },
          { label: "Net Revenue", val: "₹18,18,000" },
          { label: "Most sold", val: "BKB-045" },
        ].map((s, i) => (
          <Card key={i} style={{ flex: "1 1 calc(50% - 5px)", padding: "14px 16px" }}>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 19, color: i < 3 ? C.text : C.crim }}>{s.val}</div>
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
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>{c.name}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>{c.purchases} purchases</div>
            </div>
            <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 15, color: C.gold, flexShrink: 0 }}>{c.amt}</div>
          </div>
        ))}
      </Card>

      {/* Design Sales Bar Chart */}
      <SectionTitle id="shoprep-by-design" title="Sales by Design" />
      <Card style={{ margin: "0 20px", padding: "18px 12px" }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={designData} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontFamily: F.m, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="design" tick={{ fontFamily: F.m, fontSize: 12.5, fill: C.burg }} axisLine={false} tickLine={false} width={68} />
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
              <span style={{ fontFamily: F.m, fontSize: 11.5, color: C.muted }}>{r.date}</span>
              <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{r.id}</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 3 }}>{r.customer} · {r.reason}</div>
          </div>
          <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 14, color: C.crim }}>{r.amt}</div>
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
                    <button onClick={() => { setShowExport(false); setExportDone(false); }} style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer" }}>Done</button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 12 }}>Export format</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {([
                          { key: "pdf" as const, label: "PDF", icon: "📄", desc: "Print-ready" },
                          { key: "csv" as const, label: "CSV", icon: "📊", desc: "Spreadsheet" },
                          { key: "excel" as const, label: "Excel", icon: "📗", desc: "Advanced" },
                        ]).map(f => (
                          <button key={f.key} onClick={() => setExportFormat(f.key)} style={{ flex: 1, padding: "14px 8px", borderRadius: 14, border: `2px solid ${exportFormat === f.key ? C.burg : C.bdr}`, background: exportFormat === f.key ? "rgba(107,26,42,0.06)" : "#FFF", cursor: "pointer", textAlign: "center" as const }}>
                            <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
                            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: exportFormat === f.key ? C.burg : C.text, marginBottom: 2 }}>{f.label}</div>
                            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{f.desc}</div>
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
                      <button onClick={() => setExportDone(true)} style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
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

export function ShopStaffPortal({ onBack }: ShopStaffPortalProps) {
  const { isMobile, w } = useResponsive();
  const bp: "tablet" | "desktop" = w >= 1280 ? "desktop" : "tablet";
  const isTablet = bp === "tablet";
  const [active, setActive] = useState<TabId>("home");
  const [showReturn, setShowReturn] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  // Dialog states
  const [showInvLowStockDialog, setShowInvLowStockDialog] = useState(false);
  const [invLowStockMsg, setInvLowStockMsg] = useState("");
  const [invLowStockPriority, setInvLowStockPriority] = useState<"urgent" | "normal">("urgent");
  const [invLowStockSent, setInvLowStockSent] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<ShopCustomer | null>(null);

  const [exportDialog, setExportDialog] = useState<{ label: string } | null>(null);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [exportDone, setExportDone] = useState(false);

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "home",      label: "Home",      icon: <Home size={20} /> },
    { id: "sale",      label: "New Sale",  icon: <ShoppingBag size={20} /> },
    { id: "inventory", label: "Inventory", icon: <Package size={20} /> },
    { id: "customers", label: "Customers", icon: <Users size={20} /> },
    { id: "reports",   label: "Reports",   icon: <BarChart2 size={20} /> },
  ];

  const PAGE_TITLES: Record<TabId, string> = {
    home: "Shop Home", sale: "New Sale", inventory: "Shop Inventory",
    customers: "Customers", reports: "Sales Report",
  };

  const renderPage = () => {
    if (showReturn) return <ProcessReturn onBack={() => setShowReturn(false)} />;
    switch (active) {
      case "home":      return <ShopHome onNavigate={(t) => { if (t === "return") setShowReturn(true); else setActive(t as TabId); }} />;
      case "sale":      return <NewSaleFlow />;
      case "inventory": return <ShopInventory />;
      case "customers": return <CustomerProfiles />;
      case "reports":   return <SalesReport />;
    }
  };

  // ── Desktop / Tablet Layout ──────────────────────────────────────────────
  if (!isMobile) {
    const DSH = ({ label, link, onLink }: { label: string; link?: string; onLink?: () => void }) => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 5, height: 28, background: C.burg, borderRadius: 3 }} />
          <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>{label}</span>
        </div>
        {link && (
          <button onClick={onLink} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", boxShadow: "0 2px 10px rgba(107,26,42,0.28)" }}>
            <FileText size={14} color="#FFF" /> {link}
          </button>
        )}
      </div>
    );

    const recentSales = [
      { id: "PADMA-L1-004", customer: "Smt. Annapurna", design: "BKB-045 · Cream Zari Border", amt: "₹8,500", time: "11:42 AM", color: "#E8D5B0", pay: "UPI", ext: false },
      { id: "RAVI-L2-008", customer: "Sri Ramesh K.", design: "BKB-031 · Red Silk Kanjivaram", amt: "₹12,000", time: "10:30 AM", color: "#8B2020", pay: "Card", ext: false },
      { id: "BKB-L3-002", customer: "Smt. Lakshmi", design: "BKB-022 · Green Peacock", amt: "₹5,500", time: "9:45 AM", color: "#1E6640", pay: "Cash", ext: false },
      { id: "EXT-RAVI-001", customer: "Smt. Padmavathi", design: "External Silk · Checks", amt: "₹6,200", time: "9:20 AM", color: "#C9A86C", pay: "UPI", ext: true },
      { id: "PADMA-L1-003", customer: "Smt. Saraswathi", design: "BKB-045 · Cream Zari Border", amt: "₹8,500", time: "Yesterday 4:30 PM", color: "#E8D5B0", pay: "Cash", ext: false },
    ];

    const inventory = [
      { id: "PADMA-L1-004", src: "factory", design: "BKB-045", name: "Cream Zari Border", color: "#E8D5B0", sareeColor: "Cream", type: "Self Brocade", price: "₹8,500", received: "10 Jun", status: "available", supplier: null as string | null },
      { id: "RAVI-L2-008", src: "factory", design: "BKB-031", name: "Maroon Heavy Zari", color: "#8B2020", sareeColor: "Maroon", type: "Heavy Brocade", price: "₹12,000", received: "09 Jun", status: "available", supplier: null as string | null },
      { id: "BKB-L3-002", src: "factory", design: "BKB-022", name: "Cream Plain Silk", color: "#F5F5DC", sareeColor: "Cream", type: "Plain Weave", price: "₹5,500", received: "08 Jun", status: "available", supplier: null as string | null },
      { id: "EXT-RAVI-001", src: "external", design: "External", name: "Silk Checks", color: "#C9A86C", sareeColor: "Gold", type: "Checks", price: "₹6,200", received: "05 Jun", status: "available", supplier: "Ravi Silks" },
      { id: "EXT-RAVI-002", src: "external", design: "External", name: "Floral Design", color: "#D4A5C5", sareeColor: "Pink", type: "Floral", price: "₹7,800", received: "05 Jun", status: "available", supplier: "Ravi Silks" },
      { id: "PADMA-L1-003", src: "factory", design: "BKB-045", name: "Cream Zari Border", color: "#E8D5B0", sareeColor: "Cream", type: "Self Brocade", price: "₹8,500", received: "07 Jun", status: "reserved", supplier: null as string | null },
    ];

    const customers = [
      { name: "Smt. Annapurna Devi", phone: "×××× 7823", purchases: 18, total: "₹1,84,000", last: "3 days ago", regular: true, initials: "AD" },
      { name: "Smt. Lakshmi Bai", phone: "×××× 3412", purchases: 12, total: "₹1,62,000", last: "1 week ago", regular: true, initials: "LB" },
      { name: "Sri Ramesh K.", phone: "×××× 4421", purchases: 4, total: "₹48,000", last: "2 weeks ago", regular: false, initials: "RK" },
      { name: "Smt. Padmavathi", phone: "×××× 9981", purchases: 1, total: "₹12,500", last: "Today", regular: false, initials: "PD" },
      { name: "Smt. Saraswathi", phone: "×××× 6634", purchases: 7, total: "₹84,000", last: "5 days ago", regular: true, initials: "SD" },
      { name: "Smt. Rajeshwari", phone: "×××× 2218", purchases: 2, total: "₹28,000", last: "6 months ago", regular: false, initials: "RD" },
    ];

    const designData = [
      { design: "BKB-045", count: 84 }, { design: "BKB-031", count: 62 },
      { design: "BKB-022", count: 48 }, { design: "BKB-038", count: 32 }, { design: "Others", count: 22 },
    ];

    return (
      <div style={{ minHeight: "100vh", background: "#F8F4F0", fontFamily: F.u }}>
        <style>{`html, body { overflow-x: hidden; max-width: 100%; }`}</style>
        <style>{SECTION_NAV_GLOBAL_STYLE}</style>
        {/* ── Top Nav ── */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.bdr}`, position: "sticky" as const, top: 0, zIndex: 200, boxShadow: "0 1px 10px rgba(107,26,42,0.07)" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", padding: isTablet ? "0 24px" : "0 48px", display: "flex", alignItems: "center", height: 64, gap: isTablet ? 16 : 28 }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFF", border: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Flower2 size={24} color={C.burg} />
              </div>
              {!isTablet && (
              <div>
                <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#2C1810", lineHeight: 1.1 }}>Beere Kesava</div>
                <div style={{ fontFamily: F.d, fontSize: 13, fontWeight: 400, color: "#3B2314", marginTop: 1 }}>& Brothers Silks</div>
                <div style={{ fontFamily: F.u, fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: 2.5, textTransform: "uppercase" as const, marginTop: 4 }}>SHOP STAFF PORTAL</div>
              </div>
              )}
            </div>
            <nav className="shop-topnav-groups" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: isTablet ? "flex-start" : "center", gap: 2, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
              <style>{`.shop-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => { setActive(tab.id); setShowReturn(false); }} style={{
                  display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: isTablet ? "0 12px" : "0 18px", height: 64, border: "none", background: "transparent", cursor: "pointer",
                  fontFamily: F.u, fontSize: 14, fontWeight: active === tab.id && !showReturn ? 600 : 400,
                  color: active === tab.id && !showReturn ? TEAL : C.muted,
                  borderBottom: active === tab.id && !showReturn ? `3px solid ${TEAL}` : "2px solid transparent",
                  transition: "all 0.15s", whiteSpace: "nowrap" as const,
                }}
                onMouseEnter={e => { if (!(active === tab.id && !showReturn)) e.currentTarget.style.color = TEAL; }}
                onMouseLeave={e => { if (!(active === tab.id && !showReturn)) e.currentTarget.style.color = C.muted; }}>
                  {React.cloneElement(tab.icon as React.ReactElement, { size: 16, color: active === tab.id && !showReturn ? TEAL : C.muted })}
                  {isTablet ? (tab.id === "inventory" ? "Stock" : tab.id === "sale" ? "Sale" : tab.label) : tab.label}
                </button>
              ))}
              <button onClick={() => setShowReturn(true)} style={{
                display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: isTablet ? "0 12px" : "0 18px", height: 64, border: "none", background: "transparent", cursor: "pointer",
                fontFamily: F.u, fontSize: 14, fontWeight: showReturn ? 600 : 400, color: showReturn ? C.crim : C.muted,
                borderBottom: showReturn ? `2px solid ${C.crim}` : "2px solid transparent", transition: "all 0.15s", whiteSpace: "nowrap" as const,
              }}
              onMouseEnter={e => { if (!showReturn) e.currentTarget.style.color = C.crim; }}
              onMouseLeave={e => { if (!showReturn) e.currentTarget.style.color = C.muted; }}>
                <RotateCcw size={16} color={showReturn ? C.crim : C.muted} /> Process Return
              </button>
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ position: "relative" as const }}>
                <Search size={14} color={C.muted} style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: isTablet ? 140 : 200, height: 38, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 999, padding: "0 14px 0 38px", fontFamily: F.u, fontSize: 13, color: C.text, outline: "none" }} />
              </div>
              <button style={{ position: "relative" as const, background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center" }}>
                <Bell size={20} color={C.muted} />
                <span style={{ position: "absolute" as const, top: 4, right: 4, width: 10, height: 10, background: "#FF3B30", borderRadius: "50%", border: "2px solid #FFF" }} />
              </button>
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase" as const, color: TEAL, background: "rgba(15,118,110,0.10)", border: `1px solid rgba(15,118,110,0.25)`, borderRadius: 999, padding: "5px 12px" }}>
                Shop Staff
              </span>
              <div style={{ position: "relative" as const }}>
                <button onClick={() => setShowProfile(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", background: showProfile ? "rgba(0,128,128,0.12)" : "rgba(0,128,128,0.07)", border: `1px solid ${showProfile ? "#008080" : "rgba(0,128,128,0.20)"}`, borderRadius: 999, cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#008080", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>PS</span>
                  </div>
                  <div style={{ textAlign: "left" as const }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Priya Sharma</div>
                    <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>SS · Shop Staff</div>
                  </div>
                  <ChevronLeft size={13} color={C.muted} style={{ transform: "rotate(-90deg)", transition: "transform 0.2s" }} />
                </button>
                {showProfile && (
                  <div style={{ position: "absolute" as const, top: "calc(100% + 8px)", right: 0, zIndex: 300, background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 240, overflow: "hidden" }}>
                    <div style={{ padding: "16px 18px", background: "rgba(0,128,128,0.05)", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#008080", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(0,128,128,0.28)" }}>
                        <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: "#FFF" }}>PS</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>Priya Sharma</div>
                        <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 2 }}>SS-001 · Shop Staff</div>
                      </div>
                    </div>
                    <div style={{ padding: "6px 0" }}>
                      <button onClick={() => setShowProfile(false)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <UserRound size={15} color={C.muted} /> View Profile
                      </button>
                      <div style={{ height: 1, background: C.bdr, margin: "4px 0" }} />
                      <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <ChevronLeft size={15} color={C.muted} /> Switch Portal
                      </button>
                      <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <LogOut size={15} color="#C0392B" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Page Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={showReturn ? "return" : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

            {/* ════ HOME ════ */}
            {!showReturn && active === "home" && (
              <>
                <ShopDesktopHero
                  bp={bp}
                  breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · OVERVIEW"
                  titleMain="Shop Home"
                  titleSub="& Today's Overview"
                  description="Today's sales, current inventory, and quick actions for the shop counter. Track every transaction and customer in real time."
                  pills={[{ text: "12 Sales Today", color: C.gold }, { text: "₹1,04,000 Revenue" }, { text: "84 Sarees in Stock" }, { text: "1 Return Processed" }]}
                  alertBadge="Priya Sharma · Shop Staff"
                  stats={[
                    { label: "TODAY'S SALES", val: "12", sub: "↑ 3 more than yesterday" },
                    { label: "TODAY'S REVENUE", val: "₹1,04,000", sub: "From 12 sales", highlight: true },
                    { label: "SHOP INVENTORY", val: "84", sub: "Sarees currently in stock" },
                    { label: "RETURNS TODAY", val: "1", sub: "Processed and recorded", crimson: true },
                  ]}
                  bgUrl={SHOP_BG}
                />
                <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 380px", gap: isTablet ? 24 : 36, alignItems: "start" }}>
                    {/* Left */}
                    <div>
                      {/* New Sale CTA */}
                      <div style={{ background: "#FFF", border: `2px solid ${C.burg}`, borderRadius: 20, padding: "28px 30px", marginBottom: 28, display: "flex", alignItems: "center", gap: 22, boxShadow: "0 4px 24px rgba(107,26,42,0.10)" }}>
                        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(196,146,58,0.35)" }}>
                          <ShoppingBag size={34} color={C.dark} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.text, marginBottom: 6 }}>New Retail Sale</div>
                          <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted }}>Record a sale at the counter — scan saree barcode, select payment, generate bill</div>
                        </div>
                        <button onClick={() => setActive("sale")} style={{ height: 56, padding: "0 28px", borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                          <ArrowUpRight size={18} /> Start New Sale
                        </button>
                      </div>

                      {/* Recent Sales */}
                      <DSH label="Recent Sales — Today" link="View All →" onLink={() => setActive("reports")} />
                      <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: isTablet ? "auto" : "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 32 }}>
                        <div style={{ minWidth: isTablet ? 640 : undefined }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 80px 100px", padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                          {["Saree ID", "Customer", "Design", "Payment", "Amount"].map(h => (
                            <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                          ))}
                        </div>
                        {recentSales.map((s, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 80px 100px", padding: "18px 24px", borderBottom: i < recentSales.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 8, height: 36, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                                {s.ext && <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: C.gold, background: "rgba(196,146,58,0.12)", padding: "1px 7px", borderRadius: 999 }}>External</span>}
                              </div>
                            </div>
                            <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>{s.customer}</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.design.split("·")[0]?.trim()}</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>
                          </div>
                        ))}
                        </div>
                      </div>

                      {/* Returns Today */}
                      <DSH label="Returns Today" />
                      <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.crim}`, borderRadius: 16, padding: "22px 26px", boxShadow: "0 3px 16px rgba(44,24,16,0.07)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <RotateCcw size={22} color={C.crim} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: F.m, fontSize: 15, fontWeight: 700, color: C.burg, marginBottom: 4 }}>RAVI-L2-007</div>
                            <div style={{ fontFamily: F.u, fontSize: 15, color: C.text }}>Wrong Design · Smt. Meenakshi · ₹12,000</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginBottom: 4 }}>9:10 AM</div>
                            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.crim, background: "rgba(192,57,43,0.10)", padding: "3px 12px", borderRadius: 999 }}>Return</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
                      {/* Stock Alert */}
                      <div style={{ background: "rgba(192,57,43,0.06)", border: `2px solid rgba(192,57,43,0.30)`, borderRadius: 18, padding: "24px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                          <AlertTriangle size={24} color={C.crim} />
                          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.crim }}>Stock Alert</div>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 15, color: C.text, marginBottom: 6 }}>Only <strong>84 sarees</strong> remaining in shop stock.</div>
                        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 18 }}>Stock is running low. Notify admin to arrange restocking from factory.</div>
                        {invLowStockSent ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.25)", borderRadius: 12, padding: "12px 16px" }}>
                            <Check size={18} color={C.green} />
                            <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.green }}>Admin & Superadmin have been notified</span>
                          </div>
                        ) : (
                          <button onClick={() => setShowInvLowStockDialog(true)} style={{ width: "100%", height: 48, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <Send size={16} /> Report Low Stock to Admin
                          </button>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div style={{ background: C.dark, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(61,14,26,0.20)" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 4 }}>QUICK ACTIONS</div>
                          <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.70)" }}>Navigate to key operations</div>
                        </div>
                        {[
                          { label: "New Retail Sale", sub: "Record a sale at counter", tab: "sale" as TabId, icon: <ShoppingBag size={18} color={C.gold} /> },
                          { label: "Shop Inventory", sub: "View all sarees in stock", tab: "inventory" as TabId, icon: <Package size={18} color={C.gold} /> },
                          { label: "Customer Profiles", sub: "Browse customer records", tab: "customers" as TabId, icon: <Users size={18} color={C.gold} /> },
                          { label: "Sales Reports", sub: "Analytics and trends", tab: "reports" as TabId, icon: <BarChart2 size={18} color={C.gold} /> },
                        ].map((a, i) => (
                          <button key={a.tab} onClick={() => setActive(a.tab)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "17px 24px", border: "none", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none", background: "transparent", cursor: "pointer", textAlign: "left" as const }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(196,146,58,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: "#FFF", marginBottom: 2 }}>{a.label}</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{a.sub}</div>
                            </div>
                            <ArrowRight size={15} color="rgba(255,255,255,0.30)" />
                          </button>
                        ))}
                        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                          <button onClick={() => setShowReturn(true)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" as const }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(192,57,43,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <RotateCcw size={18} color={C.crim} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: "#FFF", marginBottom: 2 }}>Process Return</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Handle customer returns</div>
                            </div>
                            <ArrowRight size={15} color="rgba(255,255,255,0.30)" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════ NEW SALE ════ */}
            {!showReturn && active === "sale" && (
              <>
                <ShopDesktopHero
                  bp={bp}
                  breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · NEW SALE"
                  titleMain="New Retail Sale"
                  titleSub="& Record at Counter"
                  description="Scan the saree barcode, record the payment method, enter customer details, and generate a bill — all in one flow."
                  pills={[{ text: "4-Step Process" }, { text: "Auto Bill Generation" }, { text: "Customer Auto-Fill" }]}
                  bgUrl={SILK_BG}
                />
                <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 360px", gap: isTablet ? 24 : 36, alignItems: "start" }}>
                    <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 28px rgba(44,24,16,0.10)" }}>
                      <NewSaleFlow />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 20, position: "sticky" as const, top: 84 }}>
                      <div style={{ background: C.dark, borderRadius: 18, padding: "24px", boxShadow: "0 4px 24px rgba(61,14,26,0.18)" }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 16 }}>HOW IT WORKS</div>
                        {[
                          { n: "1", title: "Scan Saree", desc: "Scan the barcode tag on the saree to auto-fill all details" },
                          { n: "2", title: "Payment Method", desc: "Select Cash, UPI, Card, or Other" },
                          { n: "3", title: "Customer Details", desc: "Search by phone — auto-fills for returning customers" },
                          { n: "4", title: "Confirm & Bill", desc: "Review summary and generate the bill" },
                        ].map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 3 ? 18 : 0, paddingBottom: i < 3 ? 18 : 0, borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.dark }}>{s.n}</span>
                            </div>
                            <div>
                              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: "#FFF", marginBottom: 4 }}>{s.title}</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.50)" }}>{s.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "#FFF8E8", border: `1px solid rgba(196,146,58,0.28)`, borderRadius: 16, padding: "20px 22px" }}>
                        <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 10 }}>After Sale</div>
                        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>A bill is generated automatically. Print it or send via WhatsApp to the customer. The sale is recorded and inventory updated.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════ INVENTORY ════ */}
            {!showReturn && active === "inventory" && (
              <>
                <ShopDesktopHero
                  bp={bp}
                  breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · INVENTORY"
                  titleMain="Shop Inventory"
                  titleSub="& Current Stock"
                  description="All sarees currently in the retail shop — from factory dispatch and external purchases. Track availability, reserve status, and pricing."
                  pills={[{ text: "84 Total Sarees" }, { text: "76 Available for Sale", color: C.gold }, { text: "6 Reserved" }, { text: "2 External Suppliers" }]}
                  stats={[
                    { label: "TOTAL SAREES IN SHOP", val: "84", sub: "All sarees in stock" },
                    { label: "AVAILABLE FOR SALE", val: "76", sub: "Ready for customers", highlight: true },
                    { label: "RESERVED SAREES", val: "6", sub: "Customer holds" },
                    { label: "LOW STOCK ALERT", val: "⚠ Active", sub: "Threshold: below 15", crimson: true },
                  ]}
                  bgUrl={SHOP_BG}
                />
                <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                  {/* Search + filter */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                    <div style={{ flex: 1, position: "relative" as const }}>
                      <Search size={16} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input placeholder="Search by Saree ID, design code, or color..." style={{ width: "100%", height: 48, background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 18px 0 44px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" as const, boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }} />
                    </div>
                    {["All Sarees", "From Factory", "External", "Available", "Reserved"].map(f => (
                      <button key={f} style={{ padding: "10px 18px", borderRadius: 999, border: `1px solid ${C.bdr}`, background: f === "All Sarees" ? C.burg : "#FFF", fontFamily: F.u, fontSize: 14, color: f === "All Sarees" ? "#FFF" : C.muted, cursor: "pointer", whiteSpace: "nowrap" as const, fontWeight: f === "All Sarees" ? 600 : 400 }}>{f}</button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 300px", gap: isTablet ? 24 : 32, alignItems: "start" }}>
                    {/* Table */}
                    <div>
                      <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(44,24,16,0.08)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 100px 120px 100px", padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                          {["Saree ID", "Design & Name", "Color / Type", "Price", "Source", "Status"].map(h => (
                            <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                          ))}
                        </div>
                        {inventory.map((s, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 100px 120px 100px", padding: "20px 24px", borderBottom: i < inventory.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 6, height: 40, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                              <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{s.id}</span>
                            </div>
                            <div>
                              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 3 }}>{s.name}</div>
                              {s.design !== "External" && <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{s.design}</div>}
                              {s.supplier && <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Supplier: {s.supplier}</div>}
                            </div>
                            <div>
                              <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{s.sareeColor}</div>
                              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.type}</div>
                            </div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 17, color: C.gold }}>{s.price}</div>
                            <div>
                              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: s.src === "factory" ? C.green : C.gold, background: s.src === "factory" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)", padding: "4px 10px", borderRadius: 999 }}>
                                {s.src === "factory" ? "Factory" : "External"}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: s.status === "available" ? C.green : C.gold, background: s.status === "available" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)", padding: "4px 10px", borderRadius: 999 }}>
                                {s.status === "available" ? "✓ Available" : "Reserved"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 14 }}>Showing {inventory.length} sarees · {inventory.filter(s => s.status === "available").length} available · {inventory.filter(s => s.status === "reserved").length} reserved</div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
                      <div style={{ background: C.dark, borderRadius: 18, padding: "24px", boxShadow: "0 4px 22px rgba(61,14,26,0.18)" }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 16 }}>STOCK BY SOURCE</div>
                        {[
                          { label: "Factory Sarees", count: 4, pct: 67 },
                          { label: "External Purchases", count: 2, pct: 33 },
                        ].map(b => (
                          <div key={b.label} style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.70)" }}>{b.label}</span>
                              <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.gold }}>{b.count}</span>
                            </div>
                            <div style={{ height: 8, background: "rgba(255,255,255,0.10)", borderRadius: 999 }}>
                              <div style={{ width: `${b.pct}%`, height: "100%", background: C.gold, borderRadius: 999 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "rgba(192,57,43,0.06)", border: `2px solid rgba(192,57,43,0.28)`, borderRadius: 16, padding: "22px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <AlertTriangle size={20} color={C.crim} />
                          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 17, color: C.crim }}>Low Stock Warning</div>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 15, color: C.text, marginBottom: 6 }}>84 sarees remaining — below alert threshold.</div>
                        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 18 }}>Contact admin to arrange factory dispatch.</div>
                        <button style={{ width: "100%", height: 48, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <Send size={16} /> Report to Admin
                        </button>
                      </div>
                      <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "22px" }}>
                        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14 }}>Received This Week</div>
                        {[{ date: "10 Jun", count: 3, type: "Factory" }, { date: "09 Jun", count: 1, type: "Factory" }, { date: "05 Jun", count: 2, type: "External" }].map((r, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                            <div>
                              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.date}</div>
                              <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{r.count} sarees</div>
                            </div>
                            <span style={{ fontFamily: F.u, fontSize: 12, color: r.type === "Factory" ? C.green : C.gold, background: r.type === "Factory" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)", padding: "3px 10px", borderRadius: 999 }}>{r.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════ CUSTOMERS ════ */}
            {!showReturn && active === "customers" && (
              <>
                <ShopDesktopHero
                  bp={bp}
                  breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · CUSTOMERS"
                  titleMain="Customer Profiles"
                  titleSub="& Purchase History"
                  description="All retail customers — browse their history, spending patterns, and contact details. Regular customers are starred for easy identification."
                  pills={[{ text: "1,284 Total Customers" }, { text: "8 New This Month", color: C.gold }, { text: "₹1,84,000 Top Spender" }]}
                  stats={[
                    { label: "TOTAL CUSTOMERS", val: "1,284", sub: "All time" },
                    { label: "NEW THIS MONTH", val: "8", sub: "June 2026", highlight: true },
                    { label: "TOP SPENDER", val: "₹1,84,000", sub: "Smt. Annapurna Devi" },
                    { label: "REGULAR CUSTOMERS", val: "3", sub: "Shown below (starred)" },
                  ]}
                  bgUrl={SILK_BG}
                />
                <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                  {/* Search + filter */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
                    <div style={{ flex: 1, position: "relative" as const }}>
                      <Search size={16} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input placeholder="Search by name or phone number..." style={{ width: "100%", height: 50, background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 18px 0 44px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" as const, boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }} />
                    </div>
                    {["All", "Highest Spend", "Most Frequent", "Regular Only"].map(f => (
                      <button key={f} style={{ padding: "11px 20px", borderRadius: 999, border: `1px solid ${C.bdr}`, background: f === "All" ? C.burg : "#FFF", fontFamily: F.u, fontSize: 14, color: f === "All" ? "#FFF" : C.muted, cursor: "pointer", whiteSpace: "nowrap" as const, fontWeight: f === "All" ? 600 : 400 }}>{f}</button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 22 }}>
                    {customers.map((c, i) => (
                      <motion.div key={i}
                        whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(44,24,16,0.14)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, padding: "26px 24px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", cursor: "pointer", display: "flex", flexDirection: "column" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                          <div style={{ width: 58, height: 58, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(107,26,42,0.25)" }}>
                            <span style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: "#FFF" }}>{c.initials}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.name}</div>
                            <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{c.phone}</div>
                          </div>
                          {c.regular && <Star size={20} fill={C.gold} color={C.gold} />}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                          <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>PURCHASES</div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.burg }}>{c.purchases}</div>
                          </div>
                          <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>TOTAL SPENT</div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{c.total}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Last visit: <strong style={{ color: C.text }}>{c.last}</strong></div>
                          <button onClick={() => setSelectedCustomer(c)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", boxShadow: "0 2px 10px rgba(107,26,42,0.28)" }}>
                            View Profile <ArrowRight size={13} color="#FFF" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════ REPORTS ════ */}
            {!showReturn && active === "reports" && (
              <>
                <ShopDesktopHero
                  bp={bp}
                  breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · REPORTS"
                  titleMain="Sales Report"
                  titleSub="& Analytics"
                  description="Review all sales, revenue, customer trends, and return patterns. Use the period selector to view different time ranges."
                  pills={[{ text: "Today's View" }, { text: "248 Sarees This Month" }, { text: "₹18,40,000 Revenue" }]}
                  stats={[
                    { label: "TOTAL SALES THIS MONTH", val: "248", sub: "Sarees sold" },
                    { label: "TOTAL REVENUE", val: "₹18,40,000", sub: "Gross sales", highlight: true },
                    { label: "RETURNS", val: "3", sub: "This month", crimson: true },
                    { label: "AVERAGE PER SALE", val: "₹7,419", sub: "Per saree" },
                  ]}
                  bgUrl={SHOP_BG}
                />
                <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                  {/* Period selector */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
                    {["Today", "This Week", "This Month", "Last 3 Months"].map((p, i) => (
                      <button key={p} style={{ padding: "11px 24px", borderRadius: 999, border: `1px solid ${C.bdr}`, background: i === 0 ? C.burg : "#FFF", fontFamily: F.u, fontSize: 14, color: i === 0 ? "#FFF" : C.muted, cursor: "pointer", fontWeight: i === 0 ? 600 : 400 }}>{p}</button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 360px", gap: isTablet ? 24 : 32, alignItems: "start" }}>
                    {/* Left: Sales table + Returns */}
                    <div>
                      <DSH label="Today's Sales" link="Export →" onLink={() => { setExportDone(false); setExportDialog({ label: "Today's Sales" }); }} />
                      <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(44,24,16,0.08)", marginBottom: 32 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "80px 160px 1fr 1fr 80px 120px", padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                          {["Time", "Saree ID", "Customer", "Design", "Payment", "Amount"].map(h => (
                            <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                          ))}
                        </div>
                        {[
                          { time: "11:42", id: "PADMA-L1-004", customer: "Smt. Annapurna", design: "BKB-045", pay: "UPI", amt: "₹8,500", src: "factory" },
                          { time: "10:30", id: "RAVI-L2-008", customer: "Sri Ramesh K.", design: "BKB-031", pay: "Card", amt: "₹12,000", src: "factory" },
                          { time: "9:45", id: "BKB-L3-002", customer: "Smt. Lakshmi", design: "BKB-022", pay: "Cash", amt: "₹5,500", src: "factory" },
                          { time: "9:20", id: "EXT-RAVI-001", customer: "Smt. Padmavathi", design: "External", pay: "UPI", amt: "₹6,200", src: "external" },
                          { time: "9:05", id: "PADMA-L1-003", customer: "Smt. Saraswathi", design: "BKB-045", pay: "Cash", amt: "₹8,500", src: "factory" },
                        ].map((s, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 160px 1fr 1fr 80px 120px", padding: "18px 24px", borderBottom: i < 4 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                            <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{s.time}</div>
                            <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                            <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>{s.customer}</div>
                            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{s.design}</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>
                          </div>
                        ))}
                        <div style={{ padding: "16px 24px", background: "#FAFAF8", borderTop: `1px solid ${C.bdr}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                          <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>Total Today:</span>
                          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>₹40,700</span>
                        </div>
                      </div>

                      <DSH label="Returns This Month" />
                      <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.07)" }}>
                        {[
                          { date: "10 Jun", id: "RAVI-L2-007", customer: "Smt. Meenakshi", reason: "Wrong Design", amt: "₹12,000" },
                          { date: "05 Jun", id: "PADMA-L1-001", customer: "Smt. Kalpana", reason: "Defective", amt: "₹8,500" },
                          { date: "02 Jun", id: "BKB-L3-001", customer: "Sri Venkat", reason: "Changed Mind", amt: "₹5,500" },
                        ].map((r, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.06)` : "none", borderLeft: `6px solid ${C.crim}` }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <RotateCcw size={20} color={C.crim} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{r.date}</span>
                                <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{r.id}</span>
                              </div>
                              <div style={{ fontFamily: F.u, fontSize: 15, color: C.text }}>{r.customer} · {r.reason}</div>
                            </div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.crim }}>{r.amt}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Chart + Top Customers */}
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
                      <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, padding: "24px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                          <BarChart2 size={20} color={C.burg} />
                          <span style={{ fontFamily: F.u, fontSize: 17, fontWeight: 700, color: C.text }}>Sales by Design</span>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={designData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                            <XAxis type="number" tick={{ fontFamily: F.m, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="design" tick={{ fontFamily: F.m, fontSize: 12, fill: C.burg }} axisLine={false} tickLine={false} width={64} />
                            <Tooltip contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 10 }} formatter={(v: number) => [`${v} sarees`, "Sold"]} />
                            <Bar dataKey="count" radius={[0, 5, 5, 0]}>
                              {designData.map((entry, i) => <Cell key={`cell-${entry.design}`} fill={i === 0 ? C.burg : i === 1 ? C.gold : C.muted} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 5, height: 22, background: C.gold, borderRadius: 3 }} />
                          <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Top Customers</span>
                        </div>
                        {[
                          { name: "Smt. Annapurna Devi", purchases: 8, amt: "₹68,000" },
                          { name: "Smt. Lakshmi Bai", purchases: 5, amt: "₹42,000" },
                          { name: "Smt. Saraswathi", purchases: 4, amt: "₹34,000" },
                          { name: "Sri Ramesh K.", purchases: 2, amt: "₹24,500" },
                          { name: "Smt. Padmavathi", purchases: 1, amt: "₹12,500" },
                        ].map((c, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: i < 4 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                            <div style={{ fontFamily: F.d, fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? 26 : 22, color: i === 0 ? C.gold : C.text, width: 30, textAlign: "center" as const }}>{i + 1}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>{c.name}</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{c.purchases} purchases</div>
                            </div>
                            <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold }}>{c.amt}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════ PROCESS RETURN ════ */}
            {showReturn && (
              <>
                <ShopDesktopHero
                  bp={bp}
                  breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · PROCESS RETURN"
                  titleMain="Process Return"
                  titleSub="& Handle Customer Returns"
                  description="Find the original sale by scanning the barcode, select the return reason, and confirm. Inventory is updated automatically."
                  pills={[{ text: "3-Step Process" }, { text: "Auto Inventory Update" }, { text: "1 Return Today Already" }]}
                  alertBadge="Handle with care"
                  bgUrl={SILK_BG}
                />
                <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 36, alignItems: "start" }}>
                    <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 28px rgba(44,24,16,0.10)" }}>
                      <ProcessReturn onBack={() => setShowReturn(false)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 20, position: "sticky" as const, top: 84 }}>
                      <div style={{ background: C.dark, borderRadius: 18, padding: "24px", boxShadow: "0 4px 24px rgba(61,14,26,0.18)" }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 16 }}>RETURN PROCESS</div>
                        {[
                          { n: "1", title: "Find Original Sale", desc: "Scan the saree barcode or enter the Saree ID to find the original sale record" },
                          { n: "2", title: "Select Reason", desc: "Choose why the customer is returning — defective, wrong design, changed mind, etc." },
                          { n: "3", title: "Confirm Return", desc: "Review and confirm. Inventory +1, customer profile updated, admin notified" },
                        ].map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 2 ? 20 : 0, paddingBottom: i < 2 ? 20 : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.crim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: "#FFF" }}>{s.n}</span>
                            </div>
                            <div>
                              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: "#FFF", marginBottom: 5 }}>{s.title}</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{s.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "20px 22px" }}>
                        <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 700, color: C.crim, marginBottom: 10 }}>Today's Returns</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <RotateCcw size={20} color={C.crim} />
                          </div>
                          <div>
                            <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg, marginBottom: 3 }}>RAVI-L2-007</div>
                            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>Smt. Meenakshi · ₹12,000</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Wrong Design · 9:10 AM</div>
                          </div>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 6, borderTop: `1px solid rgba(192,57,43,0.15)`, paddingTop: 12 }}>Return Reference: RTN-2026-0040</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ══════ DIALOG: INVENTORY LOW STOCK ══════ */}
        <AnimatePresence>
          {showInvLowStockDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
              onClick={() => setShowInvLowStockDialog(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                onClick={e => e.stopPropagation()}
                style={{ background: "#FFF", borderRadius: 24, width: "100%", maxWidth: 520, boxShadow: "0 24px 80px rgba(44,24,16,0.22)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "28px 32px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(192,57,43,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlertTriangle size={24} color="#FF8080" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: "#FFF" }}>Report Low Stock</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Send an alert to Admin & Superadmin</div>
                    </div>
                    <button onClick={() => setShowInvLowStockDialog(false)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={18} color="rgba(255,255,255,0.70)" />
                    </button>
                  </div>
                </div>
                <div style={{ padding: "28px 32px 32px" }}>
                  {/* Stock status */}
                  <div style={{ background: "rgba(192,57,43,0.06)", border: `1.5px solid rgba(192,57,43,0.22)`, borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Current shop stock</span>
                      <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: C.crim }}>84</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Minimum threshold</span>
                      <span style={{ fontFamily: F.m, fontSize: 14, color: C.muted }}>100 sarees</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(192,57,43,0.12)", overflow: "hidden" }}>
                      <div style={{ width: "84%", height: "100%", background: `linear-gradient(90deg, ${C.crim}, #E05050)`, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.crim, marginTop: 8, fontWeight: 600 }}>↓ 16 below threshold</div>
                  </div>
                  {/* Priority */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 12 }}>Priority level</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {(["urgent", "normal"] as const).map(p => (
                        <button key={p} onClick={() => setInvLowStockPriority(p)} style={{ flex: 1, height: 48, borderRadius: 12, border: `2px solid ${invLowStockPriority === p ? (p === "urgent" ? C.crim : C.burg) : C.bdr}`, background: invLowStockPriority === p ? (p === "urgent" ? "rgba(192,57,43,0.08)" : "rgba(107,26,42,0.06)") : "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 15, color: invLowStockPriority === p ? (p === "urgent" ? C.crim : C.burg) : C.muted, cursor: "pointer" }}>
                          {p === "urgent" ? "🔴 Urgent" : "🟡 Normal"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Message */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 10 }}>Additional note <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></div>
                    <textarea value={invLowStockMsg} onChange={e => setInvLowStockMsg(e.target.value)} placeholder="E.g. Festival orders incoming — need Kanjivaram and plain silks urgently..." rows={3}
                      style={{ width: "100%", minHeight: 100, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 14, padding: "14px 16px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" as const }} />
                  </div>
                  {/* Recipients note */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(107,26,42,0.05)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24 }}>
                    <Send size={14} color={C.muted} />
                    <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>This report will be sent to <strong style={{ color: C.text }}>Admin</strong> and <strong style={{ color: C.text }}>Superadmin</strong></span>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => setShowInvLowStockDialog(false)} style={{ flex: 1, height: 52, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.muted, cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button onClick={() => { setShowInvLowStockDialog(false); setInvLowStockSent(true); }} style={{ flex: 2, height: 52, borderRadius: 999, border: "none", background: C.crim, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 18px rgba(192,57,43,0.35)" }}>
                      <Send size={17} /> Send Report to Admin
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════ DIALOG: CUSTOMER PROFILE ══════ */}
        <AnimatePresence>
          {selectedCustomer && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
              onClick={() => setSelectedCustomer(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                onClick={e => e.stopPropagation()}
                style={{ background: "#FFF", borderRadius: 24, width: "100%", maxWidth: isTablet ? "80vw" : 520, boxShadow: "0 24px 80px rgba(44,24,16,0.22)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" as const }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "32px 32px 28px", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.burg, border: "3px solid rgba(196,146,58,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(107,26,42,0.40)" }}>
                      <span style={{ fontFamily: F.d, fontSize: 28, fontWeight: 700, color: "#FFF" }}>{selectedCustomer.initials}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: "#FFF", lineHeight: 1.1 }}>{selectedCustomer.name}</div>
                        {selectedCustomer.regular && <Star size={18} fill={C.gold} color={C.gold} />}
                      </div>
                      <div style={{ fontFamily: F.m, fontSize: 14, color: "rgba(255,255,255,0.55)" }}>{selectedCustomer.phone}</div>
                      {selectedCustomer.regular && <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(196,146,58,0.20)", border: "1px solid rgba(196,146,58,0.40)", borderRadius: 999, padding: "3px 12px", marginTop: 8 }}><Star size={11} fill={C.gold} color={C.gold} /><span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold }}>Regular Customer</span></div>}
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <X size={18} color="rgba(255,255,255,0.70)" />
                    </button>
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: "28px 32px 32px", overflowY: "auto" as const }}>
                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
                    {[
                      { label: "Total Purchases", val: `${selectedCustomer.purchases}`, sub: "sarees bought", color: C.burg },
                      { label: "Total Spent", val: selectedCustomer.total, sub: "lifetime value", color: C.gold },
                      { label: "Last Visit", val: selectedCustomer.last, sub: "most recent", color: C.text },
                    ].map(s => (
                      <div key={s.label} style={{ background: "#F8F4F0", borderRadius: 14, padding: "16px 14px" }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, marginBottom: 8 }}>{s.label}</div>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: s.color, lineHeight: 1.2, marginBottom: 3 }}>{s.val}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                  {/* Recent purchases */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Recent Purchases
                    </div>
                    {[
                      { date: "Today", id: "PADMA-L1-004", design: "BKB-045 · Cream Zari Border", amt: "₹8,500", pay: "UPI" },
                      { date: "3 days ago", id: "RAVI-L2-008", design: "BKB-031 · Red Silk Kanjivaram", amt: "₹12,000", pay: "Card" },
                      { date: "2 weeks ago", id: "BKB-L3-002", design: "BKB-022 · Green Peacock", amt: "₹5,500", pay: "Cash" },
                    ].map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.08)` : "none" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(107,26,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ShoppingBag size={18} color={C.burg} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 3 }}>{p.id}</div>
                          <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{p.design}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.date} · {p.pay}</div>
                        </div>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{p.amt}</div>
                      </div>
                    ))}
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => setSelectedCustomer(null)} style={{ flex: 1, height: 50, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>Close</button>
                    <button style={{ flex: 2, height: 50, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                      <ShoppingBag size={16} /> Record New Sale for {selectedCustomer.name.split(" ")[1] || selectedCustomer.name.split(" ")[0]}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════ DIALOG: EXPORT REPORT ══════ */}
        <AnimatePresence>
          {exportDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
              onClick={() => { setExportDialog(null); setExportDone(false); }}>
              <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                onClick={e => e.stopPropagation()}
                style={{ background: "#FFF", borderRadius: 24, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(44,24,16,0.22)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "28px 32px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(196,146,58,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={24} color={C.gold} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: "#FFF" }}>Export Report</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{exportDialog.label}</div>
                    </div>
                    <button onClick={() => { setExportDialog(null); setExportDone(false); }} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={18} color="rgba(255,255,255,0.70)" />
                    </button>
                  </div>
                </div>
                <div style={{ padding: "28px 32px 32px" }}>
                  {exportDone ? (
                    <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
                      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                        <Check size={36} color={C.green} />
                      </div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 10 }}>Export Ready!</div>
                      <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
                        Your <strong style={{ color: C.text }}>{exportDialog.label}</strong> report has been exported as <strong style={{ color: C.text }}>{exportFormat.toUpperCase()}</strong>. Check your downloads folder.
                      </div>
                      <button onClick={() => { setExportDialog(null); setExportDone(false); }} style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer" }}>Done</button>
                    </div>
                  ) : (
                    <>
                      {/* Format selection */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 14 }}>Export format</div>
                        <div style={{ display: "flex", gap: 12 }}>
                          {([
                            { key: "pdf" as const, label: "PDF", icon: "📄", desc: "Print-ready" },
                            { key: "csv" as const, label: "CSV", icon: "📊", desc: "Spreadsheet" },
                            { key: "excel" as const, label: "Excel", icon: "📗", desc: "Advanced" },
                          ]).map(f => (
                            <button key={f.key} onClick={() => setExportFormat(f.key)} style={{ flex: 1, padding: "16px 10px", borderRadius: 14, border: `2px solid ${exportFormat === f.key ? C.burg : C.bdr}`, background: exportFormat === f.key ? "rgba(107,26,42,0.06)" : "#FFF", cursor: "pointer", textAlign: "center" as const }}>
                              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: exportFormat === f.key ? C.burg : C.text, marginBottom: 2 }}>{f.label}</div>
                              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{f.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* What's included */}
                      <div style={{ background: "#F8F4F0", borderRadius: 14, padding: "16px 18px", marginBottom: 24 }}>
                        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Includes</div>
                        {["Sale ID, customer name, design code", "Payment method and amount", "Timestamp and date", "Running totals and subtotals"].map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                            <Check size={14} color={C.green} />
                            <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => { setExportDialog(null); setExportDone(false); }} style={{ flex: 1, height: 52, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.muted, cursor: "pointer" }}>Cancel</button>
                        <button onClick={() => setExportDone(true)} style={{ flex: 2, height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                          <FileText size={17} /> Export as {exportFormat.toUpperCase()}
                        </button>
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

  // ── Mobile / Tablet Layout ──────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", minHeight: "100vh", background: "#FAFAFA", display: "flex", flexDirection: "column" as const, position: "relative" as const }}>
      <style>{`html, body { overflow-x: hidden; max-width: 100%; }`}</style>
        <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {/* Header */}
      {!showReturn && (
        <div style={{ height: 56, background: C.burg, display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0, position: "sticky" as const, top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(107,26,42,0.30)" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, width: 32, display: "flex", alignItems: "center" }}>
            <Flower2 size={22} color="rgba(255,255,255,0.90)" />
          </button>
          <div style={{ flex: 1, textAlign: "center" as const, fontFamily: F.d, fontWeight: 600, fontSize: 17, color: "#FFF" }}>
            {PAGE_TITLES[active]}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" as const, width: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={21} color="rgba(255,255,255,0.90)" />
              <span style={{ position: "absolute" as const, top: 4, right: 2, width: 8, height: 8, background: "#FF3B30", borderRadius: "50%" }} />
            </button>
            <div style={{ position: "relative" as const }}>
              <button onClick={() => setShowProfile(v => !v)} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 11, color: "#FFF" }}>PS</span>
              </button>
              {showProfile && (
                <div style={{ position: "absolute" as const, top: "calc(100% + 8px)", right: 0, zIndex: 300, background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 8px 32px rgba(44,24,16,0.18)", minWidth: 200, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", background: "rgba(0,128,128,0.05)", borderBottom: `1px solid ${C.bdr}` }}>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Priya Sharma</div>
                    <div style={{ fontFamily: F.m, fontSize: 10.5, color: C.muted, marginTop: 2 }}>SS-001 · Shop Staff</div>
                  </div>
                  <div style={{ padding: "6px 0" }}>
                    <button onClick={() => setShowProfile(false)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                      <UserRound size={14} color={C.muted} /> View Profile
                    </button>
                    <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                      <ChevronLeft size={14} color={C.muted} /> Switch Portal
                    </button>
                    <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: "#C0392B", textAlign: "left" as const }}>
                      <LogOut size={14} color="#C0392B" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content — extra bottom padding on Home/Inventory so the floating "New Sale"
          button never covers the last row of a list */}
      <div style={{ flex: 1, overflowY: "auto" as const, paddingBottom: showReturn ? 0 : (active === "home" || active === "inventory") ? 140 : 66 }}>
        <AnimatePresence mode="wait">
          <motion.div key={showReturn ? "return" : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating quick-action — New Sale (Home + Inventory only) */}
      <div style={{ position: "fixed" as const, bottom: 76, left: 0, width: "100%", zIndex: 110, pointerEvents: "none" as const }}>
        <AnimatePresence>
          {!showReturn && (active === "home" || active === "inventory") && (
            <motion.button
              key={active}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActive("sale")}
              style={{
                position: "absolute" as const, right: 16, bottom: 0, pointerEvents: "auto" as const,
                display: "flex", alignItems: "center", gap: 10,
                height: 56, padding: "0 22px 0 18px", borderRadius: 999,
                background: TEAL, border: "none", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(15,118,110,0.30)",
              }}
            >
              <ShoppingBag size={22} color="#FFF" />
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", whiteSpace: "nowrap" as const }}>New Sale</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar — full-width */}
      {!showReturn && (
        <div style={{
          position: "fixed" as const, bottom: 0, left: 0, width: "100%", height: 66,
          background: C.white, borderTop: `1px solid ${C.bdr}`,
          display: "flex", zIndex: 100, boxShadow: "0 -4px 20px rgba(107,26,42,0.08)",
        }}>
          {TABS.map(tab => {
            const isActive = active === tab.id;
            return (
              <button key={tab.id} onClick={() => setActive(tab.id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                position: "relative" as const,
              }}>
                <div style={{ position: "relative" as const, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {isActive && (
                    <motion.div layoutId="shop-tab-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ position: "absolute" as const, top: -9, left: "50%", marginLeft: -13, width: 26, height: 3, borderRadius: 4, background: C.burg }} />
                  )}
                  {tab.id === "sale" && (
                    <span style={{ position: "absolute" as const, top: -3, right: -7, width: 7, height: 7, background: C.crim, borderRadius: "50%" }} />
                  )}
                  {React.cloneElement(tab.icon as React.ReactElement, { color: isActive ? C.burg : C.muted })}
                  <span style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: isActive ? 600 : 500, color: isActive ? C.burg : C.muted, transition: "color 0.2s" }}>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
