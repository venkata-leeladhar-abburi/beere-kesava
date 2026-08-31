import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Package, Camera, Users, LayoutGrid, List } from "lucide-react";
import { FinishingAssignment, FinishingReturn } from "../contexts/FinishingContext";
import { Button } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { SectionCard } from "./common/primitives";
import { ImageZoomModal, type ZoomImage } from "../../../shared/ui/ImageZoomModal";
import { Pagination, usePagination } from "../../../shared/ui/DataPagination";

const T = {
  royalBurgundy: "#6E0F2D",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  crimson:       "#C0392B",
  green:         "#1E6640",
  orange:        "#E67E22",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function Pill({ label, color, bg, title, allowBreak }: { label: string; color: string; bg: string; title?: string; allowBreak?: boolean }) {
  return (
    <span
      title={title ?? label}
      style={{
        fontFamily: F.ui,
        fontWeight: 600,
        fontSize: 11,
        color,
        background: bg,
        borderRadius: 8,
        padding: "3px 8px",
        whiteSpace: allowBreak ? "normal" : "nowrap",
        wordBreak: allowBreak ? "break-all" : "normal",
        display: "inline-block",
        maxWidth: "100%",
        verticalAlign: "middle",
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
  );
}

function formatDisplayDate(d?: string | null): string {
  if (!d) return "—";
  const str = String(d).trim();
  if (str.includes("T")) {
    return str.split("T")[0] ?? str;
  }
  return str;
}

const td: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "11px 12px", borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle" };
const tdMono: React.CSSProperties = { ...td, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.royalBurgundy };

function buildAssignmentColumns(returns: FinishingReturn[], onViewPhoto: (image: ZoomImage) => void): ColumnDef<FinishingAssignment>[] {
  const findRet = (a: FinishingAssignment) => returns.find(rt => rt.sareeId === a.sareeId);
  return [
    {
      id: "sareeCode",
      header: "Saree Code",
      accessor: a => a.sareeId,
      priority: 1,
      width: 170,
      cell: (_v, a) => <span style={{ ...tdMono, whiteSpace: "nowrap" }}>{a.sareeId}</span>,
    },
    {
      id: "quotation",
      header: "Quotation",
      accessor: a => a.quotationRef,
      width: 165,
      cell: (_v, a) => a.quotationRef ? (
        <Pill
          label={a.quotationRef}
          color="#8B6018"
          bg="rgba(200,146,58,0.14)"
        />
      ) : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>,
    },
    {
      id: "sareeType",
      header: "Saree Type",
      accessor: a => a.sareeType,
      width: 180,
      cell: (_v, a) => <span style={{ ...td, whiteSpace: "nowrap" }}>{a.sareeTypeCode ? `${a.sareeTypeCode} · ` : ""}{a.sareeType}</span>,
    },
    {
      id: "weaver",
      header: "Weaver",
      accessor: a => a.weaverName,
      width: 140,
      cell: (_v, a) => <span style={{ ...td, whiteSpace: "nowrap" }}>{a.weaverName}</span>,
    },
    {
      id: "assignedOn",
      header: "Assigned On",
      accessor: a => a.assignedDate,
      width: 120,
      cell: (_v, a) => <span style={{ ...td, whiteSpace: "nowrap" }}>{formatDisplayDate(a.assignedDate)}</span>,
    },
    {
      id: "assignedBy",
      header: "Assigned By",
      accessor: a => a.assignedBy,
      priority: 3,
      width: 140,
      cell: (_v, a) => <span style={{ ...td, whiteSpace: "nowrap" }}>{a.assignedBy}</span>,
    },
    {
      id: "returnStatus",
      header: "Return Status",
      accessor: a => findRet(a)?.condition,
      width: 200,
      cell: (_v, a) => {
        const ret = findRet(a);
        return !ret ? (
          <Pill label="Awaiting Return" color={T.orange} bg="rgba(230,126,34,0.12)" />
        ) : (
          <div style={{ whiteSpace: "nowrap" }}>
            <Pill
              label={ret.condition === "perfect" ? "Received · Perfect" : `Received · Damaged${ret.damageSeverity ? ` (${ret.damageSeverity})` : ""}`}
              color={ret.condition === "perfect" ? T.green : T.crimson}
              bg={ret.condition === "perfect" ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.10)"}
            />
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{formatDisplayDate(ret.receivedDate)} · by {ret.receivedBy}</div>
            {ret.condition === "damaged" && ret.damageNotes && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, marginTop: 2 }}>{ret.damageType || "Damage"}: {ret.damageNotes}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "photo",
      header: "Photo",
      accessor: a => findRet(a)?.damagePhotoUrl,
      priority: 3,
      align: "center",
      width: 80,
      cell: (_v, a) => {
        const ret = findRet(a);
        return ret?.damagePhotoUrl ? (
          <button
            type="button"
            onClick={() => onViewPhoto({ url: ret.damagePhotoUrl!, label: `Damage photo — ${a.sareeId}` })}
            style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", padding: 0, margin: "0 auto" }}
            title="View damage photo"
          >
            <Camera size={12} color="rgba(255,255,255,0.85)" />
          </button>
        ) : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>;
      },
    },
    {
      id: "inventoryStatus",
      header: "Inventory Status",
      accessor: a => findRet(a)?.inventoryStatus,
      priority: 3,
      width: 160,
      cell: (_v, a) => {
        const ret = findRet(a);
        return ret ? (
          <Pill label={ret.inventoryStatus} color={ret.inventoryStatus === "Dispatched" ? T.green : ret.inventoryStatus.startsWith("Damaged") ? T.crimson : T.royalBurgundy}
            bg={ret.inventoryStatus === "Dispatched" ? "rgba(30,102,64,0.09)" : ret.inventoryStatus.startsWith("Damaged") ? "rgba(192,57,43,0.10)" : "rgba(110,15,45,0.06)"} />
        ) : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>;
      },
    },
  ];
}

export interface StaffRow {
  name: string;
  assignments: FinishingAssignment[];
  returns: FinishingReturn[];
  perfect: number;
  damaged: number;
  pending: number;
  lastAssignmentDate: string;
  assignedByLabel: string;
  visibleAssignments?: FinishingAssignment[];
}

interface FinishingStaffSectionProps {
  filteredRows: (StaffRow & { visibleAssignments: FinishingAssignment[] })[];
  open: string | null;
  setOpen: (name: string | null) => void;
  returns: FinishingReturn[];
}

export function FinishingStaffSection({
  filteredRows,
  open,
  setOpen,
  returns,
}: FinishingStaffSectionProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const pag = usePagination(filteredRows, 10);

  return (
    <SectionCard
      icon={Users}
      title="Assignment History by Finishing Staff"
      subtitle="Every finishing staff member, what has been assigned to them, and what they've returned so far."
    >
      {filteredRows.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <Package size={40} color={T.taupe} style={{ opacity: 0.45, marginBottom: 12 }} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No finishing assignments match the current filters.</div>
        </div>
      ) : (
        <div data-pagination-target>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pag.pageItems.map(r => {
            const isOpen = open === r.name;
            return (
              <div key={r.name} style={{ border: `1px solid rgba(110,15,45,0.3)`, borderRadius: 14, overflow: "hidden" }}>
                <Button variant="ghost" onClick={() => setOpen(isOpen ? null : r.name)}
                  className={`w-full h-auto justify-start text-left p-4 sm:p-4.5 rounded-none ${isOpen ? "bg-[rgba(110,15,45,0.04)]" : "bg-white"}`}>
                  <div className="w-full flex flex-col gap-3 min-w-0">
                    <div className="flex items-start justify-between gap-2.5 w-full">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="truncate" style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{r.name}</div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[12px]" style={{ fontFamily: F.ui, color: T.taupe }}>
                          <span>Last assigned {formatDisplayDate(r.lastAssignmentDate)}</span>
                          <span className="truncate">· By {r.assignedByLabel}</span>
                        </div>
                      </div>
                      <div className="mt-0.5 shrink-0">
                        {isOpen ? <ChevronDown size={18} color={T.royalBurgundy} /> : <ChevronRight size={18} color={T.taupe} />}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 pt-2.5 border-t border-[rgba(110,15,45,0.06)] w-full">
                      {[
                        { l: "Assigned", v: String(r.assignments.length), c: T.luxuryBrown, bg: "rgba(59,35,20,0.05)" },
                        { l: "Returned", v: String(r.returns.length), c: T.royalBurgundy, bg: "rgba(110,15,45,0.05)" },
                        { l: "Pending", v: String(r.pending), c: r.pending > 0 ? T.orange : T.green, bg: r.pending > 0 ? "rgba(230,126,34,0.08)" : "rgba(30,102,64,0.07)" },
                        { l: "Perfect", v: String(r.perfect), c: T.green, bg: "rgba(30,102,64,0.07)" },
                        { l: "Damaged", v: String(r.damaged), c: r.damaged > 0 ? T.crimson : T.taupe, bg: r.damaged > 0 ? "rgba(192,57,43,0.08)" : "rgba(105,99,94,0.05)" },
                      ].map(k => (
                        <div key={k.l} className="flex flex-col items-center justify-center p-2 rounded-lg text-center" style={{ background: k.bg }}>
                          <span style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{k.l}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: k.c, marginTop: 2 }}>{k.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div className="p-3 sm:p-4 border-t border-[rgba(110,15,45,0.08)] flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>
                            Assignments ({r.visibleAssignments.length})
                          </span>
                          <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
                            <Button
                              onClick={() => setViewMode("card")}
                              variant="ghost"
                              className={`h-auto rounded-none gap-1.5 py-1.5 px-2.5 text-[12px] font-bold ${
                                viewMode === "card"
                                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
                              }`}
                            >
                              <LayoutGrid size={14} /> Card View
                            </Button>
                            <Button
                              onClick={() => setViewMode("table")}
                              variant="ghost"
                              className={`h-auto rounded-none gap-1.5 py-1.5 px-2.5 text-[12px] font-bold ${
                                viewMode === "table"
                                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
                              }`}
                            >
                              <List size={14} /> Table View
                            </Button>
                          </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                          <DataTable
                            responsive={viewMode === "card"}
                            columns={buildAssignmentColumns(returns, setZoomImage)}
                            data={r.visibleAssignments}
                            getRowId={a => a.id}
                            pagination
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          </div>
          <Pagination
            page={pag.page}
            pageCount={pag.pageCount}
            total={pag.total}
            pageSize={pag.pageSize}
            start={pag.start}
            onPageChange={pag.setPage}
            onPageSizeChange={pag.setPageSize}
            itemLabel="staff members"
          />
        </div>
      )}
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </SectionCard>
  );
}
