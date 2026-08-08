// ── Table view + directory container that switches between card/list/table ─
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rows3 as Rows, Eye as PhEye, MapPin as PhMapPin } from "lucide-react";
import { T, F } from "../theme";
import { STATUS_CFG, Status } from "../types";
import { WEAVERS } from "../data";
import { FadeUp, qcColor } from "../common/primitives";
import { WeaverCardGrid, WeaverListView, useRealWeavers } from "./WeaverCardAndListViews";
import { weaversApi, BackendWeaverStats } from "../../../../shared/api/weavers";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

interface WeaverTableRow {
  id: string;
  code?: string;
  name: string;
  village: string;
  mobile: string;
  looms: number;
  status: Status;
  thisMonth: number;
  passRate: number;
  totalEver: string;
  totalPaid: string;
  lastActive: string;
}

// Real roster + live per-weaver stats (GET /weavers, GET /weavers/:id/stats).
// The stats endpoint has no monthly breakdown, total-paid, or last-active
// timestamp yet, so those columns show "—" rather than an invented number.
function useRealTableRows() {
  const { data: weaversRes, isLoading: rosterLoading, isError: rosterError } = useQuery({
    queryKey: ["weavers-table-roster"],
    queryFn: () => weaversApi.list(),
  });
  const roster = weaversRes?.items ?? [];
  const { data: statsList, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["weavers-table-stats", roster.map(w => w.id)],
    queryFn: () => Promise.all(roster.map(w => weaversApi.getStats(w.id))),
    enabled: roster.length > 0,
  });
  const statsById = new Map((statsList ?? []).map(s => [s.weaverId, s]));
  const rows = roster.map(w => {
    const s: BackendWeaverStats | undefined = statsById.get(w.id);
    return {
      id: w.id,
      code: w.code,
      name: w.name,
      village: w.village || "—",
      mobile: w.phone || "—",
      looms: w.looms,
      status: (s && s.activeBatchRowsCount > 0 ? "active" : "idle") as Status,
      thisMonth: 0,
      passRate: s?.qcPassRate ?? 0,
      totalEver: String(s?.totalSareesWoven ?? 0),
      totalPaid: "—",
      lastActive: "—",
    };
  });
  return {
    rows,
    isLoading: rosterLoading || (roster.length > 0 && statsLoading),
    isError: rosterError || statsError,
  };
}

export function WeaverTableView({ onSelect }: { onSelect: (id: string) => void }) {
  const [showAll, setShowAll] = useState(true);
  const { rows: TABLE_ROWS, isLoading, isError } = useRealTableRows();
  const visible = showAll ? TABLE_ROWS : TABLE_ROWS.slice(0, 5);

  const columns: ColumnDef<WeaverTableRow>[] = [
    {
      id: "code", header: "Weaver Code", accessor: r => r.code ?? r.id,
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 14, color: T.royalBurgundy, fontWeight: 700, letterSpacing: "0.4px" }}>{r.code ?? r.id}</span>,
    },
    {
      id: "name", header: "Name", accessor: r => r.name,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 700 }}>{r.name}</span>,
    },
    {
      id: "village", header: "Village", accessor: r => r.village,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PhMapPin size={14} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{r.village}</span>
        </div>
      ),
    },
    {
      id: "mobile", header: "Mobile", accessor: r => r.mobile,
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown }}>{r.mobile}</span>,
    },
    {
      id: "looms", header: "Looms", accessor: r => r.looms, type: "number", align: "center", sortable: true,
      cell: (_v, r) => (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Rows size={15} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>{r.looms}</span>
        </div>
      ),
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => {
        const cfg = STATUS_CFG[r.status];
        return (
          <span style={{ display: "inline-flex", alignItems: "center", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>
            {r.status === "active" ? "● Weaving" : r.status === "qc" ? "● QC Check" : "○ Idle"}
          </span>
        );
      },
    },
    {
      id: "thisMonth", header: "This Month", accessor: r => r.thisMonth, type: "number", sortable: true,
      cell: (_v, r) => <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.antiqueGold }}>{r.thisMonth}</span>,
    },
    {
      id: "passRate", header: "Pass Rate", accessor: r => r.passRate, type: "number", sortable: true,
      cell: (_v, r) => <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: qcColor(r.passRate) }}>{r.passRate}%</span>,
    },
    {
      id: "totalEver", header: "Total Ever", accessor: r => r.totalEver,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown }}>{r.totalEver}</span>,
    },
    {
      id: "totalPaid", header: "Total Paid", accessor: r => r.totalPaid,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 700 }}>{r.totalPaid}</span>,
    },
    {
      id: "lastActive", header: "Last Active", accessor: r => r.lastActive,
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 14, color: T.taupe }}>{r.lastActive}</span>,
    },
    {
      id: "actions", header: "", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        <Button
          onClick={() => onSelect(r.id)}
          variant="secondary"
          size="sm"
          className="rounded-[10px] bg-[rgba(110,15,45,0.05)] text-[#6E0F2D] border-[1.5px] border-[rgba(110,15,45,0.18)]"
        >
          <PhEye size={18} /> View
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
        Loading weavers…
      </div>
    );
  }
  if (isError) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
        Couldn't load weavers.
      </div>
    );
  }
  if (TABLE_ROWS.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>
        No weavers yet.
      </div>
    );
  }
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      <div style={{ overflowX: "auto" }}>
        <DataTable columns={columns} data={visible} getRowId={r => r.id} />
      </div>
      {!showAll && (
        <div style={{ padding: "22px 26px", textAlign: "center", borderTop: `1px solid ${T.borderDef}` }}>
          <Button onClick={() => setShowAll(true)} variant="link" className="text-[16px] font-bold text-[#6E0F2D] underline decoration-[rgba(110,15,45,0.35)]">Load More Weavers</Button>
        </div>
      )}
    </div>
  );
}
export function WeaverDirectory({ view, onSelect, onEdit, onBatches, extraWeavers = [] }: { view: string; onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  // Build a real-roster lookup map so the table-view "View" button can resolve
  // a clicked row id to a real weaver object (WEAVERS[] is empty mock).
  const realWeavers = useRealWeavers(extraWeavers);
  const realById = new Map(realWeavers.map(w => [w.id, w]));

  return (
    <div style={{ padding: "24px 48px 0" }}>
      <FadeUp>
        {view === "card" && <WeaverCardGrid onSelect={onSelect} onEdit={onEdit} onBatches={onBatches} extraWeavers={extraWeavers} />}
        {view === "list" && <WeaverListView onSelect={onSelect} extraWeavers={extraWeavers} />}
        {view === "table" && (
          <WeaverTableView
            onSelect={id => {
              const w = realById.get(id);
              if (w) onSelect(w);
            }}
          />
        )}
      </FadeUp>
    </div>
  );
}
