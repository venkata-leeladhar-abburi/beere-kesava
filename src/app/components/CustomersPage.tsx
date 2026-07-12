import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Search, ChevronDown, Download, Eye, Edit, Plus, UserPlus,
  LayoutGrid, AlignJustify, Table as TableIcon, MapPin,
  Phone, Calendar, Star, IndianRupee, X, Mail, Globe,
  Map, MoreHorizontal, ArrowUpRight, Building2, Users, AlertTriangle,
  ShoppingBag, Check
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { imgShowroom } from "../constants/weaverImages";
import { useBulkOrders } from "./BulkOrderContext";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  greenMid:      "#2D9158",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Animation Components ───────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────
const top10Customers = [
  { name: "Lakshmi Silks", spend: 1240000 },
  { name: "Narayana Silk", spend: 980000 },
  { name: "Padmavathi Tex", spend: 860000 },
  { name: "Vijaya Silk House", spend: 720000 },
  { name: "Meenakshi Silks", spend: 640000 },
  { name: "Kalavathi Exports", spend: 580000 },
  { name: "Sri Venkateshwara", spend: 420000 },
  { name: "Annapurna Textiles", spend: 360000 },
  { name: "Smt. Annapurna (R)", spend: 184000 },
  { name: "Smt. Lakshmi (R)", spend: 162000 },
];

const revenueSplit = [
  { name: "Wholesale", value: 2840000, fill: T.royalBurgundy },
  { name: "Retail", value: 420000, fill: T.antiqueGold },
];

const newVsReturning = [
  { month: "Dec", new: 12, returning: 45 },
  { month: "Jan", new: 15, returning: 48 },
  { month: "Feb", new: 10, returning: 52 },
  { month: "Mar", new: 18, returning: 55 },
  { month: "Apr", new: 14, returning: 60 },
  { month: "May", new: 22, returning: 65 },
];

const frequentBuyers = [
  { name: "Lakshmi Silks", count: 22, freq: "Avg 2 per month" },
  { name: "Smt. Annapurna", count: 18, freq: "Avg 1.5 per month" },
  { name: "Narayana Silk", count: 16, freq: "Avg 1.3 per month" },
  { name: "Padmavathi Tex", count: 14, freq: "Avg 1.2 per month" },
  { name: "Smt. Lakshmi Bai", count: 12, freq: "Avg 1 per month" },
];

const inactiveAlerts = [
  { name: "Srinivasa Silks", type: "Wholesale", time: "8 months ago" },
  { name: "Kalavathi Exports", type: "Wholesale", time: "7 months ago" },
  { name: "Smt. Rajeshwari", type: "Retail", time: "6 months ago" },
  { name: "Bhavani Silk House", type: "Wholesale", time: "9 months ago" },
  { name: "Sri Ram Textiles", type: "Wholesale", time: "11 months ago" },
];

const wholesaleData = [
  { id: "WHL-001", name: "Lakshmi Silks", code: "LS", city: "Hyderabad, TG", status: "clear", orders: 22, spend: "12,40,000", out: "0", terms: "30 days", lastOrder: "28 Apr 2026", activeOrder: "ORD-2026-041", duesMsg: "✓ All Payments Clear" },
  { id: "WHL-002", name: "Narayana Silk Emporium", code: "NS", city: "Vijayawada, AP", status: "overdue", orders: 16, spend: "9,80,000", out: "3,50,000", terms: "30 days", lastOrder: "12 Apr 2026", activeOrder: "ORD-2026-032", duesMsg: "🔴 Overdue — ₹3,50,000 unpaid since 12 May 2026", paymentAlertDays: 47 },
  { id: "WHL-003", name: "Padmavathi Textiles", code: "PT", city: "Guntur, AP", status: "overdue", orders: 14, spend: "8,60,000", out: "2,20,000", terms: "30 days", lastOrder: "20 Apr 2026", activeOrder: null, duesMsg: "🔴 Overdue — ₹2,20,000 unpaid since 20 May 2026" },
  { id: "WHL-004", name: "Vijaya Silk House", code: "VS", city: "Chennai, TN", status: "clear", orders: 18, spend: "7,20,000", out: "0", terms: "45 days", lastOrder: "15 Apr 2026", activeOrder: null, duesMsg: "✓ All Payments Clear" },
  { id: "WHL-005", name: "Meenakshi Silks", code: "MS", city: "Coimbatore, TN", status: "due", orders: 12, spend: "6,40,000", out: "1,80,000", terms: "60 days", lastOrder: "05 Apr 2026", activeOrder: null, duesMsg: "◐ ₹1,80,000 due by 04 Jun 2026" },
  { id: "WHL-006", name: "Kalavathi Exports", code: "KE", city: "Bengaluru, KA", status: "overdue", orders: 10, spend: "5,80,000", out: "1,80,000", terms: "45 days", lastOrder: "02 Apr 2026", activeOrder: null, duesMsg: "🔴 Overdue — ₹1,80,000 unpaid since 17 May 2026" },
  { id: "WHL-007", name: "Srinivasa Silks", code: "SS", city: "Kurnool, AP", status: "inactive", orders: 8, spend: "4,20,000", out: "0", terms: "30 days", lastOrder: "8 months ago", activeOrder: null, duesMsg: "✓ All Payments Clear — Inactive" },
  { id: "WHL-008", name: "Annapurna Textiles", code: "AT", city: "Nellore, AP", status: "due", orders: 9, spend: "3,60,000", out: "2,20,000", terms: "90 days", lastOrder: "20 Mar 2026", activeOrder: null, duesMsg: "○ ₹2,20,000 due by 18 Jun 2026 — within terms" },
];

const retailData = [
  { name: "Smt. Annapurna Devi", initials: "AD", phone: "+91 ×××× 7823", city: "Hyderabad, TG", purchases: 18, spend: "1,84,000", lastVisit: "15 May 2026", regular: true, inactive: false },
  { name: "Smt. Lakshmi Bai", initials: "LB", phone: "+91 ×××× 3412", city: "Vijayawada, AP", purchases: 12, spend: "1,62,000", lastVisit: "10 May 2026", regular: true, inactive: false },
  { name: "Smt. Padmavathi", initials: "SP", phone: "+91 ×××× 9981", city: "Guntur, AP", purchases: 4, spend: "48,000", lastVisit: "02 May 2026", regular: false, inactive: false },
  { name: "Sri Ramesh K.", initials: "RK", phone: "+91 ×××× 4421", city: "Nellore, AP", purchases: 1, spend: "12,500", lastVisit: "20 May 2026", regular: false, inactive: false },
  { name: "Smt. Saraswathi", initials: "SS", phone: "+91 ×××× 6634", city: "Hyderabad, TG", purchases: 7, spend: "84,000", lastVisit: "05 May 2026", regular: true, inactive: false },
  { name: "Smt. Rajeshwari", initials: "SR", phone: "+91 ×××× 2218", city: "Chennai, TN", purchases: 2, spend: "28,000", lastVisit: "6 months ago", regular: false, inactive: true },
];

const inactiveData = [
  { name: "Srinivasa Silks", type: "Wholesale", city: "Kurnool, AP", last: "8 months ago", spend: "4,20,000" },
  { name: "Kalavathi Exports", type: "Wholesale", city: "Bengaluru, KA", last: "7 months ago", spend: "5,80,000" },
  { name: "Bhavani Silk House", type: "Wholesale", city: "Vijayawada, AP", last: "9 months ago", spend: "3,40,000" },
  { name: "Sri Ram Textiles", type: "Wholesale", city: "Nellore, AP", last: "11 months ago", spend: "2,80,000" },
  { name: "Smt. Rajeshwari", type: "Retail", city: "Chennai, TN", last: "6 months ago", spend: "28,000" },
  { name: "Smt. Kamakshi", type: "Retail", city: "Tirupati, AP", last: "7 months ago", spend: "16,500" },
  { name: "Dharani Silks", type: "Wholesale", city: "Guntur, AP", last: "8 months ago", spend: "1,90,000" },
  { name: "Smt. Meenakshi", type: "Retail", city: "Hyderabad, TG", last: "6 months ago", spend: "42,000" },
  { name: "Pavithra Textiles", type: "Wholesale", city: "Coimbatore, TN", last: "10 months ago", spend: "2,20,000" },
  { name: "Smt. Bharati", type: "Retail", city: "Vijayawada, AP", last: "9 months ago", spend: "8,500" },
];

