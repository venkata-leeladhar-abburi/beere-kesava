import React, { useState } from "react";
import { CheckCircle2, Clock, History, LayoutGrid, List } from "lucide-react";
import { MaterialReturnRecord } from "../../contexts/MaterialReturnContext";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { F, T } from "../issueMaterial/theme";
import { SectionCard } from "../issueMaterial/primitives";
import { renderReturnedMaterials } from "./materialFormatters";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: "Approved", color: T.green, bg: "rgba(30,102,64,0.10)" },
  "pending-signature": { label: "Pending Signature", color: "#8B6018", bg: "rgba(196,146,58,0.14)" },
  cancelled: { label: "Cancelled", color: T.crimson, bg: "rgba(192,57,43,0.09)" },
};

export function ReturnHistorySection({
  weaverNames, histSearch, setHistSearch, histWeaverFilter, setHistWeaverFilter,
  histDateFilter, setHistDateFilter, pagedHistory, histPage, setHistPage, totalPages,
  setViewRecord,
}: {
  weaverNames: string[];
  histSearch: string; setHistSearch: (v: string) => void;
  histWeaverFilter: string; setHistWeaverFilter: (v: string) => void;
  histDateFilter: DateFilterState; setHistDateFilter: (f: DateFilterState) => void;
  pagedHistory: MaterialReturnRecord[];
  histPage: number; setHistPage: (fn: (p: number) => number) => void;
  totalPages: number;
  setViewRecord: (r: MaterialReturnRecord) => void;
}) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const columns: ColumnDef<MaterialReturnRecord>[] = [
    {
      id: "id", header: "MRR ID", accessor: r => r.id,
      cell: (_v, r) => <EntityCode type="goodsReceipt" value={r.id} size="sm" />,
    },
    {
      id: "date", header: "Date", accessor: r => r.receivedAt,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{new Date(r.receivedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
    },
    {
      id: "weaver", header: "Weaver Name", accessor: r => r.weaverName,
      cell: (_v, r) => (
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{r.weaverName ?? r.factoryLoomNumber}</div>
          {r.loomNumber && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 700, marginTop: 2 }}>Loom {r.loomNumber}</div>}
        </div>
      ),
    },
    {
      id: "materials", header: "Materials Summary", accessor: r => r.materials,
      cell: (_v, r) => renderReturnedMaterials(r.materials),
    },
    {
      id: "deduction", header: "Deduction", accessor: r => r.deductionAmount,
      cell: (_v, r) => r.deductionAmount ? (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(196,146,58,0.14)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" }}><Money value={rupees(r.deductionAmount)} /></span>
      ) : (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</span>
      ),
    },
    {
      id: "receivedBy", header: "Received By", accessor: r => r.receivedBy,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{r.receivedBy}</span>,
    },
    {
      id: "signature", header: "Signature", accessor: r => r.signatureCaptured,
      cell: (_v, r) => r.signatureCaptured ? (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}><CheckCircle2 size={13} /> Signed — {r.signatureMethod === "here" ? "On screen" : "Remote"}</span>
      ) : (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}><Clock size={13} /> Pending</span>
      ),
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => {
        const badge = STATUS_BADGE[r.status];
        return <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{badge.label}</span>;
      },
    },
    {
      id: "actions", header: "", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        <Button
          variant="secondary"
          size="sm"
          iconLeft="view"
          onClick={() => setViewRecord(r)}
          className="whitespace-nowrap border-[rgba(200,155,71,0.22)] text-[#6E0F2D]"
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <SectionCard icon={History} title="Material Return History" subtitle="Every material received back from a weaver or factory loom, with signature and deduction status.">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 20 }}>
        <div style={{ flex: "1 1 260px" }}>
          <SearchInput value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Search weaver or MRR ID…" className="w-full" />
        </div>
        <Select value={histWeaverFilter} onValueChange={setHistWeaverFilter}>
          {weaverNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <DateFilterBar filter={histDateFilter} onChange={setHistDateFilter} />
      </div>

      <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 mb-4 w-fit">
        <Button
          onClick={() => setViewMode("card")}
          variant="ghost"
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
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
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
            viewMode === "table"
              ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
              : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
          }`}
        >
          <List size={14} /> Table View
        </Button>
      </div>

      {/* Mobile View (Card View or Table View based on viewMode toggle) */}
      <div className="block md:hidden">
        {viewMode === "card" ? (
          pagedHistory.length === 0 ? (
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "32px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No return records match your filters</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {pagedHistory.map(r => {
                const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE["approved"];
                const formattedDate = new Date(r.receivedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                const recipient = r.weaverName ?? r.factoryLoomNumber ?? "—";

                return (
                  <div
                    key={r.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 16,
                      border: `1px solid ${T.borderDef}`,
                      boxShadow: "0 2px 12px rgba(74,6,27,0.06)",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <EntityCode type="goodsReceipt" value={r.id} size="sm" />
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: "4px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, fontFamily: F.ui, borderTop: `1px solid ${T.borderDef}`, paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: T.taupe, fontSize: 12, fontWeight: 500 }}>Date Received</span>
                        <span style={{ color: T.luxuryBrown, fontSize: 13, fontWeight: 600 }}>{formattedDate}</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: T.taupe, fontSize: 12, fontWeight: 500 }}>Weaver / Loom</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: T.luxuryBrown, fontSize: 13 }}>{recipient}</div>
                          {r.loomNumber && <div style={{ fontSize: 11, color: T.antiqueGold, fontWeight: 700 }}>Loom {r.loomNumber}</div>}
                        </div>
                      </div>

                      {r.deductionAmount ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: T.taupe, fontSize: 12, fontWeight: 500 }}>Deduction</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(196,146,58,0.14)", borderRadius: 6, padding: "3px 8px" }}>
                            <Money value={rupees(r.deductionAmount)} />
                          </span>
                        </div>
                      ) : null}

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px dashed ${T.borderDef}`, paddingTop: 10 }}>
                        <span style={{ color: T.taupe, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Returned Materials</span>
                        <div style={{ background: T.warmCream, borderRadius: 10, padding: "10px 12px" }}>
                          {renderReturnedMaterials(r.materials)}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 10, marginTop: "auto" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setViewRecord(r)}
                        className="w-full justify-center text-[12px] font-bold border-[rgba(200,155,71,0.25)] text-[#6E0F2D] hover:bg-[#F7F2EA]"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <DataTable
              columns={columns}
              data={pagedHistory}
              getRowId={r => r.id}
              emptyTitle="No return records match your filters"
            />
          </div>
        )}
      </div>

      {/* Desktop View — always Table View */}
      <div className="hidden md:block" style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
        <DataTable
          columns={columns}
          data={pagedHistory}
          getRowId={r => r.id}
          emptyTitle="No return records match your filters"
        />
      </div>

      {totalPages > 0 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20 }}>
          <Button variant="secondary" size="sm" disabled={histPage === 1} onClick={() => setHistPage(p => p - 1)}>← Prev</Button>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Page {histPage} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={histPage === totalPages} onClick={() => setHistPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </SectionCard>
  );
}
