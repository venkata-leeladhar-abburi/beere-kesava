import React, { useRef, useState } from "react";
import { useLocation } from "react-router";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  AlertTriangle, Plus, Search, ChevronDown, ChevronLeft as ChevronLeftIcon, LayoutGrid, LayoutList,
  AlignJustify, Eye, X, Facebook, Instagram, Youtube, Linkedin,
  MapPin, Calendar, Star, Phone, Mail, Camera, FileText, Download, Save, UserPlus, Layers3, PackageCheck, XOctagon, Check, Edit3, Bell, ClipboardList,
  Smartphone, Landmark, Home, CreditCard, Activity
} from "lucide-react";
import {
  Package, CheckCircle, XCircle, Clock, WarningCircle,
  ChartBar, Eye as PhEye, Rows, Users, MagnifyingGlass,
  Plus as PhPlus, CaretDown, SquaresFour, List as PhList,
  Table as PhTable, MapPin as PhMapPin, Gauge, Yarn, Medal, PencilSimple,
} from "@phosphor-icons/react";
import { PieChart, Pie, Cell } from "recharts";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../constants/weaverImages";
import { useWeaverPayments } from "./WeaverPaymentsContext";
import { useMaterialIssue } from "./MaterialIssueContext";
import { useBatches } from "./BatchContext";
import { useBulkOrders } from "./BulkOrderContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "./DateFilterBar";
const imgHeaderBg = "https://images.unsplash.com/photo-1669556289350-0e2480fe190e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import { imgBKLogo as imgBKBLogo } from "../constants/weaverImages";

// ── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  silkCream: "#F7F2EA",
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B",
  darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47",
  goldLight: "#E7C983",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  taupe: "#8B7060",
  crimson: "#C0392B",
  green: "#1E6640",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Types & helpers ────────────────────────────────────────────────────────
type Status = "active" | "qc" | "idle";
const STATUS_CFG: Record<Status, { strip: string; label: string; badge: string; color: string }> = {
  active: { strip: T.green, label: "🟢 Currently Weaving", badge: "rgba(30,102,64,0.10)", color: T.green },
  qc: { strip: T.antiqueGold, label: "🟡 Sarees Submitted — Quality Check Pending", badge: "rgba(200,155,71,0.12)", color: "#8B6018" },
  idle: { strip: T.taupe, label: "⚪ No Active Batch", badge: "rgba(139,112,96,0.10)", color: T.taupe },
};
function qcColor(r: number) { return r > 95 ? T.green : r >= 85 ? "#8B6018" : T.crimson; }