// ── Components ─────────────────────────────────────────────────────────────────

function Pill({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: "6px 16px", borderRadius: 20, cursor: "pointer",
        background: active ? T.royalBurgundy : "transparent",
        border: `1px solid ${active ? T.royalBurgundy : T.borderDef}`,
        color: active ? "#FFF" : T.taupe,
        fontFamily: F.ui, fontSize: 13, fontWeight: 500,
        transition: "all 0.2s ease"
      }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub, action, onAction }: { title: string, sub: string, action: string, onAction?: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 3, background: T.antiqueGold, borderRadius: 2 }} />
        <div>
          <h2 style={{ fontFamily: F.display, fontSize: 28, color: T.luxuryBrown, margin: "0 0 6px 0", fontWeight: 600 }}>{title}</h2>
          <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0, maxWidth: 600, lineHeight: 1.5 }}>{sub}</p>
        </div>
      </div>
      <button 
        onClick={onAction}
        style={{ 
          background: "transparent", border: "none", color: T.antiqueGold, 
          fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}>
        {action}
      </button>
    </div>
  );
}

function CardStat({ label, value, valueColor = T.luxuryBrown, isMono = false, isSmall = false }: { label: string, value: React.ReactNode, valueColor?: string, isMono?: boolean, isSmall?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 2 }}>{label}</div>
      <div style={{ 
        fontFamily: isMono ? F.mono : F.display, 
        fontSize: isSmall ? 16 : 18, 
        fontWeight: 600, 
        color: valueColor, 
        marginTop: isMono ? 4 : 0 
      }}>{value}</div>
    </div>
  );
}

function downloadCustomerCSV(customerName: string, fields: [string, string | undefined][]) {
  const rows = fields.filter(([, value]) => !!value) as [string, string][];
  const csvString = rows.map(([label, value]) => `"${label}","${String(value).replace(/"/g, '""')}"`).join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${customerName}_data.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CardActionButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "transparent", border: "none", color, fontFamily: F.ui, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
      <Icon size={14} /> {label}
    </button>
  );
}

