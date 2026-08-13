import React, { useMemo, useState } from "react";
import { Users, ClipboardList, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { useFinishing, FinishingAssignment, FinishingReturn } from "../contexts/FinishingContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { Button, SearchInput } from "../../../shared/ui/primitives";
import { FinishingQuotationsSection } from "./FinishingQuotationsSection";
import { FinishingStaffSection, StaffRow } from "./FinishingStaffSection";

const T = {
  silkCream:     "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = { card: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)" };

function StatChip({ label, value, tone = "plain" }: { label: string; value: string; tone?: "plain" | "gold" | "green" | "red" }) {
  const c = tone === "gold" ? T.antiqueGold : tone === "green" ? "#6DCE9A" : tone === "red" ? "#F0857D" : "#FFFDF9";
  const bg = tone === "gold" ? "rgba(200,155,71,0.18)" : tone === "green" ? "rgba(30,102,64,0.20)" : tone === "red" ? "rgba(224,82,82,0.18)" : "rgba(255,253,249,0.10)";
  const bd = tone === "gold" ? "rgba(200,155,71,0.38)" : tone === "green" ? "rgba(30,102,64,0.35)" : tone === "red" ? "rgba(224,82,82,0.35)" : "rgba(255,253,249,0.15)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: bg, border: `1px solid ${bd}`, borderRadius: 99, padding: "9px 18px" }}>
      <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: c }}>{value}</span>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: tone === "plain" ? "rgba(255,253,249,0.68)" : c }}>{label}</span>
    </div>
  );
}

