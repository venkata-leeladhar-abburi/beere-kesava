import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { MaterialIssueRecord } from "../../contexts/MaterialIssueContext";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { F, T } from "./theme";
import { SectionPill } from "./primitives";
import { renderIssuedMaterials } from "./materialFormatters";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  signed: { label: "Signed", color: T.green, bg: "rgba(30,102,64,0.10)" },
  "pending-signature": { label: "Pending Signature", color: "#8B6018", bg: "rgba(196,146,58,0.14)" },
  cancelled: { label: "Cancelled", color: T.crimson, bg: "rgba(192,57,43,0.09)" },
};

export function IssuanceHistorySection({
  weaverNames, histSearch, setHistSearch, histWeaverFilter, setHistWeaverFilter,
  histDateFilter, setHistDateFilter, pagedHistory, histPage, setHistPage, totalPages,
  setViewRecord,
}: {
  weaverNames: string[];
  histSearch: string; setHistSearch: (v: string) => void;
  histWeaverFilter: string; setHistWeaverFilter: (v: string) => void;
  histDateFilter: DateFilterState; setHistDateFilter: (f: DateFilterState) => void;
  pagedHistory: MaterialIssueRecord[];
  histPage: number; setHistPage: (fn: (p: number) => number) => void;
  totalPages: number;
  setViewRecord: (r: MaterialIssueRecord) => void;
}) {
  const columns: ColumnDef<MaterialIssueRecord>[] = [
    {
      id: "id", header: "MIR ID", accessor: r => r.id,
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 8px" }}>{r.id}</span>,
    },
    {
      id: "date", header: "Date", accessor: r => r.issuedAt,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
    },
    {
      id: "weaver", header: "Weaver Name", accessor: r => r.weaverName,
      cell: (_v, r) => (
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{r.weaverName}</div>
          {r.loomNumber && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, fontWeight: 700, marginTop: 2 }}>Loom {r.loomNumber}</div>}
        </div>
      ),
    },
    {
      id: "weaverId", header: "Weaver ID", accessor: r => r.weaverId,
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.weaverId}</span>,
    },
    {
      id: "materials", header: "Materials Summary", accessor: r => r.materials,
      cell: (_v, r) => renderIssuedMaterials(r.materials),
    },
    {
      id: "grnIds", header: "GRN Batch IDs", accessor: r => r.materials,
      cell: (_v, r) => {
        const grnIds = Array.from(new Set(r.materials.map(m => m.grnBatchId)));
        return (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {grnIds.map(g => <span key={g} style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", borderRadius: 5, padding: "2px 7px" }}>{g}</span>)}
          </div>
        );
      },
    },
    {
      id: "issuedBy", header: "Issued By", accessor: r => r.issuedBy,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{r.issuedBy}</span>,
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
    <div>
      <SectionPill label="Material Issuance History" />
      <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: T.luxuryBrown, margin: "0 0 20px" }}>Material Issuance History</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 20 }}>
        <div style={{ flex: "1 1 260px" }}>
          <SearchInput value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Search weaver, MIR ID, or GRN batch…" className="w-full" />
        </div>
        <Select value={histWeaverFilter} onValueChange={setHistWeaverFilter}>
          {weaverNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
        </Select>
      </div>

      <DateFilterBar filter={histDateFilter} onChange={setHistDateFilter} />

      <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
        <DataTable
          columns={columns}
          data={pagedHistory}
          getRowId={r => r.id}
          emptyTitle="No issuance records match your filters"
        />
      </div>

      {totalPages > 0 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20 }}>
          <Button variant="secondary" size="sm" disabled={histPage === 1} onClick={() => setHistPage(p => p - 1)}>← Prev</Button>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Page {histPage} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={histPage === totalPages} onClick={() => setHistPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  );
}
