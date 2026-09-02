import { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { Users, ArrowDownToLine, FileText, Building2, ChevronDown, Phone, Receipt } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing, Quotation, QuotationSaree } from "@/features/finishing";
import { WORKER_NAME, Toast } from "./shared";
import { SectionCard } from "../primitives";
import { StaffPickerModal } from "./StaffPickerModal";
import { useSareeDetails, formatDate, formatWeight, type SareeDetail } from "./sareeDetails";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, ViewToggle, type ColumnDef } from "../../../../../shared/ui/data";
import { Pagination, usePagination } from "../../../../../shared/ui/DataPagination";
import { EntityCode, Money } from "@/shared/ui/domain";
import { rupees } from "@/lib/domain/money";
import { useAuth } from "../../../../../contexts/AuthContext";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";
import { STOPGAP_ACTING_USER_ID } from "../../../../../shared/api/purchase-requests";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";

// ── Quotations — assign for finishing & receive back against a quotation ───────

function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  const cfg: Record<Quotation["status"], { bg: string; color: string; label: string }> = {
    "raised":              { bg: "rgba(200,146,58,0.14)", color: "#8B6018", label: "Awaiting Finishing" },
    "in-finishing":        { bg: "rgba(248,140,0,0.12)",  color: "#B85C00", label: "With Finishing Staff" },
    "partially-received":  { bg: "rgba(30,102,64,0.10)",  color: C.green,   label: "Partially Received" },
    "received":            { bg: "rgba(30,102,64,0.12)",  color: C.green,   label: "Received — Ready to Dispatch" },
    "dispatched":          { bg: "rgba(110,15,45,0.10)",  color: C.burg,    label: "Dispatched" },
  };
  const s = cfg[status];
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontFamily: F.u, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" as const }}>{s.label}</span>
  );
}

const FINISHING_STATUS = {
  "pending":      { label: "Pending", fg: "#8D5802", bg: "rgba(200,155,71,0.14)", bd: "rgba(200,155,71,0.32)" },
  "in-finishing": { label: "In Finishing", fg: "#B85C00", bg: "rgba(248,140,0,0.12)", bd: "rgba(248,140,0,0.28)" },
  "received":     { label: "Received", fg: "#1F774E", bg: "rgba(30,102,64,0.10)", bd: "rgba(30,102,64,0.22)" },
} as const;

const GOLD: React.CSSProperties = {
  fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04",
  background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)",
  borderRadius: 8, padding: "3px 9px", whiteSpace: "nowrap",
};

function Dash() {
  return <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>;
}

interface QuotationRow extends QuotationSaree {
  detail?: SareeDetail;
  price?: string;
}

