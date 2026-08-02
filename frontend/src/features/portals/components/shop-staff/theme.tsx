

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useResponsive } from "../../../../hooks/useResponsive";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown
} from 'lucide-react';

const ShopPriceContext = React.createContext<boolean>(false);
export function useCanSeePrices() { return React.useContext(ShopPriceContext); }

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

export type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

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
const CUSTOMER_PURCHASES: Record<string, { date: string; id: string; design: string; price: string; amt: string; pay: string }[]> = {
  "Smt. Annapurna Devi": [
    { date: "10 Jun 2026", id: "PADMA-L1-004", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "UPI" },
    { date: "08 Jun 2026", id: "RAVI-L2-008", design: "HZ-003 · Maroon Heavy Zari Saree", price: "₹12,000", amt: "₹12,000", pay: "Card" },
    { date: "24 May 2026", id: "BKB-L3-002", design: "PS-002 · Cream Plain Silk Saree", price: "₹5,500", amt: "₹5,500", pay: "Cash" },
    { date: "18 May 2026", id: "EXT-RAVI-001", design: "EXT-01 · Silk Checks Saree", price: "₹6,200", amt: "₹6,200", pay: "UPI" },
    { date: "12 May 2026", id: "EXT-RAVI-002", design: "EXT-02 · Floral Design Saree", price: "₹7,800", amt: "₹7,800", pay: "UPI" },
    { date: "05 May 2026", id: "PADMA-L1-003", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "Cash" },
    { date: "28 Apr 2026", id: "ANAND-L3-001", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Card" },
    { date: "15 Apr 2026", id: "MEENA-L4-001", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "UPI" },
    { date: "02 Apr 2026", id: "SURESH-L2-001", design: "HZ-003 · Maroon Heavy Saree", price: "₹12,000", amt: "₹12,000", pay: "Cash" },
    { date: "20 Mar 2026", id: "KAMALA-L1-001", design: "HZ-003 · Maroon Heavy Saree", price: "₹12,000", amt: "₹12,000", pay: "Card" },
    { date: "10 Mar 2026", id: "VENKAT-L3-001", design: "HZ-003 · Maroon Heavy Saree", price: "₹12,000", amt: "₹12,000", pay: "UPI" },
    { date: "25 Feb 2026", id: "LAKSHMI-L2-001", design: "BS-004 · Bridal Special Saree", price: "₹15,000", amt: "₹15,000", pay: "Card" },
    { date: "14 Feb 2026", id: "RAVI-L2-004", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "UPI" },
    { date: "02 Feb 2026", id: "RAVI-L2-005", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Cash" },
    { date: "19 Jan 2026", id: "RAVI-L2-006", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Card" },
    { date: "05 Jan 2026", id: "RAVI-L2-007", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "UPI" },
    { date: "15 Dec 2025", id: "PADMA-L1-001", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Cash" },
    { date: "10 Nov 2025", id: "PADMA-L1-002", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Card" },
  ],
  "Smt. Lakshmi Bai": [
    { date: "09 Jun 2026", id: "RAVI-L2-008", design: "HZ-003 · Maroon Heavy Zari Saree", price: "₹12,000", amt: "₹12,000", pay: "Card" },
    { date: "01 Jun 2026", id: "BKB-L3-002", design: "PS-002 · Cream Plain Silk Saree", price: "₹5,500", amt: "₹5,500", pay: "UPI" },
    { date: "15 May 2026", id: "EXT-RAVI-001", design: "EXT-01 · Silk Checks Saree", price: "₹6,200", amt: "₹6,200", pay: "Cash" },
    { date: "10 May 2026", id: "PADMA-L1-003", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "UPI" },
    { date: "29 Apr 2026", id: "ANAND-L3-002", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Card" },
    { date: "14 Apr 2026", id: "MEENA-L4-002", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "UPI" },
    { date: "01 Apr 2026", id: "SURESH-L2-002", design: "HZ-003 · Maroon Heavy Saree", price: "₹12,000", amt: "₹12,000", pay: "Cash" },
    { date: "18 Mar 2026", id: "KAMALA-L1-002", design: "HZ-003 · Maroon Heavy Saree", price: "₹12,000", amt: "₹12,000", pay: "Card" },
    { date: "05 Mar 2026", id: "VENKAT-L3-002", design: "HZ-003 · Maroon Heavy Saree", price: "₹12,000", amt: "₹12,000", pay: "UPI" },
    { date: "20 Feb 2026", id: "LAKSHMI-L2-002", design: "BS-004 · Bridal Special Saree", price: "₹15,000", amt: "₹15,000", pay: "Card" },
    { date: "11 Feb 2026", id: "RAVI-L2-004", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "UPI" },
    { date: "01 Feb 2026", id: "RAVI-L2-005", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Cash" },
  ],
  "Sri Ramesh K.": [
    { date: "10 Jun 2026", id: "PADMA-L1-004", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "UPI" },
    { date: "24 May 2026", id: "BKB-L3-002", design: "PS-002 · Cream Plain Silk Saree", price: "₹5,500", amt: "₹5,500", pay: "Cash" },
    { date: "12 May 2026", id: "EXT-RAVI-002", design: "EXT-02 · Floral Design Saree", price: "₹7,800", amt: "₹7,800", pay: "UPI" },
    { date: "02 Apr 2026", id: "SURESH-L2-001", design: "HZ-003 · Maroon Heavy Saree", price: "₹12,000", amt: "₹12,000", pay: "Card" },
  ],
  "Smt. Padmavathi": [
    { date: "10 Jun 2026", id: "PADMA-L1-004", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "UPI" },
  ],
  "Smt. Saraswathi": [
    { date: "10 Jun 2026", id: "PADMA-L1-004", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "UPI" },
    { date: "08 Jun 2026", id: "RAVI-L2-008", design: "HZ-003 · Maroon Heavy Zari Saree", price: "₹12,000", amt: "₹12,000", pay: "Card" },
    { date: "24 May 2026", id: "BKB-L3-002", design: "PS-002 · Cream Plain Silk Saree", price: "₹5,500", amt: "₹5,500", pay: "Cash" },
    { date: "18 May 2026", id: "EXT-RAVI-001", design: "EXT-01 · Silk Checks Saree", price: "₹6,200", amt: "₹6,200", pay: "UPI" },
    { date: "12 May 2026", id: "EXT-RAVI-002", design: "EXT-02 · Floral Design Saree", price: "₹7,800", amt: "₹7,800", pay: "UPI" },
    { date: "05 May 2026", id: "PADMA-L1-003", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "Cash" },
    { date: "28 Apr 2026", id: "ANAND-L3-001", design: "SB-001 · Self Brocade Saree", price: "₹9,500", amt: "₹9,500", pay: "Card" },
  ],
  "Smt. Rajeshwari": [
    { date: "10 Jun 2026", id: "PADMA-L1-004", design: "HZ-003 · Cream Zari Border Saree", price: "₹8,500", amt: "₹8,500", pay: "UPI" },
    { date: "08 Jun 2026", id: "RAVI-L2-008", design: "HZ-003 · Maroon Heavy Zari Saree", price: "₹12,000", amt: "₹12,000", pay: "Card" },
  ],
};

// ─── PAGE 05 — CUSTOMER PROFILES ─────────────────────────────────────────────
export { ShopPriceContext, C, F, TEAL, SHOP_BG, SILK_BG, ShopDesktopHero, SectionTitle, HeroHeader, StatsStrip, Card, Btn, Chip, CUSTOMER_PURCHASES };
