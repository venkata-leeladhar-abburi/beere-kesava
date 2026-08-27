import React from "react";
import { Eye, MapPin } from "lucide-react";
import { F, T } from "../../theme";
import { Invoice } from "../../types";
import { INV_STATUS_CFG, InvBadge } from "./InvBadge";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";

interface WholesaleTableViewProps {
  view: "list" | "table";
  filtered: Invoice[];
  setViewInvoice: (inv: Invoice) => void;
  setRecordPayment: (inv: Invoice) => void;
}

export function WholesaleTableView({ view, filtered, setViewInvoice, setRecordPayment }: WholesaleTableViewProps) {
  if (view === "list") {
    return (
      <div className="overflow-x-auto w-full mb-8">
        <div className="min-w-[700px]" style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
        {filtered.map((inv, i) => {
          const rem = inv.total - inv.paid;
          return (
            <div
              key={inv.id}
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderDef}` : "none",
                borderLeft: `4px solid ${INV_STATUS_CFG[inv.status].color}`,
                transition: "background-color 0.15s ease",
              }}
            >
              <div style={{ flex: "0 0 130px" }}>
                <EntityCode type="invoice" value={inv.code} size="sm" />
              </div>
              <div style={{ flex: "0 0 230px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{inv.customer}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                  <MapPin size={12} />{inv.city}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice Total</div>
                <div style={{ fontSize: 14, color: T.luxuryBrown, fontWeight: 700 }}><Money value={rupees(inv.total)} /></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Remaining Due</div>
                <div style={{ fontSize: 13, color: rem === 0 ? T.green : T.crimson, fontWeight: 700 }}>
                  {rem === 0 ? "Paid ✓" : <Money value={rupees(rem)} />}
                </div>
              </div>
              <div style={{ flex: "0 0 130px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 500 }}>{inv.dueDate}</div>
              </div>
              <div style={{ flex: "0 0 150px" }}>
                <InvBadge status={inv.status} />
              </div>
              <Button variant="secondary" size="sm" onClick={() => setViewInvoice(inv)}
                className="rounded-[8px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]">
                View
              </Button>
            </div>
          );
        })}
      </div>
    </div>
    );
  }

  const columns: ColumnDef<Invoice>[] = [
    {
      // Width comes from the cell's own class rather than ColumnDef.width —
      // the two were duplicating the same 320px and the column sizes to its
      // content either way.
      id: "id", header: "Invoice ID", accessor: inv => inv.code,
      cell: (_v, inv) => (
        <div className="w-[320px] min-w-[320px] whitespace-nowrap">
          <EntityCode type="invoice" value={inv.code} size="sm" className="whitespace-nowrap" />
        </div>
      ),
    },
    {
      id: "customer", header: "Customer", accessor: inv => inv.customer, priority: 1, width: 200,
      cell: (_v, inv) => <div className="w-[200px] min-w-[200px] whitespace-nowrap font-semibold text-[#3B2314]">{inv.customer}</div>,
    },
    {
      id: "city", header: "City", accessor: inv => inv.city, priority: 3, width: 140,
      cell: (_v, inv) => (
        <div className="w-[140px] min-w-[140px] whitespace-nowrap flex items-center gap-1.5 text-[13px] text-[#8C7A6B]">
          <MapPin size={12} />{inv.city}
        </div>
      ),
    },
    {
      id: "invoiceDate", header: "Invoice Date", accessor: inv => inv.invoiceDate, priority: 3, width: 130,
      cell: (_v, inv) => <div className="w-[130px] min-w-[130px] whitespace-nowrap text-[13px] text-[#3B2314]">{inv.invoiceDate}</div>,
    },
    {
      id: "dueDate", header: "Due Date", accessor: inv => inv.dueDate, width: 160,
      cell: (_v, inv) => (
        <div className="w-[160px] min-w-[160px] whitespace-nowrap text-[13px]">
          <span style={{ color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 400 }}>
            {inv.dueDate}
            {inv.daysOverdue && <span style={{ fontFamily: F.ui, fontSize: 12, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 5 }}>{inv.daysOverdue}d late</span>}
          </span>
        </div>
      ),
    },
    {
      id: "total", header: "Total Amount", accessor: inv => inv.total, align: "end", width: 140,
      cell: (_v, inv) => <div className="w-[140px] min-w-[140px] whitespace-nowrap text-right font-bold text-[#3B2314]"><Money value={rupees(inv.total)} /></div>,
    },
    {
      id: "paid", header: "Paid Amount", accessor: inv => inv.paid, align: "end", priority: 3, width: 140,
      cell: (_v, inv) => <div className="w-[140px] min-w-[140px] whitespace-nowrap text-right font-semibold text-[#27AE60]"><Money value={rupees(inv.paid)} /></div>,
    },
    {
      id: "remaining", header: "Remaining Due", accessor: inv => inv.total - inv.paid, align: "end", width: 160,
      cell: (_v, inv) => {
        const rem = inv.total - inv.paid;
        return (
          <div className="w-[160px] min-w-[160px] whitespace-nowrap text-right font-bold" style={{ color: rem === 0 ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold }}>
            {rem === 0 ? "Paid ✓" : <Money value={rupees(rem)} />}
          </div>
        );
      },
    },
    {
      id: "status", header: "Status", accessor: inv => inv.status, align: "center", type: "status", width: 260,
      cell: (_v, inv) => <div className="w-[260px] min-w-[260px] whitespace-nowrap flex justify-center"><InvBadge status={inv.status} /></div>,
    },
    {
      id: "action", header: "Action", accessor: () => null, align: "center", type: "actions", width: 170,
      cell: (_v, inv) => (
        <div className="w-[170px] min-w-[170px] flex gap-2 justify-center">
          <Button variant="secondary" size="sm" iconLeft={Eye} onClick={() => setViewInvoice(inv)}
            className="rounded-[8px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]">
            View
          </Button>
          {inv.status !== "Paid" && (
            <Button variant="primary" size="sm" onClick={() => setRecordPayment(inv)}
              className="rounded-[8px] bg-[#6E0F2D] hover:bg-[#4A0A1D]">
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
      <div style={{ overflowX: "auto" }} className="w-full">
        <div className="min-w-[1650px]">
          <DataTable
            responsive={false}
            columns={columns}
            data={filtered}
            getRowId={inv => inv.id}
            emptyTitle="No invoices match your filters"
          />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.warmCream, borderTop: `2px solid ${T.borderDef}`, padding: "13px 16px", flexWrap: "wrap" as const, gap: 8 }}>
        <span style={{ fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, fontSize: 13 }}>
          Totals — {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>
            <Money value={rupees(filtered.reduce((s, inv) => s + inv.total, 0))} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 13, color: T.green }}>
            <Money value={rupees(filtered.reduce((s, inv) => s + inv.paid, 0))} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.crimson }}>
            <Money value={rupees(filtered.reduce((s, inv) => s + (inv.total - inv.paid), 0))} />
          </span>
        </div>
      </div>
    </div>
  );
}