// The saree list used to be three lines of loose text that printed the type
// code twice ("BS-004 · BS-004") and showed nothing about the loom, batch,
// weight or price the quotation was raised on. It is a real table now, joined
// to the batch row each saree came from.
function buildSareeColumns(): ColumnDef<QuotationRow>[] {
  return [
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId, priority: 1, sortable: true,
      cell: (_v, r) => <EntityCode type="saree" value={r.sareeId} size="sm" copyable />,
    },
    {
      id: "producer", header: "Weaver / Loom", accessor: r => r.detail?.producerName ?? r.weaverName ?? "", priority: 2, sortable: true,
      cell: (_v, r) => {
        const name = r.detail?.producerName ?? (r.weaverName !== "—" ? r.weaverName : null);
        if (!name) return <Dash />;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{name}</span>
            {r.detail?.weaverCode && <span style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{r.detail.weaverCode}</span>}
          </div>
        );
      },
    },
    {
      id: "loom", header: "Loom No.", accessor: r => r.detail?.loomLabel ?? "", priority: 3,
      cell: (_v, r) => r.detail?.loomLabel
        ? <span style={{ ...GOLD, color: C.burg, background: "rgba(110,15,45,0.07)", borderColor: "rgba(110,15,45,0.14)" }}>{r.detail.loomLabel}</span>
        : <Dash />,
    },
    {
      id: "batch", header: "Batch", accessor: r => r.detail?.batchId ?? "", priority: 3,
      cell: (_v, r) => r.detail?.batchId ? <EntityCode type="batch" value={r.detail.batchId} size="sm" /> : <Dash />,
    },
    {
      id: "type", header: "Saree Type", accessor: r => r.sareeTypeCode ?? r.detail?.sareeTypeCode ?? "", priority: 3, sortable: true,
      cell: (_v, r) => {
        const code = r.sareeTypeCode ?? r.detail?.sareeTypeCode ?? null;
        const name = r.detail?.sareeTypeName ?? (r.sareeType !== "—" ? r.sareeType : null);
        if (!code && !name) return <Dash />;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            {code && <span style={GOLD}>{code}</span>}
            {name && name.toLowerCase() !== (code ?? "").toLowerCase() && (
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{name}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "weight", header: "Weight", accessor: r => r.detail?.weightG ?? 0, align: "end", priority: 3, sortable: true,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: r.detail?.weightG != null ? C.text : C.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {formatWeight(r.detail?.weightG)}
        </span>
      ),
    },
    {
      id: "color", header: "Colour", accessor: r => r.detail?.color ?? "", priority: 3,
      cell: (_v, r) => r.detail?.color ? <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{r.detail.color}</span> : <Dash />,
    },
    {
      id: "price", header: "Price", accessor: r => Number(r.price ?? 0), align: "end", priority: 3, sortable: true,
      cell: (_v, r) => r.price != null
        ? <Money value={rupees(Number(r.price) || 0)} />
        : <Dash />,
    },
    {
      id: "staff", header: "Finishing Staff", accessor: r => r.finishingStaffName ?? "", priority: 2,
      cell: (_v, r) => r.finishingStaffName
        ? <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{r.finishingStaffName}</span>
        : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Not assigned</span>,
    },
    {
      id: "status", header: "Status", accessor: r => r.finishingStatus, type: "status", priority: 1,
      cell: (_v, r) => {
        const cfg = FINISHING_STATUS[r.finishingStatus];
        return (
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.bd}`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
            {cfg.label}
          </span>
        );
      },
    },
  ];
}

interface QuotationListRow {
  q: Quotation;
  received: number;
  pendingSarees: QuotationSaree[];
  inFinishingSarees: QuotationSaree[];
  canAssign: boolean;
  canReceive: boolean;
  totalWeight: number;
}

function buildQuotationColumns(opts: {
  isOpen: (id: string) => boolean;
  onToggle: (id: string) => void;
  onAssign: (id: string) => void;
  onReceive: (q: Quotation) => void;
}): ColumnDef<QuotationListRow>[] {
  return [
    {
      id: "quotation", header: "Quotation", accessor: r => r.q.quotationNumber, priority: 1, sortable: true,
      cell: (_v, r) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{r.q.quotationNumber}</span>
            <QuotationStatusBadge status={r.q.status} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] flex-wrap">
            <Building2 size={12} className="shrink-0" />
            <span className="font-medium text-[var(--text-primary)]">{r.q.customerName}</span>
            {r.q.customerCity && <span>· {r.q.customerCity}</span>}
            {r.q.customerPhone && (
              <span className="inline-flex items-center gap-1">· <Phone size={11} /> {r.q.customerPhone}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "raised", header: "Raised", accessor: r => r.q.quotationDate, priority: 2, sortable: true,
      cell: (_v, r) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{formatDate(r.q.quotationDate)}</span>
          <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>by {r.q.raisedBy}</span>
        </div>
      ),
    },
    {
      id: "sarees", header: "Sarees", accessor: r => r.q.sarees.length, align: "end", priority: 2, sortable: true,
      cell: (_v, r) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontFamily: F.d, fontWeight: 800, fontSize: 14, color: C.text }}>
            {r.received}/{r.q.sarees.length} <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 400, color: C.muted }}>received</span>
          </span>
          <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{r.totalWeight > 0 ? formatWeight(r.totalWeight) : "weight n/a"}</span>
        </div>
      ),
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: r => r.q.bulkOrderRef ?? "", priority: 3,
      cell: (_v, r) => r.q.bulkOrderRef
        ? <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{r.q.bulkOrderRef}</span>
        : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>General stock</span>,
    },
    {
      id: "total", header: "Total", accessor: r => r.q.grandTotal, type: "currency", align: "end", priority: 2, sortable: true,
      cell: (_v, r) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <Money value={rupees(r.q.grandTotal)} />
          <span style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>{r.q.applyGst ? `incl. ${r.q.gstPct}% GST` : "no GST"}</span>
        </div>
      ),
    },
    {
      id: "finishing", header: "Finishing Staff", accessor: r => r.q.finishingStaffName ?? "", priority: 3,
      cell: (_v, r) => r.q.finishingStaffName
        ? <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{r.q.finishingStaffName}</span>
        : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Not assigned</span>,
    },
    {
      id: "sareesDetail", header: "Details", accessor: r => r.q.sarees.length, priority: 3, width: 150,
      cell: (_v, r) => {
        const open = opts.isOpen(r.q.id);
        return (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); opts.onToggle(r.q.id); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.burg, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          >
            <Receipt size={13} color={C.muted} />
            {open ? "Hide" : "Show"} sarees
            <ChevronDown size={13} color={C.muted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
        );
      },
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions", priority: 2, width: 220,
      cell: (_v, r) => (
        (r.canAssign || r.canReceive) ? (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {r.canAssign && (
              <Button variant="primary" iconLeft={Users} onClick={() => opts.onAssign(r.q.id)}
                className="min-w-0 px-2 text-[11px] whitespace-nowrap justify-center h-[32px] rounded-lg bg-[#6E0F2D] hover:bg-[#6E0F2D]">
                Assign {r.pendingSarees.length}
              </Button>
            )}
            {r.canReceive && (
              <Button variant="primary" iconLeft={ArrowDownToLine} onClick={() => opts.onReceive(r.q)}
                className="min-w-0 px-2 text-[11px] whitespace-nowrap justify-center h-[32px] rounded-lg bg-gradient-to-br from-[#1E5A3A] to-[#1E6640] text-xs font-bold">
                Receive {r.inFinishingSarees.length}
              </Button>
            )}
          </div>
        ) : <Dash />
      ),
    },
  ];
}

export function QuotationsSection({ isMobile }: { isMobile?: boolean }) {
  const { quotations, assignQuotationFinishing, receiveQuotationSarees, isLoading, isError, error, refetch } = useFinishing();
  const details = useSareeDetails();
  const { user } = useAuth();
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [expandedSarees, setExpandedSarees] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const columns = useMemo(buildSareeColumns, []);

  const toggleSareesExpanded = (id: string) => {
    setExpandedSarees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const active = useMemo(
    () => quotations
      .filter(q => q.status !== "dispatched")
      .filter(q => matchesDateFilter(q.quotationDate, dateFilter))
      .sort((a, b) => b.createdAt - a.createdAt),
    [quotations, dateFilter]
  );
  const pag = usePagination(active, 5);

  const handleAssign = (staff: { id: string; name: string }) => {
    if (pickerFor) {
      const q = active.find(x => x.id === pickerFor);
      if (q) {
        const pendingIds = q.sarees.filter(s => s.finishingStatus === "pending").map(s => s.sareeId);
        if (pendingIds.length > 0) {
          assignQuotationFinishing(q.id, pendingIds, staff, actingUserId);
          setToast(`${pendingIds.length} saree${pendingIds.length > 1 ? "s" : ""} assigned to ${staff.name} for finishing`);
        }
      }
    }
    setPickerFor(null);
  };

  const handleReceive = (q: Quotation) => {
    const inFinishingIds = q.sarees.filter(s => s.finishingStatus === "in-finishing").map(s => s.sareeId);
    if (inFinishingIds.length === 0) return;
    receiveQuotationSarees(q.id, inFinishingIds, WORKER_NAME);
    setToast(`${inFinishingIds.length} saree${inFinishingIds.length > 1 ? "s" : ""} received against ${q.quotationNumber}`);
  };

  const listRows: QuotationListRow[] = useMemo(() => pag.pageItems.map(q => {
    const received = q.sarees.filter(s => s.finishingStatus === "received").length;
    const pendingSarees = q.sarees.filter(s => s.finishingStatus === "pending");
    const inFinishingSarees = q.sarees.filter(s => s.finishingStatus === "in-finishing");
    const rows: QuotationRow[] = q.sarees.map(s => ({
      ...s,
      detail: details.get(s.sareeId),
      price: q.prices[s.sareeId],
    }));
    const totalWeight = rows.reduce((sum, r) => sum + (r.detail?.weightG ?? 0), 0);
    return {
      q, received, pendingSarees, inFinishingSarees,
      canAssign: pendingSarees.length > 0,
      canReceive: inFinishingSarees.length > 0,
      totalWeight,
    };
  }), [pag.pageItems, details]);

  const listColumns = useMemo(() => buildQuotationColumns({
    isOpen: id => expandedSarees.has(id),
    onToggle: toggleSareesExpanded,
    onAssign: id => setPickerFor(id),
    onReceive: handleReceive,
  }), [expandedSarees]);

  return (
    <SectionCard
      icon={FileText}
      title="Quotations for Finishing"
      subtitle="Orders raised from Inventory that need finishing work."
      actions={
        <div className="flex items-center gap-2">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {active.length} active
          </span>
        </div>
      }
    >
      <div style={{ marginBottom: 14, overflowX: "auto" }} className="section-nav-scroll">
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      {isLoading ? (
        <LoadingState variant="skeleton" rows={4} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : active.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          {dateFilter.mode === "all" ? "No quotations awaiting finishing." : "No quotations match this timeline."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="overflow-x-auto section-nav-scroll">
            <div className={isMobile ? "min-w-[900px]" : undefined}>
              <DataTable
                columns={listColumns}
                data={listRows}
                getRowId={r => r.q.id}
                view={viewMode}
                expandedIds={expandedSarees}
                renderExpandedRow={r => (
                  <div style={{ padding: isMobile ? 10 : 12, background: "rgba(110,15,45,0.015)" }}>
                    <div className="overflow-x-auto section-nav-scroll">
                      <div className={isMobile ? "min-w-[900px]" : "min-w-[1040px]"}>
                        <DataTable
                          columns={columns}
                          data={r.q.sarees.map(s => ({ ...s, detail: details.get(s.sareeId), price: r.q.prices[s.sareeId] }))}
                          getRowId={sr => sr.sareeId}
                          density="compact"
                        />
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
          <Pagination
            page={pag.page}
            pageCount={pag.pageCount}
            total={pag.total}
            pageSize={pag.pageSize}
            start={pag.start}
            onPageChange={pag.setPage}
            onPageSizeChange={pag.setPageSize}
            itemLabel="quotations"
          />
        </div>
      )}

      <AnimatePresence>
        {pickerFor && <StaffPickerModal onSelect={handleAssign} onClose={() => setPickerFor(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </SectionCard>
  );
}
