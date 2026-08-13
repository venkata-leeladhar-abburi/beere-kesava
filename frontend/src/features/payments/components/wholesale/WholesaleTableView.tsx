import React from "react";
import { Eye, MapPin } from "lucide-react";
import { F, T } from "../../theme";
import { Invoice } from "../../types";
import { INV_STATUS_CFG, InvBadge } from "./InvBadge";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

interface WholesaleTableViewProps {
  view: "list" | "table";
  filtered: Invoice[];
  setViewInvoice: (inv: Invoice) => void;
  setRecordPayment: (inv: Invoice) => void;
}

export function WholesaleTableView({ view, filtered, setViewInvoice, setRecordPayment }: WholesaleTableViewProps) {
  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.7px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "14px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

  if (view === "list") {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32, boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
        {filtered.map((inv, i) => {
          const rem = inv.total - inv.paid;
          return (
            <div
              key={inv.id}
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                background: i % 2 === 0 ? "#FFFDF9" : T.silkCream,
                borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderDef}` : "none",
                borderLeft: `4px solid ${INV_STATUS_CFG[inv.status].color}`,
                transition: "background-color 0.15s ease",
              }}
            >
              <div style={{ flex: "0 0 130px" }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{inv.id}</span>
              </div>
              <div style={{ flex: "0 0 230px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{inv.customer}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                  <MapPin size={12} />{inv.city}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice Total</div>
                <div style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown, fontWeight: 700 }}><Money value={rupees(inv.total)} /></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Remaining Due</div>
                <div style={{ fontFamily: F.mono, fontSize: 13, color: rem === 0 ? T.green : T.crimson, fontWeight: 700 }}>
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
    );
  }

  const columns: ColumnDef<Invoice>[] = [
    {
      id: "id", header: "Invoice ID", accessor: inv => inv.id,
      cell: (_v, inv) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{inv.id}</span>,
    },
    {
      id: "customer", header: "Customer", accessor: inv => inv.customer, priority: 1,
      cell: (_v, inv) => <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{inv.customer}</span>,
    },
    {
      id: "city", header: "City", accessor: inv => inv.city, priority: 3,
      cell: (_v, inv) => (
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.taupe, fontSize: 13 }}>
          <MapPin size={12} />{inv.city}
        </div>
      ),
    },
    {
      id: "invoiceDate", header: "Invoice Date", accessor: inv => inv.invoiceDate, priority: 3,
      cell: (_v, inv) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{inv.invoiceDate}</span>,
    },
    {
      id: "dueDate", header: "Due Date", accessor: inv => inv.dueDate,
      cell: (_v, inv) => (
        <span style={{ fontFamily: F.ui, fontSize: 13, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 400 }}>
          {inv.dueDate}
          {inv.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 12, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 5 }}>{inv.daysOverdue}d late</span>}
        </span>
      ),
    },
    {
      id: "total", header: "Total Amount", accessor: inv => inv.total, align: "end",
      cell: (_v, inv) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}><Money value={rupees(inv.total)} /></span>,
    },
    {
      id: "paid", header: "Paid Amount", accessor: inv => inv.paid, align: "end", priority: 3,
      cell: (_v, inv) => <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 13, color: T.green }}><Money value={rupees(inv.paid)} /></span>,
    },
    {
      id: "remaining", header: "Remaining Due", accessor: inv => inv.total - inv.paid, align: "end",
      cell: (_v, inv) => {
        const rem = inv.total - inv.paid;
        return (
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: rem === 0 ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold }}>
            {rem === 0 ? "Paid ✓" : <Money value={rupees(rem)} />}
          </span>
        );
      },
    },
    {
      id: "status", header: "Status", accessor: inv => inv.status, align: "center", type: "status",
      cell: (_v, inv) => <InvBadge status={inv.status} />,
    },
    {
      id: "action", header: "Action", accessor: () => null, align: "center", type: "actions",
      cell: (_v, inv) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
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
      <div style={{ overflowX: "auto", minWidth: 860 }}>
        <DataTable
          responsive
          columns={columns}
          data={filtered}
          getRowId={inv => inv.id}
          emptyTitle="No invoices match your filters"
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.warmCream, borderTop: `2px solid ${T.borderDef}`, padding: "13px 16px", flexWrap: "wrap" as const, gap: 8 }}>
        <span style={{ fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, fontSize: 13 }}>
          Totals — {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>
            <Money value={rupees(filtered.reduce((s, inv) => s + inv.total, 0))} />
          </span>
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: T.green }}>
            <Money value={rupees(filtered.reduce((s, inv) => s + inv.paid, 0))} />
          </span>
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.crimson }}>
            <Money value={rupees(filtered.reduce((s, inv) => s + (inv.total - inv.paid), 0))} />
          </span>
        </div>
      </div>
    </div>
  );
}
