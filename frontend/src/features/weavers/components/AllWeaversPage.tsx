import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Activity, Clock, CheckCircle2,
  Layers, Layers3, Star, MapPin, Phone, Eye, Edit3, AlertTriangle,
} from "lucide-react";
import { Rows3 as Rows } from "lucide-react";
import { BackendWeaver, BackendWeaverStats } from "../../../shared/api/weavers";
import { useWeaverRosterStats, weaverStatusFromStats, formatLastActive } from "../hooks/useWeaverRosterStats";
import { warpRequestsApi } from "../../../shared/api/warpRequests";
import { paymentsApi } from "../../../shared/api/payments";
import { rupees, formatMoney } from "@/lib/domain/money";
import { resolveAssetUrl } from "../../../shared/api/uploads";
import { Button, SearchInput, Select, SelectItem } from "../../../shared/ui/primitives";
import { useUrlFilters } from "../../../shared/ui/filter";
import { ErrorState } from "../../../shared/ui/state";
import { toInitials } from "@/shared/lib/initials";
import { MobileFilterBar } from "../../../shared/ui/filter/MobileFilterBar";

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
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


interface Weaver {
  id: string; code: string; name: string; village: string; mobile: string;
  photo: string | null; initials: string; avatarBg: string;
  status: Status; accentColor: string;
  thisMonth: number; passRate: number; totalSarees: number; qcPassed: number;
  looms: number; batch: string | null; totalPaid: string;
  lastActive: string;
}

// ── Real production stats ────────────────────────────────────────────────
// GET /weavers/:id/stats gives live QC/production numbers per weaver
// (totalSareesWoven, qcPassRate, activeBatchRowsCount, materialIssueCount).
// It does NOT expose a monthly breakdown, current batch id, total amount
// paid, or a last-active timestamp — those live in the batch/payments
// modules and are not wired here. Those specific fields are shown as
// unavailable ("—" / 0) rather than invented, per the design note below.
const AVATAR_PALETTE = ["#5A3E6B", "#6E0F2D", "#2D6B6B", "#4A6B4A", "#9B6B8A", "#2D7D6B", "#4A5E7A", "#7A2040"];

