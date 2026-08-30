import { useState, useMemo, type CSSProperties } from "react";
import { Users, ChevronDown, Camera, LayoutGrid, List, ImageOff } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing, FinishingAssignment, FinishingReturn } from "@/features/finishing";
import { SectionCard } from "../primitives";
import { Button, SearchInput, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { EntityCode } from "@/shared/ui/domain";
import { useSareeDetails, formatDate, formatWeight, type SareeDetail } from "./sareeDetails";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { Pagination, usePagination } from "../../../../../shared/ui/DataPagination";
import { ImageZoomModal, type ZoomImage } from "../../../../../shared/ui/ImageZoomModal";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";

// ── Section C — Assignment History & Tracking ─────────────────────────────────

interface StaffTrackingRow {
  name: string;
  assignedSareeIds: string[];
  returnedSareeIds: string[];
  perfect: number;
  damaged: number;
  lastAssignmentDate: string;
}

function parseDMYDate(s: string): number {
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

const formatDateStr = (s?: string) => formatDate(s);

function StaffAssignmentsTable({ data, columns }: { data: FinishingAssignment[]; columns: ColumnDef<FinishingAssignment>[] }) {
  const pag = usePagination(data, 10);
  return (
    <div>
      <DataTable columns={columns} data={pag.pageItems} getRowId={a => a.id} />
      <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
        onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
    </div>
  );
}

function StaffAssignmentsMobileList({ data, returns, onViewPhoto }: { data: FinishingAssignment[]; returns: FinishingReturn[]; onViewPhoto: (image: ZoomImage) => void }) {
  const pag = usePagination(data, 10);
  return (
    <div style={{ borderTop: `1px solid rgba(110,15,45,0.08)`, background: "rgba(110,15,45,0.02)", padding: "10px 14px 14px" }}>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {pag.pageItems.map(a => {
          const ret = returns.find(rt => rt.sareeId === a.sareeId);
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: `1px solid rgba(110,15,45,0.06)`, paddingBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {ret?.damagePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => onViewPhoto({ url: ret.damagePhotoUrl!, label: `Damage photo — ${a.sareeId}` })}
                    style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", padding: 0 }}
                    title="View damage photo"
                  >
                    <Camera size={12} color="rgba(255,255,255,0.85)" />
                  </button>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg, fontWeight: 600 }}>{a.sareeId}</span>
                    {a.quotationRef && (
                      <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,146,58,0.14)", borderRadius: 999, padding: "1px 6px" }}>{a.quotationRef}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{formatDateStr(a.assignedDate)}{ret?.receivedDate ? ` → ${formatDateStr(ret.receivedDate)}` : ""}</div>
                </div>
              </div>
              {!ret ? (
                <span style={{ fontFamily: F.u, fontSize: 12, color: "#B85C00", fontWeight: 600, flexShrink: 0 }}>Awaiting Return</span>
              ) : ret.condition === "perfect" ? (
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600, flexShrink: 0 }}>Perfect ✓</span>
              ) : (
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim, fontWeight: 600, flexShrink: 0 }}>Damaged ⚠</span>
              )}
            </div>
          );
        })}
      </div>
      <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
        onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
    </div>
  );
}