// ── Shared helpers ─────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }} style={style}>
      {children}
    </motion.div>
  );
}
function Avatar({ photo, initials, bg, size = 44 }: { photo: string | null; initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${T.borderGold}` }}>
      {photo
        ? <img src={photo} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: F.display, fontSize: size * 0.4, color: "#FFFDF9" }}>{initials}</span>
        </div>}
    </div>
  );
}
function Divider() { return <div style={{ height: 1, background: T.borderDef, margin: "16px 0" }} />; }
function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>;
}

// ── Data ───────────────────────────────────────────────────────────────────
const WEAVER_RATES: Record<string, { code: string; type: string; rate: string }> = {
  "WV-001": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "WV-002": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "WV-007": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "WV-005": { code: "PS-002", type: "Plain Silk", rate: "₹280/saree" },
  "WV-012": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "WV-018": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "WV-031": { code: "BS-004", type: "Bridal Special", rate: "₹820/saree" },
};

const WEAVERS = [
  { id: "WV-001", name: "Ravi Kumar", village: "Dharmavaram, AP", photo: imgRaviKumar, initials: "RK", bg: "#5A3E6B", status: "active" as Status, thisMonth: 12, passRate: 94, totalEver: 2140, looms: 3, batch: "BATCH-079", design: "BKB-042", mobile: "×××× 4521", totalPaid: "₹8,42,000", lastActive: "Today" },
  { id: "WV-002", name: "Padma Veni", village: "Pochampally, Telangana", photo: imgPadmaVeni, initials: "PV", bg: "#9B6B8A", status: "active" as Status, thisMonth: 18, passRate: 97, totalEver: 1840, looms: 2, batch: "BATCH-086", design: "BKB-051", mobile: "×××× 8834", totalPaid: "₹6,90,000", lastActive: "Today" },
  { id: "WV-007", name: "Suresh Murti", village: "Venkatagiri, AP", photo: imgSureshMurti, initials: "SM", bg: "#2D6B6B", status: "qc" as Status, thisMonth: 7, passRate: 98, totalEver: 980, looms: 2, batch: "BATCH-081", design: "BKB-040", mobile: "×××× 9982", totalPaid: "₹3,64,000", lastActive: "Yesterday" },
  { id: "WV-005", name: "Anand K.", village: "Pochampally, Telangana", photo: imgAnandK, initials: "AK", bg: "#4A6B4A", status: "active" as Status, thisMonth: 9, passRate: 92, totalEver: 1560, looms: 2, batch: "BATCH-083", design: "BKB-047", mobile: "×××× 7723", totalPaid: "₹5,84,000", lastActive: "Today" },
  { id: "WV-012", name: "Meena R.", village: "Siddipet, Telangana", photo: null, initials: "MR", bg: "#9B6B8A", status: "active" as Status, thisMonth: 6, passRate: 89, totalEver: 720, looms: 1, batch: "BATCH-088", design: "BKB-033", mobile: "×××× 6614", totalPaid: "₹2,68,000", lastActive: "Today" },
  { id: "WV-018", name: "Lakshmi D.", village: "Dharmavaram, AP", photo: null, initials: "LD", bg: "#2D7D6B", status: "qc" as Status, thisMonth: 11, passRate: 96, totalEver: 1320, looms: 2, batch: "BATCH-080", design: "BKB-040", mobile: "×××× 3341", totalPaid: "₹4,92,000", lastActive: "Yesterday" },
  { id: "WV-024", name: "Venkat Rao", village: "Venkatagiri, AP", photo: null, initials: "VR", bg: "#4A5E7A", status: "idle" as Status, thisMonth: 0, passRate: 95, totalEver: 2480, looms: 4, batch: null, design: null, mobile: "×××× 1122", totalPaid: "₹9,28,000", lastActive: "3 days ago" },
  { id: "WV-031", name: "Kamala B.", village: "Pochampally, Telangana", photo: null, initials: "KB", bg: "#7A2040", status: "active" as Status, thisMonth: 14, passRate: 99, totalEver: 3120, looms: 3, batch: "BATCH-084", design: "BKB-055", mobile: "×××× 5589", totalPaid: "₹11,64,000", lastActive: "Today" },
];
const TABLE_ROWS = [
  { id: "WV-001", name: "Ravi Kumar", village: "Dharmavaram, AP", mobile: "×××× 4521", looms: 3, status: "active" as Status, thisMonth: 12, passRate: 94, totalEver: "2,140", totalPaid: "₹8,42,000", lastActive: "Today" },
  { id: "WV-002", name: "Padma Veni", village: "Pochampally, TG", mobile: "×××× 8834", looms: 2, status: "active" as Status, thisMonth: 18, passRate: 97, totalEver: "1,840", totalPaid: "₹6,90,000", lastActive: "Today" },
  { id: "WV-003", name: "Krishnamma", village: "Venkatagiri, AP", mobile: "×××× 2210", looms: 2, status: "idle" as Status, thisMonth: 0, passRate: 96, totalEver: "2,640", totalPaid: "₹9,84,000", lastActive: "3 days ago" },
  { id: "WV-004", name: "Rajesh T.", village: "Siddipet, TG", mobile: "×××× 5567", looms: 1, status: "active" as Status, thisMonth: 5, passRate: 91, totalEver: "620", totalPaid: "₹2,18,000", lastActive: "Today" },
  { id: "WV-005", name: "Anand K.", village: "Pochampally, TG", mobile: "×××× 7723", looms: 2, status: "active" as Status, thisMonth: 9, passRate: 92, totalEver: "1,560", totalPaid: "₹5,84,000", lastActive: "Today" },
  { id: "WV-006", name: "Saraswati M.", village: "Dharmavaram, AP", mobile: "×××× 3341", looms: 3, status: "qc" as Status, thisMonth: 11, passRate: 98, totalEver: "3,240", totalPaid: "₹12,40,000", lastActive: "Yesterday" },
  { id: "WV-007", name: "Suresh Murti", village: "Venkatagiri, AP", mobile: "×××× 9982", looms: 2, status: "qc" as Status, thisMonth: 7, passRate: 98, totalEver: "980", totalPaid: "₹3,64,000", lastActive: "Yesterday" },
  { id: "WV-008", name: "Bhavani K.", village: "Siddipet, TG", mobile: "×××× 6614", looms: 1, status: "idle" as Status, thisMonth: 0, passRate: 88, totalEver: "440", totalPaid: "₹1,60,000", lastActive: "5 days ago" },
];
const LEADERBOARD = [
  { rank: 1, name: "Padma Veni", id: "WV-002", sarees: 18, rate: 97, photo: imgPadmaVeni, initials: "PV", bg: "#9B6B8A" },
  { rank: 2, name: "Kamala B.", id: "WV-031", sarees: 14, rate: 99, photo: null, initials: "KB", bg: "#7A2040" },
  { rank: 3, name: "Ravi Kumar", id: "WV-001", sarees: 12, rate: 94, photo: imgRaviKumar, initials: "RK", bg: "#5A3E6B" },
  { rank: 4, name: "Lakshmi D.", id: "WV-018", sarees: 11, rate: 96, photo: null, initials: "LD", bg: "#2D7D6B" },
  { rank: 5, name: "Suresh Murti", id: "WV-007", sarees: 7, rate: 98, photo: imgSureshMurti, initials: "SM", bg: "#2D6B6B" },
];
const QC_DATA = [
  { name: "Passed", value: 238, color: T.green },
  { name: "Rejected", value: 10, color: T.crimson },
];
const ACTIVITIES = [
  { icon: "📦", action: "New batch issued", detail: "BATCH-089 given to Ravi Kumar (WV-001) — Extra sarees for Lakshmi Silks order", time: "2 hours ago" },
  { icon: "✅", action: "Quality check submitted", detail: "Padma Veni (WV-002) submitted 18 sarees — 17 passed quality check", time: "Yesterday" },
  { icon: "⚠️", action: "Material request pending", detail: "Suresh Murti (WV-007) requested 4 kg Warp — awaiting approval from admin", time: "Today" },
  { icon: "💰", action: "Payment processed", detail: "Monthly making charges disbursed to 84 weavers — ₹4.2L total paid this month", time: "2 days ago" },
  { icon: "🔄", action: "Batch completed", detail: "Kamala B. (WV-031) completed BATCH-084 — 14 sarees woven, all passed quality check", time: "3 days ago" },
];
const BATCH_HISTORY = [
  { batch: "BATCH-072", design: "BKB-040", produced: 6, passed: 6, date: "15 Apr 2026" },
  { batch: "BATCH-061", design: "BKB-022", produced: 5, passed: 4, date: "02 Apr 2026" },
  { batch: "BATCH-054", design: "BKB-045", produced: 7, passed: 7, date: "18 Mar 2026" },
  { batch: "BATCH-047", design: "BKB-031", produced: 6, passed: 5, date: "04 Mar 2026" },
  { batch: "BATCH-039", design: "BKB-019", produced: 5, passed: 5, date: "14 Feb 2026" },
];

// ══════════════════════════════════════════════════════════════════════════
// SECTION 1 — PAGE HEADER
// ══════════════════════════════════════════════════════════════════════════
const HEADER_CHIPS = [
  { value: "9",     label: "Active Weavers",                      crimson: false },
  { value: "248",   label: "Sarees Produced This Month",          crimson: false },
  { value: "96%",   label: "Quality Check Pass Rate",             crimson: false },
  { value: "3",     label: "Warp Requests Pending",               crimson: true  },
  { value: "₹4.2L", label: "Total Paid to Weavers This Month",    crimson: false },
];
function PageHeader() {
  return (
    <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", zIndex: 2, padding: "48px 0 90px 48px", flex: "0 0 65%", maxWidth: "65%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999 · WEAVER MANAGEMENT</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Weavers</h1>
          <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Production Overview</span>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 600, lineHeight: 1.6 }}>
          See all weavers, their current work, how they are performing, and manage their details. You can also approve material requests from here.
        </p>
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
        <img src={imgPadmaVeni} alt="Padma Veni — Master Weaver" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 2 — STATS STRIP
// ══════════════════════════════════════════════════════════════════════════
const STATS = [
  { label: "TOTAL ACTIVE WEAVERS", value: "9", sub: "All currently working with the firm", gold: false, crimson: false },
  { label: "SAREES PRODUCED THIS MONTH", value: "248", sub: "↑ 14% more than last month", gold: false, crimson: false },
  { label: "QUALITY CHECK PASS RATE", value: "96%", sub: "Only 4% rejected this month", gold: true, crimson: false },
  { label: "WARP REQUESTS PENDING", value: "3", sub: "⚠ Need approval today", gold: false, crimson: true },
  { label: "TOTAL PAID TO WEAVERS", value: "₹4.2L", sub: "This month's making charges", gold: false, crimson: false },
];
function StatsStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{ padding: `0 48px`, marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {STATS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20, backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
            whileHover={{ backgroundColor: m.gold ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.gold ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.gold ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.crimson ? "#F47B72" : m.gold ? T.goldLight : T.warmIvory, lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                {m.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.gold ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </span>
              </div>
            </div>
            {m.gold && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 3 — WARP REQUESTS
// ══════════════════════════════════════════════════════════════════════════
const WARP_REQUESTS = [
  { name: "Ravi Kumar", code: "WV-001", batch: "BATCH-089", photo: imgRaviKumar, raised: "2 days ago", material: "3 kg Warp", reason: "Extra sarees for Lakshmi Silks order", done: 4, total: 8, pct: 50 },
  { name: "Padma Veni", code: "WV-002", batch: "BATCH-086", photo: imgPadmaVeni, raised: "1 day ago", material: "2 kg Warp + Resham Red 500g", reason: "Design change by admin", done: 3, total: 5, pct: 60 },
  { name: "Suresh Murti", code: "WV-007", batch: "BATCH-081", photo: imgSureshMurti, raised: "Today", material: "4 kg Warp", reason: "More sarees for stock", done: 2, total: 4, pct: 50 },
];

function ActionDialog({ open, title, children, tone = "gold", onClose }: { open: boolean; title: string; children: React.ReactNode; tone?: "gold" | "green" | "red"; onClose: () => void }) {
  if (!open) return null;
  const color = tone === "green" ? T.green : tone === "red" ? T.crimson : T.royalBurgundy;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(26,10,15,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 18 }} onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: "100%", background: "#FFFFFF", borderRadius: 22, border: `1px solid ${T.borderDef}`, boxShadow: "0 30px 90px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: `linear-gradient(100deg, ${color}, ${T.deepWine})`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: "#FFFDF9" }}>{title}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", color: "#FFFDF9", borderRadius: 10, width: 36, height: 36, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 26 }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

function WarpRequestsSection() {
  const [decision, setDecision] = useState<{ type: "approve" | "reject"; req: typeof WARP_REQUESTS[0] } | null>(null);
  return (
    <div style={{ padding: "36px 48px 0" }}>
      <FadeUp>

        {/* ── Section wrapper ── */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid rgba(192,57,43,0.16)`, boxShadow: "0 6px 32px rgba(74,6,27,0.09)", overflow: "hidden" }}>

          {/* Header bar */}
          <div style={{ background: `linear-gradient(100deg, #3D0E1A 0%, #6E0F2D 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WarningCircle size={26} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 22, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Warp Requests Waiting for Approval</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Review each weaver's progress and material need before approving</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(192,57,43,0.30)", border: "1px solid rgba(192,57,43,0.45)", borderRadius: 10, padding: "8px 16px" }}>
              <Clock size={18} color="#F4A6A6" weight="fill" />
              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: "#F4A6A6", letterSpacing: "0.3px" }}>3 requests pending</span>
            </div>
          </div>

          {/* Cards grid */}
          <div style={{ padding: "28px 28px 28px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
            {WARP_REQUESTS.map((r, idx) => (
              <motion.div
                key={r.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ y: -4, boxShadow: "0 20px 52px rgba(74,6,27,0.14)" }}
                style={{ background: T.warmIvory, borderRadius: 18, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                {/* Gold accent top */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, flexShrink: 0 }} />

                {/* Weaver identity */}
                <div style={{ padding: "22px 22px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `3px solid ${T.antiqueGold}` }}>
                    <img src={r.photo} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontSize: 21, color: T.luxuryBrown, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{r.name}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px", marginBottom: 3 }}>{r.code}</div>
                    <div style={{ display: "inline-block", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 7, padding: "3px 10px" }}>{r.batch}</div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "0 22px" }} />

                {/* Info rows */}
                <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

                  {/* Raised */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Clock size={20} color={T.royalBurgundy} weight="regular" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Request raised</div>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.raised}</div>
                    </div>
                  </div>

                  {/* Material */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Package size={20} color={T.royalBurgundy} weight="regular" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Material requested</div>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 2 }}>{r.material}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.45 }}>{r.reason}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ChartBar size={20} color={T.royalBurgundy} weight="regular" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 6 }}>Batch progress</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{r.done} of {r.total} sarees done</div>
                        <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.antiqueGold }}>{r.pct}%</div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 10, background: "rgba(110,15,45,0.09)", borderRadius: 99, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${r.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                          style={{ height: "100%", background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "0 22px" }} />

                {/* Action buttons */}
                <div style={{ padding: "18px 22px 22px", display: "flex", gap: 12 }}>
                  <motion.button
                    onClick={() => setDecision({ type: "approve", req: r })}
                    whileHover={{ scale: 1.02, backgroundColor: "#145230" }}
                    whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: T.green, color: "#FFFFFF", border: "none", borderRadius: 12, padding: "14px 12px", fontFamily: F.ui, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                  >
                    <CheckCircle size={22} weight="fill" />
                    Approve
                  </motion.button>
                  <motion.button
                    onClick={() => setDecision({ type: "reject", req: r })}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(192,57,43,0.08)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: T.crimson, background: "rgba(192,57,43,0.05)", border: `1.5px solid rgba(192,57,43,0.30)`, borderRadius: 12, padding: "14px 12px", fontFamily: F.ui, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                  >
                    <XCircle size={22} weight="fill" />
                    Reject
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </FadeUp>
      <AnimatePresence>
        {decision && (
          <ActionDialog open={!!decision} title={decision.type === "approve" ? "Approve warp request" : "Reject warp request"} tone={decision.type === "approve" ? "green" : "red"} onClose={() => setDecision(null)}>
            <div style={{ fontFamily: F.ui, color: T.luxuryBrown, fontSize: 16, lineHeight: 1.65 }}>
              {decision.type === "approve" ? <Check size={32} color={T.green} /> : <XOctagon size={32} color={T.crimson} />}
              Confirm {decision.type} for <b>{decision.req.name}</b> ({decision.req.code}) requesting <b>{decision.req.material}</b> for {decision.req.batch}.
            </div>
            {decision.type === "reject" && <textarea placeholder="Reason for rejection" style={{ marginTop: 18, width: "100%", minHeight: 94, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: 14, fontFamily: F.ui }} />}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
              <button onClick={() => setDecision(null)} style={{ padding: "12px 18px", borderRadius: 12, border: `1px solid ${T.borderDef}`, background: "#fff", color: T.taupe, fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setDecision(null)} style={{ padding: "12px 22px", borderRadius: 12, border: "none", background: decision.type === "approve" ? T.green : T.crimson, color: "#fff", fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}>{decision.type === "approve" ? "Approve & issue material" : "Reject request"}</button>
            </div>
          </ActionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 4 — CONTROLS
// ══════════════════════════════════════════════════════════════════════════
const FILTER_PILLS = ["All Weavers", "Currently Working", "Submitted — Waiting Quality Check", "Idle — No Active Batch"];
const VIEW_OPTIONS = [
  { key: "card", label: "Cards", PhIcon: SquaresFour },
  { key: "list", label: "List", PhIcon: PhList },
  { key: "table", label: "Table", PhIcon: PhTable },
];
function AllWeaversControls({ view, setView, filter, setFilter, search, setSearch, onAddWeaver, onViewAll }: {
  view: string; setView: (v: string) => void; filter: string; setFilter: (f: string) => void; search: string; setSearch: (s: string) => void; onAddWeaver: () => void; onViewAll: () => void;
}) {
  return (
    <div id="weav-all-weavers" style={{ padding: "40px 48px 0" }}>
      <FadeUp>
        {/* Section title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.royalBurgundy}, ${T.deepWine})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(110,15,45,0.28)" }}>
              <Users size={26} color="#FFFDF9" weight="fill" />
            </div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 32, color: T.luxuryBrown, margin: 0, lineHeight: 1.1 }}>All Weavers</h2>
              <div style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, marginTop: 3 }}>350 weavers registered · 84 currently active</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><motion.button
            onClick={onViewAll}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 14, padding: "14px 22px", fontFamily: F.ui, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            <Users size={20} /> View All Weavers
          </motion.button><motion.button
            onClick={onAddWeaver}
            whileHover={{ scale: 1.03, backgroundColor: T.deepWine }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 14, padding: "14px 26px", fontFamily: F.ui, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(110,15,45,0.28)" }}
          >
              <UserPlus size={20} /> Add New Weaver
            </motion.button></div>
        </div>

        <p style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, margin: "0 0 22px", lineHeight: 1.6 }}>
          Search and find any weaver. Use the filters to narrow down by status or area.
        </p>

        {/* Search + view toggle */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <MagnifyingGlass size={22} color={T.taupe} weight="regular" />
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by weaver name, weaver code, or village..."
              style={{ width: "100%", height: 54, paddingLeft: 50, paddingRight: 20, fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", background: "#FFFFFF", flexShrink: 0 }}>
            {VIEW_OPTIONS.map(({ key, label, PhIcon }) => (
              <motion.button
                key={key} onClick={() => setView(key)}
                animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 20px", fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}
              >
                <PhIcon size={18} weight={view === key ? "fill" : "regular"} /> {label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Filter pills row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", paddingBottom: 6 }}>
          {FILTER_PILLS.map(f => (
            <motion.button
              key={f} onClick={() => setFilter(f)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14.5, padding: "9px 20px", borderRadius: 99, cursor: "pointer", background: filter === f ? T.royalBurgundy : "#FFFFFF", color: filter === f ? "#FFFDF9" : T.luxuryBrown, border: filter === f ? `1px solid ${T.royalBurgundy}` : `1.5px solid rgba(110,15,45,0.16)`, boxShadow: filter === f ? "0 4px 14px rgba(110,15,45,0.22)" : "none", transition: "all 0.18s" }}
            >
              {f}
            </motion.button>
          ))}
          <motion.button whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontWeight: 600, fontSize: 14.5, padding: "9px 20px", borderRadius: 99, cursor: "pointer", background: "#FFFFFF", color: T.taupe, border: "1.5px solid rgba(110,15,45,0.16)" }}>
            <PhMapPin size={16} weight="regular" /> Filter by Village <CaretDown size={14} weight="bold" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontWeight: 600, fontSize: 14.5, padding: "9px 20px", borderRadius: 99, cursor: "pointer", background: "#FFFFFF", color: T.taupe, border: "1.5px solid rgba(110,15,45,0.16)" }}>
            Sort: Most Sarees This Month <CaretDown size={14} weight="bold" />
          </motion.button>
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 5 — WEAVER DIRECTORY
// ══════════════════════════════════════════════════════════════════════════
function WeaverCardGrid({ onSelect, onEdit, onBatches }: { onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? WEAVERS : WEAVERS.slice(0, 4);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, alignItems: "stretch" }}>
        {visible.map((w, i) => {
          const cfg = STATUS_CFG[w.status];
          return (
            <FadeUp key={w.id} delay={i * 0.05} style={{ height: "100%" }}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 30px 70px rgba(74,6,27,0.12)" }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}
              >
                {/* Header Banner - Full Image Height 170px */}
                <div style={{ height: 170, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
                  {w.photo ? (
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                      src={w.photo}
                      alt={w.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.bg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                    </div>
                  )}

                  {/* Dark gradient overlay for modern look */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

                  {/* Floating ID badge in top left */}
                  <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                    {w.id}
                  </div>

                  {/* Floating gentle status pill overlay at the bottom left of the image banner */}
                  <div style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px"
                  }}>
                    {w.status === "active" ? (
                      <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                    ) : w.status === "qc" ? (
                      <Clock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontFamily: F.ui,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.5px",
                      textShadow: "0 1px 4px rgba(0,0,0,0.6)"
                    }}>
                      {w.status === "active" ? "Currently Weaving" : w.status === "qc" ? "Pending QC" : "Idle"}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Name and Batch beside it */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 8 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25 }}>
                      {w.name}
                    </div>
                    {w.batch && (
                      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase" }}>
                        {w.batch}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                      <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <span>{w.village}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                      <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <span>{w.mobile}</span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

                  {/* Looms stat */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Rows size={14} color={T.royalBurgundy} weight="fill" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                    <motion.button
                      onClick={() => onSelect(w)}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      <Eye size={14} /> Details
                    </motion.button>
                    <motion.button
                      onClick={() => onEdit(w)}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.05)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      <Edit3 size={13} /> Edit
                    </motion.button>
                    <motion.button
                      onClick={() => onBatches(w)}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      <Layers3 size={14} /> Batches
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          );
        })}
      </div>
      {!showAll && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <motion.button onClick={() => setShowAll(true)} whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" }} whileTap={{ scale: 0.98 }}
            style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, background: "#FFFFFF", border: `1.5px solid rgba(110,15,45,0.20)`, borderRadius: 14, padding: "15px 44px", cursor: "pointer", boxShadow: "0 4px 12px rgba(74,6,27,0.07)" }}>
            Load More Weavers
          </motion.button>
        </div>
      )}
    </div>
  );
}
function WeaverListView({ onSelect }: { onSelect: (w: typeof WEAVERS[0]) => void }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? WEAVERS : WEAVERS.slice(0, 5);
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.5fr 1.2fr 110px 90px 70px 100px", padding: "14px 26px", background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
        {["Weaver", "Village / Area", "Status", "This Month", "Pass Rate", "Looms", "Action"].map(h => (
          <div key={h} style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 500 }}>{h}</div>
        ))}
      </div>
      {visible.map((w, i) => {
        const cfg = STATUS_CFG[w.status];
        return (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.38, delay: i * 0.05 }}
            style={{ display: "grid", gridTemplateColumns: "2.2fr 1.5fr 1.2fr 110px 90px 70px 100px", alignItems: "center", padding: "18px 26px", background: i % 2 === 1 ? "rgba(247,242,234,0.55)" : "#FFFFFF", borderBottom: `1px solid rgba(110,15,45,0.06)`, minHeight: 88 }}
          >
            {/* Weaver identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${T.antiqueGold}`, flexShrink: 0 }}>
                {w.photo
                  ? <img src={w.photo} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: w.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9" }}>{w.initials}</span>
                  </div>
                }
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 17, color: T.luxuryBrown, marginBottom: 4 }}>{w.name}</div>
                <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{w.id}</div>
              </div>
            </div>
            {/* Village */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <PhMapPin size={15} color={T.taupe} weight="fill" />
              <span style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe }}>{w.village}</span>
            </div>
            {/* Status */}
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>
                {w.status === "active" ? "● Weaving" : w.status === "qc" ? "● QC Check" : "○ Idle"}
              </span>
            </div>
            {/* This month */}
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.antiqueGold }}>{w.thisMonth} <span style={{ fontSize: 13, fontFamily: F.ui, color: T.taupe }}>sarees</span></div>
            {/* Pass rate */}
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: qcColor(w.passRate) }}>{w.passRate}%</div>
            {/* Looms */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Rows size={16} color={T.taupe} weight="regular" />
              <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>{w.looms}</span>
            </div>
            {/* Action */}
            <div>
              <motion.button
                onClick={() => onSelect(w)}
                whileHover={{ scale: 1.04, background: "rgba(110,15,45,0.10)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "10px 16px", fontFamily: F.ui, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
              >
                <PhEye size={18} weight="regular" /> View
              </motion.button>
            </div>
          </motion.div>
        );
      })}
      {!showAll && (
        <div style={{ padding: "22px 26px", textAlign: "center", borderTop: `1px solid ${T.borderDef}` }}>
          <motion.button onClick={() => setShowAll(true)} whileHover={{ scale: 1.02 }} style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.35)" }}>Load More Weavers</motion.button>
        </div>
      )}
    </div>
  );
}
const TABLE_COLS = ["Weaver Code", "Full Name", "Village / Area", "Mobile", "Looms", "Status", "Sarees This Month", "QC Pass Rate", "Total Sarees", "Total Paid", "Last Active", "Action"];
function WeaverTableView({ onSelect }: { onSelect: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? TABLE_ROWS : TABLE_ROWS.slice(0, 5);
  const TD: React.CSSProperties = { padding: "16px 18px", borderBottom: "1px solid rgba(110,15,45,0.06)", verticalAlign: "middle" };
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1240 }}>
          <thead>
            <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
              {TABLE_COLS.map(c => (
                <th key={c} style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", textAlign: "left", padding: "15px 18px", fontWeight: 500, whiteSpace: "nowrap" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const cfg = STATUS_CFG[r.status];
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.04 }}
                  style={{ background: i % 2 === 1 ? "rgba(247,242,234,0.50)" : "#FFFFFF" }}
                >
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 14, color: T.royalBurgundy, fontWeight: 700, letterSpacing: "0.4px" }}>{r.id}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 700 }}>{r.name}</span></td>
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <PhMapPin size={14} color={T.taupe} weight="fill" />
                      <span style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe }}>{r.village}</span>
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown }}>{r.mobile}</span></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Rows size={15} color={T.taupe} weight="regular" />
                      <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>{r.looms}</span>
                    </div>
                  </td>
                  <td style={TD}>
                    <span style={{ display: "inline-flex", alignItems: "center", fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>
                      {r.status === "active" ? "● Weaving" : r.status === "qc" ? "● QC Check" : "○ Idle"}
                    </span>
                  </td>
                  <td style={TD}><span style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.antiqueGold }}>{r.thisMonth}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: qcColor(r.passRate) }}>{r.passRate}%</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown }}>{r.totalEver}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 700 }}>{r.totalPaid}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 14, color: T.taupe }}>{r.lastActive}</span></td>
                  <td style={TD}>
                    <motion.button
                      onClick={() => onSelect(r.id)}
                      whileHover={{ scale: 1.04, background: "rgba(110,15,45,0.10)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "9px 15px", fontFamily: F.ui, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
                    >
                      <PhEye size={18} weight="regular" /> View
                    </motion.button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!showAll && (
        <div style={{ padding: "22px 26px", textAlign: "center", borderTop: `1px solid ${T.borderDef}` }}>
          <motion.button onClick={() => setShowAll(true)} whileHover={{ scale: 1.02 }} style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.35)" }}>Load More Weavers</motion.button>
        </div>
      )}
    </div>
  );
}
function WeaverDirectory({ view, onSelect, onEdit, onBatches }: { view: string; onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void }) {
  return (
    <div style={{ padding: "24px 48px 0" }}>
      <FadeUp>
        {view === "card" && <WeaverCardGrid onSelect={onSelect} onEdit={onEdit} onBatches={onBatches} />}
        {view === "list" && <WeaverListView onSelect={onSelect} />}
        {view === "table" && <WeaverTableView onSelect={id => { const w = WEAVERS.find(x => x.id === id); if (w) onSelect(w); }} />}
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 6 — WEAVER DETAIL DRAWER
// ══════════════════════════════════════════════════════════════════════════
function WeaverDrawer({ weaver, onClose, initialMode = "view", onNavigate }: { weaver: typeof WEAVERS[0] | null; onClose: () => void; initialMode?: "view" | "edit"; onNavigate?: (tab: string) => void }) {
  const [tab, setTab] = useState("overview");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [batchDateFilter, setBatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [paymentDateFilter, setPaymentDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const { getPaymentsForWeaver } = useWeaverPayments();
  const { getRecordsForWeaver } = useMaterialIssue();
  const { batches } = useBatches();
  const { bulkOrders } = useBulkOrders();
  if (!weaver) return null;
  const weaverPayments = getPaymentsForWeaver(weaver.id);
  const materialRecords = getRecordsForWeaver(weaver.id);
  const cfg = STATUS_CFG[weaver.status];

  // 1. All sarees assigned to this weaver across all batches
  const assignedSarees: any[] = [];
  batches.forEach(b => {
    b.rows.forEach(r => {
      if (r.weaverId === weaver.id) {
        assignedSarees.push({
          ...r,
          batchId: b.batchId,
          batchStatus: b.status,
          dueDate: b.dueDate,
        });
      }
    });
  });

  // 2. Active batches the weaver is working on
  const workingBatches = batches.filter(b => 
    b.status === "active" && 
    b.rows.some(r => r.weaverId === weaver.id)
  );

  // 3. Draft batches the weaver is assigned to
  const draftBatches = batches.filter(b => 
    b.status === "draft" && 
    b.rows.some(r => r.weaverId === weaver.id)
  );

  // 4. Completed batches (previous batches) the weaver worked on
  const completedBatches = batches.filter(b => 
    b.status === "completed" && 
    b.rows.some(r => r.weaverId === weaver.id)
  );

  // Sort completed batches by Batch ID number descending to get the latest one
  const getBatchNum = (id: string) => {
    const match = id.match(/BATCH-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  const sortedCompletedBatches = [...completedBatches].sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));
  const previousBatch = sortedCompletedBatches[0] || null;

  // All batches (active, draft, completed) assigned to this weaver
  const allWeaverBatches = batches.filter(b => 
    b.rows.some(r => r.weaverId === weaver.id)
  );
  const sortedAllWeaverBatches = [...allWeaverBatches].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return getBatchNum(b.batchId) - getBatchNum(a.batchId);
  }).filter(b => matchesDateFilter(b.createdAt, batchDateFilter));
  const filteredWeaverPayments = weaverPayments.filter(p => matchesDateFilter(p.paymentDate, paymentDateFilter));
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
        style={{ width: "100%", background: T.silkCream, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", color: T.royalBurgundy, fontFamily: F.ui, fontWeight: 700, fontSize: 15, padding: "8px 4px" }}>
            <ChevronLeftIcon size={20} /> Back to Weavers
          </button>
          <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", color: T.taupe }}>Weaver Profile</span>
        </div>

        <div style={{ padding: "40px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" as const }}>
            <Avatar photo={weaver.photo} initials={weaver.initials} bg={weaver.bg} size={104} />
            <div style={{ flex: "1 1 320px" }}>
              <span style={{ display: "inline-block", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "5px 14px", marginBottom: 12 }}>{cfg.label}</span>
              <div style={{ fontFamily: F.display, fontSize: 32, color: "#1A0A0F", lineHeight: 1.2, fontWeight: 600 }}>{weaver.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 14, color: T.royalBurgundy, marginTop: 6 }}>{weaver.id}</div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
              {[
                { icon: <MapPin size={15} color={T.royalBurgundy} />, label: "Village", value: weaver.village },
                { icon: <Phone size={15} color={T.royalBurgundy} />, label: "Mobile", value: weaver.mobile },
                { icon: <Activity size={15} color={T.royalBurgundy} />, label: "Looms", value: `${weaver.looms} Looms` },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 16px", minWidth: 140 }}>
                  {s.icon}
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {mode === "edit" && (
          <div style={{ padding: "24px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
            <SectionPill label="Edit Weaver Details" />
            <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", border: "2px dashed rgba(110,15,45,0.25)", background: "rgba(110,15,45,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Camera size={22} color="rgba(110,15,45,0.35)" strokeWidth={1.5} />
                <span style={{ fontFamily: F.ui, fontSize: 10.5, color: "rgba(110,15,45,0.45)", marginTop: 5, fontWeight: 600 }}>Upload Photo</span>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>JPG or PNG · Max 5MB</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "First Name", value: weaver.name.split(" ")[0] || "" },
                { label: "Last Name", value: weaver.name.split(" ").slice(1).join(" ") || "" },
                { label: "Email ID", value: "" },
                { label: "Mobile Number", value: weaver.mobile },
                { label: "Village / Location", value: weaver.village },
                { label: "Number of Looms", value: String(weaver.looms) },
                { label: "Bank Account Number", value: "" },
                { label: "IFSC Code", value: "SBIN0001234" },
                { label: "Bank Name", value: "State Bank of India" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, marginBottom: 4, display: "block" }}>{f.label}</label>
                  <input defaultValue={f.value} placeholder={f.label} style={{ width: "100%", height: 46, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: "0 14px", fontFamily: F.ui, boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button onClick={() => setMode("view")} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: T.royalBurgundy, color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}><Save size={16} /> Save changes</button>
          </div>
        )}

        <div style={{ padding: "0 48px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 24, background: "#FFFFFF", overflowX: "auto" }}>
          {[
            { key: "overview", label: "Overview", icon: <ClipboardList size={16} /> },
            { key: "batches", label: "Batch History", icon: <Layers3 size={16} /> },
            { key: "payments", label: "Payments", icon: <FileText size={16} /> },
            { key: "materials", label: "Materials Received", icon: <PackageCheck size={16} /> }
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: tab === key ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: `3px solid ${tab === key ? T.royalBurgundy : "transparent"}`, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "40px 48px", flex: 1 }}>
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 32, alignItems: "start" }}>
              <div>
                <SectionPill label="Personal Details" />
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
                  {[
                    { icon: <Smartphone size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "Mobile Number", value: weaver.mobile },
                    { icon: <Landmark size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "Bank Account", value: "State Bank of India — ×××× 8990" },
                    { icon: <CreditCard size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "IFSC Code", value: "SBIN0001234" },
                    { icon: <Home size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />, label: "Address", value: `14-2, Main Handloom Street, ${weaver.village}` },
                  ].map((r, i) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < 3 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 1 ? T.warmIvory : "#FFFFFF" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.taupe, fontFamily: F.ui, fontSize: 14.5 }}>
                        {r.icon}
                        <span>{r.label}</span>
                      </div>
                      <div style={{ fontFamily: weaver.id === "WV-001" && r.label === "IFSC Code" ? F.mono : F.ui, fontSize: 14.5, color: T.luxuryBrown, fontWeight: 600 }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials History */}
              <div>
                <SectionPill label="Materials History" />
                {materialRecords.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto", background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "16px 20px" }}>
                    {materialRecords.map((r, i) => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: i < materialRecords.length - 1 ? 12 : 0, borderBottom: i < materialRecords.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{r.id}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                            {r.materials.map((m: any, idx: number) => (
                              <div key={idx} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                                • {m.materialType}: <b>{m.quantity} {m.unit}</b> {m.warpSubtype || m.jariType || ""}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: r.signatureCaptured ? T.green : "#8B6018", background: r.signatureCaptured ? "rgba(30,102,64,0.08)" : "rgba(200,155,71,0.08)", borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>
                            {r.signatureCaptured ? "✓ Signed" : "Pending"}
                          </span>
                          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>By {r.issuedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                    No materials issued to this weaver yet.
                  </div>
                )}
              </div>

              {/* Payments History */}
              <div>
                <SectionPill label="Payments History" />
                {weaverPayments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto", background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "16px 20px" }}>
                    {weaverPayments.map((p, i) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: i < weaverPayments.length - 1 ? 12 : 0, borderBottom: i < weaverPayments.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                        <div>
                          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{p.firmName}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>UTR: {p.utrNumber}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.green }}>₹{p.amountPaid.toLocaleString("en-IN")}</div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{p.paymentDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                    No payments history found.
                  </div>
                )}
              </div>
              </div>

              {/* Assigned Sarees Table */}
              <div>
                <SectionPill label="Assigned Sarees" />
                {assignedSarees.length > 0 ? (
                  <div style={{ overflowX: "auto", border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: T.warmCream }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>#</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Saree ID</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Batch ID</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Loom No.</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Saree Type</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Bulk Order</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>QC Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedSarees.map((row, idx) => {
                          let qcLabel = "In Production";
                          let qcBg = "rgba(139,112,96,0.08)";
                          let qcColorVal = T.taupe;

                          if (row.qcPassed === true) {
                            qcLabel = "QC Passed";
                            qcBg = "rgba(30,102,64,0.08)";
                            qcColorVal = T.green;
                          } else if (row.qcPassed === false) {
                            qcLabel = "QC Failed";
                            qcBg = "rgba(192,57,43,0.08)";
                            qcColorVal = T.crimson;
                          }

                          return (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)", borderBottom: `1px solid ${T.borderDef}` }}>
                              <td style={{ padding: "11px 12px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{idx + 1}</td>
                              <td style={{ padding: "11px 12px" }}>
                                {row.sareeId ? (
                                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "3px 8px" }}>
                                    {row.sareeId}
                                  </span>
                                ) : (
                                  <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 11 }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "11px 12px" }}>
                                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{row.batchId}</span>
                              </td>
                              <td style={{ padding: "11px 12px" }}>
                                {row.weaverLoom ? (
                                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: `1.5px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px" }}>
                                    Loom {row.weaverLoom}
                                  </span>
                                ) : (
                                  <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 12 }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "11px 12px" }}>
                                {row.sareeTypeCode ? (
                                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "3px 8px" }} title={row.sareeTypeName || ""}>
                                    {row.sareeTypeCode}
                                  </span>
                                ) : (
                                  <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 12 }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "11px 12px" }}>
                                <span style={{ fontFamily: F.ui, fontSize: 12, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600 }}>
                                  {row.bulkOrderLabel || "General Stock"}
                                </span>
                              </td>
                              <td style={{ padding: "11px 12px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: qcColorVal, background: qcBg, borderRadius: 99, padding: "4px 10px", whiteSpace: "nowrap" }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: qcColorVal }} />
                                  {qcLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                    No assigned sarees found for this weaver.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "batches" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionPill label="All Batches & Assigned Sarees" />
              <DateFilterBar filter={batchDateFilter} onChange={setBatchDateFilter} />
              {sortedAllWeaverBatches.length > 0 ? (
                sortedAllWeaverBatches.map(b => {
                  const weaverSareesInBatch = b.rows.filter(r => r.weaverId === weaver.id);
                  const completedSareesInBatch = weaverSareesInBatch.filter(r => r.qcPassed === true).length;
                  const pct = weaverSareesInBatch.length > 0 ? Math.round((completedSareesInBatch / weaverSareesInBatch.length) * 100) : 0;
                  const statusBg = b.status === "completed" ? "rgba(30,102,64,0.08)" : b.status === "active" ? "rgba(200,155,71,0.08)" : "rgba(139,112,96,0.08)";
                  const statusColor = b.status === "completed" ? T.green : b.status === "active" ? T.royalBurgundy : T.taupe;

                  return (
                    <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                      {/* Batch Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 11, background: statusBg, color: statusColor, borderRadius: 6, padding: "3px 8px", fontWeight: 700, textTransform: "uppercase" }}>{b.status}</span>
                        </div>
                        {b.dueDate && (
                          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                            Due Date: {b.dueDate}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>Progress: {completedSareesInBatch} of {weaverSareesInBatch.length} sarees done</span>
                        <span style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 700, color: T.antiqueGold }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }} />
                      </div>

                      {/* Saree Info Table */}
                      <div style={{ overflowX: "auto", border: `1px solid ${T.borderDef}`, borderRadius: 10, background: "#FFFFFF" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                          <thead>
                            <tr style={{ background: T.warmCream }}>
                              <th style={{ padding: "8px 10px", textAlign: "left", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Saree ID</th>
                              <th style={{ padding: "8px 10px", textAlign: "left", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Loom</th>
                              <th style={{ padding: "8px 10px", textAlign: "left", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Saree Type</th>
                              <th style={{ padding: "8px 10px", textAlign: "left", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Bulk Order</th>
                              <th style={{ padding: "8px 10px", textAlign: "left", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>QC Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {weaverSareesInBatch.map((row, idx) => {
                              let qcLabel = "In Production";
                              let qcBg = "rgba(139,112,96,0.08)";
                              let qcColorVal = T.taupe;

                              if (row.qcPassed === true) {
                                qcLabel = "QC Passed";
                                qcBg = "rgba(30,102,64,0.08)";
                                qcColorVal = T.green;
                              } else if (row.qcPassed === false) {
                                qcLabel = "QC Failed";
                                qcBg = "rgba(192,57,43,0.08)";
                                qcColorVal = T.crimson;
                              }

                              return (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)", borderBottom: `1px solid ${T.borderDef}` }}>
                                  <td style={{ padding: "9px 10px" }}>
                                    {row.sareeId ? (
                                      <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 5, padding: "2px 6px" }}>
                                        {row.sareeId}
                                      </span>
                                    ) : (
                                      <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 11 }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: "9px 10px" }}>
                                    {row.weaverLoom ? (
                                      <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 600, color: T.antiqueGold }}>
                                        L{row.weaverLoom}
                                      </span>
                                    ) : (
                                      <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 11 }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: "9px 10px" }}>
                                    {row.sareeTypeCode ? (
                                      <span style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown }}>
                                        {row.sareeTypeCode}
                                      </span>
                                    ) : (
                                      <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 11 }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: "9px 10px" }}>
                                    <span style={{ fontFamily: F.ui, fontSize: 11, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600 }}>
                                      {row.bulkOrderLabel || "General Stock"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "9px 10px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: qcColorVal, background: qcBg, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>
                                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: qcColorVal }} />
                                      {qcLabel}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                  No batch history found for this weaver.
                </div>
              )}
              <div style={{ fontFamily: F.ui, fontSize: 15, color: T.antiqueGold, cursor: "pointer", textAlign: "right", marginTop: 8 }} onClick={() => onNavigate?.("Production")}>See All Batches →</div>
            </div>
          )}

          {tab === "payments" && (
            <div>
              <SectionPill label="Payment Overview" />
              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown }}>Total Paid Ever</div>
                  <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.luxuryBrown }}>{weaver.totalPaid}</div>
                </div>
              </div>

              <SectionPill label="Payment History" />
              <DateFilterBar filter={paymentDateFilter} onChange={setPaymentDateFilter} />
              {filteredWeaverPayments.length === 0 ? (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" }}>
                  {weaverPayments.length === 0 ? "No payment records found. Payments appear here after Excel upload on the Payments page." : "No payments found for the selected period."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredWeaverPayments.map(p => (
                    <div key={p.id} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Amount Paid</div>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.green }}>₹{p.amountPaid.toLocaleString("en-IN")}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>UTR Number</div>
                        <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>{p.utrNumber}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Firm Name</div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{p.firmName}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Payment Date</div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{p.paymentDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "materials" && (
            <div>
              <SectionPill label="Materials Issued to This Weaver" />
              {materialRecords.length === 0 ? (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" }}>
                  No materials issued to this weaver yet. Use the Issue Material page to record material handovers.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {materialRecords.map(r => (
                    <div key={r.id} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 10px", fontWeight: 700 }}>{r.id}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                        {r.signatureCaptured ? (
                          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.green, display: "flex", alignItems: "center", gap: 5 }}><Check size={13} /> Signed</span>
                        ) : (
                          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "#8B6018", display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} /> Pending</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                        {r.materials.map((m, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" }}>
                            <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>
                              {m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}
                            </span>
                            {m.description && <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{m.description}</span>}
                            {m.materialType === "Jari" && <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{m.jariType} · {m.jariGrade} · {m.jariColor}</span>}
                            <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, marginLeft: "auto" }}>{m.quantity} {m.unit}</span>
                            <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: "rgba(139,112,96,0.10)", borderRadius: 5, padding: "2px 8px" }}>{m.grnBatchId}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Issued by {r.issuedBy}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "24px 32px", borderTop: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky", bottom: 0, display: "flex", gap: 16 }}>
          <motion.button onClick={() => setMode("edit")} whileHover={{ scale: 1.02 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "14px 0", fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            <Edit3 size={16} /> Edit Details
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 7 — LEADERBOARD & QC
// ══════════════════════════════════════════════════════════════════════════

const ACTIVITY_ICONS: Record<string, { PhIcon: React.ElementType; bg: string; color: string }> = {
  "📦": { PhIcon: Package, bg: "rgba(200,155,71,0.10)", color: T.antiqueGold },
  "✅": { PhIcon: CheckCircle, bg: "rgba(30,102,64,0.10)", color: T.green },
  "⚠️": { PhIcon: WarningCircle, bg: "rgba(192,57,43,0.09)", color: T.crimson },
  "💰": { PhIcon: Medal, bg: "rgba(110,15,45,0.07)", color: T.royalBurgundy },
  "🔄": { PhIcon: ChartBar, bg: "rgba(110,15,45,0.07)", color: T.royalBurgundy },
};

function LeaderboardAndQC({ onActivities, onNavigate }: { onActivities: () => void; onNavigate?: (tab: string) => void }) {
  const [reportOpen, setReportOpen] = useState(false);
  return (
    <div style={{ padding: "36px 48px 0" }}>

      {/* ── Row 1: Performance + QC side by side ── */}
      <FadeUp>
        <div id="weav-performance" style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden", marginBottom: 24 }}>

          {/* Dark section header */}
          <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Medal size={26} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Weaver Performance This Month</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Rankings by sarees produced · Quality check results</div>
              </div>
            </div>
            <motion.button onClick={() => setReportOpen(true)} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.22)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              <Download size={16} /> Download Full Report
            </motion.button>
          </div>

          {/* Two-column body */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>

            {/* ── Left: Leaderboard ── */}
            <div style={{ padding: "28px 32px", borderRight: `1px solid ${T.borderDef}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Medal size={20} color={T.antiqueGold} weight="fill" />
                </div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>Top Weavers This Month</div>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 24, paddingLeft: 48 }}>Ranked by number of sarees produced in May 2026</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {LEADERBOARD.map((l, i) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 0", borderBottom: i < LEADERBOARD.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none" }}>

                    {/* Rank badge */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: i === 0 ? "linear-gradient(135deg, #C89B47, #E7C983)" : i === 1 ? "rgba(139,112,96,0.15)" : "rgba(110,15,45,0.06)",
                      border: i === 0 ? "none" : `1px solid rgba(110,15,45,0.10)`,
                    }}>
                      <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: i === 0 ? "#FFFFFF" : i === 1 ? T.taupe : "rgba(110,15,45,0.45)" }}>{l.rank}</span>
                    </div>

                    {/* Avatar */}
                    <Avatar photo={l.photo} initials={l.initials} bg={l.bg} size={54} />

                    {/* Name + ID */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 3 }}>{l.name}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{l.id}</div>
                    </div>

                    {/* Stats */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>
                        {l.sarees}
                        <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, fontWeight: 400, marginLeft: 5 }}>sarees</span>
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 15, color: qcColor(l.rate), fontWeight: 700, marginTop: 4 }}>{l.rate}% pass rate</div>
                    </div>

                    {/* On-time badge */}
                    <div style={{ background: "rgba(30,102,64,0.09)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 8, padding: "6px 13px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green, flexShrink: 0 }}>
                      On Time
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: QC Results ── */}
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle size={20} color={T.green} weight="fill" />
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>Quality Check Results</div>
                  </div>
                  <span onClick={() => onNavigate?.("QcHistory")} style={{ fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = T.royalBurgundy}
                    onMouseLeave={e => e.currentTarget.style.color = T.antiqueGold}>
                    View Details →
                  </span>
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 28, paddingLeft: 48 }}>All sarees submitted for quality inspection this month</div>

                {/* Pie + legend */}
                <div style={{ display: "flex", alignItems: "center", gap: 36, marginBottom: 24 }}>
                  {/* Bigger donut — 210px */}
                  <div style={{ position: "relative", width: 210, height: 210, flexShrink: 0 }}>
                    <PieChart width={210} height={210}>
                      <Pie data={QC_DATA} cx={105} cy={105} innerRadius={76} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                        {QC_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <div style={{ fontFamily: F.display, fontSize: 42, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>248</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 5, textAlign: "center", lineHeight: 1.4 }}>sarees<br />this month</div>
                    </div>
                  </div>

                  {/* Legend — slimmer bars */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                    {QC_DATA.map(d => (
                      <div key={d.name}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 600 }}>{d.name}</span>
                          </div>
                          <span style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: d.color }}>{d.value}</span>
                        </div>
                        {/* Slim bar — 5px */}
                        <div style={{ height: 5, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.round((d.value / 248) * 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ height: "100%", background: d.color, borderRadius: 99 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rejection note */}
                <div style={{ background: "rgba(192,57,43,0.05)", border: "1px solid rgba(192,57,43,0.14)", borderRadius: 14, padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <WarningCircle size={18} color={T.crimson} weight="fill" />
                    <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.crimson }}>Most common rejection reasons</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, lineHeight: 1.6 }}>
                    Defective threads <strong style={{ color: T.crimson }}>6 sarees</strong> · Weight issue <strong style={{ color: T.crimson }}>4 sarees</strong>
                  </div>
                </div>
              </div>

              {/* Two mini-stat boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Pending Quality Checks", value: "12 sarees", color: T.antiqueGold, bg: "rgba(200,155,71,0.07)", border: "rgba(200,155,71,0.22)", PhIcon: Clock },
                  { label: "Overall Defect Rate", value: "4%", color: T.crimson, bg: "rgba(192,57,43,0.05)", border: "rgba(192,57,43,0.18)", PhIcon: WarningCircle },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                      <s.PhIcon size={18} color={s.color} weight="fill" />
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: s.color, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>{s.label}</div>
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </FadeUp>

      {/* ── Row 2: Weaver Activities (full width) ── */}
      <FadeUp delay={0.12}>
        <div id="weav-activities" style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.07)", overflow: "hidden" }}>

          {/* Header bar */}
          <div style={{ background: `linear-gradient(100deg, ${T.luxuryBrown} 0%, #5A3220 100%)`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChartBar size={24} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9" }}>Weaver Activities</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.60)", marginTop: 2 }}>Recent actions, batch updates, and payment events</div>
              </div>
            </div>
            <motion.button onClick={onActivities} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.20)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              <Bell size={16} /> View All Activities
            </motion.button>
          </div>

          {/* Activities grid — 5 columns, one per activity */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0 }}>
            {ACTIVITIES.map((a, i) => {
              const cfg = ACTIVITY_ICONS[a.icon] ?? { PhIcon: ChartBar, bg: "rgba(110,15,45,0.07)", color: T.taupe };
              const PhIcon = cfg.PhIcon as React.ElementType;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ background: "rgba(247,242,234,0.70)" }}
                  style={{
                    padding: "28px 26px",
                    borderRight: i < ACTIVITIES.length - 1 ? `1px solid rgba(110,15,45,0.08)` : "none",
                    display: "flex", flexDirection: "column", gap: 14,
                    background: i % 2 === 1 ? "rgba(247,242,234,0.30)" : "#FFFFFF",
                    cursor: "default",
                  }}
                >
                  {/* Icon box + time */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PhIcon size={22} color={cfg.color} weight="fill" />
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, paddingTop: 4 }}>{a.time}</span>
                  </div>

                  {/* Action title */}
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown, lineHeight: 1.3, flex: 1 }}>{a.action}</div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </FadeUp>

      <ActionDialog open={reportOpen} title="Download weaver performance report" onClose={() => setReportOpen(false)}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.6 }}><FileText size={34} color={T.royalBurgundy} /><div><b>May 2026 full report is ready.</b><br />Includes leaderboard, QC pass/reject summary, pending dues, and batch-wise production.</div></div>
        <button onClick={() => setReportOpen(false)} style={{ marginTop: 22, width: "100%", background: T.royalBurgundy, color: "#fff", border: "none", borderRadius: 12, padding: 14, fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}><Download size={16} /> Download PDF</button>
      </ActionDialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 9 — NEW WEAVER MODAL
// ══════════════════════════════════════════════════════════════════════════
function NewWeaverModal({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
  const fieldStyle: React.CSSProperties = { width: "100%", height: 48, padding: "0 16px", fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 8 };

  return (
    <div style={expanded ? { position: "fixed", inset: 0, zIndex: 1250, background: "rgba(26,10,15,0.42)", backdropFilter: "blur(4px)", padding: "32px 48px", overflowY: "auto" } : { padding: "40px 48px", paddingBottom: 80 }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: "32px", boxShadow: expanded ? "0 30px 90px rgba(0,0,0,0.25)" : "0 8px 32px rgba(74,6,27,0.06)", maxWidth: 900, margin: expanded ? "24px auto" : "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: F.display, fontSize: 28, color: T.luxuryBrown, margin: 0 }}>Add a New Weaver</h2>
            {!expanded && <motion.button onClick={() => setExpanded(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Open Form</motion.button>}
            {expanded && <button onClick={() => setExpanded(false)} style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, background: "none", border: "none", cursor: "pointer" }}>Cancel ×</button>}
          </div>

          {!expanded ? (
            <motion.button onClick={() => setExpanded(true)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              style={{ width: "100%", height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#FFFDF9", border: "none", borderRadius: 14, fontFamily: F.ui, fontSize: 18, fontWeight: 600, cursor: "pointer", background: `linear-gradient(135deg, ${T.royalBurgundy}, ${T.deepWine})` }}>
              <Plus size={20} /> Register New Weaver
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: F.display, fontSize: 28, color: T.luxuryBrown, marginBottom: 8 }}>New Weaver Registration</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, marginBottom: 32 }}>Fill in all the details below. Fields marked with * are required.</div>

              {/* ── Photo Upload ── */}
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>Photo of Weaver *</label>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14, marginTop: -4 }}>Upload a clear photo for easy identification. Appears on profile and batch records.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%",
                    border: "2px dashed rgba(110,15,45,0.25)",
                    background: "rgba(110,15,45,0.04)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                  }}>
                    <Camera size={28} color="rgba(110,15,45,0.35)" strokeWidth={1.5} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(110,15,45,0.45)", marginTop: 8, fontWeight: 600 }}>Upload Photo</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                    JPG or PNG · Max 5MB · Mandatory
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                {/* First / Last name split */}
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input style={fieldStyle} placeholder="First name" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input style={fieldStyle} placeholder="Last name" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: -16, marginBottom: 20 }}>
                    The weaver will be identified by their first name in all batch IDs and saree records.
                  </div>
                </div>
                {/* Email */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>
                    Email ID *
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 400, color: T.taupe, marginLeft: 8 }}>Used for records and notifications.</span>
                  </label>
                  <input style={fieldStyle} type="email" placeholder="weaver@example.com" />
                </div>
                <div><label style={labelStyle}>Mobile Number *</label><input style={fieldStyle} placeholder="10-digit mobile number" /></div>
                <div><label style={labelStyle}>Village / Area *</label><input style={fieldStyle} placeholder="E.g., Dharmavaram, AP" /></div>
                <div><label style={labelStyle}>Number of Looms *</label><input style={fieldStyle} type="number" placeholder="Total active looms" /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Full Address</label><input style={fieldStyle} placeholder="Complete postal address" /></div>
              </div>

              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 18, color: T.luxuryBrown, marginBottom: 20, paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
                Bank Account Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                <div><label style={labelStyle}>Bank Name</label><input style={fieldStyle} placeholder="E.g., State Bank of India" /></div>
                <div><label style={labelStyle}>Account Holder Name</label><input style={fieldStyle} placeholder="Name as per bank" /></div>
                <div><label style={labelStyle}>Account Number</label><input style={fieldStyle} placeholder="Account number" /></div>
                <div><label style={labelStyle}>IFSC Code</label><input style={fieldStyle} placeholder="11-character IFSC code" /></div>
              </div>

              <div style={{ display: "flex", gap: 16, justifyContent: "flex-end", borderTop: `1px solid ${T.borderDef}`, paddingTop: 32 }}>
                <motion.button onClick={() => setExpanded(false)} whileHover={{ scale: 1.02 }}
                  style={{ width: 140, height: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.taupe, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }}
                  style={{ width: 240, height: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer", background: T.royalBurgundy }}>
                  Save Weaver
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer style={{ background: T.luxuryBrown, color: "#FFFDF9", padding: "64px 48px 48px", marginTop: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 64, flexWrap: "wrap", gap: 40 }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", background: "#FFFDF9", padding: 4 }}>
              <img src={imgBKBLogo} alt="BKB" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9", lineHeight: 1.2 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9", lineHeight: 1.2 }}>&amp; Brothers Silks</div>
            </div>
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.50)", lineHeight: 1.6, marginBottom: 24, maxWidth: 300 }}>Managing our weavers and preserving the art of traditional Indian silk weaving since 1999.</div>
          <div style={{ display: "flex", gap: 16 }}>
            {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
              <motion.a key={i} href="#" whileHover={{ y: -3, color: T.antiqueGold }} style={{ color: "rgba(255,253,249,0.50)", transition: "color 0.2s" }}>
                <Icon size={20} />
              </motion.a>
            ))}
          </div>
        </div>
        {[
          { title: "Dashboard", links: ["Overview", "Materials", "Weavers", "Production", "History"] },
          { title: "Management", links: ["Payments", "Reports", "Customers", "Settings", "Help"] },
        ].map(c => (
          <div key={c.title} style={{ minWidth: 140 }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>{c.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {c.links.map(l => (
                <motion.span key={l} whileHover={{ x: 3 }} style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.55)", cursor: "pointer", display: "block" }}>{l}</motion.span>
              ))}
            </div>
          </div>
        ))}
        <div style={{ minWidth: 240 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>Need Help?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Phone size={16} color={T.antiqueGold} /><span style={{ fontFamily: F.mono, fontSize: 15, color: "rgba(255,253,249,0.70)" }}>+91 70428 78199</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Mail size={16} color={T.antiqueGold} /><span style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.70)" }}>Admin@beerekeshava.in</span></div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.35)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Newsletter</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Email address"
              style={{ fontFamily: F.ui, fontSize: 15, color: "#FFFDF9", background: "rgba(255,253,249,0.07)", border: "1px solid rgba(255,253,249,0.14)", borderRadius: 12, padding: "12px 16px", outline: "none", width: "100%", boxSizing: "border-box" }} />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ background: T.antiqueGold, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "12px 24px", fontFamily: F.ui, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
              Subscribe
            </motion.button>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,253,249,0.1)", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.35)" }}>© 2026 Beere Kesava &amp; Brothers Silks. All rights reserved.</div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,253,249,0.25)", letterSpacing: "2px", textTransform: "uppercase" }}>TRADITION · TIMELESS QUALITY</div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════
