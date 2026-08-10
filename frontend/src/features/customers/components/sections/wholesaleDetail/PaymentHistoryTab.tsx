import React from "react";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { Money } from "../../../../../shared/ui/domain/Money";
import { StatusPill } from "../../../../../shared/ui/domain";
import { rupees } from "../../../../../lib/domain/money";
import type { StatusValueOf } from "../../../../../lib/domain/status";

interface PaymentRow {
  rec: string;
  date: string;
  utr: string;
  amt: number;
  ded: number;
  status: StatusValueOf<"payment">;
}

const PAYMENTS: PaymentRow[] = [
  { rec: "REC-90821", date: "02 May 2026", utr: "UTR9832104523", amt: 180000, ded: 0, status: "settled" },
  { rec: "REC-90145", date: "15 Apr 2026", utr: "UTR8293108420", amt: 260000, ded: 20000, status: "settled" },
  { rec: "REC-89234", date: "18 Dec 2025", utr: "UTR7489312048", amt: 100000, ded: 5000, status: "settled" },
];

const columns: ColumnDef<PaymentRow>[] = [
  {
    id: "rec", header: "Receipt No", accessor: p => p.rec,
    cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy }}>{p.rec}</span>,
  },
  {
    id: "date", header: "Payment Date", accessor: p => p.date,
    cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{p.date}</span>,
  },
  {
    id: "utr", header: "UTR Number", accessor: p => p.utr,
    cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{p.utr}</span>,
  },
  {
    id: "amt", header: "Amount Paid", accessor: p => p.amt,
    cell: (_v, p) => <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}><Money value={rupees(p.amt)} /></span>,
  },
  {
    id: "ded", header: "Deductions", accessor: p => p.ded,
    cell: (_v, p) => <span style={{ fontFamily: F.display, fontSize: 14, color: T.crimson }}><Money value={rupees(p.ded)} /></span>,
  },
  {
    id: "status", header: "Status", accessor: p => p.status, type: "status",
    cell: (_v, p) => <span style={{ background: T.greenBg, color: T.green, padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{p.status}</span>,
  },
];

export function PaymentHistoryTab({
  wholesalePaymentDateFilter, setWholesalePaymentDateFilter,
}: {
  wholesalePaymentDateFilter: DateFilterState;
  setWholesalePaymentDateFilter: (f: DateFilterState) => void;
}) {
  const filtered = PAYMENTS.filter(p => matchesDateFilter(p.date, wholesalePaymentDateFilter));
  return (
    <div>
      <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, marginBottom: 16 }}>Ledger Payments Received</h3>
      <DateFilterBar filter={wholesalePaymentDateFilter} onChange={setWholesalePaymentDateFilter} />
      <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
        <DataTable columns={columns} data={filtered} getRowId={p => p.rec} />
      </div>
    </div>
  );
}