function toDisplayWeaver(w: BackendWeaver, index: number, stats: BackendWeaverStats | undefined): Weaver {
  return {
    id: w.id,
    code: w.code,
    name: w.name,
    village: w.village || "—",
    mobile: w.phone || "—",
    photo: resolveAssetUrl(w.photoUrl),
    initials: w.initials,
    looms: w.looms,
    avatarBg: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    accentColor: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    status: weaverStatusFromStats(stats),
    // No monthly breakdown from the backend yet — only an all-time total.
    thisMonth: 0,
    passRate: stats?.qcPassRate ?? 0,
    totalSarees: stats?.totalSareesWoven ?? 0,
    qcPassed: stats?.qcPassCount ?? 0,
    // No current-batch id, payments total, or last-active timestamp exposed yet.
    batch: null,
    totalPaid: "—",
    lastActive: formatLastActive(stats?.lastActivityAt),
  };
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
export function AllWeaversPage({ onNavigate }: { onNavigate?: (tab: string, ctx?: unknown) => void } = {}) {
  // Filter/search state lives in the URL (?weaverSearch=&weaverStatus=&...)
  // via useUrlFilters — see design-system/05-OVERLAYS.md Part J. Local
  // variable names below are unchanged so the rest of this component (and
  // its JSX) needs no further edits.
  const weaverFilters = useUrlFilters({ weaverSearch: "", weaverStatus: "all", weaverVillage: "all", weaverSort: "name" });
  const search = weaverFilters.filters.weaverSearch;
  const setSearch = (s: string) => weaverFilters.setFilter("weaverSearch", s);
  const statusFilter = weaverFilters.filters.weaverStatus as "all" | Status;
  const setStatusFilter = (s: "all" | Status) => weaverFilters.setFilter("weaverStatus", s);
  const villageFilter = weaverFilters.filters.weaverVillage;
  const setVillageFilter = (s: string) => weaverFilters.setFilter("weaverVillage", s);
  const sortBy = weaverFilters.filters.weaverSort as "name" | "output" | "looms";
  const setSortBy = (s: "name" | "output" | "looms") => weaverFilters.setFilter("weaverSort", s);

  // Real weaver roster + every weaver's live stats, in two requests.
  const { roster, statsById, isLoading, isError, refetch: refetchAll } = useWeaverRosterStats();

  const ALL_WEAVERS: Weaver[] = roster.map((w, i) => toDisplayWeaver(w, i, statsById.get(w.id)));

  const villages = Array.from(new Set(ALL_WEAVERS.map(w => w.village))).sort();

  const filtered = ALL_WEAVERS.filter(w => {
    const matchSearch = search === "" || w.name.toLowerCase().includes(search.toLowerCase()) || w.village.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    const matchVillage = villageFilter === "all" || w.village === villageFilter;
    return matchSearch && matchStatus && matchVillage;
  }).sort((a, b) => {
    if (sortBy === "output") return b.totalSarees - a.totalSarees;
    if (sortBy === "looms") return b.looms - a.looms;
    return a.name.localeCompare(b.name);
  });

  // Two different senses of "active" were in play across the weaver pages:
  // on the roster (an admin flag) and on the floor (has batch rows open).
  // This tile's own subtitle — "all currently with the firm" — is the roster
  // sense, which is also what WeaversPage's matching tile shows.
  const rosterActiveCount = roster.filter(w => w.status === "ACTIVE").length;
  const activeCount = ALL_WEAVERS.filter(w => w.status === "active").length;
  const qcCount     = ALL_WEAVERS.filter(w => w.status === "qc").length;
  const idleCount   = ALL_WEAVERS.filter(w => w.status === "idle").length;
  const totalSarees = ALL_WEAVERS.reduce((s, w) => s + w.totalSarees, 0);
  // Weighted by sarees rather than a mean of per-weaver percentages, which
  // counted every not-yet-producing weaver as a flat 0%.
  const totalQcPassed = ALL_WEAVERS.reduce((s, w) => s + w.qcPassed, 0);
  const overallPassRate = totalSarees ? Math.round((totalQcPassed / totalSarees) * 100) : 0;

  // Both of these were rendered as "—  / Not tracked by the backend yet",
  // but WeaversPage already reads them from these same two endpoints.
  const { data: pendingWarpRes } = useQuery({
    queryKey: ["warp-requests-pending", "all-weavers-stats"],
    queryFn: () => warpRequestsApi.list("PENDING"),
  });
  const { data: paymentSummary } = useQuery({
    queryKey: ["payments-summary", "all-weavers-stats"],
    queryFn: () => paymentsApi.getSummary(),
  });
  const warpRequestsPending = pendingWarpRes?.items.length ?? 0;
  const totalPaidToWeavers = paymentSummary?.weaverTotal ?? 0;

  return (
    <div style={{ minHeight: "calc(100dvh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section className="px-4 md:px-7 xl:px-14" style={{ background: G.card, paddingTop: 56, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.025) 60px, rgba(200,155,71,0.025) 61px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)`, pointerEvents: "none" }} />
        <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 20, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Since 1999 · Weaver Management
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(32px, 3.5vw, 52px)", color: T.warmCream, margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            Weavers{" "}
            <span style={{ fontStyle: "italic", color: T.antiqueGold }}>& Production Overview</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="max-w-[540px]"
            style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "0 0 0", lineHeight: 1.7 }}>
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
              { label: "Total Active Weavers",    val: `${rosterActiveCount}`,     sub: "All currently with the firm",     Icon: Users,        hi: false },
              { label: "Total Sarees Woven",       val: `${totalSarees}`,           sub: "All-time, across all weavers",   Icon: Layers,       hi: true  },
              { label: "Quality Check Pass Rate",  val: `${overallPassRate}%`,      sub: "Across all sarees woven",        Icon: CheckCircle2, hi: false },
              { label: "Warp Requests Pending",    val: `${warpRequestsPending}`,   sub: "Awaiting admin approval",        Icon: Clock,        hi: false },
              { label: "Total Paid to Weavers",    val: formatMoney(rupees(totalPaidToWeavers)), sub: "All-time payments recorded", Icon: Star, hi: false },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "20px 20px", borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={19} color={m.hi ? T.antiqueGold : "rgba(245,232,208,0.70)"} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, letterSpacing: "1.8px", textTransform: "uppercase", color: m.hi ? "rgba(200,155,71,0.85)" : "rgba(245,232,208,0.55)", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1, ...NUM }}>{m.val}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(245,232,208,0.60)", marginTop: 3 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER + SEARCH BAR ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, position: "relative", zIndex: 10 }}>
        {/* Mobile Flipkart-style Collapsible Filter Bar */}
        <div className="md:hidden py-3">
          <MobileFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, village, ID..."
            filterGroups={[
              {
                id: "status",
                label: "Weaver Status",
                value: statusFilter,
                defaultValue: "all",
                options: [
                  { value: "all", label: `All Weavers (${ALL_WEAVERS.length})` },
                  { value: "active", label: `Currently Weaving (${activeCount})` },
                  { value: "qc", label: `Pending QC (${qcCount})` },
                  { value: "idle", label: `No Active Batch (${idleCount})` },
                ],
                onChange: (v: string) => setStatusFilter(v as any),
              },
              {
                id: "village",
                label: "Village",
                value: villageFilter,
                defaultValue: "all",
                options: [
                  { value: "all", label: "All Villages" },
                  ...villages.map(v => ({ value: v, label: v })),
                ],
                onChange: setVillageFilter,
              },
              {
                id: "sort",
                label: "Sort By",
                value: sortBy,
                defaultValue: "name",
                options: [
                  { value: "name", label: "Sort: Name" },
                  { value: "output", label: "Sort: Total Sarees Woven" },
                  { value: "looms", label: "Sort: Looms" },
                ],
                onChange: (v: string) => setSortBy(v as any),
              },
            ]}
            onResetAll={() => {
              setSearch("");
              setStatusFilter("all");
              setVillageFilter("all");
              setSortBy("name");
            }}
          />
        </div>

        {/* Desktop Filter Bar */}
        <div className="hidden md:flex items-center gap-3 h-[60px] min-w-max">
          {/* Status filters */}
          {([
            { key: "all",    label: "All Weavers",       count: ALL_WEAVERS.length },
            { key: "active", label: "Currently Weaving", count: activeCount },
            { key: "qc",     label: "Pending QC",        count: qcCount },
            { key: "idle",   label: "No Active Batch",   count: idleCount },
          ] as const).map(f => (
            <Button key={f.key} onClick={() => setStatusFilter(f.key)} variant="ghost" size="sm"
              className="h-full rounded-none"
            >
              <span style={{ fontFamily: F.ui, fontWeight: statusFilter === f.key ? 600 : 400, fontSize: 13, color: statusFilter === f.key ? T.royalBurgundy : T.taupe, whiteSpace: "nowrap", borderBottom: statusFilter === f.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", paddingBottom: 2 }}>{f.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: statusFilter === f.key ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: statusFilter === f.key ? T.royalBurgundy : T.taupe }}>{f.count}</span>
            </Button>
          ))}

          {/* Village filter */}
          <div style={{ width: 170 }}>
            <Select value={villageFilter} onValueChange={setVillageFilter} size="sm">
              <SelectItem value="all">All Villages</SelectItem>
              {villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </Select>
          </div>

          {/* Sort */}
          <div style={{ width: 220 }}>
            <Select value={sortBy} onValueChange={v => setSortBy(v as "name" | "output" | "looms")} size="sm">
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="output">Sort: Total Sarees Woven</SelectItem>
              <SelectItem value="looms">Sort: Looms</SelectItem>
            </Select>
          </div>

          {/* Search */}
          <div style={{ marginLeft: "auto", width: 240 }}>
            <SearchInput
              aria-label="Search by name, village, ID"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, village, ID…"
            />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{filtered.length} weaver{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── WEAVERS GRID ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 40px", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            Loading weavers…
          </div>
        ) : isError ? (
          <ErrorState error={undefined} onRetry={refetchAll} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Users size={28} color={T.taupe} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, marginBottom: 8 }}>
              {ALL_WEAVERS.length === 0 ? "No weavers yet" : "No weavers found"}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
              {ALL_WEAVERS.length === 0 ? "Register a weaver to see them here." : "Try adjusting your search or filter."}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 24, alignItems: "stretch" }}>
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
                        <span style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{toInitials(w.initials)}</span>
                      </div>
                    )}

                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

                    <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                      {w.code}
                    </div>

                    <div style={{ position: "absolute", bottom: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px" }}>
                      {w.status === "active" ? (
                        <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                      ) : w.status === "qc" ? (
                        <Clock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                      ) : (
                        <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" as const, letterSpacing: "0.5px", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
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
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase" }}>
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
                          <Rows size={14} color={T.royalBurgundy} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                          <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                      <Button
                        onClick={() => onNavigate?.("Weavers", { weaverId: w.id, mode: "view" })}
                        variant="secondary"
                        size="sm"
                        iconLeft={Eye}
                        fullWidth
                      >
                        Details
                      </Button>
                      <Button
                        onClick={() => onNavigate?.("Weavers", { weaverId: w.id, mode: "edit" })}
                        variant="tertiary"
                        size="sm"
                        iconLeft={Edit3}
                        fullWidth
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onNavigate?.("Weavers", { weaverId: w.id, mode: "view" })}
                        variant="secondary"
                        size="sm"
                        iconLeft={Layers3}
                        fullWidth
                      >
                        Batches
                      </Button>
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
