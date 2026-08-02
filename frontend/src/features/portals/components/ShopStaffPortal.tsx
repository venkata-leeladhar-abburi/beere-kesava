
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
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
import { getSareeTypeByCode } from "../../../app/components/RatesPricingPage";
import { SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE, SHOP_MOBILE_HEADER_H } from "../../../app/components/SectionNavigator";
import { useResponsive } from "../../../app/components/useResponsive";
import { imgBKLogo } from "../../../app/constants/weaverImages";
import { InventoryPage as AdminInventoryPage } from "../../inventory/components/InventoryPage";

// ─── Price Visibility Context ────────────────────────────────────────────────
// Shop staff (role="shop") cannot see monetary values.
// Admins and superadmins who access the shop portal CAN see prices.
import { ShopPriceContext, C, F, TEAL, SHOP_BG, SILK_BG, ShopDesktopHero, HeroHeader, StatsStrip, Btn } from './shop-staff/theme';
import { ShopHome } from './shop-staff/ShopHome';
import { NewSaleFlow } from './shop-staff/NewSaleFlow';
import { ShopInventory } from './shop-staff/ShopInventory';
import { ProcessReturn } from './shop-staff/ProcessReturn';
import { CustomerProfiles } from './shop-staff/CustomerProfiles';
import { SalesReport } from './shop-staff/SalesReport';
import { CUSTOMER_PURCHASES } from './shop-staff/theme';

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";
type ShopStaffPortalProps = { onBack?: () => void };
type ShopCustomer = { name: string; phone: string; purchases: number; total: string; lastPurchase?: string; last?: string; initials: string; regular?: boolean; [key: string]: any };

