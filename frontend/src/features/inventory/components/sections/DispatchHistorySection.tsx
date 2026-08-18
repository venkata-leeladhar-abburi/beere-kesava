import React, { useState, useMemo } from "react";
import { Truck, Users, ShoppingBag, Clock, CheckCircle2, Trash2, FileText, Pencil, LayoutGrid, LayoutList } from "lucide-react";
import { DispatchRecord } from "@/features/finishing";
import { useCustomers } from "@/features/customers";
import { T, F } from "../theme";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { SectionCard } from "../common/primitives";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { EntityCode } from "@/shared/ui/domain";
import { EditWholesaleCustomerModal } from "../modals/EditWholesaleCustomerModal";

// ── Dispatch History section ──────────────────────────────────────────────────
// Exported for the Worker Staff portal — same component, same markup, so the two
// screens cannot fall out of step.
export function DispatchHistorySection({ dispatches, firms, onResume, onDelete, onViewInvoice }: { dispatches: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void; onDelete?: (d: DispatchRecord) => void; onViewInvoice?: (d: DispatchRecord) => void; }) {
  const [tab, setTab] = useState<"all" | "shop" | "wholesale">("all");
  const rows = useMemo(() =>
    [...dispatches]
      .filter(d => tab === "all" || d.type === tab)
      .sort((a, b) => (b.id > a.id ? 1 : -1)),
  [dispatches, tab]);

  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: dispatches.reduce((acc, d) => acc + d.sareeIds.length, 0) },
    { key: "shop",      label: "To Shop",   count: dispatches.filter(d => d.type === "shop").reduce((acc, d) => acc + d.sareeIds.length, 0) },
    { key: "wholesale", label: "Wholesale", count: dispatches.filter(d => d.type === "wholesale").reduce((acc, d) => acc + d.sareeIds.length, 0) },
  ];

  return (
    <SectionCard
      icon={Truck}
      title="Dispatch History"
      subtitle="Every dispatch sent out to shops and wholesale customers."
      actions={
        <div style={{ display: "flex", gap: 6, alignItems: "center" }} className="shrink-0 min-w-max">
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
        </div>
      }
    >
      <DataTableBody rows={rows} firms={firms} onResume={onResume} onDelete={onDelete} onViewInvoice={onViewInvoice} />
    </SectionCard>
  );
}

