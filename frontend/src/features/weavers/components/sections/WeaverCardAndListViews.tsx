import { useQuery } from "@tanstack/react-query";
import { Rows3 as Rows, Eye as PhEye, MapPin as PhMapPin } from "lucide-react";
import { T, F } from "../theme";
import { STATUS_CFG } from "../types";
import { WEAVERS } from "../data";
import { qcColor, getTwoLetterInitials } from "../common/primitives";
import { BackendWeaverStats } from "../../../../shared/api/weavers";
import { useWeaverRosterStats, weaverStatusFromStats, formatLastActive } from "../../hooks/useWeaverRosterStats";
import { weaverPaymentsApi } from "../../../../shared/api/payments";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Button } from "../../../../shared/ui/primitives";
import { resolveAssetUrl } from "../../../../shared/api/uploads";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { WeaverCardMockupStyle } from "./WeaverCardMockupStyle";
import { toInitials } from "@/shared/lib/initials";

export function useRealWeavers() {
  const { roster, statsById, isLoading, isError } = useWeaverRosterStats();

  // Actual payouts recorded per weaver (GET /payments/weavers). Every weaver
  // row used to show a literal "—" for Total Paid even though this endpoint
  // has the figures.
  const { data: payments } = useQuery({
    queryKey: ["weavers-card-payments"],
    queryFn: () => weaverPaymentsApi.listAll(),
  });
  const paidById = new Map<string, number>();
  (payments ?? []).forEach(p => {
    paidById.set(p.weaverId, (paidById.get(p.weaverId) ?? 0) + Number(p.amountPaid ?? 0));
  });

  const realWeavers = roster.map(w => {
    const s: BackendWeaverStats | undefined = statsById.get(w.id);
    const status = weaverStatusFromStats(s);
    return {
      id: w.id,
      code: w.code,
      name: w.name,
      initials: getTwoLetterInitials(w.name),
      bg: T.royalBurgundy,
      village: w.village || "—",
      cluster: w.cluster || "—",
      mobile: w.phone || "—",
      looms: w.looms,
      status,
      batch: s && s.activeBatchRowsCount > 0
        ? `${s.activeBatchRowsCount} active`
        : s && s.awaitingQcCount > 0 ? `${s.awaitingQcCount} awaiting QC` : "",
      design: "—",
      photo: resolveAssetUrl(w.photoUrl),
      // All-time, not this month: the stats endpoint exposes no dated ledger.
      // The column that renders this is labelled "Total Woven" to match.
      thisMonth: s?.totalSareesWoven ?? 0,
      passRate: s?.qcPassRate ?? 0,
      totalEver: s?.totalSareesWoven ?? 0,
      totalPaid: paidById.has(w.id) ? formatMoney(rupees(paidById.get(w.id)!)) : "—",
      lastActive: formatLastActive(s?.lastActivityAt),
      email: w.email,
      bankName: w.bankName,
      accountNo: w.accountNo,
      ifsc: w.ifsc,
    };
  });



  const combined = realWeavers;
  return Object.assign(combined, { isLoading, isError });
}

/**
 * The directory's search box and filter pills were previously wired only to
 * WeaversPage state — nothing ever read them, so typing a name or picking a
 * pill changed nothing on screen. Every view now narrows through this.
 */
export const WEAVER_FILTER_STATUS: Record<string, "active" | "idle" | "qc" | undefined> = {
  "Currently Working": "active",
  "Submitted — Waiting Quality Check": "qc",
  "Idle — No Active Batch": "idle",
};

export function filterWeavers<W extends { name: string; village: string; code?: string; id: string; status: string }>(
  list: W[],
  search: string,
  filter: string,
): W[] {
  const q = search.trim().toLowerCase();
  const wanted = WEAVER_FILTER_STATUS[filter];
  return list.filter(w => {
    const matchesSearch = !q
      || w.name.toLowerCase().includes(q)
      || w.village.toLowerCase().includes(q)
      || (w.code ?? w.id).toLowerCase().includes(q);
    return matchesSearch && (!wanted || w.status === wanted);
  });
}

