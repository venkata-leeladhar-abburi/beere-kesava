import { useState, useMemo } from "react";
import { Truck, Users, ShoppingBag, Clock, CheckCircle2, Trash2, FileText, Pencil, LayoutGrid, LayoutList } from "lucide-react";
import { DispatchRecord, useFinishing } from "@/features/finishing";
import { useCustomers } from "@/features/customers";
import { T, F } from "../theme";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { SectionCard } from "../common/primitives";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { EntityCode } from "@/shared/ui/domain";
import { EditWholesaleCustomerModal } from "../modals/EditWholesaleCustomerModal";
import { challanReference } from "../modals/dispatchDocument";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { StaffFilterSelect } from "../../../../shared/ui/StaffFilterSelect";
import { useAuth } from "../../../../contexts/AuthContext";

function formatDateStr(s?: string): string {
  if (!s) return "—";
  if (s.includes("T")) {
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  }
  return s;
}

// ── Dispatch History section ──────────────────────────────────────────────────
// Exported for the Worker Staff portal — same component, same markup, so the two
// screens cannot fall out of step.
export function DispatchHistorySection({ dispatches, firms, onResume, onDelete, onViewInvoice }: { dispatches: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void; onDelete?: (d: DispatchRecord) => void; onViewInvoice?: (d: DispatchRecord) => void; }) {
  const { role } = useAuth();
  const canFilterByStaff = role === "admin" || role === "superadmin";
  const [staffFilter, setStaffFilter] = useState("");
  const staffNames = useMemo(
    () => Array.from(new Set(dispatches.map(d => d.dispatchedByName).filter((n): n is string => !!n))).sort(),
    [dispatches],
  );

  const [tab, setTab] = useState<"all" | "shop" | "wholesale">("all");
  const rows = useMemo(() =>
    [...dispatches]
      .filter(d => tab === "all" || d.type === tab)
      .filter(d => !canFilterByStaff || !staffFilter || d.dispatchedByName === staffFilter)
      .sort((a, b) => (b.id > a.id ? 1 : -1)),
  [dispatches, tab, canFilterByStaff, staffFilter]);

  // Counts are consignments, not pieces — one badge per dispatch sent, matching
  // the "Showing N of M dispatches" footer below. They used to sum sareeIds,
  // so a single 2-saree run to the shop read as "To Shop (2)" against one row.
  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: dispatches.length },
    { key: "shop",      label: "To Shop",   count: dispatches.filter(d => d.type === "shop").length },
    { key: "wholesale", label: "Wholesale", count: dispatches.filter(d => d.type === "wholesale").length },
  ];

  return (
    <SectionCard
      icon={Truck}
      title="Dispatch History"
      subtitle="Every dispatch sent out to shops and wholesale customers."
      actions={
        <div style={{ display: "flex", gap: 6, alignItems: "center" }} className="shrink-0 min-w-max flex-wrap">
          {TABS.map(t => (
            <Button
              key={t.key}
              onClick={() => setTab(t.key)}
              variant={tab === t.key ? "secondary" : "tertiary"}
              size="sm"
              className={tab === t.key ? "rounded-full shrink-0" : "rounded-full shrink-0 bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white"}
            >
              {t.label} <span style={{ fontFamily: F.ui, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>({t.count})</span>
            </Button>
          ))}
          {canFilterByStaff && (
            <StaffFilterSelect names={staffNames} value={staffFilter} onChange={setStaffFilter} label="Dispatcher" />
          )}
        </div>
      }
    >
      <DataTableBody rows={rows} firms={firms} onResume={onResume} onDelete={onDelete} onViewInvoice={onViewInvoice} />
    </SectionCard>
  );
}

function DataTableBody({ rows, firms, onResume, onDelete, onViewInvoice }: { rows: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void; onDelete?: (d: DispatchRecord) => void; onViewInvoice?: (d: DispatchRecord) => void; }) {
  const [view, setView] = useState<"card" | "table">("card");
  const pag = usePagination(rows, 10);
  const { customers } = useCustomers();
  const { isLoading, isError, error, refetch } = useFinishing();
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const editingCustomer = editingCustomerId ? customers.find(c => c.id === editingCustomerId) ?? null : null;
  const columns: ColumnDef<DispatchRecord>[] = [
    {
      id: "date", header: "Date", accessor: d => formatDateStr(d.dispatchDate), width: 130,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatDateStr(d.dispatchDate)}</span>,
    },
    {
      id: "type", header: "Type", accessor: d => d.type, width: 110,
      cell: (_v, d) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: d.type === "wholesale" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.14)", color: d.type === "wholesale" ? T.royalBurgundy : "#8B6018", border: `1px solid ${d.type === "wholesale" ? "rgba(110,15,45,0.18)" : "rgba(200,155,71,0.32)"}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const, whiteSpace: "nowrap" }}>
          {d.type === "wholesale" ? <Users size={11} /> : <ShoppingBag size={11} />}{d.type}
        </span>
      ),
    },
    {
      id: "destination", header: "Destination", accessor: d => d.customerName ?? "", width: 180, priority: 1,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{d.type === "wholesale" ? (d.customerName ?? "—") : "Shop / Showroom"}</span>,
    },
    {
      id: "lr", header: "LR / Transport", accessor: d => d.lrNumber, width: 160, priority: 3,
      cell: (_v, d) => (
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{d.lrNumber || "—"}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1, whiteSpace: "nowrap" }}>{d.transportCompany || "—"}</div>
        </div>
      ),
    },
    {
      // A shop dispatch raises no invoice — it carries a delivery challan, so
      // the column shows whichever document that row actually has.
      id: "invoice", header: "Document", width: 150, priority: 3,
      accessor: d => (d.type === "shop" ? challanReference(d) : d.invoiceNumber),
      cell: (_v, d) => d.type === "shop"
        ? <EntityCode type="challan" value={challanReference(d)} truncate />
        : d.invoiceNumber
          ? <EntityCode type="invoice" value={d.invoiceNumber} />
          : <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</span>,
    },
    {
      id: "sarees", header: "Sarees", accessor: d => d.sareeIds.length, type: "number", width: 95,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{d.sareeIds.length} saree{d.sareeIds.length === 1 ? "" : "s"}</span>,
    },
    {
      id: "firm", header: "Firm", accessor: d => d.firmName, width: 150, priority: 3,
      cell: (_v, d) => {
        const firm = firms.find(f => f.id === d.firmId);
        return <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{d.firmName || firm?.firmName || "—"}</span>;
      },
    },
    {
      id: "dispatchedBy", header: "Dispatched By", accessor: d => d.dispatchedByName ?? "", width: 150, priority: 3,
      cell: (_v, d) => d.dispatchedByName
        ? <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{d.dispatchedByName}</span>
        : <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</span>,
    },
    {
      id: "status", header: "Status", accessor: d => (d.pendingTransport || d.pendingReceipt) ? "incomplete" : "complete", type: "status", width: 160,
      cell: (_v, d) => {
        const incomplete = d.pendingTransport || d.pendingReceipt;
        return incomplete ? (
          <Button
            onClick={() => onResume(d)}
            variant="secondary"
            size="sm"
            iconLeft={Clock}
            className="rounded-full bg-[rgba(200,155,71,0.14)] border-[rgba(200,155,71,0.32)] text-[#8B6018] hover:bg-[rgba(200,155,71,0.22)] whitespace-nowrap"
          >
            Complete Details
          </Button>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.green, whiteSpace: "nowrap" }}>
            <CheckCircle2 size={13} /> Complete
          </span>
        );
      },
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions", width: 110, exportable: false,
      cell: (_v, d) => (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {d.type === "wholesale" && d.customerId && (
            <button
              onClick={() => setEditingCustomerId(d.customerId!)}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.luxuryBrown }}
              title="Edit Customer Details"
            >
              <Pencil size={16} />
            </button>
          )}
          {onViewInvoice && (
            <button
              onClick={() => onViewInvoice(d)}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.luxuryBrown }}
              title={d.type === "shop" ? "Delivery challan" : "Tax invoice"}
              aria-label={d.type === "shop" ? `View delivery challan ${challanReference(d)}` : `View tax invoice ${d.invoiceNumber ?? ""}`.trim()}
            >
              <FileText size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this dispatch? The sarees will be returned to 'Ready for Dispatch'.")) {
                  onDelete(d);
                }
              }}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.royalBurgundy }}
              title="Delete Dispatch"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div id="dispatch-history-table" style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      {editingCustomer && (
        <EditWholesaleCustomerModal customer={editingCustomer} onClose={() => setEditingCustomerId(null)} />
      )}

      {/* View Switcher Segment — matching SectionC.tsx (Mobile Only) */}
      <div className="md:hidden p-3">
        <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 inline-flex">
          <Button
            type="button"
            onClick={() => setView("card")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3.5 text-[12px] font-bold ${
              view === "card"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <LayoutGrid size={14} /> Card View
          </Button>
          <Button
            type="button"
            onClick={() => setView("table")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3.5 text-[12px] font-bold ${
              view === "table"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <LayoutList size={14} /> Table View
          </Button>
        </div>
      </div>

      {/* Mobile Card View */}
      {view === "card" && (
        <div className="md:hidden flex flex-col gap-4 p-4">
          {pag.pageItems.map(d => {
            const incomplete = d.pendingTransport || d.pendingReceipt;
            const firm = firms.find(f => f.id === d.firmId);
            const displayDate = formatDateStr(d.dispatchDate);
            return (
              <div key={d.id} style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>
                      {d.type === "wholesale" ? (d.customerName ?? "Wholesale Customer") : "Shop / Showroom"}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{displayDate}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: d.type === "wholesale" ? "rgba(110,15,45,0.08)" : "rgba(200,146,58,0.14)", color: d.type === "wholesale" ? T.royalBurgundy : "#8B6018", border: `1px solid ${d.type === "wholesale" ? "rgba(110,15,45,0.18)" : "rgba(200,146,58,0.32)"}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 700, textTransform: "capitalize" as const }}>
                    {d.type === "wholesale" ? <Users size={12} /> : <ShoppingBag size={12} />}{d.type}
                  </span>
                </div>

                {/* 2-Column Info Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 12px", background: "rgba(110,15,45,0.03)", borderRadius: 10, border: `1px solid ${T.borderDef}` }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" }}>LR / Transport</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, marginTop: 2 }}>{d.lrNumber || "—"}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{d.transportCompany || "—"}</div>
                  </div>

                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" }}>Sarees & Firm</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{d.sareeIds.length} saree{d.sareeIds.length === 1 ? "" : "s"}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{d.firmName || firm?.firmName || "—"}</div>
                  </div>

                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" }}>Dispatched By</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{d.dispatchedByName || "—"}</div>
                  </div>
                </div>

                {/* Action Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderTop: `1px solid ${T.borderDef}`, paddingTop: 10 }}>
                  <div>
                    {incomplete ? (
                      <Button
                        onClick={() => onResume(d)}
                        variant="secondary"
                        size="sm"
                        iconLeft={Clock}
                        className="rounded-full bg-[rgba(200,155,71,0.14)] border-[rgba(200,155,71,0.32)] text-[#8B6018] hover:bg-[rgba(200,155,71,0.22)] text-xs"
                      >
                        Complete Details
                      </Button>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.green }}>
                        <CheckCircle2 size={13} /> Complete
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {d.type === "wholesale" && d.customerId && (
                      <button
                        onClick={() => setEditingCustomerId(d.customerId!)}
                        style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: F.ui }}
                        title="Edit Customer Details"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {onViewInvoice && (
                      <button
                        onClick={() => onViewInvoice(d)}
                        style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: F.ui }}
                        title={d.type === "shop" ? "Delivery challan" : "Tax invoice"}
                        aria-label={d.type === "shop" ? `View delivery challan ${challanReference(d)}` : `View tax invoice ${d.invoiceNumber ?? ""}`.trim()}
                      >
                        <FileText size={15} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this dispatch? The sarees will be returned to 'Ready for Dispatch'.")) {
                            onDelete(d);
                          }
                        }}
                        style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.royalBurgundy, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: F.ui }}
                        title="Delete Dispatch"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && <LoadingState variant="skeleton" rows={4} />}
          {!isLoading && isError && <ErrorState error={error} onRetry={refetch} />}
          {!isLoading && !isError && pag.pageItems.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>
              No dispatches yet.
            </div>
          )}
        </div>
      )}

      {/* Table View (Mobile Table mode or Desktop default) */}
      <div className={view === "table" ? "w-full overflow-x-auto section-nav-scroll" : "hidden md:block w-full overflow-x-auto section-nav-scroll"}>
        <div className="min-w-[1080px]">
          <DataTable
            responsive={false}
            columns={columns}
            data={pag.pageItems}
            getRowId={d => d.id}
            loading={isLoading}
            error={isError}
            onRetry={refetch}
            emptyTitle="No dispatches yet."
            pagination={false}
          />
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ padding: "0 14px" }}>
          <Pagination
            targetId="dispatch-history-table"
            page={pag.page}
            pageCount={pag.pageCount}
            total={pag.total}
            pageSize={pag.pageSize}
            start={pag.start}
            onPageChange={pag.setPage}
            onPageSizeChange={pag.setPageSize}
            itemLabel="dispatches"
          />
        </div>
      )}
    </div>
  );
}
