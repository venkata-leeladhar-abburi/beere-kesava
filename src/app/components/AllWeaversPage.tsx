import React, { useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Search, Users, Activity, Clock, CheckCircle2,
  ChevronRight, Filter, Layers, Star, MapPin,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
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
  id: string; name: string; village: string;
  photo: string | null; initials: string; avatarBg: string;
  status: Status; accentColor: string;
  thisMonth: number; passRate: number; totalSarees: number;
  looms: number; batch: string | null; totalPaid: string;
  lastActive: string;
}

const ALL_WEAVERS: Weaver[] = [
  { id: "WV-001", name: "Ravi Kumar",    village: "Dharmavaram, AP",       photo: imgRaviKumar,   initials: "RK", avatarBg: "#5A3E6B", status: "active", accentColor: "#5A3E6B",    thisMonth: 12, passRate: 94, totalSarees: 2140, looms: 3, batch: "BATCH-079", totalPaid: "₹8,42,000",  lastActive: "Today"      },
  { id: "WV-002", name: "Padma Veni",    village: "Pochampally, Telangana", photo: imgPadmaVeni,   initials: "PV", avatarBg: T.royalBurgundy, status: "active", accentColor: T.royalBurgundy, thisMonth: 18, passRate: 97, totalSarees: 1840, looms: 2, batch: "BATCH-086", totalPaid: "₹6,90,000",  lastActive: "Today"      },
  { id: "WV-007", name: "Suresh Murti",  village: "Venkatagiri, AP",        photo: imgSureshMurti, initials: "SM", avatarBg: "#2D6B6B", status: "qc",     accentColor: "#2D6B6B",    thisMonth:  7, passRate: 98, totalSarees:  980, looms: 2, batch: "BATCH-081", totalPaid: "₹3,64,000",  lastActive: "Yesterday"  },
  { id: "WV-005", name: "Anand K.",      village: "Pochampally, Telangana", photo: imgAnandK,      initials: "AK", avatarBg: "#4A6B4A", status: "active", accentColor: T.antiqueGold, thisMonth:  9, passRate: 92, totalSarees: 1560, looms: 2, batch: "BATCH-083", totalPaid: "₹5,84,000",  lastActive: "Today"      },
  { id: "WV-012", name: "Meena R.",      village: "Siddipet, Telangana",    photo: null,           initials: "MR", avatarBg: "#9B6B8A", status: "active", accentColor: "#9B6B8A",    thisMonth:  6, passRate: 89, totalSarees:  720, looms: 1, batch: "BATCH-088", totalPaid: "₹2,68,000",  lastActive: "Today"      },
  { id: "WV-018", name: "Lakshmi D.",    village: "Dharmavaram, AP",        photo: null,           initials: "LD", avatarBg: "#2D7D6B", status: "qc",     accentColor: "#2D7D6B",    thisMonth: 11, passRate: 96, totalSarees: 1320, looms: 2, batch: "BATCH-080", totalPaid: "₹4,92,000",  lastActive: "Yesterday"  },
  { id: "WV-024", name: "Venkat Rao",    village: "Venkatagiri, AP",        photo: null,           initials: "VR", avatarBg: "#4A5E7A", status: "idle",   accentColor: T.taupe,      thisMonth:  0, passRate: 95, totalSarees: 2480, looms: 4, batch: null,         totalPaid: "₹9,28,000",  lastActive: "3 days ago" },
  { id: "WV-031", name: "Kamala B.",     village: "Pochampally, Telangana", photo: null,           initials: "KB", avatarBg: "#7A2040", status: "active", accentColor: "#7A2040",    thisMonth: 14, passRate: 99, totalSarees: 3120, looms: 3, batch: "BATCH-084", totalPaid: "₹11,64,000", lastActive: "Today"      },
  { id: "WV-003", name: "Krishnamma",    village: "Venkatagiri, AP",        photo: null,           initials: "KR", avatarBg: "#6B4A2A", status: "idle",   accentColor: "#6B4A2A",    thisMonth:  0, passRate: 96, totalSarees: 2640, looms: 2, batch: null,         totalPaid: "₹9,84,000",  lastActive: "3 days ago" },
  { id: "WV-004", name: "Rajesh T.",     village: "Siddipet, Telangana",    photo: null,           initials: "RT", avatarBg: "#4A6B9B", status: "active", accentColor: "#4A6B9B",    thisMonth:  5, passRate: 91, totalSarees:  620, looms: 1, batch: "BATCH-091", totalPaid: "₹2,18,000",  lastActive: "Today"      },
  { id: "WV-006", name: "Saraswati M.", village: "Dharmavaram, AP",         photo: null,           initials: "SM", avatarBg: "#7A4A6B", status: "qc",     accentColor: "#7A4A6B",    thisMonth: 11, passRate: 98, totalSarees: 3240, looms: 3, batch: "BATCH-078", totalPaid: "₹12,40,000", lastActive: "Yesterday"  },
  { id: "WV-008", name: "Bhavani K.",    village: "Siddipet, Telangana",    photo: null,           initials: "BK", avatarBg: "#5A6B4A", status: "idle",   accentColor: "#5A6B4A",    thisMonth:  0, passRate: 88, totalSarees:  440, looms: 1, batch: null,         totalPaid: "₹1,60,000",  lastActive: "5 days ago" },
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
export function AllWeaversPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const filtered = ALL_WEAVERS.filter(w => {
    const matchSearch = search === "" || w.name.toLowerCase().includes(search.toLowerCase()) || w.village.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
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
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{filtered.length} weaver{filtered.length !== 1 ? "s" : ""}</span>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
            {filtered.map((w, i) => {
              const cfg = STATUS_CFG[w.status];
              const qcColor = w.passRate > 95 ? T.green : w.passRate >= 85 ? "#8B6018" : "#C0392B";
              return (
                <FadeUp key={w.id} delay={i * 0.04}>
                  <motion.div
                    whileHover={{ y: -8, boxShadow: "0px 28px 72px rgba(74,6,27,0.16)" }}
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    style={{ background: T.warmIvory, borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0px 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}
                  >
                    {/* Photo */}
                    <div style={{ height: 172, flexShrink: 0, overflow: "hidden", position: "relative" }}>
                      {w.photo ? (
                        <motion.div whileHover={{ scale: 1.07 }} transition={{ duration: 0.5 }} style={{ width: "100%", height: "100%" }}>
                          <ImageWithFallback src={w.photo} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
                        </motion.div>
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.avatarBg} 0%, ${w.avatarBg}CC 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 48, color: "rgba(255,255,255,0.90)" }}>{w.initials}</span>
                        </div>
                      )}
                      {/* Accent bar at top */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: w.accentColor }} />
                      {/* Status badge */}
                      <div style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,253,249,0.92)", backdropFilter: "blur(8px)", border: `1px solid ${T.borderDef}` }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
                        <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 10.5, color: cfg.color, letterSpacing: "0.1px" }}>{cfg.label}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
                      {/* Identity */}
                      <div>
                        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 19, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 4 }}>{w.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <MapPin size={11} color={T.taupe} />
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{w.village}</span>
                        </div>
                        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy, marginTop: 4, letterSpacing: "0.8px" }}>{w.id}</div>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          { label: "This Month",  val: `${w.thisMonth} sarees`, color: T.luxuryBrown },
                          { label: "QC Pass",     val: `${w.passRate}%`,        color: qcColor },
                          { label: "Total Made",  val: w.totalSarees.toLocaleString(), color: T.luxuryBrown },
                          { label: "Total Paid",  val: w.totalPaid,             color: T.royalBurgundy },
                        ].map(stat => (
                          <div key={stat.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                            <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>{stat.label}</div>
                            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: stat.color, ...NUM }}>{stat.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Batch + looms */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          {w.batch ? (
                            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", border: `1px solid rgba(110,15,45,0.14)`, borderRadius: 6, padding: "3px 9px", letterSpacing: "0.5px" }}>{w.batch}</span>
                          ) : (
                            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontStyle: "italic" }}>No active batch</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Layers size={12} color={T.taupe} />
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{w.looms} loom{w.looms !== 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Monthly output</span>
                          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, fontWeight: 600, ...NUM }}>{w.thisMonth}/15</span>
                        </div>
                        <AnimatedBar pct={Math.min((w.thisMonth / 15) * 100, 100)} color={w.accentColor} />
                      </div>

                      {/* Last active */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: `1px solid ${T.borderDef}` }}>
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Last active: <span style={{ fontWeight: 500, color: T.luxuryBrown }}>{w.lastActive}</span></span>
                        <motion.div whileHover={{ x: 3 }} style={{ display: "flex", alignItems: "center", gap: 4, color: T.royalBurgundy, cursor: "pointer" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>View</span>
                          <ChevronRight size={13} color={T.royalBurgundy} />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