export function WeaverCardGrid({ onSelect, onEdit, onBatches, search = "", filter = "All Weavers" }: { onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; search?: string; filter?: string }) {
  const allWeavers = useRealWeavers();
  const visible = filterWeavers(allWeavers, search, filter);
  const pag = usePagination(visible, 8);

  if (allWeavers.isLoading) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
        Loading weavers…
      </div>
    );
  }
  if (allWeavers.isError) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
        Couldn't load weavers.
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>
        {allWeavers.length === 0 ? "No weavers yet." : "No weavers match this search or filter."}
      </div>
    );
  }

  return (
    <div data-pagination-target>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch mb-6">
        {pag.pageItems.map((w, i) => {
          return (
            <div key={w.id}>
              <WeaverCardMockupStyle
                weaver={{
                  id: w.id,
                  name: w.name,
                  initials: w.initials,
                  code: w.code,
                  village: w.village || undefined,
                  mobile: w.mobile,
                  looms: w.looms,
                  status: w.status,
                  photo: w.photo,
                }}
                index={i}
                onNavigateDetails={() => onSelect(w)}
                onNavigateEdit={() => onEdit(w)}
                onNavigateBatches={() => onBatches(w)}
              />
            </div>
          );
        })}
      </div>
      <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="weavers" />
    </div>
  );
}

export function WeaverListView({ onSelect, search = "", filter = "All Weavers" }: { onSelect: (w: typeof WEAVERS[0]) => void; search?: string; filter?: string }) {
  const allWeavers = useRealWeavers();
  const visible = filterWeavers(allWeavers, search, filter);
  const pag = usePagination(visible, 10);

  if (allWeavers.isLoading) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
        Loading weavers…
      </div>
    );
  }
  if (allWeavers.isError) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
        Couldn't load weavers.
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>
        {allWeavers.length === 0 ? "No weavers yet." : "No weavers match this search or filter."}
      </div>
    );
  }

  type VisibleWeaver = (typeof allWeavers)[number];

  const columns: ColumnDef<VisibleWeaver>[] = [
    {
      id: "weaver", header: "Weaver", accessor: w => w.name, priority: 1,
      cell: (_v, w) => (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${T.antiqueGold}`, flexShrink: 0 }}>
            {w.photo
              ? <img src={w.photo} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: w.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9" }}>{toInitials(w.initials)}</span>
              </div>
            }
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown, marginBottom: 4 }}>{w.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{w.code ?? w.id}</div>
          </div>
        </div>
      ),
    },
    {
      id: "village", header: "Village / Area", accessor: w => w.village, priority: 3,
      cell: (_v, w) => (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <PhMapPin size={15} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{w.village}</span>
        </div>
      ),
    },
    {
      id: "status", header: "Status", accessor: w => w.status,
      cell: (_v, w) => {
        const cfg = STATUS_CFG[w.status];
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>
            {w.status === "active" ? "● Weaving" : w.status === "qc" ? "● QC Check" : "○ Idle"}
          </span>
        );
      },
    },
    {
      id: "thisMonth", header: "Total Woven", accessor: w => w.thisMonth, type: "number", sortable: true,
      cell: (_v, w) => <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.antiqueGold }}>{w.thisMonth} <span style={{ fontSize: 13, fontFamily: F.ui, color: T.taupe }}>sarees</span></div>,
    },
    {
      id: "passRate", header: "Pass Rate", accessor: w => w.passRate, type: "number", sortable: true,
      cell: (_v, w) => <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: qcColor(w.passRate) }}>{w.passRate}%</div>,
    },
    {
      id: "looms", header: "Looms", accessor: w => w.looms, type: "number", priority: 3,
      cell: (_v, w) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Rows size={16} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>{w.looms}</span>
        </div>
      ),
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions", exportable: false,
      cell: (_v, w) => (
        <Button
          onClick={() => onSelect(w)}
          variant="secondary"
          size="sm"
          className="rounded-[10px] bg-[rgba(110,15,45,0.05)] text-[#6E0F2D] border-[1.5px] border-[rgba(110,15,45,0.18)]"
        >
          <PhEye size={18} /> View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      <DataTable
        responsive
        columns={columns}
        data={pag.pageItems}
        getRowId={w => w.id}
      />
      <div className="p-3 border-t border-[rgba(110,15,45,0.10)]">
        <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="weavers" />
      </div>
    </div>
  );
}
