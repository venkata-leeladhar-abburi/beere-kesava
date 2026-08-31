/**
 * Column definitions for the Shop Staff report tables.
 * ═══════════════════════════════════════════════════════════════════════════
 * One source of truth for three things at once: the desktop <DataTable>, its
 * `< md` card fallback, and `exportTable()` — so a column added here shows up
 * in the table, on the mobile card, and in the exported spreadsheet.
 *
 * `priority` drives the card fallback: 1 is the card title (exactly one
 * column), 2 becomes a label/value pair, 3 is hidden on small screens.
 */
import { C, Chip } from "./theme";
import type { ColumnDef } from "../../../../shared/ui/data";
import type { SalesReportRow, ReturnReportRow } from "./salesReportModel";

export function salesReportColumns(canSeePrices: boolean): ColumnDef<SalesReportRow>[] {
  // Every column is sortable, which also keeps the header row visually
  // consistent — DataTable renders a sortable header inside a <button> and a
  // plain one as bare text, and the two pick up different letter casing.
  return [
    {
      id: "sno", header: "S.No.", accessor: () => "", type: "number", width: 70, sortable: false, priority: 3,
      cell: (_v, _r, index) => <span style={{ fontFamily: "var(--font-ui)", color: "var(--text-tertiary)" }}>{index + 1}</span>
    },
    { id: "saree", header: "Saree ID", accessor: r => r.sareeId, type: "code", width: 210, sortable: true, priority: 1 },
    { id: "date", header: "Date & Time", accessor: r => new Date(r.date), type: "datetime", width: 215, sortable: true, priority: 2 },
    { id: "customer", header: "Customer", accessor: r => r.customer, type: "text", sortable: true, priority: 2 },
    {
      id: "channel", header: "Channel", accessor: r => r.design, type: "text", width: 130, sortable: true, priority: 2,
      cell: (_v, r) => (
        <Chip
          label={r.design}
          color={r.channel === "RETAIL" ? C.green : C.gold}
          bg={r.channel === "RETAIL" ? "rgba(30,102,64,0.10)" : "rgba(200,155,71,0.14)"}
        />
      ),
    },
    { id: "pay", header: "Payment", accessor: r => r.pay, type: "text", width: 140, sortable: true, priority: 2 },
    { id: "soldBy", header: "Sold by", accessor: r => r.soldBy, type: "text", width: 160, sortable: true, priority: 3 },
    ...(canSeePrices
      ? [{ id: "amount", header: "Amount", accessor: (r: SalesReportRow) => r.amount, type: "currency" as const, width: 150, sortable: true, priority: 2 as const }]
      : []),
  ];
}

export function returnReportColumns(canSeePrices: boolean): ColumnDef<ReturnReportRow>[] {
  // Every column is sortable, which also keeps the header row visually
  // consistent — DataTable renders a sortable header inside a <button> and a
  // plain one as bare text, and the two pick up different letter casing.
  return [
    {
      id: "sno", header: "S.No.", accessor: () => "", type: "number", width: 70, sortable: false, priority: 3,
      cell: (_v, _r, index) => <span style={{ fontFamily: "var(--font-ui)", color: "var(--text-tertiary)" }}>{index + 1}</span>
    },
    { id: "saree", header: "Saree ID", accessor: r => r.sareeId, type: "code", width: 210, sortable: true, priority: 1 },
    { id: "date", header: "Date", accessor: r => new Date(r.date), type: "date", width: 170, sortable: true, priority: 2 },
    { id: "reason", header: "Reason", accessor: r => r.reason, type: "text", sortable: true, priority: 2 },
    ...(canSeePrices
      ? [{ id: "amount", header: "Refund", accessor: (r: ReturnReportRow) => r.amount, type: "currency" as const, width: 150, sortable: true, priority: 2 as const }]
      : []),
  ];
}