export function SectionC({ isMobile }: { isMobile?: boolean }) {
  const { assignments, returns, isLoading, isError, error, refetch } = useFinishing();
  const details = useSareeDetails();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // "Where is saree X?" is the question this section exists to answer, so the
  // outcome is filterable rather than something to hunt for row by row.
  const [conditionFilter, setConditionFilter] = useState<"all" | "awaiting" | "perfect" | "damaged">("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const returnBySaree = useMemo(() => {
    const map = new Map<string, FinishingReturn>();
    returns.forEach(r => map.set(r.sareeId, r));
    return map;
  }, [returns]);

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter(a => {
      const d = details.get(a.sareeId);
      // Searchable by everything the row actually displays — not just the
      // saree id and staff name, which meant a batch or loom typed into the
      // box silently matched nothing.
      const haystack = [
        a.sareeId, a.finishingStaffName, a.assignedBy, a.batchId, a.quotationRef,
        a.sareeTypeCode, a.sareeType, a.weaverName,
        d?.producerName, d?.weaverCode, d?.loomLabel, d?.sareeTypeCode, d?.sareeTypeName,
        d?.designCode, d?.bulkOrderRef, d?.color,
      ].filter(Boolean).join(" ").toLowerCase();
      const searchOk = !q || haystack.includes(q);
      const ret = returnBySaree.get(a.sareeId);
      const conditionOk = conditionFilter === "all"
        || (conditionFilter === "awaiting" ? !ret : ret?.condition === conditionFilter);
      const dateOk = matchesDateFilter(a.assignedDate, dateFilter);
      return searchOk && conditionOk && dateOk;
    });
  }, [assignments, search, dateFilter, details, returnBySaree, conditionFilter]);

  const rows = useMemo<StaffTrackingRow[]>(() => {
    const byStaff = new Map<string, FinishingAssignment[]>();
    filteredAssignments.forEach(a => {
      const list = byStaff.get(a.finishingStaffName) ?? [];
      list.push(a);
      byStaff.set(a.finishingStaffName, list);
    });

    return Array.from(byStaff.entries()).map(([name, staffAssignments]) => {
      const assignedSareeIds = staffAssignments.map(a => a.sareeId);
      const staffReturns = returns.filter(r => assignedSareeIds.includes(r.sareeId));
      const returnedSareeIds = staffReturns.map(r => r.sareeId);
      const perfect = staffReturns.filter(r => r.condition === "perfect").length;
      const damaged = staffReturns.filter(r => r.condition === "damaged").length;
      const lastAssignmentDate = staffAssignments
        .map(a => a.assignedDate)
        .sort((a, b) => parseDMYDate(b) - parseDMYDate(a))[0] ?? "—";

      return { name, assignedSareeIds, returnedSareeIds, perfect, damaged, lastAssignmentDate };
    }).sort((a, b) => parseDMYDate(b.lastAssignmentDate) - parseDMYDate(a.lastAssignmentDate));
  }, [filteredAssignments, returns]);

  const outerPag = usePagination(rows, 10);

  const TD: CSSProperties = { fontFamily: F.u, fontSize: 12, color: C.text, padding: "10px 10px", verticalAlign: "middle" as const };

  const staffColumns: ColumnDef<StaffTrackingRow>[] = [
    { id: "name", header: "Finishing Staff", accessor: r => r.name, cell: (_v, r) => <span style={{ ...TD, fontWeight: 600, padding: 0 }}>{r.name}</span> },
    { id: "assigned", header: "Assigned", accessor: r => r.assignedSareeIds.length },
    { id: "returned", header: "Returned", accessor: r => r.returnedSareeIds.length },
    {
      id: "pending", header: "Pending Return", accessor: r => r.assignedSareeIds.length - r.returnedSareeIds.length,
      cell: (_v, r) => {
        const pending = r.assignedSareeIds.length - r.returnedSareeIds.length;
        return <span style={{ color: pending > 0 ? "#B85C00" : C.text, fontWeight: pending > 0 ? 700 : 400 }}>{pending}</span>;
      },
    },
    { id: "perfect", header: "Perfect", accessor: r => r.perfect, cell: v => <span style={{ color: C.green, fontWeight: 600 }}>{v as number}</span> },
    {
      id: "damaged", header: "Damaged", accessor: r => r.damaged,
      cell: (v, r) => <span style={{ color: r.damaged > 0 ? C.crim : C.text, fontWeight: r.damaged > 0 ? 700 : 400 }}>{v as number}</span>,
    },
    { id: "last", header: "Last Assignment", accessor: r => formatDateStr(r.lastAssignmentDate), cell: v => <span style={{ fontFamily: F.m, fontSize: 12 }}>{v as string}</span> },
    {
      id: "expand", header: "", align: "end", accessor: () => null,
      cell: (_v, r) => (
        <Button variant="link" onClick={() => setExpanded(expanded === r.name ? null : r.name)}
          className="p-0 text-xs font-semibold text-[#6E0F2D] whitespace-nowrap">
          View Details <ChevronDown size={12} style={{ transform: expanded === r.name ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </Button>
      ),
    },
  ];

  const D = (a: FinishingAssignment): SareeDetail | undefined => details.get(a.sareeId);
  const dash = <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>;
  const goldChip: CSSProperties = { fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "3px 9px", whiteSpace: "nowrap" };

  const assignmentColumns: ColumnDef<FinishingAssignment>[] = [
    {
      id: "sareeId", header: "Saree ID", accessor: a => a.sareeId, priority: 1, sortable: true,
      cell: (_v, a) => <EntityCode type="saree" value={a.sareeId} size="sm" copyable />,
    },
    {
      // The assignment endpoint returns no weaver for an own-factory saree, so
      // every factory row printed "—" here. Falling back to the batch row's
      // loom gives it the name it always had.
      id: "weaver", header: "Weaver / Loom", accessor: a => D(a)?.producerName ?? a.weaverName, priority: 2, sortable: true,
      cell: (_v, a) => {
        const d = D(a);
        const name = d?.producerName ?? (a.weaverName !== "—" ? a.weaverName : null);
        if (!name) return dash;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.text, whiteSpace: "nowrap" }}>{name}</span>
            {d?.weaverCode && <span style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{d.weaverCode}</span>}
          </div>
        );
      },
    },
    {
      id: "loom", header: "Loom No.", accessor: a => D(a)?.loomLabel ?? "", priority: 3,
      cell: (_v, a) => {
        const l = D(a)?.loomLabel;
        return l ? <span style={{ ...goldChip, color: C.burg, background: "rgba(110,15,45,0.07)", borderColor: "rgba(110,15,45,0.14)" }}>{l}</span> : dash;
      },
    },
    {
      id: "sareeType", header: "Saree Type", accessor: a => a.sareeTypeCode ?? D(a)?.sareeTypeCode ?? "", priority: 3, sortable: true,
      cell: (_v, a) => {
        const d = D(a);
        const code = a.sareeTypeCode ?? d?.sareeTypeCode ?? null;
        const name = d?.sareeTypeName ?? (a.sareeType !== "—" ? a.sareeType : null);
        if (!code && !name) return dash;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            {code && <span style={goldChip}>{code}</span>}
            {name && name.toLowerCase() !== (code ?? "").toLowerCase() && (
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{name}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "batch", header: "Batch", accessor: a => a.batchId ?? D(a)?.batchId ?? "", priority: 3,
      cell: (_v, a) => {
        const b = a.batchId ?? D(a)?.batchId;
        return b ? <EntityCode type="batch" value={b} size="sm" /> : dash;
      },
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: a => D(a)?.bulkOrderRef ?? "", priority: 3,
      cell: (_v, a) => {
        const bo = D(a)?.bulkOrderRef;
        return bo
          ? <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>{bo}</span>
          : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>General stock</span>;
      },
    },
    {
      id: "weight", header: "Weight", accessor: a => D(a)?.weightG ?? 0, align: "end", priority: 3, sortable: true,
      cell: (_v, a) => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: D(a)?.weightG != null ? C.text : C.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {formatWeight(D(a)?.weightG)}
        </span>
      ),
    },
    {
      id: "quotation", header: "Quotation", accessor: a => a.quotationRef, priority: 3,
      cell: v => v ? (
        <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "#8B6018", background: "rgba(200,146,58,0.14)", borderRadius: 999, padding: "2px 8px", display: "inline-block", whiteSpace: "nowrap" }}>{v as string}</span>
      ) : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Stock</span>,
    },
    {
      id: "assignedBy", header: "Assigned By", accessor: a => a.assignedBy, priority: 3,
      cell: v => <span style={{ fontFamily: F.u, fontSize: 12, color: C.text, whiteSpace: "nowrap" }}>{(v as string) || "—"}</span>,
    },
    {
      id: "assignedDate", header: "Assigned", accessor: a => a.assignedDate, priority: 3, sortable: true,
      cell: (_v, a) => <span style={{ fontFamily: F.u, fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatDateStr(a.assignedDate)}</span>,
    },
    {
      id: "returnedDate", header: "Returned", accessor: a => returnBySaree.get(a.sareeId)?.receivedDate ?? "", priority: 3,
      cell: (_v, a) => {
        const r = returnBySaree.get(a.sareeId);
        return r
          ? <span style={{ fontFamily: F.u, fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatDateStr(r.receivedDate)}</span>
          : dash;
      },
    },
    {
      id: "condition", header: "Condition", accessor: a => returnBySaree.get(a.sareeId)?.condition ?? "awaiting", type: "status", priority: 1,
      cell: (_v, a) => {
        const ret = returnBySaree.get(a.sareeId);
        const cfg = !ret
          ? { label: "Awaiting Return", fg: "#8D5802", bg: "rgba(200,155,71,0.14)", bd: "rgba(200,155,71,0.32)" }
          : ret.condition === "perfect"
            ? { label: "Perfect", fg: "#1F774E", bg: "rgba(30,102,64,0.10)", bd: "rgba(30,102,64,0.22)" }
            : { label: `Damaged${ret.damageSeverity ? ` · ${ret.damageSeverity}` : ""}`, fg: "#B03024", bg: "rgba(192,57,43,0.08)", bd: "rgba(192,57,43,0.24)" };
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.bd}`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{cfg.label}</span>
            {ret?.damageType && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{ret.damageType}</span>}
          </div>
        );
      },
    },
    {
      id: "photo", header: "Photo", accessor: a => returnBySaree.get(a.sareeId)?.damagePhotoUrl,
      cell: (v, a) => v ? (
        <button
          type="button"
          onClick={() => setZoomImage({ url: v as string, label: `Damage photo — ${a.sareeId}` })}
          style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", padding: 0 }}
          title="View damage photo"
        >
          <Camera size={12} color="rgba(255,255,255,0.85)" />
        </button>
      ) : (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: `1px dashed ${C.bdr}`, color: C.muted }} title="No photo on file">
          <ImageOff size={12} />
        </span>
      ),
    },
  ];

  return (
    <SectionCard
      icon={Users}
      title="Assignment History & Tracking"
      subtitle="Every finishing staff member, what they hold and what they have returned."
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {rows.length} staff · {filteredAssignments.length} sarees
          </span>
        </div>
      }
    >
      {assignments.length > 0 && (
        <>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <SearchInput
              aria-label="Search assignment history"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={setSearch}
              placeholder="Search by saree ID, staff, weaver, loom, batch, quotation…"
              className="w-full md:flex-1"
            />
            <Select
              value={conditionFilter}
              onValueChange={v => setConditionFilter(v as typeof conditionFilter)}
              className="w-full md:w-[220px] shrink-0"
            >
              <SelectItem value="all">All outcomes</SelectItem>
              <SelectItem value="awaiting">Awaiting return</SelectItem>
              <SelectItem value="perfect">Returned perfect</SelectItem>
              <SelectItem value="damaged">Returned damaged</SelectItem>
            </Select>
          </div>
          <div className="mb-4">
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>
        </>
      )}

      {isMobile && (
        <div className="flex items-center justify-between gap-3 mb-4 mt-3">
          <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
            <Button
              onClick={() => setViewMode("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${viewMode === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
                }`}
            >
              <LayoutGrid size={14} /> Card View
            </Button>
            <Button
              onClick={() => setViewMode("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${viewMode === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
                }`}
            >
              <List size={14} /> Table View
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState variant="skeleton" rows={4} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          {assignments.length === 0 ? "No finishing staff assignments yet." : "No results for selected filters."}
        </div>
      ) : isMobile && viewMode === "card" ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {outerPag.pageItems.map(r => {
            const pending = r.assignedSareeIds.length - r.returnedSareeIds.length;
            const isOpen = expanded === r.name;
            return (
              <div key={r.name} style={{ border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 16, overflow: "hidden", background: "#FFF", boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
                <div onClick={() => setExpanded(isOpen ? null : r.name)} role="button" aria-label={`${isOpen ? "Collapse" : "Expand"} ${r.name}`} aria-expanded={isOpen} tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(isOpen ? null : r.name); } }} style={{ padding: "14px 16px", cursor: "pointer", background: isOpen ? "rgba(110,15,45,0.03)" : "#FFF" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 700, color: C.wine }}>{r.name}</span>
                      <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 2 }}>
                        Last active: {formatDateStr(r.lastAssignmentDate)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.burg, background: "rgba(110,15,45,0.08)", borderRadius: 999, padding: "2px 8px" }}>
                        {r.assignedSareeIds.length} sarees
                      </span>
                      <ChevronDown size={16} color={C.muted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, background: C.bg, padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.bdr}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600 }}>Assigned:</span>
                        <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: C.text }}>{r.assignedSareeIds.length}</span>
                      </div>
                      <div style={{ width: 1, height: 12, background: "rgba(110,15,45,0.15)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600 }}>Returned:</span>
                        <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: C.text }}>{r.returnedSareeIds.length}</span>
                      </div>
                      <div style={{ width: 1, height: 12, background: "rgba(110,15,45,0.15)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600 }}>Pending:</span>
                        <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: pending > 0 ? "#B85C00" : C.text }}>{pending}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 6, background: C.bg, padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.bdr}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600 }}>Perfect:</span>
                        <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: C.green }}>{r.perfect}</span>
                      </div>
                      <div style={{ width: 1, height: 12, background: "rgba(110,15,45,0.15)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600 }}>Damaged:</span>
                        <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: r.damaged > 0 ? C.crim : C.text }}>{r.damaged}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <StaffAssignmentsMobileList
                    data={filteredAssignments.filter(a => a.finishingStaffName === r.name)}
                    returns={returns}
                    onViewPhoto={setZoomImage}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div data-pagination-target style={{ border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          <DataTable
            columns={staffColumns}
            data={outerPag.pageItems}
            getRowId={r => r.name}
            expandedIds={expanded ? new Set([expanded]) : undefined}
            renderExpandedRow={r => (
              <div style={{ padding: "10px 14px 14px", background: "rgba(110,15,45,0.02)" }}>
                <div className="overflow-x-auto section-nav-scroll">
                  <div className="min-w-[1080px]">
                    <StaffAssignmentsTable
                      columns={assignmentColumns}
                      data={filteredAssignments.filter(a => a.finishingStaffName === r.name)}
                    />
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}
      <Pagination
        page={outerPag.page}
        pageCount={outerPag.pageCount}
        total={outerPag.total}
        pageSize={outerPag.pageSize}
        start={outerPag.start}
        onPageChange={outerPag.setPage}
        onPageSizeChange={outerPag.setPageSize}
        itemLabel="staff members"
      />
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </SectionCard>
  );
}
