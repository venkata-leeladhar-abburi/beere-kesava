import React, { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useFinishing, FinishingAssignment, FinishingReturn } from "../contexts/FinishingContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { FinishingQuotationsSection } from "./FinishingQuotationsSection";
import { FinishingStaffSection, StaffRow } from "./FinishingStaffSection";

const T = {
  silkCream:     "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
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
      <span style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: c }}>{value}</span>
      <span style={{ fontFamily: F.ui, fontSize: 12.5, color: tone === "plain" ? "rgba(255,253,249,0.68)" : c }}>{label}</span>
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
    <div style={{ background: T.silkCream, fontFamily: F.ui, minHeight: "100vh" }}>
      {/* HERO */}
      <section style={{ background: G.card, padding: "44px 40px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, rgba(200,155,71,0.04) 0px, rgba(200,155,71,0.04) 1px, transparent 1px, transparent 60px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.80)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>
            PRODUCTION · FINISHING
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: "#FFFDF9", margin: 0, lineHeight: 1.12 }}>
            Finishing Assignment &amp; Receiving
          </h1>
          <p style={{ fontFamily: F.ui, fontSize: 14.5, color: "rgba(255,253,249,0.65)", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 720 }}>
            Every saree sent to finishing staff, who assigned it, and what came back — plus every bulk-order
            quotation routed through finishing. The same tracking Worker Staff sees, visible here for admin and superadmin.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "26px 0 32px" }}>
            <StatChip label="Total Assigned" value={String(totalAssigned)} />
            <StatChip label="Awaiting Return" value={String(totalAwaiting)} tone="gold" />
            <StatChip label="Received · Perfect" value={String(totalPerfect)} tone="green" />
            <StatChip label="Received · Damaged" value={String(totalDamaged)} tone="red" />
            <StatChip label="Quotations in Finishing" value={String(quotations.filter(q => q.status !== "dispatched").length)} tone="gold" />
          </div>
        </div>
      </section>

      <div style={{ padding: "22px 40px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Filters */}
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 260px" }}>
              <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search saree code, weaver, saree type, finishing staff…"
                style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 14, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 11, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { key: "all", label: "All" },
                { key: "awaiting", label: "Awaiting Return" },
                { key: "perfect", label: "Received · Perfect" },
                { key: "damaged", label: "Received · Damaged" },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key as typeof statusFilter)}
                  style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, padding: "8px 14px", borderRadius: 99, cursor: "pointer", background: statusFilter === f.key ? T.royalBurgundy : "transparent", color: statusFilter === f.key ? "#FFFDF9" : T.taupe, border: statusFilter === f.key ? "none" : `1.5px solid rgba(110,15,45,0.18)` }}>
                  {f.label}
                </button>
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