function parseDMY(s: string): number {
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

function summarizeAssignedBy(list: FinishingAssignment[]): string {
  const names = [...new Set(list.map(a => a.assignedBy))];
  if (names.length === 0) return "—";
  if (names.length === 1) return names[0];
  return `${names.length} people`;
}

export function FinishingTrackingPage() {
  const { assignments, returns, quotations } = useFinishing();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "awaiting" | "perfect" | "damaged">("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [open, setOpen] = useState<string | null>(null);
  const [openQuotation, setOpenQuotation] = useState<string | null>(null);

  const rows = useMemo<StaffRow[]>(() => {
    const byStaff = new Map<string, FinishingAssignment[]>();
    assignments.forEach(a => {
      const list = byStaff.get(a.finishingStaffName) ?? [];
      list.push(a);
      byStaff.set(a.finishingStaffName, list);
    });
    return [...byStaff.entries()].map(([name, staffAssignments]) => {
      const sareeIds = staffAssignments.map(a => a.sareeId);
      const staffReturns = returns.filter(r => sareeIds.includes(r.sareeId));
      const perfect = staffReturns.filter(r => r.condition === "perfect").length;
      const damaged = staffReturns.filter(r => r.condition === "damaged").length;
      const pending = staffAssignments.length - staffReturns.length;
      const lastAssignmentDate = staffAssignments.map(a => a.assignedDate).sort((a, b) => parseDMY(b) - parseDMY(a))[0] ?? "—";
      return { name, assignments: staffAssignments, returns: staffReturns, perfect, damaged, pending, lastAssignmentDate, assignedByLabel: summarizeAssignedBy(staffAssignments) };
    }).sort((a, b) => parseDMY(b.lastAssignmentDate) - parseDMY(a.lastAssignmentDate));
  }, [assignments, returns]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .map(r => ({
        ...r,
        visibleAssignments: r.assignments.filter(a => {
          const ret = returns.find(rt => rt.sareeId === a.sareeId);
          if (statusFilter === "awaiting" && ret) return false;
          if (statusFilter === "perfect" && ret?.condition !== "perfect") return false;
          if (statusFilter === "damaged" && ret?.condition !== "damaged") return false;
          if (!matchesDateFilter(a.assignedDate, dateFilter)) return false;
          if (!q) return true;
          return a.sareeId.toLowerCase().includes(q) || a.weaverName.toLowerCase().includes(q) || a.sareeType.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || a.assignedBy.toLowerCase().includes(q);
        }),
      }))
      .filter(r => r.visibleAssignments.length > 0);
  }, [rows, search, statusFilter, dateFilter, returns]);

  const totalAssigned = assignments.length;
  const totalAwaiting = assignments.filter(a => a.status === "awaiting-return").length;
  const totalPerfect = returns.filter(r => r.condition === "perfect").length;
  const totalDamaged = returns.filter(r => r.condition === "damaged").length;

  const filteredQuotations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotations
      .filter(qt => matchesDateFilter(qt.quotationDate, dateFilter))
      .filter(qt => {
        if (!q) return true;
        return qt.quotationNumber.toLowerCase().includes(q) || qt.customerName.toLowerCase().includes(q)
          || (qt.finishingStaffName || "").toLowerCase().includes(q) || qt.raisedBy.toLowerCase().includes(q)
          || qt.sarees.some(s => s.sareeId.toLowerCase().includes(q));
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [quotations, search, dateFilter]);

  return (
    <div style={{ background: T.silkCream, fontFamily: F.ui, minHeight: "100dvh" }}>
      {/* HERO */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110, flex: "0 0 100%", maxWidth: "100%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
            PRODUCTION · FINISHING
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(32px, 8vw, 56px)", color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
              Finishing Assignment &amp; Receiving
            </h1>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: 0, lineHeight: 1.6, maxWidth: 600 }}>
            Every saree sent to finishing staff, who assigned it, and what came back — plus every bulk-order
            quotation routed through finishing. The same tracking Worker Staff sees, visible here for admin and superadmin.
          </p>
          <div style={{ paddingBottom: 64 }}></div>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]" style={{ position: "relative", zIndex: 20 }}>
        <div className="grid grid-cols-2 xl:flex" style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { label: "TOTAL ASSIGNED",        val: totalAssigned,                                                      Icon: ClipboardList, hi: false, col: undefined, sub: "Sarees in finishing" },
            { label: "AWAITING RETURN",       val: totalAwaiting,                                                      Icon: Clock,         hi: true,  col: undefined, sub: "Pending completion" },
            { label: "RECEIVED · PERFECT",    val: totalPerfect,                                                       Icon: CheckCircle2,  hi: false, col: "#6EE7B7", sub: "Passed QA" },
            { label: "RECEIVED · DAMAGED",    val: totalDamaged,                                                       Icon: AlertTriangle, hi: false, col: "#FCA5A5", sub: "Requires inspection" },
            { label: "QUOTATIONS",            val: quotations.filter(q => q.status !== "dispatched").length,           Icon: FileText,      hi: false, col: undefined, sub: "Bulk orders routing" },
          ].map((m, i) => (
            <div
              key={m.label}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.Icon size={20} color={m.col || (m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)")} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.hi ? T.antiqueGold : (m.col || "#FFFDF9"), lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                    {m.sub}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "22px 40px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Filters */}
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <SearchInput value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search saree code, weaver, saree type, finishing staff…" />
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { key: "all", label: "All" },
                { key: "awaiting", label: "Awaiting Return" },
                { key: "perfect", label: "Received · Perfect" },
                { key: "damaged", label: "Received · Damaged" },
              ].map(f => (
                <Button key={f.key} variant={statusFilter === f.key ? "primary" : "secondary"} size="sm"
                  onClick={() => setStatusFilter(f.key as typeof statusFilter)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: T.warmCream, borderRadius: 10, padding: "8px 14px" }}>
              <Users size={15} color={T.taupe} />
              <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, fontWeight: 600 }}>{filteredRows.length} finishing staff</span>
            </div>
          </div>
        </div>

        {/* Quotations for Finishing */}
        <FinishingQuotationsSection
          filteredQuotations={filteredQuotations}
          openQuotation={openQuotation}
          setOpenQuotation={setOpenQuotation}
        />

        {/* Staff-wise tracking */}
        <FinishingStaffSection
          filteredRows={filteredRows}
          open={open}
          setOpen={setOpen}
          returns={returns}
        />
      </div>
    </div>
  );
}