export function ShopStaffPortal({ onBack }: ShopStaffPortalProps) {
  const { isMobile, w } = useResponsive();
  const bp: "tablet" | "desktop" = w >= 1280 ? "desktop" : "tablet";
  const isTablet = bp === "tablet";
  const { pathname } = useLocation();
  const routerNavigate = useNavigate();
  const { logout, selectRole, role, adminViewingAs } = useAuth();
  // Money is owner-only. A real shop-staff login never sees it.
  // The route guard forces role === "shop" inside this portal, so an owner
  // looking in from their dashboard is identified by `adminViewingAs`, which is
  // set when they enter from the Staff Portals menu — not by `role`.
  const canSeePrices = role === "admin" || role === "superadmin" || adminViewingAs !== null;

  const handleLogout = () => {
    logout();
    routerNavigate("/login");
  };

  let active: TabId = "home";
  if (pathname.includes("/sale")) active = "sale";
  else if (pathname.includes("/inventory")) active = "inventory";
  else if (pathname.includes("/customers")) active = "customers";
  else if (pathname.includes("/reports")) active = "reports";

  const showReturn = pathname.includes("/return");

  const setActive = (tab: TabId) => {
    const routeMap: Record<TabId, string> = {
      home: "/shop/home",
      sale: "/shop/sale",
      inventory: "/shop/inventory",
      customers: "/shop/customers",
      reports: "/shop/reports",
    };
    const path = routeMap[tab] || "/shop/home";
    routerNavigate(path);
  };
  const setShowReturn = (val: boolean) => {
    if (val) {
      routerNavigate("/shop/return");
    } else {
      routerNavigate("/shop/home");
    }
  };
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Desktop Inventory states
  const [deskInvSearch, setDeskInvSearch] = useState("");
  const [deskInvFilter, setDeskInvFilter] = useState("All Sarees");
  const [deskInvLoomFilter, setDeskInvLoomFilter] = useState<string[]>([]);
  const [deskInvWeaverFilter, setDeskInvWeaverFilter] = useState<string[]>([]);

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
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "sale", label: "New Sale", icon: <ShoppingBag size={20} /> },
    { id: "inventory", label: "Inventory", icon: <Package size={20} /> },
    { id: "customers", label: "Customers", icon: <Users size={20} /> },
    { id: "reports", label: "Reports", icon: <BarChart2 size={20} /> },
  ];

  const PAGE_TITLES: Record<TabId, string> = {
    home: "Shop Home", sale: "New Sale", inventory: "Shop Inventory",
    customers: "Customers", reports: "Sales Report",
  };

  const renderPage = () => {
    if (showReturn) return <ProcessReturn onBack={() => setShowReturn(false)} />;
    switch (active) {
      case "home": return <ShopHome onNavigate={(t) => { if (t === "return") setShowReturn(true); else setActive(t as TabId); }} />;
      case "sale": return <NewSaleFlow />;
      case "inventory": return (
        // Same Inventory page the admin portal uses — quotations and wholesale
        // dispatch (both inherently about pricing) stay off the shop floor, and
        // every money figure follows the same canSeePrices rule as the rest of
        // this portal, so an admin/superadmin previewing the shop portal still
        // sees real figures while genuine shop staff never do.
        <AdminInventoryPage canRaiseQuotation={false} canDispatchWholesale={false} canDispatchShop={false} canSeeMoney={canSeePrices} showQuickDispatch={false} showCategorySplit={false} showQuotationsSection={false} showDispatchHistory={false} />
      );
      case "customers": return <CustomerProfiles />;
      case "reports": return <SalesReport />;
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
      { id: "PADMA-L1-004", src: "factory", design: "HZ-003", name: "Cream Zari Border", color: "#E8D5B0", sareeColor: "Cream", type: "Self Brocade", price: "₹8,500", received: "10 Jun", status: "available", supplier: null as string | null, loom: "L1", weaver: "Padma Veni" },
      { id: "RAVI-L2-008", src: "factory", design: "HZ-003", name: "Maroon Heavy Zari", color: "#8B2020", sareeColor: "Maroon", type: "Heavy Brocade", price: "₹12,000", received: "09 Jun", status: "available", supplier: null as string | null, loom: "L2", weaver: "Ravi Kumar" },
      { id: "BKB-L3-002", src: "factory", design: "PS-002", name: "Cream Plain Silk", color: "#F5F5DC", sareeColor: "Cream", type: "Plain Weave", price: "₹5,500", received: "08 Jun", status: "available", supplier: null as string | null, loom: "L3", weaver: "Lakshmi Devi" },
      { id: "EXT-RAVI-001", src: "external", design: "External", name: "Silk Checks", color: "#C9A86C", sareeColor: "Gold", type: "Checks", price: "₹6,200", received: "05 Jun", status: "available", supplier: "Ravi Silks", loom: null as string | null, weaver: null as string | null },
      { id: "EXT-RAVI-002", src: "external", design: "External", name: "Floral Design", color: "#D4A5C5", sareeColor: "Pink", type: "Floral", price: "₹7,800", received: "05 Jun", status: "available", supplier: "Ravi Silks", loom: null as string | null, weaver: null as string | null },
      { id: "PADMA-L1-003", src: "factory", design: "HZ-003", name: "Cream Zari Border", color: "#E8D5B0", sareeColor: "Cream", type: "Self Brocade", price: "₹8,500", received: "07 Jun", status: "reserved", supplier: null as string | null, loom: "L1", weaver: "Padma Veni" },
    ];

    const looms = Array.from(new Set(inventory.map(s => s.loom).filter(Boolean))) as string[];
    const weavers = Array.from(new Set(inventory.map(s => s.weaver).filter(Boolean))) as string[];

    const toggleDeskLoomFilter = (l: string) => {
      if (l === "All Looms") {
        setDeskInvLoomFilter([]);
      } else {
        setDeskInvLoomFilter(prev =>
          prev.includes(l) ? prev.filter(item => item !== l) : [...prev, l]
        );
      }
    };

    const toggleDeskWeaverFilter = (w: string) => {
      if (w === "All Weavers") {
        setDeskInvWeaverFilter([]);
      } else {
        setDeskInvWeaverFilter(prev =>
          prev.includes(w) ? prev.filter(item => item !== w) : [...prev, w]
        );
      }
    };

    const filteredInventory = inventory.filter(s => {
      const q = deskInvSearch.toLowerCase();
      const matchSearch = !q || s.id.toLowerCase().includes(q) || s.design.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.weaver && s.weaver.toLowerCase().includes(q)) || (s.loom && s.loom.toLowerCase().includes(q));
      const matchFilter = deskInvFilter === "All Sarees" || (deskInvFilter === "From Factory" && s.src === "factory") || (deskInvFilter === "External" && s.src === "external") || (deskInvFilter === "Available" && s.status === "available") || (deskInvFilter === "Reserved" && s.status === "reserved");
      const matchLoom = deskInvLoomFilter.length === 0 || (s.loom && deskInvLoomFilter.includes(s.loom));
      const matchWeaver = deskInvWeaverFilter.length === 0 || (s.weaver && deskInvWeaverFilter.includes(s.weaver));
      return matchSearch && matchFilter && matchLoom && matchWeaver;
    });

    const dropStyle: React.CSSProperties = {
      height: 38, padding: "0 12px", borderRadius: 8, border: `1px solid ${C.bdr}`, background: "#FFF",
      fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer", outline: "none",
      appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B7060' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28,
    };

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
      <ShopPriceContext.Provider value={canSeePrices}>
      <div style={{ minHeight: "100vh", background: "#F8F4F0", fontFamily: F.u }}>
        <style>{`html, body { overflow-x: hidden; max-width: 100%; }`}</style>
        <style>{SECTION_NAV_GLOBAL_STYLE}</style>
        {/* ── Top Nav ── */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.bdr}`, position: "sticky" as const, top: 0, zIndex: 200, boxShadow: "0 1px 10px rgba(107,26,42,0.07)" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", padding: isTablet ? "0 24px" : "0 48px", display: "flex", alignItems: "center", height: 64, gap: isTablet ? 16 : 28 }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              {!isTablet && (
                <div>
                  <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#2C1810", lineHeight: 1.1, textTransform: "uppercase" as const }}>Beere Kesava</div>
                  <div style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: 400, color: "#3B2314", letterSpacing: 1.6, textTransform: "uppercase" as const, marginTop: 1 }}>And Brothers Silks</div>
                  <div style={{ fontFamily: F.u, fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: 2.5, textTransform: "uppercase" as const, marginTop: 4 }}>SHOP STAFF PORTAL</div>
                </div>
              )}
            </div>
            <nav className="shop-topnav-groups" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: isTablet ? "flex-start" : "center", gap: 2, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
              <style>{`.shop-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => { setActive(tab.id); }} style={{
                  display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: isTablet ? "0 12px" : "0 18px", height: 64, border: "none", background: "transparent", cursor: "pointer",
                  fontFamily: F.u, fontSize: 14, fontWeight: active === tab.id && !showReturn ? 600 : 400,
                  color: active === tab.id && !showReturn ? TEAL : C.muted,
                  borderBottom: active === tab.id && !showReturn ? `3px solid ${TEAL}` : "2px solid transparent",
                  transition: "all 0.15s", whiteSpace: "nowrap" as const,
                }}
                  onMouseEnter={e => { if (!(active === tab.id && !showReturn)) e.currentTarget.style.color = TEAL; }}
                  onMouseLeave={e => { if (!(active === tab.id && !showReturn)) e.currentTarget.style.color = C.muted; }}>
                  {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 16, color: active === tab.id && !showReturn ? TEAL : C.muted })}
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
                      <button onClick={() => { setShowProfile(false); setShowProfileModal(true); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <UserRound size={15} color={C.muted} /> View Profile
                      </button>
                      <div style={{ height: 1, background: C.bdr, margin: "4px 0" }} />
                      {localStorage.getItem("bk_original_admin_role") ? (
                        <button onClick={() => {
                          setShowProfile(false);
                          const origAdminRole = localStorage.getItem("bk_original_admin_role");
                          if (origAdminRole) {
                            localStorage.removeItem("bk_original_admin_role");
                            selectRole(origAdminRole as any);
                            routerNavigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                          }
                        }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <ChevronLeft size={15} color={C.muted} /> My Portal
                        </button>
                      ) : (
                        <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <ChevronLeft size={15} color={C.muted} /> Switch Portal
                        </button>
                      )}
                      <button onClick={() => { setShowProfile(false); handleLogout(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
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
                  pills={[{ text: "12 Sales Today", color: C.gold }, ...(canSeePrices ? [{ text: "₹1,04,000 Revenue" }] : []), { text: "84 Sarees in Stock" }, { text: "1 Return Processed" }]}
                  alertBadge="Priya Sharma · Shop Staff"
                  stats={[
                    { label: "TODAY'S SALES", val: "12", sub: "↑ 3 more than yesterday" },
                    ...(canSeePrices ? [{ label: "TODAY'S REVENUE", val: "₹1,04,000", sub: "From 12 sales", highlight: true }] : []),
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
                          <div style={{ display: "grid", gridTemplateColumns: `1fr 1fr 120px 80px${canSeePrices ? " 100px" : ""}`, padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                            {["Saree ID", "Customer", "Design", "Payment", ...(canSeePrices ? ["Amount"] : [])].map(h => (
                              <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                            ))}
                          </div>
                          {recentSales.map((s, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: `1fr 1fr 120px 80px${canSeePrices ? " 100px" : ""}`, padding: "18px 24px", borderBottom: i < recentSales.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
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
                              {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
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
                            <div style={{ fontFamily: F.u, fontSize: 15, color: C.text }}>Wrong Design · Smt. Meenakshi{canSeePrices ? " · ₹12,000" : ""}</div>
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
            {/* Same InventoryPage component the admin portal uses — see the
                mobile-layout "inventory" case above for the reasoning on the
                props (no quotations/wholesale dispatch on the shop floor, money
                follows the same canSeePrices rule as the rest of this portal). */}
            {!showReturn && active === "inventory" && (
              <AdminInventoryPage canRaiseQuotation={false} canDispatchWholesale={false} canDispatchShop={false} canSeeMoney={canSeePrices} showQuickDispatch={false} showCategorySplit={false} showQuotationsSection={false} showDispatchHistory={false} />
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
                  pills={[{ text: "1,284 Total Customers" }, { text: "8 New This Month", color: C.gold }, ...(canSeePrices ? [{ text: "₹1,84,000 Top Spender" }] : [])]}
                  stats={[
                    { label: "TOTAL CUSTOMERS", val: "1,284", sub: "All time" },
                    { label: "NEW THIS MONTH", val: "8", sub: "June 2026", highlight: true },
                    ...(canSeePrices ? [{ label: "TOP SPENDER", val: "₹1,84,000", sub: "Smt. Annapurna Devi" }] : []),
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
                        <div style={{ display: "grid", gridTemplateColumns: canSeePrices ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 18 }}>
                          <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>PURCHASES</div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.burg }}>{c.purchases}</div>
                          </div>
                          {canSeePrices && (
                            <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "12px 14px" }}>
                              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>TOTAL SPENT</div>
                              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{c.total}</div>
                            </div>
                          )}
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
                  pills={[{ text: "Today's View" }, { text: "248 Sarees This Month" }, ...(canSeePrices ? [{ text: "₹18,40,000 Revenue" }] : [])]}
                  stats={[
                    { label: "TOTAL SALES THIS MONTH", val: "248", sub: "Sarees sold" },
                    ...(canSeePrices ? [{ label: "TOTAL REVENUE", val: "₹18,40,000", sub: "Gross sales", highlight: true }] : []),
                    { label: "RETURNS", val: "3", sub: "This month", crimson: true },
                    ...(canSeePrices ? [{ label: "AVERAGE PER SALE", val: "₹7,419", sub: "Per saree" }] : []),
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
                        <div style={{ display: "grid", gridTemplateColumns: `80px 160px 1fr 1fr 80px${canSeePrices ? " 120px" : ""}`, padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                          {["Time", "Saree ID", "Customer", "Design", "Payment", ...(canSeePrices ? ["Amount"] : [])].map(h => (
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
                          <div key={i} style={{ display: "grid", gridTemplateColumns: `80px 160px 1fr 1fr 80px${canSeePrices ? " 120px" : ""}`, padding: "18px 24px", borderBottom: i < 4 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                            <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{s.time}</div>
                            <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                            <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>{s.customer}</div>
                            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{s.design}</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                            {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
                          </div>
                        ))}
                        {canSeePrices && (
                          <div style={{ padding: "16px 24px", background: "#FAFAF8", borderTop: `1px solid ${C.bdr}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                            <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>Total Today:</span>
                            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>₹40,700</span>
                          </div>
                        )}
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
                            {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.crim }}>{r.amt}</div>}
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
                            {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold }}>{c.amt}</div>}
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
                            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>Smt. Meenakshi{canSeePrices ? " · ₹12,000" : ""}</div>
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
                      ...(canSeePrices ? [{ label: "Total Spent", val: selectedCustomer.total, sub: "lifetime value", color: C.gold }] : []),
                      { label: "Last Visit", val: selectedCustomer.last, sub: "most recent", color: C.text },
                    ].map(s => (
                      <div key={s.label} style={{ background: "#F8F4F0", borderRadius: 14, padding: "16px 14px" }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, marginBottom: 8 }}>{s.label}</div>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: s.color, lineHeight: 1.2, marginBottom: 3 }}>{s.val}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Purchase History ({(CUSTOMER_PURCHASES[selectedCustomer.name] || []).length})
                    </div>
                    {(CUSTOMER_PURCHASES[selectedCustomer.name] || []).map((p, i, arr) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < arr.length - 1 ? `1px solid rgba(107,26,42,0.08)` : "none" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(107,26,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ShoppingBag size={18} color={C.burg} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 3 }}>{p.id}</div>
                          <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{p.design}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.date} · {p.pay}</div>
                        </div>
                        {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{p.amt}</div>}
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
      </ShopPriceContext.Provider>
    );
  }

  // ── Mobile / Tablet Layout ──────────────────────────────────────────────
  return (
    <ShopPriceContext.Provider value={canSeePrices}>
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
                    <button onClick={() => { setShowProfile(false); setShowProfileModal(true); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                      <UserRound size={14} color={C.muted} /> View Profile
                    </button>
                    {localStorage.getItem("bk_original_admin_role") ? (
                      <button onClick={() => {
                        setShowProfile(false);
                        const origAdminRole = localStorage.getItem("bk_original_admin_role");
                        if (origAdminRole) {
                          localStorage.removeItem("bk_original_admin_role");
                          selectRole(origAdminRole as any);
                          routerNavigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                        }
                      }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                        <ChevronLeft size={14} color={C.muted} /> My Portal
                      </button>
                    ) : (
                      <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                        <ChevronLeft size={14} color={C.muted} /> Switch Portal
                      </button>
                    )}
                    <button onClick={() => { setShowProfile(false); handleLogout(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: "#C0392B", textAlign: "left" as const }}>
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
                  {React.cloneElement(tab.icon as React.ReactElement<any>, { color: isActive ? C.burg : C.muted })}
                  <span style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: isActive ? 600 : 500, color: isActive ? C.burg : C.muted, transition: "color 0.2s" }}>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} role="shop" />
        )}
      </AnimatePresence>
    </div>
    </ShopPriceContext.Provider>
  );
}

export function UserProfileModal({ onClose, role }: { onClose: () => void; role: "admin" | "superadmin" | "shop" | "weaver" }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: "100%", maxWidth: 440, background: "#FFFDF9", borderRadius: 24, overflow: "hidden", border: `1px solid rgba(139,26,46,0.12)`, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #4A061B 0%, #6B1A2A 100%)", padding: "32px 24px 28px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.12)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#FFF" />
          </button>

          <div style={{ width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 700, color: "#FFF" }}>
              {role === "admin" ? "AD" : role === "superadmin" ? "SA" : role === "shop" ? "PS" : "RK"}
            </span>
          </div>

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>
            {role === "admin" ? "Ravi Shankar" : role === "superadmin" ? "Venkata Leeladhar Abburi" : role === "shop" ? "Priya Sharma" : "Ravi Kumar"}
          </div>

          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {role === "admin" ? "ADM-001" : role === "superadmin" ? "SADM-001" : role === "shop" ? "SS-001" : "WV-001 / WVR-014"}
          </div>

          <div style={{ marginTop: 8, display: "inline-block", background: "rgba(196,146,58,0.22)", border: "1px solid rgba(196,146,58,0.40)", borderRadius: 999, padding: "4px 14px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#C4923A" }}>
              {role === "admin" ? "Store Administrator" : role === "superadmin" ? "Super Administrator" : role === "shop" ? "Showroom Sales Staff" : "Master Handloom Weaver"}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div style={{ padding: "24px 24px" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: "#8B7060", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Contact & Work Details</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Email Address", value: role === "admin" ? "admin@beerekesava.com" : role === "superadmin" ? "leeladhar@beerekesava.com" : role === "shop" ? "priya.sharma@beerekesava.com" : "ravikumar.wvr@gmail.com" },
              { label: "Phone Number", value: role === "admin" ? "+91 94405 88991" : role === "superadmin" ? "+91 98480 22338" : role === "shop" ? "+91 99088 12345" : "+91 99088 77665" },
              { label: "Factory/Office", value: role === "shop" ? "Dharmavaram Main Showroom, AP" : "Dharmavaram Factory Outlet, AP" },
              { label: "Joined Date", value: role === "admin" ? "January 2019" : role === "superadmin" ? "June 2012" : role === "shop" ? "October 2022" : "March 2018" },
              ...(role === "weaver" ? [{ label: "Loom Assignment", value: "Loom 2 & Loom 5 (Active)" }] : [])
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(139,26,46,0.06)", paddingBottom: 10 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#8B7060" }}>{item.label}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1A0A0F", textAlign: "right" as const }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" as const }}>
            <button onClick={onClose} style={{ background: "#6B1A2A", color: "#FFF", border: "none", borderRadius: 999, padding: "10px 24px", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(107,26,42,0.2)" }}>
              Close Profile
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

