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
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../../../app/constants/weaverImages";
import { useWeaverPayments } from "../../../app/components/WeaverPaymentsContext";
import { useMaterialIssue } from "../../materials/contexts/MaterialIssueContext";
import { useBatches } from "../../production/contexts/BatchContext";
import { useBulkOrders } from "../../bulk-orders/contexts/BulkOrderContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../app/components/DateFilterBar";
import { DownloadGate, useDownloadsAllowed } from "../../../app/components/DownloadAccess";
import { useDesignLibrary, DispatchRecord } from "../../../app/components/DesignLibraryContext";
import { DispatchDetailsModal } from "../../../app/components/BatchCreationPage";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { WeaverSareesSection } from "../../../app/components/WeaverSareesSection";
import * as XLSX from "xlsx";
import { UploadSimple } from "@phosphor-icons/react";
const imgHeaderBg = "https://images.unsplash.com/photo-1669556289350-0e2480fe190e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import { imgBKLogo as imgBKBLogo } from "../../../app/constants/weaverImages";

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
// Each row is one thing that happened. `needsAction` marks the ones that sit
// in your queue rather than just being FYI — that's the distinction that was
// missing before: everything looked the same regardless of whether it wanted
// a decision from you or was just a record of something already finished.
const ACTIVITIES = [
  { icon: "⚠️", category: "Material", action: "Material request pending", detail: "Suresh Murti (WV-007) requested 4 kg Warp — awaiting your approval", time: "Today", needsAction: true, weaverId: "WV-007" },
  { icon: "✅", category: "Quality Check", action: "Quality check submitted", detail: "Padma Veni (WV-002) submitted 18 sarees — 17 passed, 1 rejected", time: "Yesterday", needsAction: false, weaverId: "WV-002" },
  { icon: "📦", category: "Batch", action: "New batch issued", detail: "BATCH-089 given to Ravi Kumar (WV-001) — extra sarees for the Lakshmi Silks order", time: "2 hours ago", needsAction: false, weaverId: "WV-001" },
  { icon: "🔄", category: "Batch", action: "Batch completed", detail: "Kamala B. (WV-031) completed BATCH-084 — 14 sarees woven, all passed quality check", time: "3 days ago", needsAction: false, weaverId: "WV-031" },
  { icon: "💰", category: "Payment", action: "Payment processed", detail: "Monthly making charges disbursed to 84 weavers — ₹4.2L total paid this month", time: "2 days ago", needsAction: false },
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
function AllWeaversControls({ view, setView, filter, setFilter, search, setSearch, onAddWeaver, onViewAll, onImport }: {
  view: string; setView: (v: string) => void; filter: string; setFilter: (f: string) => void; search: string; setSearch: (s: string) => void; onAddWeaver: () => void; onViewAll: () => void; onImport: () => void;
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
            onClick={onImport}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 14, padding: "14px 22px", fontFamily: F.ui, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            <UploadSimple size={20} /> Import from Excel
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
function WeaverCardGrid({ onSelect, onEdit, onBatches, extraWeavers = [] }: { onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  const [showAll, setShowAll] = useState(false);
  const allWeavers = [...WEAVERS, ...extraWeavers];
  const visible = showAll ? allWeavers : allWeavers.slice(0, 4);
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
function WeaverListView({ onSelect, extraWeavers = [] }: { onSelect: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  const [showAll, setShowAll] = useState(false);
  const allWeavers = [...WEAVERS, ...extraWeavers];
  const visible = showAll ? allWeavers : allWeavers.slice(0, 5);
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
function WeaverDirectory({ view, onSelect, onEdit, onBatches, extraWeavers = [] }: { view: string; onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  return (
    <div style={{ padding: "24px 48px 0" }}>
      <FadeUp>
        {view === "card" && <WeaverCardGrid onSelect={onSelect} onEdit={onEdit} onBatches={onBatches} extraWeavers={extraWeavers} />}
        {view === "list" && <WeaverListView onSelect={onSelect} extraWeavers={extraWeavers} />}
        {view === "table" && <WeaverTableView onSelect={id => { const w = [...WEAVERS, ...extraWeavers].find(x => x.id === id); if (w) onSelect(w); }} />}
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
  const [dispatchDateFilter, setDispatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [zoomImage, setZoomImage] = useState<{ url: string; label: string } | null>(null);
  const { getPaymentsForWeaver } = useWeaverPayments();
  const { getRecordsForWeaver, getMaterialSummaryByBatch } = useMaterialIssue();
  const { batches } = useBatches();
  const { bulkOrders } = useBulkOrders();
  const { dispatches } = useDesignLibrary();
  const [viewDispatches, setViewDispatches] = useState<{ weaverName: string; records: DispatchRecord[] } | null>(null);
  if (!weaver) return null;
  const weaverPayments = getPaymentsForWeaver(weaver.id);
  const materialRecords = getRecordsForWeaver(weaver.id);
  const materialByBatch = getMaterialSummaryByBatch(weaver.id);
  const cfg = STATUS_CFG[weaver.status];

  // Active batches the weaver is working on
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

  // Design dispatches sent to this weaver, grouped by batch
  const weaverDispatches = dispatches.filter(d => d.recipientType === "weaver" && d.recipientId === weaver.id && matchesDateFilter(d.sentAt, dispatchDateFilter));
  const dispatchGroups: { batchId: string; records: DispatchRecord[] }[] = [];
  weaverDispatches.forEach(d => {
    const batchIds = d.batches.length > 0 ? d.batches : ["No batch linked"];
    batchIds.forEach(bId => {
      let group = dispatchGroups.find(g => g.batchId === bId);
      if (!group) { group = { batchId: bId, records: [] }; dispatchGroups.push(group); }
      group.records.push(d);
    });
  });
  dispatchGroups.sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));
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
            { key: "dispatches", label: "Design Dispatches", icon: <PaperPlaneTilt size={16} /> },
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

              {/* Sarees — Assigned / Produced / QC / Finishing / Sold / Outstanding */}
              <div>
                <SectionPill label="Sarees" />
                <WeaverSareesSection weaverId={weaver.id} weaverName={weaver.name} />
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
                  const batchDispatches = dispatches.filter(d => d.recipientType === "weaver" && d.recipientId === weaver.id && d.batches.includes(b.batchId));
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
                              <th style={{ padding: "8px 10px", textAlign: "left", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>Design Dispatch</th>
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
                                    {idx === 0 && batchDispatches.length > 0 ? (
                                      <button onClick={() => setViewDispatches({ weaverName: weaver.name, records: batchDispatches })}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                                        <PaperPlaneTilt size={11} weight="bold" /> {batchDispatches.length} Dispatch{batchDispatches.length > 1 ? "es" : ""}
                                      </button>
                                    ) : (
                                      <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 11 }}>—</span>
                                    )}
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

          {tab === "dispatches" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionPill label="Design Dispatches Sent to This Weaver" />
              <DateFilterBar filter={dispatchDateFilter} onChange={setDispatchDateFilter} />
              {dispatchGroups.length > 0 ? (
                dispatchGroups.map(group => (
                  <div key={group.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{group.batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{group.records.length} dispatch{group.records.length > 1 ? "es" : ""}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {group.records.map(h => (
                        <div key={h.id} style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{h.id}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                              <Calendar size={12} /> Sent on {h.sentAt}
                            </div>
                          </div>
                          <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid rgba(110,15,45,0.06)`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.5 }}>
                            <strong>Instructions:</strong> {h.instructions}
                          </div>
                          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" as const }}>
                            {h.colorSlipImage && (
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                                <img src={h.colorSlipImage} alt="Color slip"
                                  onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — ${h.id}` })}
                                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                              </div>
                            )}
                            {h.designGraphImage && (
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                                <img src={h.designGraphImage} alt="Design graph"
                                  onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — ${h.id}` })}
                                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                              </div>
                            )}
                            {!h.colorSlipImage && !h.designGraphImage && (
                              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontStyle: "italic" }}>No files attached</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                  No design dispatches found for this weaver.
                </div>
              )}
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
              <SectionPill label="Materials Issued — Batch Wise" />
              {materialRecords.length === 0 ? (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" }}>
                  No materials issued to this weaver yet. Use the Issue Material page to record material handovers.
                </div>
              ) : (() => {
                const fmtKg = (g: number) => `${(g / 1000).toFixed(2)} kg`;
                const recordsByBatch = new Map<string, typeof materialRecords>();
                materialRecords.forEach(r => {
                  const key = r.batchId || "Unassigned";
                  if (!recordsByBatch.has(key)) recordsByBatch.set(key, []);
                  recordsByBatch.get(key)!.push(r);
                });
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {materialByBatch.map(b => {
                      const outColor = b.outstandingGrams > 0 ? T.crimson : T.green;
                      const records = recordsByBatch.get(b.batchId) ?? [];
                      return (
                        <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
                          {/* Batch header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, flexWrap: "wrap", gap: 10 }}>
                            <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 7, padding: "5px 12px" }}>{b.batchId}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{b.sareesReceived} saree{b.sareesReceived !== 1 ? "s" : ""} returned</span>
                          </div>

                          {/* Stats strip — issued / returned / outstanding */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${T.borderDef}` }}>
                            {[
                              { label: "Issued", value: fmtKg(b.issuedGrams), sub: b.jariReels > 0 ? `incl. ${b.jariReels} jari reels` : undefined, color: T.luxuryBrown },
                              { label: "Returned", value: fmtKg(b.receivedGrams), sub: undefined, color: T.green },
                              { label: "Outstanding", value: fmtKg(b.outstandingGrams), sub: "still with weaver", color: outColor },
                            ].map((s, i) => (
                              <div key={s.label} style={{ padding: "14px 22px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
                                <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                                <div style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                                {s.sub && <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3 }}>{s.sub}</div>}
                              </div>
                            ))}
                          </div>

                          {/* Individual handover records for this batch */}
                          <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                            {records.map(r => (
                              <div key={r.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 9px", fontWeight: 700 }}>{r.id}</span>
                                    <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                  </div>
                                  {r.signatureCaptured ? (
                                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 5 }}><Check size={12} /> Signed</span>
                                  ) : (
                                    <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> Pending</span>
                                  )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
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
                                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Issued by {r.issuedBy}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div style={{ padding: "24px 32px", borderTop: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky", bottom: 0, display: "flex", gap: 16 }}>
          <motion.button onClick={() => setMode("edit")} whileHover={{ scale: 1.02 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "14px 0", fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            <Edit3 size={16} /> Edit Details
          </motion.button>
        </div>
      </motion.div>
      <AnimatePresence>
        {viewDispatches && <DispatchDetailsModal key="dd" weaverName={viewDispatches.weaverName} records={viewDispatches.records} onClose={() => setViewDispatches(null)} />}
        {zoomImage && (
          <motion.div key="zoom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(20,4,10,0.85)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, cursor: "zoom-out" }}>
            <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
            <span style={{ fontFamily: F.ui, fontSize: 13, color: "#fff", fontWeight: 600 }}>{zoomImage.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION 7 — LEADERBOARD & QC
// ══════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════
// SECTION 8B — WEAVER ANALYTICS
// ══════════════════════════════════════════════════════════════════════════
// The card + table views hold different slices of the roster; analytics needs
// the union, so both sources are merged on weaver id.
interface AnalyticsWeaver {
  id: string; name: string; village: string; cluster: string; looms: number;
  status: Status; thisMonth: number; passRate: number; totalEver: number;
  totalPaid: number; photo: string | null; initials: string; bg: string;
}

const ANALYTICS_WEAVERS: AnalyticsWeaver[] = (() => {
  const toNum = (s: string | number) => typeof s === "number" ? s : parseFloat(String(s).replace(/[₹,]/g, "")) || 0;
  const byId = new Map<string, AnalyticsWeaver>();
  const add = (w: any) => {
    if (byId.has(w.id)) return;
    const village: string = w.village;
    byId.set(w.id, {
      id: w.id, name: w.name, village,
      cluster: village.split(",")[0].trim(),
      looms: w.looms, status: w.status, thisMonth: w.thisMonth, passRate: w.passRate,
      totalEver: toNum(w.totalEver), totalPaid: toNum(w.totalPaid),
      photo: w.photo ?? null,
      initials: w.initials ?? w.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
      bg: w.bg ?? "#5A3E6B",
    });
  };
  WEAVERS.forEach(add);
  TABLE_ROWS.forEach(add);
  return [...byId.values()];
})();

const WA_MONTHS = 18;
const WA_END = new Date(2026, 4, 31); // May 2026 — the "this month" the page reports on
const WA_MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ProductionRow { weaverId: string; date: string; produced: number; passed: number; payout: number; }

// Monthly production history, seeded per weaver so the numbers are stable
// across renders and the current month matches the weaver's `thisMonth`.
const PRODUCTION_LEDGER: ProductionRow[] = (() => {
  const rows: ProductionRow[] = [];
  ANALYTICS_WEAVERS.forEach(w => {
    const seed = w.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = w.thisMonth > 0 ? w.thisMonth : Math.max(3, Math.round(w.totalEver / 300));
    const ratePerSaree = w.totalEver ? w.totalPaid / w.totalEver : 450;
    for (let i = 0; i < WA_MONTHS; i++) {
      const d = new Date(WA_END.getFullYear(), WA_END.getMonth() - i, 15);
      // i === 0 is the current month: report the weaver's actual figure.
      const wobble = 0.65 + (Math.sin((i + 1) * 7.233 + seed) * 0.5 + 0.5) * 0.7;
      const produced = i === 0 ? w.thisMonth : Math.max(0, Math.round(base * wobble));
      const passed = Math.round(produced * (w.passRate / 100));
      rows.push({
        weaverId: w.id,
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`,
        produced, passed,
        payout: Math.round(passed * ratePerSaree),
      });
    }
  });
  return rows;
})();

const STATUS_MIX_META: Record<Status, { label: string; color: string }> = {
  active: { label: "Currently Weaving", color: T.green },
  qc: { label: "Awaiting Quality Check", color: T.antiqueGold },
  idle: { label: "No Active Batch", color: T.taupe },
};
const CLUSTER_FILLS = [T.royalBurgundy, T.antiqueGold, T.green, "#5A3E6B", "#2D6B6B", "#8A2440"];

function WeaverAnalytics() {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const rows = React.useMemo(
    () => PRODUCTION_LEDGER.filter(r => matchesDateFilter(r.date, filter)),
    [filter]
  );

  const periodLabel = React.useMemo(() => {
    if (filter.mode === "day" && filter.day) return new Date(filter.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (filter.mode === "range") return `${filter.from || "start"} → ${filter.to || "today"}`;
    if (filter.mode === "month" && filter.month) { const [y, m] = filter.month.split("-"); return `${WA_MONTH_ABBR[+m - 1]} ${y}`; }
    if (filter.mode === "year" && filter.year) return filter.year;
    return "All time";
  }, [filter]);

  // Per-weaver rollup for the selected period.
  const perWeaver = React.useMemo(() => {
    const m = new Map<string, { produced: number; passed: number; payout: number }>();
    rows.forEach(r => {
      const e = m.get(r.weaverId) || { produced: 0, passed: 0, payout: 0 };
      e.produced += r.produced; e.passed += r.passed; e.payout += r.payout;
      m.set(r.weaverId, e);
    });
    return ANALYTICS_WEAVERS.map(w => {
      const agg = m.get(w.id) || { produced: 0, passed: 0, payout: 0 };
      return {
        ...w, ...agg,
        periodPassRate: agg.produced ? Math.round((agg.passed / agg.produced) * 100) : 0,
        perLoom: w.looms ? agg.produced / w.looms : 0,
      };
    }).filter(w => w.produced > 0);
  }, [rows]);

  const totalProduced = perWeaver.reduce((a, w) => a + w.produced, 0);
  const totalPassed = perWeaver.reduce((a, w) => a + w.passed, 0);
  const totalPayout = perWeaver.reduce((a, w) => a + w.payout, 0);
  const totalLooms = perWeaver.reduce((a, w) => a + w.looms, 0);
  const overallPassRate = totalProduced ? Math.round((totalPassed / totalProduced) * 100) : 0;

  const top10 = React.useMemo(
    () => [...perWeaver].sort((a, b) => b.produced - a.produced).slice(0, 10)
      .map(w => ({ ...w, short: w.name.length > 16 ? w.name.slice(0, 15) + "…" : w.name })),
    [perWeaver]
  );

  const monthly = React.useMemo(() => {
    const m = new Map<string, { produced: number; passed: number }>();
    rows.forEach(r => {
      const key = r.date.slice(0, 7);
      const e = m.get(key) || { produced: 0, passed: 0 };
      e.produced += r.produced; e.passed += r.passed;
      m.set(key, e);
    });
    const all = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, v]) => ({
      month: `${WA_MONTH_ABBR[+key.slice(5) - 1]} ${key.slice(2, 4)}`,
      ...v,
      rate: v.produced ? Math.round((v.passed / v.produced) * 100) : 0,
    }));
    return all.length > 12 ? all.slice(-12) : all;
  }, [rows]);

  const trendDelta = React.useMemo(() => {
    if (monthly.length < 2) return null;
    const a = monthly[monthly.length - 1].produced, b = monthly[monthly.length - 2].produced;
    return b ? Math.round(((a - b) / b) * 100) : null;
  }, [monthly]);

  const statusMix = React.useMemo(() => (["active", "qc", "idle"] as Status[])
    .map(s => ({
      name: STATUS_MIX_META[s].label,
      value: perWeaver.filter(w => w.status === s).length,
      color: STATUS_MIX_META[s].color,
    }))
    .filter(d => d.value > 0), [perWeaver]);

  const byCluster = React.useMemo(() => {
    const m = new Map<string, { produced: number; weavers: number }>();
    perWeaver.forEach(w => {
      const e = m.get(w.cluster) || { produced: 0, weavers: 0 };
      e.produced += w.produced; e.weavers += 1;
      m.set(w.cluster, e);
    });
    return [...m.entries()]
      .map(([cluster, v], i) => ({ cluster, ...v, fill: CLUSTER_FILLS[i % CLUSTER_FILLS.length] }))
      .sort((a, b) => b.produced - a.produced);
  }, [perWeaver]);

  const loomProductivity = React.useMemo(
    () => [...perWeaver].sort((a, b) => b.perLoom - a.perLoom).slice(0, 8)
      .map(w => ({ ...w, short: w.initials, perLoomR: Math.round(w.perLoom * 10) / 10 })),
    [perWeaver]
  );
  const avgPerLoom = totalLooms ? totalProduced / totalLooms : 0;

  // Output vs quality — ranked bars beat a scatter plot here: a longer bar is
  // simply more sarees, and the colour alone tells you the quality band, so
  // there's nothing to decode across two axes plus a bubble size.
  const qualityVsOutput = React.useMemo(
    () => [...perWeaver].sort((a, b) => b.produced - a.produced).slice(0, 8),
    [perWeaver]
  );
  const maxOutput = Math.max(1, ...qualityVsOutput.map(w => w.produced));
  const atRisk = perWeaver.filter(w => w.periodPassRate < 92).length;
  const idleCount = perWeaver.filter(w => w.status === "idle").length;

  const card: React.CSSProperties = {
    background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`,
    boxShadow: "0 6px 32px rgba(74,6,27,0.07)", padding: "24px 28px",
  };
  const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown };
  const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 3 };
  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };
  const L = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

  return (
    <div style={{ padding: "36px 48px 0" }}>
      <FadeUp>
        {/* Section heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Weaver Analytics</h2>
          <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "1px", color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        </div>

        {/* Timeline scope — drives every chart below */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "SAREES WOVEN", value: totalProduced.toLocaleString("en-IN"), color: T.royalBurgundy },
              { label: "QC PASS RATE", value: `${overallPassRate}%`, color: qcColor(overallPassRate) },
              { label: "MAKING CHARGES", value: L(totalPayout), color: T.luxuryBrown },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {perWeaver.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <ChartBar size={40} color={T.taupe} />
          <div style={{ fontFamily: F.display, fontSize: 17, color: T.taupe, marginTop: 12 }}>No weaving recorded in this period.</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Widen the date range to see analytics.</div>
        </div>
      ) : (
        <>
          {/* ── Row 1: production trend + workforce status ── */}
          <FadeUp delay={0.04}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <div style={cardTitle}>Sarees Produced vs Passed</div>
                    <div style={cardSub}>Monthly output against quality-check outcomes</div>
                  </div>
                  {trendDelta !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: trendDelta >= 0 ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", padding: "5px 11px", borderRadius: 20 }}>
                      <ChartBar size={13} color={trendDelta >= 0 ? T.green : T.crimson} weight="fill" />
                      <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: trendDelta >= 0 ? T.green : T.crimson }}>{trendDelta >= 0 ? "+" : ""}{trendDelta}% vs prev month</span>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "10px 0 4px" }}>
                  {totalProduced.toLocaleString("en-IN")}
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={monthly} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={34} />
                    <YAxis yAxisId="r" orientation="right" domain={[60, 100]} hide />
                    <RechartsTooltip contentStyle={tip} formatter={(v: any, n: any) => n === "Pass Rate" ? [`${v}%`, n] : [`${v} sarees`, n]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
                    <Bar name="Produced" dataKey="produced" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} />
                    <Bar name="Passed QC" dataKey="passed" fill={T.goldLight} radius={[5, 5, 0, 0]} />
                    <Line yAxisId="r" name="Pass Rate" dataKey="rate" stroke={T.green} strokeWidth={2.5} dot={{ r: 3.5, fill: T.green, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div style={card}>
                <div style={cardTitle}>Workforce Status</div>
                <div style={cardSub}>Weavers active in this period</div>
                <div style={{ position: "relative", marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height={172}>
                    <PieChart>
                      <Pie data={statusMix} dataKey="value" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} stroke="none">
                        {statusMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={tip} formatter={(v: any) => [`${v} weavers`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{perWeaver.length}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3 }}>weavers</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {statusMix.map(d => (
                    <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{d.name}</span>
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.luxuryBrown }}>{d.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 14, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span>Looms engaged</span>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>{totalLooms}</span>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* ── Row 2: top 10 leaderboard + cluster contribution ── */}
          <FadeUp delay={0.08}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Medal size={20} color={T.antiqueGold} weight="fill" />
                    </div>
                    <div>
                      <div style={cardTitle}>Top 10 Weavers by Output</div>
                      <div style={cardSub}>Sarees woven in {periodLabel.toLowerCase()} · bar colour shows QC pass rate</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {[{ c: T.green, t: "≥95%" }, { c: "#8B6018", t: "85–94%" }, { c: T.crimson, t: "<85%" }].map(g => (
                      <div key={g.t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 3, background: g.c }} />
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{g.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart data={top10} layout="vertical" barSize={19} margin={{ left: 4, right: 62 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="short" width={116} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${v} sarees · ${p.payload.periodPassRate}% pass · ${L(p.payload.payout)} earned`, p.payload.name]} />
                    <Bar dataKey="produced" radius={[0, 6, 6, 0]}
                      label={{ position: "right", formatter: (v: any) => `${v}`, fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, fill: T.luxuryBrown }}>
                      {top10.map(w => <Cell key={w.id} fill={qcColor(w.periodPassRate)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Podium strip */}
                <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16, marginTop: 6 }}>
                  {top10.slice(0, 3).map((w, i) => (
                    <div key={w.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: i === 0 ? "rgba(200,155,71,0.08)" : T.silkCream, border: `1px solid ${i === 0 ? T.borderGold : T.borderDef}`, borderRadius: 14, padding: "12px 14px" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: i === 0 ? "linear-gradient(135deg,#C89B47,#E7C983)" : "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 15, fontWeight: 700, color: i === 0 ? "#FFF" : T.taupe }}>{i + 1}</div>
                      <Avatar photo={w.photo} initials={w.initials} bg={w.bg} size={36} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{w.produced} sarees · {totalProduced ? Math.round((w.produced / totalProduced) * 100) : 0}% of output</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <PhMapPin size={18} color={T.royalBurgundy} weight="fill" />
                  <div style={cardTitle}>Output by Cluster</div>
                </div>
                <div style={cardSub}>Which weaving villages carry production</div>
                <ResponsiveContainer width="100%" height={186}>
                  <PieChart>
                    <Pie data={byCluster} dataKey="produced" nameKey="cluster" cx="50%" cy="50%" innerRadius={44} outerRadius={74} paddingAngle={3} stroke="none">
                      {byCluster.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [`${v} sarees · ${p.payload.weavers} weavers`, p.payload.cluster]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 8 }}>
                  {byCluster.map(c => (
                    <div key={c.cluster}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: c.fill, flexShrink: 0 }} />
                          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.cluster}</span>
                        </div>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, flexShrink: 0 }}>{totalProduced ? Math.round((c.produced / totalProduced) * 100) : 0}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 4, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${totalProduced ? (c.produced / totalProduced) * 100 : 0}%`, height: "100%", background: c.fill, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>

          {/* ── Row 3: quality vs output, loom productivity, health gauge ── */}
          <FadeUp delay={0.12}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Gauge size={18} color={T.royalBurgundy} weight="fill" />
                  <div style={cardTitle}>Quality vs Output</div>
                </div>
                <div style={cardSub}>Longer bar = more sarees woven · colour = quality</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
                  {qualityVsOutput.map(w => {
                    const tier = w.periodPassRate >= 95 ? { color: T.green, label: "Excellent" }
                      : w.periodPassRate >= 92 ? { color: T.antiqueGold, label: "Good" }
                      : { color: T.crimson, label: "Needs attention" };
                    const pct = Math.max(6, Math.round((w.produced / maxOutput) * 100));
                    return (
                      <div key={w.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{w.name}</span>
                          <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: tier.color, flexShrink: 0 }}>{w.produced} sarees · {w.periodPassRate}%</span>
                        </div>
                        <div style={{ height: 9, borderRadius: 5, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: tier.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.borderDef}`, paddingTop: 12, marginTop: 14, fontFamily: F.ui, fontSize: 11.5 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ c: T.green, t: "Excellent ≥95%" }, { c: T.antiqueGold, t: "Good 92–94%" }, { c: T.crimson, t: "Needs attention <92%" }].map(g => (
                      <span key={g.t} style={{ display: "flex", alignItems: "center", gap: 4, color: T.taupe }}>
                        <span style={{ width: 8, height: 8, borderRadius: 3, background: g.c, display: "inline-block" }} /> {g.t}
                      </span>
                    ))}
                  </div>
                </div>
                {atRisk > 0 && (
                  <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 11.5, color: T.crimson, fontWeight: 700 }}>{atRisk} weaver{atRisk === 1 ? "" : "s"} below 92% pass rate</div>
                )}
              </div>

              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Yarn size={18} color={T.royalBurgundy} weight="fill" />
                  <div style={cardTitle}>Loom Productivity</div>
                </div>
                <div style={cardSub}>Sarees per loom · avg {avgPerLoom.toFixed(1)}</div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={loomProductivity} barSize={20} margin={{ top: 14, left: -18, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="short" tick={{ fontFamily: F.mono, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={34} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${v} per loom · ${p.payload.looms} looms`, p.payload.name]} />
                    <Bar dataKey="perLoomR" radius={[5, 5, 0, 0]}>
                      {loomProductivity.map(w => <Cell key={w.id} fill={w.perLoom >= avgPerLoom ? T.royalBurgundy : T.goldLight} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.borderDef}`, paddingTop: 12, marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span>{totalLooms} looms engaged</span>
                  <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>{idleCount} weaver{idleCount === 1 ? "" : "s"} idle</span>
                </div>
              </div>

              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={18} color={T.green} weight="fill" />
                  <div style={cardTitle}>Weaving Health</div>
                </div>
                <div style={cardSub}>Quality and payout summary</div>
                <ResponsiveContainer width="100%" height={148}>
                  <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
                    data={[{ name: "Pass", value: overallPassRate, fill: qcColor(overallPassRate) }]}>
                    <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
                    <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, fill: T.luxuryBrown }}>{overallPassRate}%</text>
                    <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }}>QC PASS RATE</text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                  {[
                    { label: "Rejected", value: `${(totalProduced - totalPassed).toLocaleString("en-IN")} pcs` },
                    { label: "Making Charges", value: L(totalPayout) },
                    { label: "Avg / Weaver", value: `${perWeaver.length ? Math.round(totalProduced / perWeaver.length) : 0} pcs` },
                    { label: "Cost / Saree", value: totalPassed ? `₹${Math.round(totalPayout / totalPassed).toLocaleString("en-IN")}` : "—" },
                  ].map(k => (
                    <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                      <div style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>{k.label}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </>
      )}
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, { PhIcon: React.ElementType; bg: string; color: string }> = {
  "📦": { PhIcon: Package, bg: "rgba(200,155,71,0.10)", color: T.antiqueGold },
  "✅": { PhIcon: CheckCircle, bg: "rgba(30,102,64,0.10)", color: T.green },
  "⚠️": { PhIcon: WarningCircle, bg: "rgba(192,57,43,0.09)", color: T.crimson },
  "💰": { PhIcon: Medal, bg: "rgba(110,15,45,0.07)", color: T.royalBurgundy },
  "🔄": { PhIcon: ChartBar, bg: "rgba(110,15,45,0.07)", color: T.royalBurgundy },
};

function LeaderboardAndQC({ onActivities, onNavigate }: { onActivities: () => void; onNavigate?: (tab: string) => void }) {
  const [reportOpen, setReportOpen] = useState(false);
  const activitiesNeedingAction = ACTIVITIES.filter(a => a.needsAction).length;
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
            <DownloadGate>
              <motion.button onClick={() => setReportOpen(true)} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.22)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Download size={16} /> Download Full Report
              </motion.button>
            </DownloadGate>
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
          <div style={{ background: `linear-gradient(100deg, ${T.luxuryBrown} 0%, #5A3220 100%)`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChartBar size={24} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9" }}>Weaver Activities</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.60)", marginTop: 2 }}>
                  What's happened, and what's waiting on you
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activitiesNeedingAction > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,155,71,0.18)", color: T.goldLight, border: "1px solid rgba(200,155,71,0.40)", borderRadius: 999, padding: "7px 14px", fontFamily: F.ui, fontSize: 13, fontWeight: 700 }}>
                  <Bell size={14} /> {activitiesNeedingAction} need{activitiesNeedingAction === 1 ? "s" : ""} your action
                </span>
              )}
              <motion.button onClick={onActivities} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.20)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Bell size={16} /> View All Activities
              </motion.button>
            </div>
          </div>

          {/* Activity feed — one row per event, full detail always visible,
              actionable items called out with an amber rail + a way to act on
              them right there rather than needing to guess what to do next. */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ACTIVITIES.map((a, i) => {
              const cfg = ACTIVITY_ICONS[a.icon] ?? { PhIcon: ChartBar, bg: "rgba(110,15,45,0.07)", color: T.taupe };
              const PhIcon = cfg.PhIcon as React.ElementType;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ background: "rgba(247,242,234,0.55)" }}
                  style={{
                    padding: "20px 32px",
                    borderBottom: i < ACTIVITIES.length - 1 ? `1px solid ${T.borderDef}` : "none",
                    borderLeft: a.needsAction ? `3px solid ${T.antiqueGold}` : "3px solid transparent",
                    display: "flex", alignItems: "flex-start", gap: 16,
                    background: a.needsAction ? "rgba(200,155,71,0.05)" : "#FFFFFF",
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PhIcon size={22} color={cfg.color} weight="fill" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 4 }}>
                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{a.action}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as const, color: T.taupe, background: T.silkCream, borderRadius: 999, padding: "2px 8px" }}>{a.category}</span>
                      {a.needsAction && (
                        <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.18)", borderRadius: 999, padding: "2px 9px" }}>Needs action</span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.55 }}>{a.detail}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, whiteSpace: "nowrap" as const }}>{a.time}</span>
                    {a.needsAction && (
                      <button onClick={onActivities}
                        style={{ display: "flex", alignItems: "center", gap: 5, background: T.royalBurgundy, color: "#FFF", border: "none", borderRadius: 8, padding: "6px 13px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                        Review →
                      </button>
                    )}
                  </div>
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
// IMPORT WEAVERS FROM EXCEL
// ══════════════════════════════════════════════════════════════════════════
type ImportedWeaver = typeof WEAVERS[0];

interface ParsedWeaverRow {
  name: string; village: string; mobile: string; looms: number; status: Status;
}

function ImportWeaversModal({ open, onClose, onImport, nextIdStart }: {
  open: boolean; onClose: () => void; onImport: (rows: ImportedWeaver[]) => void; nextIdStart: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState<ParsedWeaverRow[]>([]);
  const [invalid, setInvalid] = useState<{ row: number; reason: string }[]>([]);
  const [parsing, setParsing] = useState(false);

  const normalize = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const HEADER_MAP: Record<string, keyof ParsedWeaverRow> = {
    name: "name", weavername: "name", fullname: "name",
    village: "village", villagearea: "village", area: "village",
    mobile: "mobile", mobilenumber: "mobile", phone: "mobile", contact: "mobile",
    looms: "looms", numberoflooms: "looms", noofooms: "looms",
    status: "status",
  };

  const reset = () => { setFileName(null); setError(null); setValid([]); setInvalid([]); };

  const parseFile = (file: File) => {
    setParsing(true);
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) { setError("The uploaded file is empty or has no data rows."); setParsing(false); return; }

        const firstRowKeys = Object.keys(raw[0]);
        const colMap: Record<string, keyof ParsedWeaverRow> = {};
        firstRowKeys.forEach(k => {
          const norm = normalize(k);
          if (HEADER_MAP[norm]) colMap[k] = HEADER_MAP[norm];
        });

        const required: (keyof ParsedWeaverRow)[] = ["name", "village", "mobile"];
        const missing = required.filter(k => !Object.values(colMap).includes(k));
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.map(k => k === "name" ? "Name" : k === "village" ? "Village" : "Mobile").join(", ")}. Expected Name, Village, Mobile (Looms and Status are optional).`);
          setParsing(false);
          return;
        }

        const okRows: ParsedWeaverRow[] = [];
        const badRows: { row: number; reason: string }[] = [];

        raw.forEach((r, i) => {
          const out: Partial<ParsedWeaverRow> = { looms: 1, status: "active" as Status };
          Object.entries(colMap).forEach(([col, key]) => {
            if (key === "looms") out.looms = parseInt(String(r[col]).replace(/[^\d]/g, ""), 10) || 1;
            else if (key === "status") {
              const s = normalize(r[col]);
              out.status = s.includes("qc") ? "qc" : s.includes("idle") ? "idle" : "active";
            } else {
              (out as Record<string, unknown>)[key] = String(r[col] ?? "").trim();
            }
          });
          if (!out.name) badRows.push({ row: i + 2, reason: "Missing name" });
          else if (!out.village) badRows.push({ row: i + 2, reason: "Missing village" });
          else if (!out.mobile) badRows.push({ row: i + 2, reason: "Missing mobile number" });
          else okRows.push(out as ParsedWeaverRow);
        });

        setValid(okRows);
        setInvalid(badRows);
        setParsing(false);
      } catch {
        setError("Could not read this file. Please upload a valid .xlsx or .csv file.");
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    const initialsOf = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? "").join("") || "WV";
    const palette = ["#5A3E6B", "#2D6B6B", "#4A6B4A", "#9B6B8A", "#2D7D6B", "#4A5E7A", "#7A2040", "#6B4A2A"];
    const rows: ImportedWeaver[] = valid.map((v, i) => ({
      id: `WV-${String(nextIdStart + i).padStart(3, "0")}`,
      name: v.name, village: v.village, photo: null,
      initials: initialsOf(v.name), bg: palette[(nextIdStart + i) % palette.length],
      status: v.status, thisMonth: 0, passRate: 0, totalEver: 0,
      looms: v.looms, batch: null, design: null, mobile: v.mobile,
      totalPaid: "₹0", lastActive: "Just imported",
    }));
    onImport(rows);
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(26,10,15,0.42)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => { reset(); onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: 32, width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 30px 90px rgba(0,0,0,0.25)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>Import Weavers from Excel</h2>
          <button onClick={() => { reset(); onClose(); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe }}><X size={22} /></button>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 24px", lineHeight: 1.6 }}>
          Upload a .xlsx or .csv file with columns <b>Name</b>, <b>Village</b>, <b>Mobile</b>, and optionally <b>Looms</b> and <b>Status</b>.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `2px dashed rgba(110,15,45,0.25)`, background: "rgba(110,15,45,0.03)", borderRadius: 14, padding: "32px 20px", textAlign: "center", cursor: "pointer" }}
        >
          <UploadSimple size={28} color={T.royalBurgundy} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>
            {fileName ? fileName : "Click to choose a file"}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 4 }}>.xlsx, .xls, or .csv</div>
          <input
            ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
          />
        </div>

        {parsing && <div style={{ marginTop: 16, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Reading file…</div>}

        {error && (
          <div style={{ marginTop: 16, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12, padding: "14px 16px", fontFamily: F.ui, fontSize: 13.5, color: "#C0392B" }}>
            {error}
          </div>
        )}

        {!error && !parsing && (valid.length > 0 || invalid.length > 0) && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green, background: "rgba(30,102,64,0.10)", borderRadius: 99, padding: "5px 14px" }}>{valid.length} ready to import</span>
              {invalid.length > 0 && (
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#C0392B", background: "rgba(192,57,43,0.10)", borderRadius: 99, padding: "5px 14px" }}>{invalid.length} skipped</span>
              )}
            </div>

            {valid.length > 0 && (
              <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", marginBottom: invalid.length > 0 ? 14 : 0 }}>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {valid.map((v, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < valid.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 1 ? "rgba(247,242,234,0.5)" : "#FFF" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, fontWeight: 600 }}>{v.name}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{v.village} · {v.mobile} · {v.looms} loom{v.looms !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invalid.length > 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: "#C0392B" }}>
                {invalid.map((b, i) => <div key={i}>Row {b.row}: {b.reason}</div>)}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28, borderTop: `1px solid ${T.borderDef}`, paddingTop: 20 }}>
          <button onClick={() => { reset(); onClose(); }} style={{ padding: "12px 22px", borderRadius: 10, border: `1.5px solid ${T.borderDef}`, background: "transparent", color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <motion.button
            disabled={valid.length === 0} onClick={handleConfirm}
            whileHover={valid.length > 0 ? { scale: 1.02 } : {}}
            style={{ padding: "12px 26px", borderRadius: 10, border: "none", background: valid.length > 0 ? T.royalBurgundy : "rgba(110,15,45,0.25)", color: "#FFFDF9", fontFamily: F.ui, fontSize: 14.5, fontWeight: 700, cursor: valid.length > 0 ? "pointer" : "not-allowed" }}
          >
            Import {valid.length > 0 ? valid.length : ""} Weaver{valid.length !== 1 ? "s" : ""}
          </motion.button>
        </div>
      </motion.div>
    </div>
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
  const [extraWeavers, setExtraWeavers] = useState<typeof WEAVERS>([]);
  const [importOpen, setImportOpen] = useState(false);
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
      <AllWeaversControls view={view} setView={setView} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onAddWeaver={() => setNewWeaverExpanded(true)} onViewAll={() => onNavigate?.("AllWeavers")} onImport={() => setImportOpen(true)} />
      <WeaverDirectory view={view} extraWeavers={extraWeavers} onSelect={(w) => { setDrawerMode("view"); setSelectedWeaver(w); }} onEdit={(w) => { setDrawerMode("edit"); setSelectedWeaver(w); }} onBatches={setBatchDialog} />
      <WeaverAnalytics />
      <LeaderboardAndQC onActivities={() => onNavigate?.("Notifications")} onNavigate={onNavigate} />
      <NewWeaverModal expanded={newWeaverExpanded} setExpanded={setNewWeaverExpanded} />
      <ImportWeaversModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        nextIdStart={WEAVERS.length + extraWeavers.length + 1}
        onImport={(rows) => setExtraWeavers(prev => [...prev, ...rows])}
      />
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
