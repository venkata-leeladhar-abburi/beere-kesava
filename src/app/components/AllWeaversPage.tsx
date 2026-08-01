import React, { useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Search, Users, Activity, Clock, CheckCircle2,
  Layers, Layers3, Star, MapPin, Phone, Eye, Edit3, AlertTriangle,
} from "lucide-react";
import { Rows } from "@phosphor-icons/react";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../constants/weaverImages";

// ── Design tokens ─────────────────────────────────────────────────────────
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

// ── Data ──────────────────────────────────────────────────────────────────
type Status = "active" | "qc" | "idle";

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  active: { label: "Currently Weaving",  color: T.green,        bg: "rgba(30,102,64,0.10)",  border: "rgba(30,102,64,0.22)"  },
  qc:     { label: "Pending QC",         color: "#8B6018",      bg: "rgba(200,155,71,0.12)", border: "rgba(200,155,71,0.28)" },
  idle:   { label: "No Active Batch",    color: T.taupe,        bg: "rgba(139,112,96,0.10)", border: "rgba(139,112,96,0.20)" },
};

interface Weaver {
  id: string; name: string; village: string; mobile: string;
  photo: string | null; initials: string; avatarBg: string;
  status: Status; accentColor: string;
  thisMonth: number; passRate: number; totalSarees: number;
  looms: number; batch: string | null; totalPaid: string;
  lastActive: string;
}

const ALL_WEAVERS: Weaver[] = [
  { id: "WV-001", name: "Ravi Kumar",    village: "Dharmavaram, AP",       mobile: "×××× 4521", photo: imgRaviKumar,   initials: "RK", avatarBg: "#5A3E6B", status: "active", accentColor: "#5A3E6B",    thisMonth: 12, passRate: 94, totalSarees: 2140, looms: 3, batch: "BATCH-079", totalPaid: "₹8,42,000",  lastActive: "Today"      },
  { id: "WV-002", name: "Padma Veni",    village: "Pochampally, Telangana", mobile: "×××× 8834", photo: imgPadmaVeni,   initials: "PV", avatarBg: T.royalBurgundy, status: "active", accentColor: T.royalBurgundy, thisMonth: 18, passRate: 97, totalSarees: 1840, looms: 2, batch: "BATCH-086", totalPaid: "₹6,90,000",  lastActive: "Today"      },
  { id: "WV-007", name: "Suresh Murti",  village: "Venkatagiri, AP",        mobile: "×××× 9982", photo: imgSureshMurti, initials: "SM", avatarBg: "#2D6B6B", status: "qc",     accentColor: "#2D6B6B",    thisMonth:  7, passRate: 98, totalSarees:  980, looms: 2, batch: "BATCH-081", totalPaid: "₹3,64,000",  lastActive: "Yesterday"  },
  { id: "WV-005", name: "Anand K.",      village: "Pochampally, Telangana", mobile: "×××× 7723", photo: imgAnandK,      initials: "AK", avatarBg: "#4A6B4A", status: "active", accentColor: T.antiqueGold, thisMonth:  9, passRate: 92, totalSarees: 1560, looms: 2, batch: "BATCH-083", totalPaid: "₹5,84,000",  lastActive: "Today"      },
  { id: "WV-012", name: "Meena R.",      village: "Siddipet, Telangana",    mobile: "×××× 6614", photo: null,           initials: "MR", avatarBg: "#9B6B8A", status: "active", accentColor: "#9B6B8A",    thisMonth:  6, passRate: 89, totalSarees:  720, looms: 1, batch: "BATCH-088", totalPaid: "₹2,68,000",  lastActive: "Today"      },
  { id: "WV-018", name: "Lakshmi D.",    village: "Dharmavaram, AP",        mobile: "×××× 3341", photo: null,           initials: "LD", avatarBg: "#2D7D6B", status: "qc",     accentColor: "#2D7D6B",    thisMonth: 11, passRate: 96, totalSarees: 1320, looms: 2, batch: "BATCH-080", totalPaid: "₹4,92,000",  lastActive: "Yesterday"  },
  { id: "WV-024", name: "Venkat Rao",    village: "Venkatagiri, AP",        mobile: "×××× 1122", photo: null,           initials: "VR", avatarBg: "#4A5E7A", status: "idle",   accentColor: T.taupe,      thisMonth:  0, passRate: 95, totalSarees: 2480, looms: 4, batch: null,         totalPaid: "₹9,28,000",  lastActive: "3 days ago" },
  { id: "WV-031", name: "Kamala B.",     village: "Pochampally, Telangana", mobile: "×××× 5589", photo: null,           initials: "KB", avatarBg: "#7A2040", status: "active", accentColor: "#7A2040",    thisMonth: 14, passRate: 99, totalSarees: 3120, looms: 3, batch: "BATCH-084", totalPaid: "₹11,64,000", lastActive: "Today"      },
  { id: "WV-003", name: "Krishnamma",    village: "Venkatagiri, AP",        mobile: "×××× 2210", photo: null,           initials: "KR", avatarBg: "#6B4A2A", status: "idle",   accentColor: "#6B4A2A",    thisMonth:  0, passRate: 96, totalSarees: 2640, looms: 2, batch: null,         totalPaid: "₹9,84,000",  lastActive: "3 days ago" },
  { id: "WV-004", name: "Rajesh T.",     village: "Siddipet, Telangana",    mobile: "×××× 5567", photo: null,           initials: "RT", avatarBg: "#4A6B9B", status: "active", accentColor: "#4A6B9B",    thisMonth:  5, passRate: 91, totalSarees:  620, looms: 1, batch: "BATCH-091", totalPaid: "₹2,18,000",  lastActive: "Today"      },
  { id: "WV-006", name: "Saraswati M.", village: "Dharmavaram, AP",         mobile: "×××× 3341", photo: null,           initials: "SM", avatarBg: "#7A4A6B", status: "qc",     accentColor: "#7A4A6B",    thisMonth: 11, passRate: 98, totalSarees: 3240, looms: 3, batch: "BATCH-078", totalPaid: "₹12,40,000", lastActive: "Yesterday"  },
  { id: "WV-008", name: "Bhavani K.",    village: "Siddipet, Telangana",    mobile: "×××× 6614", photo: null,           initials: "BK", avatarBg: "#5A6B4A", status: "idle",   accentColor: "#5A6B4A",    thisMonth:  0, passRate: 88, totalSarees:  440, looms: 1, batch: null,         totalPaid: "₹1,60,000",  lastActive: "5 days ago" },
];

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <div ref={ref} style={{ height: 4, borderRadius: 999, background: "rgba(110,15,45,0.07)" }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : undefined}
        transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
        style={{ height: "100%", borderRadius: 999, background: color }}
      />
    </div>
  );
}

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

