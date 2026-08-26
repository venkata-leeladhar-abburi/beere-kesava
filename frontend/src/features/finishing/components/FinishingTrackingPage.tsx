import React, { useMemo, useState } from "react";
import { Users, ClipboardList, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { useFinishing, FinishingAssignment } from "../contexts/FinishingContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { Button, SearchInput } from "../../../shared/ui/primitives";
import { FinishingQuotationsSection } from "./FinishingQuotationsSection";
import { FinishingStaffSection, StaffRow } from "./FinishingStaffSection";
import { LuxuryStatsCard } from "../../../shared/ui/LuxuryStatsCard";
import { TableError } from "../../../shared/ui/data/TableStates";
import { LoadingState } from "../../../shared/ui/state";

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
  const { assignments, returns, quotations, isError, isLoading, refetch } = useFinishing();
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
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
            PRODUCTION · FINISHING
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(32px, 6vw, 56px)", color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
              Finishing Assignment &amp; Receiving
            </h1>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", margin: 0, lineHeight: 1.6 }}>
            Every saree sent to finishing staff, who assigned it, and what came back — plus every bulk-order
            quotation routed through finishing. The same tracking Worker Staff sees, visible here for admin and superadmin.
          </p>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]" style={{ position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={[
          { label: "TOTAL ASSIGNED", value: String(totalAssigned), icon: <ClipboardList size={20} color="rgba(245,232,208,0.90)" />, sub: "Sarees in finishing", highlight: false },
          { label: "AWAITING RETURN", value: String(totalAwaiting), icon: <Clock size={20} color="rgba(245,232,208,0.90)" />, sub: "Pending completion", highlight: true },
          { label: "RECEIVED · PERFECT", value: String(totalPerfect), icon: <CheckCircle2 size={20} color="#6EE7B7" />, sub: "Passed QA", highlight: false },
          { label: "RECEIVED · DAMAGED", value: String(totalDamaged), icon: <AlertTriangle size={20} color="#FCA5A5" />, sub: "Requires inspection", highlight: false, crimson: totalDamaged > 0 },
          { label: "QUOTATIONS", value: String(quotations.filter(q => q.status !== "dispatched").length), icon: <FileText size={20} color="rgba(245,232,208,0.90)" />, sub: "Bulk orders routing", highlight: false },
        ]} />
      </div>

      <div className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 22, paddingBottom: 48, display: "flex", flexDirection: "column", gap: 20 }}>
        {isLoading ? (
          <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: 20 }}>
            <LoadingState variant="skeleton" rows={4} />
          </div>
        ) : isError ? (
          <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)" }}>
            <TableError onRetry={refetch} />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 260px" }}>
                  <SearchInput aria-label="Search saree code, weaver, saree type, finishing staff" value={search} onChange={e => setSearch(e.target.value)}
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.taupe, fontWeight: 600 }}>{filteredRows.length} finishing staff</span>
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
          </>
        )}
      </div>
    </div>
  );
}