export function WeaversPage({ onNavigate }: { onNavigate?: (tab: string, ctx?: any) => void } = {}) {
  const location = useLocation();
  const navState = location.state as { weaverId?: string; mode?: "view" | "edit" } | null;
  const initialSelected = navState?.weaverId ? WEAVERS.find(w => w.id === navState.weaverId) || null : null;

  const [view, setView] = useState("card");
  const [filter, setFilter] = useState("All Weavers");
  const [search, setSearch] = useState("");
  const [selectedWeaver, setSelectedWeaver] = useState<typeof WEAVERS[0] | null>(initialSelected);
  const [newWeaverExpanded, setNewWeaverExpanded] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">(navState?.mode === "edit" ? "edit" : "view");
  const [batchDialog, setBatchDialog] = useState<typeof WEAVERS[0] | null>(null);
  const { batches } = useBatches();

  if (selectedWeaver) {
    return (
      <WeaverDrawer weaver={selectedWeaver} initialMode={drawerMode} onClose={() => setSelectedWeaver(null)} onNavigate={onNavigate} />
    );
  }

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PageHeader />
      <StatsStrip />
      <WarpRequestsSection />
      <AllWeaversControls view={view} setView={setView} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onAddWeaver={() => setNewWeaverExpanded(true)} onViewAll={() => onNavigate?.("AllWeavers")} />
      <WeaverDirectory view={view} onSelect={(w) => { setDrawerMode("view"); setSelectedWeaver(w); }} onEdit={(w) => { setDrawerMode("edit"); setSelectedWeaver(w); }} onBatches={setBatchDialog} />
      <LeaderboardAndQC onActivities={() => onNavigate?.("Notifications")} onNavigate={onNavigate} />
      <NewWeaverModal expanded={newWeaverExpanded} setExpanded={setNewWeaverExpanded} />
      <Footer />

      <AnimatePresence>
        {batchDialog && (() => {
          const weaverCompletedBatches = batches.filter(b => 
            b.status === "completed" && 
            b.rows.some(r => r.weaverId === batchDialog.id)
          );
          
          const getBatchNum = (id: string) => {
            const match = id.match(/BATCH-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          };
          const sorted = [...weaverCompletedBatches].sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));

          return (
            <ActionDialog open={!!batchDialog} title={`${batchDialog.name} Completed Batches`} onClose={() => setBatchDialog(null)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 350, overflowY: "auto" }}>
                {sorted.length > 0 ? (
                  sorted.map(b => {
                    const totalSarees = b.rows.filter(r => r.weaverId === batchDialog.id).length;
                    const distinctDesigns = Array.from(new Set(b.rows.filter(r => r.weaverId === batchDialog.id && r.designCode).map(r => r.designCode).filter(Boolean))).join(", ") || "—";
                    return (
                      <div key={b.batchId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, border: `1px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui }}>
                        <span>
                          <b>{b.batchId}</b> · Design: {distinctDesigns}
                        </span>
                        <span style={{ color: T.taupe }}>
                          {totalSarees} sarees · Due: {b.dueDate || "—"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 14, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontStyle: "italic" }}>
                    No completed batches found.
                  </div>
                )}
              </div>
            </ActionDialog>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
