

import { brand, fonts, semantic } from '@/design-system/tokens';
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useResponsive } from "../../../../hooks/useResponsive";
import { Button } from "../../../../shared/ui/primitives";
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
  burg: brand.burgundy[900], dark: brand.burgundy[950], gold: brand.gold[500], green: semantic.text.success,
  crim: semantic.text.danger, text: semantic.text.primary, muted: semantic.text.tertiary,
  bdr: "rgba(110,15,45,0.10)", bdrMed: "rgba(110,15,45,0.20)", wine: brand.burgundy[950],
  cream: semantic.surface.canvas, inp: "#FFF8E7", white: "#FFFFFF",
};
const F = { d: fonts.display, u: fonts.ui, m: fonts.code };

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
    <div style={{ position: "relative", overflow: "hidden", background: "#0D0207" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${bgUrl || SHOP_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.20 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(13,2,7,0.96) 0%, rgba(13,2,7,0.79) 60%, rgba(13,2,7,0.53) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, padding: isTablet ? "28px 24px 0" : "48px 48px 0" }}>
        <div style={{ fontFamily: F.m, fontSize: 13, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase" as const, marginBottom: 12 }}>{breadcrumb}</div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: isTablet ? 40 : 56, color: "#FFFDF9", lineHeight: 1.1 }}>
            {titleMain} <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: isTablet ? 26 : 36, color: C.gold }}>{titleSub}</span>
          </div>
          {alertBadge && (
            <div style={{ background: "rgba(200,155,71,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#E7C983" }}>{alertBadge}</span>
            </div>
          )}
        </div>
        <div style={{ fontFamily: F.u, fontSize: 18, color: "rgba(255,253,249,0.70)", lineHeight: 1.6, maxWidth: 640, marginBottom: 22 }}>{description}</div>
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
              backgroundImage: s.highlight ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
            }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, letterSpacing: "2px", color: s.highlight ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)", textTransform: "uppercase" as const, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: isTablet ? 38 : 48, color: s.highlight ? "#E7C983" : s.crimson ? "#F47B72" : "#FFFFFF", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: s.highlight ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>{s.sub}</div>
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
    <SectionHeadingShared
      id={id}
      title={title}
      right={link ? <Button variant="link" onClick={onLink} className="p-0 text-[13px] font-semibold text-[#845E04]">{link}</Button> : undefined}
    />
  );
}

function HeroHeader({ eyebrow, title, sub, desc }: { eyebrow: string; title: string; sub: string; desc?: string }) {
  return (
    <div style={{ background: "#0D0207", padding: "28px 20px 24px" }}>
      <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase" as const, marginBottom: 10 }}>{eyebrow}</div>
      <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 34, color: "#FFFDF9", lineHeight: 1.1, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: 22, color: C.gold, marginBottom: desc ? 8 : 0 }}>{sub}</div>
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
          <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" as const, color: s.highlight ? C.text : "rgba(255,255,255,0.50)", marginBottom: 5 }}>{s.label}</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: s.highlight ? C.text : s.crimson ? "#FF6B6B" : "#FFF", lineHeight: 1 }}>{s.val}</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: s.highlight ? "rgba(26,10,15,0.55)" : "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.bdr}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", ...style }}>
      {children}
    </div>
  );
}

function Btn({ label, icon, onClick, variant = "burg", style }: { label: string; icon?: React.ReactNode; onClick?: () => void; variant?: "burg" | "green" | "gold" | "ghost" | "crim"; style?: React.CSSProperties }) {
  const classByVariant: Record<string, string> = {
    burg: "bg-[#6E0F2D] text-white border-none hover:bg-[#6E0F2D]",
    green: "bg-[#1E6640] text-white border-none hover:bg-[#1E6640]",
    gold: "bg-[#C89B47] text-[#1A0A0F] border-none hover:bg-[#C89B47]",
    ghost: "bg-transparent text-[#6E0F2D] border border-[#6E0F2D] hover:bg-transparent",
    crim: "bg-[#C0392B] text-white border-none hover:bg-[#C0392B]",
  };
  return (
    <div style={style}>
      <Button
        onClick={onClick}
        variant="primary"
        fullWidth
        className={`inline-flex items-center justify-center gap-2 h-[52px] rounded-full font-semibold text-sm ${classByVariant[variant]}`}
      >
        {icon}{label}
      </Button>
    </div>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ background: bg, color, borderRadius: 999, padding: "2px 10px", fontFamily: F.u, fontSize: 12, fontWeight: 500, display: "inline-block" }}>{label}</span>;
}

// ─── PAGE 01 — SHOP HOME ────────────────────────────────────────────────────
const CUSTOMER_PURCHASES: Record<string, { date: string; id: string; design: string; price: string; amt: string; pay: string }[]> = {};

import { SectionHeading as SectionHeadingShared, PageHero, StatsStrip as PortalStatsStrip, SectionCard, GUTTER_X, GUTTER_X_TABLET } from "@/shared/ui/portal/PortalChrome";
export { PageHero, PortalStatsStrip, SectionCard, GUTTER_X, GUTTER_X_TABLET };
export type { WorkerStat as PortalStat } from "@/shared/ui/portal/PortalChrome";

// ─── PAGE 05 — CUSTOMER PROFILES ─────────────────────────────────────────────
export { ShopPriceContext, C, F, TEAL, SHOP_BG, SILK_BG, ShopDesktopHero, SectionTitle, HeroHeader, StatsStrip, Card, Btn, Chip, CUSTOMER_PURCHASES };