function DataTableBody({ rows, firms, onResume, onDelete, onViewInvoice }: { rows: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void; onDelete?: (d: DispatchRecord) => void; onViewInvoice?: (d: DispatchRecord) => void; }) {
  const [view, setView] = useState<"card" | "table">("card");
  const pag = usePagination(rows, 25);
  const { customers } = useCustomers();
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const editingCustomer = editingCustomerId ? customers.find(c => c.id === editingCustomerId) ?? null : null;
  const columns: ColumnDef<DispatchRecord>[] = [
    {
      id: "date", header: "Date", accessor: d => d.dispatchDate, width: 110,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontVariantNumeric: "tabular-nums" }}>{d.dispatchDate}</span>,
    },
    {
      id: "type", header: "Type", accessor: d => d.type, width: 90,
      cell: (_v, d) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: d.type === "wholesale" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.14)", color: d.type === "wholesale" ? T.royalBurgundy : "#8B6018", border: `1px solid ${d.type === "wholesale" ? "rgba(110,15,45,0.18)" : "rgba(200,155,71,0.32)"}`, borderRadius: 999, padding: "2px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const }}>
          {d.type === "wholesale" ? <Users size={10} /> : <ShoppingBag size={10} />}{d.type}
        </span>
      ),
    },
    {
      id: "destination", header: "Destination", accessor: d => d.customerName ?? "", priority: 1,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{d.type === "wholesale" ? (d.customerName ?? "—") : "Shop / Showroom"}</span>,
    },
    {
      id: "lr", header: "LR / Transport", accessor: d => d.lrNumber, width: 130, priority: 3,
      cell: (_v, d) => (
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontVariantNumeric: "tabular-nums" }}>{d.lrNumber || "—"}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{d.transportCompany || "—"}</div>
        </div>
      ),
    },
    {
      id: "invoice", header: "Invoice", accessor: d => d.invoiceNumber, width: 100, priority: 3,
      cell: (_v, d) => d.invoiceNumber
        ? <EntityCode type="invoice" value={d.invoiceNumber} />
        : <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</span>,
    },
    {
      id: "sarees", header: "Sarees", accessor: d => d.sareeIds.length, type: "number", width: 80,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, fontVariantNumeric: "tabular-nums" }}>{d.sareeIds.length}</span>,
    },
    {
      id: "firm", header: "Firm", accessor: d => d.firmName, width: 110, priority: 3,
      cell: (_v, d) => {
        const firm = firms.find(f => f.id === d.firmId);
        return <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.firmName || firm?.firmName || "—"}</span>;
      },
    },
    {
      id: "status", header: "Status", accessor: d => (d.pendingTransport || d.pendingReceipt) ? "incomplete" : "complete", type: "status", width: 130,
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.green }}>
            <CheckCircle2 size={12} /> Complete
          </span>
        );
      },
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions", width: 130, exportable: false,
      cell: (_v, d) => (
        <div style={{ display: "flex", gap: 8 }}>
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
              title="Invoice"
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
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      {editingCustomer && (
        <EditWholesaleCustomerModal customer={editingCustomer} onClose={() => setEditingCustomerId(null)} />
      )}

      {/* Mobile View Switcher */}
      <div className="md:hidden flex justify-end p-3 bg-[#FAFAF8] border-b border-[#E8E2D9]">
        <div style={{ display: "inline-flex", alignItems: "center", background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 999, padding: 3, gap: 2 }}>
          <button
            type="button"
            onClick={() => setView("card")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
              fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              background: view === "card" ? "#6E0F2D" : "transparent",
              color: view === "card" ? "#FFFFFF" : T.taupe,
              border: "none",
              boxShadow: view === "card" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LayoutGrid size={15} color={view === "card" ? "#FFFFFF" : T.taupe} />
            Card View
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
              fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              background: view === "table" ? "#6E0F2D" : "transparent",
              color: view === "table" ? "#FFFFFF" : T.taupe,
              border: "none",
              boxShadow: view === "table" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LayoutList size={15} color={view === "table" ? "#FFFFFF" : T.taupe} />
            Table View
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      {view === "card" && (
        <div className="md:hidden flex flex-col gap-4 p-4">
          {pag.pageItems.map(d => {
            const incomplete = d.pendingTransport || d.pendingReceipt;
            const firm = firms.find(f => f.id === d.firmId);
            return (
              <div key={d.id} style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>
                      {d.type === "wholesale" ? (d.customerName ?? "Wholesale Customer") : "Shop / Showroom"}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{d.dispatchDate}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: d.type === "wholesale" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.14)", color: d.type === "wholesale" ? T.royalBurgundy : "#8B6018", border: `1px solid ${d.type === "wholesale" ? "rgba(110,15,45,0.18)" : "rgba(200,155,71,0.32)"}`, borderRadius: 999, padding: "2px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const }}>
                    {d.type === "wholesale" ? <Users size={10} /> : <ShoppingBag size={10} />}{d.type}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontFamily: F.ui }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: T.taupe }}>LR / Transport</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{d.lrNumber || "—"}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{d.transportCompany || "—"}</div>
                    </div>
                  </div>
                  {d.invoiceNumber && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.taupe }}>Invoice</span>
                      <EntityCode type="invoice" value={d.invoiceNumber} />
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: T.taupe }}>Sarees</span>
                    <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{d.sareeIds.length} sarees</span>
                  </div>
                  {(d.firmName || firm?.firmName) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.taupe }}>Firm</span>
                      <span style={{ color: T.taupe }}>{d.firmName || firm?.firmName}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: T.taupe }}>Status</span>
                    {incomplete ? (
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
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.green }}>
                        <CheckCircle2 size={12} /> Complete
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 12, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  {d.type === "wholesale" && d.customerId && (
                    <button
                      onClick={() => setEditingCustomerId(d.customerId!)}
                      style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: F.ui }}
                      title="Edit Customer Details"
                    >
                      <Pencil size={15} /> Edit Customer
                    </button>
                  )}
                  {onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(d)}
                      style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: F.ui }}
                      title="Invoice"
                    >
                      <FileText size={15} /> Invoice
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
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {pag.pageItems.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>
              No dispatches yet.
            </div>
          )}
        </div>
      )}

      {/* Table View (Mobile Table mode or Desktop default) */}
      <div className={view === "table" ? "w-full overflow-x-auto section-nav-scroll" : "hidden md:block w-full overflow-x-auto section-nav-scroll"}>
        <div className="min-w-[850px]">
          <DataTable
            responsive={false}
            columns={columns}
            data={pag.pageItems}
            getRowId={d => d.id}
            emptyTitle="No dispatches yet."
          />
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ padding: "0 14px" }}>
          <Pagination
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