export function CustomersPage() {
  const [wholesaleView, setWholesaleView] = useState<"card"|"list"|"table">("card");
  const [retailView, setRetailView] = useState<"card"|"list"|"table">("card");
  const [showAddWholesale, setShowAddWholesale] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("bk_open_add_wholesale") === "true") {
      localStorage.removeItem("bk_open_add_wholesale");
      setShowAddWholesale(true);
      setTimeout(() => {
        const sect = document.getElementById("customers-wholesale-section");
        if (sect) {
          sect.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);
  const [modalWholesale, setModalWholesale] = useState<any>(null);
  const [modalRetail, setModalRetail] = useState<any>(null);
  const [viewingCard, setViewingCard] = useState<string | null>(null);
  const { bulkOrders } = useBulkOrders();
  const [retailTab, setRetailTab] = useState<"inventory"|"external">("inventory");
  const [showExtDrawer, setShowExtDrawer] = useState(false);
  const [extForm, setExtForm] = useState({
    supplier: "", serial: "", source: "Wholesale Supplier",
    location: "", date: new Date().toISOString().slice(0,10),
    quantity: 1, pricePerSaree: "", paymentStatus: "Paid",
    invoice: "", notes: "",
  });
  const [extPurchases, setExtPurchases] = useState([
    { serial: "EXT-2026-0001", supplier: "Ravi Silks", source: "Local Weaver", date: "01 Jun 2026", qty: 4, price: "8,500", total: "34,000", status: "Paid" },
    { serial: "EXT-2026-0002", supplier: "Mysore Sarees", source: "Wholesale Supplier", date: "05 Jun 2026", qty: 12, price: "6,200", total: "74,400", status: "Pending" },
    { serial: "EXT-2026-0003", supplier: "Chennai Silks", source: "Auction Purchase", date: "08 Jun 2026", qty: 6, price: "11,000", total: "66,000", status: "Partial" },
  ]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const headerBgImage = imgShowroom;

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", paddingBottom: 100 }}>
      {/* ── SECTION 1: PAGE HEADER ────────────────────────────────────────── */}
      <div style={{
        minHeight: 230, background: T.darkBurgundy, display: "flex", position: "relative", overflow: "hidden"
      }}>
        {/* Decorative gold rings */}
        <div style={{ position: "absolute", right: -80, top: -100, width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", right: 40, top: -30, width: 360, height: 360, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.07)", pointerEvents: "none", zIndex: 1 }} />

        {/* Background photo */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: "45%",
          background: `url(${headerBgImage}) center/cover no-repeat`,
          opacity: 0.18, maskImage: "linear-gradient(to right, transparent, black)",
          zIndex: 1
        }} />

        {/* Grid line overlay */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(200,155,71,0.022) 48px, rgba(200,155,71,0.022) 49px)` }} />

        <div style={{ padding: "44px 56px 90px", display: "flex", width: "100%", alignItems: "flex-start", zIndex: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, rgba(200,155,71,0))` }} />
              <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "2.5px", color: "rgba(200,155,71,0.82)", textTransform: "uppercase" as const, fontWeight: 600 }}>
                Since 1999 · Customer Management
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
              <h1 style={{ fontFamily: F.display, fontSize: 52, color: "#FFFDF9", margin: 0, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.0 }}>Customers</h1>
              <span style={{ fontFamily: F.display, fontSize: 30, color: T.antiqueGold, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.3px" }}>& Relationship Overview</span>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.60)", margin: "6px 0 0 0", maxWidth: 580, lineHeight: 1.65 }}>
              Manage all wholesale business customers and view retail customer profiles. Track purchase history, outstanding payments, and order records for every customer.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: CUSTOMER STATS STRIP ─────────────────────────────── */}
      <div style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}>
        <div style={{
          background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
          borderRadius: 24,
          display: "flex",
          alignItems: "stretch",
          boxShadow: "0 24px 72px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
          overflow: "hidden",
          minHeight: 140,
        }}>
          {[
            { ico: <Building2 size={22} color="rgba(245,232,208,0.90)" />, label: "Wholesale Customers", val: "48", sub: "Active business relationships", hi: false },
            { ico: <Users size={22} color="rgba(245,232,208,0.90)" />, label: "Retail Customers", val: "1,284", sub: "Profiles at point of sale", hi: false },
            { ico: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />, label: "Total Revenue", val: "₹32.6L", sub: "This month · ↑ 18% vs last", hi: true },
            { ico: <AlertTriangle size={22} color="rgba(245,232,208,0.90)" />, label: "Customers with Dues", val: "14", sub: "Total dues: ₹9,80,000", hi: false },
            { ico: <UserPlus size={22} color="rgba(245,232,208,0.90)" />, label: "New This Month", val: "12", sub: "8 retail · 4 wholesale", hi: false },
          ].map((m, i, arr) => (
            <div key={m.label} style={{
              flex: 1,
              padding: "26px 20px",
              backgroundImage: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < arr.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 14,
              position: "relative" as const,
              cursor: "pointer",
            }}>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.ico}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 7, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 6 }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: CUSTOMER ANALYTICS ─────────────────────────────────── */}
      <div style={{ padding: "96px 56px 48px" }}>
        <SectionTitle
          title="Customer Analytics"
          sub="Overview of customer behaviour — who spends the most, who buys most frequently, who has not bought recently, and where your customers are from."
          action="Download Analytics Report →"
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {["This Month", "Last 3 Months", "Last 6 Months", "This Year", "All Time"].map((p, i) => (
            <Pill key={i} active={i === 0}>{p}</Pill>
          ))}
        </div>

        {/* Charts Row 1 — equal 3 columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 22, alignItems: "stretch" }}>

          {/* Chart 1: Top Customers */}
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Star size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Top 10 Customers by Purchase Value</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Wholesale and retail combined</p>
              </div>
            </div>
            {/* Summary strip */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[
                { label: "Top Spender", val: "₹12.4L", color: T.royalBurgundy },
                { label: "Combined Value", val: "₹79.5L", color: T.antiqueGold },
                { label: "Wholesale", val: "8 of 10", color: T.greenMid },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500, letterSpacing: "0.4px", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* Custom ranked bar rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              {top10Customers.map((c, i) => {
                const maxSpend = top10Customers[0].spend;
                const pct = Math.round((c.spend / maxSpend) * 100);
                const isTop = i === 0;
                const barBg = i === 0 ? `linear-gradient(90deg, ${T.royalBurgundy}, #A01535)` : i === 1 ? `linear-gradient(90deg, ${T.antiqueGold}, #E7C983)` : i === 2 ? `linear-gradient(90deg, ${T.greenMid}, #3BA86A)` : `linear-gradient(90deg, rgba(200,155,71,0.40), rgba(200,155,71,0.20))`;
                const rankBg = i === 0 ? T.royalBurgundy : i === 1 ? "rgba(200,155,71,0.22)" : i === 2 ? T.greenBg : T.silkCream;
                const rankColor = i === 0 ? "#FFF" : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : T.taupe;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: isTop ? "8px 10px" : "4px 6px", borderRadius: 8, background: isTop ? "rgba(110,15,45,0.04)" : "transparent", border: isTop ? `1px solid rgba(110,15,45,0.08)` : "1px solid transparent" }}>
                    <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: "50%", background: rankBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                    </div>
                    <div style={{ width: 96, minWidth: 96, fontFamily: F.ui, fontSize: 12.5, fontWeight: i < 3 ? 700 : 500, color: i < 3 ? T.luxuryBrown : T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.name}
                    </div>
                    <div style={{ flex: 1, height: 7, background: T.silkCream, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", backgroundImage: barBg, borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 44, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: i < 3 ? T.luxuryBrown : T.taupe }}>
                      {c.spend >= 100000 ? `${(c.spend / 100000).toFixed(1)}L` : `${Math.round(c.spend / 1000)}K`}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, textAlign: "right" }}>
              <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>View Full List →</span>
            </div>
          </div>

          {/* Chart 2: Revenue Split */}
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(110,15,45,0.08)" }}>
                <IndianRupee size={24} color={T.royalBurgundy} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Wholesale vs Retail Revenue Split</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Revenue from each sales channel</p>
              </div>
            </div>
            <div style={{ flex: 1, position: "relative", minHeight: 240 }}>
              <ResponsiveContainer key="rc-2" width="100%" height="100%">
                <PieChart key="pie-chart" id="revenue-pie-chart">
                  <Pie key="revenue-pie" id="revenue-pie" data={revenueSplit} innerRadius={75} outerRadius={108} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                    {revenueSplit.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.luxuryBrown }}>₹32.6L</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>Total Revenue</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 18 }}>
              {revenueSplit.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.fill }} />
                  <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 500 }}>{item.name}: {(item.value/100000).toFixed(1)}L</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: New vs Returning */}
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(30,102,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(30,102,64,0.10)" }}>
                <Users size={24} color={T.greenMid} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>New vs Returning Customers</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Last 6 months trend</p>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 280 }}>
              <ResponsiveContainer key="rc-3" width="100%" height="100%">
                <BarChart key="bar-chart-new" id="new-vs-returning-chart" data={newVsReturning} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke={T.borderDef} />
                  <XAxis key="x-axis-2" id="x-axis-2" dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 13, fill: T.taupe }} dy={10} />
                  <YAxis key="y-axis-2" id="y-axis-2" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 13, fill: T.taupe }} />
                  <RechartsTooltip key="tooltip-2" cursor={{fill: 'rgba(110,15,45,0.04)'}} contentStyle={{fontFamily: F.ui, fontSize: 13, borderRadius: 8, border: `1px solid ${T.borderDef}`}} />
                  <Legend key="legend" iconType="circle" wrapperStyle={{ fontFamily: F.ui, fontSize: 13 }} />
                  <Bar key="bar-new" id="bar-new" dataKey="new" name="New" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} barSize={14} />
                  <Bar key="bar-returning" id="bar-returning" dataKey="returning" name="Returning" fill={T.antiqueGold} radius={[5, 5, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 — equal 2 columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 22, alignItems: "stretch" }}>

          {/* Chart 4: Frequent Buyers */}
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Calendar size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customers Who Buy Most Often</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>By number of purchases — all time</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
              {frequentBuyers.map((fb, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: "50%", background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i+1}</span>
                  </div>
                  <div style={{ flex: 1, fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>{fb.name}</div>
                  <div style={{ flex: 2 }}>
                    <div style={{ height: 10, background: "rgba(200,155,71,0.13)", borderRadius: 5 }}>
                      <div style={{ width: `${(fb.count/25)*100}%`, height: "100%", background: i === 0 ? T.royalBurgundy : T.antiqueGold, borderRadius: 5 }} />
                    </div>
                  </div>
                  <div style={{ width: 120, textAlign: "right" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{fb.count} orders</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 2 }}>{fb.freq}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 5: Inactive Customers */}
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(192,57,43,0.10)" }}>
                <AlertTriangle size={24} color={T.crimson} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customers Who Have Not Bought Recently</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>No purchase in 6 months — consider reaching out</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              {inactiveAlerts.map((al, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, boxShadow: "0 1px 4px rgba(74,6,27,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, color: T.royalBurgundy, fontWeight: 700 }}>
                      {al.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{al.name}</span>
                        <span style={{ padding: "2px 8px", background: al.type === "Wholesale" ? T.crimsonBg : T.greenBg, color: al.type === "Wholesale" ? T.crimson : T.greenMid, fontSize: 11, borderRadius: 5, fontWeight: 600, fontFamily: F.ui }}>{al.type}</span>
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Last purchase: {al.time}</div>
                    </div>
                  </div>
                  <button style={{ background: "transparent", border: `1px solid ${T.borderGold}`, borderRadius: 7, color: T.antiqueGold, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "7px 16px" }}>Reach Out</button>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>Mark as Inactive →</span>
            </div>
          </div>
        </div>

        {/* Charts Row 3 — Geographic */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px 36px", display: "flex", gap: 48, boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 26 }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(45,145,88,0.09)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(30,102,64,0.10)" }}>
                <MapPin size={24} color={T.greenMid} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customer Locations — State-wise Distribution</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Which states your wholesale and retail customers are from</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { state: "Andhra Pradesh", count: 18, pct: 37, size: 24, color: T.royalBurgundy },
                { state: "Telangana",      count: 14, pct: 29, size: 20, color: T.antiqueGold  },
                { state: "Tamil Nadu",     count: 8,  pct: 17, size: 16, color: T.taupe        },
                { state: "Karnataka",      count: 5,  pct: 10, size: 12, color: T.greenMid     },
                { state: "Others",         count: 3,  pct: 6,  size: 8,  color: "#999"         },
              ].map((loc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: loc.size, height: loc.size, borderRadius: "50%", background: loc.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{loc.state}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>{loc.count} customers</div>
                  </div>
                  <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, minWidth: 52, textAlign: "right" }}>{loc.pct}%</div>
                  <div style={{ width: 130, height: 8, background: T.silkCream, borderRadius: 4 }}>
                    <div style={{ width: `${loc.pct}%`, height: "100%", background: loc.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>

            <button style={{
              marginTop: 32, padding: "11px 22px", borderRadius: 9, border: `1px solid ${T.antiqueGold}`,
              background: "transparent", color: T.antiqueGold, fontFamily: F.ui, fontSize: 14, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 9, cursor: "pointer"
            }}>
              <Download size={16} /> Download Customer List with Locations
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "28px 24px", minHeight: 300 }}>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>State-wise Share</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 20 }}>48 customers across 5 states</div>
            <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Andhra Pradesh", value: 37, fill: T.royalBurgundy },
                      { name: "Telangana",      value: 29, fill: T.antiqueGold },
                      { name: "Tamil Nadu",     value: 17, fill: T.taupe },
                      { name: "Karnataka",      value: 10, fill: T.greenMid },
                      { name: "Others",         value: 7,  fill: "#C9BAB0" },
                    ]}
                    innerRadius={62}
                    outerRadius={94}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {[T.royalBurgundy, T.antiqueGold, T.taupe, T.greenMid, "#C9BAB0"].map((color, i) => (
                      <Cell key={`geo-cell-${i}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.luxuryBrown }}>5</span>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>States</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px 18px", marginTop: 22, justifyContent: "center" }}>
              {[
                { name: "Andhra Pradesh", pct: 37, color: T.royalBurgundy },
                { name: "Telangana",      pct: 29, color: T.antiqueGold },
                { name: "Tamil Nadu",     pct: 17, color: T.taupe },
                { name: "Karnataka",      pct: 10, color: T.greenMid },
                { name: "Others",         pct: 7,  color: "#C9BAB0" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, fontWeight: 600 }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: WHOLESALE CUSTOMERS ────────────────────────────────── */}
      <div id="customers-wholesale-section" style={{ padding: "0 56px 64px 56px" }}>
        <SectionTitle
          title="Wholesale Customers"
          sub="These are the businesses that buy sarees in bulk. Manage their profiles, track their orders, and monitor outstanding payments."
          action=""
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -60, marginBottom: 24 }}>
          <button
            onClick={() => setShowAddWholesale(!showAddWholesale)}
            style={{ padding: "13px 26px", background: T.royalBurgundy, color: "#FFF", borderRadius: 9, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 4px 14px rgba(110,15,45,0.25)" }}>
            <Plus size={18} /> Add New Wholesale Customer →
          </button>
        </div>

        {showAddWholesale && (
          <FadeUp>
            <div style={{ background: "#FFF", borderRadius: 16, padding: 32, border: `1px solid ${T.borderDef}`, marginBottom: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontFamily: F.display, fontSize: 22, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Wholesale Customer</h3>
                  <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
                </div>
                <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: F.mono, fontSize: 11, color: T.taupe }}>WHL-049 will be assigned</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Business Name *</label><input type="text" placeholder="Name of the business or shop" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                  <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Owner / Contact Name *</label><input type="text" placeholder="Who to speak to at this business" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Phone Number *</label><input type="text" placeholder="Main contact number" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                    <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>WhatsApp Number</label><input type="text" placeholder="If different" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>City *</label><input type="text" placeholder="City" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                    <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>State *</label><select style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14, backgroundColor: "#FFF" }}><option>Andhra Pradesh</option><option>Telangana</option><option>Tamil Nadu</option><option>Karnataka</option></select></div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Business Address</label><textarea placeholder="Full address for delivery and billing" rows={2} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                  <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Payment Terms *</label><select style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14, backgroundColor: "#FFF" }}><option>30 days</option><option>45 days</option><option>60 days</option><option>90 days</option><option>Custom</option></select></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Bank Name</label><input type="text" placeholder="For any refunds" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                    <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Account Number</label><input type="password" placeholder="Account No." style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                  </div>
                  <div><label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Notes</label><input type="text" placeholder="Any special instructions..." style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} /></div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.borderDef}` }}>
                <button onClick={() => setShowAddWholesale(false)} style={{ padding: "10px 24px", background: "transparent", color: T.taupe, borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => setShowAddWholesale(false)} style={{ padding: "10px 32px", background: T.royalBurgundy, color: "#FFF", borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✓ Save Customer</button>
              </div>
            </div>
          </FadeUp>
        )}

        {/* Wholesale stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28, alignItems: "stretch" }}>
          {[
            { ico: <Building2 size={24} color={T.royalBurgundy} />, bg: "rgba(110,15,45,0.07)", l: "Total Wholesale Customers", v: "48", c: T.luxuryBrown, sub: "Active business relationships" },
            { ico: <AlertTriangle size={24} color={T.crimson} />, bg: T.crimsonBg, l: "Total Outstanding", v: "₹9,80,000", c: T.crimson, sub: "Across all overdue accounts" },
            { ico: <Eye size={24} color={T.antiqueGold} />, bg: "rgba(200,155,71,0.09)", l: "Active Orders Right Now", v: "6", c: T.antiqueGold, sub: "Bulk orders in production" },
            { ico: <Users size={24} color={T.taupe} />, bg: "rgba(139,112,96,0.08)", l: "Inactive Customers", v: "5", c: T.taupe, sub: "No order in 6+ months" },
          ].map((st, i) => (
            <div key={i} style={{ background: "#FFF", padding: "22px 22px 20px", borderRadius: 14, border: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {st.ico}
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>{st.l}</div>
                <div style={{ fontFamily: F.display, fontSize: 32, color: st.c, fontWeight: 700, lineHeight: 1.0 }}>{st.v}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>{st.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "9px 16px", width: 300 }}>
              <Search size={16} color={T.taupe} />
              <input type="text" placeholder="Search by business name, city..." style={{ border: "none", outline: "none", width: "100%", marginLeft: 8, fontFamily: F.ui, fontSize: 14 }} />
            </div>
            <Pill active={true}>All Wholesale (48)</Pill>
            <Pill active={false}>Active (28)</Pill>
            <Pill active={false}>Has Dues (14)</Pill>
            <Pill active={false}>Inactive (5)</Pill>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 4 }}>Sort By: Outstanding <ChevronDown size={14} /></span>
            <div style={{ display: "flex", background: "#FFF", borderRadius: 8, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <button onClick={() => setWholesaleView("card")} style={{ padding: "9px 13px", background: wholesaleView === "card" ? T.silkCream : "transparent", border: "none", cursor: "pointer" }}><LayoutGrid size={18} color={wholesaleView === "card" ? T.royalBurgundy : T.taupe} /></button>
              <button onClick={() => setWholesaleView("list")} style={{ padding: "9px 13px", background: wholesaleView === "list" ? T.silkCream : "transparent", border: "none", borderLeft: `1px solid ${T.borderDef}`, cursor: "pointer" }}><AlignJustify size={18} color={wholesaleView === "list" ? T.royalBurgundy : T.taupe} /></button>
              <button onClick={() => setWholesaleView("table")} style={{ padding: "9px 13px", background: wholesaleView === "table" ? T.silkCream : "transparent", border: "none", borderLeft: `1px solid ${T.borderDef}`, cursor: "pointer" }}><TableIcon size={18} color={wholesaleView === "table" ? T.royalBurgundy : T.taupe} /></button>
            </div>
            <button style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${T.antiqueGold}`, background: "transparent", color: T.antiqueGold, fontFamily: F.ui, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}><Download size={14} /> Download</button>
          </div>
        </div>

        {/* Wholesale Cards View */}
        {wholesaleView === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
            {wholesaleData.map((w, i) => {
              const statusColor = w.status === "clear" ? T.greenMid : w.status === "overdue" ? T.crimson : w.status === "inactive" ? T.taupe : T.antiqueGold;
              const contact = bulkOrders.find(o => o.customerId === w.id && (o.address || o.phone || o.gstCode || o.visitingCardUrl));
              return (
                <div key={i} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, borderTop: `4px solid ${statusColor}`, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "22px 22px 0", flex: 1 }}>
                    {/* Header: avatar + name */}
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: T.royalBurgundy, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                        {w.code}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 7px 0", lineHeight: 1.2 }}>{w.name}</h4>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
                          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "3px 8px", borderRadius: 5 }}>{w.id}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{w.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status banner */}
                    <div style={{
                      padding: "10px 14px", borderRadius: 8, marginBottom: (w as any).paymentAlertDays > 45 ? 8 : 18, fontFamily: F.ui, fontSize: 13, fontWeight: 600, lineHeight: 1.4,
                      background: w.status === "clear" || w.status === "inactive" ? T.greenBg : w.status === "overdue" ? T.crimsonBg : "rgba(200,155,71,0.10)",
                      color: w.status === "clear" || w.status === "inactive" ? T.greenMid : w.status === "overdue" ? T.crimson : T.antiqueGold,
                    }}>
                      {w.duesMsg}
                    </div>
                    {(w as any).paymentAlertDays > 45 && (
                      <div style={{ marginBottom: 18 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.crimson, background: "rgba(192,57,43,0.10)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 999, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          ⚠ Payment Alert — Day {(w as any).paymentAlertDays}
                        </span>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                      {[
                        { label: "Total Orders", value: String(w.orders), color: T.luxuryBrown, mono: false },
                        { label: "Total Spend", value: `₹${w.spend}`, color: T.antiqueGold, mono: false },
                        { label: "Outstanding", value: `₹${w.out}`, color: w.out === "0" ? T.greenMid : T.crimson, mono: false },
                        { label: "Payment Terms", value: w.terms, color: T.luxuryBrown, mono: true },
                      ].map((s, si) => (
                        <div key={si}>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontFamily: s.mono ? F.mono : F.display, fontSize: 19, fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Contact details from bulk order (address, phone, GST, visiting card) */}
                    {contact && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16, paddingTop: 14, borderTop: `1px solid ${T.borderDef}` }}>
                        {contact.address && (
                          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, display: "flex", alignItems: "flex-start", gap: 7 }}>
                            <MapPin size={13} color={T.taupe} style={{ marginTop: 1, flexShrink: 0 }} /> {contact.address}
                          </div>
                        )}
                        {contact.phone && (
                          <div style={{ fontFamily: F.mono, fontSize: 12.5, color: T.taupe, display: "flex", alignItems: "center", gap: 7 }}>
                            <Phone size={13} color={T.taupe} /> {contact.phone}
                          </div>
                        )}
                        {contact.gstCode && (
                          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, display: "flex", alignItems: "center", gap: 7 }}>
                            GST: {contact.gstCode}
                          </div>
                        )}
                        {contact.visitingCardUrl && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img
                              src={contact.visitingCardUrl}
                              alt="Visiting card"
                              onClick={() => setViewingCard(contact.visitingCardUrl!)}
                              style={{ width: 42, height: 28, objectFit: "cover", borderRadius: 4, border: `1px solid ${T.borderDef}`, cursor: "pointer" }}
                            />
                            <span onClick={() => setViewingCard(contact.visitingCardUrl!)} style={{ fontFamily: F.ui, fontSize: 12.5, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>View Card</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Superadmin-only label */}
                    <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      🔒 Bank details &amp; special terms visible to Superadmin only
                    </div>

                    {/* Last order + active order */}
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6, marginBottom: w.activeOrder ? 10 : 22 }}>
                      <Calendar size={14} color={T.taupe} /> Last Order: {w.lastOrder}
                    </div>
                    {w.activeOrder ? (
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, background: T.goldLight, padding: "7px 12px", borderRadius: 7, display: "inline-block", marginBottom: 22 }}>
                        🔄 Active: {w.activeOrder}
                      </div>
                    ) : (
                      <div style={{ height: 37 }} />
                    )}
                  </div>

                  {/* Footer actions */}
                  <div style={{ background: T.silkCream, borderTop: `1px solid ${T.borderDef}`, padding: "12px 22px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "View",   icon: <Eye size={13} />,      color: T.royalBurgundy, onClick: () => setModalWholesale(w) },
                      { label: "Edit",   icon: <Edit size={13} />,     color: T.royalBurgundy, onClick: undefined },
                      { label: "Report", icon: <Download size={13} />, color: T.royalBurgundy, onClick: undefined },
                      { label: "Download Data", icon: <Download size={13} />, color: T.royalBurgundy, onClick: () => downloadCustomerCSV(w.name, [
                        ["Customer ID", w.id],
                        ["Business Name", w.name],
                        ["City", w.city],
                        ["Status", w.status],
                        ["Total Orders", String(w.orders)],
                        ["Total Spend", w.spend],
                        ["Outstanding", w.out],
                        ["Payment Terms", w.terms],
                        ["Last Order", w.lastOrder],
                        ["Active Order", w.activeOrder || undefined],
                        ["Address", contact?.address],
                        ["Phone Number", contact?.phone],
                        ["GST Code", contact?.gstCode],
                      ]) },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.onClick} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, height: 36, border: `1px solid ${T.royalBurgundy}`, background: "transparent", fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: btn.color, cursor: "pointer", borderRadius: 10 }}>
                        {btn.icon} {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Wholesale List View */}
        {wholesaleView === "list" && (
          <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 14 }}>
              <thead>
                <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                  {["Code", "Business Name", "City", "Orders", "Outstanding", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "14px 18px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wholesaleData.map((w, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "14px 18px", fontFamily: F.mono, color: T.royalBurgundy, fontSize: 13 }}>{w.id}</td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: T.luxuryBrown }}>{w.name}</td>
                    <td style={{ padding: "14px 18px", color: T.taupe }}>{w.city}</td>
                    <td style={{ padding: "14px 18px", color: T.luxuryBrown }}>{w.orders}</td>
                    <td style={{ padding: "14px 18px", color: w.out === "0" ? T.greenMid : T.crimson, fontWeight: 600 }}>₹{w.out}</td>
                    <td style={{ padding: "14px 18px" }}><span style={{ padding: "4px 10px", background: w.status === "clear" ? T.greenBg : w.status === "overdue" ? T.crimsonBg : "rgba(200,155,71,0.10)", color: w.status === "clear" ? T.greenMid : w.status === "overdue" ? T.crimson : T.antiqueGold, fontSize: 12, borderRadius: 5, fontWeight: 600 }}>{w.status.toUpperCase()}</span></td>
                    <td style={{ padding: "14px 18px" }}><button onClick={() => setModalWholesale(w)} style={{ background: "transparent", border: "none", color: T.royalBurgundy, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Wholesale Table View */}
        {wholesaleView === "table" && (
          <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 14, whiteSpace: "nowrap" as const }}>
              <thead>
                <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                  {["Code", "Business Name", "City", "Total Orders", "Total Spend", "Outstanding", "Terms", "Last Order", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "14px 18px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wholesaleData.map((w, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "14px 18px", fontFamily: F.mono, color: T.royalBurgundy, fontSize: 13 }}>{w.id}</td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: T.luxuryBrown }}>{w.name}</td>
                    <td style={{ padding: "14px 18px", color: T.taupe }}>{w.city}</td>
                    <td style={{ padding: "14px 18px", color: T.luxuryBrown }}>{w.orders}</td>
                    <td style={{ padding: "14px 18px", color: T.antiqueGold, fontWeight: 600 }}>₹{w.spend}</td>
                    <td style={{ padding: "14px 18px", color: w.out === "0" ? T.greenMid : T.crimson, fontWeight: 600 }}>₹{w.out}</td>
                    <td style={{ padding: "14px 18px", color: T.luxuryBrown }}>{w.terms}</td>
                    <td style={{ padding: "14px 18px", color: T.taupe }}>{w.lastOrder}</td>
                    <td style={{ padding: "14px 18px" }}><span style={{ padding: "4px 10px", background: w.status === "clear" ? T.greenBg : w.status === "overdue" ? T.crimsonBg : "rgba(200,155,71,0.10)", color: w.status === "clear" ? T.greenMid : w.status === "overdue" ? T.crimson : T.antiqueGold, fontSize: 12, borderRadius: 5, fontWeight: 600 }}>{w.status.toUpperCase()}</span></td>
                    <td style={{ padding: "14px 18px" }}><button onClick={() => setModalWholesale(w)} style={{ background: "transparent", border: "none", color: T.royalBurgundy, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>View Profile</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 5: RETAIL CUSTOMERS ────────────────────────────────────── */}
      <div style={{ padding: "0 56px 64px 56px" }}>
        <SectionTitle
          title="Retail Customers"
          sub="Retail customer profiles are created automatically when a sale is recorded at the shop. Admin can view all profiles and purchase history."
          action="📥 Download Retail Customer List →"
        />

        {/* Tab switcher + Add button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", background: "#FFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            {[["inventory","Stock Inventory"],["external","External Purchases"]].map(([key,label]) => (
              <button key={key} onClick={() => setRetailTab(key as any)} style={{ padding: "9px 20px", border: "none", borderRight: key === "inventory" ? `1px solid ${T.borderDef}` : "none", background: retailTab === key ? T.royalBurgundy : "transparent", color: retailTab === key ? "#FFF" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowExtDrawer(true)} style={{ display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 20px", background: T.royalBurgundy, border: "none", borderRadius: 9, color: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> Add External Purchase
          </button>
        </div>

        {/* Retail stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28, alignItems: "stretch" }}>
          {[
            { ico: <Users size={24} color={T.royalBurgundy} />, bg: "rgba(110,15,45,0.07)", l: "Total Retail Customers", v: "1,284", c: T.luxuryBrown, sub: "Profiles at point of sale" },
            { ico: <UserPlus size={24} color={T.antiqueGold} />, bg: "rgba(200,155,71,0.09)", l: "New Customers This Month", v: "8", c: T.antiqueGold, sub: "Added via new sale entries" },
            { ico: <IndianRupee size={24} color={T.greenMid} />, bg: T.greenBg, l: "Retail Revenue This Month", v: "₹4,20,000", c: T.greenMid, sub: "Total from all retail sales" },
            { ico: <AlertTriangle size={24} color={T.taupe} />, bg: "rgba(139,112,96,0.08)", l: "Inactive — No Visit in 6M", v: "3", c: T.taupe, sub: "Consider reaching out" },
          ].map((st, i) => (
            <div key={i} style={{ background: "#FFF", padding: "22px 22px 20px", borderRadius: 14, border: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {st.ico}
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>{st.l}</div>
                <div style={{ fontFamily: F.display, fontSize: 32, color: st.c, fontWeight: 700, lineHeight: 1.0 }}>{st.v}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>{st.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "9px 16px", width: 300 }}>
              <Search size={16} color={T.taupe} />
              <input type="text" placeholder="Search by customer name or phone..." style={{ border: "none", outline: "none", width: "100%", marginLeft: 8, fontFamily: F.ui, fontSize: 14 }} />
            </div>
            <Pill active={true}>All Retail (1,284)</Pill>
            <Pill active={false}>Regular Buyers</Pill>
            <Pill active={false}>New This Month</Pill>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 4 }}>Sort By: Total Spend <ChevronDown size={14} /></span>
            <div style={{ display: "flex", background: "#FFF", borderRadius: 8, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <button onClick={() => setRetailView("card")} style={{ padding: "9px 13px", background: retailView === "card" ? T.silkCream : "transparent", border: "none", cursor: "pointer" }}><LayoutGrid size={18} color={retailView === "card" ? T.royalBurgundy : T.taupe} /></button>
              <button onClick={() => setRetailView("list")} style={{ padding: "9px 13px", background: retailView === "list" ? T.silkCream : "transparent", border: "none", borderLeft: `1px solid ${T.borderDef}`, cursor: "pointer" }}><AlignJustify size={18} color={retailView === "list" ? T.royalBurgundy : T.taupe} /></button>
            </div>
          </div>
        </div>

        {/* Retail Cards View */}
        {retailView === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
            {retailData.map((r, i) => (
              <div key={i} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Top accent line */}
                <div style={{ height: 4, background: r.regular ? T.antiqueGold : r.inactive ? T.taupe : T.royalBurgundy }} />

                <div style={{ padding: "22px 22px 0", flex: 1 }}>
                  {/* Header: avatar + name + badges */}
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
                    <div style={{ width: 60, height: 60, minWidth: 60, borderRadius: "50%", background: T.warmCream, border: `2px solid ${T.borderGold}`, color: T.luxuryBrown, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                      {r.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 6px 0", lineHeight: 1.2 }}>{r.name}</h4>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                        {r.regular && (
                          <span style={{ background: T.goldLight, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 4 }}>
                            <Star size={11} fill={T.luxuryBrown} /> Regular
                          </span>
                        )}
                        {r.inactive && (
                          <span style={{ background: T.crimsonBg, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.crimson }}>Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                      <Phone size={13} color={T.taupe} />{r.phone}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                      <MapPin size={13} color={T.taupe} />{r.city}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: T.borderDef, marginBottom: 18 }} />

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 4 }}>Total Purchases</div>
                      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>{r.purchases}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 4 }}>Total Spent</div>
                      <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>₹{r.spend}</div>
                    </div>
                  </div>

                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6, marginBottom: 22 }}>
                    <Calendar size={13} color={T.taupe} /> Last visit: {r.lastVisit}
                  </div>
                </div>

                {/* Footer buttons */}
                <div style={{ padding: "0 22px 22px", display: "flex", gap: 8 }}>
                  <button onClick={() => setModalRetail(r)} style={{ flex: 1, height: 42, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 9, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 7 }}>
                    <Eye size={16} /> View Purchase History
                  </button>
                  <button
                    onClick={() => downloadCustomerCSV(r.name, [
                      ["Customer Name", r.name],
                      ["Phone", r.phone],
                      ["City", r.city],
                      ["Total Purchases", String(r.purchases)],
                      ["Total Spend", r.spend],
                      ["Last Visit", r.lastVisit],
                      ["Regular Buyer", r.regular ? "Yes" : "No"],
                      ["Inactive", r.inactive ? "Yes" : "No"],
                    ])}
                    style={{ height: 42, padding: "0 14px", background: "transparent", border: `1px solid ${T.borderGold}`, borderRadius: 9, color: T.antiqueGold, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, whiteSpace: "nowrap" as const }}
                    title="Download Data"
                  >
                    <Download size={15} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Retail List View */}
        {retailView === "list" && (
          <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 14 }}>
              <thead>
                <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                  {["Customer Name", "Phone", "City", "Total Purchases", "Total Spend", "Last Visit", "Regular Buyer", "Action"].map(h => (
                    <th key={h} style={{ padding: "14px 18px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retailData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: T.luxuryBrown }}>{r.name}</td>
                    <td style={{ padding: "14px 18px", fontFamily: F.mono, color: T.taupe, fontSize: 13 }}>{r.phone}</td>
                    <td style={{ padding: "14px 18px", color: T.taupe }}>{r.city}</td>
                    <td style={{ padding: "14px 18px", color: T.antiqueGold, fontWeight: 600 }}>{r.purchases}</td>
                    <td style={{ padding: "14px 18px", color: T.luxuryBrown, fontWeight: 600 }}>₹{r.spend}</td>
                    <td style={{ padding: "14px 18px", color: T.taupe }}>{r.lastVisit}</td>
                    <td style={{ padding: "14px 18px" }}>{r.regular ? <span style={{ background: T.goldLight, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.luxuryBrown }}>⭐ Regular</span> : "—"}</td>
                    <td style={{ padding: "14px 18px" }}><button onClick={() => setModalRetail(r)} style={{ background: "transparent", border: "none", color: T.royalBurgundy, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* External Purchases Tab */}
      {retailTab === "external" && (
        <div style={{ marginTop: 24, padding: "0 56px" }}>
          <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(74,6,27,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}` }}>
                  {["Serial Number","Supplier Name","Source Type","Purchase Date","Sarees","Price/Saree","Total","Payment Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "13px 16px", color: T.taupe, fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.5px", textAlign: "left" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {extPurchases.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy }}>{row.serial}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: T.luxuryBrown }}>{row.supplier}</td>
                    <td style={{ padding: "14px 16px", color: T.taupe }}>{row.source}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.date}</td>
                    <td style={{ padding: "14px 16px", color: T.luxuryBrown, fontWeight: 600 }}>{row.qty}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, color: T.antiqueGold, fontWeight: 600 }}>₹{row.price}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>₹{row.total}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: row.status === "Paid" ? "rgba(30,102,64,0.10)" : row.status === "Pending" ? "rgba(200,155,71,0.12)" : "rgba(192,57,43,0.09)", color: row.status === "Paid" ? T.green : row.status === "Pending" ? "#7A5E1C" : T.crimson }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ background: "rgba(110,15,45,0.06)", border: "none", color: T.royalBurgundy, borderRadius: 6, padding: "5px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>View</button>
                        <button style={{ background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 6, padding: "5px 10px", fontFamily: F.ui, fontSize: 11, cursor: "pointer" }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECTION 6: INACTIVE CUSTOMERS ──────────────────────────────────── */}
      <div style={{ padding: "0 56px 64px 56px" }}>
        <SectionTitle 
          title="Inactive Customers — No Purchase in 6 Months" 
          sub="These customers have not placed any order or visited the shop in the last 6 months. Consider reaching out to bring them back."
          action="Download Inactive List →" 
        />
        
        <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 14 }}>
            <thead>
              <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Customer Name</th>
                <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Type</th>
                <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>City</th>
                <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Last Purchase</th>
                <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Total Spend Ever</th>
                <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {inactiveData.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                  <td style={{ padding: "16px 24px", fontWeight: 600, color: T.luxuryBrown }}>{row.name}</td>
                  <td style={{ padding: "16px 24px" }}><span style={{ padding: "4px 8px", background: row.type === "Wholesale" ? T.crimsonBg : T.greenBg, color: row.type === "Wholesale" ? T.crimson : T.greenMid, fontSize: 11, borderRadius: 4, fontWeight: 600 }}>{row.type}</span></td>
                  <td style={{ padding: "16px 24px", color: T.taupe }}>{row.city}</td>
                  <td style={{ padding: "16px 24px", color: T.crimson, fontWeight: 500 }}>{row.last}</td>
                  <td style={{ padding: "16px 24px", color: T.luxuryBrown, fontFamily: F.mono }}>₹{row.spend}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button style={{ background: "transparent", border: "none", color: T.antiqueGold, fontWeight: 600, cursor: "pointer", fontFamily: F.ui, fontSize: 13 }}>Mark as Inactive</button>
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, whiteSpace: "nowrap" as const }}>🔒 Superadmin only</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalWholesale && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalWholesale(null)} style={{ position: "absolute", inset: 0, background: "rgba(44,24,16,0.6)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} style={{ width: "100%", maxWidth: 780, background: "#FFF", borderRadius: 24, overflow: "hidden", position: "relative", zIndex: 10, boxShadow: "0 20px 60px rgba(44,24,16,0.20)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <div style={{ background: T.darkBurgundy, padding: "24px 32px", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.antiqueGold, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700, flexShrink: 0, boxShadow: "0 0 0 3px rgba(200,155,71,0.30)" }}>{modalWholesale.code}</div>
                <div>
                  <h2 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: "#FFF", margin: "0 0 6px 0" }}>{modalWholesale.name}</h2>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.antiqueGold, background: "rgba(200,155,71,0.18)", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(200,155,71,0.30)" }}>Wholesale Customer</span>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.50)" }}>{modalWholesale.id}</span>
                  </div>
                </div>
                <button onClick={() => setModalWholesale(null)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.10)", border: "none", color: "#FFF", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, background: T.silkCream, padding: "0 32px" }}>
                {["Overview", "Order History", "Payment History", "Contact Details", "Edit Profile"].map((t, i) => (
                  <div key={i} style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: i===0?600:500, color: i===0?T.royalBurgundy:T.taupe, borderBottom: i===0?`2px solid ${T.royalBurgundy}`:"2px solid transparent", cursor: "pointer" }}>{t}</div>
                ))}
              </div>
              <div style={{ padding: 32, overflowY: "auto", display: "flex", gap: 32 }}>
                <div style={{ flex: "55%" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                    <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Orders Ever</div><div style={{ fontFamily: F.display, fontSize: 28, color: T.luxuryBrown, fontWeight: 700 }}>{modalWholesale.orders}</div></div>
                    <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Spend</div><div style={{ fontFamily: F.display, fontSize: 28, color: T.antiqueGold, fontWeight: 700 }}>₹{modalWholesale.spend}</div></div>
                    <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div><div style={{ fontFamily: F.display, fontSize: 28, color: modalWholesale.out==="0"?T.greenMid:T.crimson, fontWeight: 700 }}>₹{modalWholesale.out}</div></div>
                    <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Payment Terms</div><div style={{ fontFamily: F.mono, fontSize: 20, color: T.luxuryBrown, fontWeight: 600 }}>{modalWholesale.terms}</div></div>
                  </div>
                  {modalWholesale.activeOrder && (
                    <div style={{ background: T.luxuryBrown, padding: 20, borderRadius: 12, color: "#FFF" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Active Order in Production</div>
                      <div style={{ fontFamily: F.mono, fontSize: 16, color: T.goldLight, marginBottom: 12 }}>{modalWholesale.activeOrder} · 80 sarees</div>
                      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}><div style={{ width: "60%", height: "100%", background: T.antiqueGold, borderRadius: 2 }}/></div>
                    </div>
                  )}
                </div>
                <div style={{ flex: "45%", borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 32 }}>
                  <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 20 }}>Contact Details</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div><div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Owner</div><div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>Ramesh Rao</div></div>
                    <div><div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Phone</div><div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>+91 98480 12345</div></div>
                    <div><div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>City & State</div><div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>{modalWholesale.city}</div></div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 2 }}>Bank Details</div>
                      <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>HDFC Bank · 4872 1938 8901</div>
                      <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>🔒 Visible to Superadmin only</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 2 }}>Special Terms / Credit Notes</div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Extended 45-day terms approved · FY2026</div>
                      <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, marginTop: 4 }}>🔒 Superadmin only</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {modalRetail && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalRetail(null)} style={{ position: "absolute", inset: 0, background: "rgba(44,24,16,0.6)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} style={{ width: "100%", maxWidth: 680, background: "#FFF", borderRadius: 24, overflow: "hidden", position: "relative", zIndex: 10, boxShadow: "0 20px 60px rgba(44,24,16,0.20)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <div style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, padding: "24px 32px", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.warmCream, color: T.luxuryBrown, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 20, fontWeight: 700 }}>{modalRetail.initials}</div>
                <div>
                  <h2 style={{ fontFamily: F.display, fontSize: 22, color: T.luxuryBrown, margin: "0 0 4px 0" }}>{modalRetail.name}</h2>
                  <div style={{ display: "flex", gap: 8 }}><span style={{ fontFamily: F.ui, fontSize: 11, color: T.royalBurgundy, background: T.crimsonBg, padding: "4px 8px", borderRadius: 12 }}>Retail Customer</span><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, background: "#FFF", border: `1px solid ${T.borderDef}`, padding: "4px 8px", borderRadius: 12 }}>Since 2024</span></div>
                </div>
                <button onClick={() => setModalRetail(null)} style={{ marginLeft: "auto", background: "#FFF", border: `1px solid ${T.borderDef}`, color: T.taupe, width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, background: "#FFF", padding: "0 32px" }}>
                <div style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.royalBurgundy, borderBottom: `2px solid ${T.royalBurgundy}`, cursor: "pointer" }}>Purchase History</div>
                <div style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: 500, color: T.taupe, borderBottom: "2px solid transparent", cursor: "pointer" }}>Profile Details</div>
              </div>
              <div style={{ padding: 32, overflowY: "auto" }}>
                {/* 4-stat summary strip */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 28, background: T.silkCream, borderRadius: 14, padding: "20px 24px" }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Total Purchases</div>
                    <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{modalRetail.purchases}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Total Spent</div>
                    <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>₹{modalRetail.spend}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Avg per Visit</div>
                    <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.taupe, marginTop: 4 }}>
                      ₹{Math.round(parseInt(modalRetail.spend.replace(/,/g, '')) / Math.max(modalRetail.purchases, 1)).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Total Returns</div>
                    <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.crimson, marginTop: 4 }}>0</div>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                      {["Sale Date", "Saree ID", "Design", "Saree Type", "Price Paid", "Return"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", color: T.taupe, fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { date: modalRetail.lastVisit, id: "RAVI-L2-008", design: "BKB-045", type: "Heavy Zari",       price: "₹14,500", returned: false },
                      { date: "12 Feb 2026",         id: "PADMA-L1-012", design: "BKB-031", type: "Plain Silk",       price: "₹22,000", returned: false },
                      { date: "08 Jan 2026",         id: "BKB-L3-004",   design: "BKB-022", type: "Self Brocade",     price: "₹9,800",  returned: false },
                      { date: "14 Dec 2025",         id: "SURESH-L2-007", design: "BKB-019", type: "Bridal Special", price: "₹38,500", returned: false },
                      { date: "02 Nov 2025",         id: "RAVI-L2-003",  design: "BKB-038", type: "Heavy Zari",      price: "₹16,200", returned: false },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                        <td style={{ padding: "14px 14px", color: T.taupe }}>{row.date}</td>
                        <td style={{ padding: "14px 14px", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{row.id}</td>
                        <td style={{ padding: "14px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.design}</td>
                        <td style={{ padding: "14px 14px", color: T.luxuryBrown }}>{row.type}</td>
                        <td style={{ padding: "14px 14px", color: T.antiqueGold, fontWeight: 600 }}>{row.price}</td>
                        <td style={{ padding: "14px 14px", color: T.taupe }}>—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EXTERNAL PURCHASE DRAWER ───────────────────────────────── */}
      {showExtDrawer && (
        <>
          {/* Overlay */}
          <div onClick={() => setShowExtDrawer(false)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(27,12,8,0.40)", backdropFilter: "blur(3px)" }} />
          {/* Drawer */}
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, zIndex: 501, background: "#FFF", boxShadow: "-8px 0 40px rgba(44,24,16,0.18)", display: "flex", flexDirection: "column" }}>
            {/* Drawer header */}
            <div style={{ padding: "22px 28px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>Add External Purchase</div>
              <button onClick={() => setShowExtDrawer(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${T.borderDef}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color={T.taupe} />
              </button>
            </div>
            {/* Drawer body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { label: "Supplier Short Name", key: "supplier", type: "text", placeholder: "e.g. Ravi Silks", mono: false },
                { label: "Serial Number", key: "serial", type: "text", placeholder: "e.g. EXT-2024-0045", mono: true },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={(extForm as any)[field.key]} onChange={e => setExtForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(110,15,45,0.18)", fontFamily: field.mono ? F.mono : F.ui, fontSize: 13, padding: "0 12px", background: "#FFF8F0", outline: "none" }} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Source / Industry Type</label>
                <select value={extForm.source} onChange={e => setExtForm(prev => ({ ...prev, source: e.target.value }))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(110,15,45,0.18)", fontFamily: F.ui, fontSize: 13, padding: "0 12px", background: "#FFF8F0", outline: "none", cursor: "pointer" }}>
                  {["Wholesale Supplier","Local Weaver","Auction Purchase","Sister Store Transfer","Other"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              {[
                { label: "Supplier Location", key: "location", placeholder: "City, State", mono: false },
                { label: "Invoice / Reference Number", key: "invoice", placeholder: "Optional", mono: false },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>{field.label}</label>
                  <input type="text" placeholder={field.placeholder} value={(extForm as any)[field.key]} onChange={e => setExtForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(110,15,45,0.18)", fontFamily: F.ui, fontSize: 13, padding: "0 12px", background: "#FFF8F0", outline: "none" }} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Purchase Date</label>
                  <input type="date" value={extForm.date} onChange={e => setExtForm(prev => ({ ...prev, date: e.target.value }))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(110,15,45,0.18)", fontFamily: F.mono, fontSize: 13, padding: "0 10px", background: "#FFF8F0", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Number of Sarees</label>
                  <input type="number" min={1} value={extForm.quantity} onChange={e => setExtForm(prev => ({ ...prev, quantity: Number(e.target.value) }))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(110,15,45,0.18)", fontFamily: F.mono, fontSize: 14, padding: "0 12px", background: "#FFF8F0", outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Price Per Saree (₹)</label>
                <input type="text" placeholder="0.00" value={extForm.pricePerSaree} onChange={e => setExtForm(prev => ({ ...prev, pricePerSaree: e.target.value }))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(110,15,45,0.18)", fontFamily: F.mono, fontSize: 14, padding: "0 12px", background: "#FFF8F0", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Total Amount (auto)</label>
                <div style={{ height: 40, borderRadius: 8, border: "1px solid rgba(110,15,45,0.10)", fontFamily: F.mono, fontSize: 14, padding: "0 12px", background: "#F0EDE8", color: T.antiqueGold, fontWeight: 700, display: "flex", alignItems: "center" }}>
                  ₹{extForm.pricePerSaree ? (extForm.quantity * Number(String(extForm.pricePerSaree).replace(/,/g,""))).toLocaleString("en-IN") : "0"}
                </div>
              </div>
              <div>
                <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 10 }}>Payment Status</label>
                <div style={{ display: "flex", gap: 16 }}>
                  {["Paid","Pending","Partial"].map(opt => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                      <input type="radio" name="payStatus" value={opt} checked={extForm.paymentStatus === opt} onChange={() => setExtForm(prev => ({ ...prev, paymentStatus: opt }))} style={{ accentColor: "#6E0F2D" }} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Notes</label>
                <textarea placeholder="Any additional details about this purchase" rows={3} value={extForm.notes} onChange={e => setExtForm(prev => ({ ...prev, notes: e.target.value }))} style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(110,15,45,0.18)", fontFamily: F.ui, fontSize: 13, padding: "10px 12px", background: "#FFF8F0", outline: "none", resize: "vertical" as const }} />
              </div>
            </div>
            {/* Drawer footer */}
            <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column" as const, gap: 10 }}>
              <button onClick={() => { setExtPurchases(prev => [{ serial: extForm.serial || `EXT-2026-00${prev.length+4}`, supplier: extForm.supplier || "New Supplier", source: extForm.source, date: new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}), qty: extForm.quantity, price: extForm.pricePerSaree || "0", total: String(extForm.quantity * Number(String(extForm.pricePerSaree).replace(/,/g,""))), status: extForm.paymentStatus }, ...prev]); setShowExtDrawer(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3500); }} style={{ width: "100%", height: 44, background: T.royalBurgundy, border: "none", borderRadius: 9, color: "#FFF", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Save Purchase
              </button>
              <button onClick={() => setShowExtDrawer(false)} style={{ width: "100%", height: 36, background: "transparent", border: "none", color: T.taupe, fontFamily: F.ui, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
      {/* Success toast */}
      {saveSuccess && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 600, background: "#1E6640", color: "#FFF", padding: "14px 20px", borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(30,102,64,0.30)", display: "flex", alignItems: "center", gap: 10 }}>
          ✓ External purchase recorded successfully
        </div>
      )}

      {/* Visiting Card Viewer Modal */}
      <AnimatePresence>
        {viewingCard && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingCard(null)} style={{ position: "absolute", inset: 0, background: "rgba(44,24,16,0.75)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()} style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 480, background: "#FFF", borderRadius: 18, boxShadow: "0 20px 60px rgba(44,24,16,0.25)", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Visiting Card</span>
                <button onClick={() => setViewingCard(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.taupe, display: "flex", alignItems: "center" }}>
                  <X size={18} />
                </button>
              </div>
              <img src={viewingCard} alt="Visiting card" style={{ width: "100%", borderRadius: 12, border: `1px solid ${T.borderDef}`, display: "block" }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}