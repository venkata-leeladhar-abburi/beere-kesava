// ── Table view + directory container that switches between card/list/table ─
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Rows3 as Rows, Eye as PhEye, MapPin as PhMapPin } from "lucide-react";
import { T, F } from "../theme";
import { STATUS_CFG, Status } from "../types";
import { WEAVERS } from "../data";
import { FadeUp, qcColor } from "../common/primitives";
import { WeaverCardGrid, WeaverListView, useRealWeavers, filterWeavers } from "./WeaverCardAndListViews";
import { BackendWeaverStats } from "../../../../shared/api/weavers";
import { useWeaverRosterStats, weaverStatusFromStats, formatLastActive } from "../../hooks/useWeaverRosterStats";
import { weaverPaymentsApi } from "../../../../shared/api/payments";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";

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

// Real roster + live stats for every weaver in one call (GET /weavers, GET
// /weavers/stats). Total-paid comes from the payments module. There is still
// no dated production ledger, so output columns are all-time and labelled so.
function useRealTableRows() {
  const { roster, statsById, isLoading, isError, refetch } = useWeaverRosterStats();
  // Real payout totals — this column rendered a literal "—" for every weaver.
  const { data: payments } = useQuery({
    queryKey: ["weavers-table-payments"],
    queryFn: () => weaverPaymentsApi.listAll(),
  });
  const paidById = new Map<string, number>();
  (payments ?? []).forEach(p => {
    paidById.set(p.weaverId, (paidById.get(p.weaverId) ?? 0) + Number(p.amountPaid ?? 0));
  });
  const rows = roster.map(w => {
    const s: BackendWeaverStats | undefined = statsById.get(w.id);
    return {
      id: w.id,
      code: w.code,
      name: w.name,
      village: w.village || "—",
      mobile: w.phone || "—",
      looms: w.looms,
      status: weaverStatusFromStats(s),
      // All-time, not this month — the stats endpoint has no dated ledger.
      // Rendered under a "Total Woven" header so the number matches its label
      // (it was previously a hardcoded 0 under a "This Month" header).
      thisMonth: s?.totalSareesWoven ?? 0,
      passRate: s?.qcPassRate ?? 0,
      totalEver: String(s?.totalSareesWoven ?? 0),
      totalPaid: paidById.has(w.id) ? formatMoney(rupees(paidById.get(w.id)!)) : "—",
      lastActive: formatLastActive(s?.lastActivityAt),
    };
  });
  return { rows, isLoading, isError, refetch };
}

export function WeaverTableView({ onSelect, search = "", filter = "All Weavers" }: { onSelect: (id: string) => void; search?: string; filter?: string }) {
  const { rows: ALL_ROWS, isLoading, isError, refetch } = useRealTableRows();
  const TABLE_ROWS = filterWeavers(ALL_ROWS, search, filter);
  const pag = usePagination(TABLE_ROWS, 10);

  const columns: ColumnDef<WeaverTableRow>[] = [
    {
      id: "code", header: "Weaver Code", accessor: r => r.code ?? r.id, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.royalBurgundy, fontWeight: 700, letterSpacing: "0.4px" }}>{r.code ?? r.id}</span>,
    },
    {
      id: "name", header: "Name", accessor: r => r.name, priority: 1,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 700 }}>{r.name}</span>,
    },
    {
      id: "village", header: "Village", accessor: r => r.village, priority: 3,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PhMapPin size={14} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{r.village}</span>
        </div>
      ),
    },
    {
      id: "mobile", header: "Mobile", accessor: r => r.mobile, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.luxuryBrown }}>{r.mobile}</span>,
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
      id: "thisMonth", header: "Total Woven", accessor: r => r.thisMonth, type: "number", sortable: true,
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
      id: "lastActive", header: "Last Active", accessor: r => r.lastActive, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.taupe }}>{r.lastActive}</span>,
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
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "20px" }}>
        <LoadingState variant="skeleton" rows={5} />
      </div>
    );
  }
  if (isError) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}` }}>
        <ErrorState error={undefined} onRetry={refetch} />
      </div>
    );
  }
  if (TABLE_ROWS.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}` }}>
        {ALL_ROWS.length === 0
          ? <EmptyState title="No weavers yet" description="Weavers added to the roster will show up here." />
          : <EmptyState title="No matching weavers" description="No weaver matches this search or filter." />}
      </div>
    );
  }
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      <div className="w-full overflow-x-auto section-nav-scroll p-2">
        <div className="min-w-[850px]">
          <DataTable responsive={false} columns={columns} data={pag.pageItems} getRowId={r => r.id} />
        </div>
      </div>
      <div className="p-3 border-t border-[rgba(110,15,45,0.10)]">
        <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="weavers" />
      </div>
    </div>
  );
}
export function WeaverDirectory({ view, onSelect, onEdit, onBatches, search = "", filter = "All Weavers" }: { view: string; onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; search?: string; filter?: string }) {
  // Build a real-roster lookup map so the table-view "View" button can resolve
  // a clicked row id to a real weaver object (WEAVERS[] is empty mock).
  const realWeavers = useRealWeavers();
  const realById = new Map(realWeavers.map(w => [w.id, w]));

  return (
    <FadeUp>
      {view === "card" && <WeaverCardGrid onSelect={onSelect} onEdit={onEdit} onBatches={onBatches} search={search} filter={filter} />}
      {view === "list" && <WeaverListView onSelect={onSelect} search={search} filter={filter} />}
      {view === "table" && (
        <WeaverTableView
          search={search}
          filter={filter}
          onSelect={id => {
            const w = realById.get(id);
            if (w) onSelect(w);
          }}
        />
      )}
    </FadeUp>
  );
}