// ── Main component ────────────────────────────────────────────────────────
export function AllWeaversPage({ onNavigate }: { onNavigate?: (tab: string, ctx?: any) => void } = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [villageFilter, setVillageFilter] = useState<"all" | string>("all");
  const [sortBy, setSortBy] = useState<"name" | "output" | "looms">("name");

  const villages = Array.from(new Set(ALL_WEAVERS.map(w => w.village))).sort();

  const filtered = ALL_WEAVERS.filter(w => {
    const matchSearch = search === "" || w.name.toLowerCase().includes(search.toLowerCase()) || w.village.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    const matchVillage = villageFilter === "all" || w.village === villageFilter;
    return matchSearch && matchStatus && matchVillage;
  }).sort((a, b) => {
    if (sortBy === "output") return b.thisMonth - a.thisMonth;
    if (sortBy === "looms") return b.looms - a.looms;
    return a.name.localeCompare(b.name);
  });

  const activeCount = ALL_WEAVERS.filter(w => w.status === "active").length;
  const qcCount     = ALL_WEAVERS.filter(w => w.status === "qc").length;
  const idleCount   = ALL_WEAVERS.filter(w => w.status === "idle").length;
  const totalSarees = ALL_WEAVERS.reduce((s, w) => s + w.thisMonth, 0);

  return (
    <div style={{ minHeight: "calc(100vh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section style={{ background: G.card, padding: "56px 56px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.025) 60px, rgba(200,155,71,0.025) 61px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)`, pointerEvents: "none" }} />
        <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 20, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Since 1999 · Weaver Management
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(32px, 3.5vw, 52px)", color: T.warmCream, margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            Weavers{" "}
            <span style={{ fontStyle: "italic", color: T.antiqueGold }}>& Production Overview</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "0 0 0", maxWidth: 540, lineHeight: 1.7 }}>
            See all weavers, their current work, how they are performing, and manage their details.
          </motion.p>

          {/* Status pills */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
            {[
              { label: `${ALL_WEAVERS.length} Total Weavers`, color: T.antiqueGold, bg: "rgba(200,155,71,0.15)", border: "rgba(200,155,71,0.30)" },
              { label: `${activeCount} Currently Working`,     color: T.warmCream,   bg: "rgba(30,102,64,0.18)",  border: "rgba(30,102,64,0.35)" },
              { label: `${qcCount} Submitted — Waiting for Quality Check`, color: T.warmCream, bg: "rgba(139,112,96,0.18)", border: "rgba(200,155,71,0.20)" },
            ].map(p => (
              <span key={p.label} style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: p.color, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 999, padding: "6px 16px" }}>
                {p.label}
              </span>
            ))}
          </motion.div>

          {/* Metrics row */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            style={{ display: "flex", gap: 0, marginTop: 40, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total Active Weavers",    val: `${activeCount + qcCount}`,  sub: "All currently with the firm",     Icon: Users,        hi: false },
              { label: "Sarees Produced This Month", val: `${totalSarees}`,          sub: "↑ 14% more than last month",     Icon: Layers,       hi: true  },
              { label: "Quality Check Pass Rate",  val: `${Math.round(ALL_WEAVERS.reduce((s,w) => s + w.passRate, 0) / ALL_WEAVERS.length)}%`, sub: "Only 4% rejected this month", Icon: CheckCircle2, hi: false },
              { label: "Warp Requests Pending",    val: "3",                         sub: "Need approval today",             Icon: Clock,        hi: false },
              { label: "Total Paid to Weavers",    val: "₹4.2L",                    sub: "This month's making charges",     Icon: Star,         hi: false },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "20px 20px", borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={19} color={m.hi ? T.antiqueGold : "rgba(245,232,208,0.70)"} />
                </div>
                <div>
                  <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 9, letterSpacing: "1.8px", textTransform: "uppercase", color: m.hi ? "rgba(200,155,71,0.85)" : "rgba(245,232,208,0.55)", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 32, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1, ...NUM }}>{m.val}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(245,232,208,0.60)", marginTop: 3 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER + SEARCH BAR ── */}
      <div style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, padding: "0 56px", position: "sticky", top: 90, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60 }}>
          {/* Status filters */}
          {([
            { key: "all",    label: "All Weavers",       count: ALL_WEAVERS.length },
            { key: "active", label: "Currently Weaving", count: activeCount },
            { key: "qc",     label: "Pending QC",        count: qcCount },
            { key: "idle",   label: "No Active Batch",   count: idleCount },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              style={{ height: "100%", padding: "0 18px", border: "none", background: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, position: "relative", borderBottom: statusFilter === f.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent" }}>
              <span style={{ fontFamily: F.ui, fontWeight: statusFilter === f.key ? 600 : 400, fontSize: 13.5, color: statusFilter === f.key ? T.royalBurgundy : T.taupe, whiteSpace: "nowrap" }}>{f.label}</span>
              <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: statusFilter === f.key ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: statusFilter === f.key ? T.royalBurgundy : T.taupe }}>{f.count}</span>
            </button>
          ))}

          {/* Village filter */}
          <select
            value={villageFilter}
            onChange={e => setVillageFilter(e.target.value)}
            style={{ height: 38, border: `1px solid ${T.borderDef}`, background: T.silkCream, borderRadius: 10, padding: "0 12px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, cursor: "pointer" }}
          >
            <option value="all">All Villages</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{ height: 38, border: `1px solid ${T.borderDef}`, background: T.silkCream, borderRadius: 10, padding: "0 12px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, cursor: "pointer" }}
          >
            <option value="name">Sort: Name</option>
            <option value="output">Sort: This Month's Output</option>
            <option value="looms">Sort: Looms</option>
          </select>

          {/* Search */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "0 14px", height: 38 }}>
            <Search size={14} color={T.taupe} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, village, ID…"
              style={{ border: "none", background: "none", outline: "none", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, width: 220 }}
            />
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>{filtered.length} weaver{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── WEAVERS GRID ── */}
      <div style={{ padding: "40px 56px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Users size={28} color={T.taupe} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, marginBottom: 8 }}>No weavers found</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, alignItems: "stretch" }}>
            {filtered.map((w, i) => (
              <FadeUp key={w.id} delay={i * 0.04} style={{ height: "100%" }}>
                <motion.div
                  whileHover={{ y: -6, boxShadow: "0 30px 70px rgba(74,6,27,0.12)" }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}
                >
                  {/* Header Banner */}
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
                      <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.avatarBg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                      </div>
                    )}

                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

                    <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                      {w.id}
                    </div>

                    <div style={{ position: "absolute", bottom: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px" }}>
                      {w.status === "active" ? (
                        <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                      ) : w.status === "qc" ? (
                        <Clock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                      ) : (
                        <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" as const, letterSpacing: "0.5px", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                        {w.status === "active" ? "Currently Weaving" : w.status === "qc" ? "Pending QC" : "Idle"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
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

                    <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                      <motion.button
                        onClick={() => onNavigate?.("Weavers", { weaverId: w.id, mode: "view" })}
                        whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                        whileTap={{ scale: 0.97 }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        <Eye size={14} /> Details
                      </motion.button>
                      <motion.button
                        onClick={() => onNavigate?.("Weavers", { weaverId: w.id, mode: "edit" })}
                        whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.05)" }}
                        whileTap={{ scale: 0.97 }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <Edit3 size={13} /> Edit
                      </motion.button>
                      <motion.button
                        onClick={() => onNavigate?.("Weavers", { weaverId: w.id, mode: "view" })}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
